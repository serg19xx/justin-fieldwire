<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import ProjectScheduleSection from '@/components/projects/ProjectScheduleSection.vue'
import { useAuthStore } from '@/core/stores/auth'
import { projectApi, type Project, type ProjectTeamMember } from '@/core/utils/project-api'
import {
  getProjectListQueryFiltersForUser,
  parseProjectsFromListResponse,
} from '@/core/utils/project-list-for-user'
import { mapApiProjectTeamRowsToRoster } from '@/core/utils/map-api-project-team-response'

const authStore = useAuthStore()

const projects = ref<Project[]>([])
const teamMembers = ref<ProjectTeamMember[]>([])
const isLoadingProjects = ref(true)
const isLoadingTeams = ref(false)
const loadError = ref('')

const canEdit = computed(() => {
  const code = (authStore.currentUser?.role_code || '').toLowerCase()
  return (
    code === 'admin' ||
    code === 'project_manager' ||
    authStore.currentUser?.role_category === 'global'
  )
})

const scheduleProjects = computed(() =>
  projects.value.map((p) => ({
    id: p.id,
    name: (p.prj_name || '').trim() || `Project #${p.id}`,
  })),
)

const defaultProjectId = computed(() => scheduleProjects.value[0]?.id ?? 0)

async function mapPool<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  async function worker(): Promise<void> {
    while (next < items.length) {
      const idx = next++
      results[idx] = await fn(items[idx]!)
    }
  }
  const n = Math.min(Math.max(1, concurrency), Math.max(1, items.length))
  await Promise.all(Array.from({ length: n }, () => worker()))
  return results
}

async function loadProjectsList(): Promise<void> {
  isLoadingProjects.value = true
  loadError.value = ''
  try {
    const filters = getProjectListQueryFiltersForUser(authStore.currentUser)
    const data = await projectApi.getAll(1, 200, filters)
    projects.value = parseProjectsFromListResponse(data)
  } catch (e) {
    console.error('Failed to load projects for schedule', e)
    loadError.value = 'Failed to load projects.'
    projects.value = []
  } finally {
    isLoadingProjects.value = false
  }
}

/** Union of team members across all accessible projects (worker picker). */
async function loadUnionTeamMembers(): Promise<void> {
  if (projects.value.length === 0) {
    teamMembers.value = []
    return
  }
  isLoadingTeams.value = true
  try {
    const rosters = await mapPool(projects.value, 6, async (p) => {
      const teamRes = await projectApi.getTeamMembers(p.id).catch(() => null)
      return mapApiProjectTeamRowsToRoster(teamRes)
    })
    const byUser = new Map<number, ProjectTeamMember>()
    for (const mapped of rosters) {
      for (const m of mapped) {
        const uid = Number(m.user_id)
        if (!Number.isFinite(uid) || uid <= 0) continue
        if (!byUser.has(uid)) byUser.set(uid, m)
      }
    }
    teamMembers.value = [...byUser.values()]
  } catch (e) {
    console.error('Failed to load teams for schedule', e)
    teamMembers.value = []
  } finally {
    isLoadingTeams.value = false
  }
}

onMounted(async () => {
  await loadProjectsList()
  await loadUnionTeamMembers()
})
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <div class="border-b border-gray-200 bg-white">
      <div class="max-w-5xl mx-auto px-4 py-3">
        <h1 class="text-lg font-semibold text-gray-900">Schedule</h1>
        <p class="text-sm text-gray-500">
          Who is on which job site for a full working day. Pick the project in each table row.
          Independent from Tasks.
        </p>
      </div>
    </div>

    <div v-if="loadError" class="max-w-5xl mx-auto px-4 pt-4">
      <div class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
        {{ loadError }}
      </div>
    </div>

    <div
      v-else-if="isLoadingProjects || isLoadingTeams"
      class="flex justify-center py-16"
    >
      <div class="animate-spin w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full" />
    </div>

    <div
      v-else-if="projects.length === 0"
      class="max-w-5xl mx-auto px-4 py-10 text-center text-sm text-gray-500"
    >
      No projects available for scheduling.
    </div>

    <ProjectScheduleSection
      v-else
      :projects="scheduleProjects"
      :default-project-id="defaultProjectId"
      :can-edit="canEdit"
      :team-members="teamMembers"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import ProjectScheduleSection from '@/components/projects/ProjectScheduleSection.vue'
import { useAuthStore } from '@/core/stores/auth'
import { projectApi, type Project, type ProjectTeamMember } from '@/core/utils/project-api'
import {
  getProjectListQueryFiltersForUser,
  parseProjectsFromListResponse,
} from '@/core/utils/project-list-for-user'
import { mapApiProjectTeamRowsToRoster } from '@/core/utils/map-api-project-team-response'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const projects = ref<Project[]>([])
const teamMembers = ref<ProjectTeamMember[]>([])
const isLoadingProjects = ref(true)
const isLoadingProjectData = ref(false)
const loadError = ref('')

const canEdit = computed(() => {
  const code = (authStore.currentUser?.role_code || '').toLowerCase()
  return (
    code === 'admin' ||
    code === 'project_manager' ||
    authStore.currentUser?.role_category === 'global'
  )
})

const selectedProjectId = computed(() => {
  const raw = route.query.projectId
  const id = typeof raw === 'string' ? Number(raw) : 0
  return id > 0 ? id : 0
})

const selectedProject = computed(
  () => projects.value.find((p) => p.id === selectedProjectId.value) ?? null,
)

function projectLabel(p: Project): string {
  return p.prj_name || `Project #${p.id}`
}

function projectAddress(p: Project): string {
  return (p.address || '').trim()
}

function openProjectSchedule(projectId: number): void {
  const query: Record<string, string> = { projectId: String(projectId) }
  const weekStart = route.query.week_start
  if (typeof weekStart === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    query.week_start = weekStart
  }
  void router.push({ path: '/schedule', query })
}

function clearProjectSelection(): void {
  const query: Record<string, string> = {}
  const weekStart = route.query.week_start
  if (typeof weekStart === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    query.week_start = weekStart
  }
  void router.push({ path: '/schedule', query })
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

async function loadSelectedProjectData(projectId: number): Promise<void> {
  if (!projectId) {
    teamMembers.value = []
    return
  }
  isLoadingProjectData.value = true
  try {
    const teamRes = await projectApi.getTeamMembers(projectId).catch(() => null)
    // API may return one row per task assignment — dedupe by user_id for the worker picker
    const mapped = mapApiProjectTeamRowsToRoster(teamRes)
    const byUser = new Map<number, ProjectTeamMember>()
    for (const m of mapped) {
      const uid = Number(m.user_id)
      if (!Number.isFinite(uid) || uid <= 0) continue
      if (!byUser.has(uid)) byUser.set(uid, m)
    }
    teamMembers.value = [...byUser.values()]
  } catch (e) {
    console.error('Failed to load project team for schedule', e)
    teamMembers.value = []
  } finally {
    isLoadingProjectData.value = false
  }
}

watch(
  selectedProjectId,
  (id) => {
    void loadSelectedProjectData(id)
  },
  { immediate: true },
)

onMounted(() => {
  void loadProjectsList()
})
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <div class="border-b border-gray-200 bg-white">
      <div class="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 class="text-lg font-semibold text-gray-900">Schedule</h1>
          <p class="text-sm text-gray-500">
            Who is on which job site (morning / afternoon / all day). Independent from Tasks.
            <span v-if="selectedProject"> · {{ projectLabel(selectedProject) }}</span>
          </p>
          <p v-if="selectedProject && projectAddress(selectedProject)" class="text-xs text-gray-500 mt-0.5">
            {{ projectAddress(selectedProject) }}
          </p>
        </div>
        <button
          v-if="selectedProjectId > 0"
          type="button"
          class="text-sm font-medium text-blue-700 hover:text-blue-900 self-start sm:self-auto"
          @click="clearProjectSelection"
        >
          ← All projects
        </button>
      </div>
    </div>

    <div v-if="loadError" class="max-w-5xl mx-auto px-4 pt-4">
      <div class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
        {{ loadError }}
      </div>
    </div>

    <div v-else-if="isLoadingProjects" class="flex justify-center py-16">
      <div class="animate-spin w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full" />
    </div>

    <div v-else-if="selectedProjectId === 0" class="max-w-5xl mx-auto px-4 py-6">
      <p v-if="projects.length === 0" class="text-sm text-gray-500 text-center py-8">
        No projects available for scheduling.
      </p>
      <ul v-else class="grid gap-2 sm:grid-cols-2">
        <li v-for="p in projects" :key="p.id">
          <button
            type="button"
            class="w-full text-left rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm hover:border-blue-300 hover:bg-blue-50/40 transition"
            @click="openProjectSchedule(p.id)"
          >
            <span class="block text-sm font-semibold text-gray-900 truncate">{{ projectLabel(p) }}</span>
            <span v-if="projectAddress(p)" class="block text-xs text-gray-500 mt-0.5 truncate">{{
              projectAddress(p)
            }}</span>
            <span class="block text-xs text-gray-400 mt-0.5">Open weekly schedule</span>
          </button>
        </li>
      </ul>
    </div>

    <div v-else-if="isLoadingProjectData" class="flex justify-center py-16">
      <div class="animate-spin w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full" />
    </div>

    <template v-else-if="selectedProjectId > 0">
      <p
        v-if="!selectedProject && projects.length > 0"
        class="max-w-5xl mx-auto px-4 pt-4 text-sm text-amber-800"
      >
        Project #{{ selectedProjectId }} is not in your list.
        <RouterLink to="/schedule" class="underline font-medium">Choose another</RouterLink>
      </p>
      <ProjectScheduleSection
        :key="selectedProjectId"
        :project-id="selectedProjectId"
        :can-edit="canEdit"
        :team-members="teamMembers"
      />
    </template>
  </div>
</template>

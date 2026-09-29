<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import PageUserGuideLink from '@/components/PageUserGuideLink.vue'
import ProjectScheduleSection from '@/components/projects/ProjectScheduleSection.vue'
import { useAuthStore } from '@/core/stores/auth'
import { projectApi, type Project, type ProjectTeamMember } from '@/core/utils/project-api'
import {
  getProjectListQueryFiltersForUser,
  parseProjectsFromListResponse,
} from '@/core/utils/project-list-for-user'
import { mapApiProjectTeamRowsToRoster } from '@/core/utils/map-api-project-team-response'
import { hrResourcesApi, type WorkerUser } from '@/core/utils/hr-api'

/** Field roles that can be scheduled even when not on any project team yet. */
const FIELD_STAFF_ROLE_CODES = ['worker', 'foreman'] as const
/** API caps `limit` at 100 per page. */
const WORKERS_PAGE_SIZE = 100
const MAX_WORKERS_PAGES = 10

const authStore = useAuthStore()

const projects = ref<Project[]>([])
const teamMembers = ref<ProjectTeamMember[]>([])
const isLoadingProjects = ref(true)
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
    address: (p.address || '').trim(),
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

/** Team members across all accessible projects. */
async function loadProjectTeamRosters(): Promise<ProjectTeamMember[]> {
  if (projects.value.length === 0) return []
  const rosters = await mapPool(projects.value, 6, async (p) => {
    const teamRes = await projectApi.getTeamMembers(p.id).catch(() => null)
    return mapApiProjectTeamRowsToRoster(teamRes)
  })
  return rosters.flat()
}

function isSchedulableWorker(w: WorkerUser): boolean {
  return Number(w.status) === 1 && !w.archived_at
}

function workerToTeamMember(w: WorkerUser): ProjectTeamMember {
  const name = `${w.first_name ?? ''} ${w.last_name ?? ''}`.trim()
  return {
    id: 0,
    project_id: 0,
    user_id: w.id,
    role_in_project: 'member',
    assigned_at: '',
    name: name || w.email || undefined,
    email: w.email || undefined,
    phone: w.phone || undefined,
    user_type: w.role_code ?? w.role?.code ?? undefined,
    job_title: w.job_title || undefined,
    status: w.status,
    avatar_url: w.avatar_url,
    full_img_url: w.full_img_url,
  }
}

/** Active workers/foremen from the global directory (not limited to project teams). */
async function loadFieldStaff(): Promise<ProjectTeamMember[]> {
  const perRole = await Promise.all(
    FIELD_STAFF_ROLE_CODES.map(async (roleCode) => {
      const out: WorkerUser[] = []
      for (let page = 1; page <= MAX_WORKERS_PAGES; page++) {
        const res: { workers: WorkerUser[]; pagination: { last_page: number } } =
          await hrResourcesApi.getAllWorkerUsers(page, WORKERS_PAGE_SIZE, {
            role_code: roleCode,
            fields: 'list',
          })
        out.push(...res.workers)
        if (page >= Number(res.pagination?.last_page ?? 1)) break
      }
      return out
    }),
  )
  return perRole.flat().filter(isSchedulableWorker).map(workerToTeamMember)
}

/** Worker picker: project team members plus all active field staff, deduped by user. */
async function loadWorkerPickerMembers(): Promise<boolean> {
  const [teamResult, staffResult] = await Promise.allSettled([
    loadProjectTeamRosters(),
    loadFieldStaff(),
  ])
  if (teamResult.status === 'rejected') {
    console.error('Failed to load teams for schedule', teamResult.reason)
  }
  if (staffResult.status === 'rejected') {
    console.error('Failed to load field staff for schedule', staffResult.reason)
  }
  const byUser = new Map<number, ProjectTeamMember>()
  const all = [
    ...(teamResult.status === 'fulfilled' ? teamResult.value : []),
    ...(staffResult.status === 'fulfilled' ? staffResult.value : []),
  ]
  for (const m of all) {
    const uid = Number(m.user_id)
    if (!Number.isFinite(uid) || uid <= 0) continue
    if (!byUser.has(uid)) byUser.set(uid, m)
  }
  teamMembers.value = [...byUser.values()]
  return teamResult.status === 'fulfilled' && staffResult.status === 'fulfilled'
}

const WORKER_PICKER_RETRY_DELAYS_MS = [2000, 5000, 10000]

async function loadWorkerPickerMembersWithRetry(): Promise<void> {
  if (await loadWorkerPickerMembers()) return
  for (const delayMs of WORKER_PICKER_RETRY_DELAYS_MS) {
    await new Promise((resolve) => setTimeout(resolve, delayMs))
    if (await loadWorkerPickerMembers()) return
  }
}

onMounted(async () => {
  await loadProjectsList()
  // Render the schedule right away; the worker picker fills in when rosters arrive.
  void loadWorkerPickerMembersWithRetry()
})
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <div class="border-b border-gray-200 bg-white">
      <div class="max-w-6xl mx-auto px-4 py-3">
        <h1 class="text-lg font-semibold text-gray-900">Schedule</h1>
        <p class="mt-1">
          <PageUserGuideLink
            href="/CLIENT_SCHEDULE_AND_WORKER_TIMESHEET_GUIDE.html"
            label="Testing guide (Schedule &amp; worker Hours)"
          />
        </p>
        <p class="mt-2 text-sm text-gray-500">
          Assign each worker a jobsite destination per day (Week, Month, or Custom period).
          Expected times are planned here; Act start/end come from phone clock-in. Footer sums actual hours.
        </p>
        <p class="mt-2 text-sm">
          <RouterLink
            to="/schedule/work-plan"
            class="font-medium text-blue-700 hover:text-blue-800 underline-offset-2 hover:underline"
          >
            Open work plan from tasks (read-only)
          </RouterLink>
          <span class="text-gray-500">
            — Excel-like task view for reporting. Day timesheet stays here.
          </span>
        </p>
      </div>
    </div>

    <div v-if="loadError" class="max-w-6xl mx-auto px-4 pt-4">
      <div class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
        {{ loadError }}
      </div>
    </div>

    <div
      v-else-if="isLoadingProjects"
      class="flex justify-center py-16"
    >
      <div class="animate-spin w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full" />
    </div>

    <div
      v-else-if="projects.length === 0"
      class="max-w-6xl mx-auto px-4 py-10 text-center text-sm text-gray-500"
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

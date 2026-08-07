<template>
  <div class="px-4 py-4 max-w-lg mx-auto">
    <header class="mb-4">
      <h1 class="text-xl font-semibold text-gray-900">My work</h1>
      <p class="text-sm text-gray-500 mt-1">
        Projects and tasks from the plan (Gantt) for the selected day. Actual hours live on
        Timesheet; PM payroll clock-in is on Schedule.
      </p>
    </header>

    <TaskWorkDayPicker v-model="workYmd" class="mb-4" :disabled="isLoading" />

    <div
      class="mb-4 flex rounded-lg border border-gray-200 p-1 bg-gray-50"
      role="tablist"
      aria-label="Project lifecycle"
    >
      <button
        v-for="tab in projectTabs"
        :key="tab.id"
        type="button"
        role="tab"
        :aria-selected="projectBucket === tab.id"
        class="flex-1 rounded-md py-2 px-1 text-xs sm:text-sm font-medium transition-colors leading-tight"
        :class="projectBucket === tab.id ? 'bg-white text-orange-700 shadow-sm' : 'text-gray-600'"
        @click="projectBucket = tab.id"
      >
        {{ tab.label }}
        <span
          v-if="tab.count > 0"
          class="ml-0.5 tabular-nums"
          :class="projectBucket === tab.id ? 'text-orange-600' : 'text-gray-400'"
        >
          ({{ tab.count }})
        </span>
      </button>
    </div>

    <div v-if="isLoading" class="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <div class="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto" />
      <p class="text-sm text-gray-500 mt-3">Loading day…</p>
    </div>

    <div v-else-if="loadError" class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      {{ loadError }}
    </div>

    <div
      v-else-if="visibleSites.length === 0"
      class="bg-white rounded-xl border border-gray-200 border-dashed p-8 text-center"
    >
      <p class="text-gray-600 text-sm">{{ emptyMessage }}</p>
    </div>

    <ul v-else class="space-y-3">
      <li v-for="site in visibleSites" :key="site.projectId">
        <RouterLink
          :to="projectLink(site.projectId)"
          class="block bg-white rounded-xl shadow-sm border border-gray-200 p-4 active:bg-orange-50"
        >
          <div class="flex justify-between items-start gap-2">
            <div class="min-w-0 flex-1">
              <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Site</p>
              <span class="font-medium text-gray-900 truncate block">{{ site.projectName }}</span>
            </div>
            <span
              class="flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full"
              :class="site.badgeClass"
            >
              {{ site.badgeLabel }}
            </span>
          </div>
          <p v-if="site.address" class="text-xs text-gray-500 mt-1 truncate">{{ site.address }}</p>
          <p class="text-xs text-orange-700 mt-2 font-medium">
            {{ site.taskCount }} task{{ site.taskCount === 1 ? '' : 's' }} on {{ dayLabel }} →
          </p>
        </RouterLink>
      </li>
    </ul>

    <p class="mt-4 text-xs text-gray-500 text-center space-y-1">
      <span class="block">
        <RouterLink to="/tasks/timesheet" class="font-medium text-orange-700 hover:underline">
          Open Timesheet
        </RouterLink>
        — actual hours from tasks (read-only).
      </span>
      <span class="block">
        <RouterLink to="/tasks/schedule" class="font-medium text-blue-700 hover:underline">
          Open Schedule
        </RouterLink>
        — clock in/out for pay on days your PM assigned.
      </span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import TaskWorkDayPicker from '@/components/task-role/TaskWorkDayPicker.vue'
import { useAuthStore } from '@/core/stores/auth'
import type { Project } from '@/core/utils/project-api'
import { fetchProjectsForTaskScope } from '@/core/utils/project-list-for-user'
import {
  getTaskRoleProjectListBucket,
  PROJECT_SYS_STATUS_LABELS,
  resolveProjectSysStatus,
  type TaskRoleProjectBucket,
} from '@/core/utils/project-sys-status'
import { resolveSessionUserId } from '@/core/utils/session-user-id'
import { filterTasksForInvolvedUser } from '@/core/utils/task-role-ux'
import { tasksApi } from '@/core/utils/tasks-api'
import {
  formatWorkYmdLabel,
  parseWorkYmd,
  taskCoversWorkYmd,
  todayWorkYmd,
} from '@/core/utils/work-day'

interface DaySiteRow {
  projectId: number
  projectName: string
  address: string
  taskCount: number
  badgeLabel: string
  badgeClass: string
  bucket: Exclude<TaskRoleProjectBucket, 'hidden'>
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const workYmd = ref(parseWorkYmd(route.query.workDate) ?? todayWorkYmd())
const isLoading = ref(true)
const loadError = ref('')
const allProjects = ref<Project[]>([])
const taskCountByProject = ref<Record<number, number>>({})
const projectBucket = ref<Exclude<TaskRoleProjectBucket, 'hidden'>>('in_work')

const dayLabel = computed(() => formatWorkYmdLabel(workYmd.value))

const daySites = computed((): DaySiteRow[] => {
  const counts = taskCountByProject.value
  const out: DaySiteRow[] = []
  for (const p of allProjects.value) {
    const n = counts[p.id] ?? 0
    if (n <= 0) continue
    const bucket = getTaskRoleProjectListBucket(p)
    if (bucket === 'hidden') continue
    const sys = resolveProjectSysStatus(p)
    let badgeClass = 'bg-gray-100 text-gray-700'
    if (sys === 'active') badgeClass = 'bg-green-100 text-green-800'
    else if (sys === 'closing') badgeClass = 'bg-amber-100 text-amber-800'
    else if (sys === 'done') badgeClass = 'bg-gray-100 text-gray-600'
    out.push({
      projectId: p.id,
      projectName: (p.prj_name || '').trim() || `Project #${p.id}`,
      address: (p.address || '').trim(),
      taskCount: n,
      badgeLabel: PROJECT_SYS_STATUS_LABELS[sys],
      badgeClass,
      bucket: bucket === 'archived' ? 'archived' : 'in_work',
    })
  }
  return out.sort((a, b) => a.projectName.localeCompare(b.projectName))
})

const inWorkSites = computed(() => daySites.value.filter((s) => s.bucket === 'in_work'))
const archivedSites = computed(() => daySites.value.filter((s) => s.bucket === 'archived'))

const projectTabs = computed(() => [
  { id: 'in_work' as const, label: 'In work', count: inWorkSites.value.length },
  { id: 'archived' as const, label: 'Closed', count: archivedSites.value.length },
])

const visibleSites = computed(() =>
  projectBucket.value === 'in_work' ? inWorkSites.value : archivedSites.value,
)

const emptyMessage = computed(() => {
  if (daySites.value.length === 0) {
    return `No planned tasks cover ${dayLabel.value}. Pick another day or check the Gantt plan.`
  }
  return projectBucket.value === 'in_work'
    ? 'No in-work projects with tasks on this day.'
    : 'No closed projects with tasks on this day.'
})

function projectLink(projectId: number): string {
  return `/tasks/projects/${projectId}?workDate=${encodeURIComponent(workYmd.value)}`
}

async function loadDay(): Promise<void> {
  const day = parseWorkYmd(workYmd.value) ?? todayWorkYmd()
  workYmd.value = day
  isLoading.value = true
  loadError.value = ''
  taskCountByProject.value = {}
  try {
    const list = await fetchProjectsForTaskScope(authStore.currentUser, { page: 1, limit: 100 })
    allProjects.value = list.filter((p) => getTaskRoleProjectListBucket(p) !== 'hidden')
    const uid = resolveSessionUserId(authStore.currentUser)
    const counts: Record<number, number> = {}
    await Promise.all(
      allProjects.value.map(async (p) => {
        try {
          const res = await tasksApi.getAll(p.id, 1, 500)
          let tasks = res.tasks ?? []
          if (uid != null) tasks = filterTasksForInvolvedUser(tasks, uid)
          counts[p.id] = tasks.filter((t) => taskCoversWorkYmd(t, day)).length
        } catch {
          counts[p.id] = 0
        }
      }),
    )
    taskCountByProject.value = counts
    if (inWorkSites.value.length > 0) projectBucket.value = 'in_work'
    else if (archivedSites.value.length > 0) projectBucket.value = 'archived'
  } catch {
    loadError.value = 'Could not load projects for this day.'
    allProjects.value = []
  } finally {
    isLoading.value = false
  }
}

watch(
  workYmd,
  (day) => {
    const parsed = parseWorkYmd(day) ?? todayWorkYmd()
    if (String(route.query.workDate ?? '') !== parsed) {
      void router.replace({ query: { ...route.query, workDate: parsed } })
    }
    void loadDay()
  },
  { immediate: true },
)

watch(
  () => route.query.workDate,
  (q) => {
    const parsed = parseWorkYmd(q)
    if (parsed && parsed !== workYmd.value) workYmd.value = parsed
  },
)
</script>

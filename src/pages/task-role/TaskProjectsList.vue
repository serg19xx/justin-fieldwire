<template>
  <div class="px-4 py-4 max-w-lg mx-auto">
    <header class="mb-4">
      <h1 class="text-xl font-semibold text-gray-900">My work</h1>
      <p class="text-sm text-gray-500 mt-1">
        Projects with your tasks from the plan (Gantt). Open a project to see its task list.
      </p>
    </header>

    <section
      v-if="!isLoading && dayPmNotes.length > 0"
      class="mb-4 space-y-2"
      aria-label="Notes from PM for today"
    >
      <p class="text-xs font-semibold uppercase tracking-wide text-amber-900/80">Notes from PM</p>
      <div
        v-for="note in dayPmNotes"
        :key="`${note.projectId}-${note.entryId}`"
        class="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5"
      >
        <p class="text-xs font-medium text-amber-950 truncate">{{ note.projectName }}</p>
        <p class="mt-1 text-sm text-gray-900 whitespace-pre-wrap break-words">{{ note.text }}</p>
      </div>
    </section>

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
      <p class="text-sm text-gray-500 mt-3">Loading projects…</p>
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
          <p
            v-if="pmNoteForProject(site.projectId)"
            class="mt-2 text-xs text-gray-800 whitespace-pre-wrap break-words rounded-md bg-amber-50 border border-amber-100 px-2 py-1.5"
            @click.prevent
          >
            <span class="block text-[10px] font-semibold uppercase tracking-wide text-amber-900/80 mb-0.5"
              >Note from PM</span
            >
            {{ pmNoteForProject(site.projectId) }}
          </p>
          <p class="text-xs text-orange-700 mt-2 font-medium">
            <template v-if="site.openCount > 0">
              {{ site.openCount }} open task{{ site.openCount === 1 ? '' : 's' }} →
            </template>
            <template v-else>All tasks closed →</template>
          </p>
        </RouterLink>
      </li>
    </ul>

    <p class="mt-4 text-xs text-gray-500 text-center space-y-1">
      <span class="block">
        <RouterLink to="/tasks/timesheet" class="font-medium text-orange-700 hover:underline">
          Open Timesheet
        </RouterLink>
        — start and end your work day.
      </span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
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
import { filterTasksForInvolvedUser, getTaskRoleStatusBucket } from '@/core/utils/task-role-ux'
import { tasksApi } from '@/core/utils/tasks-api'
import { fetchMySchedule } from '@/core/utils/schedule-weeks-api'
import { todayWorkYmd } from '@/core/utils/work-day'

interface SiteRow {
  projectId: number
  projectName: string
  address: string
  openCount: number
  badgeLabel: string
  badgeClass: string
  bucket: Exclude<TaskRoleProjectBucket, 'hidden'>
}

interface ProjectTaskCounts {
  total: number
  open: number
}

interface DayPmNote {
  entryId: number
  projectId: number
  projectName: string
  text: string
}

const authStore = useAuthStore()

const isLoading = ref(true)
const loadError = ref('')
const allProjects = ref<Project[]>([])
const taskCountsByProject = ref<Record<number, ProjectTaskCounts>>({})
const dayPmNotes = ref<DayPmNote[]>([])
const projectBucket = ref<Exclude<TaskRoleProjectBucket, 'hidden'>>('in_work')

function pmNoteForProject(projectId: number): string {
  return dayPmNotes.value.find((n) => n.projectId === projectId)?.text ?? ''
}

const sites = computed((): SiteRow[] => {
  const counts = taskCountsByProject.value
  const out: SiteRow[] = []
  for (const p of allProjects.value) {
    const c = counts[p.id]
    if (!c || c.total <= 0) continue
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
      openCount: c.open,
      badgeLabel: PROJECT_SYS_STATUS_LABELS[sys],
      badgeClass,
      bucket: bucket === 'archived' ? 'archived' : 'in_work',
    })
  }
  return out.sort((a, b) => a.projectName.localeCompare(b.projectName))
})

const inWorkSites = computed(() => sites.value.filter((s) => s.bucket === 'in_work'))
const archivedSites = computed(() => sites.value.filter((s) => s.bucket === 'archived'))

const projectTabs = computed(() => [
  { id: 'in_work' as const, label: 'In work', count: inWorkSites.value.length },
  { id: 'archived' as const, label: 'Closed', count: archivedSites.value.length },
])

const visibleSites = computed(() =>
  projectBucket.value === 'in_work' ? inWorkSites.value : archivedSites.value,
)

const emptyMessage = computed(() => {
  if (sites.value.length === 0) {
    return 'You have no tasks in the plan yet. Check with your project manager.'
  }
  return projectBucket.value === 'in_work'
    ? 'No in-work projects with your tasks.'
    : 'No closed projects with your tasks.'
})

function projectLink(projectId: number): string {
  return `/tasks/projects/${projectId}`
}

async function loadProjects(): Promise<void> {
  const today = todayWorkYmd()
  isLoading.value = true
  loadError.value = ''
  taskCountsByProject.value = {}
  dayPmNotes.value = []
  try {
    const list = await fetchProjectsForTaskScope(authStore.currentUser, { page: 1, limit: 100 })
    allProjects.value = list.filter((p) => getTaskRoleProjectListBucket(p) !== 'hidden')
    const uid = resolveSessionUserId(authStore.currentUser)
    const counts: Record<number, ProjectTaskCounts> = {}
    const schedulePromise = fetchMySchedule(today, today).catch(() => [])
    await Promise.all(
      allProjects.value.map(async (p) => {
        try {
          const res = await tasksApi.getAll(p.id, 1, 500)
          let tasks = res.tasks ?? []
          if (uid != null) tasks = filterTasksForInvolvedUser(tasks, uid)
          counts[p.id] = {
            total: tasks.length,
            open: tasks.filter((t) => getTaskRoleStatusBucket(String(t.status)) !== 'finished').length,
          }
        } catch {
          counts[p.id] = { total: 0, open: 0 }
        }
      }),
    )
    taskCountsByProject.value = counts
    const scheduleEntries = await schedulePromise
    const notes: DayPmNote[] = []
    for (const e of scheduleEntries) {
      const text = typeof e.assignment_note === 'string' ? e.assignment_note.trim() : ''
      if (!text) continue
      const ymd = String(e.work_date || '').slice(0, 10)
      if (ymd !== today) continue
      notes.push({
        entryId: e.scheduleRowIdForMessages > 0 ? e.scheduleRowIdForMessages : e.id,
        projectId: e.project_id,
        projectName: (e.project_name ?? '').trim() || `Project #${e.project_id}`,
        text,
      })
    }
    dayPmNotes.value = notes
    if (inWorkSites.value.length > 0) projectBucket.value = 'in_work'
    else if (archivedSites.value.length > 0) projectBucket.value = 'archived'
  } catch {
    loadError.value = 'Could not load projects.'
    allProjects.value = []
    dayPmNotes.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  void loadProjects()
})
</script>

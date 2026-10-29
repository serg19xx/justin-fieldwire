<template>
  <div class="px-4 py-4 max-w-lg mx-auto">
    <nav class="mb-4">
      <RouterLink
        to="/tasks/projects"
        class="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Projects
      </RouterLink>
    </nav>

    <header class="mb-4">
      <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Site</p>
      <h1 class="text-xl font-semibold text-gray-900 mt-0.5">{{ projectName }}</h1>
      <p v-if="projectAddress" class="text-xs text-gray-500 mt-1">{{ projectAddress }}</p>
    </header>

    <nav v-if="isForeman" class="mb-4 grid grid-cols-3 gap-2" aria-label="Project information">
      <RouterLink
        v-for="link in projectInfoLinks"
        :key="link.section"
        :to="`/tasks/projects/${projectId}/info/${link.section}`"
        class="rounded-lg border border-gray-200 bg-white py-2 text-center text-sm font-medium text-gray-700 hover:border-orange-300 hover:text-orange-700"
      >
        {{ link.label }}
      </RouterLink>
    </nav>

    <div
      class="mb-4 flex rounded-lg border border-gray-200 p-1 bg-gray-50"
      role="tablist"
      aria-label="Task status"
    >
      <button
        v-for="tab in statusTabs"
        :key="tab.id"
        type="button"
        role="tab"
        :aria-selected="listTab === tab.id"
        class="flex-1 rounded-md py-2 px-1 text-sm font-medium transition-colors leading-tight"
        :class="listTab === tab.id ? 'bg-white text-orange-700 shadow-sm' : 'text-gray-600'"
        @click="listTab = tab.id"
      >
        {{ tab.label }}
        <span
          v-if="tab.count > 0"
          class="ml-0.5 tabular-nums"
          :class="listTab === tab.id ? 'text-orange-600' : 'text-gray-400'"
        >
          ({{ tab.count }})
        </span>
      </button>
    </div>

    <p
      v-if="actionMessage"
      class="mb-3 text-xs"
      :class="isActionError ? 'text-red-700' : 'text-emerald-700'"
      role="status"
    >
      {{ actionMessage }}
    </p>

    <div v-if="isLoading" class="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <div class="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto" />
    </div>

    <div v-else-if="loadError" class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      {{ loadError }}
    </div>

    <div
      v-else-if="visibleTasks.length === 0"
      class="bg-white rounded-xl border border-gray-200 border-dashed p-8 text-center"
    >
      <p class="text-gray-600 text-sm">{{ emptyListMessage }}</p>
    </div>

    <ul v-else class="space-y-2">
      <li
        v-for="task in visibleTasks"
        :key="task.id"
        class="flex items-stretch bg-white rounded-xl border border-gray-200"
      >
        <button
          v-if="listTab === 'open' && canMarkDone(task)"
          type="button"
          class="flex shrink-0 items-center pl-3 pr-1"
          :aria-label="`Mark ${task.name} as done`"
          :disabled="isMarkingDone"
          @click="openMarkDone(task)"
        >
          <span
            class="flex h-7 w-7 items-center justify-center rounded-full border-2 border-gray-300 text-transparent hover:border-emerald-500 hover:text-emerald-500"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
            </svg>
          </span>
        </button>
        <span
          v-else-if="listTab === 'open' && isSubmitted(task)"
          class="flex shrink-0 items-center pl-3 pr-1"
          aria-hidden="true"
        >
          <span class="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
            </svg>
          </span>
        </span>
        <RouterLink
          :to="taskLink(task.id)"
          class="block min-w-0 flex-1 rounded-xl p-4 active:bg-orange-50"
        >
          <div class="flex items-start justify-between gap-2">
            <span
              class="font-medium leading-snug"
              :class="listTab === 'closed' || isSubmitted(task) ? 'text-gray-500 line-through' : 'text-gray-900'"
            >
              {{ task.name }}
            </span>
            <span class="text-xs font-medium text-gray-500 shrink-0">{{ task.progress_pct ?? 0 }}%</span>
          </div>
          <div
            v-if="task.priority || task.category || isContractorTask(task)"
            class="mt-1.5 flex flex-wrap items-center gap-1.5"
          >
            <TaskPriorityBadge :priority="task.priority" size="sm" />
            <span
              v-if="task.category"
              class="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-700"
            >
              {{ task.category }}
            </span>
            <span
              v-if="isContractorTask(task)"
              class="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700"
            >
              Contractor{{ task.contractor?.name ? ` · ${task.contractor.name}` : '' }}
            </span>
          </div>
          <p
            v-if="taskSiteAddress(task)"
            class="text-xs text-gray-500 mt-1.5 whitespace-pre-wrap break-words leading-snug"
          >
            {{ taskSiteAddress(task) }}
          </p>
          <p v-if="listTab === 'open' && isSubmitted(task)" class="text-xs font-medium text-emerald-700 mt-1">
            Ready For Inspection · waiting for PM
          </p>
          <p v-else class="text-xs text-gray-500 mt-1">{{ formatBackendTaskStatus(String(task.status)) }}</p>
          <p v-if="task.start_planned" class="text-xs text-gray-400 mt-0.5">
            Planned: {{ formatPlannedRange(task) }}
          </p>
        </RouterLink>
      </li>
    </ul>

    <TaskMarkDoneDialog
      :task-name="markDoneTask?.name ?? null"
      :is-busy="isMarkingDone"
      :error-message="markDoneError"
      @confirm="confirmMarkDone"
      @cancel="closeMarkDone"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import TaskMarkDoneDialog from '@/components/task-role/TaskMarkDoneDialog.vue'
import { useAuthStore } from '@/core/stores/auth'
import type { Task } from '@/core/types/task'
import { projectApi } from '@/core/utils/project-api'
import { resolveDefaultTaskForemanId } from '@/core/utils/project-foreman'
import { resolveSessionUserId } from '@/core/utils/session-user-id'
import {
  canEditTaskProgress,
  compareFieldTaskPriority,
  filterTasksForFieldUser,
  formatBackendTaskStatus,
  getTaskRoleStatusBucket,
  isContractorTask,
  isTaskRoleForeman,
  resolveTaskSiteAddress,
} from '@/core/utils/task-role-ux'
import { PROJECT_INFO_SECTIONS } from '@/core/utils/task-project-info'
import TaskPriorityBadge from '@/components/tasks/TaskPriorityBadge.vue'
import { taskFieldPhotosApi } from '@/core/utils/task-field-photos-api'
import { fileToCompressedUploadFile, isAcceptedImageFile } from '@/core/utils/task-field-photos-storage'
import { formatTaskDate } from '@/core/utils/task-utils'
import { tasksApi } from '@/core/utils/tasks-api'
import { todayWorkYmd } from '@/core/utils/work-day'

type TaskListTab = 'open' | 'closed'

const route = useRoute()
const authStore = useAuthStore()

const projectId = computed(() => Number(route.params.projectId))
const projectName = ref('Project')
const projectAddress = ref('')
const projectForemanId = ref<number | null>(null)
const tasks = ref<Task[]>([])
const isLoading = ref(true)
const loadError = ref('')
const listTab = ref<TaskListTab>('open')
const isForeman = computed(() =>
  isTaskRoleForeman(authStore.currentUser?.role_code, authStore.currentUser?.role_id),
)
const projectInfoLinks = PROJECT_INFO_SECTIONS
const markDoneTask = ref<Task | null>(null)
const isMarkingDone = ref(false)
const markDoneError = ref('')
const actionMessage = ref('')
const isActionError = ref(false)

const scopedTasks = computed(() => {
  const uid = resolveSessionUserId(authStore.currentUser)
  return uid != null ? filterTasksForFieldUser(tasks.value, uid, projectForemanId.value) : []
})

function isClosedTask(task: Task): boolean {
  return getTaskRoleStatusBucket(String(task.status)) === 'finished'
}

function compareByName(a: Task, b: Task): number {
  return String(a.name).localeCompare(String(b.name))
}

function isSubmitted(task: Task): boolean {
  return String(task.status) === 'ready_for_inspection'
}

function canMarkDone(task: Task): boolean {
  if (isSubmitted(task)) return false
  const uid = resolveSessionUserId(authStore.currentUser)
  if (uid == null) return false
  return canEditTaskProgress(task, uid, authStore.currentUser?.role_code, authStore.currentUser?.role_id)
}

/**
 * Not yet submitted first; then priority, category, own crew before contractors;
 * then earliest planned start (tasks without dates go last).
 */
function compareOpenTasks(a: Task, b: Task): number {
  const submittedDiff = Number(isSubmitted(a)) - Number(isSubmitted(b))
  if (submittedDiff !== 0) return submittedDiff
  const priorityDiff = compareFieldTaskPriority(a, b)
  if (priorityDiff !== 0) return priorityDiff
  const as = a.start_planned || '9999-12-31'
  const bs = b.start_planned || '9999-12-31'
  if (as !== bs) return as < bs ? -1 : 1
  return compareByName(a, b)
}

/** Most recently finished (planned end, else start) first. */
function compareClosedTasks(a: Task, b: Task): number {
  const ae = a.end_planned || a.start_planned || ''
  const be = b.end_planned || b.start_planned || ''
  if (ae !== be) return ae > be ? -1 : 1
  return compareByName(a, b)
}

const openTasks = computed(() => scopedTasks.value.filter((t) => !isClosedTask(t)).sort(compareOpenTasks))
const closedTasks = computed(() => scopedTasks.value.filter(isClosedTask).sort(compareClosedTasks))

const statusTabs = computed(() => [
  { id: 'open' as const, label: 'Open', count: openTasks.value.length },
  { id: 'closed' as const, label: 'Closed', count: closedTasks.value.length },
])

const visibleTasks = computed(() => (listTab.value === 'open' ? openTasks.value : closedTasks.value))

const emptyListMessage = computed(() => {
  if (scopedTasks.value.length === 0) return 'No tasks on this site yet.'
  return listTab.value === 'open' ? 'All tasks on this site are closed.' : 'No closed tasks yet.'
})

function taskSiteAddress(task: Task): string {
  return resolveTaskSiteAddress(task, { address: projectAddress.value })
}

function taskLink(taskId: number | string): string {
  return `/tasks/projects/${projectId.value}/tasks/${taskId}`
}

function formatPlannedRange(task: Task): string {
  const start = formatTaskDate(task.start_planned)
  const end = formatTaskDate(task.end_planned)
  if (start && end && start !== end) return `${start} – ${end}`
  return start || end
}

function openMarkDone(task: Task): void {
  markDoneError.value = ''
  markDoneTask.value = task
}

function closeMarkDone(): void {
  markDoneTask.value = null
  markDoneError.value = ''
}

/** Optional photo first, so a failed upload leaves the task open; then Ready For Inspection for PM review. */
async function confirmMarkDone(file: File | null): Promise<void> {
  const task = markDoneTask.value
  if (!task || isMarkingDone.value) return
  if (file && !isAcceptedImageFile(file)) {
    markDoneError.value = 'This file is not a supported image. Choose another photo or continue without one.'
    return
  }
  isMarkingDone.value = true
  markDoneError.value = ''
  actionMessage.value = ''
  isActionError.value = false
  try {
    if (file) {
      try {
        const uploadFile = await fileToCompressedUploadFile(file)
        await taskFieldPhotosApi.upload(projectId.value, Number(task.id), 'after', todayWorkYmd(), uploadFile)
      } catch {
        markDoneError.value = 'Photo upload failed. Try again or continue without a photo.'
        return
      }
    }
    const updated = await tasksApi.submitTask(projectId.value, String(task.id))
    tasks.value = tasks.value.map((t) => (t.id === task.id ? { ...t, ...updated } : t))
    actionMessage.value = `"${task.name}" is Ready For Inspection. The project manager will review it.`
    markDoneTask.value = null
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } }
    markDoneError.value = err.response?.data?.message || 'Could not mark the task as done. Try again.'
  } finally {
    isMarkingDone.value = false
  }
}

async function load(): Promise<void> {
  const pid = projectId.value
  if (!pid) return
  isLoading.value = true
  loadError.value = ''
  try {
    const [project, taskResult] = await Promise.all([
      projectApi.getById(pid),
      tasksApi.getAll(pid, 1, 500),
    ])
    projectName.value = project?.prj_name ?? `Project #${pid}`
    projectAddress.value = project?.address ?? ''
    projectForemanId.value = resolveDefaultTaskForemanId(project)
    tasks.value = taskResult.tasks ?? []
    listTab.value = 'open'
  } catch {
    loadError.value = 'Could not load project tasks.'
    tasks.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  void load()
})

watch(projectId, () => {
  void load()
})
</script>

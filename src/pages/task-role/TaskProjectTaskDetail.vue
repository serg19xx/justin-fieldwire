<template>
  <div class="px-4 py-4 max-w-lg mx-auto pb-8">
    <nav class="mb-4">
      <RouterLink
        :to="tasksBackLink"
        class="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to tasks
      </RouterLink>
    </nav>

    <div v-if="isLoading" class="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <div class="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto" />
    </div>

    <div v-else-if="!task" class="text-center py-12 text-gray-500">
      <p>Task not found or you do not have access.</p>
      <RouterLink :to="tasksBackLink" class="text-orange-600 text-sm font-medium mt-3 inline-block">
        Return to project tasks
      </RouterLink>
    </div>

    <template v-else>
      <header class="mb-5">
        <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Project</p>
        <p class="text-sm text-gray-600 mb-2">{{ projectName }}</p>
        <h1 class="text-xl font-semibold text-gray-900 leading-snug">{{ task.name }}</h1>
        <TaskSiteLocation class="mt-3" :site-name="siteName" :site-address="siteAddress" />
      </header>

      <!-- Task details -->
      <section class="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Task details</h2>
        <dl class="space-y-2.5 text-sm">
          <div class="flex justify-between gap-4">
            <dt class="text-gray-500 shrink-0">Status</dt>
            <dd class="font-medium text-gray-900 text-right">{{ statusLabel }}</dd>
          </div>
          <div v-if="task.priority" class="flex justify-between gap-4">
            <dt class="text-gray-500 shrink-0">Priority</dt>
            <dd class="text-right"><TaskPriorityBadge :priority="task.priority" size="sm" /></dd>
          </div>
          <div v-if="task.category" class="flex justify-between gap-4">
            <dt class="text-gray-500 shrink-0">Category</dt>
            <dd class="text-gray-900 text-right">{{ task.category }}</dd>
          </div>
          <div v-if="task.executor_type === 'contractor'" class="flex justify-between gap-4">
            <dt class="text-gray-500 shrink-0">Done by</dt>
            <dd class="text-gray-900 text-right">Contractor{{ task.contractor?.name ? ` · ${task.contractor.name}` : '' }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-gray-500 shrink-0">Planned dates</dt>
            <dd class="text-gray-900 text-right">{{ dateRange || '—' }}</dd>
          </div>
          <div v-if="plannedTimeRange" class="flex justify-between gap-4">
            <dt class="text-gray-500 shrink-0">Planned time</dt>
            <dd class="text-gray-900 text-right">{{ plannedTimeRange }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-gray-500 shrink-0">Your role</dt>
            <dd class="text-gray-900 text-right">{{ roleOnTaskLabel }}</dd>
          </div>
          <div v-if="task.address?.trim()" class="pt-2 border-t border-gray-100">
            <dt class="text-gray-500 text-xs mb-1">Work location</dt>
            <dd class="text-gray-900 whitespace-pre-wrap break-words">{{ task.address }}</dd>
          </div>
        </dl>
      </section>

      <section v-if="task.notes?.trim()" class="mb-5 rounded-xl border border-gray-200 bg-gray-50/90 p-4">
        <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">PM task description</h2>
        <p class="text-sm text-gray-800 whitespace-pre-wrap break-words">{{ task.notes }}</p>
        <p class="text-xs text-gray-500 mt-2">Set by project manager — read only.</p>
      </section>

      <TaskPhotosPanel
        class="mb-5"
        title="Task pictures"
        :project-id="projectId"
        :task-id="taskId"
        :show-field-photos="false"
      />

      <section v-if="canChangeStatus" class="mb-5 rounded-xl border border-gray-200 bg-white p-4">
        <label for="task-status" class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Status
        </label>
        <select
          id="task-status"
          v-model="statusDraft"
          class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
          :disabled="isSavingStatus"
          @change="saveStatus"
        >
          <option v-for="option in fieldStatusOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        <p v-if="statusDraft === 'delayed_due_to_issue'" class="text-xs text-amber-700 mt-2">
          The project manager gets a text message. Add the reason in the task notes below.
        </p>
        <p v-if="statusMessage" class="text-xs mt-2" :class="statusError ? 'text-red-700' : 'text-green-700'">
          {{ statusMessage }}
        </p>
        <p class="text-xs text-gray-500 mt-2">Only the project manager can mark a task Completed.</p>
      </section>
      <section v-else class="mb-5 rounded-xl border border-gray-200 bg-gray-50/90 p-4">
        <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Official status</h2>
        <p class="text-sm text-gray-900 font-medium">{{ statusLabel }}</p>
        <p class="text-xs text-gray-500 mt-2">Only the project manager can change task status.</p>
      </section>

      <section class="mb-5 rounded-xl border border-gray-200 bg-white p-4">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-sm font-semibold text-gray-900">Progress</h2>
          <span class="text-sm font-medium text-gray-700">{{ progressValue }}%</span>
        </div>

        <template v-if="canEditProgress">
          <input
            v-model.number="progressDraft"
            type="range"
            min="0"
            max="100"
            step="1"
            class="w-full accent-orange-600"
            :disabled="isSavingProgress || isWorkLocked"
            @change="saveProgress"
          />
          <p v-if="progressMessage" class="text-xs mt-2" :class="progressError ? 'text-red-700' : 'text-green-700'">
            {{ progressMessage }}
          </p>
        </template>

        <template v-else>
          <div class="h-2 rounded-full bg-gray-200 overflow-hidden">
            <div class="h-full bg-orange-500 transition-all" :style="{ width: `${progressValue}%` }" />
          </div>
          <p v-if="readOnly" class="text-xs text-gray-500 mt-2">{{ readOnlyHint }}</p>
        </template>
      </section>

      <!-- Field photos and notes are kept per day -->
      <TaskWorkDayPicker v-if="showFieldWorkPanel" v-model="workYmd" class="mb-4" />
      <TaskFieldWorkPanel
        v-if="showFieldWorkPanel"
        ref="fieldWorkRef"
        class="mb-5"
        :project-id="projectId"
        :task-id="taskId"
        :task="task"
        :can-edit="canEditProgress"
        :is-locked="isWorkLocked"
        :work-ymd="workYmd"
        :hide-day-clock-in-banner="true"
        @updated="onFieldWorkUpdated"
      />

      <section
        v-else-if="hasFieldWorkRecord"
        class="mb-5 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700 space-y-2"
      >
        <h2 class="text-sm font-semibold text-gray-900">Field work record</h2>
        <div v-if="task.field_work_started_at">
          <p>
            <span class="text-gray-500">Started:</span> {{ formatDateTime(task.field_work_started_at) }}
          </p>
          <p v-if="task.field_work_start_reason?.trim()" class="text-xs text-gray-600 mt-0.5 whitespace-pre-wrap break-words">
            <span class="font-medium text-gray-500">Reason:</span> {{ task.field_work_start_reason }}
          </p>
        </div>
        <div v-if="task.field_work_ended_at">
          <p>
            <span class="text-gray-500">Ended:</span> {{ formatDateTime(task.field_work_ended_at) }}
          </p>
          <p v-if="task.field_work_end_reason?.trim()" class="text-xs text-gray-600 mt-0.5 whitespace-pre-wrap break-words">
            <span class="font-medium text-gray-500">Reason:</span> {{ task.field_work_end_reason }}
          </p>
        </div>
        <p v-if="task.field_notes" class="whitespace-pre-wrap break-words">{{ task.field_notes }}</p>
      </section>

      <section
        v-if="isAwaitingReview && fieldSubmittedAt"
        class="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4"
      >
        <p class="text-sm font-medium text-emerald-900">Ready For Inspection · waiting for PM</p>
        <p class="text-xs text-emerald-800 mt-1">{{ formatDateTime(fieldSubmittedAt) }}</p>
      </section>

      <section v-if="canSubmitWork" class="mb-5">
        <button
          type="button"
          class="w-full rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
          :disabled="isSubmitting || isWorkLocked || !canSubmitNow"
          @click="submitWork"
        >
          {{ submitButtonLabel }}
        </button>
        <p v-if="submitMessage" class="text-xs mt-2" :class="submitError ? 'text-red-700' : 'text-green-700'">
          {{ submitMessage }}
        </p>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/core/stores/auth'
import type { Task, TaskStatus } from '@/core/types/task'
import { projectApi } from '@/core/utils/project-api'
import { resolveDefaultTaskForemanId } from '@/core/utils/project-foreman'
import { resolveSessionUserId } from '@/core/utils/session-user-id'
import { TASK_STATUS_VALUES, getTaskStatusLabel, isTaskStatus } from '@/core/utils/task-utils'
import TaskPriorityBadge from '@/components/tasks/TaskPriorityBadge.vue'
import TaskPhotosPanel from '@/components/tasks/TaskPhotosPanel.vue'
import {
  canEditTaskProgress,
  fieldTaskReadOnlyHint,
  formatBackendTaskStatus,
  isFieldTaskReadOnly,
  isTaskRoleContractor,
  isTaskRoleForeman,
  isTaskRoleWorker,
  isUserInvolvedInTask,
  isUserTaskLead,
  resolveTaskSiteAddress,
  resolveTaskSiteName,
} from '@/core/utils/task-role-ux'
import { formatTaskDateTimeDisplay } from '@/core/utils/task-field-work-datetime'
import { tasksApi } from '@/core/utils/tasks-api'
import TaskSiteLocation from '@/components/task-role/TaskSiteLocation.vue'
import TaskFieldWorkPanel from '@/components/task-role/TaskFieldWorkPanel.vue'
import TaskWorkDayPicker from '@/components/task-role/TaskWorkDayPicker.vue'
import { parseWorkYmd, todayWorkYmd } from '@/core/utils/work-day'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const fieldWorkRef = ref<InstanceType<typeof TaskFieldWorkPanel> | null>(null)

const projectId = computed(() => Number(route.params.projectId))
const taskId = computed(() => String(route.params.taskId ?? ''))
const workYmd = ref(parseWorkYmd(route.query.workDate) ?? todayWorkYmd())

const task = ref<Task | null>(null)
const projectName = ref('')
const siteName = ref('')
const siteAddress = ref('')
const projectForemanId = ref<number | null>(null)
const isLoading = ref(true)
const progressDraft = ref(0)
const isSavingProgress = ref(false)
const progressMessage = ref('')
const progressError = ref(false)
const isSubmitting = ref(false)
const submitMessage = ref('')
const submitError = ref(false)

const tasksBackLink = computed(() => `/tasks/projects/${projectId.value}`)

const uid = computed(() => resolveSessionUserId(authStore.currentUser))

const readOnly = computed(() => {
  if (!task.value || uid.value == null) return true
  return isFieldTaskReadOnly(
    task.value,
    uid.value,
    authStore.currentUser?.role_code,
    authStore.currentUser?.role_id,
  )
})

const readOnlyHint = computed(() => fieldTaskReadOnlyHint(authStore.currentUser?.role_code))

const canEditProgress = computed(() => {
  if (!task.value || uid.value == null) return false
  return canEditTaskProgress(
    task.value,
    uid.value,
    authStore.currentUser?.role_code,
    authStore.currentUser?.role_id,
  )
})

const showFieldWorkPanel = computed(() => canEditProgress.value)

const canSubmitWork = computed(() => canEditProgress.value)

/** The PM re-opens a task by moving it back to a working status; then the crew can mark it done again. */
const isAwaitingReview = computed(() =>
  ['ready_for_inspection', 'completed', 'done'].includes(String(task.value?.status ?? '')),
)

const isWorkLocked = computed(() => Boolean(fieldSubmittedAt.value) && isAwaitingReview.value)

const canSubmitNow = computed(() => true)

const submitButtonLabel = computed(() => {
  if (isWorkLocked.value) return 'Already marked done'
  if (isSubmitting.value) return 'Saving…'
  return 'Mark as done (Ready For Inspection)'
})

const progressValue = computed(() => {
  const n = task.value?.progress_pct
  return typeof n === 'number' && Number.isFinite(n) ? Math.round(n) : 0
})

const statusLabel = computed(() => formatBackendTaskStatus(String(task.value?.status ?? '')))

const isForemanUser = computed(() =>
  isTaskRoleForeman(authStore.currentUser?.role_code, authStore.currentUser?.role_id),
)

/** Foreman on the task (or the project foreman) changes status; Completed stays with the PM. */
const canChangeStatus = computed(() => {
  const t = task.value
  if (!t || uid.value == null || !isForemanUser.value) return false
  if (['completed', 'done'].includes(String(t.status))) return false
  return isUserInvolvedInTask(t, uid.value) || projectForemanId.value === uid.value
})

const fieldStatusOptions = TASK_STATUS_VALUES.filter((s) => s !== 'completed').map((value) => ({
  value,
  label: getTaskStatusLabel(value),
}))

const statusDraft = ref<TaskStatus>('planned')
const isSavingStatus = ref(false)
const statusMessage = ref('')
const statusError = ref(false)

function syncStatusDraft(): void {
  const status = String(task.value?.status ?? '')
  statusDraft.value = isTaskStatus(status) ? status : 'planned'
}

async function saveStatus(): Promise<void> {
  const t = task.value
  const next = statusDraft.value
  if (!t || !canChangeStatus.value || next === t.status) return
  isSavingStatus.value = true
  statusMessage.value = ''
  statusError.value = false
  try {
    task.value =
      next === 'ready_for_inspection'
        ? await tasksApi.submitTask(projectId.value, taskId.value)
        : await tasksApi.updateStatus(projectId.value, taskId.value, next)
    statusMessage.value = `Status changed to ${getTaskStatusLabel(next)}.`
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } }
    statusError.value = true
    statusMessage.value = err.response?.data?.message || 'Could not change the status. Try again.'
  } finally {
    syncStatusDraft()
    isSavingStatus.value = false
  }
}

const fieldSubmittedAt = computed(() => task.value?.field_submitted_at ?? null)

const hasFieldWorkRecord = computed(() => {
  const t = task.value
  if (!t) return false
  return Boolean(
    t.field_work_started_at ||
      t.field_work_ended_at ||
      t.field_work_start_reason?.trim() ||
      t.field_work_end_reason?.trim() ||
      t.field_notes?.trim(),
  )
})

const roleOnTaskLabel = computed(() => {
  if (!task.value || uid.value == null) return '—'
  if (isUserTaskLead(task.value, uid.value)) return 'Task lead (foreman)'
  if (
    isTaskRoleForeman(authStore.currentUser?.role_code, authStore.currentUser?.role_id) &&
    isUserInvolvedInTask(task.value, uid.value)
  ) {
    return 'Foreman'
  }
  if (isTaskRoleContractor(authStore.currentUser?.role_code) && isUserInvolvedInTask(task.value, uid.value)) {
    return 'Contractor'
  }
  if (isTaskRoleWorker(authStore.currentUser?.role_code) && isUserInvolvedInTask(task.value, uid.value)) {
    return 'Worker'
  }
  if (isUserInvolvedInTask(task.value, uid.value)) return 'Team member'
  if (isTaskRoleForeman(authStore.currentUser?.role_code, authStore.currentUser?.role_id)) {
    return 'Foreman (viewing project task)'
  }
  return '—'
})

const dateRange = computed(() => {
  const t = task.value
  if (!t?.start_planned && !t?.end_planned) return ''
  const fmt = (d: string) => {
    try {
      return new Date(d + 'T12:00:00').toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return d
    }
  }
  if (t.start_planned && t.end_planned) return `${fmt(t.start_planned)} – ${fmt(t.end_planned)}`
  return t.start_planned ? fmt(t.start_planned) : t.end_planned ? fmt(t.end_planned) : ''
})

const plannedTimeRange = computed(() => {
  const t = task.value
  if (!t?.start_time && !t?.end_time) return ''
  const fmt = (time: string) => time.slice(0, 5)
  if (t.start_time && t.end_time) {
    const hours = scheduledHoursPerDay(t.start_time, t.end_time)
    const range = `${fmt(t.start_time)} – ${fmt(t.end_time)}`
    return hours > 0 ? `${range} (${hours} h/day)` : range
  }
  return t.start_time ? `From ${fmt(t.start_time)}` : t.end_time ? `Until ${fmt(t.end_time)}` : ''
})

function scheduledHoursPerDay(start: string, end: string): number {
  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number)
    return (h ?? 0) * 60 + (m ?? 0)
  }
  const minutes = toMinutes(end) - toMinutes(start)
  return minutes > 0 ? Math.round((minutes / 60) * 100) / 100 : 0
}

function formatDateTime(iso: string): string {
  return formatTaskDateTimeDisplay(iso)
}

function onFieldWorkUpdated(updated: Task): void {
  task.value = updated
  syncStatusDraft()
}

async function loadTask(): Promise<void> {
  const pid = projectId.value
  const tid = taskId.value
  if (!pid || !tid) return
  isLoading.value = true
  progressMessage.value = ''
  submitMessage.value = ''
  try {
    const [loaded, project] = await Promise.all([
      tasksApi.getById(pid, tid),
      projectApi.getById(pid).catch(() => null),
    ])
    projectName.value = project?.prj_name ?? 'Project'
    siteName.value = resolveTaskSiteName(project)
    siteAddress.value = resolveTaskSiteAddress(loaded, project)
    projectForemanId.value = resolveDefaultTaskForemanId(project)
    const foreman = isTaskRoleForeman(authStore.currentUser?.role_code, authStore.currentUser?.role_id)
    const userId = uid.value
    if (!foreman && userId != null && !isUserInvolvedInTask(loaded, userId)) {
      task.value = null
    } else {
      task.value = loaded
      progressDraft.value = progressValue.value
      syncStatusDraft()
    }
  } catch {
    task.value = null
  } finally {
    isLoading.value = false
  }
}

async function saveProgress(): Promise<void> {
  const pid = projectId.value
  const tid = taskId.value
  if (!task.value || !canEditProgress.value) return
  isSavingProgress.value = true
  progressMessage.value = ''
  progressError.value = false
  try {
    const updated = await tasksApi.updateProgress(pid, tid, progressDraft.value)
    task.value = updated
    progressMessage.value = 'Progress saved.'
  } catch {
    progressError.value = true
    progressMessage.value = 'Could not save progress.'
    progressDraft.value = progressValue.value
  } finally {
    isSavingProgress.value = false
  }
}

async function submitWork(): Promise<void> {
  const pid = projectId.value
  const tid = taskId.value
  if (!task.value || !canSubmitWork.value) return
  isSubmitting.value = true
  submitMessage.value = ''
  submitError.value = false
  try {
    const updated = await tasksApi.submitTask(pid, tid)
    task.value = updated
    syncStatusDraft()
    submitMessage.value = 'Marked Ready For Inspection. Waiting for PM review.'
  } catch {
    submitError.value = true
    submitMessage.value = 'Could not submit work. Try again.'
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  void loadTask()
})

watch([projectId, taskId], () => {
  void loadTask()
})

watch(workYmd, (day) => {
  const parsed = parseWorkYmd(day) ?? todayWorkYmd()
  if (String(route.query.workDate ?? '') !== parsed) {
    void router.replace({ query: { ...route.query, workDate: parsed } })
  }
})

watch(
  () => route.query.workDate,
  (q) => {
    const parsed = parseWorkYmd(q)
    if (parsed && parsed !== workYmd.value) workYmd.value = parsed
  },
)
</script>

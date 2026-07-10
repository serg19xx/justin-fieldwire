<template>
  <div class="px-4 py-4 max-w-lg mx-auto pb-8">
    <nav class="mb-4">
      <RouterLink
        :to="`/tasks/projects/${projectId}`"
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
      <RouterLink :to="`/tasks/projects/${projectId}`" class="text-orange-600 text-sm font-medium mt-3 inline-block">
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

      <section class="mb-5 rounded-xl border border-gray-200 bg-gray-50/90 p-4">
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

      <!-- Foreman field work -->
      <TaskFieldWorkPanel
        v-if="showFieldWorkPanel"
        ref="fieldWorkRef"
        class="mb-5"
        :project-id="projectId"
        :task-id="taskId"
        :task="task"
        :can-edit="canEditProgress"
        :is-locked="isWorkLocked"
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
        v-if="fieldSubmittedAt"
        class="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4"
      >
        <p class="text-sm font-medium text-emerald-900">Submitted for PM review</p>
        <p class="text-xs text-emerald-800 mt-1">{{ formatDateTime(fieldSubmittedAt) }}</p>
      </section>

      <section v-if="canSubmitWork" class="mb-5">
        <button
          type="button"
          class="w-full rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
          :disabled="isSubmitting || Boolean(fieldSubmittedAt) || !canSubmitNow"
          @click="submitWork"
        >
          {{ submitButtonLabel }}
        </button>
        <p v-if="!canSubmitNow && !fieldSubmittedAt && canEditProgress" class="text-xs text-amber-800 mt-2">
          Record <strong>Start work</strong> and <strong>End work</strong> before submitting.
        </p>
        <p v-if="submitMessage" class="text-xs mt-2" :class="submitError ? 'text-red-700' : 'text-green-700'">
          {{ submitMessage }}
        </p>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/core/stores/auth'
import type { Task } from '@/core/types/task'
import { projectApi } from '@/core/utils/project-api'
import { resolveSessionUserId } from '@/core/utils/session-user-id'
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

const route = useRoute()
const authStore = useAuthStore()
const fieldWorkRef = ref<InstanceType<typeof TaskFieldWorkPanel> | null>(null)

const projectId = computed(() => Number(route.params.projectId))
const taskId = computed(() => String(route.params.taskId ?? ''))

const task = ref<Task | null>(null)
const projectName = ref('')
const siteName = ref('')
const siteAddress = ref('')
const isLoading = ref(true)
const progressDraft = ref(0)
const isSavingProgress = ref(false)
const progressMessage = ref('')
const progressError = ref(false)
const isSubmitting = ref(false)
const submitMessage = ref('')
const submitError = ref(false)

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

const isWorkLocked = computed(() => Boolean(fieldSubmittedAt.value))

const canSubmitNow = computed(() => {
  if (task.value?.field_work_started_at && task.value?.field_work_ended_at) return true
  return fieldWorkRef.value?.hasRequiredWorkTimes?.() ?? false
})

const submitButtonLabel = computed(() => {
  if (fieldSubmittedAt.value) return 'Already submitted'
  if (isSubmitting.value) return 'Submitting…'
  return 'Submit work for review'
})

const progressValue = computed(() => {
  const n = task.value?.progress_pct
  return typeof n === 'number' && Number.isFinite(n) ? Math.round(n) : 0
})

const statusLabel = computed(() => formatBackendTaskStatus(String(task.value?.status ?? '')))

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
  if (t.start_time && t.end_time) return `${fmt(t.start_time)} – ${fmt(t.end_time)}`
  return t.start_time ? `From ${fmt(t.start_time)}` : t.end_time ? `Until ${fmt(t.end_time)}` : ''
})

function formatDateTime(iso: string): string {
  return formatTaskDateTimeDisplay(iso)
}

function onFieldWorkUpdated(updated: Task): void {
  task.value = updated
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
    const foreman = isTaskRoleForeman(authStore.currentUser?.role_code, authStore.currentUser?.role_id)
    const userId = uid.value
    if (!foreman && userId != null && !isUserInvolvedInTask(loaded, userId)) {
      task.value = null
    } else {
      task.value = loaded
      progressDraft.value = progressValue.value
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
  if (!canSubmitNow.value) {
    submitError.value = true
    submitMessage.value = 'Start and end work times are required.'
    return
  }
  isSubmitting.value = true
  submitMessage.value = ''
  submitError.value = false
  const notes = fieldWorkRef.value?.getFieldNotes?.()
  try {
    const updated = await tasksApi.submitTask(pid, tid, notes ? { field_notes: notes } : undefined)
    task.value = updated
    submitMessage.value = 'Work submitted. Waiting for PM review.'
  } catch {
    submitError.value = true
    submitMessage.value = 'Could not submit work. Record start/end times and try again.'
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
</script>

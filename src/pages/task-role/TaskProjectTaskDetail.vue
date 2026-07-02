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
        <h1 class="text-xl font-semibold text-gray-900">{{ task.name }}</h1>
        <p class="text-sm text-gray-500 mt-1">{{ dateRange }}</p>
        <TaskSiteLocation
          class="mt-3"
          :site-name="siteName"
          :site-address="siteAddress"
        />
      </header>

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
            :disabled="isSavingProgress"
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
          <p v-if="readOnly" class="text-xs text-gray-500 mt-2">View only — field updates are done by your foreman.</p>
        </template>
      </section>

      <section
        v-if="fieldSubmittedAt"
        class="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4"
      >
        <p class="text-sm font-medium text-emerald-900">Submitted for PM review</p>
        <p class="text-xs text-emerald-800 mt-1">{{ formatSubmittedAt(fieldSubmittedAt) }}</p>
      </section>

      <section v-if="canSubmitWork" class="mb-5">
        <button
          type="button"
          class="w-full rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
          :disabled="isSubmitting || Boolean(fieldSubmittedAt)"
          @click="submitWork"
        >
          {{ fieldSubmittedAt ? 'Already submitted' : isSubmitting ? 'Submitting…' : 'Submit work for review' }}
        </button>
        <p v-if="submitMessage" class="text-xs mt-2" :class="submitError ? 'text-red-700' : 'text-green-700'">
          {{ submitMessage }}
        </p>
      </section>

      <section v-if="task.notes" class="rounded-xl border border-gray-200 bg-white p-4">
        <h2 class="text-sm font-semibold text-gray-900 mb-2">Notes</h2>
        <p class="text-sm text-gray-700 whitespace-pre-wrap break-words">{{ task.notes }}</p>
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
  formatBackendTaskStatus,
  isFieldTaskReadOnly,
  isTaskRoleForeman,
  isUserInvolvedInTask,
  resolveTaskSiteAddress,
  resolveTaskSiteName,
} from '@/core/utils/task-role-ux'
import { tasksApi } from '@/core/utils/tasks-api'
import TaskSiteLocation from '@/components/task-role/TaskSiteLocation.vue'

const route = useRoute()
const authStore = useAuthStore()

const projectId = computed(() => Number(route.params.projectId))
const taskId = computed(() => String(route.params.taskId ?? ''))

const task = ref<Task | null>(null)
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
  return isFieldTaskReadOnly(task.value, uid.value)
})

const canEditProgress = computed(() => {
  if (!task.value || uid.value == null) return false
  return canEditTaskProgress(task.value, uid.value)
})

const canSubmitWork = computed(() => canEditProgress.value)

const progressValue = computed(() => {
  const n = task.value?.progress_pct
  return typeof n === 'number' && Number.isFinite(n) ? Math.round(n) : 0
})

const statusLabel = computed(() => formatBackendTaskStatus(String(task.value?.status ?? '')))

const fieldSubmittedAt = computed(() => task.value?.field_submitted_at ?? null)

const dateRange = computed(() => {
  const t = task.value
  if (!t?.start_planned && !t?.end_planned) return ''
  const fmt = (d: string) => {
    try {
      return new Date(d + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return d
    }
  }
  if (t.start_planned && t.end_planned) return `${fmt(t.start_planned)} – ${fmt(t.end_planned)}`
  return t.start_planned ? fmt(t.start_planned) : t.end_planned ? fmt(t.end_planned) : ''
})

function formatSubmittedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
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
  isSubmitting.value = true
  submitMessage.value = ''
  submitError.value = false
  try {
    const updated = await tasksApi.submitTask(pid, tid)
    task.value = updated
    submitMessage.value = 'Work submitted. Waiting for PM review.'
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
</script>

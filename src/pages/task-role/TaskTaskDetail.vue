<template>
  <div class="px-4 py-4 max-w-lg mx-auto pb-8">
    <!-- From schedule: single back link. From projects: Projects / Tasks -->
    <nav class="mb-4" aria-label="Breadcrumb">
      <RouterLink
        v-if="fromSchedule"
        to="/tasks/schedule"
        class="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700"
        aria-label="Back to schedule"
      >
        <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Schedule
      </RouterLink>
      <ol v-else class="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
        <li>
          <RouterLink to="/tasks" class="font-medium text-orange-600 hover:text-orange-700">Projects</RouterLink>
        </li>
        <li class="text-gray-300 select-none" aria-hidden="true">/</li>
        <li>
          <RouterLink
            :to="projectTasksListLocation"
            class="font-medium text-orange-600 hover:text-orange-700"
          >
            Tasks
          </RouterLink>
        </li>
      </ol>
    </nav>

    <div v-if="isLoading" class="flex justify-center py-12">
      <div class="animate-spin w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full" />
    </div>

    <template v-else-if="task">
      <div
        v-if="fromSchedule && scheduleContextLine"
        class="mb-4 rounded-lg border border-orange-200 bg-orange-50/80 px-3 py-2 text-sm text-orange-950"
        role="status"
      >
        <span class="font-medium">Your assignment</span>
        <span class="block text-orange-900/90 mt-0.5">{{ scheduleContextLine }}</span>
      </div>

      <!-- Task header -->
      <header class="mb-6">
        <div class="flex items-center gap-2">
          <span v-if="isMilestone(task.milestone)" class="text-amber-600">{{ MILESTONE_ICON }}</span>
          <h1 class="text-xl font-semibold text-gray-900">{{ task.name }}</h1>
        </div>
        <p class="text-sm text-gray-500 mt-1">
          {{ formatDateRange(task.start_planned, task.end_planned) }}
        </p>
        <p v-if="task.address?.trim()" class="text-sm text-gray-700 mt-2 flex gap-2 items-start">
          <svg
            class="w-4 h-4 text-gray-400 shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span class="whitespace-pre-wrap break-words">{{ task.address }}</span>
        </p>
        <p v-if="task.notes" class="text-sm text-gray-600 mt-2">{{ task.notes }}</p>
      </header>

      <!-- Management & communication (placeholders until messaging API) -->
      <section class="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 class="text-sm font-semibold text-gray-900 mb-1">Management &amp; communication</h2>
        <p class="text-xs text-gray-500 mb-3 leading-relaxed">
          Reach your foreman or project office for questions about this task. In-app messaging with management will
          appear here when your organization enables it.
        </p>
        <RouterLink
          :to="projectTasksListLocation"
          class="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-800 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          Open task list for project
        </RouterLink>
      </section>

      <!-- Personal notes / markers (device-local until backend sync) -->
      <section class="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 class="text-sm font-semibold text-gray-900 mb-1">Your notes &amp; markers</h2>
        <p class="text-xs text-gray-500 mb-2">
          Reminders for yourself (saved on this device only for now).
        </p>
        <textarea
          v-model="workerNotes"
          rows="4"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          placeholder="Materials to bring, access codes, follow-ups…"
          @blur="persistWorkerNotes"
        />
        <p v-if="notesSavedHint" class="text-xs text-green-700 mt-1.5">{{ notesSavedHint }}</p>
      </section>

      <!-- Status -->
      <section class="mb-6">
        <h2 class="text-sm font-semibold text-gray-900 mb-2">Status</h2>
        <select
          v-model="selectedStatus"
          :disabled="isSavingStatus"
          class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          @change="saveStatus"
        >
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <p v-if="task.progress_pct != null" class="text-xs text-gray-500 mt-1">
          Progress: {{ task.progress_pct }}%
        </p>
      </section>

      <!-- Photos (grouped by date) -->
      <section>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-gray-900">Photos</h2>
          <label class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white text-sm font-medium rounded-lg cursor-pointer hover:bg-orange-700">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              class="sr-only"
              @change="onFileSelected"
            />
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8v8H4V4h16z" />
            </svg>
            Add photo
          </label>
        </div>

        <div v-if="photosGroupedByDate.length === 0" class="bg-gray-50 rounded-xl border border-gray-200 border-dashed p-8 text-center">
          <p class="text-gray-500 text-sm">No photos yet.</p>
          <p class="text-gray-400 text-xs mt-1">Add photos to document progress.</p>
        </div>

        <div v-else class="space-y-6">
          <div v-for="group in photosGroupedByDate" :key="group.date" class="space-y-2">
            <h3 class="text-xs font-medium text-gray-500 uppercase tracking-wide">{{ group.dateLabel }}</h3>
            <div class="grid grid-cols-2 gap-2">
              <div
                v-for="photo in group.photos"
                :key="photo.id"
                class="aspect-square rounded-lg bg-gray-200 overflow-hidden"
              >
                <img
                  :src="photo.url"
                  :alt="photo.comment || 'Task photo'"
                  class="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>

    <div v-else class="text-center py-12 text-gray-500">
      <p>Task not found.</p>
      <div class="flex flex-col sm:flex-row gap-3 justify-center mt-4 text-sm">
        <RouterLink
          v-if="fromSchedule"
          to="/tasks/schedule"
          class="inline-flex items-center justify-center gap-1 text-orange-600 font-medium mx-auto"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Schedule
        </RouterLink>
        <template v-else>
          <RouterLink :to="projectTasksListLocation" class="text-orange-600 font-medium">Back to tasks</RouterLink>
          <RouterLink to="/tasks" class="text-orange-600 font-medium">All projects</RouterLink>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { ScheduleDayPart } from '@/core/utils/schedule-weeks-api'
import { useAuthStore } from '@/core/stores/auth'
import { tasksApi } from '@/core/utils/tasks-api'
import { MILESTONE_ICON } from '@/core/utils/task-utils'
import {
  isTaskRoleForeman,
  isUserInvolvedInTask,
  resolveSessionUserId,
} from '@/core/utils/task-role-ux'
import { isMilestone } from '@/core/types/task'
import type { Task } from '@/core/types/task'

export interface TaskPhoto {
  id: string
  task_id: string
  url: string
  created_at: string
  comment?: string
}

const route = useRoute()
const authStore = useAuthStore()
const projectId = computed(() => String(route.params.projectId))
const taskId = computed(() => String(route.params.taskId))

const fromSchedule = computed(() => route.query.from === 'schedule')

/** Task list for this project (same screen as after opening a project). */
const projectTasksListLocation = computed(() => ({
  path: `/tasks/project/${projectId.value}`,
  query: { from: 'project' },
}))

const scheduleWorkDate = computed(() => {
  const w = route.query.workDate
  return typeof w === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(w) ? w : ''
})

const scheduleDayPart = computed((): ScheduleDayPart | '' => {
  const p = route.query.dayPart
  if (p === 'am' || p === 'pm' || p === 'full') return p
  return ''
})

function scheduleDayPartLabel(part: ScheduleDayPart | ''): string {
  if (part === 'am') return 'Morning'
  if (part === 'pm') return 'Afternoon'
  if (part === 'full') return 'All day'
  return ''
}

const scheduleContextLine = computed(() => {
  const d = scheduleWorkDate.value
  if (!d) return ''
  const pretty = new Date(`${d}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const part = scheduleDayPart.value
  const pl = scheduleDayPartLabel(part)
  return pl ? `${pretty} · ${pl}` : pretty
})

const task = ref<Task | null>(null)
const isLoading = ref(true)
const selectedStatus = ref('')
const isSavingStatus = ref(false)

// Photos: local state until backend has task photos API
const photos = ref<TaskPhoto[]>([])

const workerNotes = ref('')
const notesSavedHint = ref('')

function workerNotesStorageKey(): string {
  return `fw_worker_task_notes_${projectId.value}_${taskId.value}`
}

function loadWorkerNotes(): void {
  try {
    workerNotes.value = localStorage.getItem(workerNotesStorageKey()) ?? ''
  } catch {
    workerNotes.value = ''
  }
}

function persistWorkerNotes(): void {
  try {
    localStorage.setItem(workerNotesStorageKey(), workerNotes.value)
    notesSavedHint.value = 'Saved on this device.'
    window.setTimeout(() => {
      notesSavedHint.value = ''
    }, 2500)
  } catch {
    notesSavedHint.value = 'Could not save (storage full or blocked).'
    window.setTimeout(() => {
      notesSavedHint.value = ''
    }, 3500)
  }
}

const statusOptions = [
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'delayed', label: 'Delayed' },
]

const photosGroupedByDate = computed(() => {
  const list = [...photos.value].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
  const byDate = new Map<string, TaskPhoto[]>()
  for (const p of list) {
    const d = p.created_at.slice(0, 10)
    if (!byDate.has(d)) byDate.set(d, [])
    byDate.get(d)!.push(p)
  }
  return Array.from(byDate.entries()).map(([date, groupPhotos]) => ({
    date,
    dateLabel: new Date(date + 'T12:00:00').toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    photos: groupPhotos,
  }))
})

function formatDateRange(start: string | undefined, end: string | undefined): string {
  const s = start ? new Date(start).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''
  const e = end ? new Date(end).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''
  if (s && e && s !== e) return `${s} – ${e}`
  return s || e || '—'
}

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !file.type.startsWith('image/')) return
  const url = URL.createObjectURL(file)
  photos.value = [
    ...photos.value,
    {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      task_id: taskId.value,
      url,
      created_at: new Date().toISOString(),
    },
  ]
  input.value = ''
  // TODO: when backend has POST /api/v1/projects/:id/tasks/:taskId/photos, upload here and replace url with server URL
}

async function loadTask() {
  const pid = Number(projectId.value)
  const tid = taskId.value
  if (!pid || !tid) return
  isLoading.value = true
  workerNotes.value = ''
  notesSavedHint.value = ''
  try {
    const loaded = await tasksApi.getById(pid, tid)
    const uid = resolveSessionUserId(authStore.currentUser)
    const foreman = isTaskRoleForeman(authStore.currentUser?.role_code, authStore.currentUser?.role_id)
    const openedFromPublishedSchedule =
      route.query.from === 'schedule' && authStore.currentUser?.role_category === 'task'
    if (
      !foreman &&
      uid != null &&
      loaded &&
      !isUserInvolvedInTask(loaded, uid) &&
      !openedFromPublishedSchedule
    ) {
      task.value = null
    } else {
      task.value = loaded
      selectedStatus.value = mapStatusFromBackend(task.value?.status)
      loadWorkerNotes()
    }
  } catch {
    task.value = null
  } finally {
    isLoading.value = false
  }
}

function mapStatusFromBackend(s: string | undefined): string {
  if (!s) return 'planned'
  const n = s.toLowerCase().replace(/-/g, '_').replace(/\s+/g, '_')
  const map: Record<string, string> = {
    planned: 'planned',
    in_progress: 'in_progress',
    done: 'done',
    blocked: 'blocked',
    delayed: 'delayed',
    completed: 'done',
    partially_completed: 'in_progress',
    ready_for_inspection: 'in_progress',
    delayed_due_to_issue: 'delayed',
    scheduled: 'planned',
    scheduled_accepted: 'planned',
  }
  return map[n] ?? 'planned'
}

async function saveStatus() {
  const pid = Number(projectId.value)
  const tid = taskId.value
  if (!pid || !tid || !task.value) return
  isSavingStatus.value = true
  try {
    const updated = await tasksApi.updateStatus(pid, tid, selectedStatus.value)
    task.value = updated
  } catch {
    selectedStatus.value = mapStatusFromBackend(task.value?.status)
  } finally {
    isSavingStatus.value = false
  }
}

onMounted(() => {
  loadTask()
})

watch([projectId, taskId], () => {
  loadTask()
})
</script>

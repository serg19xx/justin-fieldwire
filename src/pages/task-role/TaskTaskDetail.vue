<template>
  <div class="px-4 py-4 max-w-lg mx-auto pb-8">
    <!-- Back -->
    <RouterLink
      :to="`/tasks/project/${projectId}`"
      class="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700 mb-4"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Project
    </RouterLink>

    <div v-if="isLoading" class="flex justify-center py-12">
      <div class="animate-spin w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full" />
    </div>

    <template v-else-if="task">
      <!-- Task header -->
      <header class="mb-6">
        <div class="flex items-center gap-2">
          <span v-if="isMilestone(task.milestone)" class="text-amber-600">{{ MILESTONE_ICON }}</span>
          <h1 class="text-xl font-semibold text-gray-900">{{ task.name }}</h1>
        </div>
        <p class="text-sm text-gray-500 mt-1">
          {{ formatDateRange(task.start_planned, task.end_planned) }}
        </p>
        <p v-if="task.notes" class="text-sm text-gray-600 mt-2">{{ task.notes }}</p>
      </header>

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
      <RouterLink :to="`/tasks/project/${projectId}`" class="text-orange-600 font-medium mt-2 inline-block">Back to project</RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
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

const task = ref<Task | null>(null)
const isLoading = ref(true)
const selectedStatus = ref('')
const isSavingStatus = ref(false)

// Photos: local state until backend has task photos API
const photos = ref<TaskPhoto[]>([])

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
  try {
    const loaded = await tasksApi.getById(pid, tid)
    const uid = resolveSessionUserId(authStore.currentUser)
    const foreman = isTaskRoleForeman(authStore.currentUser?.role_code, authStore.currentUser?.role_id)
    if (!foreman && uid != null && loaded && !isUserInvolvedInTask(loaded, uid)) {
      task.value = null
    } else {
      task.value = loaded
      selectedStatus.value = mapStatusFromBackend(task.value?.status)
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

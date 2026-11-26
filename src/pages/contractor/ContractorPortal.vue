<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/core/stores/auth'
import {
  fetchContractorWorkspace,
  contractorPlanDownloadUrl,
  type ContractorPortalTask,
  type ContractorPortalWorkspace,
} from '@/core/utils/task-access-key-api'
import { api } from '@/core/utils/api'

const router = useRouter()
const authStore = useAuthStore()

const isLoading = ref(true)
const errorMessage = ref('')
const workspace = ref<ContractorPortalWorkspace | null>(null)
const photoUrls = ref<Record<number, string>>({})
const activeTab = ref<'tasks' | 'calendar' | 'plans'>('tasks')
const selectedTaskId = ref<number | null>(null)

const tasks = computed(() => {
  const list = workspace.value?.tasks
  if (list && list.length > 0) return list
  return workspace.value?.task ? [workspace.value.task] : []
})

const selectedTask = computed<ContractorPortalTask | null>(() => {
  if (!tasks.value.length) return null
  const id = selectedTaskId.value
  return tasks.value.find((t) => t.id === id) || tasks.value[0] || null
})

const selectedTaskPhotos = computed(() => {
  const taskId = selectedTask.value?.id
  if (!taskId || !workspace.value) return []
  return (workspace.value.field_photos || []).filter((p) => !p.task_id || p.task_id === taskId)
})

const calendarRows = computed(() => workspace.value?.calendar || tasks.value.map((t) => ({
  task_id: t.id,
  name: t.name,
  status: t.status,
  start_planned: t.start_planned,
  end_planned: t.end_planned,
  start_time: t.start_time,
  end_time: t.end_time,
  category: t.category,
})))

const planRows = computed(() => workspace.value?.plans || [])

async function loadWorkspace() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    workspace.value = await fetchContractorWorkspace()
    selectedTaskId.value = workspace.value.task?.id ?? workspace.value.tasks?.[0]?.id ?? null
    await loadPhotoPreviews()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } }
    errorMessage.value = err.response?.data?.message || 'Failed to load task access'
  } finally {
    isLoading.value = false
  }
}

async function loadPhotoPreviews() {
  const photos = workspace.value?.field_photos || []
  for (const photo of photos) {
    try {
      const res = await api.get(`/api/v1/contractor-portal/field-photos/${photo.id}/download`, {
        responseType: 'blob',
      })
      photoUrls.value[photo.id] = URL.createObjectURL(res.data)
    } catch {
      photoUrls.value[photo.id] = ''
    }
  }
}

async function openPlan(fileId: number, preview: boolean) {
  try {
    const res = await api.get(contractorPlanDownloadUrl(fileId, preview), { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    window.open(url, '_blank', 'noopener,noreferrer')
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch {
    errorMessage.value = 'Failed to open plan file'
  }
}

async function logout() {
  await authStore.logout()
  router.replace('/login')
}

onMounted(() => {
  void loadWorkspace()
})
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <header class="bg-emerald-800 text-white px-4 py-3 flex items-center justify-between">
      <div>
        <p class="text-xs uppercase tracking-wide text-emerald-100">Contractor access</p>
        <h1 class="text-lg font-semibold">
          {{ workspace?.project?.name || workspace?.task.project_name || 'Project' }}
        </h1>
        <p v-if="workspace?.contractor?.name" class="text-sm text-emerald-100">
          {{ workspace.contractor.name }}
          <span v-if="workspace.contractor.trade"> · {{ workspace.contractor.trade }}</span>
        </p>
      </div>
      <button
        type="button"
        class="px-3 py-1.5 text-sm rounded-md bg-emerald-700 hover:bg-emerald-600"
        @click="logout"
      >
        Sign out
      </button>
    </header>

    <main class="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <div v-if="isLoading" class="text-sm text-gray-500">Loading…</div>
      <div v-else-if="errorMessage" class="p-3 bg-red-50 text-red-700 rounded-md text-sm">
        {{ errorMessage }}
      </div>
      <template v-else-if="workspace">
        <p v-if="workspace.key_expires_at" class="text-xs text-amber-700">
          Access key expires: {{ workspace.key_expires_at }}
        </p>

        <div class="flex gap-2">
          <button
            type="button"
            class="px-3 py-1.5 text-sm rounded-md border"
            :class="activeTab === 'tasks' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-gray-700 border-gray-300'"
            @click="activeTab = 'tasks'"
          >
            Tasks ({{ tasks.length }})
          </button>
          <button
            type="button"
            class="px-3 py-1.5 text-sm rounded-md border"
            :class="activeTab === 'calendar' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-gray-700 border-gray-300'"
            @click="activeTab = 'calendar'"
          >
            Calendar
          </button>
          <button
            type="button"
            class="px-3 py-1.5 text-sm rounded-md border"
            :class="activeTab === 'plans' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-gray-700 border-gray-300'"
            @click="activeTab = 'plans'"
          >
            Plans ({{ planRows.length }})
          </button>
        </div>

        <template v-if="activeTab === 'tasks'">
          <section class="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <ul class="divide-y divide-gray-100">
              <li v-for="task in tasks" :key="task.id">
                <button
                  type="button"
                  class="w-full text-left px-4 py-3 hover:bg-gray-50"
                  :class="selectedTask?.id === task.id ? 'bg-emerald-50' : ''"
                  @click="selectedTaskId = task.id"
                >
                  <div class="font-medium text-gray-900">{{ task.name }}</div>
                  <div class="text-xs text-gray-500 mt-0.5">
                    {{ task.status || '—' }}
                    <span v-if="task.start_planned"> · {{ task.start_planned }}</span>
                    <span v-if="task.end_planned"> → {{ task.end_planned }}</span>
                  </div>
                </button>
              </li>
            </ul>
          </section>

          <section v-if="selectedTask" class="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
            <h2 class="text-xl font-semibold text-gray-900">{{ selectedTask.name }}</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
              <p v-if="selectedTask.address">
                <span class="text-gray-500">Address:</span> {{ selectedTask.address }}
              </p>
              <p v-if="selectedTask.category">
                <span class="text-gray-500">Category:</span> {{ selectedTask.category }}
              </p>
              <p>
                <span class="text-gray-500">Dates:</span>
                {{ selectedTask.start_planned || '—' }}
                <span v-if="selectedTask.end_planned"> → {{ selectedTask.end_planned }}</span>
              </p>
              <p><span class="text-gray-500">Status:</span> {{ selectedTask.status || '—' }}</p>
            </div>
            <p
              v-if="selectedTask.notes"
              class="text-sm text-gray-700 whitespace-pre-wrap border-t border-gray-100 pt-3 mt-3"
            >
              {{ selectedTask.notes }}
            </p>
          </section>

          <section class="bg-white border border-gray-200 rounded-lg p-4">
            <h3 class="text-base font-medium text-gray-900 mb-3">Task materials (photos)</h3>
            <p v-if="selectedTaskPhotos.length === 0" class="text-sm text-gray-500">
              No field photos for this task yet.
            </p>
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <figure
                v-for="photo in selectedTaskPhotos"
                :key="photo.id"
                class="border border-gray-100 rounded-md overflow-hidden bg-gray-50"
              >
                <img
                  v-if="photoUrls[photo.id]"
                  :src="photoUrls[photo.id]"
                  :alt="photo.original_name || 'Photo'"
                  class="w-full h-48 object-cover"
                />
                <div v-else class="h-48 flex items-center justify-center text-xs text-gray-400">
                  Preview unavailable
                </div>
                <figcaption class="px-2 py-1.5 text-xs text-gray-600">
                  {{ photo.slot || 'photo' }}
                  <span v-if="photo.work_date"> · {{ photo.work_date }}</span>
                  <span v-if="photo.original_name"> · {{ photo.original_name }}</span>
                </figcaption>
              </figure>
            </div>
          </section>
        </template>

        <section v-else-if="activeTab === 'calendar'" class="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-100">
            <h2 class="text-base font-medium text-gray-900">Your schedule on this project</h2>
            <p class="text-xs text-gray-500 mt-1">Dates from tasks assigned to you</p>
          </div>
          <p v-if="calendarRows.length === 0" class="p-4 text-sm text-gray-500">No scheduled tasks.</p>
          <ul v-else class="divide-y divide-gray-100">
            <li v-for="row in calendarRows" :key="row.task_id" class="px-4 py-3">
              <div class="font-medium text-gray-900">{{ row.name }}</div>
              <div class="text-sm text-gray-600 mt-1">
                {{ row.start_planned || '—' }}
                <span v-if="row.end_planned"> → {{ row.end_planned }}</span>
                <span v-if="row.start_time"> · {{ row.start_time }}</span>
                <span v-if="row.end_time">–{{ row.end_time }}</span>
              </div>
              <div class="text-xs text-gray-500 mt-0.5">
                {{ row.status || '—' }}
                <span v-if="row.category"> · {{ row.category }}</span>
              </div>
            </li>
          </ul>
        </section>

        <section v-else class="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-100">
            <h2 class="text-base font-medium text-gray-900">Project plans</h2>
            <p class="text-xs text-gray-500 mt-1">Drawings and documents for this project</p>
          </div>
          <p v-if="planRows.length === 0" class="p-4 text-sm text-gray-500">No plan files yet.</p>
          <ul v-else class="divide-y divide-gray-100">
            <li
              v-for="plan in planRows"
              :key="plan.id"
              class="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
            >
              <div>
                <div class="font-medium text-gray-900">{{ plan.original_name || `File #${plan.id}` }}</div>
                <div class="text-xs text-gray-500">
                  {{ plan.folder_name || 'Folder' }}
                  <span v-if="plan.file_size"> · {{ Math.round(plan.file_size / 1024) }} KB</span>
                </div>
              </div>
              <div class="flex gap-2">
                <button
                  type="button"
                  class="px-2 py-1 text-xs text-emerald-800 border border-emerald-200 rounded hover:bg-emerald-50"
                  @click="openPlan(plan.id, true)"
                >
                  Open
                </button>
                <button
                  type="button"
                  class="px-2 py-1 text-xs text-blue-700 border border-blue-200 rounded hover:bg-blue-50"
                  @click="openPlan(plan.id, false)"
                >
                  Download
                </button>
              </div>
            </li>
          </ul>
        </section>
      </template>
    </main>
  </div>
</template>

<template>
  <div class="photos-section flex flex-1 flex-col">
    <div class="mb-6 rounded-lg bg-white p-6 shadow">
      <h2 class="mb-1 text-xl font-semibold text-gray-900">Project Photos</h2>
      <p class="text-sm text-gray-600">
        Photos taken on site for each task (before and after work) and pictures the project manager added to tasks.
        To add a picture to a task, open the task and use <span class="font-medium">Add pictures</span>.
      </p>
    </div>

    <div class="mb-6 rounded-lg bg-white p-4 shadow">
      <div class="flex flex-col gap-3 sm:flex-row">
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search by task, category or uploader…"
          class="w-full flex-1 rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div class="flex flex-wrap gap-2">
          <select
            v-model="selectedTaskId"
            class="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:flex-none"
          >
            <option value="">All tasks</option>
            <option v-for="task in taskOptions" :key="task.id" :value="String(task.id)">{{ task.name }}</option>
          </select>
          <select
            v-model="selectedSlot"
            class="rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All photos</option>
            <option v-for="(label, slot) in PHOTO_SLOT_LABELS" :key="slot" :value="slot">{{ label }}</option>
          </select>
          <select
            v-model="sortBy"
            class="rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="task">By task</option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="rounded-lg bg-white p-10 text-center text-gray-500 shadow">Loading photos…</div>

    <div v-else-if="loadError" class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      {{ loadError }}
    </div>

    <ul v-else-if="visiblePhotos.length" class="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      <li v-for="photo in visiblePhotos" :key="photo.id">
        <button
          type="button"
          class="block w-full overflow-hidden rounded-lg bg-white text-left shadow transition-shadow hover:shadow-lg"
          @click="openPhoto(photo)"
        >
          <div class="relative aspect-square bg-gray-100">
            <img
              v-if="previewUrls[photo.id]"
              :src="previewUrls[photo.id]"
              :alt="`${photo.task_name} – ${PHOTO_SLOT_LABELS[photo.slot]}`"
              class="h-full w-full object-cover"
              loading="lazy"
            />
            <span v-else class="flex h-full items-center justify-center text-sm text-gray-400">
              {{ failedIds[photo.id] ? 'Photo unavailable' : 'Loading…' }}
            </span>
            <span
              class="absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium"
              :class="PHOTO_SLOT_BADGES[photo.slot]"
            >
              {{ PHOTO_SLOT_LABELS[photo.slot] }}
            </span>
          </div>
          <div class="p-3">
            <p class="truncate text-sm font-medium text-gray-900" :title="photo.task_name">{{ photo.task_name }}</p>
            <p class="mt-0.5 text-xs text-gray-500">{{ formatTaskDate(photo.work_date) }}</p>
            <p v-if="photo.uploaded_by_name" class="truncate text-xs text-gray-500">{{ photo.uploaded_by_name }}</p>
          </div>
        </button>
      </li>
    </ul>

    <div v-else class="rounded-lg bg-white p-10 text-center shadow">
      <p class="text-gray-600">{{ photos.length ? 'No photos match the filters.' : 'No photos in this project yet.' }}</p>
      <p v-if="!photos.length" class="mt-1 text-sm text-gray-500">
        Photos appear here when the crew takes them on site or the project manager adds pictures to a task.
      </p>
    </div>

    <PhotoLightbox :image-url="lightboxUrl" :caption="lightboxCaption" @close="openPhotoId = null" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PhotoLightbox from '@/components/tasks/PhotoLightbox.vue'
import { useTaskPhotoPreviews } from '@/composables/useTaskPhotoPreviews'
import {
  taskFieldPhotosApi,
  type ProjectTaskPhoto,
  type TaskPhotoSlot,
} from '@/core/utils/task-field-photos-api'
import { formatTaskDate } from '@/core/utils/task-utils'

interface Props {
  projectId?: number | null
  /** Client portals pass the project object instead of the id */
  project?: { id?: number | string | null } | null
  canEdit?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  projectId: null,
  project: null,
  canEdit: false,
})

type SortOption = 'newest' | 'oldest' | 'task'

const PHOTO_SLOT_LABELS: Record<TaskPhotoSlot, string> = {
  before: 'Before work',
  after: 'After work',
  reference: 'From PM',
}

const PHOTO_SLOT_BADGES: Record<TaskPhotoSlot, string> = {
  before: 'bg-blue-100 text-blue-800',
  after: 'bg-green-100 text-green-800',
  reference: 'bg-purple-100 text-purple-800',
}

const { previewUrls, failedIds, loadPreviews } = useTaskPhotoPreviews()

const photos = ref<ProjectTaskPhoto[]>([])
const isLoading = ref(false)
const loadError = ref('')
const searchQuery = ref('')
const selectedTaskId = ref('')
const selectedSlot = ref<TaskPhotoSlot | ''>('')
const sortBy = ref<SortOption>('newest')
const openPhotoId = ref<number | null>(null)

const resolvedProjectId = computed(() => {
  const n = Number(props.projectId ?? props.project?.id)
  return Number.isFinite(n) && n > 0 ? n : null
})

const taskOptions = computed(() => {
  const byId = new Map<number, string>()
  photos.value.forEach((p) => byId.set(p.task_id, p.task_name || `Task #${p.task_id}`))
  return [...byId.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name))
})

const visiblePhotos = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const list = photos.value.filter((p) => {
    if (selectedTaskId.value && String(p.task_id) !== selectedTaskId.value) return false
    if (selectedSlot.value && p.slot !== selectedSlot.value) return false
    if (!query) return true
    return [p.task_name, p.task_category ?? '', p.uploaded_by_name, p.original_name].some((field) =>
      field.toLowerCase().includes(query),
    )
  })
  const byTime = (a: ProjectTaskPhoto, b: ProjectTaskPhoto) => a.uploaded_at.localeCompare(b.uploaded_at)
  if (sortBy.value === 'oldest') return list.sort(byTime)
  if (sortBy.value === 'task') {
    return list.sort((a, b) => a.task_name.localeCompare(b.task_name) || byTime(b, a))
  }
  return list.sort((a, b) => byTime(b, a))
})

const openedPhoto = computed(() => photos.value.find((p) => p.id === openPhotoId.value) ?? null)
const lightboxUrl = computed(() => (openedPhoto.value ? previewUrls[openedPhoto.value.id] ?? null : null))
const lightboxCaption = computed(() => {
  const p = openedPhoto.value
  if (!p) return ''
  const by = p.uploaded_by_name ? ` · ${p.uploaded_by_name}` : ''
  return `${p.task_name} · ${PHOTO_SLOT_LABELS[p.slot]} · ${formatTaskDate(p.work_date)}${by}`
})

function openPhoto(photo: ProjectTaskPhoto): void {
  if (previewUrls[photo.id]) openPhotoId.value = photo.id
}

async function loadPhotos(): Promise<void> {
  const pid = resolvedProjectId.value
  if (pid == null) {
    photos.value = []
    return
  }
  isLoading.value = true
  loadError.value = ''
  try {
    photos.value = await taskFieldPhotosApi.listProject(pid)
    void loadPreviews(photos.value)
  } catch {
    photos.value = []
    loadError.value = 'Could not load project photos.'
  } finally {
    isLoading.value = false
  }
}

watch(resolvedProjectId, loadPhotos, { immediate: true })
</script>

<template>
  <section class="rounded-lg border border-gray-200 bg-white p-4">
    <div class="mb-3 flex items-center justify-between gap-3">
      <h3 class="text-sm font-semibold text-gray-900">{{ title }}</h3>
      <label
        v-if="canAddReference && hasTask"
        class="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        :class="{ 'pointer-events-none opacity-60': isUploading }"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        {{ isUploading ? 'Uploading…' : 'Add pictures' }}
        <input type="file" accept="image/*" multiple class="sr-only" :disabled="isUploading" @change="onFilesSelected" />
      </label>
    </div>

    <p v-if="!hasTask" class="text-sm text-gray-500">Save the task first, then add pictures to it.</p>

    <template v-else>
      <p v-if="message" class="mb-3 text-xs" :class="isError ? 'text-red-700' : 'text-green-700'" role="status">
        {{ message }}
      </p>

      <div v-if="isLoading" class="py-4 text-center text-sm text-gray-500">Loading pictures…</div>

      <template v-else>
        <div class="mb-4">
          <h4 class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">From the project manager</h4>
          <p v-if="referencePhotos.length === 0" class="text-sm text-gray-500">
            {{ canAddReference ? 'No pictures yet. Add a picture to explain the task.' : 'No pictures from the project manager.' }}
          </p>
          <ul v-else class="grid grid-cols-3 gap-2 sm:grid-cols-4">
            <li v-for="photo in referencePhotos" :key="photo.id" class="relative">
              <button
                type="button"
                class="block aspect-square w-full overflow-hidden rounded-md bg-gray-100"
                :aria-label="`Open ${photo.original_name}`"
                @click="openPhoto(photo)"
              >
                <img
                  v-if="previewUrls[photo.id]"
                  :src="previewUrls[photo.id]"
                  :alt="photo.original_name"
                  class="h-full w-full object-cover"
                  loading="lazy"
                />
                <span v-else class="flex h-full items-center justify-center text-xs text-gray-400">
                  {{ failedIds[photo.id] ? 'Unavailable' : 'Loading…' }}
                </span>
              </button>
              <button
                v-if="canAddReference"
                type="button"
                class="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-red-600 shadow hover:bg-white"
                :aria-label="`Delete ${photo.original_name}`"
                @click="removeReference(photo)"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          </ul>
        </div>

        <div v-if="showFieldPhotos">
          <h4 class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Photos from the site</h4>
          <p v-if="fieldPhotoDays.length === 0" class="text-sm text-gray-500">No photos taken on site yet.</p>
          <div v-for="day in fieldPhotoDays" :key="day.workDate" class="mb-3 last:mb-0">
            <p class="mb-1.5 text-xs text-gray-600">{{ formatTaskDate(day.workDate) }}</p>
            <ul class="grid grid-cols-3 gap-2 sm:grid-cols-4">
              <li v-for="photo in day.photos" :key="photo.id">
                <button
                  type="button"
                  class="relative block aspect-square w-full overflow-hidden rounded-md bg-gray-100"
                  :aria-label="`Open ${photo.original_name}`"
                  @click="openPhoto(photo)"
                >
                  <img
                    v-if="previewUrls[photo.id]"
                    :src="previewUrls[photo.id]"
                    :alt="photo.original_name"
                    class="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <span v-else class="flex h-full items-center justify-center text-xs text-gray-400">
                    {{ failedIds[photo.id] ? 'Unavailable' : 'Loading…' }}
                  </span>
                  <span
                    class="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white"
                  >
                    {{ PHOTO_SLOT_LABELS[photo.slot] }}
                  </span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </template>
    </template>

    <PhotoLightbox :image-url="lightboxUrl" :caption="lightboxCaption" @close="closePhoto" />
  </section>
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
import { fileToCompressedUploadFile, isAcceptedImageFile } from '@/core/utils/task-field-photos-storage'
import { formatTaskDate } from '@/core/utils/task-utils'
import { todayWorkYmd } from '@/core/utils/work-day'

interface Props {
  projectId: number
  taskId?: number | string | null
  /** PM / admin may add and delete reference pictures */
  canAddReference?: boolean
  /** Field before/after photos from all work days */
  showFieldPhotos?: boolean
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  taskId: null,
  canAddReference: false,
  showFieldPhotos: true,
  title: 'Pictures',
})

const PHOTO_SLOT_LABELS: Record<TaskPhotoSlot, string> = {
  before: 'Before',
  after: 'After',
  reference: 'From PM',
}

const { previewUrls, failedIds, loadPreviews, forgetPreview } = useTaskPhotoPreviews()

const photos = ref<ProjectTaskPhoto[]>([])
const isLoading = ref(false)
const isUploading = ref(false)
const message = ref('')
const isError = ref(false)
const openPhotoId = ref<number | null>(null)

const numericTaskId = computed(() => {
  const n = Number(props.taskId)
  return Number.isFinite(n) && n > 0 ? n : null
})
const hasTask = computed(() => numericTaskId.value != null && props.projectId > 0)

const referencePhotos = computed(() =>
  photos.value.filter((p) => p.slot === 'reference').sort((a, b) => a.uploaded_at.localeCompare(b.uploaded_at)),
)

const fieldPhotoDays = computed(() => {
  const byDay = new Map<string, ProjectTaskPhoto[]>()
  for (const photo of photos.value) {
    if (photo.slot === 'reference') continue
    const list = byDay.get(photo.work_date) ?? []
    list.push(photo)
    byDay.set(photo.work_date, list)
  }
  const slotOrder = (slot: TaskPhotoSlot) => (slot === 'before' ? 0 : 1)
  return [...byDay.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([workDate, list]) => ({
      workDate,
      photos: list.sort((a, b) => slotOrder(a.slot) - slotOrder(b.slot) || a.uploaded_at.localeCompare(b.uploaded_at)),
    }))
})

const openedPhoto = computed(() => photos.value.find((p) => p.id === openPhotoId.value) ?? null)
const lightboxUrl = computed(() => (openedPhoto.value ? previewUrls[openedPhoto.value.id] ?? null : null))
const lightboxCaption = computed(() => {
  const p = openedPhoto.value
  if (!p) return ''
  const by = p.uploaded_by_name ? ` · ${p.uploaded_by_name}` : ''
  return `${PHOTO_SLOT_LABELS[p.slot]} · ${formatTaskDate(p.work_date)}${by}`
})

function openPhoto(photo: ProjectTaskPhoto): void {
  if (previewUrls[photo.id]) openPhotoId.value = photo.id
}

function closePhoto(): void {
  openPhotoId.value = null
}

function setMessage(text: string, error = false): void {
  message.value = text
  isError.value = error
}

async function load(): Promise<void> {
  if (!hasTask.value || numericTaskId.value == null) {
    photos.value = []
    return
  }
  isLoading.value = true
  try {
    const all = await taskFieldPhotosApi.listProject(props.projectId, numericTaskId.value)
    photos.value = props.showFieldPhotos ? all : all.filter((p) => p.slot === 'reference')
    void loadPreviews(photos.value)
  } catch {
    photos.value = []
    setMessage('Could not load pictures.', true)
  } finally {
    isLoading.value = false
  }
}

async function onFilesSelected(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (!files.length || numericTaskId.value == null) return
  const images = files.filter(isAcceptedImageFile)
  if (images.length < files.length) {
    setMessage('Some files were skipped because they are not supported images.', true)
  } else {
    setMessage('')
  }
  if (!images.length) return
  isUploading.value = true
  let uploaded = 0
  try {
    for (const file of images) {
      const uploadFile = await fileToCompressedUploadFile(file)
      await taskFieldPhotosApi.upload(props.projectId, numericTaskId.value, 'reference', todayWorkYmd(), uploadFile)
      uploaded += 1
    }
    setMessage(uploaded === 1 ? 'Picture added.' : `${uploaded} pictures added.`)
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } }
    setMessage(err.response?.data?.message || 'Upload failed. Try again.', true)
  } finally {
    isUploading.value = false
    await load()
  }
}

async function removeReference(photo: ProjectTaskPhoto): Promise<void> {
  if (!window.confirm('Delete this picture?')) return
  try {
    await taskFieldPhotosApi.remove(photo.project_id, photo.task_id, photo.id)
    photos.value = photos.value.filter((p) => p.id !== photo.id)
    forgetPreview(photo.id)
    setMessage('Picture deleted.')
  } catch {
    setMessage('Could not delete the picture.', true)
  }
}

watch(() => [props.projectId, props.taskId], load, { immediate: true })
</script>

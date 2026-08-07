<template>
  <div class="space-y-5">
    <!-- Day clock-in lives on Schedule (per shift / day), not on the multi-day task -->
    <section
      v-if="!hideDayClockInBanner"
      class="rounded-xl border border-blue-200 bg-blue-50/60 p-4 shadow-sm"
    >
      <h2 class="text-sm font-semibold text-gray-900 mb-1">Day start / end (timesheet)</h2>
      <p class="text-xs text-gray-600 mb-2">
        Clock in and out
        <strong class="font-medium text-gray-800">once per working day</strong>
        on Schedule — by project and place for that day. This task may span several days; a single
        Start/End on the task itself is not used.
      </p>
      <p v-if="plannedHint" class="text-xs text-gray-700 mb-3 font-medium">
        Task planned: {{ plannedHint }}
      </p>
      <RouterLink
        to="/tasks/schedule"
        class="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
      >
        Open Schedule — Start / End for today
      </RouterLink>
    </section>

    <!-- Photos (optional) -->
    <section class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 class="text-sm font-semibold text-gray-900 mb-1">
        Site photos <span class="text-gray-400 font-normal">(optional)</span>
      </h2>
      <p class="text-xs text-gray-500 mb-4">
        Before and after photos. Saved on the server and included in the project daily report.
        On Mac/PC use <strong class="font-medium text-gray-600">JPG or PNG</strong> (if Photos exports HEIC, choose “Export as JPEG”).
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div v-for="slot in photoSlots" :key="slot.id" class="space-y-2">
          <p class="text-xs font-medium text-gray-700">{{ slot.label }}</p>

          <div v-if="slot.photos.length" class="space-y-2">
            <div
              v-for="photo in slot.photos"
              :key="photo.id"
              class="relative aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 bg-gray-100"
            >
              <img :src="photo.previewUrl" :alt="slot.label" class="w-full h-full object-cover" />
              <button
                v-if="canEdit && !isLocked"
                type="button"
                class="absolute top-2 right-2 rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-red-700 shadow"
                @click="removePhoto(slot.id, photo.id)"
              >
                Remove
              </button>
            </div>
          </div>
          <p v-else-if="!canEdit || isLocked" class="text-xs text-gray-400 italic py-2">No photos</p>

          <label
            v-if="canEdit && !isLocked && !slot.loading && slot.photos.length < maxPhotosPerSlot"
            class="flex flex-col items-center justify-center min-h-[5.5rem] rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:border-orange-400 hover:bg-orange-50/50 px-3 py-4"
          >
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              multiple
              class="sr-only"
              @change="onPhotoSelected($event, slot.id)"
            />
            <span class="text-xl mb-0.5" aria-hidden="true">📷</span>
            <span class="text-xs font-medium text-gray-600">Add photo</span>
            <span class="text-[10px] text-gray-400 mt-1 text-center">JPG or PNG · multiple allowed</span>
          </label>

          <div
            v-else-if="slot.loading"
            class="flex flex-col items-center justify-center min-h-[5.5rem] rounded-lg border border-gray-200 bg-gray-50"
          >
            <div class="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full" />
            <span class="text-xs text-gray-500 mt-2">Processing…</span>
          </div>

          <p v-if="slot.photos.length >= maxPhotosPerSlot" class="text-[10px] text-gray-500">
            Maximum {{ maxPhotosPerSlot }} photos in this section.
          </p>
          <p v-if="slot.error" class="text-xs text-red-600">{{ slot.error }}</p>
        </div>
      </div>
    </section>

    <!-- Foreman notes -->
    <section class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 class="text-sm font-semibold text-gray-900 mb-1">Your notes &amp; additions</h2>
      <p class="text-xs text-gray-500 mb-3">
        General site report for the PM (materials, access issues, handoff). Day hours are recorded on Schedule.
      </p>
      <textarea
        v-model="fieldNotesDraft"
        rows="5"
        class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50"
        placeholder="Materials used, access issues, handoff to PM…"
        :disabled="!canEdit || isSaving || isLocked"
        @blur="saveFieldNotes"
      />
      <p v-if="notesMessage" class="text-xs mt-2" :class="notesError ? 'text-red-700' : 'text-green-700'">
        {{ notesMessage }}
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import type { Task } from '@/core/types/task'
import { formatPlannedWorkHint } from '@/core/utils/task-field-work-datetime'
import { tasksApi } from '@/core/utils/tasks-api'
import {
  taskFieldPhotosApi,
  resolveFieldWorkPhotoWorkDate,
  type TaskFieldPhotoUiRecord,
} from '@/core/utils/task-field-photos-api'
import {
  fileToCompressedUploadFile,
  isAcceptedImageFile,
  MAX_TASK_FIELD_PHOTOS_PER_SLOT,
  type TaskFieldPhotoSlot,
} from '@/core/utils/task-field-photos-storage'

const props = withDefaults(
  defineProps<{
    projectId: number
    taskId: string
    task: Task
    canEdit: boolean
    isLocked: boolean
    /** Selected work day (YYYY-MM-DD) for copy / photo date. */
    workYmd?: string
    /** When parent already shows day Start/End, hide the schedule CTA banner. */
    hideDayClockInBanner?: boolean
  }>(),
  {
    workYmd: '',
    hideDayClockInBanner: false,
  },
)

const emit = defineEmits<{
  updated: [task: Task]
}>()

const fieldNotesDraft = ref(props.task.field_notes ?? '')
const isSaving = ref(false)
const notesMessage = ref('')
const notesError = ref(false)

const photoBefore = ref<TaskFieldPhotoUiRecord[]>([])
const photoAfter = ref<TaskFieldPhotoUiRecord[]>([])
const photoBeforeError = ref('')
const photoAfterError = ref('')
const photoBeforeLoading = ref(false)
const photoAfterLoading = ref(false)

const maxPhotosPerSlot = MAX_TASK_FIELD_PHOTOS_PER_SLOT
/** Photos keyed by selected work day (or today). */
const photoWorkDate = computed(() =>
  resolveFieldWorkPhotoWorkDate(props.workYmd || null),
)
const numericTaskId = computed(() => Number(props.taskId))

const plannedHint = computed(() =>
  formatPlannedWorkHint(
    props.task.start_planned,
    props.task.end_planned,
    props.task.start_time,
    props.task.end_time,
  ),
)

function revokePhotoPreviewUrls(photos: TaskFieldPhotoUiRecord[]): void {
  for (const photo of photos) {
    if (photo.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(photo.previewUrl)
    }
  }
}

async function attachPreviewUrls(
  photos: Awaited<ReturnType<typeof taskFieldPhotosApi.fetch>>['before'],
): Promise<TaskFieldPhotoUiRecord[]> {
  const taskId = numericTaskId.value
  if (!Number.isFinite(taskId) || taskId <= 0) return []
  return Promise.all(
    photos.map(async (photo) => {
      const blob = await taskFieldPhotosApi.download(props.projectId, taskId, photo.id, true)
      return {
        ...photo,
        previewUrl: URL.createObjectURL(blob),
      }
    }),
  )
}

async function loadPhotos(): Promise<void> {
  revokePhotoPreviewUrls([...photoBefore.value, ...photoAfter.value])
  photoBefore.value = []
  photoAfter.value = []
  photoBeforeError.value = ''
  photoAfterError.value = ''

  const taskId = numericTaskId.value
  if (!Number.isFinite(taskId) || taskId <= 0) return

  try {
    const data = await taskFieldPhotosApi.fetch(props.projectId, taskId, photoWorkDate.value)
    const [before, after] = await Promise.all([
      attachPreviewUrls(data.before),
      attachPreviewUrls(data.after),
    ])
    photoBefore.value = before
    photoAfter.value = after
  } catch {
    photoBeforeError.value = 'Could not load photos from server.'
  }
}

onBeforeUnmount(() => {
  revokePhotoPreviewUrls([...photoBefore.value, ...photoAfter.value])
})

const photoSlots = computed(() => [
  {
    id: 'before' as const,
    label: 'Before work',
    photos: photoBefore.value,
    error: photoBeforeError.value,
    loading: photoBeforeLoading.value,
  },
  {
    id: 'after' as const,
    label: 'After work',
    photos: photoAfter.value,
    error: photoAfterError.value,
    loading: photoAfterLoading.value,
  },
])

watch(
  () => [props.task, props.projectId, props.taskId, photoWorkDate.value] as const,
  ([task]) => {
    fieldNotesDraft.value = task.field_notes ?? ''
    void loadPhotos()
  },
  { immediate: true, deep: true },
)

async function saveFieldNotes(): Promise<void> {
  if (!props.canEdit) return
  const next = fieldNotesDraft.value.trim()
  const prev = (props.task.field_notes ?? '').trim()
  if (next === prev) return
  isSaving.value = true
  notesMessage.value = ''
  notesError.value = false
  try {
    const updated = await tasksApi.updateFieldWork(props.projectId, props.taskId, {
      field_notes: next || null,
    })
    emit('updated', updated)
    fieldNotesDraft.value = updated.field_notes ?? ''
    notesMessage.value = 'Notes saved.'
  } catch {
    notesError.value = true
    notesMessage.value = 'Could not save notes.'
  } finally {
    isSaving.value = false
  }
}

async function onPhotoSelected(event: Event, slot: TaskFieldPhotoSlot): Promise<void> {
  const input = event.target as HTMLInputElement
  const files = input.files ? Array.from(input.files) : []
  input.value = ''
  if (!files.length) return

  const taskId = numericTaskId.value
  if (!Number.isFinite(taskId) || taskId <= 0) return

  const errRef = slot === 'before' ? photoBeforeError : photoAfterError
  const loadingRef = slot === 'before' ? photoBeforeLoading : photoAfterLoading
  const listRef = slot === 'before' ? photoBefore : photoAfter

  errRef.value = ''
  loadingRef.value = true

  let added = 0
  const errors: string[] = []

  try {
    for (const file of files) {
      if (listRef.value.length + added >= maxPhotosPerSlot) {
        errors.push(`Maximum ${maxPhotosPerSlot} photos per section.`)
        break
      }
      if (!isAcceptedImageFile(file)) {
        errors.push(`${file.name}: not a supported image.`)
        continue
      }
      try {
        const uploadFile = await fileToCompressedUploadFile(file)
        const saved = await taskFieldPhotosApi.upload(
          props.projectId,
          taskId,
          slot,
          photoWorkDate.value,
          uploadFile,
        )
        const blob = await taskFieldPhotosApi.download(props.projectId, taskId, saved.id, true)
        listRef.value = [
          ...listRef.value,
          { ...saved, previewUrl: URL.createObjectURL(blob) },
        ]
        added += 1
      } catch {
        errors.push(`${file.name}: upload failed.`)
      }
    }
  } finally {
    loadingRef.value = false
    if (errors.length) errRef.value = errors.join(' ')
  }
}

async function removePhoto(slot: TaskFieldPhotoSlot, photoId: number): Promise<void> {
  const taskId = numericTaskId.value
  if (!Number.isFinite(taskId) || taskId <= 0) return
  const listRef = slot === 'before' ? photoBefore : photoAfter
  const errRef = slot === 'before' ? photoBeforeError : photoAfterError
  try {
    await taskFieldPhotosApi.remove(props.projectId, taskId, photoId)
    const next = listRef.value.filter((p) => p.id !== photoId)
    const removed = listRef.value.find((p) => p.id === photoId)
    if (removed?.previewUrl.startsWith('blob:')) URL.revokeObjectURL(removed.previewUrl)
    listRef.value = next
  } catch {
    errRef.value = 'Could not remove photo.'
  }
}

/** Submit no longer requires task-lifetime start/end punches. */
function hasRequiredWorkTimes(): boolean {
  return true
}

defineExpose({
  hasRequiredWorkTimes,
})
</script>

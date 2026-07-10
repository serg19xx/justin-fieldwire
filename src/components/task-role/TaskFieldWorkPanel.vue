<template>
  <div class="space-y-5">
    <!-- Work time (required for submit) -->
    <section class="rounded-xl border border-orange-200 bg-white p-4 shadow-sm">
      <h2 class="text-sm font-semibold text-gray-900 mb-1">Work time <span class="text-red-600">*</span></h2>
      <p class="text-xs text-gray-500 mb-1">
        Set when work started and finished. You can adjust the time if it differs from when you opened the app.
      </p>
      <p v-if="plannedHint" class="text-xs text-gray-600 mb-4 font-medium">{{ plannedHint }}</p>
      <p v-else class="mb-4" />

      <div class="space-y-3">
        <div class="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Start work</p>
              <p class="text-sm font-medium text-gray-900 mt-0.5">{{ startedLabel }}</p>
              <p
                v-if="workStartReason?.trim()"
                class="text-xs text-gray-600 mt-1 whitespace-pre-wrap break-words"
              >
                <span class="font-medium text-gray-500">Reason:</span> {{ workStartReason }}
              </p>
            </div>
            <button
              v-if="canEdit && !isLocked"
              type="button"
              class="shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              :class="workStartedAt ? 'bg-gray-600 hover:bg-gray-700' : 'bg-green-600 hover:bg-green-700'"
              :disabled="isSaving"
              @click="openDialog('start')"
            >
              {{ workStartedAt ? 'Edit' : 'Start work' }}
            </button>
          </div>
        </div>

        <div class="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">End work</p>
              <p class="text-sm font-medium text-gray-900 mt-0.5">{{ endedLabel }}</p>
              <p
                v-if="workEndReason?.trim()"
                class="text-xs text-gray-600 mt-1 whitespace-pre-wrap break-words"
              >
                <span class="font-medium text-gray-500">Reason:</span> {{ workEndReason }}
              </p>
            </div>
            <button
              v-if="canEdit && !isLocked"
              type="button"
              class="shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              :class="workEndedAt ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-600 hover:bg-red-700'"
              :disabled="isSaving || !workStartedAt"
              @click="openDialog('end')"
            >
              {{ workEndedAt ? 'Edit' : 'End work' }}
            </button>
          </div>
        </div>
      </div>

      <p v-if="timeMessage" class="text-xs mt-3" :class="timeError ? 'text-red-700' : 'text-green-700'">
        {{ timeMessage }}
      </p>
    </section>

    <TaskWorkTimeDialog
      :open="dialogOpen"
      :kind="dialogKind"
      :planned-hint="plannedHint"
      :planned-start-local="plannedStartLocal"
      :initial-at="dialogInitialAt"
      :initial-reason="dialogInitialReason"
      :min-datetime-local="dialogMinDatetimeLocal"
      :is-saving="isSaving"
      @close="dialogOpen = false"
      @save="onDialogSave"
    />

    <!-- Photos (optional) -->
    <section class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 class="text-sm font-semibold text-gray-900 mb-1">Site photos <span class="text-gray-400 font-normal">(optional)</span></h2>
      <p class="text-xs text-gray-500 mb-4">
        Before and after photos. Saved on the server and visible to the PM under Plans → Execution Logs.
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
        General site report for the PM. Use the reason fields above when start/end times differ from the plan.
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
import type { Task } from '@/core/types/task'
import {
  formatPlannedWorkHint,
  formatTaskDateTimeDisplay,
  plannedStartDatetimeLocal,
  toDatetimeLocalValue,
} from '@/core/utils/task-field-work-datetime'
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
import TaskWorkTimeDialog, { type WorkTimeDialogKind } from '@/components/task-role/TaskWorkTimeDialog.vue'

const props = defineProps<{
  projectId: number
  taskId: string
  task: Task
  canEdit: boolean
  isLocked: boolean
}>()

const emit = defineEmits<{
  updated: [task: Task]
}>()

const workStartedAt = ref<string | null>(props.task.field_work_started_at ?? null)
const workEndedAt = ref<string | null>(props.task.field_work_ended_at ?? null)
const workStartReason = ref(props.task.field_work_start_reason ?? '')
const workEndReason = ref(props.task.field_work_end_reason ?? '')
const fieldNotesDraft = ref(props.task.field_notes ?? '')
const isSaving = ref(false)
const timeMessage = ref('')
const timeError = ref(false)
const notesMessage = ref('')
const notesError = ref(false)

const dialogOpen = ref(false)
const dialogKind = ref<WorkTimeDialogKind>('start')

const photoBefore = ref<TaskFieldPhotoUiRecord[]>([])
const photoAfter = ref<TaskFieldPhotoUiRecord[]>([])
const photoBeforeError = ref('')
const photoAfterError = ref('')
const photoBeforeLoading = ref(false)
const photoAfterLoading = ref(false)

const maxPhotosPerSlot = MAX_TASK_FIELD_PHOTOS_PER_SLOT
const photoWorkDate = computed(() => resolveFieldWorkPhotoWorkDate(workStartedAt.value))
const numericTaskId = computed(() => Number(props.taskId))

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

const plannedHint = computed(() =>
  formatPlannedWorkHint(
    props.task.start_planned,
    props.task.end_planned,
    props.task.start_time,
    props.task.end_time,
  ),
)

const plannedStartLocal = computed(() =>
  plannedStartDatetimeLocal(props.task.start_planned, props.task.start_time),
)

const startedLabel = computed(() => formatTaskDateTimeDisplay(workStartedAt.value))
const endedLabel = computed(() => formatTaskDateTimeDisplay(workEndedAt.value))

const dialogInitialAt = computed(() =>
  dialogKind.value === 'start' ? workStartedAt.value : workEndedAt.value,
)

const dialogInitialReason = computed(() =>
  dialogKind.value === 'start' ? workStartReason.value : workEndReason.value,
)

const dialogMinDatetimeLocal = computed(() => {
  if (dialogKind.value !== 'end' || !workStartedAt.value) return null
  return toDatetimeLocalValue(workStartedAt.value)
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

function syncFromTask(task: Task): void {
  workStartedAt.value = task.field_work_started_at ?? null
  workEndedAt.value = task.field_work_ended_at ?? null
  workStartReason.value = task.field_work_start_reason ?? ''
  workEndReason.value = task.field_work_end_reason ?? ''
  fieldNotesDraft.value = task.field_notes ?? ''
}

watch(
  () => [props.task, props.projectId, props.taskId, photoWorkDate.value] as const,
  ([task]) => {
    syncFromTask(task)
    void loadPhotos()
  },
  { immediate: true, deep: true },
)

function openDialog(kind: WorkTimeDialogKind): void {
  dialogKind.value = kind
  dialogOpen.value = true
  timeMessage.value = ''
  timeError.value = false
}

function buildWorkTimePatch(
  kind: WorkTimeDialogKind,
  payload: { at: string; reason: string },
): {
  field_work_started_at?: string
  field_work_ended_at?: string
  field_work_start_reason?: string | null
  field_work_end_reason?: string | null
} {
  const trimmedReason = payload.reason.trim()
  if (kind === 'start') {
    const patch: {
      field_work_started_at: string
      field_work_start_reason?: string | null
    } = { field_work_started_at: payload.at }
    if (trimmedReason) {
      patch.field_work_start_reason = trimmedReason
    } else if (workStartReason.value?.trim()) {
      patch.field_work_start_reason = null
    }
    return patch
  }
  const patch: {
    field_work_ended_at: string
    field_work_end_reason?: string | null
  } = { field_work_ended_at: payload.at }
  if (trimmedReason) {
    patch.field_work_end_reason = trimmedReason
  } else if (workEndReason.value?.trim()) {
    patch.field_work_end_reason = null
  }
  return patch
}

function resolveSaveErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: unknown }; status?: number } }
    const apiMessage = axiosError.response?.data?.message
    if (typeof apiMessage === 'string' && apiMessage.trim()) return apiMessage
    if (axiosError.response?.status === 403) {
      return 'You are not allowed to update this task. Check that you are the task lead.'
    }
    if (axiosError.response?.status === 400) {
      return 'Invalid data. If this persists, restart the API after DB migrations.'
    }
  }
  if (error instanceof Error && error.message.trim()) return error.message
  return 'Could not save. Check connection and try again.'
}

async function onDialogSave(payload: { at: string; reason: string }): Promise<void> {
  const patch = buildWorkTimePatch(dialogKind.value, payload)

  const ok = await persistFieldWork(
    patch,
    dialogKind.value === 'start' ? 'Work start time saved.' : 'Work end time saved.',
  )
  if (ok) dialogOpen.value = false
}

async function persistFieldWork(
  patch: {
    field_work_started_at?: string | null
    field_work_ended_at?: string | null
    field_work_start_reason?: string | null
    field_work_end_reason?: string | null
    field_notes?: string | null
  },
  successMsg: string,
): Promise<boolean> {
  isSaving.value = true
  timeMessage.value = ''
  timeError.value = false
  try {
    const updated = await tasksApi.updateFieldWork(props.projectId, props.taskId, patch)
    emit('updated', updated)
    syncFromTask(updated)
    timeMessage.value = successMsg
    return true
  } catch (error) {
    timeError.value = true
    timeMessage.value = resolveSaveErrorMessage(error)
    return false
  } finally {
    isSaving.value = false
  }
}

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
          {
            ...saved,
            previewUrl: URL.createObjectURL(blob),
          },
        ]
        added += 1
      } catch (e) {
        errors.push(e instanceof Error ? e.message : `${file.name}: could not upload.`)
      }
    }
    if (added > 0 && errors.length === 0) {
      errRef.value = ''
    } else if (errors.length) {
      errRef.value = errors.slice(0, 2).join(' ')
    }
  } finally {
    loadingRef.value = false
  }
}

async function removePhoto(slot: TaskFieldPhotoSlot, photoId: number): Promise<void> {
  const taskId = numericTaskId.value
  if (!Number.isFinite(taskId) || taskId <= 0) return

  const listRef = slot === 'before' ? photoBefore : photoAfter
  const errRef = slot === 'before' ? photoBeforeError : photoAfterError
  const removed = listRef.value.find((p) => p.id === photoId)
  try {
    await taskFieldPhotosApi.remove(props.projectId, taskId, photoId)
    if (removed?.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(removed.previewUrl)
    }
    listRef.value = listRef.value.filter((p) => p.id !== photoId)
    errRef.value = ''
  } catch {
    errRef.value = 'Could not remove photo.'
  }
}

function hasRequiredWorkTimes(): boolean {
  return Boolean(workStartedAt.value && workEndedAt.value)
}

defineExpose({
  hasRequiredWorkTimes,
  getFieldNotes: () => fieldNotesDraft.value.trim(),
})
</script>

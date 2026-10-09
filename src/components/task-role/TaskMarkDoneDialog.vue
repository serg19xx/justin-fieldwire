<template>
  <div
    v-if="taskName"
    class="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
    role="dialog"
    aria-modal="true"
    aria-labelledby="mark-done-title"
    @click.self="emitCancel"
  >
    <div class="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
      <h2 id="mark-done-title" class="text-base font-semibold text-gray-900">Mark as done</h2>
      <p class="mt-1 text-sm text-gray-700 break-words">{{ taskName }}</p>
      <p class="mt-2 text-xs text-gray-500">
        The task will be set to Ready For Inspection. The project manager reviews it and completes it.
      </p>

      <div class="mt-4">
        <p class="text-sm font-medium text-gray-900">
          Photo of the finished work <span class="font-normal text-gray-500">(recommended)</span>
        </p>
        <div v-if="previewUrl" class="mt-2 flex items-center gap-3">
          <img :src="previewUrl" alt="Selected photo" class="h-20 w-20 rounded-lg object-cover border border-gray-200" />
          <button
            type="button"
            class="text-sm font-medium text-orange-700 hover:underline disabled:opacity-50"
            :disabled="isBusy"
            @click="openPicker"
          >
            Change photo
          </button>
        </div>
        <button
          v-else
          type="button"
          class="mt-2 w-full rounded-lg border-2 border-dashed border-gray-300 px-4 py-4 text-sm font-medium text-gray-700 hover:border-orange-400 hover:text-orange-700 disabled:opacity-50"
          :disabled="isBusy"
          @click="openPicker"
        >
          Take or choose a photo
        </button>
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          capture="environment"
          class="hidden"
          @change="onFileChange"
        />
      </div>

      <p v-if="errorMessage" class="mt-3 text-xs text-red-700">{{ errorMessage }}</p>

      <div class="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
        <button
          type="button"
          class="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 sm:w-auto"
          :disabled="isBusy"
          @click="emit('confirm', selectedFile)"
        >
          {{ confirmLabel }}
        </button>
        <button
          type="button"
          class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
          :disabled="isBusy"
          @click="emitCancel"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{
  /** Dialog is open while a task name is set. */
  taskName: string | null
  isBusy: boolean
  errorMessage: string
}>()

const emit = defineEmits<{
  confirm: [file: File | null]
  cancel: []
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const previewUrl = ref('')

const confirmLabel = computed(() => {
  if (props.isBusy) return 'Saving…'
  return selectedFile.value ? 'Mark as done' : 'Mark done without photo'
})

function resetPhoto(): void {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
  selectedFile.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function openPicker(): void {
  fileInputRef.value?.click()
}

function onFileChange(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0] ?? null
  if (!file) return
  resetPhoto()
  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)
}

function emitCancel(): void {
  if (props.isBusy) return
  emit('cancel')
}

watch(
  () => props.taskName,
  () => resetPhoto(),
)

onBeforeUnmount(resetPhoto)
</script>

<template>
  <div
    v-if="phase"
    class="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
    role="dialog"
    aria-modal="true"
    aria-labelledby="day-photo-title"
    @click.self="emitCancel"
  >
    <div class="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
      <h2 id="day-photo-title" class="text-base font-semibold text-gray-900">
        {{ phase === 'start' ? 'Start day' : 'End day' }}
      </h2>
      <p class="mt-1 text-sm text-gray-600">
        Take a photo on site to {{ phase === 'start' ? 'clock in' : 'clock out' }}. Your project
        manager sees it with your time.
      </p>

      <div class="mt-4">
        <div v-if="previewUrl" class="flex items-center gap-3">
          <img :src="previewUrl" alt="Site photo" class="h-24 w-24 rounded-lg object-cover border border-gray-200" />
          <button
            type="button"
            class="text-sm font-medium text-orange-700 hover:underline disabled:opacity-50"
            :disabled="isBusy"
            @click="openPicker"
          >
            Retake photo
          </button>
        </div>
        <button
          v-else
          type="button"
          class="w-full rounded-lg border-2 border-dashed border-gray-300 px-4 py-6 text-sm font-medium text-gray-700 hover:border-blue-400 hover:text-blue-700 disabled:opacity-50"
          :disabled="isBusy"
          @click="openPicker"
        >
          Take photo
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
          class="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto"
          :class="phase === 'start' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'"
          :disabled="isBusy || !selectedFile"
          @click="selectedFile && emit('confirm', selectedFile)"
        >
          {{ isBusy ? 'Saving…' : phase === 'start' ? 'Start day' : 'End day' }}
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
import { onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{
  /** Dialog is open while a phase is set. */
  phase: 'start' | 'end' | null
  isBusy: boolean
  errorMessage: string
}>()

const emit = defineEmits<{
  confirm: [file: File]
  cancel: []
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const previewUrl = ref('')

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
  () => props.phase,
  () => resetPhoto(),
)

onBeforeUnmount(resetPhoto)
</script>

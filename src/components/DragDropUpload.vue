<template>
  <div
    ref="dropZoneRef"
    :class="[
      'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
      isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
      isUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer',
    ]"
    @click="triggerFileInput"
    @dragover.prevent="handleDragOver"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <input
      ref="fileInputRef"
      type="file"
      :accept="acceptedTypes"
      :multiple="allowMultiple"
      class="hidden"
      @change="handleFileSelect"
    />

    <div class="space-y-4">
      <!-- Upload Icon -->
      <div class="mx-auto w-12 h-12 text-gray-400">
        <svg v-if="!isUploading" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          ></path>
        </svg>
        <svg v-else class="animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          ></path>
        </svg>
      </div>

      <!-- Upload Text -->
      <div>
        <p class="text-lg font-medium text-gray-900">
          {{ isUploading ? 'Uploading...' : 'Drop files here or click to upload' }}
        </p>
        <p class="text-sm text-gray-500 mt-1">
          {{ description }}
        </p>
      </div>

      <!-- File Types -->
      <div class="text-xs text-gray-400">
        <p>Supported formats: {{ supportedFormats }}</p>
        <p v-if="maxFileSize">Max file size: {{ formatFileSize(maxFileSize) }}</p>
      </div>
    </div>

    <!-- Progress Bar -->
    <div v-if="isUploading && uploadProgress > 0" class="mt-4">
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div
          class="bg-blue-600 h-2 rounded-full transition-all duration-300"
          :style="{ width: `${uploadProgress}%` }"
        ></div>
      </div>
      <p class="text-sm text-gray-600 mt-1">{{ uploadProgress }}% uploaded</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  acceptedTypes?: string
  allowMultiple?: boolean
  maxFileSize?: number // in bytes
  description?: string
  supportedFormats?: string
  isUploading?: boolean
  uploadProgress?: number
}

interface Emits {
  (e: 'files-selected', files: File[]): void
  (e: 'upload-progress', progress: number): void
}

const props = withDefaults(defineProps<Props>(), {
  acceptedTypes: '*/*',
  allowMultiple: true,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  description: 'Upload your files',
  supportedFormats: 'All files',
  isUploading: false,
  uploadProgress: 0,
})

const emit = defineEmits<Emits>()

const dropZoneRef = ref<HTMLElement>()
const fileInputRef = ref<HTMLInputElement>()
const isDragOver = ref(false)

function triggerFileInput() {
  if (!props.isUploading) {
    fileInputRef.value?.click()
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = true
}

function handleDragLeave(event: DragEvent) {
  event.preventDefault()
  // Only set to false if we're leaving the drop zone entirely
  if (!dropZoneRef.value?.contains(event.relatedTarget as Node)) {
    isDragOver.value = false
  }
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = false

  const files = Array.from(event.dataTransfer?.files || [])
  processFiles(files)
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])
  processFiles(files)

  // Reset input value to allow selecting the same file again
  target.value = ''
}

function processFiles(files: File[]) {
  if (files.length === 0) return

  // Validate files
  const validFiles: File[] = []
  const errors: string[] = []

  files.forEach((file) => {
    // Check file size
    if (props.maxFileSize && file.size > props.maxFileSize) {
      errors.push(`${file.name} is too large (max ${formatFileSize(props.maxFileSize)})`)
      return
    }

    // Check file type
    if (props.acceptedTypes !== '*/*' && !isFileTypeAccepted(file)) {
      errors.push(`${file.name} is not a supported file type`)
      return
    }

    validFiles.push(file)
  })

  // Show errors if any
  if (errors.length > 0) {
    alert(errors.join('\n'))
  }

  // Emit valid files
  if (validFiles.length > 0) {
    emit('files-selected', validFiles)
  }
}

function isFileTypeAccepted(file: File): boolean {
  const acceptedTypes = props.acceptedTypes.split(',').map((type) => type.trim())

  return acceptedTypes.some((type) => {
    if (type.endsWith('/*')) {
      // Check MIME type category (e.g., image/*)
      const category = type.slice(0, -2)
      return file.type.startsWith(category)
    } else if (type.startsWith('.')) {
      // Check file extension (e.g., .pdf)
      return file.name.toLowerCase().endsWith(type.toLowerCase())
    } else {
      // Check exact MIME type
      return file.type === type
    }
  })
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

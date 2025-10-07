<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
    @click.self="closeDialog"
  >
    <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h3 class="text-base sm:text-lg font-semibold text-gray-900">
            {{ title }}
          </h3>
          <button @click="closeDialog" class="text-gray-400 hover:text-gray-600 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="px-4 sm:px-6 py-3 sm:py-4">
        <!-- File Info -->
        <div v-if="fileInfo" class="mb-4 p-4 bg-gray-50 rounded-lg">
          <div class="flex items-center space-x-3">
            <div class="flex-shrink-0">
              <svg
                class="w-8 h-8 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                ></path>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{{ fileInfo.name }}</p>
              <p class="text-sm text-gray-500">{{ formatFileSize(fileInfo.size) }}</p>
            </div>
          </div>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- File Name -->
          <div>
            <label for="fileName" class="block text-sm font-medium text-gray-700 mb-1">
              File Name
            </label>
            <input
              id="fileName"
              v-model="formData.fileName"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter file name"
            />
          </div>

          <!-- Description -->
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              v-model="formData.description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter file description (optional)"
            ></textarea>
          </div>

          <!-- Category -->
          <div>
            <label for="category" class="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              v-model="formData.category"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="plan">Plan</option>
              <option value="drawing">Drawing</option>
              <option value="specification">Specification</option>
              <option value="photo">Photo</option>
              <option value="document">Document</option>
              <option value="other">Other</option>
            </select>
          </div>

          <!-- Version -->
          <div>
            <label for="version" class="block text-sm font-medium text-gray-700 mb-1">
              Version
            </label>
            <input
              id="version"
              v-model="formData.version"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., v1.0, Rev A, etc."
            />
          </div>
        </form>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-3">
        <button
          @click="closeDialog"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          @click="handleSubmit"
          :disabled="isUploading"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="isUploading" class="flex items-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Uploading...
          </span>
          <span v-else>Upload File</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface FileInfo {
  name: string
  size: number
  type: string
}

interface FormData {
  fileName: string
  description: string
  category: string
  version: string
}

interface Props {
  isOpen: boolean
  title: string
  fileInfo: FileInfo | null
  file: File | null
}

interface Emits {
  (e: 'close'): void
  (e: 'upload', data: { file: File; formData: FormData }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isUploading = ref(false)

const formData = ref<FormData>({
  fileName: '',
  description: '',
  category: 'plan',
  version: '',
})

// Watch for file changes to auto-fill name
watch(
  () => props.fileInfo,
  (newFileInfo) => {
    if (newFileInfo) {
      // Extract name without extension for fileName
      const nameWithoutExt = newFileInfo.name.replace(/\.[^/.]+$/, '')
      formData.value.fileName = nameWithoutExt

      // Set category based on file type
      if (newFileInfo.type.startsWith('image/')) {
        formData.value.category = 'photo'
      } else if (
        newFileInfo.name.toLowerCase().includes('plan') ||
        newFileInfo.name.toLowerCase().includes('drawing')
      ) {
        formData.value.category = 'plan'
      }
    }
  },
  { immediate: true },
)

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function closeDialog() {
  if (!isUploading.value) {
    emit('close')
  }
}

async function handleSubmit() {
  if (!props.fileInfo) return

  try {
    isUploading.value = true

    // Create a File object with the new name
    const file = new File(
      [props.file!],
      `${formData.value.fileName}.${getFileExtension(props.fileInfo!.name)}`,
      {
        type: props.fileInfo!.type,
      },
    )

    emit('upload', {
      file,
      formData: formData.value,
    })

    // Reset form
    formData.value = {
      fileName: '',
      description: '',
      category: 'plan',
      version: '',
    }
  } catch (error) {
    console.error('Upload error:', error)
    alert('Upload failed. Please try again.')
  } finally {
    isUploading.value = false
  }
}

function getFileExtension(filename: string): string {
  return filename.split('.').pop() || ''
}
</script>

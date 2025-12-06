<template>
  <div class="task-template-importer">
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Import Tasks from TSV File
      </label>
      <div class="flex items-center gap-3">
        <input
          ref="fileInput"
          type="file"
          accept=".tsv,.txt"
          @change="handleFileSelect"
          class="hidden"
        />
        <button
          @click="fileInput?.click()"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Choose File
        </button>
        <span v-if="selectedFile" class="text-sm text-gray-600">
          {{ selectedFile.name }}
        </span>
      </div>
      <p class="mt-2 text-xs text-gray-500">
        Select a TSV file with task data. Tasks will be imported as templates.
      </p>
    </div>

    <div v-if="isImporting" class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div class="flex items-center gap-2">
        <svg
          class="animate-spin h-5 w-5 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
        >
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
        <span class="text-sm text-blue-700">Importing tasks...</span>
      </div>
    </div>

    <div v-if="importResult" class="mb-4 p-4 rounded-lg" :class="importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'">
      <div class="flex items-center gap-2">
        <svg
          v-if="importResult.success"
          class="h-5 w-5 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          ></path>
        </svg>
        <svg
          v-else
          class="h-5 w-5 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          ></path>
        </svg>
        <span
          class="text-sm font-medium"
          :class="importResult.success ? 'text-green-700' : 'text-red-700'"
        >
          {{ importResult.message }}
        </span>
      </div>
    </div>

    <div v-if="importResult?.success" class="mt-4">
      <button
        @click="emit('refresh')"
        class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        Refresh Templates List
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { importTasksFromTSVFile } from '@/core/utils/task-templates-import'

interface Emits {
  (e: 'refresh'): void
}

const emit = defineEmits<Emits>()

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const isImporting = ref(false)
const importResult = ref<{ success: boolean; message: string } | null>(null)

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  selectedFile.value = file
  importResult.value = null
  isImporting.value = true

  try {
    const count = await importTasksFromTSVFile(file)
    importResult.value = {
      success: true,
      message: `Successfully imported ${count} task templates!`,
    }
    
    // Reset file input
    if (fileInput.value) {
      fileInput.value.value = ''
    }
    selectedFile.value = null

    // Emit refresh event after a short delay
    setTimeout(() => {
      emit('refresh')
    }, 1000)
  } catch (error) {
    console.error('Import error:', error)
    importResult.value = {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to import tasks',
    }
  } finally {
    isImporting.value = false
  }
}
</script>

<style scoped>
.task-template-importer {
  @apply w-full;
}
</style>


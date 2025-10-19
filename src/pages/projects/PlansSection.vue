<template>
  <div class="plans-section flex-1 flex flex-col">
    <!-- Folder Manager -->
    <div
      class="bg-white rounded-lg shadow w-full"
      style="margin-bottom: 0; height: calc(100vh - 8rem)"
    >
      <div class="p-4" style="height: calc(100vh - 8rem)">
        <FileManager
          v-if="(project as any)?.id"
          :key="fileManagerKey"
          ref="folderManagerRef"
          :project-id="(project as any).id"
          :initial-path="currentFolderPath"
          :view-mode="viewMode"
          style="height: calc(100vh - 12rem)"
          @file-selected="(file: unknown) => handleFilesSelected([file])"
          @folder-created="handleFolderCreated"
          @file-uploaded="handleFileUploaded"
          @file-double-click="handleFileDoubleClick"
        />
        <div v-else class="flex items-center justify-center h-full">
          <div class="text-gray-500">Loading project...</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import FileManager from '@/components/FileManager.vue'

defineOptions({
  name: 'PlansSection',
})

// Props
interface Props {
  project?: unknown
  fileManagerKey?: string
  currentFolderPath?: string
  viewMode?: 'icons' | 'details'
}

defineProps<Props>()

// Refs
const folderManagerRef = ref()

// Expose ref to parent
defineExpose({ folderManagerRef })

// Emits
const emit = defineEmits<{
  filesSelected: [files: unknown[]]
  folderCreated: [folder: unknown]
  fileUploaded: [file: unknown]
  fileDoubleClick: [file: unknown]
}>()

// Methods
const handleFilesSelected = (files: unknown[]) => {
  emit('filesSelected', files)
}

const handleFolderCreated = (folder: unknown) => {
  emit('folderCreated', folder)
}

const handleFileUploaded = (file: unknown) => {
  emit('fileUploaded', file)
}

const handleFileDoubleClick = (file: unknown) => {
  emit('fileDoubleClick', file)
}
</script>

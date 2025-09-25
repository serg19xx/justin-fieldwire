<template>
  <div class="file-manager h-full flex flex-col">
    <!-- Header with controls -->
    <div class="flex items-center justify-between p-4 bg-gray-50 border-b">
      <div class="flex items-center space-x-2">
        <button class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
          + New Folder
        </button>
        <button class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">
          + New File
        </button>
      </div>

      <div class="flex items-center space-x-2">
        <button class="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600">Delete</button>
        <button class="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600">Move</button>
        <button class="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600">Copy</button>
        <button class="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600">
          Paste
        </button>
      </div>
    </div>

    <!-- Main content area -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Left panel - Folder tree -->
      <div class="w-64 bg-gray-100 border-r overflow-y-auto">
        <div class="p-4">
          <h3 class="font-semibold text-gray-700 mb-2">Folders</h3>
          <div class="space-y-1">
            <div class="flex items-center p-2 hover:bg-gray-200 rounded cursor-pointer">
              <span class="mr-2">📁</span>
              <span>Home</span>
            </div>
            <div class="flex items-center p-2 hover:bg-gray-200 rounded cursor-pointer">
              <span class="mr-2">📁</span>
              <span>Documents</span>
            </div>
            <div class="flex items-center p-2 hover:bg-gray-200 rounded cursor-pointer">
              <span class="mr-2">📁</span>
              <span>Pictures</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right panel - File list -->
      <div class="flex-1 flex flex-col">
        <!-- View mode toggle -->
        <div class="flex items-center justify-between p-4 border-b">
          <div class="flex items-center space-x-2">
            <button
              @click="viewMode = 'icons'"
              :class="viewMode === 'icons' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'"
              class="px-3 py-1 rounded"
            >
              🗂️ Icons
            </button>
            <button
              @click="viewMode = 'details'"
              :class="
                viewMode === 'details' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              "
              class="px-3 py-1 rounded"
            >
              📋 Details
            </button>
          </div>
        </div>

        <!-- Content area with proper scrolling -->
        <div class="flex-1 overflow-auto" style="height: 400px">
          <!-- Icons view -->
          <div v-if="viewMode === 'icons'" class="p-4">
            <div class="grid grid-cols-6 gap-4">
              <div
                v-for="item in items"
                :key="item.id"
                class="flex flex-col items-center p-4 border rounded hover:bg-gray-50 cursor-pointer"
              >
                <div class="text-4xl mb-2">{{ item.type === 'folder' ? '📁' : '📄' }}</div>
                <div class="text-sm text-center truncate w-full">{{ item.name }}</div>
              </div>
            </div>
          </div>

          <!-- Details view -->
          <div v-else-if="viewMode === 'details'" class="w-full">
            <!-- Table with fixed width to force horizontal scroll -->
            <div style="width: 1500px; min-width: 1500px">
              <!-- Table header -->
              <div
                class="flex items-center bg-gray-50 border-b px-4 py-2 text-sm font-medium text-gray-700"
              >
                <div class="w-64 px-2">Name</div>
                <div class="w-32 px-2 text-right">Size</div>
                <div class="w-24 px-2 text-right">Type</div>
                <div class="w-40 px-2 text-right">Modified</div>
                <div class="w-48 px-2">Description</div>
                <div class="w-32 px-2 text-right">Actions</div>
              </div>

              <!-- Table rows -->
              <div
                v-for="item in items"
                :key="item.id"
                class="flex items-center border-b px-4 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <div class="w-64 px-2 flex items-center">
                  <span class="mr-2">{{ item.type === 'folder' ? '📁' : '📄' }}</span>
                  <span class="truncate">{{ item.name }}</span>
                </div>
                <div class="w-32 px-2 text-right text-sm text-gray-600">
                  {{ item.type === 'folder' ? '' : item.size }}
                </div>
                <div class="w-24 px-2 text-right text-sm text-gray-600">
                  {{ item.type === 'folder' ? 'Folder' : item.type }}
                </div>
                <div class="w-40 px-2 text-right text-sm text-gray-600">
                  {{ item.modified }}
                </div>
                <div class="w-48 px-2 text-sm text-gray-600 truncate">
                  {{ item.description || '' }}
                </div>
                <div class="w-32 px-2 text-right">
                  <button class="text-blue-600 hover:text-blue-800 text-sm">✏️</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const viewMode = ref<'icons' | 'details'>('details')

const items = ref([
  {
    id: 1,
    name: 'Project Plans',
    type: 'folder',
    size: '',
    modified: '2025-01-23 10:30',
    description: '',
  },
  {
    id: 2,
    name: 'Specifications',
    type: 'folder',
    size: '',
    modified: '2025-01-23 11:15',
    description: '',
  },
  {
    id: 3,
    name: 'Documents',
    type: 'folder',
    size: '',
    modified: '2025-01-23 12:00',
    description: '',
  },
  {
    id: 4,
    name: 'coloring.docx',
    type: 'file',
    size: '30.61 MB',
    modified: '2025-01-23 13:28',
    description: 'Click to add',
    type: 'DOC',
  },
  {
    id: 5,
    name: 'cover.docx',
    type: 'file',
    size: '4.46 MB',
    modified: '2025-01-23 13:28',
    description: 'КОМЕНТАРИЙ...',
    type: 'DOC',
  },
  {
    id: 6,
    name: 'Conneticut-Table.csv',
    type: 'file',
    size: '22.72 KB',
    modified: '2025-01-23 13:28',
    description: 'Click to add',
    type: 'CSV',
  },
  {
    id: 7,
    name: 'book-cover.jpg',
    type: 'file',
    size: '4.16 MB',
    modified: '2025-01-23 12:52',
    description: 'Click to add',
    type: 'IMG',
  },
  {
    id: 8,
    name: 'report.pdf',
    type: 'file',
    size: '2.3 MB',
    modified: '2025-01-23 14:15',
    description: 'Monthly report',
    type: 'PDF',
  },
  {
    id: 9,
    name: 'presentation.pptx',
    type: 'file',
    size: '8.7 MB',
    modified: '2025-01-23 15:30',
    description: 'Client presentation',
    type: 'PPT',
  },
  {
    id: 10,
    name: 'data.xlsx',
    type: 'file',
    size: '1.2 MB',
    modified: '2025-01-23 16:45',
    description: 'Excel data',
    type: 'XLS',
  },
])
</script>

<style scoped>
.file-manager {
  font-family: 'Inter', sans-serif;
}
</style>

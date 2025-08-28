<script setup lang="ts">
import { ref } from 'vue'

const files = ref([
  {
    id: 1,
    name: 'Project_Contract.pdf',
    project: '114 Dundas St E',
    uploadedBy: 'Justin Admin',
    uploadedAt: '2024-01-15',
    size: '2.4 MB',
    type: 'pdf',
  },
  {
    id: 2,
    name: 'Site_Plan.dwg',
    project: 'Sample project - JKE',
    uploadedBy: 'Sarah Manager',
    uploadedAt: '2024-01-14',
    size: '15.7 MB',
    type: 'dwg',
  },
  {
    id: 3,
    name: 'Budget_Spreadsheet.xlsx',
    project: 'Guelph Care XPS',
    uploadedBy: 'Mike Supervisor',
    uploadedAt: '2024-01-13',
    size: '856 KB',
    type: 'xlsx',
  },
])

function getFileIcon(type: string) {
  switch (type) {
    case 'pdf':
      return 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z'
    case 'dwg':
      return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
    case 'xlsx':
      return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
    default:
      return 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z'
  }
}
</script>

<template>
  <div class="space-y-6 p-6">
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-gray-900">Files</h2>
      <p class="mt-1 text-sm text-gray-500">Manage project files and documents</p>
    </div>

    <div class="flex justify-between items-center">
      <div class="flex space-x-3">
        <button class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          + Upload Files
        </button>
        <button
          class="bg-white text-gray-700 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
        >
          Create Folder
        </button>
      </div>
      <div class="flex space-x-2">
        <input
          type="text"
          placeholder="Search files..."
          class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <div class="bg-white shadow rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">All Files</h3>
      </div>
      <div class="divide-y divide-gray-200">
        <div
          v-for="file in files"
          :key="file.id"
          class="px-6 py-4 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div class="flex-shrink-0">
                <svg
                  class="h-8 w-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    :d="getFileIcon(file.type)"
                  ></path>
                </svg>
              </div>
              <div>
                <h4 class="text-sm font-medium text-gray-900">{{ file.name }}</h4>
                <div class="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                  <span>{{ file.project }}</span>
                  <span>•</span>
                  <span>{{ file.size }}</span>
                  <span>•</span>
                  <span>By {{ file.uploadedBy }}</span>
                  <span>•</span>
                  <span>{{ file.uploadedAt }}</span>
                </div>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <button class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Download
              </button>
              <button class="text-gray-400 hover:text-gray-600">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  ></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

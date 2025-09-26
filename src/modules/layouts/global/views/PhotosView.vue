<script setup lang="ts">
import { ref } from 'vue'

const photos = ref([
  {
    id: 1,
    title: 'Foundation Progress',
    project: '114 Dundas St E',
    takenBy: 'Mike Supervisor',
    takenAt: '2024-01-15',
    category: 'progress',
  },
  {
    id: 2,
    title: 'Electrical Installation',
    project: 'Sample project - JKE',
    takenBy: 'Lisa Engineer',
    takenAt: '2024-01-14',
    category: 'quality',
  },
  {
    id: 3,
    title: 'Site Safety Check',
    project: 'Guelph Care XPS',
    takenBy: 'John Viewer',
    takenAt: '2024-01-13',
    category: 'safety',
  },
])

function getCategoryColor(category: string) {
  switch (category) {
    case 'progress':
      return 'bg-blue-100 text-blue-800'
    case 'quality':
      return 'bg-green-100 text-green-800'
    case 'safety':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
</script>

<template>
  <div class="space-y-6 p-6">
    <!-- Page Header -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-gray-900">Photos</h2>
      <p class="mt-1 text-sm text-gray-500">Manage and organize project photos</p>
    </div>

    <!-- Actions -->
    <div class="flex justify-between items-center">
      <div class="flex space-x-3">
        <button class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          + Upload Photos
        </button>
        <button
          class="bg-white text-gray-700 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
        >
          Create Album
        </button>
      </div>
      <div class="flex space-x-2">
        <input
          type="text"
          placeholder="Search photos..."
          class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <!-- Photos Grid -->
    <div class="bg-white shadow rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">Recent Photos</h3>
      </div>
      <div class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="photo in photos"
            :key="photo.id"
            class="bg-gray-100 rounded-lg p-4 hover:bg-gray-200 transition-colors"
          >
            <div
              class="aspect-w-16 aspect-h-9 mb-4 bg-gray-300 rounded flex items-center justify-center"
            >
              <svg
                class="h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                ></path>
              </svg>
            </div>
            <h4 class="text-sm font-medium text-gray-900 mb-2">{{ photo.title }}</h4>
            <div class="space-y-1 text-xs text-gray-500">
              <div>{{ photo.project }}</div>
              <div>By {{ photo.takenBy }}</div>
              <div>{{ photo.takenAt }}</div>
              <span
                :class="getCategoryColor(photo.category)"
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
              >
                {{ photo.category }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

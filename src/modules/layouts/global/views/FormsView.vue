<script setup lang="ts">
import { ref } from 'vue'

const forms = ref([
  {
    id: 1,
    name: 'Daily Safety Checklist',
    project: '114 Dundas St E',
    submissions: 15,
    lastSubmission: '2024-01-15',
    status: 'active',
  },
  {
    id: 2,
    name: 'Quality Inspection Form',
    project: 'Sample project - JKE',
    submissions: 8,
    lastSubmission: '2024-01-14',
    status: 'active',
  },
  {
    id: 3,
    name: 'Equipment Maintenance Log',
    project: 'Guelph Care XPS',
    submissions: 23,
    lastSubmission: '2024-01-13',
    status: 'draft',
  },
])

function getStatusColor(status: string) {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'draft':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
</script>

<template>
  <div class="space-y-6 p-6">
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-gray-900">Forms</h2>
      <p class="mt-1 text-sm text-gray-500">Manage project forms and checklists</p>
    </div>

    <div class="flex justify-between items-center">
      <div class="flex space-x-3">
        <button class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          + Create Form
        </button>
        <button
          class="bg-white text-gray-700 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
        >
          Import Template
        </button>
      </div>
      <div class="flex space-x-2">
        <input
          type="text"
          placeholder="Search forms..."
          class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <div class="bg-white shadow rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">All Forms</h3>
      </div>
      <div class="divide-y divide-gray-200">
        <div
          v-for="form in forms"
          :key="form.id"
          class="px-6 py-4 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="flex items-center space-x-3">
                <h4 class="text-sm font-medium text-gray-900">{{ form.name }}</h4>
                <span
                  :class="getStatusColor(form.status)"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                >
                  {{ form.status }}
                </span>
              </div>
              <div class="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                <span>{{ form.project }}</span>
                <span>•</span>
                <span>{{ form.submissions }} submissions</span>
                <span>•</span>
                <span>Last: {{ form.lastSubmission }}</span>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <button class="text-blue-600 hover:text-blue-800 text-sm font-medium">View</button>
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

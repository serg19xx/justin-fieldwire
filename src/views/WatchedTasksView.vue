<script setup lang="ts">
import { ref } from 'vue'

const tasks = ref([
  {
    id: 1,
    title: 'Foundation inspection',
    project: '114 Dundas St E',
    assignee: 'Mike Supervisor',
    priority: 'high',
    dueDate: '2024-01-20',
    status: 'in-progress',
  },
  {
    id: 2,
    title: 'Electrical panel installation',
    project: 'Sample project - JKE',
    assignee: 'Lisa Engineer',
    priority: 'medium',
    dueDate: '2024-01-25',
    status: 'pending',
  },
])

function getStatusColor(status: string) {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'in-progress':
      return 'bg-blue-100 text-blue-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'low':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
</script>

<template>
  <div class="space-y-6 p-6">
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-gray-900">Watched Tasks</h2>
      <p class="mt-1 text-sm text-gray-500">Tasks you are following</p>
    </div>

    <div class="flex justify-between items-center">
      <div class="flex space-x-3">
        <button class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          + Watch Task
        </button>
        <button
          class="bg-white text-gray-700 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
        >
          Filter Tasks
        </button>
      </div>
      <div class="flex space-x-2">
        <input
          type="text"
          placeholder="Search tasks..."
          class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <div class="bg-white shadow rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">Watched Tasks ({{ tasks.length }})</h3>
      </div>
      <div class="divide-y divide-gray-200">
        <div
          v-for="task in tasks"
          :key="task.id"
          class="px-6 py-4 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="flex items-center space-x-3">
                <h4 class="text-sm font-medium text-gray-900">{{ task.title }}</h4>
                <span
                  :class="getStatusColor(task.status)"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                >
                  {{ task.status }}
                </span>
                <span
                  :class="getPriorityColor(task.priority)"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                >
                  {{ task.priority }}
                </span>
              </div>
              <div class="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                <span>{{ task.project }}</span>
                <span>•</span>
                <span>Assigned to {{ task.assignee }}</span>
                <span>•</span>
                <span>Due {{ task.dueDate }}</span>
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

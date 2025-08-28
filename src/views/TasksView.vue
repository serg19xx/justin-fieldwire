<script setup lang="ts">
import { ref } from 'vue'

const tasks = ref([
  {
    id: 1,
    title: 'Review foundation plans',
    description: 'Check foundation specifications and ensure compliance',
    status: 'In Progress',
    priority: 'High',
    assignee: 'John Smith',
    dueDate: '2024-01-20',
    project: 'Downtown Office Complex',
  },
  {
    id: 2,
    title: 'Install electrical systems',
    description: 'Complete electrical installation in building A',
    status: 'Pending',
    priority: 'Medium',
    assignee: 'Mike Johnson',
    dueDate: '2024-01-25',
    project: 'Residential Tower A',
  },
  {
    id: 3,
    title: 'Inspect safety equipment',
    description: 'Verify all safety equipment is properly installed',
    status: 'Completed',
    priority: 'High',
    assignee: 'Sarah Wilson',
    dueDate: '2024-01-18',
    project: 'Shopping Center Renovation',
  },
])

const statusFilter = ref('all')
const priorityFilter = ref('all')

function getStatusColor(status: string) {
  switch (status) {
    case 'In Progress':
      return 'bg-blue-100 text-blue-800'
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'Completed':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'High':
      return 'bg-red-100 text-red-800'
    case 'Medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'Low':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="space-y-6 p-6">
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-gray-900">Tasks</h2>
      <p class="mt-1 text-sm text-gray-500">Manage and track project tasks</p>
    </div>

    <div class="flex justify-between items-center">
      <div class="flex space-x-3">
        <button class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          + Create Task
        </button>
        <button class="bg-white text-gray-700 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50">
          Import Tasks
        </button>
      </div>
      <div class="flex space-x-2">
        <select
          v-model="statusFilter"
          class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="In Progress">In Progress</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
        </select>
        <select
          v-model="priorityFilter"
          class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>
    </div>

    <div class="bg-white shadow rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">Task List</h3>
      </div>
      <div class="divide-y divide-gray-200">
        <div
          v-for="task in tasks"
          :key="task.id"
          class="px-6 py-4 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-medium text-gray-900">{{ task.title }}</h4>
                <div class="flex items-center space-x-2">
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
              </div>
              <p class="mt-1 text-sm text-gray-500">{{ task.description }}</p>
              <div class="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                <span>Assigned to: {{ task.assignee }}</span>
                <span>Project: {{ task.project }}</span>
                <span>Due: {{ formatDate(task.dueDate) }}</span>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <button class="text-blue-600 hover:text-blue-800 text-sm font-medium">Edit</button>
              <button class="text-gray-400 hover:text-gray-600">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

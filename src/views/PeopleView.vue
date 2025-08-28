<script setup lang="ts">
import { ref } from 'vue'

const people = ref([
  {
    id: 1,
    name: 'Mike Johnson',
    email: 'mike@construction.com',
    role: 'Foreman',
    status: 'active',
    lastActive: '2024-01-15',
  },
  {
    id: 2,
    name: 'Sarah Wilson',
    email: 'sarah@construction.com',
    role: 'Electrician',
    status: 'active',
    lastActive: '2024-01-15',
  },
  {
    id: 3,
    name: 'Tom Davis',
    email: 'tom@construction.com',
    role: 'Plumber',
    status: 'active',
    lastActive: '2024-01-14',
  },
])

const roleFilter = ref('all')
const statusFilter = ref('all')

function getStatusColor(status: string) {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'inactive':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getRoleColor(role: string) {
  switch (role) {
    case 'Foreman':
      return 'bg-purple-100 text-purple-800'
    case 'Electrician':
      return 'bg-blue-100 text-blue-800'
    case 'Plumber':
      return 'bg-yellow-100 text-yellow-800'
    case 'Carpenter':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
</script>

<template>
  <div class="space-y-6 p-6">
    <div class="flex justify-between items-center">
      <div class="flex space-x-3">
        <button class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          + Add Builder
        </button>
        <button
          class="bg-white text-gray-700 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
        >
          Import Builders
        </button>
      </div>
      <div class="flex space-x-2">
        <select
          v-model="roleFilter"
          class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Roles</option>
          <option value="Foreman">Foreman</option>
          <option value="Electrician">Electrician</option>
          <option value="Plumber">Plumber</option>
        </select>
        <select
          v-model="statusFilter"
          class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
    </div>

    <div class="bg-white shadow rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">Construction Team</h3>
      </div>
      <div class="divide-y divide-gray-200">
        <div
          v-for="person in people"
          :key="person.id"
          class="px-6 py-4 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span class="text-white text-sm font-medium">{{ person.name.charAt(0) }}</span>
              </div>
              <div>
                <h4 class="text-sm font-medium text-gray-900">{{ person.name }}</h4>
                <p class="text-sm text-gray-500">{{ person.email }}</p>
              </div>
            </div>
            <div class="flex items-center space-x-3">
              <span
                :class="getRoleColor(person.role)"
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              >
                {{ person.role }}
              </span>
              <span
                :class="getStatusColor(person.status)"
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              >
                {{ person.status }}
              </span>
              <span class="text-sm text-gray-500">Last active: {{ person.lastActive }}</span>
              <button class="text-blue-600 hover:text-blue-800 text-sm font-medium">Edit</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

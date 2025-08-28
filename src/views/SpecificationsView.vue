<script setup lang="ts">
import { ref } from 'vue'

const specifications = ref([
  {
    id: 1,
    name: 'Foundation Specifications',
    category: 'Structural',
    version: '2.1',
    status: 'Approved',
    lastUpdated: '2024-01-15',
    project: 'Downtown Office Complex',
    description: 'Detailed specifications for foundation construction and materials',
  },
  {
    id: 2,
    name: 'Electrical Systems Specs',
    category: 'Electrical',
    version: '1.8',
    status: 'In Review',
    lastUpdated: '2024-01-14',
    project: 'Residential Tower A',
    description: 'Electrical system specifications and installation requirements',
  },
  {
    id: 3,
    name: 'HVAC Specifications',
    category: 'Mechanical',
    version: '1.5',
    status: 'Draft',
    lastUpdated: '2024-01-13',
    project: 'Shopping Center Renovation',
    description: 'Heating, ventilation, and air conditioning system specifications',
  },
])

const categoryFilter = ref('all')
const statusFilter = ref('all')
</script>

<template>
  <div class="space-y-6 p-6">
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-gray-900">Specifications</h2>
      <p class="mt-1 text-sm text-gray-500">Manage project specifications and technical documents</p>
    </div>

    <div class="flex justify-between items-center">
      <div class="flex space-x-3">
        <button class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          + Add Specification
        </button>
        <button class="bg-white text-gray-700 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50">
          Import Specs
        </button>
      </div>
      <div class="flex space-x-2">
        <select
          v-model="categoryFilter"
          class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          <option value="Structural">Structural</option>
          <option value="Electrical">Electrical</option>
          <option value="Mechanical">Mechanical</option>
          <option value="Plumbing">Plumbing</option>
        </select>
        <select
          v-model="statusFilter"
          class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="In Review">In Review</option>
          <option value="Approved">Approved</option>
        </select>
      </div>
    </div>

    <div class="bg-white shadow rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">Specification Documents</h3>
      </div>
      <div class="divide-y divide-gray-200">
        <div
          v-for="spec in specifications"
          :key="spec.id"
          class="px-6 py-4 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-medium text-gray-900">{{ spec.name }}</h4>
                <div class="flex items-center space-x-2">
                  <span
                    :class="
                      spec.status === 'Approved'
                        ? 'bg-green-100 text-green-800'
                        : spec.status === 'In Review'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    "
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  >
                    {{ spec.status }}
                  </span>
                  <span class="text-xs text-gray-500">v{{ spec.version }}</span>
                </div>
              </div>
              <p class="mt-1 text-sm text-gray-500">{{ spec.description }}</p>
              <div class="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                <span>Category: {{ spec.category }}</span>
                <span>Project: {{ spec.project }}</span>
                <span>Updated: {{ spec.lastUpdated }}</span>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <button class="text-blue-600 hover:text-blue-800 text-sm font-medium">View</button>
              <button class="text-green-600 hover:text-green-800 text-sm font-medium">Download</button>
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

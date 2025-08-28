<script setup lang="ts">
import { ref } from 'vue'

const reports = ref([
  {
    id: 1,
    name: 'Project Progress Report',
    type: 'Progress',
    lastGenerated: '2024-01-15',
    status: 'Ready',
    description: 'Comprehensive overview of all project milestones and completion rates',
  },
  {
    id: 2,
    name: 'Budget Analysis',
    type: 'Financial',
    lastGenerated: '2024-01-14',
    status: 'Ready',
    description: 'Detailed breakdown of project costs and budget utilization',
  },
  {
    id: 3,
    name: 'Safety Compliance Report',
    type: 'Safety',
    lastGenerated: '2024-01-13',
    status: 'Processing',
    description: 'Safety inspection results and compliance status',
  },
])

const typeFilter = ref('all')
const statusFilter = ref('all')
</script>

<template>
  <div class="space-y-6 p-6">
    <div class="flex justify-between items-center">
      <div class="flex space-x-3">
        <button class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          + Create Report
        </button>
        <button
          class="bg-white text-gray-700 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
        >
          Export Reports
        </button>
      </div>
      <div class="flex space-x-2">
        <select
          v-model="typeFilter"
          class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          <option value="progress">Progress Reports</option>
          <option value="financial">Financial Reports</option>
          <option value="safety">Safety Reports</option>
        </select>
        <select
          v-model="statusFilter"
          class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>
    </div>

    <div class="bg-white shadow rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">Available Reports</h3>
      </div>
      <div class="divide-y divide-gray-200">
        <div
          v-for="report in reports"
          :key="report.id"
          class="px-6 py-4 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-medium text-gray-900">{{ report.name }}</h4>
                <span
                  :class="
                    report.status === 'Ready'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  "
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                >
                  {{ report.status }}
                </span>
              </div>
              <p class="mt-1 text-sm text-gray-500">{{ report.description }}</p>
              <div class="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                <span>Type: {{ report.type }}</span>
                <span>Last generated: {{ report.lastGenerated }}</span>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <button class="text-blue-600 hover:text-blue-800 text-sm font-medium">View</button>
              <button class="text-green-600 hover:text-green-800 text-sm font-medium">
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

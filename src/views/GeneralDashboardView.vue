<script setup lang="ts">
import { ref } from 'vue'

const stats = ref([
  {
    name: 'Total Projects',
    value: '12',
    change: '+2.5%',
    changeType: 'positive',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  },
  {
    name: 'Active Tasks',
    value: '47',
    change: '+12.3%',
    changeType: 'positive',
    icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
  },
  {
    name: 'Team Members',
    value: '8',
    change: '+1',
    changeType: 'positive',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
  },
  {
    name: 'Completed This Week',
    value: '23',
    change: '+8.1%',
    changeType: 'positive',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
])

const recentProjects = ref([
  {
    id: 1,
    name: 'Downtown Office Complex',
    status: 'In Progress',
    progress: 75,
    team: 4,
    lastUpdate: '2 hours ago',
  },
  {
    id: 2,
    name: 'Residential Tower A',
    status: 'Planning',
    progress: 25,
    team: 3,
    lastUpdate: '1 day ago',
  },
  {
    id: 3,
    name: 'Shopping Center Renovation',
    status: 'Review',
    progress: 90,
    team: 6,
    lastUpdate: '3 hours ago',
  },
])

function getStatusColor(status: string) {
  switch (status) {
    case 'In Progress':
      return 'bg-blue-100 text-blue-800'
    case 'Planning':
      return 'bg-yellow-100 text-yellow-800'
    case 'Review':
      return 'bg-purple-100 text-purple-800'
    case 'Completed':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
</script>

<template>
  <div class="space-y-6 p-6">
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-gray-900">Dashboard</h2>
      <p class="mt-1 text-sm text-gray-500">Welcome back! Here's what's happening with your projects.</p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div
        v-for="stat in stats"
        :key="stat.name"
        class="bg-white overflow-hidden shadow rounded-lg"
      >
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg
                class="h-6 w-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  :d="stat.icon"
                ></path>
              </svg>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">{{ stat.name }}</dt>
                <dd class="flex items-baseline">
                  <div class="text-2xl font-semibold text-gray-900">{{ stat.value }}</div>
                  <div
                    :class="
                      stat.changeType === 'positive'
                        ? 'text-green-600'
                        : 'text-red-600'
                    "
                    class="ml-2 flex items-baseline text-sm font-semibold"
                  >
                    {{ stat.change }}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Projects -->
    <div class="bg-white shadow rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">Recent Projects</h3>
      </div>
      <div class="divide-y divide-gray-200">
        <div
          v-for="project in recentProjects"
          :key="project.id"
          class="px-6 py-4 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-medium text-gray-900">{{ project.name }}</h4>
                <span
                  :class="getStatusColor(project.status)"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                >
                  {{ project.status }}
                </span>
              </div>
              <div class="mt-2 flex items-center justify-between">
                <div class="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{{ project.team }} team members</span>
                  <span>Updated {{ project.lastUpdate }}</span>
                </div>
                <div class="flex items-center space-x-2">
                  <div class="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      class="bg-blue-600 h-2 rounded-full"
                      :style="{ width: project.progress + '%' }"
                    ></div>
                  </div>
                  <span class="text-sm text-gray-500">{{ project.progress }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

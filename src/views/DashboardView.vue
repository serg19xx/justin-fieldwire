<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// Mock data for dashboard metrics
const metrics = [
  {
    title: 'Active Projects',
    value: '12',
    change: '+2',
    changeType: 'positive',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
  },
  {
    title: 'Total Tasks',
    value: '156',
    change: '+23',
    changeType: 'positive',
    icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
  },
  {
    title: 'Completed Today',
    value: '8',
    change: '+3',
    changeType: 'positive',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
  },
  {
    title: 'Pending Issues',
    value: '5',
    change: '-2',
    changeType: 'negative',
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
  }
]

const quickActions = [
  {
    title: 'Create New Project',
    description: 'Start a new construction project',
    icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
    link: '/projects',
    color: 'bg-blue-500 hover:bg-blue-600'
  },
  {
    title: 'View Tasks',
    description: 'Check and manage your tasks',
    icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    link: '/tasks',
    color: 'bg-green-500 hover:bg-green-600'
  },
  {
    title: 'Generate Reports',
    description: 'Create and view project reports',
    icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    link: '/reports',
    color: 'bg-purple-500 hover:bg-purple-600'
  },
  {
    title: 'Manage Contacts',
    description: 'View and manage your contacts',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    link: '/contacts',
    color: 'bg-orange-500 hover:bg-orange-600'
  }
]

const recentActivity = [
  {
    action: 'Project "Downtown Office Complex" updated',
    time: '2 hours ago',
    user: 'John Smith',
    type: 'project'
  },
  {
    action: 'Task "Foundation Inspection" completed',
    time: '4 hours ago',
    user: 'Sarah Johnson',
    type: 'task'
  },
  {
    action: 'New contact "ABC Construction" added',
    time: '6 hours ago',
    user: 'Mike Wilson',
    type: 'contact'
  },
  {
    action: 'Report "Weekly Progress" generated',
    time: '1 day ago',
    user: 'Lisa Brown',
    type: 'report'
  }
]
</script>

<template>
  <div class="p-6">
    <!-- Welcome Section -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">
        Welcome back, {{ authStore.currentUser?.name || 'User' }}!
      </h1>
      <p class="text-gray-600">
        Here's what's happening with your projects today.
      </p>
    </div>

    <!-- Metrics Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div
        v-for="metric in metrics"
        :key="metric.title"
        class="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">{{ metric.title }}</p>
            <p class="text-2xl font-bold text-gray-900">{{ metric.value }}</p>
          </div>
          <div class="flex items-center">
            <div
              :class="[
                'flex items-center text-sm font-medium',
                metric.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              ]"
            >
              <span>{{ metric.change }}</span>
            </div>
            <div class="ml-2 p-2 bg-gray-100 rounded-lg">
              <svg class="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="metric.icon"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions and Recent Activity -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Quick Actions -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <RouterLink
              v-for="action in quickActions"
              :key="action.title"
              :to="action.link"
              class="group block p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200"
            >
              <div class="flex items-center space-x-3">
                <div
                  :class="[
                    'p-2 rounded-lg text-white',
                    action.color
                  ]"
                >
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="action.icon"></path>
                  </svg>
                </div>
                <div>
                  <h3 class="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {{ action.title }}
                  </h3>
                  <p class="text-sm text-gray-600">{{ action.description }}</p>
                </div>
              </div>
            </RouterLink>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div class="p-6">
          <div class="space-y-4">
            <div
              v-for="activity in recentActivity"
              :key="activity.action"
              class="flex items-start space-x-3"
            >
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg class="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    ></path>
                  </svg>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900">{{ activity.action }}</p>
                <p class="text-sm text-gray-600">
                  by {{ activity.user }} • {{ activity.time }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

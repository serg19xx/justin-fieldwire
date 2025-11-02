<template>
  <div class="px-4 py-6 md:px-6">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-4">My Tasks</h3>
        <p class="text-gray-600">List of tasks to complete</p>
        <button class="mt-4 bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700">
          View Tasks
        </button>
      </div>

      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-4">Calendar</h3>
        <p class="text-gray-600">Tasks by day and time</p>
        <button class="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Open Calendar
        </button>
      </div>

      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-4">Photos</h3>
        <p class="text-gray-600">Uploaded work photos</p>
        <button class="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          View Photos
        </button>
      </div>
    </div>

    <div class="mt-8">
      <h2 class="text-xl font-semibold mb-4">User Information</h2>
      <div class="bg-gray-50 p-4 rounded-lg">
        <p><strong>Category:</strong> {{ user?.role_category || 'Not defined' }}</p>
        <p><strong>Role:</strong> {{ user?.role_code || 'Not defined' }}</p>
        <p><strong>Name:</strong> {{ user?.name || 'Not defined' }}</p>
        <p><strong>Email:</strong> {{ user?.email || 'Not defined' }}</p>
        <p><strong>ID:</strong> {{ user?.id || 'Not defined' }}</p>
        <p><strong>Status:</strong> {{ user?.isActive ? 'Active' : 'Inactive' }}</p>
        <p><strong>2FA:</strong> {{ user?.twoFactorEnabled ? 'Enabled' : 'Disabled' }}</p>
      </div>
    </div>
    </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/core/stores/auth'

const authStore = useAuthStore()
const user = authStore.currentUser
</script>


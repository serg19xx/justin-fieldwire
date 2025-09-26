<template>
  <div class="project-dashboard">
    <div class="bg-green-600 text-white p-6 rounded-lg mb-6">
      <h1 class="text-3xl font-bold">Project Dashboard</h1>
      <p class="text-green-100">Project management interface</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-4">My Projects</h3>
        <p class="text-gray-600">List of projects you are participating in</p>
        <button class="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Go to Projects
        </button>
      </div>

      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-4">Create Project</h3>
        <p class="text-gray-600">Create a new project</p>
        <button class="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Create
        </button>
      </div>

      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-4">Project Archive</h3>
        <p class="text-gray-600">Completed and archived projects</p>
        <button class="mt-4 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
          Open Archive
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

<style scoped>
.project-dashboard {
  padding: 2rem;
}
</style>

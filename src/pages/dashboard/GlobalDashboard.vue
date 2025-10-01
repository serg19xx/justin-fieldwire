<template>
  <div class="global-dashboard pt-4 md:pt-6">
    <div class="bg-blue-600 text-white p-6 rounded-lg mb-6">
      <h1 class="text-3xl font-bold">Global Dashboard</h1>
      <p class="text-blue-100">System administration interface</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-4">User Management</h3>
        <p class="text-gray-600">Create, edit, and manage user roles</p>
      </div>

      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-4">System Settings</h3>
        <p class="text-gray-600">System configuration and integrations</p>
      </div>

      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-4">Analytics</h3>
        <p class="text-gray-600">System-wide reports and analytics</p>
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
.global-dashboard {
  padding: 2rem;
}
</style>

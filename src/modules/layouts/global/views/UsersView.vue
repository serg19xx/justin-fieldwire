<template>
  <div class="global-users">
    <div class="bg-blue-600 text-white p-6 rounded-lg mb-6">
      <h1 class="text-3xl font-bold">User Management</h1>
      <p class="text-blue-100">Administrative interface for managing system users</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-4">Create User</h3>
        <p class="text-gray-600">Add new users to the system</p>
        <button class="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Create
        </button>
      </div>

      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-4">User List</h3>
        <p class="text-gray-600">View and manage existing users</p>
        <button class="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          View
        </button>
      </div>

      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-4">Roles & Permissions</h3>
        <p class="text-gray-600">Manage roles and access permissions</p>
        <button class="mt-4 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
          Configure
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Global Users view
</script>

<style scoped>
.global-users {
  padding: 2rem;
}
</style>

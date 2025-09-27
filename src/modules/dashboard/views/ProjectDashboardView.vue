<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Project Dashboard</h1>

    <!-- Dashboard content -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Active Projects</h3>
        <p class="text-3xl font-bold text-green-600">{{ activeProjectsCount }}</p>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Tasks This Week</h3>
        <p class="text-3xl font-bold text-blue-600">{{ tasksThisWeek }}</p>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Team Members</h3>
        <p class="text-3xl font-bold text-purple-600">{{ teamMembersCount }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Dashboard stats
const activeProjectsCount = ref(12)
const tasksThisWeek = ref(156)
const teamMembersCount = ref(8)
</script>

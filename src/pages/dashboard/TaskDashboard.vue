<template>
  <div class="px-4 py-4 max-w-lg mx-auto">
    <!-- Welcome -->
    <section class="mb-6">
      <h1 class="text-xl font-semibold text-gray-900">
        {{ greeting }}, {{ userName }}
      </h1>
      <p class="text-sm text-gray-500 mt-0.5">
        {{ displayRole }}
      </p>
    </section>

    <!-- My Projects summary -->
    <section class="mb-6">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-base font-semibold text-gray-900">My Projects</h2>
        <RouterLink
          to="/tasks"
          class="text-sm font-medium text-orange-600 hover:text-orange-700"
        >
          View all
        </RouterLink>
      </div>

      <div v-if="isLoading" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
        <div class="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto" />
        <p class="text-sm text-gray-500 mt-3">Loading projects…</p>
      </div>

      <div v-else-if="projects.length === 0" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
        <p class="text-gray-500 text-sm">No projects yet.</p>
        <p class="text-gray-400 text-xs mt-1">Projects you join will appear here.</p>
      </div>

      <div v-else class="space-y-3">
        <RouterLink
          v-for="project in displayProjects"
          :key="project.id"
          :to="`/tasks/project/${project.id}`"
          class="block bg-white rounded-xl shadow-sm border border-gray-200 p-4 active:bg-gray-50"
        >
          <div class="flex justify-between items-start gap-2">
            <span class="font-medium text-gray-900 truncate flex-1">{{ project.prj_name }}</span>
            <span
              :class="[
                'flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full',
                project.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700',
              ]"
            >
              {{ project.status || '—' }}
            </span>
          </div>
          <p v-if="project.address" class="text-xs text-gray-500 mt-1 truncate">
            {{ project.address }}
          </p>
        </RouterLink>
      </div>

      <div v-if="!isLoading && projects.length > 3" class="mt-3 text-center">
        <RouterLink to="/tasks" class="text-sm text-orange-600 hover:text-orange-700 font-medium">
          View all {{ projects.length }} projects
        </RouterLink>
      </div>
    </section>

    <!-- Quick actions -->
    <section>
      <h2 class="text-base font-semibold text-gray-900 mb-3">Quick actions</h2>
      <div class="grid grid-cols-2 gap-3">
        <RouterLink
          to="/tasks"
          class="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-gray-200 active:bg-orange-50"
        >
          <span class="text-2xl mb-1" aria-hidden="true">📋</span>
          <span class="text-sm font-medium text-gray-900">My Projects</span>
        </RouterLink>
        <RouterLink
          to="/reports"
          class="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-gray-200 active:bg-orange-50"
        >
          <span class="text-2xl mb-1" aria-hidden="true">📊</span>
          <span class="text-sm font-medium text-gray-900">Reports</span>
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/core/stores/auth'
import { getDisplayRole } from '@/core/utils/role-utils'
import { projectApi } from '@/core/utils/project-api'
import type { Project } from '@/core/utils/project-api'

const authStore = useAuthStore()

const displayRole = computed(() => {
  const u = authStore.currentUser
  if (!u) return ''
  return getDisplayRole({
    role_id: u.role_id,
    role_code: u.role_code,
    role_name: u.role_name,
  }) || u.job_title || ''
})

const userName = computed(() => {
  const u = authStore.currentUser
  return u?.name || u?.first_name || 'User'
})

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
})

const projects = ref<Project[]>([])
const isLoading = ref(true)

const displayProjects = computed(() => projects.value.slice(0, 3))

onMounted(async () => {
  try {
    const data = await projectApi.getAll(1, 50, {})
    projects.value = data?.projects ?? []
  } catch {
    projects.value = []
  } finally {
    isLoading.value = false
  }
})
</script>

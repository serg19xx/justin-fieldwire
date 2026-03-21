<template>
  <div class="px-4 py-4 max-w-lg mx-auto">
    <h1 class="text-xl font-semibold text-gray-900 mb-4">My Projects</h1>

    <!-- Tabs: Active / Archived -->
    <div class="flex rounded-lg bg-gray-200 p-1 mb-4">
      <button
        type="button"
        :class="[
          'flex-1 py-2 text-sm font-medium rounded-md transition-colors',
          filterActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900',
        ]"
        @click="filterActive = true"
      >
        Active
      </button>
      <button
        type="button"
        :class="[
          'flex-1 py-2 text-sm font-medium rounded-md transition-colors',
          !filterActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900',
        ]"
        @click="filterActive = false"
      >
        Archived
      </button>
    </div>

    <div v-if="isLoading" class="flex flex-col items-center justify-center py-12">
      <div class="animate-spin w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full" />
      <p class="text-sm text-gray-500 mt-4">Loading projects…</p>
    </div>

    <div v-else-if="filteredProjects.length === 0" class="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <p class="text-gray-500 text-sm">
        {{ filterActive ? 'No active projects.' : 'No archived projects.' }}
      </p>
    </div>

    <ul v-else class="space-y-3">
      <li v-for="project in filteredProjects" :key="project.id">
        <RouterLink
          :to="`/tasks/project/${project.id}`"
          class="block bg-white rounded-xl shadow-sm border border-gray-200 p-4 active:bg-gray-50"
        >
          <div class="flex justify-between items-start gap-2">
            <span class="font-medium text-gray-900 truncate flex-1">{{ project.prj_name }}</span>
            <span
              :class="[
                'flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full',
                statusClass(project.status),
              ]"
            >
              {{ project.status || '—' }}
            </span>
          </div>
          <p v-if="project.address" class="text-xs text-gray-500 mt-1 truncate">
            {{ project.address }}
          </p>
          <p v-if="project.date_start || project.date_end" class="text-xs text-gray-400 mt-1">
            {{ formatDateRange(project.date_start, project.date_end) }}
          </p>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { projectApi } from '@/core/utils/project-api'
import type { Project } from '@/core/utils/project-api'

const filterActive = ref(true)
const projects = ref<Project[]>([])
const isLoading = ref(true)

const activeStatuses = ['Active', 'In Progress', 'InProgress']
const archivedStatuses = ['Completed', 'Closed', 'Archived', 'On Hold', 'OnHold', 'Cancelled']

const filteredProjects = computed(() => {
  const list = projects.value
  if (filterActive.value) {
    return list.filter((p) => p.status && activeStatuses.includes(p.status))
  }
  return list.filter((p) => !p.status || archivedStatuses.includes(p.status) || !activeStatuses.includes(p.status))
})

function statusClass(status: string | undefined): string {
  if (!status) return 'bg-gray-100 text-gray-700'
  if (activeStatuses.includes(status)) return 'bg-green-100 text-green-800'
  return 'bg-gray-100 text-gray-700'
}

function formatDateRange(start: string | null | undefined, end: string | null | undefined): string {
  const s = start ? new Date(start).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''
  const e = end ? new Date(end).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''
  if (s && e) return `${s} – ${e}`
  return s || e || ''
}

onMounted(async () => {
  try {
    const data = await projectApi.getAll(1, 100, {})
    projects.value = (data as { projects?: Project[] }).projects ?? []
  } catch {
    projects.value = []
  } finally {
    isLoading.value = false
  }
})
</script>

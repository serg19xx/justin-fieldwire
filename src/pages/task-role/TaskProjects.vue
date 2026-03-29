<template>
  <div class="px-4 py-4 max-w-lg mx-auto">
    <h1 class="text-xl font-semibold text-gray-900 mb-1">My Projects</h1>
    <p class="text-xs text-gray-500 mb-4">
      One current site; other assigned projects stay here until they start. Closed projects are in Archived.
    </p>

    <!-- Tabs: Active (current + planned) / Archived -->
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

    <div
      v-else-if="filterActive && !activePartition.current && activePartition.planned.length === 0"
      class="bg-white rounded-xl border border-gray-200 p-8 text-center"
    >
      <p class="text-gray-500 text-sm">No active projects.</p>
    </div>

    <div
      v-else-if="!filterActive && archivedProjects.length === 0"
      class="bg-white rounded-xl border border-gray-200 p-8 text-center"
    >
      <p class="text-gray-500 text-sm">No archived projects.</p>
    </div>

    <!-- Active tab: current + planned -->
    <div v-else-if="filterActive" class="space-y-6">
      <section v-if="activePartition.current">
        <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Current project</h2>
        <RouterLink
          :to="`/tasks/project/${activePartition.current.id}`"
          class="block bg-white rounded-xl shadow-sm border-2 border-orange-400 p-4 active:bg-orange-50"
        >
          <div class="flex justify-between items-start gap-2">
            <span class="font-medium text-gray-900 truncate flex-1">{{ activePartition.current.prj_name }}</span>
            <span
              :class="[
                'flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full',
                statusClass(activePartition.current.status),
              ]"
            >
              {{ activePartition.current.status || '—' }}
            </span>
          </div>
          <p v-if="activePartition.current.address" class="text-xs text-gray-500 mt-1 truncate">
            {{ activePartition.current.address }}
          </p>
          <p v-if="activePartition.current.date_start || activePartition.current.date_end" class="text-xs text-gray-400 mt-1">
            {{ formatDateRange(activePartition.current.date_start, activePartition.current.date_end) }}
          </p>
        </RouterLink>
      </section>

      <section v-if="activePartition.planned.length > 0">
        <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Planned</h2>
        <ul class="space-y-3">
          <li v-for="project in activePartition.planned" :key="project.id">
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
      </section>
    </div>

    <!-- Archived tab -->
    <ul v-else class="space-y-3">
      <li v-for="project in archivedProjects" :key="project.id">
        <RouterLink
          :to="`/tasks/project/${project.id}`"
          class="block bg-white rounded-xl shadow-sm border border-gray-200 p-4 active:bg-gray-50 opacity-90"
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
import { useAuthStore } from '@/core/stores/auth'
import type { Project } from '@/core/utils/project-api'
import {
  fetchProjectsForTaskScope,
  isProjectActiveForTaskUi,
  isProjectArchivedForTaskUi,
} from '@/core/utils/project-list-for-user'
import { partitionProjectsForTaskRoleList, readStoredCurrentProjectId } from '@/core/utils/task-role-ux'

const authStore = useAuthStore()

const filterActive = ref(true)
const projects = ref<Project[]>([])
const isLoading = ref(true)

const activePartition = computed(() => {
  if (!filterActive.value) {
    return { current: null as Project | null, planned: [] as Project[] }
  }
  return partitionProjectsForTaskRoleList(projects.value, readStoredCurrentProjectId())
})

const archivedProjects = computed(() => projects.value.filter((p) => isProjectArchivedForTaskUi(p)))

function statusClass(status: string | undefined): string {
  if (!status) return 'bg-gray-100 text-gray-700'
  if (isProjectActiveForTaskUi({ status } as Project)) return 'bg-green-100 text-green-800'
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
    projects.value = await fetchProjectsForTaskScope(authStore.currentUser, { page: 1, limit: 100 })
  } catch {
    projects.value = []
  } finally {
    isLoading.value = false
  }
})
</script>

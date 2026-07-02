<template>
  <div class="px-4 py-4 max-w-lg mx-auto">
    <header class="mb-4">
      <h1 class="text-xl font-semibold text-gray-900">My projects</h1>
      <p class="text-sm text-gray-500 mt-1">
        Each project is one work site — open to see your tasks.
      </p>
    </header>

    <div
      class="mb-4 flex rounded-lg border border-gray-200 p-1 bg-gray-50"
      role="tablist"
      aria-label="Project lifecycle"
    >
      <button
        v-for="tab in projectTabs"
        :key="tab.id"
        type="button"
        role="tab"
        :aria-selected="projectBucket === tab.id"
        class="flex-1 rounded-md py-2 px-1 text-xs sm:text-sm font-medium transition-colors leading-tight"
        :class="projectBucket === tab.id ? 'bg-white text-orange-700 shadow-sm' : 'text-gray-600'"
        @click="projectBucket = tab.id"
      >
        {{ tab.label }}
        <span
          v-if="tab.count > 0"
          class="ml-0.5 tabular-nums"
          :class="projectBucket === tab.id ? 'text-orange-600' : 'text-gray-400'"
        >
          ({{ tab.count }})
        </span>
      </button>
    </div>

    <div v-if="isLoading" class="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <div class="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto" />
      <p class="text-sm text-gray-500 mt-3">Loading projects…</p>
    </div>

    <div v-else-if="loadError" class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      {{ loadError }}
    </div>

    <div
      v-else-if="visibleProjects.length === 0"
      class="bg-white rounded-xl border border-gray-200 border-dashed p-8 text-center"
    >
      <p class="text-gray-600 text-sm">{{ emptyBucketMessage }}</p>
    </div>

    <ul v-else class="space-y-3">
      <li v-for="project in visibleProjects" :key="project.id">
        <RouterLink
          :to="`/tasks/projects/${project.id}`"
          class="block bg-white rounded-xl shadow-sm border border-gray-200 p-4 active:bg-orange-50"
        >
          <div class="flex justify-between items-start gap-2">
            <div class="min-w-0 flex-1">
              <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Site</p>
              <span class="font-medium text-gray-900 truncate block">{{ project.prj_name }}</span>
            </div>
            <span
              :class="[
                'flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full',
                projectBadgeClass(project),
              ]"
            >
              {{ projectBadgeLabel(project) }}
            </span>
          </div>
          <p v-if="project.address" class="text-xs text-gray-500 mt-1 truncate">{{ project.address }}</p>
          <p
            v-if="project.date_start || project.date_end"
            class="text-xs text-gray-400 mt-0.5"
          >
            {{ formatProjectDates(project) }}
          </p>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Project } from '@/core/utils/project-api'
import { fetchProjectsForTaskScope } from '@/core/utils/project-list-for-user'
import {
  filterProjectsForTaskRoleList,
  getTaskRoleProjectListBucket,
  PROJECT_SYS_STATUS_LABELS,
  resolveProjectSysStatus,
  type TaskRoleProjectBucket,
} from '@/core/utils/project-sys-status'
import { useAuthStore } from '@/core/stores/auth'

const authStore = useAuthStore()
const allProjects = ref<Project[]>([])
const isLoading = ref(true)
const loadError = ref('')
const projectBucket = ref<Exclude<TaskRoleProjectBucket, 'hidden'>>('in_work')

const inWorkProjects = computed(() => filterProjectsForTaskRoleList(allProjects.value, 'in_work'))
const archivedProjects = computed(() => filterProjectsForTaskRoleList(allProjects.value, 'archived'))

const projectTabs = computed(() => [
  { id: 'in_work' as const, label: 'In work', count: inWorkProjects.value.length },
  { id: 'archived' as const, label: 'Closed', count: archivedProjects.value.length },
])

const visibleProjects = computed(() =>
  projectBucket.value === 'in_work' ? inWorkProjects.value : archivedProjects.value,
)

const emptyBucketMessage = computed(() =>
  projectBucket.value === 'in_work'
    ? 'No projects in execution. Draft and design-stage projects are not shown here.'
    : 'No closed projects yet.',
)

function projectBadgeLabel(project: Project): string {
  return PROJECT_SYS_STATUS_LABELS[resolveProjectSysStatus(project)]
}

function projectBadgeClass(project: Project): string {
  const s = resolveProjectSysStatus(project)
  if (s === 'active') return 'bg-green-100 text-green-800'
  if (s === 'closing') return 'bg-amber-100 text-amber-800'
  if (s === 'done') return 'bg-gray-100 text-gray-600'
  return 'bg-gray-100 text-gray-700'
}

function formatProjectDates(project: Project): string {
  const fmt = (d: string) => {
    try {
      return new Date(d + 'T12:00:00').toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return d
    }
  }
  if (project.date_start && project.date_end) {
    return `${fmt(project.date_start)} – ${fmt(project.date_end)}`
  }
  if (project.date_start) return `From ${fmt(project.date_start)}`
  if (project.date_end) return `Until ${fmt(project.date_end)}`
  return ''
}

function pickDefaultProjectBucket(): void {
  if (inWorkProjects.value.length > 0) {
    projectBucket.value = 'in_work'
  } else if (archivedProjects.value.length > 0) {
    projectBucket.value = 'archived'
  }
}

onMounted(async () => {
  isLoading.value = true
  loadError.value = ''
  try {
    const list = await fetchProjectsForTaskScope(authStore.currentUser, { page: 1, limit: 100 })
    allProjects.value = list.filter((p) => getTaskRoleProjectListBucket(p) !== 'hidden')
    pickDefaultProjectBucket()
  } catch {
    loadError.value = 'Could not load projects. Try again later.'
    allProjects.value = []
  } finally {
    isLoading.value = false
  }
})
</script>

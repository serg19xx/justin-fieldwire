<template>
  <div class="px-4 py-4 max-w-lg mx-auto">
    <nav class="mb-4">
      <RouterLink
        to="/tasks/projects"
        class="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Projects
      </RouterLink>
    </nav>

    <header class="mb-4">
      <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Site</p>
      <h1 class="text-xl font-semibold text-gray-900 mt-0.5">{{ projectName }}</h1>
    </header>

    <div v-if="isForeman" class="mb-3 flex rounded-lg border border-gray-200 p-1 bg-gray-50">
      <button
        type="button"
        class="flex-1 rounded-md py-2 text-sm font-medium transition-colors"
        :class="scopeFilter === 'mine' ? 'bg-white text-orange-700 shadow-sm' : 'text-gray-600'"
        @click="scopeFilter = 'mine'"
      >
        My tasks
      </button>
      <button
        type="button"
        class="flex-1 rounded-md py-2 text-sm font-medium transition-colors"
        :class="scopeFilter === 'all' ? 'bg-white text-orange-700 shadow-sm' : 'text-gray-600'"
        @click="scopeFilter = 'all'"
      >
        All tasks
      </button>
    </div>

    <div
      class="mb-4 flex rounded-lg border border-gray-200 p-1 bg-gray-50"
      role="tablist"
      aria-label="Task status"
    >
      <button
        v-for="tab in statusTabs"
        :key="tab.id"
        type="button"
        role="tab"
        :aria-selected="statusBucket === tab.id"
        class="flex-1 rounded-md py-2 px-1 text-xs sm:text-sm font-medium transition-colors leading-tight"
        :class="statusBucket === tab.id ? 'bg-white text-orange-700 shadow-sm' : 'text-gray-600'"
        @click="statusBucket = tab.id"
      >
        {{ tab.label }}
        <span
          v-if="tab.count > 0"
          class="ml-0.5 tabular-nums"
          :class="statusBucket === tab.id ? 'text-orange-600' : 'text-gray-400'"
        >
          ({{ tab.count }})
        </span>
      </button>
    </div>

    <div v-if="isLoading" class="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <div class="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto" />
    </div>

    <div v-else-if="loadError" class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      {{ loadError }}
    </div>

    <div
      v-else-if="visibleTasks.length === 0"
      class="bg-white rounded-xl border border-gray-200 border-dashed p-8 text-center"
    >
      <p class="text-gray-600 text-sm">{{ emptyBucketMessage }}</p>
    </div>

    <ul v-else class="space-y-2">
      <li v-for="task in visibleTasks" :key="task.id">
        <RouterLink
          :to="`/tasks/projects/${projectId}/tasks/${task.id}`"
          class="block bg-white rounded-xl border border-gray-200 p-4 active:bg-orange-50"
        >
          <div class="flex items-start justify-between gap-2">
            <span class="font-medium text-gray-900 leading-snug">{{ task.name }}</span>
            <span class="text-xs font-medium text-gray-500 shrink-0">{{ task.progress_pct ?? 0 }}%</span>
          </div>
          <p
            v-if="taskSiteAddress(task)"
            class="text-xs text-gray-500 mt-1.5 whitespace-pre-wrap break-words leading-snug"
          >
            {{ taskSiteAddress(task) }}
          </p>
          <p class="text-xs text-gray-500 mt-1">{{ formatBackendTaskStatus(String(task.status)) }}</p>
          <p
            v-if="task.start_planned"
            class="text-xs text-gray-400 mt-0.5"
          >
            {{ formatTaskDates(task) }}
          </p>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/core/stores/auth'
import type { Task } from '@/core/types/task'
import { projectApi } from '@/core/utils/project-api'
import { resolveSessionUserId } from '@/core/utils/session-user-id'
import {
  filterTasksForInvolvedUser,
  formatBackendTaskStatus,
  getTaskRoleStatusBucket,
  isTaskRoleForeman,
  resolveTaskSiteAddress,
  sortTasksForRoleBucket,
  type TaskRoleStatusBucket,
} from '@/core/utils/task-role-ux'
import { tasksApi } from '@/core/utils/tasks-api'

const route = useRoute()
const authStore = useAuthStore()

const projectId = computed(() => Number(route.params.projectId))
const projectName = ref('Project')
const projectAddress = ref('')
const tasks = ref<Task[]>([])
const isLoading = ref(true)
const loadError = ref('')
const scopeFilter = ref<'mine' | 'all'>('mine')
const statusBucket = ref<TaskRoleStatusBucket>('planned')

const isForeman = computed(() =>
  isTaskRoleForeman(authStore.currentUser?.role_code, authStore.currentUser?.role_id),
)

const scopedTasks = computed(() => {
  const uid = resolveSessionUserId(authStore.currentUser)
  let list = tasks.value
  if (isForeman.value && scopeFilter.value === 'all') {
    return list
  }
  if (uid != null) {
    return filterTasksForInvolvedUser(list, uid)
  }
  return []
})

const bucketCounts = computed(() => {
  const counts: Record<TaskRoleStatusBucket, number> = {
    active: 0,
    planned: 0,
    finished: 0,
  }
  for (const task of scopedTasks.value) {
    const bucket = getTaskRoleStatusBucket(String(task.status))
    counts[bucket] += 1
  }
  return counts
})

const statusTabs = computed(() => [
  { id: 'planned' as const, label: 'Planned', count: bucketCounts.value.planned },
  { id: 'active' as const, label: 'In progress', count: bucketCounts.value.active },
  { id: 'finished' as const, label: 'Closed', count: bucketCounts.value.finished },
])

const visibleTasks = computed(() => {
  const inBucket = scopedTasks.value.filter(
    (t) => getTaskRoleStatusBucket(String(t.status)) === statusBucket.value,
  )
  return sortTasksForRoleBucket(inBucket, statusBucket.value)
})

const emptyBucketMessage = computed(() => {
  if (statusBucket.value === 'active') return 'No tasks in progress.'
  if (statusBucket.value === 'planned') return 'No planned tasks.'
  return 'No closed tasks.'
})

function taskSiteAddress(task: Task): string {
  return resolveTaskSiteAddress(task, { address: projectAddress.value })
}

function formatTaskDates(task: Task): string {
  const fmt = (d: string) => {
    try {
      return new Date(d + 'T12:00:00').toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return d
    }
  }
  if (task.start_planned && task.end_planned) {
    return `${fmt(task.start_planned)} – ${fmt(task.end_planned)}`
  }
  if (task.start_planned) return fmt(task.start_planned)
  return ''
}

async function load(): Promise<void> {
  const pid = projectId.value
  if (!pid) return
  isLoading.value = true
  loadError.value = ''
  try {
    const [project, taskResult] = await Promise.all([
      projectApi.getById(pid),
      tasksApi.getAll(pid, 1, 500),
    ])
    projectName.value = project?.prj_name ?? `Project #${pid}`
    projectAddress.value = project?.address ?? ''
    tasks.value = taskResult.tasks ?? []
    pickDefaultBucket()
  } catch {
    loadError.value = 'Could not load project tasks.'
    tasks.value = []
  } finally {
    isLoading.value = false
  }
}

function pickDefaultBucket(): void {
  const counts = bucketCounts.value
  if (counts.active > 0) {
    statusBucket.value = 'active'
  } else if (counts.planned > 0) {
    statusBucket.value = 'planned'
  } else {
    statusBucket.value = 'finished'
  }
}

onMounted(() => {
  void load()
})

watch(projectId, () => {
  void load()
})

watch(scopeFilter, () => {
  if (visibleTasks.value.length === 0 && scopedTasks.value.length > 0) {
    pickDefaultBucket()
  }
})
</script>

<template>
  <div class="px-4 py-4 max-w-lg mx-auto">
    <!-- Back -->
    <RouterLink
      :to="'/tasks'"
      class="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700 mb-4"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Projects
    </RouterLink>

    <div v-if="isLoadingProject" class="flex justify-center py-12">
      <div class="animate-spin w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full" />
    </div>

    <template v-else-if="project">
      <!-- Project header -->
      <header class="mb-6">
        <h1 class="text-xl font-semibold text-gray-900">{{ project.prj_name }}</h1>
        <div class="flex items-center gap-2 mt-1">
          <span
            :class="[
              'text-xs font-medium px-2 py-0.5 rounded-full',
              project.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700',
            ]"
          >
            {{ project.status || '—' }}
          </span>
          <span v-if="stats" class="text-xs text-gray-500">
            {{ stats.completed ?? 0 }}/{{ stats.total ?? 0 }} tasks · {{ Math.round(stats.avgProgress ?? 0) }}% done
          </span>
        </div>
        <p v-if="project.address" class="text-sm text-gray-500 mt-1 truncate">{{ project.address }}</p>
      </header>

      <!-- Tasks (sorted by earliest date first) -->
      <section>
        <h2 class="text-base font-semibold text-gray-900 mb-3">Tasks</h2>
        <div v-if="isLoadingTasks" class="flex justify-center py-8">
          <div class="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
        </div>
        <ul v-else-if="sortedTasks.length === 0" class="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <p class="text-gray-500 text-sm">No tasks in this project.</p>
        </ul>
        <ul v-else class="space-y-3">
          <li v-for="task in sortedTasks" :key="task.id">
            <RouterLink
              :to="`/tasks/project/${projectId}/task/${task.id}`"
              class="block bg-white rounded-xl shadow-sm border border-gray-200 p-4 active:bg-gray-50"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <span v-if="isMilestone(task.milestone)" class="text-amber-600" aria-hidden="true">{{ MILESTONE_ICON }}</span>
                    <span class="font-medium text-gray-900 truncate">{{ task.name }}</span>
                  </div>
                  <p class="text-xs text-gray-500 mt-0.5">
                    {{ formatDateRange(task.start_planned, task.end_planned) }}
                  </p>
                </div>
                <div class="flex flex-col items-end gap-1 flex-shrink-0">
                  <span :class="statusClass(task.status)">
                    {{ getTaskStatusLabel((task.status as TaskStatus)) }}
                  </span>
                  <span class="text-xs text-gray-400">{{ task.progress_pct ?? 0 }}%</span>
                </div>
              </div>
            </RouterLink>
          </li>
        </ul>
      </section>
    </template>

    <div v-else class="text-center py-12 text-gray-500">
      <p>Project not found.</p>
      <RouterLink to="/tasks" class="text-orange-600 font-medium mt-2 inline-block">Back to projects</RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { projectApi } from '@/core/utils/project-api'
import { tasksApi } from '@/core/utils/tasks-api'
import { getTaskStatusLabel, MILESTONE_ICON } from '@/core/utils/task-utils'
import { isMilestone } from '@/core/types/task'
import type { Project } from '@/core/utils/project-api'
import type { Task, TaskStatus } from '@/core/types/task'
import type { TaskStats } from '@/core/types/task'

const route = useRoute()
const projectId = computed(() => Number(route.params.id))

const project = ref<Project | null>(null)
const tasks = ref<Task[]>([])
const stats = ref<TaskStats | null>(null)
const isLoadingProject = ref(true)
const isLoadingTasks = ref(true)

const sortedTasks = computed(() => {
  const list = [...tasks.value]
  return list.sort((a, b) => {
    const aStart = a.start_planned ? new Date(a.start_planned).getTime() : 0
    const bStart = b.start_planned ? new Date(b.start_planned).getTime() : 0
    return aStart - bStart
  })
})

function statusClass(status: string | undefined): string {
  const map: Record<string, string> = {
    planned: 'bg-amber-100 text-amber-800',
    scheduled: 'bg-blue-100 text-blue-800',
    scheduled_accepted: 'bg-indigo-100 text-indigo-800',
    in_progress: 'bg-green-100 text-green-800',
    partially_completed: 'bg-teal-100 text-teal-800',
    delayed_due_to_issue: 'bg-orange-100 text-orange-800',
    ready_for_inspection: 'bg-cyan-100 text-cyan-800',
    completed: 'bg-gray-100 text-gray-800',
  }
  return map[status ?? ''] ?? 'bg-gray-100 text-gray-700'
}

function formatDateRange(start: string | undefined, end: string | undefined): string {
  const s = start ? new Date(start).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''
  const e = end ? new Date(end).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''
  if (s && e && s !== e) return `${s} – ${e}`
  return s || e || '—'
}

async function loadProject() {
  if (!projectId.value) return
  isLoadingProject.value = true
  try {
    project.value = await projectApi.getById(projectId.value)
  } catch {
    project.value = null
  } finally {
    isLoadingProject.value = false
  }
}

async function loadTasks() {
  if (!projectId.value) return
  isLoadingTasks.value = true
  try {
    const res = await tasksApi.getAll(projectId.value, 1, 500)
    tasks.value = res.tasks ?? []
  } catch {
    tasks.value = []
  } finally {
    isLoadingTasks.value = false
  }
}

async function loadStats() {
  if (!projectId.value) return
  try {
    stats.value = await tasksApi.getStats(projectId.value)
  } catch {
    stats.value = null
  }
}

onMounted(() => {
  loadProject()
  loadTasks()
  loadStats()
})

watch(projectId, () => {
  loadProject()
  loadTasks()
  loadStats()
})
</script>

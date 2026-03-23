<template>
  <div class="px-4 py-4 max-w-lg mx-auto">
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
      <header class="mb-5">
        <h1 class="text-xl font-semibold text-gray-900">{{ project.prj_name }}</h1>
        <div class="flex items-center gap-2 mt-1 flex-wrap">
          <span
            :class="[
              'text-xs font-medium px-2 py-0.5 rounded-full',
              project.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700',
            ]"
          >
            {{ project.status || '—' }}
          </span>
          <span v-if="stats" class="text-xs text-gray-500">
            {{ stats.completed ?? 0 }}/{{ stats.total ?? 0 }} tasks
          </span>
        </div>
        <p v-if="project.address" class="text-sm text-gray-500 mt-1 truncate">{{ project.address }}</p>
      </header>

      <section>
        <h2 class="text-base font-semibold text-gray-900 mb-1">Tasks</h2>
        <p class="text-xs text-gray-500 mb-3">
          All project tasks. Open a task for details, photos, and notes. End-of-day actions will be added next.
        </p>

        <div v-if="isLoadingTasks" class="flex justify-center py-8">
          <div class="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
        </div>

        <div v-else-if="tasks.length === 0" class="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <p class="text-gray-500 text-sm">No tasks in this project.</p>
        </div>

        <div v-else class="space-y-6">
          <div v-if="taskPanels.primary">
            <h3 class="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-2">Active now</h3>
            <ul class="space-y-3">
              <li>
                <RouterLink
                  :to="`/tasks/project/${projectId}/task/${taskPanels.primary.id}`"
                  class="block bg-white rounded-xl shadow-sm border-2 border-orange-300 p-4 active:bg-orange-50"
                >
                  <TaskListRowContent :task="taskPanels.primary" />
                </RouterLink>
              </li>
            </ul>
          </div>

          <div v-if="taskPanels.planned.length > 0">
            <h3
              class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2"
              :class="taskPanels.primary ? 'pt-1' : ''"
            >
              Planned
            </h3>
            <ul class="space-y-3">
              <li v-for="task in taskPanels.planned" :key="task.id">
                <RouterLink
                  :to="`/tasks/project/${projectId}/task/${task.id}`"
                  class="block bg-white rounded-xl shadow-sm border border-gray-200 p-4 active:bg-gray-50"
                >
                  <TaskListRowContent :task="task" />
                </RouterLink>
              </li>
            </ul>
          </div>
        </div>
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
import { useAuthStore } from '@/core/stores/auth'
import { projectApi } from '@/core/utils/project-api'
import { tasksApi } from '@/core/utils/tasks-api'
import type { Project } from '@/core/utils/project-api'
import type { Task } from '@/core/types/task'
import type { TaskStats } from '@/core/types/task'
import { splitTasksForTaskRolePanel, writeStoredCurrentProjectId } from '@/core/utils/task-role-ux'
import TaskListRowContent from './TaskListRowContent.vue'

const route = useRoute()
const authStore = useAuthStore()
const projectId = computed(() => Number(route.params.id))

const project = ref<Project | null>(null)
const tasks = ref<Task[]>([])
const stats = ref<TaskStats | null>(null)
const isLoadingProject = ref(true)
const isLoadingTasks = ref(true)

const taskPanels = computed(() =>
  splitTasksForTaskRolePanel(tasks.value, authStore.currentUser?.id ?? null),
)

watch(
  () => project.value?.id,
  (id) => {
    if (id != null && Number.isFinite(id)) {
      writeStoredCurrentProjectId(id)
    }
  },
)

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

<template>
  <div class="px-4 py-4 max-w-lg mx-auto">
    <nav class="mb-4" aria-label="Breadcrumb">
      <ol class="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
        <li>
          <RouterLink to="/tasks" class="font-medium text-orange-600 hover:text-orange-700">Projects</RouterLink>
        </li>
        <li class="text-gray-300 select-none" aria-hidden="true">/</li>
        <li>
          <span class="font-medium text-gray-900" aria-current="page">Tasks</span>
        </li>
      </ol>
    </nav>

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
          <span v-if="!isLoadingTasks" class="text-xs text-gray-500">
            <template v-if="isForeman">{{ taskSummary.completed }}/{{ taskSummary.total }} tasks</template>
            <template v-else>{{ taskSummary.completed }}/{{ taskSummary.total }} your tasks</template>
          </span>
        </div>
        <p v-if="project.address" class="text-sm text-gray-500 mt-1 truncate">{{ project.address }}</p>
      </header>

      <section>
        <h2 class="text-base font-semibold text-gray-900 mb-1">Tasks</h2>
        <p class="text-xs text-gray-500 mb-3">
          <template v-if="isForeman">
            All tasks in this project. Open any task for details, photos, and notes.
          </template>
          <template v-else>
            Tasks where you are lead or team member. Open a task for details, photos, and notes.
          </template>
        </p>

        <div v-if="isLoadingTasks" class="flex justify-center py-8">
          <div class="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
        </div>

        <div v-else-if="tasks.length === 0" class="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <p class="text-gray-500 text-sm">No tasks assigned to you in this project.</p>
        </div>

        <div v-else class="space-y-6">
          <div v-if="taskPanels.primary">
            <h3 class="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-2">Active now</h3>
            <ul class="space-y-3">
              <li>
                <RouterLink
                  :to="{
                    path: `/tasks/project/${projectId}/task/${taskPanels.primary.id}`,
                    query: { from: 'project' },
                  }"
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
                  :to="{
                    path: `/tasks/project/${projectId}/task/${task.id}`,
                    query: { from: 'project' },
                  }"
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
import {
  filterTasksForInvolvedUser,
  isTaskRoleForeman,
  resolveSessionUserId,
  splitTasksForTaskRolePanel,
  writeStoredCurrentProjectId,
} from '@/core/utils/task-role-ux'
import TaskListRowContent from './TaskListRowContent.vue'

const route = useRoute()
const authStore = useAuthStore()
const projectId = computed(() => Number(route.params.id))

const project = ref<Project | null>(null)
const tasks = ref<Task[]>([])
const isLoadingProject = ref(true)
const isLoadingTasks = ref(true)

const isForeman = computed(() =>
  isTaskRoleForeman(authStore.currentUser?.role_code, authStore.currentUser?.role_id),
)

const sessionUserId = computed(() => resolveSessionUserId(authStore.currentUser))

const taskPanels = computed(() =>
  splitTasksForTaskRolePanel(tasks.value, sessionUserId.value ?? null),
)

function countCompletedForSummary(list: Task[]): number {
  return list.filter((t) => {
    const n = String(t.status ?? '')
      .toLowerCase()
      .replace(/-/g, '_')
    return n === 'completed' || n === 'done' || n === 'ready_for_inspection'
  }).length
}

const taskSummary = computed(() => {
  const list = tasks.value
  return { completed: countCompletedForSummary(list), total: list.length }
})

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
  const foreman = isTaskRoleForeman(authStore.currentUser?.role_code, authStore.currentUser?.role_id)
  const sessionUid = resolveSessionUserId(authStore.currentUser)
  const useWorkerScope = !foreman && sessionUid != null
  isLoadingTasks.value = true
  try {
    // Always load full project task list (same as foreman). Backend returns all tasks; scope by assignees on the client.
    // Sending user_id breaks some servers; string `id` from session also broke useWorkerScope (Number.isFinite).
    const res = await tasksApi.getAll(projectId.value, 1, 500, undefined)
    const raw = res.tasks ?? []

    if (foreman) {
      tasks.value = raw
      return
    }

    if (!useWorkerScope) {
      tasks.value = []
      return
    }

    tasks.value = filterTasksForInvolvedUser(raw, sessionUid)
    if (tasks.value.length === 0 && raw.length > 0) {
      console.warn(
        '[TaskProjectDetail] No tasks matched session user id against task_lead_id / team_members / assignees.',
        { projectId: projectId.value, sessionUserId: sessionUid },
      )
    }
  } catch {
    tasks.value = []
  } finally {
    isLoadingTasks.value = false
  }
}

onMounted(() => {
  loadProject()
  loadTasks()
})

watch(projectId, () => {
  loadProject()
  loadTasks()
})
</script>

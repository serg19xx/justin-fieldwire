<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { tasksApi } from '@/utils/tasks-api'
import type { Task, TaskFilter, TaskCreateUpdate } from '@/types/task'
import { projectsApi } from '@/utils/contacts-api'
import TaskDialog from '@/components/TaskDialog.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// Task data
const tasks = ref<Task[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const pagination = ref({
  current_page: 1,
  per_page: 20,
  total: 0,
  last_page: 1
})

// Projects for filter
const projects = ref<Array<{ id: number; prj_name: string }>>([])

// Filters (unused - individual filter refs are used instead)
// const filters = ref<TaskFilter>({
//   status: [],
//   assignees: [],
//   resources: [],
//   wbsPath: []
// })

const statusFilter = ref('all')
const priorityFilter = ref('all')
const projectFilter = ref('')
const assigneeFilter = ref('')
const searchQuery = ref('')

// Dialog state
const showTaskDialog = ref(false)
const taskDialogMode = ref<'create' | 'edit'>('create')
const selectedTask = ref<Task | null>(null)

// Load projects for filter
async function loadProjects() {
  try {
    const response = await projectsApi.getAll(1, 100)
    projects.value = response.projects
  } catch (error) {
    console.error('Error loading projects:', error)
    console.log('⚠️ Projects API not available')
    projects.value = []
  }
}

// Load tasks from API
async function loadTasks() {
  loading.value = true
  error.value = null

  try {
    console.log('🚀 Loading tasks from API...')

    // Build filters
    const taskFilters: TaskFilter = {
      status: statusFilter.value !== 'all' ? [statusFilter.value as 'planned' | 'in_progress' | 'done' | 'blocked' | 'delayed'] : [],
      assignees: assigneeFilter.value ? [assigneeFilter.value] : [],
      resources: [],
      wbsPath: []
    }

    // Get project ID from route or use filter
    const projectId = route.params.projectId ? parseInt(route.params.projectId as string) :
                     (projectFilter.value ? parseInt(projectFilter.value) : 0)

    if (projectId > 0) {
      const response = await tasksApi.getAll(
        projectId,
        pagination.value.current_page,
        pagination.value.per_page,
        taskFilters
      )

      tasks.value = response.tasks
      pagination.value = response.pagination
      console.log('✅ Tasks loaded:', tasks.value.length)
    } else {
      // Load tasks from all projects if no specific project
      tasks.value = []
      console.log('⚠️ No project selected, showing empty task list')
    }
  } catch (apiError: unknown) {
    console.error('❌ Error loading tasks:', apiError)
    console.log('⚠️ Tasks API not available')
    console.log('🔍 API Error details:', {
      message: apiError instanceof Error ? apiError.message : 'Unknown error',
      response: (apiError as { response?: unknown })?.response || 'No response data'
    })

    // No fallback - use empty array
    tasks.value = []
    pagination.value = {
      current_page: 1,
      per_page: 20,
      total: 0,
      last_page: 1
    }
  } finally {
    loading.value = false
  }
}

// Computed filtered tasks
const filteredTasks = computed(() => {
  return tasks.value
})

// Task management functions
function searchAndOpenCalendar() {
  if (!searchQuery.value.trim()) {
    alert('Please enter a search term')
    return
  }

  // Find tasks that match the search query
  const matchingTasks = tasks.value.filter(task =>
    task.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    task.notes?.toLowerCase().includes(searchQuery.value.toLowerCase())
  )

  if (matchingTasks.length === 0) {
    alert('No tasks found matching your search')
    return
  }

  if (matchingTasks.length === 1) {
    // Single task found - open calendar and highlight it
    const task = matchingTasks[0]
    console.log('🎯 Found single task:', task.name)

    // Navigate to calendar view
    router.push(`/projects/${route.params.projectId}?view=calendar&highlight=${task.id}`)
  } else {
    // Multiple tasks found - show list and let user choose
    const taskNames = matchingTasks.map(t => t.name).join('\n')
    const choice = confirm(`Found ${matchingTasks.length} tasks:\n\n${taskNames}\n\nOpen calendar to view all results?`)

    if (choice) {
      router.push(`/projects/${route.params.projectId}?view=calendar&search=${encodeURIComponent(searchQuery.value)}`)
    }
  }
}

function openEditTaskDialog(task: Task) {
  taskDialogMode.value = 'edit'
  selectedTask.value = task
  showTaskDialog.value = true
  console.log('🔧 Opening edit task dialog for:', task.name)
  console.log('📋 Available tasks for dependencies:', availableTasksForDependencies.value.length)
  console.log('🔗 Current task dependencies:', task.dependencies)
}

function closeTaskDialog() {
  showTaskDialog.value = false
  selectedTask.value = null
}

async function handleTaskSave(taskData: Partial<Task>) {
  try {
    console.log('💾 Saving task:', taskData)

    if (taskDialogMode.value === 'create') {
      // Create new task
      await tasksApi.create(taskData.project_id!, taskData as TaskCreateUpdate)
      console.log('✅ Task created successfully')
    } else if (taskDialogMode.value === 'edit' && selectedTask.value) {
      // Update existing task
      await tasksApi.update(taskData.project_id!, selectedTask.value.id, taskData as Partial<TaskCreateUpdate>)
      console.log('✅ Task updated successfully')
    }

    // Reload tasks
    await loadTasks()
    closeTaskDialog()
  } catch (error) {
    console.error('❌ Error saving task:', error)
    alert('Failed to save task. Please try again.')
  }
}

async function handleTaskDelete(taskId: string) {
  // Find task name for confirmation
  const task = tasks.value.find(t => String(t.id) === String(taskId))
  const taskName = task?.name || 'this task'

  if (!confirm(`Are you sure you want to delete "${taskName}"? This action cannot be undone.`)) {
    return
  }

  try {
    console.log('🗑️ Deleting task:', taskId)

    const projectId = route.params.projectId ? parseInt(route.params.projectId as string) : 0
    if (projectId > 0) {
      await tasksApi.delete(projectId, taskId)
      console.log('✅ Task deleted successfully')

      // Reload tasks
      await loadTasks()
    }
  } catch (error) {
    console.error('❌ Error deleting task:', error)
    alert('Failed to delete task. Please try again.')
  }
}

async function handleTaskDuplicate(task: Task) {
  try {
    console.log('📋 Duplicating task:', task.name)

    const duplicateData: TaskCreateUpdate = {
      name: `${task.name} (Copy)`,
      project_id: task.project_id,
      start_planned: task.start_planned,
      end_planned: task.end_planned,
      status: 'planned',
      progress_pct: 0,
      milestone: task.milestone,
      notes: task.notes,
      wbs_path: task.wbs_path,
      task_lead_id: task.task_lead_id, // Добавляем обязательное поле
      dependencies: Array.isArray(task.dependencies) && task.dependencies.length > 0 && typeof task.dependencies[0] === 'object'
        ? task.dependencies as { predecessor_id: number; type: string; lag_days: number; }[]
        : undefined
    }

    await tasksApi.create(task.project_id, duplicateData)
    console.log('✅ Task duplicated successfully')

    // Reload tasks
    await loadTasks()
  } catch (error) {
    console.error('❌ Error duplicating task:', error)
    alert('Failed to duplicate task. Please try again.')
  }
}

// Filter change handlers
function handleFilterChange() {
  pagination.value.current_page = 1
  loadTasks()
}

// Watch for filter changes
watch([statusFilter, priorityFilter, projectFilter, assigneeFilter, searchQuery], () => {
  handleFilterChange()
})

// Pagination handlers
function handlePageChange(page: number) {
  pagination.value.current_page = page
  loadTasks()
}

// function handleItemsPerPageChange(items: number) {
//   pagination.value.per_page = items
//   pagination.value.current_page = 1
//   loadTasks()
// }

function getStatusColor(status: string) {
  switch (status) {
    case 'in_progress':
      return 'bg-blue-100 text-blue-800'
    case 'planned':
      return 'bg-yellow-100 text-yellow-800'
    case 'done':
      return 'bg-green-100 text-green-800'
    case 'blocked':
      return 'bg-red-100 text-red-800'
    case 'delayed':
      return 'bg-orange-100 text-orange-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// function getPriorityColor(priority: string) {
//   switch (priority) {
//     case 'High':
//       return 'bg-red-100 text-red-800'
//     case 'Medium':
//       return 'bg-yellow-100 text-yellow-800'
//     case 'Low':
//       return 'bg-green-100 text-green-800'
//     default:
//       return 'bg-gray-100 text-gray-800'
//   }
// }

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Check if user can manage tasks
const canManageTasks = computed(() => {
  return authStore.currentUser?.user_type === 'Project Manager' ||
         authStore.currentUser?.user_type === 'System Administrator'
})

// Available tasks for dependencies (exclude current task)
const availableTasksForDependencies = computed(() => {
  if (selectedTask.value) {
    return tasks.value.filter(t => String(t.id) !== String(selectedTask.value?.id))
  }
  return tasks.value
})

// Load data on mount
onMounted(() => {
  loadProjects()
  loadTasks()
})
</script>

<template>
  <div class="space-y-6 p-6">
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-gray-900">Tasks</h2>
      <p class="mt-1 text-sm text-gray-500">Manage and track project tasks</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <svg class="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-gray-600">Loading tasks...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-md p-4">
      <div class="flex">
        <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <div class="ml-3">
          <p class="text-sm text-red-800">{{ error }}</p>
          <button @click="loadTasks" class="mt-2 text-sm text-red-600 hover:text-red-500 underline">
            Try again
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else>
      <div class="flex justify-between items-center mb-6">
        <div class="flex space-x-3">
          <button class="bg-white text-gray-700 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors">
            Import Tasks
          </button>
        </div>

        <!-- Filters -->
        <div class="flex space-x-2">
          <!-- Search -->
          <div class="flex space-x-2">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search tasks..."
              class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              @keyup.enter="searchAndOpenCalendar"
            />
            <button
              @click="searchAndOpenCalendar"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              title="Search and open in calendar"
            >
              🔍
            </button>
          </div>

          <!-- Project Filter -->
          <select
            v-model="projectFilter"
            class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">All Projects</option>
            <option v-for="project in projects" :key="project.id" :value="project.id">
              {{ project.prj_name }}
            </option>
          </select>

          <!-- Status Filter -->
          <select
            v-model="statusFilter"
            class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
            <option value="blocked">Blocked</option>
            <option value="delayed">Delayed</option>
          </select>

          <!-- Priority Filter -->
          <select
            v-model="priorityFilter"
            class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      <!-- Tasks Table -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium text-gray-900">Task List</h3>
            <div class="text-sm text-gray-500">
              {{ pagination.total }} tasks total
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="filteredTasks.length === 0" class="p-12 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No tasks found</h3>
          <p class="mt-1 text-sm text-gray-500">
            {{ projectFilter ? 'No tasks match your current filters.' : 'Get started by creating a new task.' }}
          </p>
        </div>

        <!-- Tasks List -->
        <div v-else class="divide-y divide-gray-200">
          <div
            v-for="task in filteredTasks"
            :key="task.id"
            class="px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <div class="flex items-center space-x-2">
                      <!-- Task/Milestone Icon -->
                      <span v-if="task.milestone" class="text-lg">🎯</span>
                      <span v-else class="text-lg">📋</span>
                      <h4 class="text-sm font-medium text-gray-900">{{ task.name }}</h4>
                    </div>
                  </div>
                  <div class="flex items-center space-x-2">
                    <span
                      :class="getStatusColor(task.status)"
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    >
                      {{ task.status.replace('_', ' ') }}
                    </span>
                    <div class="text-xs text-gray-500">
                      {{ task.progress_pct }}%
                    </div>
                  </div>
                </div>

                <p v-if="task.notes" class="mt-1 text-sm text-gray-500">{{ task.notes }}</p>

                <div class="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                  <span v-if="task.start_planned">
                    Start: {{ formatDate(task.start_planned) }}
                  </span>
                  <span v-if="task.end_planned">
                    End: {{ formatDate(task.end_planned) }}
                  </span>
                  <span v-if="task.duration_days">
                    Duration: {{ task.duration_days }} days
                  </span>
                  <span v-if="task.wbs_path">
                    WBS: {{ task.wbs_path }}
                  </span>
                </div>

                <!-- Progress Bar -->
                <div v-if="task.progress_pct > 0" class="mt-2">
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div
                      class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      :style="{ width: `${task.progress_pct}%` }"
                    ></div>
                  </div>
                </div>
              </div>

              <div class="flex items-center space-x-2 ml-4">
                <button
                  v-if="canManageTasks"
                  @click="openEditTaskDialog(task)"
                  class="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  v-if="canManageTasks"
                  @click="handleTaskDuplicate(task)"
                  class="text-green-600 hover:text-green-800 text-sm font-medium"
                >
                  Duplicate
                </button>
                <button
                  v-if="canManageTasks"
                  @click="handleTaskDelete(task.id)"
                  class="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Delete
                </button>
                <button
                  v-if="canManageTasks"
                  @click="handleTaskDelete(task.id)"
                  class="text-red-400 hover:text-red-600 p-1"
                  title="Delete task"
                >
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="pagination.last_page > 1" class="px-6 py-4 border-t border-gray-200">
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-700">
              Showing {{ (pagination.current_page - 1) * pagination.per_page + 1 }} to
              {{ Math.min(pagination.current_page * pagination.per_page, pagination.total) }} of
              {{ pagination.total }} results
            </div>
            <div class="flex items-center space-x-2">
              <button
                @click="handlePageChange(pagination.current_page - 1)"
                :disabled="pagination.current_page <= 1"
                class="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span class="px-3 py-1 text-sm text-gray-700">
                Page {{ pagination.current_page }} of {{ pagination.last_page }}
              </span>
              <button
                @click="handlePageChange(pagination.current_page + 1)"
                :disabled="pagination.current_page >= pagination.last_page"
                class="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Task Dialog -->
  <TaskDialog
    v-if="showTaskDialog"
    :is-open="showTaskDialog"
    :mode="taskDialogMode"
    :task="selectedTask"
    :project-id="projectFilter ? parseInt(projectFilter) : 0"
    :available-tasks="availableTasksForDependencies"
    @close="closeTaskDialog"
    @save="handleTaskSave"
    @delete="handleTaskDelete"
    @duplicate="handleTaskDuplicate"
  />
</template>

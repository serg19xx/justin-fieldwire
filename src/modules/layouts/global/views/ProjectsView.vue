<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/core/stores/auth'
import { type ProjectPriority, type ProjectStatus } from '@/utils/constants'
import { projectsApi, type Project as ApiProject } from '@/utils/contacts-api'

const router = useRouter()
const authStore = useAuthStore()

// Project interface (mapped from API)
interface Project {
  id: number
  name: string
  address: string
  priority: string
  startDate: string
  endDate: string
  status: string
  projectManager?: number
  description?: string
  createdAt: string
  updatedAt: string
}

// Real data from database
const projects = ref<Project[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const pagination = ref({
  current_page: 1,
  per_page: 20,
  total: 0,
  last_page: 1
})

// Filters
const searchQuery = ref('')
const statusFilter = ref('')
const priorityFilter = ref('')
const managerFilter = ref<number | undefined>(undefined)

// Dialog state
const isNewProjectDialogOpen = ref(false)
const newProjectForm = ref({
  name: '',
  address: '',
  priority: 'low' as ProjectPriority,
  status: 'draft' as ProjectStatus,
  startDate: '',
  endDate: ''
})
const isSubmitting = ref(false)

// Load projects from database
async function loadProjects() {
  loading.value = true
  error.value = null

  try {
    console.log('🚀 Loading projects from database')

    // For Project Manager, automatically filter by their ID
    // For System Administrator, use the selected filter
    let prjManagerFilter = managerFilter.value
    if (authStore.currentUser?.user_type === 'Project Manager') {
      prjManagerFilter = authStore.currentUser.id
    }

    const response = await projectsApi.getAll(
      pagination.value.current_page,
      pagination.value.per_page,
      {
        status: statusFilter.value || undefined,
        priority: priorityFilter.value || undefined,
        search: searchQuery.value || undefined,
        prj_manager: prjManagerFilter
      }
    )

    // Map API data to frontend format
    projects.value = response.projects.map((apiProject: ApiProject) => ({
      id: apiProject.id,
      name: apiProject.prj_name,
      address: apiProject.address,
      priority: apiProject.priority,
      startDate: apiProject.date_start,
      endDate: apiProject.date_end,
      status: apiProject.status,
      projectManager: apiProject.prj_managger || undefined, // cspell:ignore managger
      description: '',
      createdAt: apiProject.created_at,
      updatedAt: apiProject.updated_at
    }))

    pagination.value = response.pagination
    console.log('✅ Projects loaded from database:', projects.value.length)
  } catch (apiError: unknown) {
    console.error('❌ Database error:', apiError)
    error.value = 'Failed to load projects from database'
    projects.value = []
  } finally {
    loading.value = false
  }
}

// Computed filtered projects (now just returns all projects since filtering is done on server)
const filteredProjects = computed(() => {
  return projects.value
})

// Check if user can create projects (only Project Manager)
const canCreateProjects = computed(() => {
  return authStore.currentUser?.user_type === 'Project Manager'
})

// Check if user can filter by managers (only System Administrator)
const canFilterByManagers = computed(() => {
  return authStore.currentUser?.user_type === 'System Administrator'
})

// Load projects on mount
onMounted(() => {
  loadProjects()
})

// Watch for filter changes and reload data
// For Project Manager, don't watch managerFilter since it's automatically set
const watchedFilters = computed(() => {
  if (authStore.currentUser?.user_type === 'Project Manager') {
    return [searchQuery, statusFilter, priorityFilter]
  } else {
    return [searchQuery, statusFilter, priorityFilter, managerFilter]
  }
})

watch(watchedFilters, () => {
  loadProjects()
}, { deep: true })

// Helper functions
function getPriorityColor(priority: string) {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 text-red-800'
    case 'high':
      return 'bg-orange-100 text-orange-800'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'low':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-800'
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'planning':
      return 'bg-blue-100 text-blue-800'
    case 'on-hold':
      return 'bg-yellow-100 text-yellow-800'
    case 'completed':
      return 'bg-gray-100 text-gray-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function getProgressPercentage(startDate: string, endDate: string, status: string) {
  if (status === 'completed') return 100
  if (status === 'draft' || status === 'planning') return 0
  if (status === 'cancelled') return 0

  const start = new Date(startDate)
  const end = new Date(endDate)
  const now = new Date()

  if (now < start) return 0
  if (now > end) return 100

  const total = end.getTime() - start.getTime()
  const elapsed = now.getTime() - start.getTime()

  return Math.round((elapsed / total) * 100)
}

// Dialog functions
function openNewProjectDialog() {
  isNewProjectDialogOpen.value = true
}

function closeNewProjectDialog() {
  isNewProjectDialogOpen.value = false
  resetNewProjectForm()
}

function resetNewProjectForm() {
  newProjectForm.value = {
    name: '',
    address: '',
    priority: 'low',
    status: 'draft',
    startDate: '',
    endDate: ''
  }
}

async function createNewProject() {
  if (!newProjectForm.value.name.trim() || !newProjectForm.value.address.trim()) {
    return
  }

  // Check if user is logged in
  if (!authStore.currentUser?.id) {
    console.error('User not logged in or ID not available')
    return
  }

  isSubmitting.value = true

  try {
    // Prepare project data
    const projectData = {
      prj_name: newProjectForm.value.name.trim(),
      address: newProjectForm.value.address.trim(),
      date_start: newProjectForm.value.startDate || new Date().toISOString().split('T')[0],
      date_end: newProjectForm.value.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: newProjectForm.value.priority,
      status: newProjectForm.value.status,
      prj_manager: authStore.currentUser.id
    }

    console.log('🚀 Creating project with data:', projectData)
    console.log('👤 Current user:', authStore.currentUser)

    // Create project via API
    const apiProject = await projectsApi.create(projectData)

    // Map API response to frontend format
    const newProject: Project = {
      id: apiProject.id,
      name: apiProject.prj_name,
      address: apiProject.address,
      priority: apiProject.priority,
      startDate: apiProject.date_start,
      endDate: apiProject.date_end,
      status: apiProject.status,
      projectManager: apiProject.prj_managger || undefined, // cspell:ignore managger
      description: '',
      createdAt: apiProject.created_at,
      updatedAt: apiProject.updated_at
    }

    // Add to projects list
    projects.value.unshift(newProject)

    // Close dialog and reset form
    closeNewProjectDialog()
  } catch (error: unknown) {
    console.error('Error creating project:', error)

    // Show error message to user
    if (error instanceof Error && error.message) {
      alert('Error creating project: ' + error.message)
    } else {
      alert('Failed to create project. Please try again.')
    }
  } finally {
    isSubmitting.value = false
  }
}

function openProject(projectId: number) {
  // Navigate to project detail page
  router.push(`/projects/${projectId}`)
}

// Helper functions for user names
function getManagerName(managerId?: number): string {
  if (!managerId) return '—'

  const managers: Record<number, string> = {
    2: 'Sarah Manager',
    3: 'Mike Supervisor'
  }

  return managers[managerId] || `Manager ${managerId}`
}

</script>

<template>
  <div class="space-y-4 p-4 md:space-y-6 md:p-6">
    <!-- Header -->
    <div class="bg-white shadow rounded-lg p-3 sm:p-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Projects</h1>
          <p class="text-sm text-gray-600 mt-1">Manage and track all construction projects</p>
        </div>
        <button
          v-if="canCreateProjects"
          @click="openNewProjectDialog"
          class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
        >
          + New Project
        </button>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="bg-white shadow rounded-lg p-3 sm:p-4">
      <div class="flex flex-col sm:flex-row gap-4">
        <!-- Search -->
        <div class="flex-1">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search projects..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <!-- Filters -->
        <div class="flex gap-2">
          <select
            v-model="statusFilter"
            class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="on-hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            v-model="priorityFilter"
            class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            v-if="canFilterByManagers"
            v-model="managerFilter"
            class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option :value="undefined">All Managers</option>
            <option :value="0">Unassigned</option>
            <option :value="1">Justin Kearney</option>
            <option :value="2">Sarah Manager</option>
            <option :value="3">Mike Supervisor</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Projects Table -->
    <div class="bg-white shadow rounded-lg overflow-hidden">
      <div class="px-4 py-4 border-b border-gray-200 sm:px-6">
        <div class="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
          <h3 class="text-lg font-medium text-gray-900">
            Projects ({{ filteredProjects.length }})
          </h3>
          <div v-if="loading" class="flex items-center text-sm text-gray-500">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading from database...
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="px-4 py-3 bg-red-50 border-b border-red-200">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-red-800">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Desktop Table -->
      <div class="hidden lg:block overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manager</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timeline</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="project in filteredProjects" :key="project.id" class="hover:bg-gray-50 cursor-pointer" @click="openProject(project.id)">
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <div class="text-sm font-medium text-gray-900">{{ project.name }}</div>
                  <div class="text-sm text-gray-500">ID: {{ project.id }}</div>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-gray-900 max-w-xs truncate">{{ project.address }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="getPriorityColor(project.priority)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                  {{ project.priority }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="getStatusColor(project.status)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                  {{ project.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ getManagerName(project.projectManager) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div>{{ formatDate(project.startDate) }}</div>
                <div>to {{ formatDate(project.endDate) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                    <div
                      class="bg-blue-600 h-2 rounded-full"
                      :style="{ width: getProgressPercentage(project.startDate, project.endDate, project.status) + '%' }"
                    ></div>
                  </div>
                  <span class="text-sm text-gray-500">{{ getProgressPercentage(project.startDate, project.endDate, project.status) }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Cards -->
      <div class="lg:hidden">
        <div class="divide-y divide-gray-200">
          <div v-for="project in filteredProjects" :key="project.id" class="p-4 hover:bg-gray-50 cursor-pointer" @click="openProject(project.id)">
            <div class="flex items-start justify-between mb-2">
              <div class="flex-1">
                <h4 class="text-sm font-medium text-gray-900">{{ project.name }}</h4>
                <p class="text-sm text-gray-500">ID: {{ project.id }}</p>
              </div>
              <div class="flex gap-2">
                <span :class="getPriorityColor(project.priority)" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium">
                  {{ project.priority }}
                </span>
                <span :class="getStatusColor(project.status)" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium">
                  {{ project.status }}
                </span>
              </div>
            </div>

            <div class="mb-3">
              <p class="text-sm text-gray-600">{{ project.address }}</p>
            </div>

            <!-- Manager Info -->
            <div class="mb-3">
              <p class="text-xs text-gray-500">Manager</p>
              <p class="text-sm text-gray-900">{{ getManagerName(project.projectManager) }}</p>
            </div>

            <div class="mb-3">
              <div class="flex justify-between text-sm text-gray-500 mb-1">
                <span>Timeline</span>
                <span>{{ getProgressPercentage(project.startDate, project.endDate, project.status) }}%</span>
              </div>
              <div class="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  class="bg-blue-600 h-2 rounded-full"
                  :style="{ width: getProgressPercentage(project.startDate, project.endDate, project.status) + '%' }"
                ></div>
              </div>
              <div class="flex justify-between text-xs text-gray-400 mt-1">
                <span>{{ formatDate(project.startDate) }}</span>
                <span>{{ formatDate(project.endDate) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="filteredProjects.length === 0" class="p-6 text-center text-gray-500">
        <p>No projects found matching your criteria.</p>
      </div>
    </div>

    <!-- New Project Dialog -->
    <div v-if="isNewProjectDialogOpen" class="fixed inset-0 z-50 overflow-y-auto" @click.self="closeNewProjectDialog">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"></div>

      <!-- Dialog -->
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="relative bg-white rounded-lg shadow-xl w-full max-w-md">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Create New Project</h3>
            <p class="mt-1 text-sm text-gray-500">
              Enter basic project information. Additional details can be added later.
            </p>
          </div>

          <!-- Form -->
          <form @submit.prevent="createNewProject" class="px-6 py-4 space-y-4">
            <div>
              <label for="project-name" class="block text-sm font-medium text-gray-700 mb-1">
                Project Name *
              </label>
              <input
                id="project-name"
                v-model="newProjectForm.name"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Enter project name"
              />
            </div>

            <div>
              <label for="project-address" class="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <input
                id="project-address"
                v-model="newProjectForm.address"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Enter project address"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="project-start-date" class="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  id="project-start-date"
                  v-model="newProjectForm.startDate"
                  type="date"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label for="project-end-date" class="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  id="project-end-date"
                  v-model="newProjectForm.endDate"
                  type="date"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="project-priority" class="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  id="project-priority"
                  v-model="newProjectForm.priority"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label for="project-status" class="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="project-status"
                  v-model="newProjectForm.status"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="planning">Planning</option>
                </select>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                @click="closeNewProjectDialog"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="isSubmitting || !newProjectForm.name.trim() || !newProjectForm.address.trim()"
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ isSubmitting ? 'Creating...' : 'Create Project' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

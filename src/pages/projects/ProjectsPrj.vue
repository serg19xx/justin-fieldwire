<template>
  <component :is="layoutComponent">
    <div class="space-y-4 px-4 pt-4 pb-4 md:space-y-6 md:px-6 md:pt-6 md:pb-6">
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
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="on-hold">On Hold</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="bg-white shadow rounded-lg p-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-2 text-gray-600">Loading projects...</p>
      </div>

      <!-- Projects Table -->
      <div v-else class="bg-white shadow rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Project
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Client
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Progress
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Priority
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Manager
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="project in filteredProjects" :key="project.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div class="text-sm font-medium text-gray-900">{{ project.prj_name }}</div>
                    <div class="text-sm text-gray-500">
                      {{ formatDate(project.date_start) }} - {{ formatDate(project.date_end) }}
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ project.address }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="getStatusClass(project.status)"
                    class="px-2 py-1 text-xs font-medium rounded-full"
                  >
                    {{ getStatusDisplay(project.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        class="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style="width: 0%"
                      ></div>
                    </div>
                    <span class="text-sm text-gray-900">0%</span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ project.priority }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ project.manager_name || 'Unassigned' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex space-x-2">
                    <button
                      @click="viewProject(project.id)"
                      class="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </button>
                    <button
                      @click="editProject(project.id)"
                      class="text-gray-600 hover:text-gray-900"
                    >
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredProjects.length === 0" class="text-center py-12">
        <svg
          class="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          ></path>
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
        <p class="mt-1 text-sm text-gray-500">Get started by creating a new project.</p>
      </div>
    </div>
  </component>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/core/stores/auth'
import GlobalLayout from '@/layouts/GlobalLayout.vue'
import ProjectLayout from '@/layouts/ProjectLayout.vue'
import TaskLayout from '@/layouts/TaskLayout.vue'
import { projectApi, type Project as ApiProject } from '@/core/utils/project-api'

const router = useRouter()
const authStore = useAuthStore()

// Layout selection
const layoutComponent = computed(() => {
  const category = authStore.currentUser?.role_category

  switch (category) {
    case 'global':
      return GlobalLayout
    case 'project':
      return ProjectLayout
    case 'task':
      return TaskLayout
    default:
      return ProjectLayout
  }
})

// Reactive data
const projects = ref<ApiProject[]>([])
const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')

// Computed properties
const filteredProjects = computed(() => {
  let filtered = projects.value

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (project) =>
        project.prj_name.toLowerCase().includes(query) ||
        project.address.toLowerCase().includes(query),
    )
  }

  // Filter by status
  if (statusFilter.value) {
    filtered = filtered.filter((project) => project.status === statusFilter.value)
  }

  return filtered
})

// Methods
function getStatusClass(status: string) {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'completed':
      return 'bg-blue-100 text-blue-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'on-hold':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getStatusDisplay(status: string) {
  switch (status) {
    case 'active':
      return 'Active'
    case 'completed':
      return 'Completed'
    case 'pending':
      return 'Pending'
    case 'on-hold':
      return 'On Hold'
    default:
      return status
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

async function loadProjects() {
  loading.value = true
  try {
    console.log('🚀 Loading projects from API...')
    const response = await projectApi.getAll(1, 100, {})
    console.log('📦 API response:', response)
    projects.value = response.projects
    console.log('✅ Projects loaded:', projects.value.length)
  } catch (error) {
    console.error('❌ Error loading projects:', error)
    projects.value = []
  } finally {
    loading.value = false
  }
}

function viewProject(projectId: number) {
  router.push(`/projects/${projectId}`)
}

function editProject(projectId: number) {
  // TODO: Implement edit functionality
  console.log('Edit project:', projectId)
}

// Lifecycle
onMounted(() => {
  loadProjects()
})

defineOptions({
  name: 'ProjectsPage',
})
</script>

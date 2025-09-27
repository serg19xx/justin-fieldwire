<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header with Add Project button -->
    <div class="bg-white shadow-sm border-b border-gray-200">
      <div class="px-4 py-3">
        <div class="flex justify-between items-center">
          <h1 class="text-lg font-semibold text-gray-900">My Projects</h1>
          <!-- Add Project button - only for project managers -->
          <button
            v-if="canCreateProject"
            @click="createProject"
            class="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 flex items-center space-x-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            <span>Add Project</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Projects List -->
    <div class="p-4">
      <div v-if="loading" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>

      <div v-else-if="projects.length === 0" class="text-center py-8">
        <div class="text-gray-400 mb-4">
          <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
        <p class="text-gray-500 mb-4">You haven't been assigned to any projects yet.</p>
        <button
          v-if="canCreateProject"
          @click="createProject"
          class="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700"
        >
          Create Your First Project
        </button>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="project in projects"
          :key="project.id"
          @click="openProject(project)"
          class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div class="flex justify-between items-start mb-2">
            <h3 class="font-semibold text-gray-900 text-lg">{{ project.name }}</h3>
            <span
              class="px-2 py-1 text-xs font-medium rounded-full"
              :class="getStatusClass(project.status)"
            >
              {{ project.status }}
            </span>
          </div>

          <p class="text-gray-600 text-sm mb-3">{{ project.description }}</p>

          <div class="flex justify-between items-center text-sm text-gray-500">
            <div class="flex items-center space-x-4">
              <span class="flex items-center">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                {{ formatDate(project.start_date) }} - {{ formatDate(project.end_date) }}
              </span>
            </div>
            <div class="flex items-center space-x-2">
              <span class="flex items-center">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                {{ project.team_count || 0 }} members
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/core/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const projects = ref([])

// Check if user can create projects (only project managers)
const canCreateProject = computed(() => {
  const user = authStore.currentUser
  return user?.role_code === 'project_manager'
})

onMounted(async () => {
  await loadProjects()
})

async function loadProjects() {
  loading.value = true
  try {
    // TODO: Replace with actual API call
    // Mock data for now
    projects.value = [
      {
        id: 1,
        name: 'Office Building Construction',
        description: 'New office building construction project in downtown area',
        status: 'Active',
        start_date: '2024-01-15',
        end_date: '2024-12-31',
        team_count: 12
      },
      {
        id: 2,
        name: 'Residential Complex',
        description: 'Multi-story residential complex with 200 units',
        status: 'Planning',
        start_date: '2024-03-01',
        end_date: '2025-06-30',
        team_count: 8
      }
    ]
  } catch (error) {
    console.error('Error loading projects:', error)
  } finally {
    loading.value = false
  }
}

function createProject() {
  // TODO: Navigate to create project page
  console.log('Create new project')
}

function openProject(project: any) {
  router.push(`/project/${project.id}`)
}

function getStatusClass(status: string) {
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'planning':
      return 'bg-blue-100 text-blue-800'
    case 'completed':
      return 'bg-gray-100 text-gray-800'
    case 'on hold':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString()
}
</script>

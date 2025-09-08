<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { projectsApi, type Project as ApiProject } from '@/utils/contacts-api'
import ProjectCalendar from '@/components/ProjectCalendar.vue'
import { exportTasksToICal, downloadFile } from '@/utils/task-utils'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// Project data
const project = ref<Project | null>(null)
const projects = ref<Project[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Navigation state
const activeSection = ref<'plans' | 'tasks' | 'photos' | 'team' | 'settings'>('plans')

// Settings form state
const settingsForm = ref({
  name: '',
  address: '',
  priority: 'low',
  status: 'draft',
  startDate: '',
  endDate: '',
})
const isSavingSettings = ref(false)

// Team state
const teamMembers = ref<any[]>([])
const loadingTeam = ref(false)

// Calendar state
const selectedEvent = ref<any>(null)
const showEventModal = ref(false)

// Debug: watch activeSection changes
watch(activeSection, (newSection) => {
  console.log('📱 Active section changed to:', newSection)
})

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

// Load project data
// Load all projects for the dropdown
async function loadProjects() {
  try {
    console.log('🚀 Loading projects for dropdown...')
    console.log('👤 Current user:', authStore.currentUser)

    const filters: any = {}

    // If user is Project Manager, filter by their ID
    // Temporarily disabled to test API
    // if (authStore.currentUser?.user_type === 'Project Manager') {
    //   filters.prj_manager = authStore.currentUser.id
    //   console.log('🔍 Filtering by PM ID:', authStore.currentUser.id)
    // } else {
    //   console.log('👑 System Administrator - loading all projects')
    // }

    console.log('🔧 Testing without filters first')

    console.log('📋 Filters:', filters)

    const requestParams = {
      page: 1,
      limit: 100, // Load more projects for dropdown
      ...filters,
    }

    console.log('📤 Request params:', requestParams)

    const response = await projectsApi.getAll(
      requestParams.page,
      requestParams.limit,
      requestParams,
    )

    console.log('📦 Projects API response:', response)

    projects.value = response.projects.map((apiProject: ApiProject) => ({
      id: apiProject.id,
      name: apiProject.prj_name,
      address: apiProject.address,
      priority: apiProject.priority,
      startDate: apiProject.date_start,
      endDate: apiProject.date_end,
      status: apiProject.status,
      projectManager: apiProject.prj_managger,
      managerName: apiProject.manager_name,
      description: '',
      createdAt: apiProject.created_at,
      updatedAt: apiProject.updated_at,
    }))

    console.log('✅ Mapped projects:', projects.value)
  } catch (error) {
    console.error('❌ Error loading projects:', error)
  }
}

async function loadProject() {
  const projectId = route.params.id as string
  console.log('🎯 Loading project with ID:', projectId)

  if (!projectId) {
    error.value = 'Project ID not found'
    return
  }

  loading.value = true
  error.value = null

  try {
    console.log('📡 Calling projectsApi.getById...')
    const apiProject = await projectsApi.getById(parseInt(projectId))

    // Map API data to frontend format
    const projectData = apiProject.project
    project.value = {
      id: projectData.id,
      name: projectData.prj_name,
      address: projectData.address,
      priority: projectData.priority,
      startDate: projectData.date_start,
      endDate: projectData.date_end,
      status: projectData.status,
      projectManager: projectData.prj_manager,
      managerName: projectData.manager_name,
      description: '',
      createdAt: projectData.created_at,
      updatedAt: projectData.updated_at,
    }
    console.log('✅ Project loaded successfully:', project.value)
  } catch (apiError: unknown) {
    console.error('❌ Error loading project:', apiError)
    error.value = 'Failed to load project'
  } finally {
    loading.value = false
  }
}

// Navigation functions
function setActiveSection(section: 'plans' | 'tasks' | 'photos' | 'team' | 'settings') {
  console.log('🔄 Switching to section:', section)
  activeSection.value = section

  // Load settings form when switching to settings
  if (section === 'settings' && project.value) {
    loadSettingsForm()
  }

  // Load team members when switching to team
  if (section === 'team' && project.value) {
    loadTeamMembers()
  }
}

// Switch to different project
function switchProject(projectId: number) {
  router.push(`/projects/${projectId}`)
}

// Project action functions (now handled through navigation)
function archiveProject() {
  console.log('🗑️ Archive project:', project.value?.id)
  // TODO: Implement project archiving
  if (confirm('Are you sure you want to archive this project?')) {
    // Archive logic here
  }
}

// Settings functions
function loadSettingsForm() {
  if (project.value) {
    settingsForm.value = {
      name: project.value.name,
      address: project.value.address,
      priority: project.value.priority,
      status: project.value.status,
      startDate: project.value.startDate,
      endDate: project.value.endDate,
    }
  }
}

async function saveSettings() {
  if (!project.value) return

  isSavingSettings.value = true

  try {
    const updateData = {
      prj_name: settingsForm.value.name.trim(),
      address: settingsForm.value.address.trim(),
      priority: settingsForm.value.priority,
      status: settingsForm.value.status,
      date_start: settingsForm.value.startDate,
      date_end: settingsForm.value.endDate,
    }

    await projectsApi.update(project.value.id, updateData)

    // Reload project data
    await loadProject()

    alert('Project settings saved successfully!')
  } catch (error: any) {
    console.error('❌ Error saving project:', error)
    alert('Failed to save project settings. Please try again.')
  } finally {
    isSavingSettings.value = false
  }
}

function resetSettings() {
  loadSettingsForm()
}

const canEditProject = computed(() => {
  return authStore.currentUser?.user_type === 'Project Manager'
})

// Team functions
async function loadTeamMembers() {
  if (!project.value) return

  loadingTeam.value = true

  try {
    // TODO: Replace with actual API call when endpoint is available
    // For now, we'll use mock data
    console.log('👥 Loading team members for project:', project.value.id)

    // Mock team members data
    teamMembers.value = [
      {
        id: 1,
        name: 'John Smith',
        email: 'john@example.com',
        role: 'Foreman',
        status: 'active',
        joinDate: '2025-01-15',
      },
      {
        id: 2,
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        role: 'Safety Inspector',
        status: 'active',
        joinDate: '2025-02-01',
      },
      {
        id: 3,
        name: 'Mike Wilson',
        email: 'mike@example.com',
        role: 'Equipment Operator',
        status: 'inactive',
        joinDate: '2025-01-20',
      },
    ]
  } catch (error) {
    console.error('❌ Error loading team members:', error)
  } finally {
    loadingTeam.value = false
  }
}

// Calendar functions
function handleEventClick(event: any) {
  console.log('📅 Event clicked:', event)
  selectedEvent.value = {
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    description: event.extendedProps?.description || '',
    assignee: event.extendedProps?.assignee || '',
    priority: event.extendedProps?.priority || 'medium',
  }
  showEventModal.value = true
}

function handleDateClick(info: any) {
  console.log('📅 Date clicked:', info)
  // TODO: Open dialog to create new event
  alert(`Create new task on ${info.dateStr}`)
}

function handleEventDrop(info: any) {
  console.log('📅 Event moved:', info)
  // TODO: Update event in backend
  alert(`Event "${info.event.title}" moved to ${info.event.start.toDateString()}`)
}

function handleEventResize(info: any) {
  console.log('📅 Event resized:', info)
  // TODO: Update event duration in backend
  alert(`Event "${info.event.title}" duration updated`)
}

function closeEventModal() {
  showEventModal.value = false
  selectedEvent.value = null
}

// Section-specific action functions
function createNewPlan() {
  console.log('📋 Create new plan for project:', project.value?.id)
  // TODO: Open dialog to create new plan
  alert('Create new plan dialog will be implemented here')
}

function createNewTask() {
  console.log('➕ Create new task for project:', project.value?.id)
  // TODO: Open dialog to create new task
  alert('Create new task dialog will be implemented here')
}

function exportTasksToICal() {
  console.log('📅 Export tasks to iCal for project:', project.value?.id)

  // For now, we'll use mock tasks from the calendar
  // In the future, this should fetch real tasks from the API
  const mockTasks = [
    {
      id: 'mock-1',
      name: 'Foundation Work',
      startPlanned: '2025-09-10T00:00:00',
      endPlanned: '2025-09-15T00:00:00',
      status: 'in_progress',
      assignees: ['john-smith'],
      description: 'Фундамент > Опалубка - Foundation Work',
    },
    {
      id: 'mock-2',
      name: 'Framing',
      startPlanned: '2025-09-20T00:00:00',
      endPlanned: '2025-09-25T00:00:00',
      status: 'planned',
      assignees: ['mike-wilson'],
      description: 'Каркас > Стены - Framing',
    },
    {
      id: 'mock-3',
      name: 'Electrical Installation',
      startPlanned: '2025-09-05T00:00:00',
      endPlanned: '2025-09-08T00:00:00',
      status: 'planned',
      assignees: ['sarah-johnson'],
      description: 'Электрика > Проводка - Electrical Installation',
    },
    {
      id: 'mock-4',
      name: 'Safety Inspection',
      startPlanned: '2025-09-12T10:00:00',
      endPlanned: '2025-09-12T12:00:00',
      status: 'planned',
      assignees: ['safety-team'],
      description: 'Контроль > Безопасность - Safety Inspection',
    },
  ]

  try {
    const icalContent = exportTasksToICal(mockTasks)
    const filename = `project-${project.value?.id || 'unknown'}-tasks.ics`
    downloadFile(icalContent, filename, 'text/calendar')
    console.log('✅ iCal export completed')
  } catch (error) {
    console.error('❌ Error exporting to iCal:', error)
    alert('Error exporting tasks to iCal format')
  }
}

function uploadPhoto() {
  console.log('📸 Upload photo for project:', project.value?.id)
  // TODO: Open file upload dialog
  alert('Upload photo dialog will be implemented here')
}

function addTeamMember() {
  console.log('👥 Add team member for project:', project.value?.id)
  // TODO: Open dialog to add team member
  alert('Add team member dialog will be implemented here')
}

// Handle task updates from calendar
function handleTaskUpdate(task: any) {
  console.log('📝 Task updated:', task)
  // TODO: Show notification or update UI
}

// Helper functions
function getPriorityColor(priority?: string) {
  if (!priority) return 'bg-gray-100 text-gray-800'

  switch (priority.toLowerCase()) {
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

function getStatusColor(status?: string) {
  if (!status) return 'bg-gray-100 text-gray-800'

  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'planning':
      return 'bg-blue-100 text-blue-800'
    case 'draft':
      return 'bg-gray-100 text-gray-800'
    case 'on-hold':
      return 'bg-yellow-100 text-yellow-800'
    case 'completed':
      return 'bg-purple-100 text-purple-800'
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
    day: 'numeric',
  })
}

// Load project on mount
onMounted(() => {
  loadProjects()
  loadProject()
})
</script>

<template>
  <div class="flex h-screen bg-gray-50">
    <!-- Left Sidebar -->
    <div class="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      <!-- Project Selector Header -->
      <div class="p-4 border-b border-gray-200">
        <div v-if="loading" class="animate-pulse">
          <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div class="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div v-else-if="error" class="text-red-600 text-sm">
          {{ error }}
        </div>
        <div v-else>
          <!-- Project Selector -->
          <div class="mb-3">
            <label class="block text-xs font-medium text-gray-700 mb-1"> Select Project </label>
            <select
              :value="project?.id"
              @change="switchProject(parseInt(($event.target as HTMLSelectElement).value))"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="" disabled>Choose a project...</option>
              <option v-for="proj in projects" :key="proj.id" :value="proj.id">
                {{ proj.name }}
              </option>
            </select>
          </div>

          <!-- Current Project Info -->
          <div v-if="project">
            <h2 class="text-lg font-semibold text-gray-900 truncate">
              {{ project.name }}
            </h2>
            <p class="text-sm text-gray-500 truncate">
              {{ project.address }}
            </p>
            <div class="flex items-center space-x-2 mt-2">
              <span
                :class="getPriorityColor(project.priority)"
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
              >
                {{ project.priority }}
              </span>
              <span
                :class="getStatusColor(project.status)"
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
              >
                {{ project.status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <div class="flex-1 overflow-y-auto">
        <!-- FIELD MANAGEMENT Section -->
        <div class="p-4">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            FIELD MANAGEMENT
          </h3>
          <nav class="space-y-1">
            <button
              @click="setActiveSection('plans')"
              :class="[
                'w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                activeSection === 'plans'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              ]"
            >
              <svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                ></path>
              </svg>
              Plans
            </button>

            <button
              @click="setActiveSection('tasks')"
              :class="[
                'w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                activeSection === 'tasks'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              ]"
            >
              <svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                ></path>
              </svg>
              Tasks
            </button>

            <button
              @click="setActiveSection('photos')"
              :class="[
                'w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                activeSection === 'photos'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              ]"
            >
              <svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                ></path>
              </svg>
              Photos
            </button>
            <button
              @click="setActiveSection('team')"
              :class="[
                'flex items-center px-3 py-2 rounded-md text-sm font-medium w-full text-left',
                activeSection === 'team'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              ]"
            >
              <svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                ></path>
              </svg>
              Team
            </button>
            <button
              @click="setActiveSection('settings')"
              :class="[
                'flex items-center px-3 py-2 rounded-md text-sm font-medium w-full text-left',
                activeSection === 'settings'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              ]"
            >
              <svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                ></path>
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                ></path>
              </svg>
              Settings
            </button>
          </nav>
        </div>

        <!-- Dynamic Section (will be populated based on active section) -->
        <div class="border-t border-gray-200 p-4">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {{ activeSection.toUpperCase() }}
          </h3>
          <div class="text-sm text-gray-500">
            <!-- This will be populated with dynamic content based on activeSection -->
            <p v-if="activeSection === 'plans'">Plans content will go here</p>
            <p v-if="activeSection === 'tasks'">Tasks content will go here</p>
            <p v-if="activeSection === 'photos'">Photos content will go here</p>
            <p v-if="activeSection === 'team'">Team content will go here</p>
            <p v-if="activeSection === 'settings'">Settings content will go here</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Content Header -->
      <div class="bg-white shadow-sm border-b border-gray-200 px-6 py-2">
        <div class="flex items-center justify-between">
          <!-- Dynamic Action Buttons -->
          <div>
            <!-- Plans Section Buttons -->
            <template v-if="activeSection === 'plans'">
              <button
                v-if="canEditProject"
                @click="createNewPlan"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                + New Plan
              </button>
            </template>

            <!-- Tasks Section Buttons -->
            <template v-else-if="activeSection === 'tasks'">
              <div class="flex items-center space-x-2">
                <button
                  v-if="canEditProject"
                  @click="createNewTask"
                  class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  + New Task
                </button>
                <button
                  @click="exportTasksToICal"
                  class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                  title="Export tasks to iCal format"
                >
                  📅 Export iCal
                </button>
              </div>
            </template>

            <!-- Photos Section Buttons -->
            <template v-else-if="activeSection === 'photos'">
              <button
                v-if="canEditProject"
                @click="uploadPhoto"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                + Upload Photo
              </button>
            </template>

            <!-- Team Section Buttons -->
            <template v-else-if="activeSection === 'team'">
              <button
                v-if="canEditProject"
                @click="addTeamMember"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                + Add Member
              </button>
            </template>

            <!-- Settings Section Buttons -->
            <template v-else-if="activeSection === 'settings'">
              <button
                v-if="canEditProject"
                @click="saveSettings"
                :disabled="isSavingSettings"
                class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                <span v-if="isSavingSettings" class="flex items-center">
                  <svg
                    class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </span>
                <span v-else>Save Changes</span>
              </button>
            </template>
          </div>

          <!-- Search Bar -->
          <div class="relative">
            <input
              type="text"
              placeholder="Search..."
              class="w-64 pl-8 pr-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <svg
              class="absolute left-2.5 top-2 h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
          </div>
        </div>
      </div>

      <!-- Content Body -->
      <div class="flex-1 overflow-y-auto p-6">
        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center h-full">
          <div class="text-center">
            <svg
              class="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p class="text-gray-600">Loading project...</p>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="flex items-center justify-center h-full">
          <div class="text-center">
            <svg
              class="h-12 w-12 text-red-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <p class="text-red-600 mb-4">{{ error }}</p>
            <button
              @click="loadProject"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>

        <!-- Content based on active section -->
        <div v-else-if="project">
          <!-- Plans Section -->
          <div v-if="activeSection === 'plans'" class="space-y-6">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-semibold text-gray-900">Plans</h2>
              <button
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                + New Plan
              </button>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
              <p class="text-gray-500">Plans content will be implemented here</p>
            </div>
          </div>

          <!-- Tasks Section -->
          <div v-else-if="activeSection === 'tasks'">
            <!-- Calendar Component -->
            <ProjectCalendar
              :project-id="project?.id || 0"
              :can-edit="canEditProject"
              @event-click="handleEventClick"
              @date-click="handleDateClick"
              @event-drop="handleEventDrop"
              @event-resize="handleEventResize"
              @task-update="handleTaskUpdate"
            />
          </div>

          <!-- Photos Section -->
          <div v-else-if="activeSection === 'photos'" class="space-y-6">
            <div class="bg-white rounded-lg shadow p-6">
              <p class="text-gray-500">Photos content will be implemented here</p>
            </div>
          </div>

          <!-- Team Section -->
          <div v-else-if="activeSection === 'team'" class="space-y-6">
            <!-- Team Members List -->
            <div class="bg-white rounded-lg shadow">
              <!-- Loading State -->
              <div v-if="loadingTeam" class="p-6">
                <div class="flex items-center justify-center">
                  <svg class="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span class="ml-2 text-gray-600">Loading team members...</span>
                </div>
              </div>

              <!-- Team Members Table -->
              <div v-else-if="teamMembers.length > 0" class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th
                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Name
                      </th>
                      <th
                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Role
                      </th>
                      <th
                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Join Date
                      </th>
                      <th
                        v-if="canEditProject"
                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-for="member in teamMembers" :key="member.id" class="hover:bg-gray-50">
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                          <div class="flex-shrink-0 h-10 w-10">
                            <div
                              class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center"
                            >
                              <span class="text-sm font-medium text-gray-700">
                                {{
                                  member.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                }}
                              </span>
                            </div>
                          </div>
                          <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">{{ member.name }}</div>
                            <div class="text-sm text-gray-500">{{ member.email }}</div>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span
                          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {{ member.role }}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span
                          :class="
                            member.status === 'active'
                              ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'
                              : 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'
                          "
                        >
                          {{ member.status }}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {{ new Date(member.joinDate).toLocaleDateString() }}
                      </td>
                      <td
                        v-if="canEditProject"
                        class="px-6 py-4 whitespace-nowrap text-sm font-medium"
                      >
                        <button class="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                        <button class="text-red-600 hover:text-red-900">Remove</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Empty State -->
              <div v-else class="p-6 text-center">
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  ></path>
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900">No team members</h3>
                <p class="mt-1 text-sm text-gray-500">
                  Get started by adding team members to this project.
                </p>
                <div v-if="canEditProject" class="mt-6">
                  <button
                    class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    + Add Team Member
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Settings Section -->
          <div v-else-if="activeSection === 'settings'" class="space-y-6">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-semibold text-gray-900">Project Settings</h2>
            </div>

            <!-- Settings Form -->
            <div class="bg-white rounded-lg shadow p-6">
              <form @submit.prevent="saveSettings" class="space-y-6">
                <!-- Project Name -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Project Name *
                  </label>
                  <input
                    v-model="settingsForm.name"
                    type="text"
                    :disabled="!canEditProject"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="Enter project name"
                    required
                  />
                </div>

                <!-- Project Address -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Project Address *
                  </label>
                  <textarea
                    v-model="settingsForm.address"
                    :disabled="!canEditProject"
                    rows="3"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="Enter project address"
                    required
                  ></textarea>
                </div>

                <!-- Priority and Status -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- Priority -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2"> Priority </label>
                    <select
                      v-model="settingsForm.priority"
                      :disabled="!canEditProject"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <!-- Status -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2"> Status </label>
                    <select
                      v-model="settingsForm.status"
                      :disabled="!canEditProject"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <!-- Dates -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- Start Date -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2"> Start Date </label>
                    <input
                      v-model="settingsForm.startDate"
                      type="date"
                      :disabled="!canEditProject"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <!-- End Date -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2"> End Date </label>
                    <input
                      v-model="settingsForm.endDate"
                      type="date"
                      :disabled="!canEditProject"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>

                <!-- Action Buttons -->
                <div
                  v-if="canEditProject"
                  class="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200"
                >
                  <button
                    type="button"
                    @click="resetSettings"
                    :disabled="isSavingSettings"
                    class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    Reset
                  </button>
                </div>

                <!-- Read-only notice for non-managers -->
                <div v-else class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div class="flex">
                    <svg
                      class="h-5 w-5 text-yellow-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      ></path>
                    </svg>
                    <div class="ml-3">
                      <p class="text-sm text-yellow-800">
                        You can only view project settings. Only Project Managers can edit project
                        information.
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Event Details Modal -->
    <div
      v-if="showEventModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      @click="closeEventModal"
    >
      <div
        class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"
        @click.stop
      >
        <div class="mt-3">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900">Task Details</h3>
            <button @click="closeEventModal" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </div>

          <div v-if="selectedEvent" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Title</label>
              <p class="mt-1 text-sm text-gray-900">{{ selectedEvent.title }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Start Date</label>
              <p class="mt-1 text-sm text-gray-900">
                {{ selectedEvent.start.toLocaleDateString() }}
              </p>
            </div>

            <div v-if="selectedEvent.end">
              <label class="block text-sm font-medium text-gray-700">End Date</label>
              <p class="mt-1 text-sm text-gray-900">{{ selectedEvent.end.toLocaleDateString() }}</p>
            </div>

            <div v-if="selectedEvent.description">
              <label class="block text-sm font-medium text-gray-700">Description</label>
              <p class="mt-1 text-sm text-gray-900">{{ selectedEvent.description }}</p>
            </div>

            <div v-if="selectedEvent.assignee">
              <label class="block text-sm font-medium text-gray-700">Assignee</label>
              <p class="mt-1 text-sm text-gray-900">{{ selectedEvent.assignee }}</p>
            </div>

            <div v-if="selectedEvent.priority">
              <label class="block text-sm font-medium text-gray-700">Priority</label>
              <span
                :class="{
                  'bg-red-100 text-red-800': selectedEvent.priority === 'high',
                  'bg-yellow-100 text-yellow-800': selectedEvent.priority === 'medium',
                  'bg-green-100 text-green-800': selectedEvent.priority === 'low',
                }"
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              >
                {{ selectedEvent.priority }}
              </span>
            </div>
          </div>

          <div class="flex items-center justify-end space-x-3 mt-6">
            <button
              @click="closeEventModal"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Close
            </button>
            <button
              v-if="canEditProject"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Edit Task
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

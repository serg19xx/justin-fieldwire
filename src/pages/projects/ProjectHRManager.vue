<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { hrResourcesApi, type WorkerUser } from '@/core/utils/hr-api'
import { useAuthStore } from '@/core/stores/auth'

// Props
interface Props {
  projectId?: number
  taskId?: number
  mode: 'project' | 'task' | 'general' // Режим: для проекта, задачи или общий пул
  onWorkerSelected?: (worker: WorkerUser) => void
  onWorkersInvited?: (workers: WorkerUser[]) => void
  onClose?: () => void
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  workerSelected: [worker: WorkerUser]
  workersInvited: [workers: WorkerUser[]]
  close: []
}>()

// Store
const authStore = useAuthStore()

// State
const loading = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref('')
const userTypeFilter = ref('')
const statusFilter = ref('')
const availabilityFilter = ref('')
const skillsFilter = ref<string[]>([])
const isFiltersOpen = ref(false)

// Available workers
const availableWorkers = ref<WorkerUser[]>([])
const selectedWorkers = ref<WorkerUser[]>([])
const projectTeam = ref<unknown[]>([])

// Computed
const filteredWorkers = computed(() => {
  let filtered = availableWorkers.value

  // Search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (worker) =>
        worker.first_name?.toLowerCase().includes(query) ||
        worker.last_name?.toLowerCase().includes(query) ||
        worker.email?.toLowerCase().includes(query) ||
        worker.job_title?.toLowerCase().includes(query),
    )
  }

  // User type filter
  if (userTypeFilter.value) {
    filtered = filtered.filter((worker) => worker.role_code === userTypeFilter.value)
  }

  // Status filter
  if (statusFilter.value) {
    filtered = filtered.filter((worker) => worker.status === Number(statusFilter.value))
  }

  // Availability filter
  if (availabilityFilter.value) {
    filtered = filtered.filter((worker) => worker.status === (availabilityFilter.value === 'available' ? 1 : 0))
  }

  // Skills filter
  if (skillsFilter.value.length > 0) {
    filtered = filtered.filter((worker) =>
      skillsFilter.value.some((skill) => worker.job_title?.toLowerCase().includes(skill.toLowerCase())),
    )
  }

  return filtered
})

// Check if worker is already in project team
const isWorkerInTeam = (workerId: number) => {
  return projectTeam.value.some((member: unknown) => (member as { id: number }).id === workerId)
}


// Load available workers
async function loadAvailableWorkers() {
  loading.value = true
  error.value = null

  try {
    console.log('👥 Loading project workers for', props.mode)

    const response = await hrResourcesApi.getAllWorkerUsers(
      1,
      100,
      {
        project_id: props.projectId || undefined,
        status: '1',
        view_mode: 'registered',
      }
    )

    if ('workers' in response && Array.isArray(response.workers)) {
      // Filter based on user role and mode
      availableWorkers.value = response.workers.filter((worker) => {
        // Exclude system administrators and other project managers for PM
        if (authStore.currentUser?.role_code === 'project_manager') {
          return (
            worker.role_code !== 'admin' &&
            worker.role_code !== 'project_manager' &&
            worker.invitation_status === 'registered'
          )
        }
        return worker.invitation_status === 'registered'
      })

      console.log('✅ Project workers loaded:', availableWorkers.value.length)
    } else {
      throw new Error('Invalid response format')
    }
  } catch (err: unknown) {
    console.error('❌ Error loading project workers:', err)
    error.value = 'Failed to load project workers'
    availableWorkers.value = []
  } finally {
    loading.value = false
  }
}

// Load project team if in project mode
async function loadProjectTeam() {
  if (props.mode === 'project' && props.projectId) {
    try {
      projectTeam.value = await hrResourcesApi.getProjectTeam(props.projectId)
      console.log('✅ Project team loaded:', projectTeam.value.length)
    } catch (err) {
      console.error('❌ Error loading project team:', err)
    }
  }
}

// Select worker
function selectWorker(worker: WorkerUser) {
  if (selectedWorkers.value.some((w) => w.id === worker.id)) {
    // Remove from selected
    selectedWorkers.value = selectedWorkers.value.filter((w) => w.id !== worker.id)
  } else {
    // Add to selected
    selectedWorkers.value.push(worker)
  }
}

// Send invitations
async function sendInvitations() {
  if (selectedWorkers.value.length === 0) return

  loading.value = true
  error.value = null

  try {
    console.log('📧 Sending project invitations to:', selectedWorkers.value.length, 'workers')

    // Send invitations for each selected worker
    const invitations = selectedWorkers.value.map((worker) =>
      hrResourcesApi.inviteWorkerUser({
        email: worker.email,
        role: worker.role_code,
        project_id: props.projectId,
      })
    )

    await Promise.all(invitations)

    // Emit events
    emit('workersInvited', selectedWorkers.value)

    // Clear selection
    selectedWorkers.value = []

    console.log('✅ Project invitations sent successfully')
  } catch (err: unknown) {
    console.error('❌ Error sending project invitations:', err)
    error.value = 'Failed to send project invitations'
  } finally {
    loading.value = false
  }
}

// Clear filters
function clearFilters() {
  searchQuery.value = ''
  userTypeFilter.value = ''
  statusFilter.value = ''
  availabilityFilter.value = ''
  skillsFilter.value = []
}

// Toggle filters
function toggleFilters() {
  isFiltersOpen.value = !isFiltersOpen.value
}

// Get role color
function getRoleColor(userType: string): string {
  switch (userType) {
    case 'Foreman':
      return 'bg-blue-100 text-blue-800'
    case 'Worker':
      return 'bg-green-100 text-green-800'
    case 'Trade Contractor':
      return 'bg-yellow-100 text-yellow-800'
    case 'Inspector':
      return 'bg-purple-100 text-purple-800'
    case 'General Contractor':
      return 'bg-orange-100 text-orange-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// Get availability status
function getAvailabilityStatus(worker: WorkerUser): { text: string; color: string } {
  switch (worker.status) {
    case 1:
      return { text: 'Active', color: 'bg-green-100 text-green-800' }
    case 0:
      return { text: 'Inactive', color: 'bg-red-100 text-red-800' }
    default:
      return { text: 'Unknown', color: 'bg-gray-100 text-gray-800' }
  }
}

// Get user type options
const userTypeOptions = [
  { value: '', label: 'All Types' },
  { value: 'Worker', label: 'Worker' },
  { value: 'Foreman', label: 'Foreman' },
  { value: 'Trade Contractor', label: 'Trade Contractor' },
  { value: 'General Contractor', label: 'General Contractor' },
  { value: 'Inspector', label: 'Inspector' },
]

// Get status options
const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

// Get availability options
const availabilityOptions = [
  { value: '', label: 'All Availability' },
  { value: 'available', label: 'Available' },
  { value: 'busy', label: 'Busy' },
  { value: 'on_leave', label: 'On Leave' },
  { value: 'unavailable', label: 'Unavailable' },
]

// Load data on mount
onMounted(async () => {
  await loadAvailableWorkers()
  await loadProjectTeam()
})

// Watch for changes
watch([searchQuery, userTypeFilter, statusFilter, availabilityFilter, skillsFilter], () => {
  // Filtering happens in computed, no reload needed
})
</script>

<template>
  <div class="project-hr-manager">
    <!-- Header -->
    <div class="bg-white shadow rounded-lg p-4 mb-4">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900">
          {{ mode === 'project' ? 'Project Team Workers' : mode === 'task' ? 'Task Team Workers' : 'Available Workers' }}
        </h2>
        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-500"> {{ selectedWorkers.length }} selected </span>
          <button
            v-if="selectedWorkers.length > 0"
            @click="sendInvitations"
            :disabled="loading"
            class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {{ loading ? 'Sending...' : 'Send Invitations' }}
          </button>
        </div>
      </div>

      <!-- Search and Filters -->
      <div class="flex items-center space-x-3">
        <!-- Search -->
        <div class="flex-1 relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search workers..."
            class="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <svg
            class="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <!-- Filter Button -->
        <button
          @click="toggleFilters"
          class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          :class="{ 'bg-blue-50 text-blue-600': isFiltersOpen }"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
        </button>
      </div>

      <!-- Filters Panel -->
      <div v-if="isFiltersOpen" class="mt-4 pt-4 border-t border-gray-200">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">User Type</label>
            <select
              v-model="userTypeFilter"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option v-for="option in userTypeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              v-model="statusFilter"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Availability</label>
            <select
              v-model="availabilityFilter"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option v-for="option in availabilityOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
          <div class="flex items-end">
            <button
              @click="clearFilters"
              class="w-full px-3 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
      <div class="flex">
        <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clip-rule="evenodd"
          />
        </svg>
        <div class="ml-3">
          <p class="text-sm text-red-800">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Workers List -->
    <div class="bg-white shadow rounded-lg overflow-hidden">
      <div class="px-4 py-3 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-medium text-gray-900">
            Available Workers ({{ filteredWorkers.length }})
          </h3>
          <div v-if="loading" class="flex items-center text-sm text-gray-500">
            <svg
              class="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500"
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
            Loading workers...
          </div>
        </div>
      </div>

      <!-- Desktop Table -->
      <div class="hidden lg:block overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                Select
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                Name
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">
                Contact
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                Role & Skills
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Status
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                Rate & Experience
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="worker in filteredWorkers"
              :key="worker.id"
              @click="selectWorker(worker)"
              class="cursor-pointer hover:bg-gray-50"
              :class="{
                'bg-blue-50': selectedWorkers.some((w) => w.id === worker.id),
                'bg-yellow-50': isWorkerInTeam(worker.id)
              }"
            >
              <td class="px-4 py-4 whitespace-nowrap w-12">
                <input
                  type="checkbox"
                  :checked="selectedWorkers.some((w) => w.id === worker.id)"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </td>
              <td class="px-4 py-4 whitespace-nowrap w-48">
                <div class="flex items-center">
                  <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span class="text-white text-xs font-medium">
                      {{ worker.first_name?.charAt(0) }}{{ worker.last_name?.charAt(0) }}
                    </span>
                  </div>
                  <div class="ml-3 min-w-0 flex-1">
                    <div class="text-sm font-medium text-gray-900 truncate">
                      {{ worker.first_name }} {{ worker.last_name }}
                    </div>
                    <div class="text-sm text-gray-500 truncate">ID: {{ worker.id }}</div>
                  </div>
                </div>
              </td>
              <td class="px-4 py-4 whitespace-nowrap w-64">
                <div class="text-sm text-gray-900 truncate">{{ worker.email }}</div>
                <div class="text-sm text-gray-500 truncate">{{ worker.phone || '—' }}</div>
              </td>
              <td class="px-4 py-4 whitespace-nowrap w-48">
                <span
                  :class="getRoleColor(worker.role_code)"
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                >
                  {{ worker.role_name }}
                </span>
                <div class="text-sm text-gray-500 truncate mt-1">
                  {{ worker.job_title || '—' }}
                </div>
                <div v-if="worker.job_title" class="text-xs text-gray-400 mt-1">
                  Job: {{ worker.job_title }}
                </div>
              </td>
              <td class="px-4 py-4 whitespace-nowrap w-32">
                <span
                  :class="getAvailabilityStatus(worker).color"
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                >
                  {{ getAvailabilityStatus(worker).text }}
                </span>
              </td>
              <td class="px-4 py-4 whitespace-nowrap w-40">
                <div class="text-sm text-gray-900">
                  Rate: N/A
                </div>
                <div class="text-sm text-gray-500">
                  Experience: N/A
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Cards -->
      <div class="lg:hidden">
        <div class="divide-y divide-gray-200">
          <div
            v-for="worker in filteredWorkers"
            :key="worker.id"
            @click="selectWorker(worker)"
            class="p-4 hover:bg-gray-50 cursor-pointer"
            :class="{
              'bg-blue-50': selectedWorkers.some((w) => w.id === worker.id),
              'bg-yellow-50': isWorkerInTeam(worker.id)
            }"
          >
            <div class="flex items-start space-x-3">
              <!-- Avatar -->
              <div class="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span class="text-white text-sm font-medium">
                  {{ worker.first_name?.charAt(0) }}{{ worker.last_name?.charAt(0) }}
                </span>
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-2">
                  <div>
                    <h4 class="text-sm font-medium text-gray-900">
                      {{ worker.first_name }} {{ worker.last_name }}
                    </h4>
                    <p class="text-sm text-gray-500">ID: {{ worker.id }}</p>
                  </div>
                  <input
                    type="checkbox"
                    :checked="selectedWorkers.some((w) => w.id === worker.id)"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <!-- Contact Info -->
                <div class="mb-2">
                  <p class="text-sm text-gray-900">{{ worker.email }}</p>
                  <p v-if="worker.phone" class="text-sm text-gray-500">{{ worker.phone }}</p>
                </div>

                <!-- Role and Status -->
                <div class="flex flex-wrap items-center gap-2 mb-2">
                  <span
                    :class="getRoleColor(worker.role_code)"
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                  >
                    {{ worker.role_name }}
                  </span>
                  <span
                    :class="getAvailabilityStatus(worker).color"
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                  >
                    {{ getAvailabilityStatus(worker).text }}
                  </span>
                </div>

                <!-- Job Title and Skills -->
                <div class="mb-2">
                  <p class="text-xs text-gray-500">
                    {{ worker.job_title || 'No job title specified' }}
                  </p>
                  <p v-if="worker.job_title" class="text-xs text-gray-400">
                    Job: {{ worker.job_title }}
                  </p>
                </div>

                <!-- Rate and Experience -->
                <div class="mb-2">
                  <p class="text-xs text-gray-500">
                    Rate: N/A | Experience: N/A
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="filteredWorkers.length === 0 && !loading" class="p-6 text-center text-gray-500">
        <p>No workers found matching your criteria.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.project-hr-manager {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>

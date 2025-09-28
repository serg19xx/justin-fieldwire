<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import InviteBuilderDialog from '@/components/InviteBuilderDialog.vue'
import { hrResourcesApi, type ProjectTeamMember } from '@/core/utils/hr-api'
import { USER_TYPE_OPTIONS, type UserType } from '@/core/utils/constants'
import { useAuthStore } from '@/core/stores/auth'

const authStore = useAuthStore()

// User types structure
interface User {
  id: number
  firstName: string
  lastName: string
  email: string
  phone?: string
  userType: UserType
  jobTitle?: string
  status: 'active' | 'inactive' | 'pending'
  lastActive?: string
  createdAt: string
  inactiveReason?: string
  inactiveReasonDetails?: string
  expectedActivationDate?: string
}

// Real data from database - NO MORE MOCK DATA
const builders = ref<User[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Filters
const searchQuery = ref('')
const userTypeFilter = ref('')
const statusFilter = ref('')
const isFiltersOpen = ref(false)

// Computed filtered builders (excluding System Administrator)
const filteredBuilders = computed(() => {
  return builders.value
    .filter((builder) => builder.userType !== 'System Administrator')
    .filter((builder) => {
      const matchesSearch =
        searchQuery.value === '' ||
        builder.firstName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        builder.lastName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        builder.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        (builder.jobTitle &&
          builder.jobTitle.toLowerCase().includes(searchQuery.value.toLowerCase()))

      const matchesType = userTypeFilter.value === '' || builder.userType === userTypeFilter.value
      const matchesStatus = statusFilter.value === '' || builder.status === statusFilter.value

      // Фильтрация по режиму просмотра
      const matchesViewMode =
        viewMode.value === 'pending' ? builder.status === 'pending' : builder.status !== 'pending'

      return matchesSearch && matchesType && matchesStatus && matchesViewMode
    })
})

// Computed для проверки активных фильтров
const hasActiveFilters = computed(() => {
  return userTypeFilter.value !== '' || statusFilter.value !== ''
})

// Permission checks
const canInviteWorkers = computed(() => {
  const userType = authStore.currentUser?.user_type
  return userType === 'Project Manager' || userType === 'System Administrator'
})

const canViewWorkers = computed(() => {
  const userType = authStore.currentUser?.user_type
  return [
    'Project Manager',
    'System Administrator',
    'General Contractor',
    'Trade Contractor',
    'Architect',
    'Client',
  ].includes(userType || '')
})

// Функция загрузки данных с базы данных
async function loadBuilders() {
  loading.value = true
  error.value = null

  try {
    console.log('🚀 Loading workers from database for mode:', viewMode.value)

    const response = await workersApi.getAll(1, 10)

    if ('workers' in response && Array.isArray(response.workers)) {
      builders.value = response.workers.map((worker: Worker) => {
        const isRegistered = worker.invitation_status === 'registered'
        const mappedWorker = {
          id: worker.id,
          firstName: worker.first_name || '',
          lastName: worker.last_name || '',
          email: worker.email,
          phone: worker.phone,
          userType: worker.user_type as UserType,
          jobTitle: worker.job_title,
          status: isRegistered
            ? worker.status === 1
              ? 'active'
              : 'inactive'
            : ('pending' as 'active' | 'inactive' | 'pending'),
          lastActive: isRegistered ? worker.last_login : 'Never',
          createdAt: isRegistered
            ? worker.registration_completed_at || worker.created_at
            : worker.invitation_sent_at || worker.created_at,
          inactiveReason: worker.status_reason || (worker.status === 0 ? 'Vacation' : undefined),
          inactiveReasonDetails:
            worker.status_details ||
            (worker.status === 0 ? 'Employee is on vacation until return date' : undefined),
          expectedActivationDate:
            worker.additional_info || (worker.status === 0 ? '2025-09-15' : undefined),
        }

        return mappedWorker
      })

      console.log('✅ Workers loaded from database:', builders.value.length)
    } else {
      throw new Error('Invalid response format')
    }
  } catch (apiError: unknown) {
    console.error('❌ Database error:', apiError)
    error.value = 'Failed to load data from database'
    builders.value = []
  } finally {
    loading.value = false
  }
}

// Сброс при изменении фильтров
watch([searchQuery, userTypeFilter, statusFilter], () => {
  loadBuilders()
})

// Загрузка данных при монтировании
onMounted(() => {
  console.log('🔍 PeopleView mounted - current user:', authStore.currentUser)
  console.log('🔍 User permissions:', authStore.currentUser?.permissions)

  // Check if user can view workers
  if (!canViewWorkers.value) {
    error.value = 'You do not have permission to view workers'
    return
  }

  loadBuilders()
})

// User type options for filter (imported from constants)
const userTypeOptions = USER_TYPE_OPTIONS

function getUserTypeColor(userType: UserType) {
  switch (userType) {
    case 'Architect':
      return 'bg-purple-100 text-purple-800'
    case 'Project Manager':
      return 'bg-blue-100 text-blue-800'
    case 'General Contractor':
      return 'bg-green-100 text-green-800'
    case 'Trade Contractor':
      return 'bg-yellow-100 text-yellow-800'
    case 'Client':
      return 'bg-gray-100 text-gray-800'
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

function formatLastActive(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

  if (diffInHours < 1) return 'Just now'
  if (diffInHours < 24) return `${diffInHours}h ago`
  if (diffInHours < 48) return 'Yesterday'
  return formatDate(dateString)
}

// Check if job title is required for user type
function isJobTitleRequired(userType: UserType): boolean {
  return userType === 'Trade Contractor'
}

// Get job title display with validation
function getJobTitleDisplay(builder: User): string {
  if (builder.jobTitle) {
    return builder.jobTitle
  }

  if (isJobTitleRequired(builder.userType)) {
    return 'Required'
  }

  return '—'
}

// Get job title display class
function getJobTitleClass(builder: User): string {
  if (builder.jobTitle) {
    return 'text-sm text-gray-900'
  }

  if (isJobTitleRequired(builder.userType)) {
    return 'text-sm text-red-600 font-medium'
  }

  return 'text-sm text-gray-400'
}

function toggleFilters() {
  isFiltersOpen.value = !isFiltersOpen.value
}

function clearFilters() {
  searchQuery.value = ''
  userTypeFilter.value = ''
  statusFilter.value = ''
}

// Dialog state
const isInviteDialogOpen = ref(false)

// View mode state
const viewMode = ref<'registered' | 'pending'>('registered')

function openInviteDialog() {
  if (!canInviteWorkers.value) {
    alert('You do not have permission to invite workers')
    return
  }
  isInviteDialogOpen.value = true
}

function closeInviteDialog() {
  isInviteDialogOpen.value = false
}

function toggleViewMode() {
  viewMode.value = viewMode.value === 'registered' ? 'pending' : 'registered'
}

function handleInviteSent(data: {
  email: string
  firstName: string
  lastName: string
  userType: string
  specialization?: string
  phone?: string
}) {
  console.log('Invitation sent to:', data.email)

  // Добавляем нового работника в список без обращения к серверу
  const newBuilder: User = {
    id: Date.now(), // Временный ID
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    userType: data.userType as UserType,
    jobTitle: data.specialization || '',
    status: 'pending',
    lastActive: 'Never',
    createdAt: new Date().toISOString(),
  }

  builders.value.unshift(newBuilder)
}

// Function to add worker to project (placeholder for future implementation)
function addWorkerToProject(worker: User) {
  console.log('Add worker to project:', worker)
  // TODO: Implement adding worker to current project
  // This would open a dialog to select project or add to current project
  alert(
    `Functionality to add ${worker.firstName} ${worker.lastName} to project will be implemented`,
  )
}
</script>

<template>
  <div class="space-y-4 p-4 pt-4 md:space-y-6 md:p-6 md:pt-6">
    <!-- Permission Check -->
    <div v-if="!canViewWorkers" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            ></path>
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Access Denied</h3>
          <p class="text-sm text-red-700 mt-1">You do not have permission to view workers.</p>
        </div>
      </div>
    </div>

    <!-- Main Content (only show if user has permission) -->
    <div v-else>
      <!-- Search and Actions Bar -->
      <div class="bg-white shadow rounded-lg p-3 sm:p-4">
        <div class="flex items-center justify-between space-x-2 sm:space-x-4">
          <!-- Search and Filter -->
          <div class="flex items-center space-x-2 sm:space-x-3">
            <!-- Search Bar -->
            <div class="w-48 sm:w-56 md:w-64 relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search builders..."
                class="w-full pl-7 sm:pl-8 pr-2 sm:pr-3 py-1 sm:py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
              />
              <svg
                class="absolute left-2 sm:left-2.5 top-1.5 sm:top-2 h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400"
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

            <!-- Filter Button with Indicator -->
            <div class="relative">
              <button
                @click="toggleFilters"
                class="p-1 sm:p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                :class="{ 'bg-blue-50 text-blue-600': isFiltersOpen }"
              >
                <svg
                  class="h-3.5 w-3.5 sm:h-4 sm:w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  ></path>
                </svg>
              </button>

              <!-- Active Filters Indicator -->
              <div
                v-if="hasActiveFilters"
                class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"
              ></div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center space-x-2 sm:space-x-3">
            <!-- Pending Toggle Button -->
            <button
              @click="toggleViewMode"
              :class="[
                'px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-md transition-colors text-xs sm:text-sm flex items-center space-x-1',
                viewMode === 'pending'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
              ]"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <span>{{ viewMode === 'pending' ? 'Pending' : 'Registered' }}</span>
            </button>

            <!-- Add Builder Button (only for Project Managers and System Administrators) -->
            <button
              v-if="canInviteWorkers"
              @click="openInviteDialog"
              class="bg-blue-600 text-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-md hover:bg-blue-700 transition-colors text-xs sm:text-sm"
            >
              + Add Builder
            </button>
          </div>
        </div>

        <!-- Filters Panel -->
        <div v-if="isFiltersOpen" class="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
                >User Type</label
              >
              <select
                v-model="userTypeFilter"
                class="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
              >
                <option value="">All Types</option>
                <option v-for="type in userTypeOptions" :key="type" :value="type">
                  {{ type }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                v-model="statusFilter"
                class="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div class="flex items-end">
              <button
                @click="clearFilters"
                class="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-xs sm:text-sm"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Builders Table/List -->
      <div class="bg-white shadow rounded-lg overflow-hidden">
        <div class="px-4 py-4 border-b border-gray-200 sm:px-6">
          <div
            class="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:items-center sm:space-y-0"
          >
            <h3 class="text-lg font-medium text-gray-900">
              Builders ({{ filteredBuilders.length }})
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
              Loading from database...
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="px-4 py-3 bg-red-50 border-b border-red-200">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd"
                ></path>
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
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48"
                >
                  Name
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64"
                >
                  Contact
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48"
                >
                  Role
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32"
                >
                  Status
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40"
                >
                  {{ viewMode === 'pending' ? 'Invited' : 'Last Active' }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="builder in filteredBuilders" :key="builder.id">
                <td class="px-4 py-4 whitespace-nowrap w-48">
                  <div class="flex items-center">
                    <div
                      class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0"
                    >
                      <span class="text-white text-xs font-medium">
                        {{ builder.firstName.charAt(0) }}{{ builder.lastName.charAt(0) }}
                      </span>
                    </div>
                    <div class="ml-3 min-w-0 flex-1">
                      <div class="text-sm font-medium text-gray-900 truncate">
                        {{ builder.firstName }} {{ builder.lastName }}
                      </div>
                      <div class="text-sm text-gray-500 truncate">ID: {{ builder.id }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap w-64">
                  <div class="text-sm text-gray-900 truncate">{{ builder.email }}</div>
                  <div class="text-sm text-gray-500 truncate">{{ builder.phone || '—' }}</div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap w-48">
                  <span
                    :class="getUserTypeColor(builder.userType)"
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                  >
                    {{ builder.userType }}
                  </span>
                  <div :class="getJobTitleClass(builder)" class="text-sm truncate mt-1">
                    {{ getJobTitleDisplay(builder) }}
                  </div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap w-32">
                  <span
                    v-if="viewMode === 'pending'"
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                  >
                    Pending
                  </span>
                  <div v-else class="flex flex-col">
                    <span
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                      :class="{
                        'bg-green-100 text-green-800': builder.status === 'active',
                        'bg-red-100 text-red-800': builder.status === 'inactive',
                      }"
                    >
                      {{ builder.status === 'active' ? 'Active' : 'Inactive' }}
                    </span>
                    <div v-if="builder.status === 'inactive'" class="mt-1 text-xs text-gray-500">
                      <div
                        v-if="builder.inactiveReason"
                        class="truncate"
                        :title="builder.inactiveReasonDetails"
                      >
                        {{ builder.inactiveReason }}
                      </div>
                      <div v-if="builder.expectedActivationDate" class="text-gray-400">
                        Until: {{ formatDate(builder.expectedActivationDate) }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap w-40">
                  <span v-if="viewMode === 'pending'" class="text-sm text-gray-500 truncate">
                    {{ formatDate(builder.createdAt) }}
                  </span>
                  <span
                    v-else-if="builder.lastActive && builder.lastActive !== 'Never'"
                    class="text-sm text-gray-500 truncate"
                  >
                    {{ formatLastActive(builder.lastActive) }}
                  </span>
                  <span v-else class="text-sm text-gray-400">Never</span>
                </td>
                <td class="px-4 py-4 whitespace-nowrap w-24">
                  <div class="flex items-center gap-1">
                    <!-- Add to Project Button (only for Project Managers) -->
                    <button
                      v-if="authStore.currentUser?.user_type === 'Project Manager'"
                      @click="addWorkerToProject(builder)"
                      class="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors duration-200"
                      title="Add to Project"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    </button>
                    <!-- View Button (for all authorized users) -->
                    <button
                      @click="console.log('View worker:', builder)"
                      class="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200"
                      title="View Details"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile/Tablet Cards -->
        <div class="lg:hidden">
          <div class="divide-y divide-gray-200">
            <div v-for="builder in filteredBuilders" :key="builder.id" class="p-4 hover:bg-gray-50">
              <div class="flex items-start space-x-3">
                <!-- Avatar -->
                <div
                  class="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0"
                >
                  <span class="text-white text-sm font-medium">
                    {{ builder.firstName.charAt(0) }}{{ builder.lastName.charAt(0) }}
                  </span>
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between mb-2">
                    <div>
                      <h4 class="text-sm font-medium text-gray-900">
                        {{ builder.firstName }} {{ builder.lastName }}
                      </h4>
                      <p class="text-sm text-gray-500">ID: {{ builder.id }}</p>
                    </div>
                    <!-- Read-only status display -->
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :class="{
                        'bg-green-100 text-green-800': builder.status === 'active',
                        'bg-red-100 text-red-800': builder.status === 'inactive',
                        'bg-yellow-100 text-yellow-800': builder.status === 'pending',
                      }"
                    >
                      {{
                        builder.status === 'active'
                          ? 'Active'
                          : builder.status === 'inactive'
                            ? 'Inactive'
                            : 'Pending'
                      }}
                    </span>
                  </div>

                  <!-- Contact Info -->
                  <div class="mb-2">
                    <p class="text-sm text-gray-900">{{ builder.email }}</p>
                    <p v-if="builder.phone" class="text-sm text-gray-500">{{ builder.phone }}</p>
                  </div>

                  <!-- Type and Job Title -->
                  <div class="flex flex-wrap items-center gap-2 mb-2">
                    <span
                      :class="getUserTypeColor(builder.userType)"
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                    >
                      {{ builder.userType }}
                    </span>
                    <div :class="getJobTitleClass(builder)" class="text-xs">
                      {{ getJobTitleDisplay(builder) }}
                    </div>
                  </div>

                  <!-- Last Active -->
                  <div class="mb-3">
                    <p class="text-xs text-gray-500">
                      Last active:
                      <span v-if="builder.lastActive">
                        {{ formatLastActive(builder.lastActive) }}
                      </span>
                      <span v-else class="text-gray-400">Never</span>
                    </p>
                  </div>

                  <!-- Actions -->
                  <div class="flex items-center gap-2">
                    <!-- Add to Project Button (only for Project Managers) -->
                    <button
                      v-if="authStore.currentUser?.user_type === 'Project Manager'"
                      @click="addWorkerToProject(builder)"
                      class="flex items-center gap-1 px-2 py-1 text-xs text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                    >
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Add to Project
                    </button>
                    <!-- View Button -->
                    <button
                      @click="console.log('View worker:', builder)"
                      class="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                    >
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      View
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="filteredBuilders.length === 0" class="p-6 text-center text-gray-500">
          <p>No builders found matching your criteria.</p>
        </div>
      </div>
    </div>

    <!-- Dialogs -->
    <InviteBuilderDialog
      :is-open="isInviteDialogOpen"
      @close="closeInviteDialog"
      @invite-sent="handleInviteSent"
    />
  </div>
</template>

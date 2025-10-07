<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import InviteBuilderDialog from '@/components/InviteBuilderDialog.vue'
import { hrResourcesApi } from '@/core/utils/hr-api'
import { type WorkerUser } from '@/core/utils/hr-api'
import { type UserType } from '@/core/utils/constants'
import { useAuthStore } from '@/core/stores/auth'

// Store
const authStore = useAuthStore()
const route = useRoute()

// Project workers data
const builders = ref<WorkerUser[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Filters
const searchQuery = ref('')
const userTypeFilter = ref('')
const statusFilter = ref('')
const invitationStatusFilter = ref('')
const isFiltersOpen = ref(false)

// Computed filtered builders - теперь просто возвращаем данные с сервера
const filteredBuilders = computed(() => {
  return builders.value
})

// Computed для проверки активных фильтров
const hasActiveFilters = computed(() => {
  return (
    userTypeFilter.value !== '' || statusFilter.value !== '' || invitationStatusFilter.value !== ''
  )
})

// Функция загрузки данных с базы данных
async function loadBuilders() {
  loading.value = true
  error.value = null

  try {
    console.log('🚀 Loading workers from database for mode:', viewMode.value)

    // Формируем фильтры только для выбранных значений
    const filters: {
      sort_by: string
      sort_order: 'ASC' | 'DESC'
      status?: string
      invitation_status?: string
      view_mode?: string
      role_code?: string
      search?: string
      project_id?: number
      prj_mngr_id?: number
    } = {
      sort_by: 'created_at',
      sort_order: 'DESC',
    }

    // Добавляем фильтры только если они выбраны
    if (statusFilter.value && statusFilter.value !== '') {
      filters.status = statusFilter.value
    }

    if (invitationStatusFilter.value && invitationStatusFilter.value !== '') {
      filters.invitation_status = invitationStatusFilter.value
    } else {
      // Если фильтр по статусу приглашения не выбран, используем режим просмотра
      filters.view_mode = viewMode.value
    }

    if (userTypeFilter.value && userTypeFilter.value !== '') {
      filters.role_code = userTypeFilter.value
    }

    if (searchQuery.value && searchQuery.value.trim() !== '') {
      filters.search = searchQuery.value.trim()
    }

    // Определяем параметры проекта на основе роли пользователя
    const userRole = authStore.currentUser?.role_code
    const userId = authStore.currentUser?.id

    if (userRole === 'project_manager' && userId) {
      // Если менеджер проекта - передаем его ID
      filters.prj_mngr_id = userId
    } else if (route.params.id) {
      // Если есть ID проекта в роуте - передаем его
      filters.project_id = parseInt(route.params.id as string)
    }

    console.log('🔍 Filters being sent to API:', filters)

    const response = await hrResourcesApi.getAllWorkerUsers(1, 50, filters)

    if ('workers' in response && Array.isArray(response.workers)) {
      builders.value = response.workers

      console.log('✅ Project workers loaded from database:', builders.value.length)

      // Логируем статусы приглашений для отладки
      const statusCounts = builders.value.reduce(
        (acc: Record<string, number>, builder: WorkerUser) => {
          acc[builder.invitation_status] = (acc[builder.invitation_status] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )
      console.log('📊 Invitation status counts:', statusCounts)
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
watch([searchQuery, userTypeFilter, statusFilter, invitationStatusFilter], () => {
  loadBuilders()
})

// Загрузка данных при монтировании
onMounted(() => {
  loadBuilders()
})

// User type options for filter
const userTypeOptions = [
  'architect',
  'project_manager',
  'general_contractor',
  'contractor',
  'client',
]

// Get role display name from API data
function getRoleDisplayName(roleCode: string): string {
  // Найдем роль в данных и вернем role_name
  const builder = builders.value.find((b) => b.role_code === roleCode)
  return builder?.role_name || roleCode
}

function getUserTypeColor(userType: UserType) {
  switch (userType) {
    case 'architect':
      return 'bg-purple-100 text-purple-800'
    case 'project_manager':
      return 'bg-blue-100 text-blue-800'
    case 'general_contractor':
      return 'bg-green-100 text-green-800'
    case 'contractor':
      return 'bg-yellow-100 text-yellow-800'
    case 'client':
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

// Check if job title is required for user type
function isJobTitleRequired(userType: UserType): boolean {
  return userType === 'contractor'
}

// Get job title display with validation
function getJobTitleDisplay(builder: WorkerUser): string {
  if (builder.job_title) {
    return builder.job_title
  }

  if (isJobTitleRequired(builder.role_code as UserType)) {
    return 'Required'
  }

  return '—'
}

// Get job title display class
function getJobTitleClass(builder: WorkerUser): string {
  if (builder.job_title) {
    return 'text-sm text-gray-900'
  }

  if (isJobTitleRequired(builder.role_code as UserType)) {
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
  invitationStatusFilter.value = ''
}

// Dialog state
const isInviteDialogOpen = ref(false)

// View mode state
const viewMode = ref<'registered' | 'pending'>('registered')

// HR Resource Manager state
const showHRManager = ref(false)
const hrManagerMode = ref<'project' | 'task'>('project')

// Computed properties

function openInviteDialog() {
  isInviteDialogOpen.value = true
}

function closeInviteDialog() {
  isInviteDialogOpen.value = false
}

function toggleViewMode() {
  viewMode.value = viewMode.value === 'registered' ? 'pending' : 'registered'
  // Сбрасываем фильтры при переключении режимов
  userTypeFilter.value = ''
  statusFilter.value = ''
  invitationStatusFilter.value = ''
}

function handleWorkerUserSelected(worker: WorkerUser) {
  console.log('WorkerUser selected:', worker)
  // Здесь можно добавить логику для выбора работника
}

function handleWorkerUsersInvited(workers: WorkerUser[]) {
  console.log('WorkerUsers invited:', workers)
  // Здесь можно добавить логику для отправки приглашений
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
  const newBuilder: WorkerUser = {
    id: Date.now(), // Временный ID
    email: data.email,
    first_name: data.firstName,
    last_name: data.lastName,
    phone: data.phone || '',
    role_id: 0,
    job_title: data.specialization || '',
    status: 0,
    two_factor_enabled: false,
    last_login: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    invitation_status: 'invited',
    invitation_sent_at: new Date().toISOString(),
    invitation_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    invited_by: 0,
    registration_completed_at: null,
    invitation_attempts: 0,
    last_reminder_sent_at: null,
    archived_at: null,
    role_code: 'contractor',
    role_name: 'Contractor',
    role_category: 'task',
    role_description: null,
    status_reason: null,
    status_details: null,
    additional_info: null,
    avatar_url: null,
    two_factor_secret: null,
  }

  builders.value.unshift(newBuilder)
}

// Функция для изменения статуса пользователя
function toggleBuilderStatus(builderId: number, currentStatus: string) {
  const newStatus = currentStatus === 'active' ? 'registered' : 'invited'

  // Обновляем локальное состояние
  const builder = builders.value.find((b) => b.id === builderId)
  if (builder) {
    builder.invitation_status = newStatus
  }

  console.log(`Status updated for builder ${builderId}: ${newStatus}`)
}
</script>

<template>
  <div class="space-y-4 p-4 pt-4 md:space-y-6 md:p-6 md:pt-6">
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

          <!-- Add Builder Button -->
          <button
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
            <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1">User Type</label>
            <select
              v-model="userTypeFilter"
              class="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
            >
              <option value="">All Types</option>
              <option v-for="type in userTypeOptions" :key="type" :value="type">
                {{ getRoleDisplayName(type) }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
              >User Status</label
            >
            <select
              v-model="statusFilter"
              class="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
            >
              <option value="">All User Statuses</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </div>
          <div>
            <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
              >Invitation Status</label
            >
            <select
              v-model="invitationStatusFilter"
              class="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
            >
              <option value="">All Invitation Statuses</option>
              <option value="registered">Registered</option>
              <option value="invited">Invited</option>
              <option value="expired">Expired</option>
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
                User Status
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32"
              >
                Invitation
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40"
              >
                {{ viewMode === 'pending' ? 'Invited' : 'Last Active' }}
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
                      {{
                        (builder.first_name + ' ' + builder.last_name)
                          .split(' ')
                          .map((n) => n.charAt(0))
                          .join('')
                      }}
                    </span>
                  </div>
                  <div class="ml-3 min-w-0 flex-1">
                    <div class="text-sm font-medium text-gray-900 truncate">
                      {{ builder.first_name + ' ' + builder.last_name }}
                    </div>
                    <div class="text-sm text-gray-500 truncate">ID: {{ builder.id }}</div>
                  </div>
                </div>
              </td>
              <td class="px-4 py-4 whitespace-nowrap w-64">
                <div class="text-sm text-gray-900 truncate">{{ builder.email }}</div>
              </td>
              <td class="px-4 py-4 whitespace-nowrap w-48">
                <span
                  :class="getUserTypeColor(builder.role_code as UserType)"
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                >
                  {{ builder.role_name }}
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
                      'bg-green-100 text-green-800': builder.status === 1,
                      'bg-red-100 text-red-800': builder.status === 0,
                    }"
                  >
                    {{ builder.status === 1 ? 'Active' : 'Inactive' }}
                  </span>
                </div>
              </td>
              <td class="px-4 py-4 whitespace-nowrap w-32">
                <span
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                  :class="{
                    'bg-green-100 text-green-800': builder.invitation_status === 'registered',
                    'bg-yellow-100 text-yellow-800': builder.invitation_status === 'invited',
                    'bg-red-100 text-red-800': builder.invitation_status === 'expired',
                  }"
                >
                  {{
                    builder.invitation_status === 'registered'
                      ? 'Registered'
                      : builder.invitation_status === 'invited'
                        ? 'Invited'
                        : 'Expired'
                  }}
                </span>
              </td>
              <td class="px-4 py-4 whitespace-nowrap w-40">
                <span v-if="viewMode === 'pending'" class="text-sm text-gray-500 truncate">
                  {{ formatDate(builder.created_at) }}
                </span>
                <span class="text-sm text-gray-400">N/A</span>
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
                  {{
                    (builder.first_name + ' ' + builder.last_name)
                      .split(' ')
                      .map((n) => n.charAt(0))
                      .join('')
                  }}
                </span>
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-2">
                  <div>
                    <h4 class="text-sm font-medium text-gray-900">
                      {{ builder.first_name + ' ' + builder.last_name }}
                    </h4>
                    <p class="text-sm text-gray-500">ID: {{ builder.id }}</p>
                  </div>
                  <!-- Кликабельный статус -->
                  <button
                    @click="
                      toggleBuilderStatus(builder.id, builder.status === 1 ? 'active' : 'inactive')
                    "
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors"
                    :class="{
                      'bg-green-100 text-green-800 hover:bg-green-200': builder.status === 1,
                      'bg-red-100 text-red-800 hover:bg-red-200': builder.status === 0,
                    }"
                  >
                    {{ builder.status === 1 ? 'Active' : 'Inactive' }}
                  </button>
                </div>

                <!-- Contact Info -->
                <div class="mb-2">
                  <p class="text-sm text-gray-900">{{ builder.email }}</p>
                </div>

                <!-- Type and Job Title -->
                <div class="flex flex-wrap items-center gap-2 mb-2">
                  <span
                    :class="getUserTypeColor(builder.role_code as UserType)"
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                  >
                    {{ builder.role_name }}
                  </span>
                  <div :class="getJobTitleClass(builder)" class="text-xs">
                    {{ getJobTitleDisplay(builder) }}
                  </div>
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

    <!-- HR Resource Manager -->
    <div v-if="showHRManager" class="mt-6">
      <PMResourceManager
        :project-id="0"
        :mode="hrManagerMode"
        @worker-selected="handleWorkerUserSelected"
        @workers-invited="handleWorkerUsersInvited"
        @close="closeInviteDialog"
      />
    </div>

    <!-- Dialogs -->
    <InviteBuilderDialog
      :is-open="isInviteDialogOpen"
      @close="closeInviteDialog"
      @invite-sent="handleInviteSent"
    />
  </div>
</template>

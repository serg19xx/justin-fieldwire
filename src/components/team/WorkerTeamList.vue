<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { computed, onMounted, ref, watch, nextTick } from 'vue'
import InviteBuilderDialog from '@/components/InviteBuilderDialog.vue'
import WorkerAssignmentsPanel from '@/components/team/WorkerAssignmentsPanel.vue'
import { hrResourcesApi, type WorkerUser } from '@/core/utils/hr-api'
import { type UserType } from '@/core/utils/constants'
import { useAuthStore } from '@/core/stores/auth'
import { useWorkerListLoader } from '@/composables/useWorkerListLoader'
import type { Task } from '@/core/types/task'
import type { AssignmentProjectHint } from '@/core/utils/worker-assignments'

const props = withDefaults(
  defineProps<{
    projectId?: number | null
    projectName?: string
    projectTasks?: Task[]
    projectHint?: AssignmentProjectHint | null
    embedded?: boolean
    canAddWorker?: boolean
    addWorkerMode?: 'invite' | 'emit'
    refreshKey?: number
  }>(),
  {
    projectId: null,
    projectName: '',
    projectTasks: () => [],
    projectHint: null,
    embedded: false,
    canAddWorker: undefined,
    addWorkerMode: 'invite',
    refreshKey: 0,
  },
)

const emit = defineEmits<{
  addTeamMember: []
}>()

const authStore = useAuthStore()
const scopedProjectId = computed(() =>
  props.projectId != null && props.projectId > 0 ? props.projectId : null,
)

const {
  builders,
  loading,
  error,
  searchQuery,
  userTypeFilter,
  statusFilter,
  invitationStatusFilter,
  viewMode,
  currentPage,
  itemsPerPage,
  pageSizeOptions,
  totalItems,
  totalPages,
  startIndex,
  endIndex,
  paginatedBuilders,
  loadBuilders,
  goToPage,
  changePageSize,
} = useWorkerListLoader('registered', 10, () => scopedProjectId.value)

// User type options for filter


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



// Dialog state
const isInviteDialogOpen = ref(false)
const isUserDetailsOpen = ref(false)
const selectedUser = ref<WorkerUser | null>(null)
const isUserDetailsLoading = ref(false)
const listView = ref<'list' | 'tasks'>('list')
const assignmentsUserId = ref<number | null>(null)
const assignmentsUserName = ref('')
const savedScrollY = ref(0)

// Admin detection
const isAdminUser = computed(() => {
  const u = authStore.currentUser
  if (!u) return false
  const roleId: number | undefined = typeof (u as any).role_id === 'string' ? Number((u as any).role_id) : (u as any).role_id
  return roleId === 9 || u.role_code === 'admin' || u.job_title === 'System Administrator'
})

// Project Manager detection
const isProjectManagerUser = computed(() => authStore.currentUser?.role_code === 'project_manager')

const showAddWorkerButton = computed(() => {
  if (props.canAddWorker != null) return props.canAddWorker
  return isAdminUser.value || isProjectManagerUser.value
})

function handleAddWorkerClick() {
  if (props.addWorkerMode === 'emit') {
    emit('addTeamMember')
    return
  }
  openInviteDialog()
}

// View mode state — provided by useWorkerListLoader

// HR Resource Manager state
const showHRManager = ref(false)
const hrManagerMode = ref<'project' | 'task'>('project')

// Computed properties


function closeInviteDialog() {
  isInviteDialogOpen.value = false
}

function openInviteDialog() {
  isInviteDialogOpen.value = true
}

function openUserDetails(user: WorkerUser) {
  selectedUser.value = user
  isUserDetailsOpen.value = true
  isUserDetailsLoading.value = true
  void hrResourcesApi.getWorkerById(user.id).then((full) => {
    if (full && isUserDetailsOpen.value && selectedUser.value?.id === user.id) {
      selectedUser.value = full
    }
  }).finally(() => {
    if (selectedUser.value?.id === user.id) {
      isUserDetailsLoading.value = false
    }
  })
}

function closeUserDetails() {
  isUserDetailsOpen.value = false
  selectedUser.value = null
  isUserDetailsLoading.value = false
}

function workerDisplayName(user: WorkerUser): string {
  const full = `${user.first_name || ''} ${user.last_name || ''}`.trim()
  return full || user.name || `User #${user.id}`
}

function openAssignments(user: WorkerUser) {
  savedScrollY.value = window.scrollY
  assignmentsUserId.value = user.id
  assignmentsUserName.value = workerDisplayName(user)
  listView.value = 'tasks'
}

function closeAssignments() {
  listView.value = 'list'
  assignmentsUserId.value = null
  assignmentsUserName.value = ''
  void nextTick(() => {
    window.scrollTo(0, savedScrollY.value)
  })
}

onMounted(() => {
  void loadBuilders()
})

watch(
  () => props.refreshKey,
  () => {
    void loadBuilders()
  },
)

// Helper function to convert workforce group code to readable text
function getWorkforceGroupDisplay(group: string | null): string {
  if (!group) return '—'

  const groupMap: Record<string, string> = {
    'european_eastern': 'European Eastern',
    'european_western': 'European Western',
    'asian_eastern': 'Asian Eastern',
    'asian_southern': 'Asian Southern',
    'asian_southeastern': 'Asian Southeastern',
    'african': 'African',
    'latin_american': 'Latin American',
    'north_american': 'North American',
    'middle_eastern': 'Middle Eastern',
    'other': 'Other'
  }

  return groupMap[group] || group
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
    dob: null,
    gender: null,
    nationality: null,
    country_of_origin: null,
    workforce_group: null,
    phone: data.phone || null,
    role_id: 0,
    job_title: data.specialization || null,
    city: null,
    status: 0,
    emergency: null,
    status_changed_at: new Date().toISOString(),
    status_end_at: null,
    status_reason: null,
    status_details: null,
    additional_info: null,
    full_img_url: null,
    avatar_url: null,
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
    code: 'contractor',
    name: 'Contractor',
    category: 'task',
    description: null,
    role: {
      id: 0,
      code: 'contractor',
      name: 'Contractor',
      category: 'task'
    },
    professional_data: [],
    projects: [],
    languages: []
  }

  builders.value.unshift(newBuilder)
}

</script>

<template>
  <div :class="embedded ? '' : 'px-4 py-6 md:px-6'" style="padding-bottom: 0;">
    <!-- Search and Actions Bar -->
    <div v-if="listView === 'list'" class="bg-white shadow rounded-lg p-2 sm:p-3" style="margin-bottom: 0.5rem;">
      <div class="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <!-- Search -->
        <div class="flex-1">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search builders..."
            class="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <!-- Right actions: Add button (admin), filters -->
        <div class="flex gap-2 items-center">
          <!-- Add button visible for admin -->
          <button
            v-if="showAddWorkerButton"
            @click="handleAddWorkerClick"
            class="px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            + Add Worker
          </button>

          <!-- Filters -->
          <!-- Status Filter -->
          <div class="relative">
            <select
              v-model="userTypeFilter"
              class="px-2 py-1 pr-6 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-700 appearance-none cursor-pointer"
            >
              <option value="" class="text-gray-500">All Types</option>
              <option value="architect" class="text-gray-700">Architect</option>
              <option value="contractor" class="text-gray-700">Contractor</option>
              <option value="project_manager" class="text-gray-700">Project Manager</option>
            </select>
            <!-- Dropdown Arrow -->
            <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>

          <!-- View Mode Filter -->
          <div class="relative">
            <select
              v-model="viewMode"
              class="px-2 py-1 pr-6 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-700 appearance-none cursor-pointer"
            >
              <option value="registered" class="text-gray-700">Registered</option>
              <option value="pending" class="text-gray-700">Pending</option>
            </select>
            <!-- Dropdown Arrow -->
            <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Builders Table/List or inline Tasks view -->
    <div class="bg-white shadow rounded-lg overflow-hidden" style="margin-bottom: 0; margin-top: 0;">

      <WorkerAssignmentsPanel
        v-if="listView === 'tasks' && assignmentsUserId != null"
        :user-id="assignmentsUserId"
        :user-name="assignmentsUserName"
        :project-id="scopedProjectId"
        :project-name="projectName"
        :project="projectHint"
        :project-tasks="projectTasks"
        @close="closeAssignments"
      />

      <template v-else>

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

      <!-- Pagination Top -->
      <div v-if="totalItems > 0" class="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-200 sm:px-6">
        <div class="flex-1 flex justify-between sm:hidden">
          <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage <= 1"
            class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage >= totalPages"
            class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div class="flex items-center space-x-4">
            <p class="text-sm text-gray-700">
              Showing
              <span class="font-medium">{{ startIndex + 1 }}</span>
              to
              <span class="font-medium">{{ endIndex }}</span>
              of
              <span class="font-medium">{{ totalItems }}</span>
              results
            </p>
            <div class="flex items-center space-x-2">
              <label for="page-size-top" class="text-sm text-gray-700">Show:</label>
              <select
                id="page-size-top"
                v-model="itemsPerPage"
                @change="changePageSize(itemsPerPage)"
                class="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
              </select>
            </div>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                @click="goToPage(currentPage - 1)"
                :disabled="currentPage <= 1"
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="sr-only">Previous</span>
                <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </button>
              <button
                v-for="page in totalPages"
                :key="page"
                @click="goToPage(page)"
                :class="[
                  'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                  page === currentPage
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                ]"
              >
                {{ page }}
              </button>
              <button
                @click="goToPage(currentPage + 1)"
                :disabled="currentPage >= totalPages"
                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="sr-only">Next</span>
                <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="p-8 text-center text-gray-500">
        <div class="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
        <p class="mt-3 text-sm">Loading team…</p>
      </div>

      <!-- Desktop Table -->
      <div v-else class="hidden lg:block overflow-x-auto">
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
                Cultural Group
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40"
              >
                Languages
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-44"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="builder in paginatedBuilders" :key="builder.id">
              <td class="px-4 py-4 whitespace-nowrap w-48">
                <div class="flex items-center">
                  <!-- Avatar -->
                  <div v-if="builder.avatar_url" class="w-10 h-10 flex-shrink-0">
                    <img
                      :src="builder.avatar_url"
                      :alt="builder.first_name + ' ' + builder.last_name"
                      class="w-10 h-10 rounded-full object-cover"
                    />
                  </div>
                  <div
                    v-else
                    class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0"
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
                <div v-if="builder.phone" class="text-sm text-gray-500 truncate">{{ builder.phone }}</div>
              </td>
              <td class="px-4 py-4 whitespace-nowrap w-48">
                <span
                  :class="getUserTypeColor(builder.role?.code as UserType)"
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                >
                  {{ builder.role?.name || builder.name }}
                </span>
                <div v-if="builder.job_title" class="text-sm text-gray-600 truncate mt-1">
                  {{ builder.job_title }}
                </div>
              </td>
              <td class="px-4 py-4 whitespace-nowrap w-32">
                <span
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                  :class="{
                    'bg-green-100 text-green-800': builder.status === 1,
                    'bg-red-100 text-red-800': builder.status === 0,
                  }"
                >
                  {{ builder.status === 1 ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-4 py-4 whitespace-nowrap w-40">
                <span class="text-sm text-gray-900">
                  {{ getWorkforceGroupDisplay(builder.workforce_group) }}
                </span>
              </td>
              <td class="px-4 py-4 whitespace-nowrap w-40">
                <div v-if="builder.languages && builder.languages.length > 0" class="text-sm">
                  <div v-for="(lang, index) in builder.languages.slice(0, 2)" :key="index" class="text-gray-900">
                    {{ lang.name }} ({{ lang.prof_level }})
                  </div>
                  <div v-if="builder.languages.length > 2" class="text-gray-500 text-xs">
                    +{{ builder.languages.length - 2 }} more
                  </div>
                </div>
                <span v-else class="text-sm text-gray-400">—</span>
              </td>
              <td class="px-4 py-4 whitespace-nowrap w-44">
                <div class="flex flex-col gap-1">
                  <button
                    type="button"
                    class="inline-flex items-center px-2 py-1 rounded-md text-sm font-medium text-blue-600 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                    @click="openUserDetails(builder)"
                  >
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Details
                  </button>
                  <button
                    type="button"
                    class="inline-flex items-center px-2 py-1 rounded-md text-sm font-medium text-green-700 hover:text-green-600 hover:bg-green-50 transition-colors"
                    title="All tasks on all projects for this worker"
                    @click="openAssignments(builder)"
                  >
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                    </svg>
                    Tasks
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile/Tablet Cards -->
      <div v-if="!loading" class="lg:hidden">
        <div class="divide-y divide-gray-200">
          <div v-for="builder in paginatedBuilders" :key="builder.id" class="p-4 hover:bg-gray-50">
            <div class="flex items-start space-x-3">
              <!-- Avatar -->
              <div v-if="builder.avatar_url" class="w-12 h-12 flex-shrink-0">
                <img
                  :src="builder.avatar_url"
                  :alt="builder.first_name + ' ' + builder.last_name"
                  class="w-12 h-12 rounded-full object-cover"
                />
              </div>
              <div
                v-else
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

                <!-- Contact Info -->
                <div class="mb-2">
                  <p class="text-sm text-gray-900">{{ builder.email }}</p>
                  <p v-if="builder.phone" class="text-sm text-gray-500">{{ builder.phone }}</p>
                </div>

                <!-- Role and Job Title -->
                <div class="flex flex-wrap items-center gap-2 mb-2">
                  <span
                    :class="getUserTypeColor(builder.role?.code as UserType)"
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                  >
                    {{ builder.role?.name || builder.name }}
                  </span>
                  <span v-if="builder.job_title" class="text-xs text-gray-600">
                    {{ builder.job_title }}
                  </span>
                </div>

                <!-- Cultural Group and Languages -->
                <div class="flex flex-wrap items-center gap-2 mb-3">
                  <span v-if="builder.workforce_group" class="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    {{ getWorkforceGroupDisplay(builder.workforce_group) }}
                  </span>
                  <div v-if="builder.languages && builder.languages.length > 0" class="text-xs text-gray-600">
                    {{ builder.languages.slice(0, 2).map((l: any) => l.name).join(', ') }}
                    <span v-if="builder.languages.length > 2" class="text-gray-400">
                      +{{ builder.languages.length - 2 }} more
                    </span>
                  </div>
                </div>

                <div class="flex flex-wrap gap-2">
                  <button
                    type="button"
                    class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium text-blue-600 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                    @click="openUserDetails(builder)"
                  >
                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Details
                  </button>
                  <button
                    type="button"
                    class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium text-green-700 hover:text-green-600 hover:bg-green-50 transition-colors"
                    title="All tasks on all projects for this worker"
                    @click="openAssignments(builder)"
                  >
                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                    </svg>
                    Tasks
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="!loading && paginatedBuilders.length === 0" class="p-6 text-center text-gray-500">
        <p>No builders found matching your criteria.</p>
      </div>

      <!-- Pagination -->
      <div v-if="totalItems > 0" class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div class="flex-1 flex justify-between sm:hidden">
          <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage <= 1"
            class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage >= totalPages"
            class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div class="flex items-center space-x-4">
            <p class="text-sm text-gray-700">
              Showing
              <span class="font-medium">{{ startIndex + 1 }}</span>
              to
              <span class="font-medium">{{ endIndex }}</span>
              of
              <span class="font-medium">{{ totalItems }}</span>
              results
            </p>
            <div class="flex items-center space-x-2">
              <label for="page-size" class="text-sm text-gray-700">Show:</label>
              <select
                id="page-size"
                v-model="itemsPerPage"
                @change="changePageSize(itemsPerPage)"
                class="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
              </select>
            </div>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                @click="goToPage(currentPage - 1)"
                :disabled="currentPage <= 1"
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="sr-only">Previous</span>
                <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </button>
              <button
                v-for="page in totalPages"
                :key="page"
                @click="goToPage(page)"
                :class="[
                  'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                  page === currentPage
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                ]"
              >
                {{ page }}
              </button>
              <button
                @click="goToPage(currentPage + 1)"
                :disabled="currentPage >= totalPages"
                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="sr-only">Next</span>
                <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
      </template>
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
      v-if="addWorkerMode === 'invite'"
      :is-open="isInviteDialogOpen"
      :inviter-id="authStore.currentUser?.id"
      @close="closeInviteDialog"
      @invite-sent="handleInviteSent"
    />

    <!-- User Details Modal -->
    <div v-if="isUserDetailsOpen" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
        <!-- Background overlay -->
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="closeUserDetails"></div>

        <!-- Modal panel -->
        <div class="bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:max-w-6xl sm:w-full max-h-[90vh] flex flex-col">
          <!-- Header - Fixed -->
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 flex-shrink-0">
            <div class="sm:flex sm:items-start">
              <div class="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <!-- Header -->
                <div class="flex items-center justify-between mb-6">
                  <div class="flex items-center">
                    <div v-if="selectedUser?.avatar_url" class="w-16 h-16 flex-shrink-0">
                      <img
                        :src="selectedUser.avatar_url"
                        :alt="selectedUser.first_name + ' ' + selectedUser.last_name"
                        class="w-16 h-16 rounded-full object-cover"
                      />
                    </div>
                    <div
                      v-else
                      class="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0"
                    >
                      <span class="text-white text-xl font-medium">
                        {{
                          (selectedUser?.first_name + ' ' + selectedUser?.last_name)
                            .split(' ')
                            .map((n) => n.charAt(0))
                            .join('')
                        }}
                      </span>
                    </div>
                    <div class="ml-4">
                      <h3 class="text-lg font-medium text-gray-900">
                        {{ selectedUser?.first_name }} {{ selectedUser?.last_name }}
                      </h3>
                      <p class="text-sm text-gray-500">ID: {{ selectedUser?.id }}</p>
                    </div>
                  </div>
                  <button
                    @click="closeUserDetails"
                    class="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Scrollable Content -->
          <div class="flex-1 overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-6">
            <div v-if="selectedUser" class="space-y-6">
                  <!-- Personal Information -->
                  <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="text-lg font-medium text-gray-900 mb-4">Personal Information</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="text-sm font-medium text-gray-500">Email</label>
                        <p class="text-sm text-gray-900">{{ selectedUser.email }}</p>
                      </div>
                      <div v-if="selectedUser.phone">
                        <label class="text-sm font-medium text-gray-500">Phone</label>
                        <p class="text-sm text-gray-900">{{ selectedUser.phone }}</p>
                      </div>
                      <div v-if="selectedUser.dob">
                        <label class="text-sm font-medium text-gray-500">Date of Birth</label>
                        <p class="text-sm text-gray-900">{{ selectedUser.dob }}</p>
                      </div>
                      <div v-if="selectedUser.gender">
                        <label class="text-sm font-medium text-gray-500">Gender</label>
                        <p class="text-sm text-gray-900">{{ selectedUser.gender }}</p>
                      </div>
                      <div v-if="selectedUser.nationality">
                        <label class="text-sm font-medium text-gray-500">Nationality</label>
                        <p class="text-sm text-gray-900">{{ selectedUser.nationality }}</p>
                      </div>
                      <div v-if="selectedUser.country_of_origin">
                        <label class="text-sm font-medium text-gray-500">Country of Origin</label>
                        <p class="text-sm text-gray-900">{{ selectedUser.country_of_origin }}</p>
                      </div>
                      <div v-if="selectedUser.workforce_group">
                        <label class="text-sm font-medium text-gray-500">Cultural Group</label>
                        <p class="text-sm text-gray-900">{{ getWorkforceGroupDisplay(selectedUser.workforce_group) }}</p>
                      </div>
                      <div v-if="selectedUser.city">
                        <label class="text-sm font-medium text-gray-500">City</label>
                        <p class="text-sm text-gray-900">{{ selectedUser.city }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- Professional Information -->
                  <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="text-lg font-medium text-gray-900 mb-4">Professional Information</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="text-sm font-medium text-gray-500">Role</label>
                        <p class="text-sm text-gray-900">{{ selectedUser.role?.name || selectedUser.name }}</p>
                      </div>
                      <div v-if="selectedUser.job_title">
                        <label class="text-sm font-medium text-gray-500">Job Title</label>
                        <p class="text-sm text-gray-900">{{ selectedUser.job_title }}</p>
                      </div>
                      <div>
                        <label class="text-sm font-medium text-gray-500">Status</label>
                        <span
                          class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                          :class="{
                            'bg-green-100 text-green-800': selectedUser.status === 1,
                            'bg-red-100 text-red-800': selectedUser.status === 0,
                          }"
                        >
                          {{ selectedUser.status === 1 ? 'Active' : 'Inactive' }}
                        </span>
                      </div>
                      <div v-if="selectedUser.role?.category">
                        <label class="text-sm font-medium text-gray-500">Category</label>
                        <p class="text-sm text-gray-900">{{ selectedUser.role.category }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- Professional Data -->
                  <div v-if="selectedUser.professional_data && selectedUser.professional_data.length > 0" class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="text-lg font-medium text-gray-900 mb-4">Professional Details</h4>
                    <div v-for="(prof, index) in selectedUser.professional_data" :key="index" class="mb-6 p-4 bg-white rounded-lg border">
                      <h5 class="text-md font-medium text-gray-900 mb-4">Professional Record #{{ index + 1 }}</h5>

                      <!-- Education Section -->
                      <div v-if="prof.education_level || prof.field_of_study || prof.institution_name || prof.graduation_year" class="mb-6">
                        <h6 class="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-200 pb-1">Education</h6>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div v-if="prof.education_level">
                            <label class="font-medium text-gray-500">Education Level</label>
                            <p class="text-gray-900">{{ prof.education_level }}</p>
                          </div>
                          <div v-if="prof.field_of_study">
                            <label class="font-medium text-gray-500">Field of Study</label>
                            <p class="text-gray-900">{{ prof.field_of_study }}</p>
                          </div>
                          <div v-if="prof.institution_name">
                            <label class="font-medium text-gray-500">Institution</label>
                            <p class="text-gray-900">{{ prof.institution_name }}</p>
                          </div>
                          <div v-if="prof.graduation_year">
                            <label class="font-medium text-gray-500">Graduation Year</label>
                            <p class="text-gray-900">{{ prof.graduation_year }}</p>
                          </div>
                        </div>
                      </div>

                      <!-- Experience Section -->
                      <div v-if="prof.total_experience || prof.specialized_experience || prof.key_projects || prof.previous_employers || prof.references" class="mb-6">
                        <h6 class="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-200 pb-1">Experience & Employment</h6>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div v-if="prof.total_experience">
                            <label class="font-medium text-gray-500">Total Experience</label>
                            <p class="text-gray-900">{{ prof.total_experience }} years</p>
                          </div>
                          <div v-if="prof.specialized_experience">
                            <label class="font-medium text-gray-500">Specialized Experience</label>
                            <p class="text-gray-900">{{ prof.specialized_experience }}</p>
                          </div>
                          <div v-if="prof.key_projects" class="md:col-span-2">
                            <label class="font-medium text-gray-500">Key Projects</label>
                            <p class="text-gray-900">{{ prof.key_projects }}</p>
                          </div>
                          <div v-if="prof.previous_employers" class="md:col-span-2">
                            <label class="font-medium text-gray-500">Previous Employers</label>
                            <p class="text-gray-900">{{ prof.previous_employers }}</p>
                          </div>
                          <div v-if="prof.references" class="md:col-span-2">
                            <label class="font-medium text-gray-500">References</label>
                            <p class="text-gray-900">{{ prof.references }}</p>
                          </div>
                        </div>
                      </div>

                      <!-- Skills & Summary Section -->
                      <div v-if="prof.specialized_skills || prof.professional_summary" class="mb-6">
                        <h6 class="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-200 pb-1">Skills & Summary</h6>
                        <div class="grid grid-cols-1 gap-4 text-sm">
                          <div v-if="prof.specialized_skills">
                            <label class="font-medium text-gray-500">Specialized Skills</label>
                            <p class="text-gray-900">{{ prof.specialized_skills }}</p>
                          </div>
                          <div v-if="prof.professional_summary">
                            <label class="font-medium text-gray-500">Professional Summary</label>
                            <p class="text-gray-900">{{ prof.professional_summary }}</p>
                          </div>
                        </div>
                      </div>

                      <!-- Availability & Travel Section -->
                      <div v-if="prof.availability || prof.travel_willingness" class="mb-6">
                        <h6 class="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-200 pb-1">Availability & Travel</h6>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div v-if="prof.availability">
                            <label class="font-medium text-gray-500">Availability</label>
                            <p class="text-gray-900">{{ prof.availability }}</p>
                          </div>
                          <div v-if="prof.travel_willingness">
                            <label class="font-medium text-gray-500">Travel Willingness</label>
                            <p class="text-gray-900">{{ prof.travel_willingness }}</p>
                          </div>
                        </div>
                      </div>

                      <!-- Certifications & Licenses Section -->
                      <div v-if="prof.drivers_license || prof.red_seal || prof.provincial_certificate || prof.union_membership" class="mb-6">
                        <h6 class="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-200 pb-1">Certifications & Licenses</h6>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div v-if="prof.drivers_license">
                            <label class="font-medium text-gray-500">Driver's License</label>
                            <p class="text-gray-900">{{ prof.drivers_license }}</p>
                          </div>
                          <div v-if="prof.red_seal">
                            <label class="font-medium text-gray-500">Red Seal</label>
                            <p class="text-gray-900">{{ prof.red_seal }}</p>
                          </div>
                          <div v-if="prof.provincial_certificate">
                            <label class="font-medium text-gray-500">Provincial Certificate</label>
                            <p class="text-gray-900">{{ prof.provincial_certificate }}</p>
                          </div>
                          <div v-if="prof.union_membership">
                            <label class="font-medium text-gray-500">Union Membership</label>
                            <p class="text-gray-900">{{ prof.union_membership }}</p>
                          </div>
                        </div>
                      </div>

                      <!-- Equipment & Tools Section -->
                      <div v-if="prof.equipment_tools" class="mb-6">
                        <h6 class="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-200 pb-1">Equipment & Tools</h6>
                        <div class="text-sm">
                          <label class="font-medium text-gray-500">Equipment & Tools</label>
                          <p class="text-gray-900">{{ prof.equipment_tools }}</p>
                        </div>
                      </div>

                      <!-- Safety Certifications Section -->
                      <div v-if="prof.whmis || prof.first_aid || prof.fall_protection || prof.confined_space || prof.lockout_tagout || prof.other_safety" class="mb-6">
                        <h6 class="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-200 pb-1">Safety Certifications</h6>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div v-if="prof.whmis">
                            <label class="font-medium text-gray-500">WHMIS</label>
                            <p class="text-gray-900">{{ prof.whmis }}</p>
                          </div>
                          <div v-if="prof.first_aid">
                            <label class="font-medium text-gray-500">First Aid</label>
                            <p class="text-gray-900">{{ prof.first_aid }}</p>
                          </div>
                          <div v-if="prof.fall_protection">
                            <label class="font-medium text-gray-500">Fall Protection</label>
                            <p class="text-gray-900">{{ prof.fall_protection }}</p>
                          </div>
                          <div v-if="prof.confined_space">
                            <label class="font-medium text-gray-500">Confined Space</label>
                            <p class="text-gray-900">{{ prof.confined_space }}</p>
                          </div>
                          <div v-if="prof.lockout_tagout">
                            <label class="font-medium text-gray-500">Lockout/Tagout</label>
                            <p class="text-gray-900">{{ prof.lockout_tagout }}</p>
                          </div>
                          <div v-if="prof.other_safety">
                            <label class="font-medium text-gray-500">Other Safety Certifications</label>
                            <p class="text-gray-900">{{ prof.other_safety }}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Languages -->
                  <div v-if="selectedUser.languages && selectedUser.languages.length > 0" class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="text-lg font-medium text-gray-900 mb-4">Languages</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div v-for="lang in selectedUser.languages" :key="lang.id" class="flex justify-between items-center p-3 bg-white rounded border">
                        <span class="text-sm font-medium text-gray-900">{{ lang.name }}</span>
                        <span class="text-sm text-gray-600 bg-blue-100 px-2 py-1 rounded">{{ lang.prof_level }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Emergency Information -->
                  <div v-if="selectedUser.emergency" class="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h4 class="text-lg font-medium text-red-900 mb-4">Emergency Information</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div v-if="selectedUser.emergency.primary_contact_name">
                        <label class="font-medium text-red-700">Primary Contact</label>
                        <p class="text-red-900">{{ selectedUser.emergency.primary_contact_name }}</p>
                      </div>
                      <div v-if="selectedUser.emergency.primary_contact_phone">
                        <label class="font-medium text-red-700">Primary Phone</label>
                        <p class="text-red-900">{{ selectedUser.emergency.primary_contact_phone }}</p>
                      </div>
                      <div v-if="selectedUser.emergency.blood_type">
                        <label class="font-medium text-red-700">Blood Type</label>
                        <p class="text-red-900">{{ selectedUser.emergency.blood_type }}</p>
                      </div>
                      <div v-if="selectedUser.emergency.allergies">
                        <label class="font-medium text-red-700">Allergies</label>
                        <p class="text-red-900">{{ selectedUser.emergency.allergies }}</p>
                      </div>
                      <div v-if="selectedUser.emergency.medical_conditions">
                        <label class="font-medium text-red-700">Medical Conditions</label>
                        <p class="text-red-900">{{ selectedUser.emergency.medical_conditions }}</p>
                      </div>
                      <div v-if="selectedUser.emergency.medications">
                        <label class="font-medium text-red-700">Medications</label>
                        <p class="text-red-900">{{ selectedUser.emergency.medications }}</p>
                      </div>
                    </div>
                  </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>

</template>

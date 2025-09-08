<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { projectsApi, type ProjectTeamMember } from '@/utils/contacts-api'
import { workersApi, type Worker } from '@/utils/contacts-api'

// Props
interface Props {
  isOpen: boolean
  projectId: number
  existingTeamMembers: ProjectTeamMember[]
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  memberAdded: [member: ProjectTeamMember]
}>()

// State
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref('')
const selectedUsers = ref<Worker[]>([])
const selectedRole = ref('member')

// Available workers (excluding those already in team)
const availableWorkers = ref<Worker[]>([])
const filteredWorkers = computed(() => {
  if (!searchQuery.value.trim()) return availableWorkers.value

  const query = searchQuery.value.toLowerCase()
  return availableWorkers.value.filter(
    (worker) =>
      worker.first_name?.toLowerCase().includes(query) ||
      worker.last_name?.toLowerCase().includes(query) ||
      worker.email?.toLowerCase().includes(query) ||
      worker.user_type?.toLowerCase().includes(query),
  )
})

// Role options
const roleOptions = [
  { value: 'member', label: 'Team Member' },
  { value: 'lead', label: 'Team Lead' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'coordinator', label: 'Coordinator' },
]

// Load available workers
async function loadAvailableWorkers() {
  if (!props.projectId) return

  loading.value = true
  error.value = null

  try {
    console.log('👥 Loading available workers for project:', props.projectId)

    // Get all workers
    const response = await workersApi.getAll(1, 100)

    if ('workers' in response && Array.isArray(response.workers)) {
      // Filter out workers who are already in the team
      const existingUserIds = props.existingTeamMembers.map((member) => member.user_id)
      availableWorkers.value = response.workers.filter(
        (worker) =>
          !existingUserIds.includes(worker.id) &&
          worker.invitation_status === 'registered' &&
          worker.status === 1, // Only active workers
      )

      console.log('✅ Available workers loaded:', availableWorkers.value.length)
    } else {
      throw new Error('Invalid response format')
    }
  } catch (err: unknown) {
    console.error('❌ Error loading workers:', err)
    error.value = 'Failed to load available workers'
    availableWorkers.value = []
  } finally {
    loading.value = false
  }
}

// Add team members
async function addTeamMembers() {
  if (selectedUsers.value.length === 0 || !props.projectId) return

  saving.value = true
  error.value = null

  try {
    console.log('👥 Adding team members:', {
      projectId: props.projectId,
      users: selectedUsers.value.map((u) => ({ id: u.id, name: getUserDisplayName(u) })),
      role: selectedRole.value,
    })

    // Add all selected users
    const promises = selectedUsers.value.map((user) =>
      projectsApi.addTeamMember(props.projectId, user.id, selectedRole.value),
    )

    const newMembers = await Promise.all(promises)
    console.log('✅ Team members added successfully:', newMembers.length)

    // Emit success for each member and close dialog
    newMembers.forEach((member) => emit('memberAdded', member))
    closeDialog()
  } catch (err: unknown) {
    console.error('❌ Error adding team members:', err)
    error.value = err instanceof Error ? err.message : 'Failed to add team members'
  } finally {
    saving.value = false
  }
}

// Close dialog
function closeDialog() {
  // Reset form
  searchQuery.value = ''
  selectedUsers.value = []
  selectedRole.value = 'member'
  error.value = null

  emit('close')
}

// Watch for dialog open/close
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      loadAvailableWorkers()
    }
  },
)

// Watch for existing team members changes
watch(
  () => props.existingTeamMembers,
  () => {
    if (props.isOpen) {
      loadAvailableWorkers()
    }
  },
  { deep: true },
)

// Get user display name
function getUserDisplayName(worker: Worker): string {
  const name = [worker.first_name, worker.last_name].filter(Boolean).join(' ')
  return name || worker.email || 'Unknown User'
}

// Get user type display
function getUserTypeDisplay(worker: Worker): string {
  return worker.user_type || 'Unknown Type'
}

// Toggle user selection
function toggleUserSelection(worker: Worker) {
  const index = selectedUsers.value.findIndex((u) => u.id === worker.id)
  if (index > -1) {
    selectedUsers.value.splice(index, 1)
  } else {
    selectedUsers.value.push(worker)
  }
}

// Check if user is selected
function isUserSelected(worker: Worker): boolean {
  return selectedUsers.value.some((u) => u.id === worker.id)
}

// Select all filtered users
function selectAllFiltered() {
  const newSelections = filteredWorkers.value.filter(
    (worker) => !selectedUsers.value.some((u) => u.id === worker.id),
  )
  selectedUsers.value.push(...newSelections)
}

// Clear all selections
function clearAllSelections() {
  selectedUsers.value = []
}
</script>

<template>
  <!-- Dialog -->
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <div
      class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
    >
      <!-- Background overlay -->
      <div
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        @click="closeDialog"
      ></div>

      <!-- Dialog panel -->
      <div
        class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
      >
        <!-- Header -->
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div
              class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10"
            >
              <svg
                class="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 class="text-lg leading-6 font-medium text-gray-900">Add Team Member</h3>
              <div class="mt-2">
                <p class="text-sm text-gray-500">
                  Select one or more workers to add to this project team.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="bg-white px-4 pb-4 sm:p-6">
          <!-- Error message -->
          <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p class="text-sm text-red-600">{{ error }}</p>
          </div>

          <!-- Search -->
          <div class="mb-4">
            <label for="search" class="block text-sm font-medium text-gray-700 mb-2">
              Search Workers
            </label>
            <input
              id="search"
              v-model="searchQuery"
              type="text"
              placeholder="Search by name, email, or user type..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <!-- Role selection -->
          <div class="mb-4">
            <label for="role" class="block text-sm font-medium text-gray-700 mb-2"> Role </label>
            <select
              id="role"
              v-model="selectedRole"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option v-for="role in roleOptions" :key="role.value" :value="role.value">
                {{ role.label }}
              </option>
            </select>
          </div>

          <!-- Selected users summary -->
          <div
            v-if="selectedUsers.length > 0"
            class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-blue-900">
                  {{ selectedUsers.length }} worker{{ selectedUsers.length === 1 ? '' : 's' }}
                  selected
                </p>
                <p class="text-xs text-blue-700">
                  {{ selectedUsers.map((u) => getUserDisplayName(u)).join(', ') }}
                </p>
              </div>
              <button
                @click="clearAllSelections"
                class="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Clear all
              </button>
            </div>
          </div>

          <!-- Workers list -->
          <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-medium text-gray-700"> Available Workers </label>
              <div class="flex space-x-2">
                <button
                  v-if="filteredWorkers.length > 0"
                  @click="selectAllFiltered"
                  class="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Select all ({{ filteredWorkers.length }})
                </button>
                <button
                  v-if="selectedUsers.length > 0"
                  @click="clearAllSelections"
                  class="text-xs text-gray-600 hover:text-gray-800 underline"
                >
                  Clear all
                </button>
              </div>
            </div>

            <!-- Loading state -->
            <div v-if="loading" class="text-center py-4">
              <div class="inline-flex items-center">
                <svg
                  class="animate-spin h-5 w-5 text-blue-600 mr-2"
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
                <span class="text-sm text-gray-600">Loading workers...</span>
              </div>
            </div>

            <!-- Workers list -->
            <div
              v-else-if="filteredWorkers.length > 0"
              class="max-h-60 overflow-y-auto border border-gray-200 rounded-md"
            >
              <div
                v-for="worker in filteredWorkers"
                :key="worker.id"
                @click="toggleUserSelection(worker)"
                :class="[
                  'p-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50',
                  isUserSelected(worker) ? 'bg-blue-50 border-blue-200' : '',
                ]"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-gray-900">
                      {{ getUserDisplayName(worker) }}
                    </p>
                    <p class="text-sm text-gray-500">
                      {{ worker.email }}
                    </p>
                    <p class="text-xs text-gray-400">
                      {{ getUserTypeDisplay(worker) }}
                      <span v-if="worker.job_title"> • {{ worker.job_title }}</span>
                    </p>
                  </div>
                  <div class="flex-shrink-0">
                    <div
                      :class="[
                        'w-5 h-5 rounded border-2 flex items-center justify-center',
                        isUserSelected(worker)
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-300 hover:border-blue-400',
                      ]"
                    >
                      <svg
                        v-if="isUserSelected(worker)"
                        class="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- No workers found -->
            <div v-else class="text-center py-4 text-sm text-gray-500">
              <p v-if="searchQuery.trim()">No workers found matching "{{ searchQuery }}"</p>
              <p v-else>No available workers to add</p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            @click="addTeamMembers"
            :disabled="selectedUsers.length === 0 || saving"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              v-if="saving"
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
            {{
              saving
                ? 'Adding...'
                : `Add ${selectedUsers.length} Member${selectedUsers.length === 1 ? '' : 's'}`
            }}
          </button>
          <button
            @click="closeDialog"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

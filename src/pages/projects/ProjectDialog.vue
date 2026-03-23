<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4"
    @click="closeDialog"
  >
    <div
      class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      @click.stop
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 class="text-xl font-semibold text-gray-900">Create New Project</h2>
        <button @click="closeDialog" class="text-gray-400 hover:text-gray-600 transition-colors">
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

      <!-- Content -->
      <div class="p-6">
        <form @submit.prevent="handleSubmit">
          <!-- Project Name -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2"> Project Name <span class="text-red-500">*</span> </label>
            <input
              v-model="form.prj_name"
              type="text"
              :class="[
                'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                validationErrors.prj_name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
              ]"
              placeholder="Enter project name"
            />
            <p v-if="validationErrors.prj_name" class="mt-1 text-sm text-red-600">
              {{ validationErrors.prj_name }}
            </p>
          </div>

          <!-- Address -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2"> Address <span class="text-red-500">*</span> </label>
            <textarea
              v-model="form.address"
              rows="3"
              :class="[
                'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                validationErrors.address ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
              ]"
              placeholder="Enter project address"
            ></textarea>
            <p v-if="validationErrors.address" class="mt-1 text-sm text-red-600">
              {{ validationErrors.address }}
            </p>
          </div>

          <!-- Project dates are auto-calculated from tasks -->

          <!-- Client funnel (informational) -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2"> Client stage </label>
              <select
                v-model="form.status"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Initial Contact Lead">Initial Contact Lead</option>
                <option value="Dead Lead">Dead Lead</option>
                <option value="Waiting On Direction">Waiting On Direction</option>
                <option value="Actively Looking For A Location">Actively Looking For A Location</option>
                <option value="Securing Location">Securing Location</option>
                <option value="Project Secured">Project Secured</option>
                <option value="Construction">Construction</option>
                <option value="Completed Project">Completed Project</option>
              </select>
            <p class="mt-1 text-xs text-gray-500">For sales tracking only.</p>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2"> Lifecycle </label>
            <select
              v-model="form.sys_status"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option v-for="opt in projectSysStatusOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>

          <!-- Purchase or Lease -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2"> Purchase or Lease </label>
            <select
              v-model="form.purchase_or_lease"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Purchase">Purchase</option>
              <option value="Lease">Lease</option>
            </select>
          </div>

          <!-- Area -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2"> Area </label>
            <input
              v-model.number="form.area"
              type="number"
              min="0"
              step="1"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. square feet"
            />
          </div>

          <!-- Level -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2"> Level </label>
            <select
              v-model="form.level"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Select level —</option>
              <option value="Basics">Basics</option>
              <option value="Full Service">Full Service</option>
              <option value="Medical Nice">Medical Nice</option>
              <option value="High End">High End</option>
              <option value="Extravagant">Extravagant</option>
            </select>
          </div>

          <!-- Project Manager -->
          <div v-if="canAssignManager" class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Project Manager <span class="text-red-500">*</span>
            </label>
            <select
              v-model="form.prj_manager"
              :class="[
                'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                validationErrors.prj_manager ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
              ]"
            >
              <option value="">Select Project Manager</option>
              <option v-for="manager in availableManagers" :key="manager.id" :value="manager.id">
                {{ manager.name }} ({{ manager.email }})
              </option>
            </select>
            <p v-if="validationErrors.prj_manager" class="mt-1 text-sm text-red-600">
              {{ validationErrors.prj_manager }}
            </p>
          </div>

          <!-- Auto-assigned manager info for Project Managers -->
          <div v-else class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2"> Project Manager </label>
            <div
              class="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600"
            >
              {{ authStore.currentUser?.name }} ({{ authStore.currentUser?.email }}) - Auto-assigned
            </div>
            <!-- Manager ID is already set in form.prj_manager during initialization -->
          </div>

          <!-- Description -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2"> Description </label>
            <textarea
              v-model="form.description"
              rows="4"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter project description (optional)"
            ></textarea>
          </div>

          <!-- Notes -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2"> Notes </label>
            <textarea
              v-model="form.notes"
              rows="3"
              maxlength="1000"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter project notes (optional, max 1000 characters)"
            ></textarea>
            <p class="mt-1 text-xs text-gray-500">
              {{ form.notes.length }}/1000 characters
            </p>
          </div>

          <!-- Client -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2"> Client <span class="text-red-500">*</span> </label>
            <div class="flex items-center space-x-2">
              <input
                :value="clientDisplayName"
                type="text"
                readonly
                :class="[
                  'flex-1 px-3 py-2 border rounded-md bg-gray-50 text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500',
                  validationErrors.client ? 'border-red-500' : 'border-gray-300'
                ]"
                placeholder="Click to select client"
                @click="showClientSelector = true"
              />
              <button
                type="button"
                @click="showClientSelector = true"
                class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Select
              </button>
              <button
                v-if="form.client_id"
                type="button"
                @click="clearClient"
                class="px-4 py-2 border border-red-300 rounded-md text-red-700 hover:bg-red-50 transition-colors text-sm font-medium"
              >
                Clear
              </button>
            </div>
            <p v-if="validationErrors.client" class="mt-1 text-sm text-red-600">
              {{ validationErrors.client }}
            </p>
          </div>

          <!-- Secondary Client -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2"> Secondary Client <span class="text-gray-400 font-normal">(optional)</span> </label>
            <div class="flex items-center space-x-2">
              <input
                :value="client2DisplayName"
                type="text"
                readonly
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Click to select secondary client (optional)"
                @click="showClient2Selector = true"
              />
              <button
                type="button"
                @click="showClient2Selector = true"
                class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Select
              </button>
              <button
                v-if="form.client2_id"
                type="button"
                @click="clearClient2"
                class="px-4 py-2 border border-red-300 rounded-md text-red-700 hover:bg-red-50 transition-colors text-sm font-medium"
              >
                Clear
              </button>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end space-x-3">
            <button
              type="button"
              @click="closeDialog"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSubmitting || !isFormValid"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isSubmitting ? 'Creating...' : 'Create Project' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Client Selector Dialog -->
    <ClientSelectorDialog
      :is-open="showClientSelector"
      :selected-client-id="form.client_id"
      :selected-client-table="form.client_table"
      @close="showClientSelector = false"
      @select="handleClientSelect"
      @clear="handleClientClear"
    />
    <!-- Secondary Client Selector Dialog -->
    <ClientSelectorDialog
      :is-open="showClient2Selector"
      :selected-client-id="form.client2_id"
      :selected-client-table="form.client2_table"
      @close="showClient2Selector = false"
      @select="handleClient2Select"
      @clear="handleClient2Clear"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { projectApi, type Project, type ClientTableType } from '@/core/utils/project-api'
import { hrResourcesApi, type WorkerUser } from '@/core/utils/hr-api'
import { useAuthStore } from '@/core/stores/auth'
import ClientSelectorDialog from '@/components/ClientSelectorDialog.vue'
import { clientsApi, type Client } from '@/core/utils/clients-api'
import {
  DEFAULT_PROJECT_SYS_STATUS,
  PROJECT_SYS_STATUS_OPTIONS,
  type ProjectSysStatus,
} from '@/core/utils/project-sys-status'

const projectSysStatusOptions = PROJECT_SYS_STATUS_OPTIONS

// Props
interface Props {
  isOpen: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
})

// Emits
const emit = defineEmits<{
  close: []
  created: [project: Project]
}>()

// Auth store
const authStore = useAuthStore()

// Form data
const form = ref({
  prj_name: '',
  address: '',
  status: 'Initial Contact Lead',
  purchase_or_lease: 'Purchase',
  notes: '',
  client_id: null as number | null,
  client_type: null as string | null,
  client_table: null as ClientTableType | null,
  client_data: null as Record<string, unknown> | null,
  client2_id: null as number | null,
  client2_type: null as string | null,
  client2_table: null as ClientTableType | null,
  client2_data: null as Record<string, unknown> | null,
  prj_manager: '',
  description: '',
  area: null as number | null,
  level: null as string | null,
})

// Client selector state
const showClientSelector = ref(false)
const selectedClient = ref<Client | null>(null)
const showClient2Selector = ref(false)
const selectedClient2 = ref<Client | null>(null)

// State
const isSubmitting = ref(false)
const availableManagers = ref<Array<{ id: number; name: string; email: string }>>([])
const validationErrors = ref<Record<string, string>>({})

// Client display name
const clientDisplayName = computed(() => {
  // First try to use selectedClient if available
  if (selectedClient.value) {
    const clientType = clientsApi.getClientTypeLabel(form.value.client_table || null)
    return `${selectedClient.value.name} (${clientType})`
  }
  
  // Fallback: use data from client_data if available
  if (form.value.client_id && form.value.client_type) {
    const clientName = form.value.client_data && typeof form.value.client_data === 'object' && form.value.client_data.name
      ? form.value.client_data.name
      : `Client ID: ${form.value.client_id}`
    return `${clientName} (${form.value.client_type})`
  }
  
  return ''
})

// Secondary client display name
const client2DisplayName = computed(() => {
  if (selectedClient2.value) {
    const clientType = clientsApi.getClientTypeLabel(form.value.client2_table || null)
    return `${selectedClient2.value.name} (${clientType})`
  }
  if (form.value.client2_id && form.value.client2_type) {
    const clientName = form.value.client2_data && typeof form.value.client2_data === 'object' && form.value.client2_data.name
      ? form.value.client2_data.name
      : `Client ID: ${form.value.client2_id}`
    return `${clientName} (${form.value.client2_type})`
  }
  return ''
})

// Access control
const canAssignManager = computed(() => {
  if (!authStore.currentUser) {
    console.log('🔍 canAssignManager: no current user')
    return false
  }

  // Check if user is admin based on job_title
  const isAdmin = authStore.currentUser.job_title === 'System Administrator'
  // Admin check complete

  // Only administrators can assign managers
  return isAdmin
})

const isProjectManager = computed(() => {
  if (!authStore.currentUser) {
    console.log('🔍 isProjectManager: no current user')
    return false
  }

  // Check if user is project manager based on job_title (including variations)
  const jobTitle = authStore.currentUser.job_title?.toLowerCase() || ''
  const isPM = jobTitle.includes('project manager')
  console.log('🔍 isProjectManager check:', {
    job_title: authStore.currentUser.job_title,
    jobTitle_lower: jobTitle,
    isPM: isPM,
    currentUser: authStore.currentUser,
  })

  return isPM
})

// Form validation
function validateForm() {
  const errors: Record<string, string> = {}

  // Basic required fields
  if (!form.value.prj_name?.trim()) {
    errors.prj_name = 'Project name is required'
  }

  if (!form.value.address?.trim()) {
    errors.address = 'Address is required'
  }

  // Admin must select a project manager
  if (canAssignManager.value && !form.value.prj_manager) {
    errors.prj_manager = 'Project Manager is required for administrators'
  }

  // Client is required
  if (!form.value.client_id) {
    errors.client = 'Client is required'
  }

  validationErrors.value = errors
  return Object.keys(errors).length === 0
}

const isFormValid = computed(() => {
  return validateForm()
})

// Initialize form when dialog opens
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      // Reset form
      // Form initialization complete

      // Debug current user info
      console.log('🔍 Form initialization - current user:', {
        id: authStore.currentUser?.id,
        job_title: authStore.currentUser?.job_title,
        isProjectManager: isProjectManager.value,
        canAssignManager: canAssignManager.value,
      })

      // Determine if user should be auto-assigned as manager
      const shouldAutoAssign =
        isProjectManager.value || (authStore.currentUser?.id && !canAssignManager.value) // If not admin, auto-assign current user

      console.log('🔍 Auto-assignment logic:', {
        isProjectManager: isProjectManager.value,
        canAssignManager: canAssignManager.value,
        shouldAutoAssign: shouldAutoAssign,
        currentUserId: authStore.currentUser?.id,
      })

      form.value = {
        prj_name: '',
        address: '',
        status: 'Initial Contact Lead',
        sys_status: DEFAULT_PROJECT_SYS_STATUS,
        purchase_or_lease: 'Purchase',
        notes: '',
        client_id: null,
        client_type: null,
        client_table: null,
        client_data: null,
        client2_id: null,
        client2_type: null,
        client2_table: null,
        client2_data: null,
        prj_manager: shouldAutoAssign ? String(authStore.currentUser?.id || '') : '',
        description: '',
        area: null,
        level: null,
      }
      selectedClient.value = null
      selectedClient2.value = null

      console.log('🔍 Form initialized with prj_manager:', form.value.prj_manager)

      // Clear any validation errors
      validationErrors.value = {}

      // Form initialized
    }
  },
)

// Load available managers
async function loadManagers() {
  try {
    console.log('🔍 Loading managers, canAssignManager:', canAssignManager.value)

    if (canAssignManager.value) {
      // Only load managers if user can assign them (administrators)
      try {
        console.log('🔍 Loading project managers from API...')

        // Use hrResourcesApi to get all workers with role_id filter for project managers
        const response = await hrResourcesApi.getAllWorkerUsers(1, 100, {
          role_id: 10, // Project Manager role
        })

        console.log('✅ Managers loaded from API:', response.workers)

        // Build managers list from workers
        availableManagers.value = response.workers.map((worker: WorkerUser) => ({
          id: worker.id,
          name: `${worker.first_name} ${worker.last_name}`.trim() || worker.email,
          email: worker.email,
        }))

        console.log('📋 Available managers:', availableManagers.value)

        // If no managers found, show fallback
        if (availableManagers.value.length === 0) {
          console.warn('⚠️ No project managers found in API response')
          if (authStore.currentUser) {
            availableManagers.value = [
              {
                id: authStore.currentUser.id,
                name: authStore.currentUser.name,
                email: authStore.currentUser.email,
              },
            ]
          }
        }
      } catch (apiError) {
        console.warn('⚠️ Failed to load managers from API, using fallback:', apiError)
        // Fallback: use current user as the only option
        if (authStore.currentUser) {
          availableManagers.value = [
            {
              id: authStore.currentUser.id,
              name: authStore.currentUser.name,
              email: authStore.currentUser.email,
            },
          ]
        }
      }
    } else {
      // Project managers don't need to load other managers
      console.log('🔍 User is project manager, no need to load other managers')
      availableManagers.value = []
    }
  } catch (error) {
    console.error('❌ Error loading managers:', error)
    availableManagers.value = []
  }
}

// Methods
function closeDialog() {
  emit('close')
}

function handleClientSelect(client: Client, clientTable: ClientTableType, clientType: string) {
  console.log('🔵 Client selected:', { client, clientTable, clientType })
  
  if (!client || !client.id) {
    console.error('❌ Invalid client data received:', client)
    return
  }
  
  form.value.client_id = client.id
  form.value.client_table = clientTable
  form.value.client_type = clientType
  
  // Store client data as JSON in client_data field
  // Structure: { id, name, data: {...} }
  // If data is not provided, create empty object or use client object without id and name
  if (client.data && typeof client.data === 'object') {
    form.value.client_data = client.data
  } else {
    // Fallback: create data object from client fields (excluding id and name)
    const { id, name, data, ...rest } = client
    form.value.client_data = Object.keys(rest).length > 0 ? rest : {}
    console.warn('⚠️ client.data is missing, using fallback:', form.value.client_data)
  }
  
  console.log('📝 Form updated with client data:', {
    client_id: form.value.client_id,
    client_table: form.value.client_table,
    client_type: form.value.client_type,
    client_data: form.value.client_data,
  })
  
  selectedClient.value = client
  showClientSelector.value = false
}

function clearClient() {
  form.value.client_id = null
  form.value.client_table = null
  form.value.client_type = null
  form.value.client_data = null
  selectedClient.value = null
}

function handleClientClear() {
  clearClient()
}

function handleClient2Select(client: Client, clientTable: ClientTableType, clientType: string) {
  if (!client?.id) return
  form.value.client2_id = client.id
  form.value.client2_table = clientTable
  form.value.client2_type = clientType
  form.value.client2_data =
    client.data && typeof client.data === 'object'
      ? client.data
      : (() => {
          const { id, name, data, ...rest } = client
          return Object.keys(rest).length > 0 ? rest : {}
        })()
  selectedClient2.value = client
  showClient2Selector.value = false
}

function clearClient2() {
  form.value.client2_id = null
  form.value.client2_type = null
  form.value.client2_table = null
  form.value.client2_data = null
  selectedClient2.value = null
}

function handleClient2Clear() {
  clearClient2()
}

async function handleSubmit() {
  if (isSubmitting.value) return

  // Validate form
  if (!validateForm()) {
    console.warn('⚠️ Validation failed:', validationErrors.value)
    return
  }

  isSubmitting.value = true
  try {
    console.log('🚀 Creating project with data:', form.value)
    console.log('🔍 Current user info during submit:', {
      id: authStore.currentUser?.id,
      job_title: authStore.currentUser?.job_title,
      isProjectManager: isProjectManager.value,
    })

    // Prepare API data - project dates are auto-calculated from tasks
    const apiData = {
      prj_name: form.value.prj_name,
      address: form.value.address,
      date_start: null,
      date_end: null,
      priority: 'Medium',
      status: form.value.status,
      sys_status: form.value.sys_status,
      purchase_or_lease: form.value.purchase_or_lease,
      notes: form.value.notes || null,
      client_id: form.value.client_id || null,
      client_type: form.value.client_type || null,
      client_table: form.value.client_table || null,
      client_data: form.value.client_data || null,
      client2_id: form.value.client2_id || null,
      client2_type: form.value.client2_type || null,
      client2_table: form.value.client2_table || null,
      client2_data: form.value.client2_data || null,
      prj_manager: form.value.prj_manager ? Number(form.value.prj_manager) : null,
      created_by: authStore.currentUser?.id || null,
      description: form.value.description || null,
      area: form.value.area ?? null,
      level: form.value.level || null,
    }

    console.log('📤 API payload:', apiData)
    console.log('🔍 Client fields in payload:', {
      client_id: apiData.client_id,
      client_type: apiData.client_type,
      client_table: apiData.client_table,
      client_data: apiData.client_data,
      client_data_type: typeof apiData.client_data,
    })
    console.log('🔍 prj_manager value:', {
      original: form.value.prj_manager,
      converted: apiData.prj_manager,
      type: typeof apiData.prj_manager,
    })
    console.log('🔍 created_by value:', {
      currentUserId: authStore.currentUser?.id,
      created_by: apiData.created_by,
      type: typeof apiData.created_by,
    })

    // Create project via API
    const response = await projectApi.create(apiData)
    console.log('✅ Project created successfully:', response)
    console.log('🔍 Created project details:', {
      id: response.data.project.id,
      name: response.data.project.prj_name,
      created_by: response.data.project.created_by,
      created_by_name: response.data.project.created_by_name,
    })

    // Emit success event
    emit('created', response.data.project)
    closeDialog()
  } catch (error) {
    console.error('❌ Error creating project:', error)
    alert('Failed to create project. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadManagers()
})

defineOptions({
  name: 'ProjectDialog',
})
</script>

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
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- 1. Project Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Project Name <span class="text-red-500">*</span>
            </label>
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

          <!-- 2. Address -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Address <span class="text-red-500">*</span>
            </label>
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

          <!-- 2b. Locations of interest -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Locations of interest <span class="text-gray-400 font-normal">(optional)</span>
            </label>
            <div class="flex flex-wrap items-center gap-2 mb-2">
              <span
                v-for="code in form.locations_of_interest"
                :key="code"
                class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-800"
              >
                {{ formatFsaLabel(code) }}
                <button
                  type="button"
                  class="ml-1 text-gray-500 hover:text-red-600"
                  @click="removeLocationOfInterest(code)"
                >
                  ×
                </button>
              </span>
              <button
                type="button"
                @click="showLocationsSelector = true"
                class="px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                + Add
              </button>
            </div>
            <p class="text-xs text-gray-500">Canadian postal code prefixes (FSA).</p>
          </div>

          <!-- 3. Primary Client -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Primary Client <span class="text-red-500">*</span>
            </label>
            <div class="flex items-center space-x-2">
              <input
                :value="clientDisplayName"
                type="text"
                readonly
                :class="[
                  'flex-1 px-3 py-2 border rounded-md bg-gray-50 text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500',
                  validationErrors.client ? 'border-red-500' : 'border-gray-300'
                ]"
                placeholder="Click to select primary client"
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

          <!-- 4. Additional Clients -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Additional Clients <span class="text-gray-400 font-normal">(optional)</span>
            </label>
            <div class="flex flex-wrap items-center gap-2 mb-2">
              <span
                v-for="(item, idx) in form.additional_clients"
                :key="`${item.client_table}:${item.client_id}`"
                class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-800"
              >
                {{ item.client_name || `Client #${item.client_id}` }}
                <span v-if="item.client_type" class="text-gray-500">({{ item.client_type }})</span>
                <button
                  type="button"
                  class="ml-1 text-gray-500 hover:text-red-600"
                  @click="removeAdditionalClient(idx)"
                >
                  ×
                </button>
              </span>
              <button
                type="button"
                @click="showAdditionalClientsSelector = true"
                class="px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                + Add
              </button>
            </div>
            <p class="text-xs text-gray-500">Related parties for this project. Primary client is used for reporting.</p>
          </div>

          <!-- 5. Client stage -->
          <div>
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

          <!-- 6. Lifecycle -->
          <div>
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

          <!-- 7. Purchase or Lease -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Purchase or Lease </label>
            <select
              v-model="form.purchase_or_lease"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Purchase">Purchase</option>
              <option value="Lease">Lease</option>
              <option value="Undecided">Undecided</option>
            </select>
          </div>

          <!-- 8. Area -->
          <div>
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

          <!-- 9. Level -->
          <div>
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

          <!-- 10. Clinic Model Type -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Clinic Model Type </label>
            <select
              v-model="form.clinic_model_type"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Select clinic model type —</option>
              <option
                v-for="clinicModelType in projectClinicModelTypes"
                :key="clinicModelType"
                :value="clinicModelType"
              >
                {{ clinicModelType }}
              </option>
            </select>
          </div>

          <!-- 11. Healthcare Services -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Healthcare Services </label>
            <select
              v-model="form.healthcare_services"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Select healthcare services —</option>
              <option
                v-for="healthcareService in projectHealthcareServices"
                :key="healthcareService"
                :value="healthcareService"
              >
                {{ healthcareService }}
              </option>
            </select>
          </div>

          <!-- 12. Long Term Family Medicine Team Size -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Long Term Family Medicine Team Size
            </label>
            <select
              v-model="form.long_term_fm_team_size"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Select team size —</option>
              <option
                v-for="teamSize in projectLongTermFmTeamSizes"
                :key="teamSize"
                :value="teamSize"
              >
                {{ teamSize }}
              </option>
            </select>
          </div>

          <!-- 13. Monthly Budget in First Year -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Monthly Budget in First Year
              <span class="text-gray-400 font-normal">($)</span>
            </label>
            <input
              v-model="form.monthly_budget_first_year"
              type="text"
              maxlength="100"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 15000"
            />
          </div>

          <!-- 14. My Account (project manager) -->
          <div v-if="canAssignManager">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              My Account <span class="text-red-500">*</span>
            </label>
            <select
              v-model="form.prj_manager"
              :class="[
                'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                validationErrors.prj_manager ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
              ]"
            >
              <option value="">Select user</option>
              <option v-for="manager in availableManagers" :key="manager.id" :value="manager.id">
                {{ manager.name }} ({{ manager.email }})
              </option>
            </select>
            <p v-if="validationErrors.prj_manager" class="mt-1 text-sm text-red-600">
              {{ validationErrors.prj_manager }}
            </p>
          </div>
          <div v-else>
            <label class="block text-sm font-medium text-gray-700 mb-2"> My Account </label>
            <div class="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600">
              {{ authStore.currentUser?.name }} ({{ authStore.currentUser?.email }}) - Auto-assigned
            </div>
          </div>

          <!-- 15. Project foreman -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Project foreman / brigadier <span class="text-red-500">*</span>
            </label>
            <select
              v-model="form.project_foreman_id"
              :class="[
                'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                validationErrors.project_foreman_id ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
              ]"
            >
              <option value="">Select foreman</option>
              <option v-for="foreman in availableForemen" :key="foreman.id" :value="String(foreman.id)">
                {{ foreman.name }} ({{ foreman.email }})
              </option>
            </select>
            <p v-if="validationErrors.project_foreman_id" class="mt-1 text-sm text-red-600">
              {{ validationErrors.project_foreman_id }}
            </p>
            <p class="mt-1 text-xs text-gray-500">
              Default foreman for all tasks in this project (can be overridden per task).
            </p>
          </div>

          <!-- 16. Description -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Description </label>
            <textarea
              v-model="form.description"
              rows="4"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter project description (optional)"
            ></textarea>
          </div>

          <!-- 17. Notes -->
          <div>
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

          <!-- Actions -->
          <div class="flex items-center justify-end space-x-3 pt-2">
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

    <PostalFsaSelectorDialog
      :is-open="showLocationsSelector"
      :selected-codes="form.locations_of_interest"
      @close="showLocationsSelector = false"
      @apply="handleLocationsApply"
    />
    <!-- Primary Client Selector -->
    <ClientSelectorDialog
      :is-open="showClientSelector"
      :selected-client-id="form.client_id"
      :selected-client-table="form.client_table"
      @close="showClientSelector = false"
      @select="handleClientSelect"
      @clear="handleClientClear"
    />
    <!-- Additional Clients Selector -->
    <ClientSelectorDialog
      :is-open="showAdditionalClientsSelector"
      multiple
      :selected-clients="form.additional_clients"
      :exclude-client-id="form.client_id"
      :exclude-client-table="form.client_table"
      @close="showAdditionalClientsSelector = false"
      @select-many="handleAdditionalClientsSelect"
      @clear="clearAdditionalClients"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  projectApi,
  type Project,
  type ClientTableType,
  type AdditionalProjectClient,
} from '@/core/utils/project-api'
import { hrResourcesApi, type WorkerUser } from '@/core/utils/hr-api'
import { useAuthStore } from '@/core/stores/auth'
import ClientSelectorDialog, {
  type ClientSelectionItem,
} from '@/components/ClientSelectorDialog.vue'
import PostalFsaSelectorDialog from '@/components/PostalFsaSelectorDialog.vue'
import { clientsApi, type Client } from '@/core/utils/clients-api'
import { formatFsaLabel } from '@/core/utils/postal-fsa-locations'
import {
  DEFAULT_PROJECT_SYS_STATUS,
  PROJECT_SYS_STATUS_OPTIONS,
  type ProjectSysStatus,
} from '@/core/utils/project-sys-status'
import {
  PROJECT_CLINIC_MODEL_TYPES,
  PROJECT_HEALTHCARE_SERVICES,
  PROJECT_LONG_TERM_FM_TEAM_SIZES,
} from '@/core/utils/constants'
import { FOREMAN_ROLE_DB_ID } from '@/config/roles'

const projectSysStatusOptions = PROJECT_SYS_STATUS_OPTIONS
const projectClinicModelTypes = PROJECT_CLINIC_MODEL_TYPES
const projectHealthcareServices = PROJECT_HEALTHCARE_SERVICES
const projectLongTermFmTeamSizes = PROJECT_LONG_TERM_FM_TEAM_SIZES

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
  sys_status: DEFAULT_PROJECT_SYS_STATUS satisfies ProjectSysStatus,
  purchase_or_lease: 'Purchase',
  notes: '',
  client_id: null as number | null,
  client_type: null as string | null,
  client_table: null as ClientTableType | null,
  client_data: null as Record<string, unknown> | null,
  additional_clients: [] as AdditionalProjectClient[],
  locations_of_interest: [] as string[],
  prj_manager: '',
  project_foreman_id: '',
  description: '',
  area: null as number | null,
  level: null as string | null,
  clinic_model_type: null as string | null,
  healthcare_services: null as string | null,
  long_term_fm_team_size: null as string | null,
  monthly_budget_first_year: null as string | null,
})

// Client selector state
const showClientSelector = ref(false)
const selectedClient = ref<Client | null>(null)
const showAdditionalClientsSelector = ref(false)
const showLocationsSelector = ref(false)

// State
const isSubmitting = ref(false)
const availableManagers = ref<Array<{ id: number; name: string; email: string }>>([])
const availableForemen = ref<Array<{ id: number; name: string; email: string }>>([])
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
    errors.prj_manager = 'My Account is required for administrators'
  }

  // Primary client is required
  if (!form.value.client_id) {
    errors.client = 'Primary client is required'
  }

  if (!form.value.project_foreman_id) {
    errors.project_foreman_id = 'Project foreman is required'
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
        additional_clients: [],
        locations_of_interest: [],
        prj_manager: shouldAutoAssign ? String(authStore.currentUser?.id || '') : '',
        project_foreman_id: '',
        description: '',
        area: null,
        level: null,
        clinic_model_type: null,
        healthcare_services: null,
        long_term_fm_team_size: null,
        monthly_budget_first_year: null,
      }
      selectedClient.value = null

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
  // Primary cannot also be additional
  form.value.additional_clients = form.value.additional_clients.filter(
    (c) => !(c.client_id === client.id && c.client_table === clientTable),
  )
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

function handleAdditionalClientsSelect(items: ClientSelectionItem[]) {
  form.value.additional_clients = items
    .filter(
      (item) =>
        !(
          form.value.client_id != null &&
          form.value.client_table != null &&
          item.client.id === form.value.client_id &&
          item.clientTable === form.value.client_table
        ),
    )
    .map((item, index) => ({
      client_id: item.client.id,
      client_table: item.clientTable,
      client_type: item.clientType,
      client_name: item.client.name,
      client_data:
        item.client.data && typeof item.client.data === 'object' ? item.client.data : {},
      sort_order: index + 1,
    }))
  showAdditionalClientsSelector.value = false
}

function removeAdditionalClient(index: number) {
  form.value.additional_clients = form.value.additional_clients.filter((_, i) => i !== index)
}

function clearAdditionalClients() {
  form.value.additional_clients = []
}

function handleLocationsApply(codes: string[]) {
  form.value.locations_of_interest = [...codes]
  showLocationsSelector.value = false
}

function removeLocationOfInterest(code: string) {
  form.value.locations_of_interest = form.value.locations_of_interest.filter((c) => c !== code)
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

    const firstAdditional = form.value.additional_clients[0] ?? null

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
      additional_clients: form.value.additional_clients,
      locations_of_interest: form.value.locations_of_interest,
      client2_id: firstAdditional?.client_id ?? null,
      client2_type: firstAdditional?.client_type ?? null,
      client2_table: firstAdditional?.client_table ?? null,
      client2_data: firstAdditional?.client_data ?? null,
      prj_manager: form.value.prj_manager ? Number(form.value.prj_manager) : null,
      project_foreman_id: form.value.project_foreman_id ? Number(form.value.project_foreman_id) : null,
      created_by: authStore.currentUser?.id || null,
      description: form.value.description || null,
      area: form.value.area ?? null,
      level: form.value.level || null,
      clinic_model_type: form.value.clinic_model_type || null,
      healthcare_services: form.value.healthcare_services || null,
      long_term_fm_team_size: form.value.long_term_fm_team_size || null,
      monthly_budget_first_year: form.value.monthly_budget_first_year?.trim() || null,
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

async function loadForemen() {
  try {
    const response = await hrResourcesApi.getAllWorkerUsers(1, 100, {
      role_id: FOREMAN_ROLE_DB_ID,
    })
    availableForemen.value = response.workers.map((worker: WorkerUser) => ({
      id: worker.id,
      name: `${worker.first_name} ${worker.last_name}`.trim() || worker.email,
      email: worker.email,
    }))
  } catch (error) {
    console.error('Failed to load foremen:', error)
    availableForemen.value = []
  }
}

// Lifecycle
onMounted(() => {
  loadManagers()
  loadForemen()
})

defineOptions({
  name: 'ProjectDialog',
})
</script>

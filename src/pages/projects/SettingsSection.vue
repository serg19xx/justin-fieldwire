<template>
  <div class="settings-section flex-1 flex flex-col">
    <!-- Settings Form -->
    <div class="bg-white rounded-lg shadow p-6">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Project Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2"> Project Name * </label>
          <input
            v-model="settingsForm.name"
            type="text"
            :disabled="!canEdit"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="Enter project name"
            required
          />
        </div>

        <!-- Project Address -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2"> Project Address * </label>
          <textarea
            v-model="settingsForm.address"
            :disabled="!canEdit"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="Enter project address"
            required
          ></textarea>
        </div>

        <!-- Project Description -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2"> Description </label>
          <textarea
            v-model="settingsForm.description"
            :disabled="!canEdit"
            rows="4"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 text-gray-900"
            placeholder="Enter project description (optional)"
          ></textarea>
        </div>

        <!-- Project Notes -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2"> Notes </label>
          <textarea
            v-model="settingsForm.notes"
            :disabled="!canEdit"
            rows="3"
            maxlength="1000"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 text-gray-900"
            placeholder="Enter project notes (optional, max 1000 characters)"
          ></textarea>
          <p v-if="canEdit" class="mt-1 text-xs text-gray-500">
            {{ settingsForm.notes.length }}/1000 characters
          </p>
        </div>

        <!-- Client -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2"> Client <span class="text-red-500">*</span> </label>
          <div class="flex items-center space-x-2">
            <input
              :value="clientDisplayName"
              type="text"
              readonly
              :disabled="!canEdit"
              class="flex-1 px-3 py-2 border rounded-md bg-gray-50 text-gray-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              :class="[
                canEdit ? 'cursor-pointer' : '',
                clientValidationError ? 'border-red-500' : 'border-gray-300'
              ]"
              placeholder="Click to select client"
              @click="canEdit && (showClientSelector = true)"
            />
            <button
              v-if="canEdit"
              type="button"
              @click="showClientSelector = true"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Select
            </button>
            <button
              v-if="canEdit && settingsForm.client_id"
              type="button"
              @click="clearClient"
              class="px-4 py-2 border border-red-300 rounded-md text-red-700 hover:bg-red-50 transition-colors text-sm font-medium"
            >
              Clear
            </button>
          </div>
          <p v-if="clientValidationError" class="mt-1 text-sm text-red-600">
            {{ clientValidationError }}
          </p>
        </div>

        <!-- Secondary Client -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2"> Secondary Client <span class="text-gray-400 font-normal">(optional)</span> </label>
          <div class="flex items-center space-x-2">
            <input
              :value="client2DisplayName"
              type="text"
              readonly
              :disabled="!canEdit"
              class="flex-1 px-3 py-2 border rounded-md bg-gray-50 text-gray-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
              :class="canEdit ? 'cursor-pointer' : ''"
              placeholder="Click to select secondary client (optional)"
              @click="canEdit && (showClient2Selector = true)"
            />
            <button
              v-if="canEdit"
              type="button"
              @click="showClient2Selector = true"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Select
            </button>
            <button
              v-if="canEdit && settingsForm.client2_id"
              type="button"
              @click="clearClient2"
              class="px-4 py-2 border border-red-300 rounded-md text-red-700 hover:bg-red-50 transition-colors text-sm font-medium"
            >
              Clear
            </button>
          </div>
        </div>

        <!-- Project Status -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2"> Project Status </label>
            <select
              v-model="settingsForm.status"
              :disabled="!canEdit"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
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
        </div>

        <!-- Purchase or Lease -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2"> Purchase or Lease </label>
          <select
            v-model="settingsForm.purchase_or_lease"
            :disabled="!canEdit"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          >
            <option value="Purchase">Purchase</option>
            <option value="Lease">Lease</option>
          </select>
        </div>

        <!-- Project dates are auto-calculated from tasks -->

        <!-- Action Buttons -->
        <div
          v-if="canEdit"
          class="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200"
        >
          <button
            type="submit"
            :disabled="isSaving"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {{ isSaving ? 'Saving...' : 'Save' }}
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

    <!-- Client Selector Dialog -->
    <ClientSelectorDialog
      :is-open="showClientSelector"
      :selected-client-id="settingsForm.client_id"
      :selected-client-table="settingsForm.client_table"
      @close="showClientSelector = false"
      @select="handleClientSelect"
      @clear="handleClientClear"
    />
    <!-- Secondary Client Selector Dialog -->
    <ClientSelectorDialog
      :is-open="showClient2Selector"
      :selected-client-id="settingsForm.client2_id"
      :selected-client-table="settingsForm.client2_table"
      @close="showClient2Selector = false"
      @select="handleClient2Select"
      @clear="handleClient2Clear"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, computed } from 'vue'
import ClientSelectorDialog from '@/components/ClientSelectorDialog.vue'
import { clientsApi, type Client } from '@/core/utils/clients-api'
import type { ClientTableType } from '@/core/utils/project-api'

defineOptions({
  name: 'SettingsSection',
})

// Props
interface ProjectData {
  name: string
  address: string
  description?: string
  startDate?: string | null
  endDate?: string | null
  status: string
  purchase_or_lease?: string
  notes?: string | null
  client_id?: number | null
  client_type?: string | null
  client_table?: string | null
  client_data?: Record<string, unknown> | null
  client_name?: string | null
  client2_id?: number | null
  client2_type?: string | null
  client2_table?: string | null
  client2_data?: Record<string, unknown> | null
  client2_name?: string | null
}

interface Props {
  canEdit?: boolean
  project?: ProjectData | { value: ProjectData }
}

const props = withDefaults(defineProps<Props>(), {
  canEdit: false,
})

// Emits
const emit = defineEmits<{
  saveSettings: []
  resetSettings: []
}>()

// State
const isSaving = ref(false)
const showClientSelector = ref(false)
const selectedClient = ref<Client | null>(null)
const showClient2Selector = ref(false)
const selectedClient2 = ref<Client | null>(null)
const clientValidationError = ref('')

// Settings form
const settingsForm = reactive({
  name: '',
  address: '',
  description: '',
  status: 'draft',
  purchase_or_lease: 'Purchase',
  notes: '',
  client_id: null as number | null,
  client_type: null as string | null,
  client_table: null as ClientTableType | null,
  client_data: null as Record<string, unknown> | null,
  client_name: null as string | null,
  client2_id: null as number | null,
  client2_type: null as string | null,
  client2_table: null as ClientTableType | null,
  client2_data: null as Record<string, unknown> | null,
  client2_name: null as string | null,
})

// Client display name
const clientDisplayName = computed(() => {
  // First try to use selectedClient if available
  if (selectedClient.value) {
    const clientType = clientsApi.getClientTypeLabel(settingsForm.client_table || null)
    return `${selectedClient.value.name} (${clientType})`
  }
  
  // Use client_name from server if available (primary)
  if (settingsForm.client_name) {
    return settingsForm.client_name
  }
  
  // Fallback: use data from client_data if available
  if (settingsForm.client_id && settingsForm.client_type) {
    const clientName = settingsForm.client_data && typeof settingsForm.client_data === 'object' && settingsForm.client_data.name
      ? settingsForm.client_data.name
      : `Client ID: ${settingsForm.client_id}`
    return `${clientName} (${settingsForm.client_type})`
  }
  
  return ''
})

// Secondary client display name
const client2DisplayName = computed(() => {
  if (settingsForm.client2_name) return settingsForm.client2_name
  if (settingsForm.client2_id && settingsForm.client2_type) {
    const name =
      settingsForm.client2_data && typeof settingsForm.client2_data === 'object' && settingsForm.client2_data.name
        ? settingsForm.client2_data.name
        : `Client ID: ${settingsForm.client2_id}`
    return `${name} (${settingsForm.client2_type})`
  }
  return ''
})

// Initialize form with project data
function initializeForm() {
  if (props.project) {
    // Handle both ref and direct value
    const project =
      (props.project as { value: ProjectData })?.value || (props.project as ProjectData)

    settingsForm.name = String(project.name || '')
    settingsForm.address = String(project.address || '')
    settingsForm.description = String(project.description || '')
    settingsForm.status = String(project.status || 'draft')
    settingsForm.purchase_or_lease = String(project.purchase_or_lease || 'Purchase')
    settingsForm.notes = String(project.notes || '')
    settingsForm.client_id = project.client_id || null
    settingsForm.client_type = project.client_type || null
    settingsForm.client_table = project.client_table || null
    settingsForm.client_data = project.client_data || null
    settingsForm.client_name = (project as any).client_name || null
    settingsForm.client2_id = project.client2_id ?? null
    settingsForm.client2_type = project.client2_type ?? null
    settingsForm.client2_table = project.client2_table ?? null
    settingsForm.client2_data = project.client2_data ?? null
    settingsForm.client2_name = (project as any).client2_name ?? null
    clientValidationError.value = ''

    const validClientTables: ClientTableType[] = ['pharma', 'physician', 'pharmacist', 'medical_clinic']
    if (project.client_id && project.client_table && validClientTables.includes(project.client_table as ClientTableType)) {
      loadClientData(project.client_table as ClientTableType, project.client_id)
    } else {
      selectedClient.value = null
    }
    if (project.client2_id && project.client2_table && validClientTables.includes(project.client2_table as ClientTableType)) {
      loadClient2Data(project.client2_table as ClientTableType, project.client2_id)
    } else {
      selectedClient2.value = null
    }
  }
}

// Update form when project data changes
watch(
  () => props.project,
  (newProject) => {
    if (newProject) {
      initializeForm()
    }
  },
  { immediate: true },
)

// Initialize form on mount
onMounted(() => {
  initializeForm()
})

// Methods
async function loadClientData(clientTable: ClientTableType | string | null, clientId: number) {
  // Check if clientTable is a valid ClientTableType
  const validClientTables: ClientTableType[] = ['pharma', 'physician', 'pharmacist', 'medical_clinic']
  
  if (!clientTable || !validClientTables.includes(clientTable as ClientTableType)) {
    console.warn('⚠️ Invalid or unsupported client_table:', clientTable)
    console.warn('💡 Supported types:', validClientTables)
    selectedClient.value = null
    return
  }

  try {
    const client = await clientsApi.getById(clientTable as ClientTableType, clientId)
    selectedClient.value = client
    console.log('✅ Client data loaded successfully:', client)
  } catch (error) {
    console.error('❌ Error loading client data:', error)
    const axiosError = error as { response?: { status?: number; data?: { message?: string } } }
    if (axiosError.response?.status === 400) {
      console.error('💡 400 Bad Request - client_table might be invalid or not supported by backend')
      console.error('💡 client_table value:', clientTable)
    }
    selectedClient.value = null
  }
}

function handleClientSelect(client: Client, clientTable: ClientTableType, clientType: string) {
  if (!client || !client.id) {
    return
  }
  
  settingsForm.client_id = client.id
  settingsForm.client_table = clientTable
  settingsForm.client_type = clientType
  
  // Store client data as JSON in client_data field
  if (client.data && typeof client.data === 'object') {
    settingsForm.client_data = client.data
  } else {
    // Fallback: create data object from client fields (excluding id and name)
    const { id, name, data, ...rest } = client
    settingsForm.client_data = Object.keys(rest).length > 0 ? rest : {}
  }
  
  selectedClient.value = client
  showClientSelector.value = false
  clientValidationError.value = ''
}

function clearClient() {
  settingsForm.client_id = null
  settingsForm.client_table = null
  settingsForm.client_type = null
  settingsForm.client_data = null
  selectedClient.value = null
  clientValidationError.value = ''
}

function handleClientClear() {
  clearClient()
}

async function loadClient2Data(clientTable: ClientTableType | string | null, clientId: number) {
  const validClientTables: ClientTableType[] = ['pharma', 'physician', 'pharmacist', 'medical_clinic']
  if (!clientTable || !validClientTables.includes(clientTable as ClientTableType)) {
    selectedClient2.value = null
    return
  }
  try {
    const client = await clientsApi.getById(clientTable as ClientTableType, clientId)
    selectedClient2.value = client
  } catch {
    selectedClient2.value = null
  }
}

function handleClient2Select(client: Client, clientTable: ClientTableType, clientType: string) {
  if (!client?.id) return
  settingsForm.client2_id = client.id
  settingsForm.client2_table = clientTable
  settingsForm.client2_type = clientType
  settingsForm.client2_data =
    client.data && typeof client.data === 'object' ? client.data : (() => {
      const { id, name, data, ...rest } = client
      return Object.keys(rest).length > 0 ? rest : {}
    })()
  selectedClient2.value = client
  showClient2Selector.value = false
}

function clearClient2() {
  settingsForm.client2_id = null
  settingsForm.client2_type = null
  settingsForm.client2_table = null
  settingsForm.client2_data = null
  selectedClient2.value = null
}

function handleClient2Clear() {
  clearClient2()
}

const handleSubmit = () => {
  if (isSaving.value) {
    return // Prevent double submission
  }

  // Client is required
  if (!settingsForm.client_id) {
    clientValidationError.value = 'Client is required'
    return
  }
  clientValidationError.value = ''

  isSaving.value = true
  emit('saveSettings')
  
  // Reset saving state after a short delay
  setTimeout(() => {
    isSaving.value = false
  }, 1000)
}

// Removed duplicate saveSettings method - using handleSubmit instead

// const resetSettings = () => {
//   emit('resetSettings')
// }

// Expose settingsForm to parent component
defineExpose({
  settingsForm,
})
</script>

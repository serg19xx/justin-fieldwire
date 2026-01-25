<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[120] p-4"
    @click="closeDialog"
  >
    <div
      class="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
      @click.stop
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 class="text-xl font-semibold text-gray-900">Select Client</h2>
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
      <div class="flex-1 overflow-y-auto p-6">
        <!-- Client Type Selection -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-3"> Client Type <span class="text-red-500">*</span> </label>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              v-for="type in CLIENT_TYPES"
              :key="type.value"
              type="button"
              @click="selectClientType(type.value)"
              :class="[
                'px-4 py-3 border-2 rounded-md text-left transition-colors',
                selectedClientType === type.value
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-300 hover:border-gray-400 bg-white text-gray-700'
              ]"
            >
              <div class="font-medium">{{ type.label }}</div>
            </button>
          </div>
        </div>

        <!-- Client Search and List -->
        <div v-if="selectedClientType" class="space-y-4">
          <!-- Search Input -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Search Client </label>
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                @input="handleSearch"
                class="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type to search clients..."
              />
              <svg
                class="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
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

          <!-- Loading State -->
          <div v-if="isLoading" class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p class="mt-2 text-sm text-gray-500">Loading clients...</p>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-md p-4">
            <p class="text-sm text-red-800">{{ error }}</p>
          </div>

          <!-- Clients List -->
          <div v-else-if="clients.length > 0" class="border border-gray-200 rounded-md max-h-96 overflow-y-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50 sticky top-0">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    ID
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr
                  v-for="client in clients"
                  :key="client.id"
                  @click="selectClient(client)"
                  :class="[
                    'cursor-pointer hover:bg-gray-50 transition-colors',
                    selectedClient?.id === client.id ? 'bg-blue-50' : ''
                  ]"
                >
                  <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ client.id }}
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-900">
                    {{ client.name }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="clients.length > 0 && totalPages > 1" class="flex items-center justify-between border-t border-gray-200 pt-4">
            <div class="text-sm text-gray-700">
              Showing {{ (currentPage - 1) * pageLimit + 1 }} to {{ Math.min(currentPage * pageLimit, total) }} of {{ total }} results
            </div>
            <div class="flex items-center space-x-2">
              <button
                type="button"
                @click="loadPage(currentPage - 1)"
                :disabled="currentPage === 1 || isLoading"
                class="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span class="text-sm text-gray-700">
                Page {{ currentPage }} of {{ totalPages }}
              </span>
              <button
                type="button"
                @click="loadPage(currentPage + 1)"
                :disabled="currentPage === totalPages || isLoading"
                class="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else-if="!isLoading && searchQuery" class="text-center py-8 text-gray-500">
            <p>No clients found matching "{{ searchQuery }}"</p>
          </div>

          <!-- Initial State -->
          <div v-else-if="!isLoading && !searchQuery" class="text-center py-8 text-gray-500">
            <p>Select a client type and search for clients</p>
          </div>
        </div>

        <!-- No Client Type Selected -->
        <div v-else class="text-center py-8 text-gray-500">
          <p>Please select a client type to continue</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
        <button
          type="button"
          @click="clearSelection"
          class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          Clear Selection
        </button>
        <button
          type="button"
          @click="closeDialog"
          class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          Cancel
        </button>
        <button
          type="button"
          @click="confirmSelection"
          :disabled="!selectedClient || !selectedClientType"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Select Client
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { clientsApi, CLIENT_TYPES, type Client, type ClientTableType } from '@/core/utils/clients-api'
import { debounce } from '@/core/utils/debounce'

// Re-export ClientTableType for convenience
export type { ClientTableType } from '@/core/utils/project-api'

// Props
interface Props {
  isOpen: boolean
  selectedClientId?: number | null
  selectedClientTable?: ClientTableType | null
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  selectedClientId: null,
  selectedClientTable: null,
})

// Emits
const emit = defineEmits<{
  close: []
  select: [client: Client, clientTable: ClientTableType, clientType: string]
  clear: []
}>()

// State
const selectedClientType = ref<ClientTableType | null>(props.selectedClientTable || null)
const selectedClient = ref<Client | null>(null)
const clients = ref<Client[]>([])
const searchQuery = ref('')
const isLoading = ref(false)
const error = ref<string | null>(null)
const currentPage = ref(1)
const pageLimit = ref(20) // Items per page
const total = ref(0)
const totalPages = ref(0)

// Load clients function
async function loadClients(page: number = 1) {
  if (!selectedClientType.value) return

  isLoading.value = true
  error.value = null

  try {
    const response = await clientsApi.search(
      selectedClientType.value,
      searchQuery.value,
      page,
      pageLimit.value,
    )
    clients.value = response.clients
    total.value = response.total
    totalPages.value = response.total_pages || Math.ceil(response.total / pageLimit.value)
    currentPage.value = response.page
  } catch (err) {
    console.error('Error loading clients:', err)
    error.value = 'Failed to load clients. Please try again.'
    clients.value = []
    total.value = 0
    totalPages.value = 0
  } finally {
    isLoading.value = false
  }
}

// Search function with debounce
const debouncedSearch = debounce(async (query: string) => {
  currentPage.value = 1 // Reset to first page on new search
  await loadClients(1)
}, 300)

// Load page function
async function loadPage(page: number) {
  if (page < 1 || page > totalPages.value) return
  await loadClients(page)
}

// Methods
async function selectClientType(type: ClientTableType) {
  selectedClientType.value = type
  selectedClient.value = null
  clients.value = []
  searchQuery.value = ''
  error.value = null
  currentPage.value = 1
  total.value = 0
  totalPages.value = 0
  
  // Load first page of clients when type is selected
  await loadClients(1)
}

function selectClient(client: Client) {
  selectedClient.value = client
}

function handleSearch() {
  if (selectedClientType.value) {
    debouncedSearch(searchQuery.value)
  }
}

async function confirmSelection() {
  if (selectedClient.value && selectedClientType.value) {
    const clientTypeConfig = CLIENT_TYPES.find((t) => t.value === selectedClientType.value)
    const clientType = clientTypeConfig?.label || selectedClientType.value

    // Load full client data before emitting
    try {
      isLoading.value = true
      const fullClientData = await clientsApi.getById(selectedClientType.value, selectedClient.value.id)
      
      // Emit with full client data
      emit('select', fullClientData, selectedClientType.value, clientType)
      closeDialog()
    } catch (err) {
      console.error('Error loading full client data:', err)
      error.value = 'Failed to load client details. Please try again.'
      // Still emit with basic client data if full load fails
      emit('select', selectedClient.value, selectedClientType.value, clientType)
      closeDialog()
    } finally {
      isLoading.value = false
    }
  }
}

function clearSelection() {
  selectedClient.value = null
  selectedClientType.value = null
  clients.value = []
  searchQuery.value = ''
  error.value = null
  currentPage.value = 1
  total.value = 0
  totalPages.value = 0
  emit('clear')
}

function closeDialog() {
  emit('close')
}

// Load selected client if provided
watch(
  () => props.isOpen,
  async (isOpen) => {
    if (isOpen && props.selectedClientId && props.selectedClientTable) {
      selectedClientType.value = props.selectedClientTable
      try {
        isLoading.value = true
        const client = await clientsApi.getById(props.selectedClientTable, props.selectedClientId)
        selectedClient.value = client
        searchQuery.value = client.name || ''
        // Load clients list to show selected client
        await loadClients(1)
      } catch (err) {
        console.error('Error loading client:', err)
        error.value = 'Failed to load client information.'
      } finally {
        isLoading.value = false
      }
    } else if (!isOpen) {
      // Reset state when dialog closes
      selectedClient.value = null
      selectedClientType.value = null
      clients.value = []
      searchQuery.value = ''
      error.value = null
      currentPage.value = 1
      total.value = 0
      totalPages.value = 0
    }
  },
)

defineOptions({
  name: 'ClientSelectorDialog',
})
</script>

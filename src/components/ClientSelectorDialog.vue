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
        <div>
          <h2 class="text-xl font-semibold text-gray-900">
            {{ multiple ? 'Select Additional Clients' : 'Select Client' }}
          </h2>
          <p v-if="multiple" class="mt-1 text-sm text-gray-500">
            Selected: {{ selectedKeys.length }}
          </p>
        </div>
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
          <label class="block text-sm font-medium text-gray-700 mb-3">
            Client Type <span class="text-red-500">*</span>
          </label>
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

        <!-- Selected chips (multi) -->
        <div v-if="multiple && selectedEntries.length > 0" class="mb-4 flex flex-wrap gap-2">
          <span
            v-for="entry in selectedEntries"
            :key="clientKey(entry.clientTable, entry.client.id)"
            class="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-800"
          >
            {{ entry.client.name }} ({{ entry.clientType }})
            <button
              type="button"
              class="ml-1 text-blue-600 hover:text-blue-900"
              @click="removeSelected(entry.clientTable, entry.client.id)"
            >
              ×
            </button>
          </span>
        </div>

        <!-- Client Search and List -->
        <div v-if="selectedClientType" class="space-y-4">
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

          <div v-if="isLoading" class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p class="mt-2 text-sm text-gray-500">Loading clients...</p>
          </div>

          <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-md p-4">
            <p class="text-sm text-red-800">{{ error }}</p>
          </div>

          <div v-else-if="clients.length > 0" class="border border-gray-200 rounded-md max-h-96 overflow-y-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50 sticky top-0">
                <tr>
                  <th v-if="multiple" class="px-4 py-3 w-12"></th>
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
                  @click="onRowClick(client)"
                  :class="[
                    'cursor-pointer hover:bg-gray-50 transition-colors',
                    isRowSelected(client) ? 'bg-blue-50' : '',
                    isExcluded(client) ? 'opacity-40 cursor-not-allowed' : ''
                  ]"
                >
                  <td v-if="multiple" class="px-4 py-3" @click.stop>
                    <input
                      type="checkbox"
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      :checked="isRowSelected(client)"
                      :disabled="isExcluded(client)"
                      @change="toggleMulti(client)"
                    />
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ client.id }}
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-900">
                    {{ client.name }}
                    <span v-if="isExcluded(client)" class="ml-2 text-xs text-gray-500">(primary)</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="clients.length > 0 && totalPages > 1" class="flex items-center justify-between border-t border-gray-200 pt-4">
            <div class="text-sm text-gray-700">
              Showing {{ (currentPage - 1) * pageLimit + 1 }} to
              {{ Math.min(currentPage * pageLimit, total) }} of {{ total }} results
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
              <span class="text-sm text-gray-700"> Page {{ currentPage }} of {{ totalPages }} </span>
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

          <div v-else-if="!isLoading && searchQuery" class="text-center py-8 text-gray-500">
            <p>No clients found matching "{{ searchQuery }}"</p>
          </div>

          <div v-else-if="!isLoading && !searchQuery" class="text-center py-8 text-gray-500">
            <p>Select a client type and search for clients</p>
          </div>
        </div>

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
          :disabled="confirmDisabled"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ multiple ? `Apply (${selectedKeys.length})` : 'Select Client' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { clientsApi, CLIENT_TYPES, type Client, type ClientTableType } from '@/core/utils/clients-api'
import { debounce } from '@/core/utils/debounce'

export type { ClientTableType } from '@/core/utils/project-api'

export interface ClientSelectionItem {
  client: Client
  clientTable: ClientTableType
  clientType: string
}

interface SelectedClientRef {
  client_id: number
  client_table: ClientTableType
  client_type?: string | null
  client_name?: string | null
  client_data?: Record<string, unknown> | null
}

interface Props {
  isOpen: boolean
  selectedClientId?: number | null
  selectedClientTable?: ClientTableType | null
  /** Multi-select mode for additional clients */
  multiple?: boolean
  /** Preselected additional clients (multi mode) */
  selectedClients?: SelectedClientRef[]
  /** Primary client key to exclude from additional selection */
  excludeClientId?: number | null
  excludeClientTable?: ClientTableType | null
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  selectedClientId: null,
  selectedClientTable: null,
  multiple: false,
  selectedClients: () => [],
  excludeClientId: null,
  excludeClientTable: null,
})

const emit = defineEmits<{
  close: []
  select: [client: Client, clientTable: ClientTableType, clientType: string]
  selectMany: [items: ClientSelectionItem[]]
  clear: []
}>()

const selectedClientType = ref<ClientTableType | null>(props.selectedClientTable || null)
const selectedClient = ref<Client | null>(null)
const selectedMap = ref<Record<string, ClientSelectionItem>>({})
const clients = ref<Client[]>([])
const searchQuery = ref('')
const isLoading = ref(false)
const error = ref<string | null>(null)
const currentPage = ref(1)
const pageLimit = ref(20)
const total = ref(0)
const totalPages = ref(0)

function clientKey(table: string, id: number): string {
  return `${table}:${id}`
}

const selectedKeys = computed(() => Object.keys(selectedMap.value))
const selectedEntries = computed(() => Object.values(selectedMap.value))

const confirmDisabled = computed(() => {
  if (props.multiple) return false
  return !selectedClient.value || !selectedClientType.value
})

function isExcluded(client: Client): boolean {
  if (!props.excludeClientId || !props.excludeClientTable || !selectedClientType.value) return false
  return (
    Number(client.id) === Number(props.excludeClientId) &&
    selectedClientType.value === props.excludeClientTable
  )
}

function isRowSelected(client: Client): boolean {
  if (!selectedClientType.value) return false
  if (props.multiple) {
    return Boolean(selectedMap.value[clientKey(selectedClientType.value, client.id)])
  }
  return selectedClient.value?.id === client.id
}

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

const debouncedSearch = debounce(async () => {
  currentPage.value = 1
  await loadClients(1)
}, 300)

async function loadPage(page: number) {
  if (page < 1 || page > totalPages.value) return
  await loadClients(page)
}

async function selectClientType(type: ClientTableType) {
  selectedClientType.value = type
  if (!props.multiple) {
    selectedClient.value = null
  }
  clients.value = []
  searchQuery.value = ''
  error.value = null
  currentPage.value = 1
  total.value = 0
  totalPages.value = 0
  await loadClients(1)
}

function onRowClick(client: Client) {
  if (isExcluded(client)) return
  if (props.multiple) {
    toggleMulti(client)
  } else {
    selectedClient.value = client
  }
}

function toggleMulti(client: Client) {
  if (!selectedClientType.value || isExcluded(client)) return
  const key = clientKey(selectedClientType.value, client.id)
  if (selectedMap.value[key]) {
    const next = { ...selectedMap.value }
    delete next[key]
    selectedMap.value = next
    return
  }
  const clientTypeConfig = CLIENT_TYPES.find((t) => t.value === selectedClientType.value)
  selectedMap.value = {
    ...selectedMap.value,
    [key]: {
      client,
      clientTable: selectedClientType.value,
      clientType: clientTypeConfig?.label || selectedClientType.value,
    },
  }
}

function removeSelected(table: ClientTableType, id: number) {
  const key = clientKey(table, id)
  if (!selectedMap.value[key]) return
  const next = { ...selectedMap.value }
  delete next[key]
  selectedMap.value = next
}

function handleSearch() {
  if (selectedClientType.value) {
    debouncedSearch(searchQuery.value)
  }
}

async function confirmSelection() {
  if (props.multiple) {
    const items = Object.values(selectedMap.value)
    const resolved: ClientSelectionItem[] = []
    isLoading.value = true
    try {
      for (const item of items) {
        try {
          const full = await clientsApi.getById(item.clientTable, item.client.id)
          resolved.push({
            client: full,
            clientTable: item.clientTable,
            clientType: item.clientType,
          })
        } catch {
          resolved.push(item)
        }
      }
      emit('selectMany', resolved)
      closeDialog()
    } finally {
      isLoading.value = false
    }
    return
  }

  if (selectedClient.value && selectedClientType.value) {
    const clientTypeConfig = CLIENT_TYPES.find((t) => t.value === selectedClientType.value)
    const clientType = clientTypeConfig?.label || selectedClientType.value

    try {
      isLoading.value = true
      const fullClientData = await clientsApi.getById(
        selectedClientType.value,
        selectedClient.value.id,
      )
      emit('select', fullClientData, selectedClientType.value, clientType)
      closeDialog()
    } catch {
      emit('select', selectedClient.value, selectedClientType.value, clientType)
      closeDialog()
    } finally {
      isLoading.value = false
    }
  }
}

function clearSelection() {
  selectedClient.value = null
  selectedMap.value = {}
  if (!props.multiple) {
    selectedClientType.value = null
    clients.value = []
    searchQuery.value = ''
    error.value = null
    currentPage.value = 1
    total.value = 0
    totalPages.value = 0
  }
  emit('clear')
}

function closeDialog() {
  emit('close')
}

function resetState() {
  selectedClient.value = null
  selectedMap.value = {}
  selectedClientType.value = null
  clients.value = []
  searchQuery.value = ''
  error.value = null
  currentPage.value = 1
  total.value = 0
  totalPages.value = 0
}

watch(
  () => props.isOpen,
  async (isOpen) => {
    if (!isOpen) {
      resetState()
      return
    }

    if (props.multiple) {
      const map: Record<string, ClientSelectionItem> = {}
      for (const item of props.selectedClients || []) {
        if (!item.client_id || !item.client_table) continue
        const key = clientKey(item.client_table, item.client_id)
        map[key] = {
          client: {
            id: item.client_id,
            name: item.client_name || `Client #${item.client_id}`,
            data: item.client_data || {},
          },
          clientTable: item.client_table,
          clientType: item.client_type || item.client_table,
        }
      }
      selectedMap.value = map
      return
    }

    if (props.selectedClientId && props.selectedClientTable) {
      const validClientTables: ClientTableType[] = [
        'pharma',
        'physician',
        'pharmacist',
        'medical_clinic',
      ]
      if (!validClientTables.includes(props.selectedClientTable)) {
        selectedClientType.value = null
        selectedClient.value = null
        return
      }

      selectedClientType.value = props.selectedClientTable
      try {
        isLoading.value = true
        const client = await clientsApi.getById(props.selectedClientTable, props.selectedClientId)
        selectedClient.value = client
        searchQuery.value = client.name || ''
        await loadClients(1)
      } catch {
        error.value = 'Failed to load client information.'
      } finally {
        isLoading.value = false
      }
    }
  },
)

defineOptions({
  name: 'ClientSelectorDialog',
})
</script>

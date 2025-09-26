<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ContactsLayout from '@/components/ContactsLayout.vue'
import DataTable from '@/components/DataTable.vue'
import BulkActions from '@/components/table-actions/BulkActions.vue'
import EditAction from '@/components/table-actions/EditAction.vue'
import SendSmsAction from '@/components/table-actions/SendSmsAction.vue'
import SendEmailAction from '@/components/table-actions/SendEmailAction.vue'
import FixAddressAction from '@/components/table-actions/FixAddressAction.vue'
import DeleteAction from '@/components/table-actions/DeleteAction.vue'
import { pharmaciesApi, type Pharmacy } from '@/utils/contacts-api'

// State
const pharmacies = ref<Pharmacy[]>([])
const loading = ref(false)
const tableLoading = ref(false) // Separate loading state for table data
const error = ref<string | null>(null)
const currentPage = ref(1)
const itemsPerPage = ref(10)
const totalItems = ref(0)
const totalPages = ref(0)
const isInitialLoad = ref(true) // Track if this is the first load

// Geography filters
const geographyFilters = ref<Record<string, string>>({})

// Full text display state
const showFullText = ref<Record<string, boolean>>({})

// Columns definition
const columns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'operName', label: 'Pharmacy Name', sortable: true },
  { key: 'legalName', label: 'Legal Name', sortable: true },
  { key: 'contact', label: 'Contact Name', sortable: true },
  { key: 'phone', label: 'Phone', sortable: true },
  { key: 'fax', label: 'Fax', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'fullAddress', label: 'Address', sortable: true },
  { key: 'lat', label: 'Coordinates', sortable: true },
  { key: 'country', label: 'Country', sortable: true },
  { key: 'region', label: 'Region', sortable: true },
  { key: 'city', label: 'City', sortable: true }
]


// Toggle full text display
function toggleFullText(id: string) {
  showFullText.value[id] = !showFullText.value[id]
}

// Load pharmacies data
async function loadPharmacies(filters: { country?: string; region?: string } = {}) {
  if (isInitialLoad.value) {
    // Only show full page loading on initial page load
    loading.value = true
    isInitialLoad.value = false
  } else {
    // Use table loading for all pagination changes
    tableLoading.value = true
  }
  error.value = null

  try {
    console.log('🚀 Making API request to GET /api/v1/pharmacies')

    console.log('📋 Request parameters:', {
      page: currentPage.value,
      perPage: itemsPerPage.value,
      filters: filters
    })

    // Try to load from API first
    const response = await pharmaciesApi.getAll(
      currentPage.value,
      itemsPerPage.value,
      filters
    )

    console.log('✅ API Response received:', response)
    console.log('📊 Raw response data:', response)

    if ('pharmacies' in response && Array.isArray(response.pharmacies)) {
      pharmacies.value = response.pharmacies
      totalItems.value = response.pagination.total
      totalPages.value = response.pagination.pages
      console.log('✅ Pharmacies loaded from API:', response.pharmacies.length)
      console.log('📋 First pharmacy data:', response.pharmacies[0])
      console.log('📊 Pagination info:', response.pagination)
    } else {
      throw new Error('Invalid response format')
    }
  } catch (apiError: unknown) {
    console.warn('⚠️ API failed:', apiError)
    console.error('❌ API Error details:', {
      message: apiError instanceof Error ? apiError.message : 'Unknown error',
      stack: apiError instanceof Error ? apiError.stack : 'No stack trace',
      response: (apiError as { response?: unknown })?.response || 'No response data'
    })

    // Fallback to empty array if API fails
    pharmacies.value = []
    totalItems.value = 0
    totalPages.value = 1
  } finally {
    loading.value = false
    tableLoading.value = false
  }
}

// Handle pharmacy actions
function handleEditPharmacy(pharmacy: Pharmacy) {
  console.log('Edit pharmacy:', pharmacy)
  // TODO: Implement edit pharmacy modal/form
}

function handleDeletePharmacy(pharmacy: Pharmacy) {
  if (confirm(`Are you sure you want to delete ${pharmacy.operName}?`)) {
    console.log('Delete pharmacy:', pharmacy)
    // TODO: Implement delete pharmacy
  }
}

// Additional action handlers
function handleSendSms(pharmacy: Pharmacy) {
  console.log('Send SMS to pharmacy:', pharmacy)
  // TODO: Implement SMS sending
}

function handleSendEmail(pharmacy: Pharmacy) {
  console.log('Send email to pharmacy:', pharmacy)
  // TODO: Implement email sending
}

function handleFixAddress(pharmacy: Pharmacy) {
  console.log('Fix address for pharmacy:', pharmacy)
  // TODO: Implement address fixing
}

// Bulk action handlers
function handleBulkEdit(pharmacies: Pharmacy[]) {
  console.log('Bulk edit pharmacies:', pharmacies)
  // TODO: Implement bulk edit
}

function handleBulkSendSms(pharmacies: Pharmacy[]) {
  console.log('Bulk send SMS to pharmacies:', pharmacies)
  // TODO: Implement bulk SMS
}

function handleBulkSendEmail(pharmacies: Pharmacy[]) {
  console.log('Bulk send email to pharmacies:', pharmacies)
  // TODO: Implement bulk email
}

function handleBulkFixAddress(pharmacies: Pharmacy[]) {
  console.log('Bulk fix address for pharmacies:', pharmacies)
  // TODO: Implement bulk address fix
}

function handleBulkDelete(pharmacies: Pharmacy[]) {
  if (confirm(`Are you sure you want to delete ${pharmacies.length} pharmacies?`)) {
    console.log('Bulk delete pharmacies:', pharmacies)
    // TODO: Implement bulk delete
  }
}

// Pagination handlers
function handlePageChange(page: number) {
  currentPage.value = page
  loadPharmacies()
}

function handleItemsPerPageChange(items: number) {
  itemsPerPage.value = items
  currentPage.value = 1
  loadPharmacies()
}

// Filter change handler
function handleFilterChange(filters: Record<string, string>) {
  geographyFilters.value = filters
  currentPage.value = 1
  loadPharmacies(filters)
}

// Geography loaded handler
function handleGeographyLoaded(filters: Record<string, string>) {
  geographyFilters.value = filters
  loadPharmacies(filters)
}

// Load data on mount
onMounted(() => {
  loadPharmacies()
})
</script>

<template>
  <ContactsLayout>
    <!-- Header slot -->
    <template #title>Pharmacies</template>




    <!-- Content slot -->
    <template #content>
      <!-- Loading state -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p class="text-gray-600">Loading pharmacies...</p>
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-md p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Error loading pharmacies</h3>
            <p class="mt-1 text-sm text-red-700">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Data table -->
      <div v-else>
        <DataTable
          :data="pharmacies"
          :columns="columns"
          :items-per-page="itemsPerPage"
          :total-items="totalItems"
          :current-page="currentPage"
          @page-change="handlePageChange"
          @items-per-page-change="handleItemsPerPageChange"
          @filter-change="handleFilterChange"
          @geography-loaded="handleGeographyLoaded"
        >
          <!-- Table loading overlay -->
          <template #loading-overlay v-if="tableLoading">
            <div class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
              <div class="text-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p class="text-sm text-gray-600">Loading data...</p>
              </div>
            </div>
          </template>

          <!-- Bulk actions -->
          <template #bulk-actions="{ selectedItems }">
            <BulkActions
              :selected-items="selectedItems"
              @edit="handleBulkEdit"
              @send-sms="handleBulkSendSms"
              @send-email="handleBulkSendEmail"
              @fix-address="handleBulkFixAddress"
              @delete="handleBulkDelete"
            />
          </template>

          <!-- Custom row actions -->
          <template #row-actions="{ item }">
            <div class="flex items-center gap-1 justify-end">
              <EditAction :item="item" @edit="handleEditPharmacy" />
              <SendSmsAction :item="item" @send-sms="handleSendSms" />
              <SendEmailAction :item="item" @send-email="handleSendEmail" />
              <FixAddressAction :item="item" @fix-address="handleFixAddress" />
              <DeleteAction :item="item" @delete="handleDeletePharmacy" />
            </div>
          </template>

          <!-- Custom cell content -->
          <template #cell-phone="{ value }">
            <a v-if="value" :href="`tel:${value as string}`" class="text-blue-600 hover:text-blue-800">
              {{ value }}
            </a>
            <span v-else class="text-gray-400">-</span>
          </template>

          <template #cell-fax="{ value }">
            <span v-if="value" class="text-gray-600">{{ value }}</span>
            <span v-else class="text-gray-400">-</span>
          </template>

          <template #cell-email="{ value }">
            <a v-if="value" :href="`mailto:${value as string}`" class="text-blue-600 hover:text-blue-800">
              {{ value }}
            </a>
            <span v-else class="text-gray-400">-</span>
          </template>

          <template #cell-fullAddress="{ value, item }">
            <div class="text-sm text-gray-700">
              <span :title="value as string">
                {{ showFullText[item.id as string] ? value : ((value as string).length > 50 ? (value as string).substring(0, 50) + '...' : value) }}
              </span>
              <button
                v-if="(value as string).length > 50"
                @click="toggleFullText(item.id as string)"
                class="ml-2 text-blue-600 hover:text-blue-800 text-xs underline"
              >
                {{ showFullText[item.id as string] ? 'Скрыть' : 'Показать все' }}
              </button>
            </div>
          </template>

          <template #cell-lat="{ value, item }">
            <span v-if="value && item.lng" class="text-sm text-gray-600">
              {{ value }}, {{ item.lng }}
            </span>
            <span v-else class="text-gray-400">-</span>
          </template>
        </DataTable>
      </div>
    </template>


  </ContactsLayout>
</template>

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
import { pharmacistsApi, type Pharmacist } from '@/utils/contacts-api'

// State
const pharmacists = ref<Pharmacist[]>([])
const loading = ref(false)
const tableLoading = ref(false) // Separate loading state for table data
const error = ref<string | null>(null)
const currentPage = ref(1)
const itemsPerPage = ref(10)
const totalItems = ref(0)
const totalPages = ref(0)
const isInitialLoad = ref(true) // Track if this is the first load

// Columns definition
const columns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'fullName', label: 'Full Name', sortable: true },
  { key: 'reg_number', label: 'Registration #', sortable: true },
  { key: 'operName', label: 'Pharmacy Name', sortable: true },
  { key: 'workplace', label: 'Workplace', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
]

// Geography filters
const geographyFilters = ref<Record<string, string>>({})

// Load pharmacists data
async function loadPharmacists(filters: { country?: string; region?: string } = {}) {
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
    console.log('🚀 Making API request to GET /api/v1/pharmacists')

    console.log('📋 Request parameters:', {
      page: currentPage.value,
      perPage: itemsPerPage.value,
      filters: filters,
    })

    // Try to load from API first
    const response = await pharmacistsApi.getAll(currentPage.value, itemsPerPage.value, filters)

    console.log('✅ API Response received:', response)
    console.log('📊 Raw response data:', response)
    console.log('🔍 Response keys:', Object.keys(response))
    console.log('🔍 Response.pharmacists exists:', 'pharmacists' in response)
    console.log('🔍 Response.pharmacists type:', typeof response.pharmacists)
    console.log('🔍 Response.pharmacists isArray:', Array.isArray(response.pharmacists))

    if ('pharmacists' in response && Array.isArray(response.pharmacists)) {
      pharmacists.value = response.pharmacists
      totalItems.value = response.pagination.total
      totalPages.value = response.pagination.pages
      console.log('✅ Pharmacists loaded from API:', response.pharmacists.length)
      console.log('📋 First pharmacist data:', response.pharmacists[0])
      console.log('📊 Pagination info:', response.pagination)
    } else {
      console.error('❌ Invalid response structure:', response)
      throw new Error('Invalid response format')
    }
  } catch (apiError: unknown) {
    console.warn('⚠️ API failed:', apiError)
    console.error('❌ API Error details:', {
      message: apiError instanceof Error ? apiError.message : 'Unknown error',
      stack: apiError instanceof Error ? apiError.stack : 'No stack trace',
      response: (apiError as { response?: unknown })?.response || 'No response data',
    })

    // Fallback to empty array if API fails
    pharmacists.value = []
    totalItems.value = 0
    totalPages.value = 1
  } finally {
    loading.value = false
    tableLoading.value = false
  }
}

// Handle pharmacist actions
function handleEditPharmacist(pharmacist: Pharmacist) {
  console.log('Edit pharmacist:', pharmacist)
  // TODO: Implement edit pharmacist modal/form
}

function handleDeletePharmacist(pharmacist: Pharmacist) {
  if (confirm(`Are you sure you want to delete ${pharmacist.fullName}?`)) {
    console.log('Delete pharmacist:', pharmacist)
    // TODO: Implement delete pharmacist
  }
}

// Additional action handlers
function handleSendSms(pharmacist: Pharmacist) {
  console.log('Send SMS to pharmacist:', pharmacist)
  // TODO: Implement SMS sending
}

function handleSendEmail(pharmacist: Pharmacist) {
  console.log('Send email to pharmacist:', pharmacist)
  // TODO: Implement email sending
}

function handleFixAddress(pharmacist: Pharmacist) {
  console.log('Fix address for pharmacist:', pharmacist)
  // TODO: Implement address fixing
}

// Bulk action handlers
function handleBulkEdit(pharmacists: Pharmacist[]) {
  console.log('Bulk edit pharmacists:', pharmacists)
  // TODO: Implement bulk edit
}

function handleBulkSendSms(pharmacists: Pharmacist[]) {
  console.log('Bulk send SMS to pharmacists:', pharmacists)
  // TODO: Implement bulk SMS
}

function handleBulkSendEmail(pharmacists: Pharmacist[]) {
  console.log('Bulk send email to pharmacists:', pharmacists)
  // TODO: Implement bulk email
}

function handleBulkFixAddress(pharmacists: Pharmacist[]) {
  console.log('Bulk fix address for pharmacists:', pharmacists)
  // TODO: Implement bulk address fix
}

function handleBulkDelete(pharmacists: Pharmacist[]) {
  if (confirm(`Are you sure you want to delete ${pharmacists.length} pharmacists?`)) {
    console.log('Bulk delete pharmacists:', pharmacists)
    // TODO: Implement bulk delete
  }
}

// Pagination handlers
function handlePageChange(page: number) {
  currentPage.value = page
  loadPharmacists()
}

function handleItemsPerPageChange(items: number) {
  itemsPerPage.value = items
  currentPage.value = 1
  loadPharmacists()
}

// Filter change handler
function handleFilterChange(filters: Record<string, string>) {
  geographyFilters.value = filters
  currentPage.value = 1
  loadPharmacists(filters)
}

// Geography loaded handler
function handleGeographyLoaded(filters: Record<string, string>) {
  geographyFilters.value = filters
  loadPharmacists(filters)
}

// Load data on mount
onMounted(() => {
  loadPharmacists()
})
</script>

<template>
  <ContactsLayout>
    <!-- Header slot -->
    <template #title>Pharmacists</template>

    <!-- Content slot -->
    <template #content>
      <!-- Loading state -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="text-center">
          <div
            class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"
          ></div>
          <p class="text-gray-600">Loading pharmacists...</p>
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-md p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Error loading pharmacists</h3>
            <p class="mt-1 text-sm text-red-700">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Data table -->
      <div v-else>
        <DataTable
          :data="pharmacists"
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
            <div
              class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10"
            >
              <div class="text-center">
                <div
                  class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"
                ></div>
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
              <EditAction :item="item" @edit="handleEditPharmacist" />
              <SendSmsAction :item="item" @send-sms="handleSendSms" />
              <SendEmailAction :item="item" @send-email="handleSendEmail" />
              <FixAddressAction :item="item" @fix-address="handleFixAddress" />
              <DeleteAction :item="item" @delete="handleDeletePharmacist" />
            </div>
          </template>

          <!-- Custom cell content -->
          <template #cell-email="{ value }">
            <a v-if="value" href="mailto:{{ value }}" class="text-blue-600 hover:text-blue-800">
              {{ value }}
            </a>
            <span v-else class="text-gray-400">-</span>
          </template>

          <template #cell-reg_number="{ value }">
            <span v-if="value" class="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
              {{ value }}
            </span>
            <span v-else class="text-gray-400">-</span>
          </template>

          <template #cell-workplace="{ value }">
            <span v-if="value" class="text-sm text-gray-700">{{ value }}</span>
            <span v-else class="text-gray-400">-</span>
          </template>
        </DataTable>
      </div>
    </template>
  </ContactsLayout>
</template>

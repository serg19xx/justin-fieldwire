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
import { driversApi, type Driver } from '@/utils/contacts-api'

// State
const drivers = ref<Driver[]>([])
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
  { key: 'fullName', label: 'Driver Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'phone', label: 'Phone', sortable: true },
  { key: 'address', label: 'Address', sortable: true },
  { key: 'city', label: 'City', sortable: true },
  { key: 'region', label: 'Region', sortable: true },
  { key: 'country', label: 'Country', sortable: true },
  { key: 'active_plan', label: 'Plan', sortable: true }
]



// Load drivers data
async function loadDrivers(filters: { country?: string; region?: string } = {}) {
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
    console.log('🚀 Making API request to GET /api/v1/drivers')

    // Prepare filters - only include defined values
    const filtersToSend: Record<string, string> = {}
    if (filters.country) filtersToSend.country = filters.country
    if (filters.region) filtersToSend.province = filters.region  // Backend expects 'province', not 'region'

    console.log('📋 Request parameters:', {
      page: currentPage.value,
      perPage: itemsPerPage.value,
      filters: filtersToSend
    })

    // Try to load from API first
    const response = await driversApi.getAll(currentPage.value, itemsPerPage.value, filtersToSend)

    console.log('✅ API Response received:', response)
    console.log('📊 Raw response data:', response)

    if ('drivers' in response && Array.isArray(response.drivers)) {
      // Update data without triggering full re-render
      drivers.value = response.drivers
      totalItems.value = response.pagination.total
      totalPages.value = response.pagination.pages
      console.log('✅ Drivers loaded from API:', response.drivers.length)
      console.log('📋 First driver data:', response.drivers[0])
      console.log('📊 Pagination info:', response.pagination)
    } else {
      throw new Error('Invalid response format')
    }
  } catch (apiError: unknown) {
    console.warn('⚠️ API failed, using mock data:', apiError)
    console.error('❌ API Error details:', {
      message: apiError instanceof Error ? apiError.message : 'Unknown error',
      stack: apiError instanceof Error ? apiError.stack : 'No stack trace',
      response: (apiError as { response?: unknown })?.response || 'No response data'
    })

    // Fallback to empty array if API fails
    drivers.value = []
    totalItems.value = 0
    totalPages.value = 1
  } finally {
    loading.value = false
    tableLoading.value = false
  }
}



// Handle driver actions
function handleViewDriver(driver: Driver) {
  console.log('View driver:', driver)
  // TODO: Implement view driver modal/page
}

function handleEditDriver(driver: Driver) {
  console.log('Edit driver:', driver)
  // TODO: Implement edit driver modal/form
}

function handleDeleteDriver(driver: Driver) {
  if (confirm(`Are you sure you want to delete ${driver.fullName}?`)) {
    console.log('Delete driver:', driver)
    // TODO: Implement delete driver
  }
}

// Additional action handlers
function handleSendSms(driver: Driver) {
  console.log('Send SMS to driver:', driver)
  // TODO: Implement SMS sending
}

function handleSendEmail(driver: Driver) {
  console.log('Send email to driver:', driver)
  // TODO: Implement email sending
}

function handleFixAddress(driver: Driver) {
  console.log('Fix address for driver:', driver)
  // TODO: Implement address fixing
}

// Bulk action handlers
function handleBulkEdit(drivers: Driver[]) {
  console.log('Bulk edit drivers:', drivers)
  // TODO: Implement bulk edit
}

function handleBulkSendSms(drivers: Driver[]) {
  console.log('Bulk send SMS to drivers:', drivers)
  // TODO: Implement bulk SMS
}

function handleBulkSendEmail(drivers: Driver[]) {
  console.log('Bulk send email to drivers:', drivers)
  // TODO: Implement bulk email
}

function handleBulkFixAddress(drivers: Driver[]) {
  console.log('Bulk fix address for drivers:', drivers)
  // TODO: Implement bulk address fix
}

function handleBulkDelete(drivers: Driver[]) {
  if (confirm(`Are you sure you want to delete ${drivers.length} drivers?`)) {
    console.log('Bulk delete drivers:', drivers)
    // TODO: Implement bulk delete
  }
}

// Pagination handlers
function handlePageChange(page: number) {
  currentPage.value = page
  loadDrivers()
}

function handleItemsPerPageChange(items: number) {
  itemsPerPage.value = items
  currentPage.value = 1
  loadDrivers()
}

// Handle filters change with geography filters
function handleFilterChange(filters: { country: string; region: string }) {
  console.log('🔍 Filters changed:', filters)
  console.log('📤 Sending to backend:', { country: filters.country, province: filters.region })
  currentPage.value = 1
  isInitialLoad.value = false // Reset to use table loading
  loadDrivers(filters)
}

// Handle geography loaded event from DataTable
function handleGeographyLoaded(firstCountry: { code: string; name: string }) {
  console.log('🌍 Geography loaded with first country:', firstCountry)
  // Load drivers with first country as default filter
  loadDrivers({ country: firstCountry.name, region: '' })
}

// Load data on mount
onMounted(() => {
  // DataTable will emit geography-loaded event when geography is loaded
  // We don't need to call loadDrivers here - it will be called by handleGeographyLoaded
})
</script>

<template>
  <ContactsLayout>
    <!-- Header slot -->
    <template #title>Drivers</template>




    <!-- Content slot -->
    <template #content>
      <DataTable
        :data="drivers"
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
            <EditAction :item="item" @edit="handleEditDriver" />
            <SendSmsAction :item="item" @send-sms="handleSendSms" />
            <SendEmailAction :item="item" @send-email="handleSendEmail" />
            <FixAddressAction :item="item" @fix-address="handleFixAddress" />
            <DeleteAction :item="item" @delete="handleDeleteDriver" />
          </div>
        </template>

        <!-- Custom cell content -->
        <template #cell-status="{ value }">
          <span
            class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
            :class="{
              'bg-green-100 text-green-800': value === 'active',
              'bg-red-100 text-red-800': value === 'inactive',
              'bg-blue-100 text-blue-800': value === 'on_trip',
              'bg-gray-100 text-gray-800': value === 'off_duty'
            }"
          >
            {{ value.replace('_', ' ').toUpperCase() }}
          </span>
        </template>

        <template #cell-license="{ value }">
          <span
            class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800"
          >
            {{ value }}
          </span>
        </template>

        <template #cell-vehicle="{ value }">
          <span
            v-if="value"
            class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800"
          >
            {{ value }}
          </span>
          <span
            v-else
            class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800"
          >
            Unassigned
          </span>
        </template>

        <template #cell-phone="{ value }">
          <a href="tel:{{ value }}" class="text-blue-600 hover:text-blue-800">
            {{ value }}
          </a>
        </template>

        <template #cell-email="{ value }">
          <a href="mailto:{{ value }}" class="text-blue-600 hover:text-blue-800">
            {{ value }}
          </a>
        </template>
      </DataTable>
    </template>


  </ContactsLayout>
</template>

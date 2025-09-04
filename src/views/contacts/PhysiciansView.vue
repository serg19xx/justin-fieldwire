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
import { physiciansApi, type Physician } from '@/utils/contacts-api'

// State
const physicians = ref<Physician[]>([])
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

// Columns definition
const columns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'prefTitle', label: 'Title', sortable: true },
  { key: 'fullName', label: 'Full Name', sortable: true },
  { key: 'specialty', label: 'Specialty', sortable: true },
  { key: 'company', label: 'Company', sortable: true },
  { key: 'cellPhone', label: 'Cell Phone', sortable: true },
  { key: 'officePhone', label: 'Office Phone', sortable: true },
  { key: 'faxNumber', label: 'Fax Number', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'address', label: 'Address', sortable: true }
]

// Load physicians data
async function loadPhysicians(filters: { country?: string; region?: string } = {}) {
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
    console.log('🚀 Making API request to GET /api/v1/physicians')

    console.log('📋 Request parameters:', {
      page: currentPage.value,
      perPage: itemsPerPage.value,
      filters: filters
    })

    // Try to load from API first
    const response = await physiciansApi.getAll(currentPage.value, itemsPerPage.value, filters)

    console.log('✅ API Response received:', response)
    console.log('📊 Raw response data:', response)

    if ('physicians' in response && Array.isArray(response.physicians)) {
      // Add computed address field to each physician
              const physiciansWithComputed = response.physicians.map((physician: Physician) => {
          let address = ''

          console.log('🔍 Processing physician:', physician.fullName)
          console.log('🔍 fullAddress:', physician.fullAddress)
          console.log('🔍 unitNumb:', physician.unitNumb)
          console.log('🔍 streetNumber:', physician.streetNumber)
          console.log('🔍 city:', physician.city)
          console.log('🔍 region:', physician.region)
          console.log('🔍 postal:', physician.postal)
          console.log('🔍 country:', physician.country)

          if (physician.fullAddress && physician.fullAddress.trim() !== '') {
            address = physician.fullAddress
            console.log('✅ Using fullAddress:', address)
          } else {
            const addressParts = [
              physician.unitNumb,
              physician.streetNumber,
              physician.city,
              physician.region,
              physician.postal,
              physician.country
            ]

            console.log('🔍 Raw address parts:', addressParts)

            const filteredParts = addressParts.filter(part => {
              const isValid = part && part !== '' && part.trim() !== '' && part !== null && part !== undefined
              console.log(`🔍 Part "${part}" is valid:`, isValid)
              return isValid
            })

            console.log('🔍 Filtered parts:', filteredParts)

            address = filteredParts.length > 0 ? filteredParts.join(', ') : ''
            console.log('✅ Final computed address:', address)
          }

          const physicianWithAddress = {
            ...physician,
            address
          }

          console.log('🔍 Final physician object:', physicianWithAddress)
          return physicianWithAddress
        })

      physicians.value = physiciansWithComputed
      totalItems.value = response.pagination.total
      totalPages.value = response.pagination.pages
      console.log('✅ Physicians loaded from API:', response.physicians.length)
      console.log('📋 First physician data:', physiciansWithComputed[0])
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
    physicians.value = []
    totalItems.value = 0
    totalPages.value = 1
  } finally {
    loading.value = false
    tableLoading.value = false
  }
}

// Handle physician actions
function handleEditPhysician(physician: Physician) {
  console.log('Edit physician:', physician)
  // TODO: Implement edit physician modal/form
}

function handleDeletePhysician(physician: Physician) {
  if (confirm(`Are you sure you want to delete ${physician.prefTitle} ${physician.fullName}?`)) {
    console.log('Delete physician:', physician)
    // TODO: Implement delete physician
  }
}

// Additional action handlers
function handleSendSms(physician: Physician) {
  console.log('Send SMS to physician:', physician)
  // TODO: Implement SMS sending
}

function handleSendEmail(physician: Physician) {
  console.log('Send email to physician:', physician)
  // TODO: Implement email sending
}

function handleFixAddress(physician: Physician) {
  console.log('Fix address for physician:', physician)
  // TODO: Implement address fixing
}

// Bulk action handlers
function handleBulkEdit(physicians: Physician[]) {
  console.log('Bulk edit physicians:', physicians)
  // TODO: Implement bulk edit
}

function handleBulkSendSms(physicians: Physician[]) {
  console.log('Bulk send SMS to physicians:', physicians)
  // TODO: Implement bulk SMS
}

function handleBulkSendEmail(physicians: Physician[]) {
  console.log('Bulk send email to physicians:', physicians)
  // TODO: Implement bulk email
}

function handleBulkFixAddress(physicians: Physician[]) {
  console.log('Bulk fix address for physicians:', physicians)
  // TODO: Implement bulk address fix
}

function handleBulkDelete(physicians: Physician[]) {
  if (confirm(`Are you sure you want to delete ${physicians.length} physicians?`)) {
    console.log('Bulk delete physicians:', physicians)
    // TODO: Implement bulk delete
  }
}

// Pagination handlers
function handlePageChange(page: number) {
  currentPage.value = page
  loadPhysicians()
}

function handleItemsPerPageChange(items: number) {
  itemsPerPage.value = items
  currentPage.value = 1
  loadPhysicians()
}

// Filter change handler
function handleFilterChange(filters: Record<string, string>) {
  geographyFilters.value = filters
  currentPage.value = 1
  loadPhysicians(filters)
}

// Geography loaded handler
function handleGeographyLoaded(filters: Record<string, string>) {
  geographyFilters.value = filters
  loadPhysicians(filters)
}

// Load data on mount
onMounted(() => {
  loadPhysicians()
})
</script>

<template>
  <ContactsLayout>
    <!-- Header slot -->
    <template #title>Physicians & Providers</template>




    <!-- Content slot -->
    <template #content>
      <!-- Loading state -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p class="text-gray-600">Loading physicians...</p>
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
            <h3 class="text-sm font-medium text-red-800">Error loading physicians</h3>
            <p class="mt-1 text-sm text-red-700">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Data table -->
      <div v-else>
        <DataTable
          :data="physicians"
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
              <EditAction :item="item" @edit="handleEditPhysician" />
              <SendSmsAction :item="item" @send-sms="handleSendSms" />
              <SendEmailAction :item="item" @send-email="handleSendEmail" />
              <FixAddressAction :item="item" @fix-address="handleFixAddress" />
              <DeleteAction :item="item" @delete="handleDeletePhysician" />
            </div>
          </template>

          <!-- Custom cell content -->
          <template #cell-email="{ value }">
            <a v-if="value" :href="`mailto:${value as string}`" class="text-blue-600 hover:text-blue-800">
              {{ value }}
            </a>
            <span v-else class="text-gray-400">-</span>
          </template>

          <template #cell-officePhone="{ value }">
            <a v-if="value" :href="`tel:${value as string}`" class="text-blue-600 hover:text-blue-800">
              {{ value }}
            </a>
            <span v-else class="text-gray-400">-</span>
          </template>

          <template #cell-cellPhone="{ value }">
            <a v-if="value" :href="`tel:${value as string}`" class="text-blue-600 hover:text-blue-800">
              {{ value }}
            </a>
            <span v-else class="text-gray-400">-</span>
          </template>

          <template #cell-faxNumber="{ value }">
            <span v-if="value" class="text-gray-600">{{ value }}</span>
            <span v-else class="text-gray-400">-</span>
          </template>

          <template #cell-specialty="{ value }">
            <span
              class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800"
            >
              {{ value }}
            </span>
          </template>

          <template #cell-address="{ value }">
            <span v-if="value && (value as string).trim() !== ''" class="text-sm text-gray-700" :title="value as string">
              {{ (value as string).length > 50 ? (value as string).substring(0, 50) + '...' : value }}
            </span>
            <span v-else class="text-gray-400">-</span>
          </template>
              </DataTable>
      </div>
    </template>


  </ContactsLayout>
</template>

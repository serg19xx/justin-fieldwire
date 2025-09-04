<template>
  <ContactsLayout>
    <!-- Header slot -->
    <template #title>Medical Clinics</template>

    <template #content>
      <DataTable
        :data="medicalClinics"
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

        <!-- Custom cell renderers -->
        <template #cell-phone="{ value }">
          <span v-if="value" class="text-sm text-gray-700">{{ value }}</span>
          <span v-else class="text-sm text-gray-400">-</span>
        </template>

        <template #cell-fax="{ value }">
          <span v-if="value" class="text-sm text-gray-700">{{ value }}</span>
          <span v-else class="text-sm text-gray-400">-</span>
        </template>

        <template #cell-email="{ value }">
          <span v-if="value" class="text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
            {{ value }}
          </span>
          <span v-else class="text-sm text-gray-400">-</span>
        </template>

        <template #cell-fullAddress="{ value }">
          <span v-if="value" class="text-sm text-gray-700" :title="value as string">
            {{ (value as string).length > 50 ? (value as string).substring(0, 50) + '...' : value }}
          </span>
          <span v-else class="text-sm text-gray-400">-</span>
        </template>

        <template #cell-geoCoordinates="{ value }">
          <span v-if="value" class="text-sm text-gray-700 font-mono">{{ value }}</span>
          <span v-else class="text-sm text-gray-400">-</span>
        </template>

        <!-- Row actions -->
        <template #row-actions="{ item }">
          <div class="flex items-center gap-1 justify-end">
            <EditAction :item="item" @edit="handleEditMedicalClinic" />
            <SendSmsAction :item="item" @send-sms="handleSendSms" />
            <SendEmailAction :item="item" @send-email="handleSendEmail" />
            <FixAddressAction :item="item" @fix-address="handleFixAddress" />
            <DeleteAction :item="item" @delete="handleDeleteMedicalClinic" />
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
      </DataTable>
    </template>
  </ContactsLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ContactsLayout from '@/components/ContactsLayout.vue'
import DataTable from '@/components/DataTable.vue'
import EditAction from '@/components/table-actions/EditAction.vue'
import SendSmsAction from '@/components/table-actions/SendSmsAction.vue'
import SendEmailAction from '@/components/table-actions/SendEmailAction.vue'
import FixAddressAction from '@/components/table-actions/FixAddressAction.vue'
import DeleteAction from '@/components/table-actions/DeleteAction.vue'
import BulkActions from '@/components/table-actions/BulkActions.vue'
import { medicalClinicsApi, type MedicalClinic } from '@/utils/contacts-api'

// State
const medicalClinics = ref<MedicalClinic[]>([])
const loading = ref(false)
const tableLoading = ref(false) // Separate loading state for table data
const error = ref<string | null>(null)
const currentPage = ref(1)
const itemsPerPage = ref(10)
const totalItems = ref(0)
const totalPages = ref(0)
const selectedItems = ref<MedicalClinic[]>([])
const isInitialLoad = ref(true) // Track if this is the first load

// Geography filters
const geographyFilters = ref<Record<string, string>>({})

// Columns definition
const columns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'clinicName', label: 'Clinic Name', sortable: true },
  { key: 'clinicType', label: 'Type', sortable: true },
  { key: 'contactName', label: 'Contact', sortable: true },
  { key: 'phone', label: 'Phone', sortable: false },
  { key: 'fax', label: 'Fax', sortable: false },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'fullAddress', label: 'Address', sortable: false },
  { key: 'geoCoordinates', label: 'Coordinates', sortable: false },
  { key: 'country', label: 'Country', sortable: true },
  { key: 'region', label: 'Region', sortable: true },
  { key: 'city', label: 'City', sortable: true },
]

// Load medical clinics data
async function loadMedicalClinics(filters: { country?: string; region?: string } = {}) {
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
    console.log('🚀 Making API request to GET /api/v1/medical-clinics')

    console.log('📋 Request parameters:', {
      page: currentPage.value,
      perPage: itemsPerPage.value,
      filters: filters,
    })

    const response = await medicalClinicsApi.getAll(currentPage.value, itemsPerPage.value, filters)

    console.log('✅ API Response received:', response)
    console.log('📊 Raw response data:', response)

    if ('medical_clinics' in response && Array.isArray(response.medical_clinics)) {
      medicalClinics.value = response.medical_clinics
      totalItems.value = response.pagination.total
      totalPages.value = response.pagination.pages
      console.log('✅ Medical clinics loaded from API:', response.medical_clinics.length)
      console.log('📋 First clinic data:', response.medical_clinics[0])
      console.log('📊 Pagination info:', response.pagination)
    } else {
      throw new Error('Invalid response format')
    }
  } catch (apiError: unknown) {
    console.warn('⚠️ API failed, using mock data:', apiError)
    console.error('❌ API Error details:', {
      message: apiError instanceof Error ? apiError.message : 'Unknown error',
      stack: apiError instanceof Error ? apiError.stack : 'No stack trace',
      response: (apiError as { response?: unknown })?.response || 'No response data',
    })

    // Fallback to empty array if API fails
    medicalClinics.value = []
    totalItems.value = 0
    totalPages.value = 1
  } finally {
    loading.value = false
    tableLoading.value = false
  }
}

// Pagination handlers
function handlePageChange(page: number) {
  currentPage.value = page
  loadMedicalClinics()
}

function handleItemsPerPageChange(items: number) {
  itemsPerPage.value = items
  currentPage.value = 1
  loadMedicalClinics()
}

// Filter change handler
function handleFilterChange(filters: Record<string, string>) {
  geographyFilters.value = filters
  currentPage.value = 1
  loadMedicalClinics(filters)
}

// Geography loaded handler
function handleGeographyLoaded(filters: Record<string, string>) {
  geographyFilters.value = filters
  loadMedicalClinics(filters)
}

// Action handlers
function handleEditMedicalClinic(clinic: MedicalClinic) {
  console.log('🔍 Edit medical clinic:', clinic)
  // Implement edit functionality
}

function handleDeleteMedicalClinic(clinic: MedicalClinic) {
  if (confirm(`Are you sure you want to delete "${clinic.clinicName}"?`)) {
    medicalClinicsApi
      .delete(clinic.id)
      .then(() => {
        console.log('✅ Medical clinic deleted successfully')
        loadMedicalClinics()
      })
      .catch((error) => {
        console.error('❌ Error deleting medical clinic:', error)
      })
  }
}

function handleSendSms(clinic: MedicalClinic) {
  console.log('🔍 Send SMS to:', clinic)
  // Implement SMS functionality
}

function handleSendEmail(clinic: MedicalClinic) {
  console.log('🔍 Send email to:', clinic)
  // Implement email functionality
}

function handleFixAddress(clinic: MedicalClinic) {
  console.log('🔍 Fix address for:', clinic)
  // Implement address fixing functionality
}

// Bulk action handlers
function handleBulkEdit(items: MedicalClinic[]) {
  console.log('🔍 Bulk edit:', items)
  // Implement bulk edit functionality
}

function handleBulkSendSms(items: MedicalClinic[]) {
  console.log('🔍 Bulk SMS to:', items)
  // Implement bulk SMS functionality
}

function handleBulkSendEmail(items: MedicalClinic[]) {
  console.log('🔍 Bulk email to:', items)
  // Implement bulk email functionality
}

function handleBulkFixAddress(items: MedicalClinic[]) {
  console.log('🔍 Bulk fix address for:', items)
  // Implement bulk address fix functionality
}

function handleBulkDelete(items: MedicalClinic[]) {
  if (items.length === 0) return

  if (confirm(`Are you sure you want to delete ${items.length} selected medical clinic(s)?`)) {
    const deletePromises = items.map((clinic) => medicalClinicsApi.delete(clinic.id))
    Promise.all(deletePromises)
      .then(() => {
        console.log('✅ Bulk delete successful')
        selectedItems.value = []
        loadMedicalClinics()
      })
      .catch((error) => {
        console.error('❌ Error bulk deleting medical clinics:', error)
      })
  }
}

// Lifecycle
onMounted(() => {
  loadMedicalClinics()
})
</script>

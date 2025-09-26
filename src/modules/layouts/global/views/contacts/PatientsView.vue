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
import EditPatientModal from '@/components/modals/EditPatientModal.vue'
import { patientsApi, type Patient } from '@/utils/contacts-api'

// State
const patients = ref<Patient[]>([])
const loading = ref(false)
const tableLoading = ref(false) // Separate loading state for table data
const error = ref<string | null>(null)
const currentPage = ref(1)
const itemsPerPage = ref(10)
const totalItems = ref(0)
const totalPages = ref(0)

// Modal state
const isEditModalOpen = ref(false)
const editingPatient = ref<Patient | null>(null)
const isInitialLoad = ref(true) // Track if this is the first load


// Columns definition
const columns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'fullName', label: 'Full Name', sortable: true },
  { key: 'fullAddress', label: 'Full Address', sortable: true },
  { key: 'cell', label: 'Cell Phone', sortable: true },
  { key: 'email', label: 'Email', sortable: true }
]





// Load patients data
// Note: frontend uses 'region', backend expects 'province'
async function loadPatients(filters: { country?: string; region?: string } = {}) {
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
    console.log('🚀 Making API request to GET /api/v1/patients')

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
    console.log('🔍 Current auth token:', localStorage.getItem('authToken')?.substring(0, 50) + '...')

    const response = await patientsApi.getAll(currentPage.value, itemsPerPage.value, filtersToSend)

    console.log('✅ API Response received:', response)
    console.log('📊 Raw response data:', response)

    if ('patients' in response && Array.isArray(response.patients)) {
      // Update data without triggering full re-render
      patients.value = response.patients
      totalItems.value = response.pagination.total
      totalPages.value = response.pagination.pages
      console.log('✅ Patients loaded from API:', response.patients.length)
      console.log('📋 First patient data:', response.patients[0])
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
    patients.value = []
    totalItems.value = 0
    totalPages.value = 1
  } finally {
    loading.value = false
    tableLoading.value = false
  }
}



// Handle filters change with geography filters
function handleFilterChange(filters: { country: string; region: string }) {
  console.log('🔍 Filters changed:', filters)
  console.log('📤 Sending to backend:', { country: filters.country, province: filters.region })
  currentPage.value = 1
  isInitialLoad.value = false // Reset to use table loading
  loadPatients(filters)
}

// Handle geography loaded event from DataTable
function handleGeographyLoaded(firstCountry: { code: string; name: string }) {
  console.log('🌍 Geography loaded with first country:', firstCountry)
  // Load patients with first country as default filter
  loadPatients({ country: firstCountry.name, region: '' })
}

// Handle patient actions
function handleEditPatient(patient: Patient) {
  editingPatient.value = patient
  isEditModalOpen.value = true
}

function handleSavePatient(updatedPatient: Patient) {
  console.log('Saving updated patient:', updatedPatient)
  // TODO: Implement API call to save patient
  // For now, just update local state
  const index = patients.value.findIndex(p => p.id === updatedPatient.id)
  if (index !== -1) {
    patients.value[index] = updatedPatient
  }
}

function handleSendSms(patient: Patient) {
  console.log('Send SMS to patient:', patient)
  // TODO: Implement SMS sending
}

function handleSendEmail(patient: Patient) {
  console.log('Send email to patient:', patient)
  // TODO: Implement email sending
}

function handleFixAddress(patient: Patient) {
  console.log('Fix address for patient:', patient)
  // TODO: Implement address fixing
}

function handleDeletePatient(patient: Patient) {
  if (confirm(`Are you sure you want to delete ${patient.firstName} ${patient.lastName}?`)) {
    console.log('Delete patient:', patient)
    // TODO: Implement delete patient
  }
}

// Bulk actions
function handleBulkEdit(patients: Patient[]) {
  console.log('Bulk edit patients:', patients)
  // TODO: Implement bulk edit
}

function handleBulkSendSms(patients: Patient[]) {
  console.log('Bulk send SMS to patients:', patients)
  // TODO: Implement bulk SMS
}

function handleBulkSendEmail(patients: Patient[]) {
  console.log('Bulk send email to patients:', patients)
  // TODO: Implement bulk email
}

function handleBulkFixAddress(patients: Patient[]) {
  console.log('Bulk fix address for patients:', patients)
  // TODO: Implement bulk address fix
}

function handleBulkDelete(patients: Patient[]) {
  if (confirm(`Are you sure you want to delete ${patients.length} patients?`)) {
    console.log('Bulk delete patients:', patients)
    // TODO: Implement bulk delete
  }
}

// Pagination handlers
function handlePageChange(page: number) {
  currentPage.value = page
  loadPatients({ country: '', region: '' })
}

function handleItemsPerPageChange(items: number) {
  itemsPerPage.value = items
  currentPage.value = 1
  loadPatients({ country: '', region: '' })
}



// Load data on mount
onMounted(() => {
  // DataTable will emit geography-loaded event when geography is loaded
  // We don't need to call loadPatients here - it will be called by handleGeographyLoaded
})
</script>

<template>
  <ContactsLayout>
    <!-- Header slot -->
    <template #title>Patients</template>


    <template #actions>
      <button class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
        Add Patient
      </button>
      <button class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
        Export
      </button>
      <button class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500">
        Import
      </button>
    </template>

    <!-- Content slot -->
    <template #content>
      <!-- Loading state -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p class="text-gray-600">Loading patients...</p>
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
            <h3 class="text-sm font-medium text-red-800">Error loading patients</h3>
            <p class="mt-1 text-sm text-red-700">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Data table -->
      <div v-else>
        <DataTable
          :data="patients"
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
              <EditAction :item="item" @edit="handleEditPatient" />
              <FixAddressAction :item="item" @fix-address="handleFixAddress" />
              <SendSmsAction :item="item" @send-sms="handleSendSms" />
              <SendEmailAction :item="item" @send-email="handleSendEmail" />
              <DeleteAction :item="item" @delete="handleDeletePatient" />
            </div>
          </template>

          <!-- Custom cell content -->
          <template #cell-status="{ value }">
            <span
              class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
              :class="{
                'bg-green-100 text-green-800': value === 'active',
                'bg-red-100 text-red-800': value === 'inactive'
              }"
            >
              {{ (value as string).charAt(0).toUpperCase() + (value as string).slice(1) }}
            </span>
          </template>

          <template #cell-phone="{ value }">
            <a :href="`tel:${value as string}`" class="text-blue-600 hover:text-blue-800">
              {{ value }}
            </a>
          </template>

          <template #cell-email="{ value }">
            <a :href="`mailto:${value as string}`" class="text-blue-600 hover:text-blue-800">
              {{ value }}
            </a>
          </template>

          <template #cell-date_of_birth="{ value }">
            <span v-if="value">{{ new Date(value as string).toLocaleDateString() }}</span>
            <span v-else class="text-gray-400">-</span>
          </template>

          <template #cell-allergies="{ value }">
            <span v-if="value && (value as any[]).length > 0" class="text-sm text-gray-600">
              {{ (value as any[]).join(', ') }}
            </span>
            <span v-else class="text-gray-400">None</span>
          </template>
        </DataTable>
      </div>
    </template>


  </ContactsLayout>

  <!-- Edit Patient Modal -->
  <EditPatientModal
    :is-open="isEditModalOpen"
    :patient="editingPatient"
    @close="isEditModalOpen = false"
    @save="handleSavePatient"
  />
</template>

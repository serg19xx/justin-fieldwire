<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import ContactsLayout from '@/components/ContactsLayout.vue'
import DataTable from '@/components/DataTable.vue'

// Mock data - replace with real API call
const clinics = ref([
  {
    id: 1,
    name: 'Downtown Medical Center',
    email: 'info@downtownmedical.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main St, Downtown',
    type: 'general',
    status: 'operational',
    size: 'large',
    capacity: 85,
    staff: 45,
    manager: 'Dr. Jennifer Smith'
  },
  {
    id: 2,
    name: 'Cardiology Specialists',
    email: 'contact@cardiospecialists.com',
    phone: '+1 (555) 987-6543',
    address: '456 Heart Ave, Medical District',
    type: 'specialty',
    status: 'operational',
    size: 'medium',
    capacity: 92,
    staff: 25,
    manager: 'Dr. Robert Johnson'
  },
  {
    id: 3,
    name: 'Urgent Care Express',
    email: 'hello@urgentcare.com',
    phone: '+1 (555) 456-7890',
    address: '789 Emergency Blvd, West Side',
    type: 'urgent_care',
    status: 'maintenance',
    size: 'small',
    capacity: 0,
    staff: 8,
    manager: 'Nurse Sarah Wilson'
  },
  {
    id: 4,
    name: 'Diagnostic Imaging Center',
    email: 'info@diagnosticimaging.com',
    phone: '+1 (555) 321-0987',
    address: '321 Scan Dr, South End',
    type: 'diagnostic',
    status: 'operational',
    size: 'medium',
    capacity: 78,
    staff: 18,
    manager: 'Dr. Michael Chen'
  }
])

const columns = [
  { key: 'name', label: 'Clinic Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'phone', label: 'Phone', sortable: true },
  { key: 'address', label: 'Address', sortable: true },
  { key: 'type', label: 'Type', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'size', label: 'Size', sortable: true },
  { key: 'capacity', label: 'Capacity %', sortable: true },
  { key: 'staff', label: 'Staff Count', sortable: true },
  { key: 'manager', label: 'Manager', sortable: true }
]

// Computed properties for footer info
const operationalClinics = computed(() =>
  clinics.value.filter(clinic => clinic.status === 'operational').length
)

const maintenanceClinics = computed(() =>
  clinics.value.filter(clinic => clinic.status === 'maintenance').length
)

onMounted(() => {
  // Load clinics data from API
  console.log('Loading clinics...')
})
</script>

<template>
  <ContactsLayout>
    <!-- Header slot -->
    <template #title>Medical Clinics & Offices</template>


    <template #actions>
      <button class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
        Add Clinic
      </button>
      <button class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
        Equipment
      </button>
      <button class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500">
        Maintenance
      </button>
    </template>

    <!-- Content slot -->
    <template #content>
      <DataTable
        :data="clinics"
        :columns="columns"
        :items-per-page="15"
      >
        <!-- Custom filters -->
        <template #filters>
          <select class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option value="">All Status</option>
            <option value="operational">Operational</option>
            <option value="maintenance">Maintenance</option>
            <option value="closed">Closed</option>
          </select>
          <select class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option value="">All Types</option>
            <option value="general">General Practice</option>
            <option value="specialty">Specialty Clinic</option>
            <option value="urgent_care">Urgent Care</option>
            <option value="diagnostic">Diagnostic Center</option>
          </select>
          <select class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option value="">All Sizes</option>
            <option value="small">Small (1-10 staff)</option>
            <option value="medium">Medium (11-50 staff)</option>
            <option value="large">Large (50+ staff)</option>
          </select>
        </template>

        <!-- Custom row actions -->
        <template #row-actions="{ item }">
          <button class="text-blue-600 hover:text-blue-900 mr-3">View</button>
          <button class="text-green-600 hover:text-green-900 mr-3">Edit</button>
          <button class="text-purple-600 hover:text-purple-900 mr-3">Equipment</button>
          <button class="text-red-600 hover:text-red-900">Delete</button>
        </template>

        <!-- Custom cell content -->
        <template #cell-status="{ value }">
          <span
            class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
            :class="{
              'bg-green-100 text-green-800': value === 'operational',
              'bg-yellow-100 text-yellow-800': value === 'maintenance',
              'bg-red-100 text-red-800': value === 'closed'
            }"
          >
            {{ value.charAt(0).toUpperCase() + value.slice(1) }}
          </span>
        </template>

        <template #cell-type="{ value }">
          <span
            class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
            :class="{
              'bg-blue-100 text-blue-800': value === 'general',
              'bg-purple-100 text-purple-800': value === 'specialty',
              'bg-orange-100 text-orange-800': value === 'urgent_care',
              'bg-green-100 text-green-800': value === 'diagnostic'
            }"
          >
            {{ value.replace('_', ' ').toUpperCase() }}
          </span>
        </template>

        <template #cell-size="{ value }">
          <span
            class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
            :class="{
              'bg-gray-100 text-gray-800': value === 'small',
              'bg-blue-100 text-blue-800': value === 'medium',
              'bg-purple-100 text-purple-800': value === 'large'
            }"
          >
            {{ value.charAt(0).toUpperCase() + value.slice(1) }}
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

        <template #cell-capacity="{ value }">
          <span
            class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
            :class="{
              'bg-green-100 text-green-800': value >= 80,
              'bg-yellow-100 text-yellow-800': value >= 50 && value < 80,
              'bg-red-100 text-red-800': value < 50
            }"
          >
            {{ value }}%
          </span>
        </template>
      </DataTable>
    </template>

    <!-- Footer slot -->
    <template #info>
      Total: {{ clinics.length }} clinics | Operational: {{ operationalClinics }} | Maintenance: {{ maintenanceClinics }}
    </template>
  </ContactsLayout>
</template>

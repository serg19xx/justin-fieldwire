<script setup lang="ts">
import { ref } from 'vue'

const contacts = ref([
  {
    id: 1,
    name: 'Dr. Sarah Johnson',
    type: 'Physician',
    email: 'sarah.johnson@clinic.com',
    phone: '+1 (555) 123-4567',
    organization: 'Downtown Medical Clinic',
    status: 'Active',
    lastContact: '2024-01-15',
  },
  {
    id: 2,
    name: 'Mike Construction',
    type: 'Contractor',
    email: 'mike@construction.com',
    phone: '+1 (555) 987-6543',
    organization: 'BuildRight Construction',
    status: 'Active',
    lastContact: '2024-01-14',
  },
  {
    id: 3,
    name: 'Pharmacy Plus',
    type: 'Pharmacy',
    email: 'info@pharmacyplus.com',
    phone: '+1 (555) 456-7890',
    organization: 'Pharmacy Plus Chain',
    status: 'Active',
    lastContact: '2024-01-13',
  },
  {
    id: 4,
    name: 'John Smith',
    type: 'Patient',
    email: 'john.smith@email.com',
    phone: '+1 (555) 111-2222',
    organization: 'Individual',
    status: 'Active',
    lastContact: '2024-01-12',
  },
  {
    id: 5,
    name: 'David Wilson',
    type: 'Driver',
    email: 'david.wilson@delivery.com',
    phone: '+1 (555) 333-4444',
    organization: 'Express Delivery',
    status: 'Active',
    lastContact: '2024-01-11',
  },
  {
    id: 6,
    name: 'City Medical Center',
    type: 'Medical Clinic',
    email: 'info@citymedical.com',
    phone: '+1 (555) 555-6666',
    organization: 'City Medical Center',
    status: 'Active',
    lastContact: '2024-01-10',
  },
])

const statusFilter = ref('all')
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div class="flex space-x-3">
        <button class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          + Add Contact
        </button>
        <button class="bg-white text-gray-700 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50">
          Import Contacts
        </button>
      </div>
      <div class="flex space-x-2">
        <select
          v-model="statusFilter"
          class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>
    </div>

    <div class="bg-white shadow rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">All Contacts</h3>
      </div>
      <div class="divide-y divide-gray-200">
        <div
          v-for="contact in contacts"
          :key="contact.id"
          class="px-6 py-4 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-medium text-gray-900">{{ contact.name }}</h4>
                <div class="flex items-center space-x-2">
                  <span
                    :class="
                      contact.type === 'Physician'
                        ? 'bg-blue-100 text-blue-800'
                        : contact.type === 'Contractor'
                          ? 'bg-orange-100 text-orange-800'
                          : contact.type === 'Pharmacy'
                            ? 'bg-green-100 text-green-800'
                            : contact.type === 'Patient'
                              ? 'bg-purple-100 text-purple-800'
                              : contact.type === 'Driver'
                                ? 'bg-yellow-100 text-yellow-800'
                                : contact.type === 'Medical Clinic'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : 'bg-gray-100 text-gray-800'
                    "
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  >
                    {{ contact.type }}
                  </span>
                  <span
                    :class="
                      contact.status === 'Active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    "
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  >
                    {{ contact.status }}
                  </span>
                </div>
              </div>
              <p class="mt-1 text-sm text-gray-500">{{ contact.organization }}</p>
              <div class="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                <span>{{ contact.email }}</span>
                <span>{{ contact.phone }}</span>
                <span>Last contact: {{ contact.lastContact }}</span>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <button class="text-blue-600 hover:text-blue-800 text-sm font-medium">Edit</button>
              <button class="text-green-600 hover:text-green-800 text-sm font-medium">Message</button>
              <button class="text-gray-400 hover:text-gray-600">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  ></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

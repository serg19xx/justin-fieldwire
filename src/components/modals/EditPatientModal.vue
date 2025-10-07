<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" @click="closeModal"></div>

    <!-- Modal -->
    <div class="flex min-h-full items-center justify-center p-4">
      <div class="relative w-full max-w-2xl bg-white rounded-lg shadow-xl">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">
            Edit Patient: {{ patient?.firstName }} {{ patient?.lastName }}
          </h3>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
          <!-- Personal Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              <input
                v-model="form.firstName"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <input
                v-model="form.lastName"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                v-model="form.email"
                type="email"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                v-model="form.phone"
                type="tel"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Cell Phone</label>
              <input
                v-model="form.cell"
                type="tel"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
              <input
                v-model="form.dateOfBirth"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <!-- Address -->
          <div class="space-y-4">
            <h4 class="text-md font-medium text-gray-900">Address</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                <input
                  v-model="form.streetAddress"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  v-model="form.city"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Province/State</label>
                <input
                  v-model="form.province"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                <input
                  v-model="form.postalCode"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Country</label>
                <input
                  v-model="form.country"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <!-- Medical Information -->
          <div class="space-y-4">
            <h4 class="text-md font-medium text-gray-900">Medical Information</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
                <input
                  v-model="form.allergies"
                  type="text"
                  placeholder="Separate with commas"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  v-model="form.status"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Additional Info -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"
              >Additional Information</label
            >
            <textarea
              v-model="form.additionalInfo"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>
        </form>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            @click="closeModal"
            class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="handleSubmit"
            :disabled="loading"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="loading" class="flex items-center gap-2">
              <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Saving...
            </span>
            <span v-else>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Patient {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  cell?: string
  dateOfBirth?: string
  streetAddress?: string
  city?: string
  province?: string
  postalCode?: string
  country?: string
  allergies?: string
  status?: string
  additionalInfo?: string
}

interface Props {
  isOpen: boolean
  patient: Patient | null
}

interface Emits {
  close: []
  save: [patient: Patient]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const loading = ref(false)

// Form data
const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  cell: '',
  dateOfBirth: '',
  streetAddress: '',
  city: '',
  province: '',
  postalCode: '',
  country: '',
  allergies: '',
  status: 'active',
  additionalInfo: '',
})

// Watch for patient changes and populate form
watch(
  () => props.patient,
  (newPatient) => {
    if (newPatient) {
      form.value = {
        firstName: newPatient.firstName || '',
        lastName: newPatient.lastName || '',
        email: newPatient.email || '',
        phone: newPatient.phone || '',
        cell: newPatient.cell || '',
        dateOfBirth: newPatient.dateOfBirth || '',
        streetAddress: newPatient.streetAddress || '',
        city: newPatient.city || '',
        province: newPatient.province || '',
        postalCode: newPatient.postalCode || '',
        country: newPatient.country || '',
        allergies: newPatient.allergies || '',
        status: newPatient.status || 'active',
        additionalInfo: newPatient.additionalInfo || '',
      }
    }
  },
  { immediate: true },
)

function closeModal() {
  emit('close')
}

async function handleSubmit() {
  if (!props.patient) return

  loading.value = true

  try {
    // Create updated patient object
    const updatedPatient: Patient = {
      ...props.patient,
      firstName: form.value.firstName,
      lastName: form.value.lastName,
      email: form.value.email,
      phone: form.value.phone,
      cell: form.value.cell,
      dateOfBirth: form.value.dateOfBirth,
      streetAddress: form.value.streetAddress,
      city: form.value.city,
      province: form.value.province,
      postalCode: form.value.postalCode,
      country: form.value.country,
      status: form.value.status,
      additionalInfo: form.value.additionalInfo,
    }

    // Emit save event
    emit('save', updatedPatient)

    // Close modal
    closeModal()
  } catch (error) {
    console.error('Error saving patient:', error)
  } finally {
    loading.value = false
  }
}
</script>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/core/utils/api'
import { getRoles } from '@/core/utils/hr-api'

interface Props {
  isOpen: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'invite-sent', data: {
    email: string;
    firstName: string;
    lastName: string;
    userType: string;
    specialization?: string;
    phone?: string;
  }): void
}

const { isOpen } = defineProps<Props>()
const emit = defineEmits<Emits>()

const email = ref('')
const firstName = ref('')
const lastName = ref('')
const userType = ref('')
const specialization = ref('')
const phone = ref('')
const isLoading = ref(false)
const error = ref('')

// Phone formatting function
function formatPhoneNumber(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '')

  // If empty, return empty
  if (!digits) return ''

  // If starts with 1, format as +1NNNNNNNNNN
  if (digits.startsWith('1') && digits.length <= 11) {
    return `+1${digits.slice(1)}`
  }

  // If doesn't start with 1, add +1 prefix
  if (digits.length <= 10) {
    return `+1${digits}`
  }

  // If too long, truncate to 10 digits after +1
  return `+1${digits.slice(0, 10)}`
}

function handlePhoneInput(event: Event) {
  const target = event.target as HTMLInputElement
  const formatted = formatPhoneNumber(target.value)
  phone.value = formatted
}

// Roles from database
const availableRoles = ref<Array<{
  id: number
  code: string
  name: string
  category: string
  description: string
}>>([])

// Load roles from database
onMounted(async () => {
  try {
    console.log('🔍 Loading roles for invitation dialog...')
    availableRoles.value = await getRoles()
    console.log('✅ Roles loaded:', availableRoles.value.length)
  } catch (error) {
    console.error('❌ Failed to load roles:', error)
    // Fallback to empty array
    availableRoles.value = []
  }
})

// Specializations for different user types
const specializationsByType = {
  'contractor': [
    'HVAC',
    'Electrician',
    'Plumbing',
    'Demolition',
    'Framing',
    'Drywall',
    'Taping',
    'Network & IT',
    'Flooring',
    'Stone Work',
    'Concrete Work',
    'Doors',
    'Handyman & Labourer',
    'Finish & Design',
    'Commercial Cleaner',
    'Painter',
    'Ceiling & T-Bar',
    'Millwork'
  ],
  'foreman': [
    'Foreman',
    'General Labourer'
  ],
  'worker': [
    'General Labourer',
    'Skilled Worker',
    'Apprentice'
  ]
}

// Computed property to get available specializations for selected user type
const availableSpecializations = computed(() => {
  return specializationsByType[userType.value as keyof typeof specializationsByType] || []
})

// Computed property to check if specialization is required
const isSpecializationRequired = computed(() => {
  return availableSpecializations.value.length > 0
})

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

async function sendInvitation() {
  // Сброс ошибок
  error.value = ''

  // Валидация полей
  if (!firstName.value.trim()) {
    error.value = 'First name is required'
    return
  }

  if (!lastName.value.trim()) {
    error.value = 'Last name is required'
    return
  }

  if (!email.value.trim()) {
    error.value = 'Email is required'
    return
  }

  if (!validateEmail(email.value.trim())) {
    error.value = 'Please enter a valid email address'
    return
  }

  if (!userType.value) {
    error.value = 'User type is required'
    return
  }

  if (isSpecializationRequired.value && !specialization.value) {
    error.value = 'Specialization is required for this user type'
    return
  }

  isLoading.value = true

  try {
    // Find the selected role to get the role_id
    const selectedRole = availableRoles.value.find(role => role.code === userType.value)
    if (!selectedRole) {
      error.value = 'Invalid user type selected'
      return
    }

    const inviteData = {
      email: email.value.trim(),
      first_name: firstName.value.trim(),
      last_name: lastName.value.trim(),
      role_id: selectedRole.id, // Send role_id as number
      user_type: userType.value, // Keep user_type as string for compatibility
      job_title: specialization.value || null,
      phone: phone.value.trim() || null,
    }

    console.log('📤 Sending invitation with data:', inviteData)
    console.log('🔍 Selected role:', selectedRole)

    const response = await api.post('/api/v1/workers/invite', inviteData)

    if (response.data.success) {
      emit('invite-sent', {
        email: email.value.trim(),
        firstName: firstName.value.trim(),
        lastName: lastName.value.trim(),
        userType: userType.value,
        specialization: specialization.value || undefined,
        phone: phone.value.trim() || undefined,
      })
      // Очистка формы
      email.value = ''
      firstName.value = ''
      lastName.value = ''
      userType.value = ''
      specialization.value = ''
      phone.value = ''
      emit('close')
    } else {
      error.value = response.data.message || 'Failed to send invitation'
    }
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { message?: string } }; message?: string }
    error.value = axiosError.response?.data?.message || axiosError.message || 'Failed to send invitation'
  } finally {
    isLoading.value = false
  }
}

function closeDialog() {
  if (!isLoading.value) {
    email.value = ''
    firstName.value = ''
    lastName.value = ''
    userType.value = ''
    specialization.value = ''
    phone.value = ''
    error.value = ''
    emit('close')
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto" @click.self="closeDialog">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"></div>

    <!-- Dialog -->
    <div class="flex min-h-full items-center justify-center p-2 sm:p-4">
      <div class="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
        <!-- Header -->
        <div class="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <h3 class="text-base sm:text-lg font-medium text-gray-900">Invite Builder</h3>
          <p class="mt-1 text-xs sm:text-sm text-gray-500">
            Send an invitation email to join the system
          </p>
        </div>

        <!-- Content -->
        <div class="px-4 sm:px-6 py-3 sm:py-4">
          <form @submit.prevent="sendInvitation">
            <div class="space-y-3 sm:space-y-4">
              <!-- First Name Input -->
              <div>
                <label
                  for="firstName"
                  class="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
                >
                  First Name *
                </label>
                <input
                  id="firstName"
                  v-model="firstName"
                  type="text"
                  placeholder="Enter first name"
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  :disabled="isLoading"
                  required
                />
              </div>

              <!-- Last Name Input -->
              <div>
                <label
                  for="lastName"
                  class="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
                >
                  Last Name *
                </label>
                <input
                  id="lastName"
                  v-model="lastName"
                  type="text"
                  placeholder="Enter last name"
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  :disabled="isLoading"
                  required
                />
              </div>

              <!-- Email Input -->
              <div>
                <label for="email" class="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  id="email"
                  v-model="email"
                  type="email"
                  placeholder="Enter email address"
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  :disabled="isLoading"
                  required
                />
              </div>

              <!-- Phone Input -->
              <div>
                <label for="phone" class="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  id="phone"
                  v-model="phone"
                  type="tel"
                  @input="handlePhoneInput"
                  placeholder="+1__________ (optional)"
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  :disabled="isLoading"
                  maxlength="12"
                />
                <p class="mt-1 text-xs text-gray-500">Format: +1 followed by 10 digits (e.g., +1234567890)</p>
              </div>

              <!-- User Type Select -->
              <div>
                <label for="userType" class="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  User Type *
                </label>
                <select
                  id="userType"
                  v-model="userType"
                  @change="specialization = ''"
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  :disabled="isLoading"
                  required
                >
                  <option value="">Select user type</option>
                  <option v-for="role in availableRoles" :key="role.id" :value="role.code">
                    {{ role.name }} ({{ role.category }})
                  </option>
                </select>
              </div>

              <!-- Specialization Select (conditional) -->
              <div v-if="isSpecializationRequired">
                <label for="specialization" class="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Specialization *
                </label>
                <select
                  id="specialization"
                  v-model="specialization"
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  :disabled="isLoading"
                  required
                >
                  <option value="">Select specialization</option>
                  <option v-for="spec in availableSpecializations" :key="spec" :value="spec">
                    {{ spec }}
                  </option>
                </select>
              </div>

              <!-- Error Message -->
              <div
                v-if="error"
                class="text-xs sm:text-sm text-red-600 bg-red-50 p-2 sm:p-3 rounded-md"
              >
                {{ error }}
              </div>
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div
          class="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-row justify-end space-x-2 sm:space-x-3"
        >
          <button
            type="button"
            @click="closeDialog"
            class="flex-1 sm:flex-none px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            :disabled="isLoading"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="sendInvitation"
            class="flex-1 sm:flex-none px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isLoading || !email.trim() || !firstName.trim() || !lastName.trim() || !userType || (isSpecializationRequired && !specialization)"
          >
            <span v-if="isLoading" class="flex items-center justify-center">
              <svg
                class="animate-spin -ml-1 mr-1 h-3 w-3 sm:h-4 sm:w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
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
              <span class="text-xs">Send</span>
            </span>
            <span v-else class="text-xs sm:text-sm">Send</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { api } from '@/core/utils/api'
import { useAuthStore } from '@/core/stores/auth'

interface Props {
  isOpen: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  success: []
}>()

const phone = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const authStore = useAuthStore()

async function enableTwoFactor() {
  if (!phone.value) {
    errorMessage.value = 'Please enter your phone number'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    console.log('📱 Enabling 2FA for phone:', phone.value)

    const result = await authStore.enableTwoFactor(phone.value)

    if (result.success) {
      successMessage.value = '2FA enabled successfully! You will receive SMS codes for future logins.'
      setTimeout(() => {
        emit('success')
      }, 2000)
    } else {
      errorMessage.value = result.error || 'Failed to enable 2FA'
    }
  } catch (error: unknown) {
    console.error('❌ 2FA setup error:', error)

    // Обработка ошибок от бэкенда
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string } } }
      if (axiosError.response?.data?.message) {
        errorMessage.value = axiosError.response.data.message
      } else {
        errorMessage.value = 'Failed to enable 2FA'
      }
    } else {
      const errorMessage = error instanceof Error ? error.message : 'Failed to enable 2FA'
      errorMessage.value = errorMessage
    }
  } finally {
    isLoading.value = false
  }
}

function handleClose() {
  phone.value = ''
  errorMessage.value = ''
  successMessage.value = ''
  emit('close')
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
  >
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900">Enable Two-Factor Authentication</h3>
          <button
            @click="handleClose"
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Description -->
        <p class="text-sm text-gray-600 mb-6">
          Enter your phone number to receive SMS verification codes for enhanced security.
        </p>

        <!-- Error Message -->
        <div v-if="errorMessage" class="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
          <p class="text-sm text-red-800">{{ errorMessage }}</p>
        </div>

        <!-- Success Message -->
        <div v-if="successMessage" class="mb-4 bg-green-50 border border-green-200 rounded-md p-3">
          <p class="text-sm text-green-800">{{ successMessage }}</p>
        </div>

        <!-- Phone Input -->
        <div class="mb-6">
          <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            id="phone"
            v-model="phone"
            type="tel"
            placeholder="+1 (555) 123-4567"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            :disabled="isLoading"
          />
          <p class="mt-2 text-xs text-gray-500">
            Include country code (e.g., +1 for US/Canada)
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex space-x-3">
          <button
            @click="handleClose"
            :disabled="isLoading"
            class="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            @click="enableTwoFactor"
            :disabled="isLoading || !phone"
            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center justify-center"
          >
            <svg
              v-if="isLoading"
              class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
            {{ isLoading ? 'Enabling...' : 'Enable 2FA' }}
          </button>
        </div>

        <!-- Info -->
        <div class="mt-4 text-xs text-gray-500">
          <p>• You'll receive a test SMS to verify your number</p>
          <p>• Future logins will require a 6-digit code</p>
          <p>• You can disable 2FA anytime in your account settings</p>
        </div>
      </div>
    </div>
  </div>
</template>

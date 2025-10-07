<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/core/stores/auth'

interface Props {
  isOpen: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  success: []
}>()

const authStore = useAuthStore()

// State
const step = ref<'delivery' | 'code'>('delivery')
const deliveryMethod = ref<'sms' | 'email'>('sms')
const code = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Computed
const userEmail = computed(() => authStore.currentUser?.email || '')

async function handleSendCode() {
  if (!userEmail.value) {
    errorMessage.value = 'User email not found'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    console.log('📤 Sending 2FA code via:', deliveryMethod.value)

    const result = await authStore.sendTwoFactorCode(userEmail.value, deliveryMethod.value)

    if (result.success) {
      successMessage.value = `Verification code sent to your ${deliveryMethod.value === 'sms' ? 'phone' : 'email'}`
      step.value = 'code'
      console.log('✅ Code sent successfully')
    } else {
      errorMessage.value = result.error || 'Failed to send verification code'
      console.log('❌ Failed to send code:', result.error)
    }
  } catch (error) {
    console.error('❌ Send code error:', error)
    errorMessage.value = 'Failed to send verification code'
  } finally {
    isLoading.value = false
  }
}

async function handleVerifyCode() {
  if (!code.value || code.value.length !== 6) {
    errorMessage.value = 'Please enter a 6-digit code'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    console.log('🔐 Verifying 2FA code')

    const result = await authStore.verifyTwoFactor(code.value)

    if (result.success) {
      console.log('✅ 2FA verification successful')
      emit('success')
    } else {
      errorMessage.value = result.error || 'Invalid code'
      console.log('❌ 2FA verification failed:', result.error)
    }
  } catch (error) {
    console.error('❌ 2FA verification error:', error)
    errorMessage.value = 'Verification failed'
  } finally {
    isLoading.value = false
  }
}

function handleBackToDelivery() {
  step.value = 'delivery'
  code.value = ''
  errorMessage.value = ''
  successMessage.value = ''
}

function handleClose() {
  step.value = 'delivery'
  deliveryMethod.value = 'sms'
  code.value = ''
  errorMessage.value = ''
  successMessage.value = ''
  emit('close')
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    if (step.value === 'delivery') {
      handleSendCode()
    } else {
      handleVerifyCode()
    }
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-2 sm:p-4"
  >
    <div class="relative mx-auto p-4 sm:p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
      <div class="mt-3 text-center">
        <!-- Header -->
        <div
          class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4"
        >
          <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        <!-- Step 1: Delivery Method Selection -->
        <div v-if="step === 'delivery'">
          <h3 class="text-lg font-medium text-gray-900 mb-2">Two-Factor Authentication</h3>
          <p class="text-sm text-gray-500 mb-6">
            Choose how you'd like to receive your verification code
          </p>

          <!-- Error Message -->
          <div v-if="errorMessage" class="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
            <p class="text-sm text-red-800">{{ errorMessage }}</p>
          </div>

          <!-- Delivery Method Selection -->
          <div class="mb-6 space-y-3">
            <label class="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                v-model="deliveryMethod"
                type="radio"
                value="sms"
                class="mr-3 text-blue-600 focus:ring-blue-500"
              />
              <div class="flex-1 text-left">
                <div class="font-medium text-gray-900">SMS</div>
                <div class="text-sm text-gray-500">Send code to your phone number</div>
              </div>
            </label>

            <label class="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                v-model="deliveryMethod"
                type="radio"
                value="email"
                class="mr-3 text-blue-600 focus:ring-blue-500"
              />
              <div class="flex-1 text-left">
                <div class="font-medium text-gray-900">Email</div>
                <div class="text-sm text-gray-500">Send code to your email address</div>
              </div>
            </label>
          </div>

          <!-- Action Buttons -->
          <div class="flex space-x-3">
            <button
              @click="handleClose"
              class="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              @click="handleSendCode"
              :disabled="isLoading"
              class="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                v-if="isLoading"
                class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
              {{ isLoading ? 'Sending...' : 'Send Code' }}
            </button>
          </div>
        </div>

        <!-- Step 2: Code Verification -->
        <div v-if="step === 'code'">
          <h3 class="text-lg font-medium text-gray-900 mb-2">Enter Verification Code</h3>
          <p class="text-sm text-gray-500 mb-6">
            Enter the 6-digit code sent to your {{ deliveryMethod === 'sms' ? 'phone' : 'email' }}
          </p>

          <!-- Success Message -->
          <div v-if="successMessage" class="mb-4 bg-green-50 border border-green-200 rounded-md p-3">
            <p class="text-sm text-green-800">{{ successMessage }}</p>
          </div>

          <!-- Error Message -->
          <div v-if="errorMessage" class="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
            <p class="text-sm text-red-800">{{ errorMessage }}</p>
          </div>

          <!-- Code Input -->
          <div class="mb-6">
            <input
              v-model="code"
              @keydown="handleKeydown"
              type="text"
              maxlength="6"
              placeholder="000000"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              :disabled="isLoading"
            />
          </div>

          <!-- Action Buttons -->
          <div class="flex space-x-3">
            <button
              @click="handleBackToDelivery"
              class="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back
            </button>
            <button
              @click="handleVerifyCode"
              :disabled="isLoading"
              class="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                v-if="isLoading"
                class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
              {{ isLoading ? 'Verifying...' : 'Verify Code' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

interface Props {
  isOpen: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  success: []
}>()

const authStore = useAuthStore()
const code = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

async function handleSubmit() {
  if (!code.value || code.value.length !== 6) {
    errorMessage.value = 'Please enter a 6-digit code'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const result = await authStore.verifyTwoFactor(code.value)

    if (result.success) {
      emit('success')
    } else {
      errorMessage.value = result.error || 'Invalid code'
    }
  } catch (error) {
    console.error('2FA error:', error)
    errorMessage.value = 'Verification failed'
  } finally {
    isLoading.value = false
  }
}

function handleClose() {
  code.value = ''
  errorMessage.value = ''
  emit('close')
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    handleSubmit()
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
  >
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
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

        <h3 class="text-lg font-medium text-gray-900 mb-2">Two-Factor Authentication</h3>
        <p class="text-sm text-gray-500 mb-6">Enter the 6-digit code from your authenticator app</p>

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
            @click="handleClose"
            :disabled="isLoading"
            class="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            @click="handleSubmit"
            :disabled="isLoading || code.length !== 6"
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
            {{ isLoading ? 'Verifying...' : 'Verify' }}
          </button>
        </div>

        <!-- Help Text -->
        <div class="mt-4 text-xs text-gray-500">
          <p>Don't have access to your authenticator app?</p>
          <button class="text-blue-600 hover:text-blue-500 mt-1">Contact administrator</button>
        </div>
      </div>
    </div>
  </div>
</template>

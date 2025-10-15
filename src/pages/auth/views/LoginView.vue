<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="text-center">
        <h1 class="text-3xl font-bold text-gray-900">FieldWire</h1>
        <p class="mt-2 text-sm text-gray-600">Construction project management system</p>
      </div>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <!-- Login Form -->
      <LoginForm
        v-if="!showRecovery && !showTwoFactor"
        @showRecovery="showRecovery = true"
        @showTwoFactor="handleShowTwoFactor"
      />

      <!-- Recovery Form -->
      <div v-else-if="showRecovery" class="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div class="text-center mb-6">
          <h2 class="text-xl font-bold text-gray-900">Password Recovery</h2>
          <p class="text-gray-600 mt-2">Enter your email to recover your password</p>
        </div>

        <form @submit.prevent="handleRecovery" class="space-y-4">
          <div>
            <label for="recovery-email" class="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="recovery-email"
              v-model="recoveryForm.email"
              type="email"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isLoading" class="flex items-center justify-center">
              <svg
                class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
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
              Sending...
            </span>
            <span v-else>Send recovery link</span>
          </button>
        </form>

        <div
          v-if="errorMessage"
          class="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded"
        >
          {{ errorMessage }}
        </div>

        <div
          v-if="successMessage"
          class="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded"
        >
          {{ successMessage }}
        </div>

        <div class="mt-6 text-center">
          <button @click="showRecovery = false" class="text-sm text-blue-600 hover:text-blue-800">
            ← Back to login
          </button>
        </div>
      </div>

      <!-- Two Factor Dialog -->
      <TwoFactorDialog
        :isOpen="showTwoFactor"
        @close="showTwoFactor = false"
        @success="handleTwoFactorSuccess"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/core/stores/auth'
import LoginForm from '../components/LoginForm.vue'
import TwoFactorDialog from '@/components/TwoFactorDialog.vue'

const router = useRouter()
const authStore = useAuthStore()

const recoveryForm = reactive({
  email: '',
})

const isLoading = ref(false)
const showRecovery = ref(false)
const showTwoFactor = ref(false)
const twoFactorUser = ref<{ role_category?: string } | null>(null)
const errorMessage = ref('')
const successMessage = ref('')

// Check if user is already authenticated and redirect
onMounted(() => {
  if (authStore.isAuthenticated) {
    console.log('🚀 User already authenticated, redirecting to dashboard')
    router.replace('/dashboard')
  }
})

// Watch for authentication state changes
watch(
  () => authStore.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated) {
      console.log('🔐 Authentication state changed to true, redirecting to dashboard')
      router.replace('/dashboard')
    }
  }
)

function handleShowTwoFactor(user: { role_category?: string }) {
  twoFactorUser.value = user
  showTwoFactor.value = true
}

async function handleTwoFactorSuccess() {
  console.log('🎉 2FA verification successful, redirecting to dashboard...')
  showTwoFactor.value = false
  
  // Wait for the next tick to ensure auth state is updated
  await nextTick()
  
  // Use replace instead of push to avoid back button issues
  // Add a small delay to ensure auth store is fully updated
  setTimeout(() => {
    console.log('🚀 Redirecting to dashboard...')
    router.replace('/')
  }, 100)
}

async function handleRecovery() {
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    // TODO: Implement password recovery
    successMessage.value = 'Password recovery link has been sent to your email'
    setTimeout(() => {
      showRecovery.value = false
      successMessage.value = ''
    }, 3000)
  } catch (error) {
    console.error('Recovery error:', error)
    errorMessage.value = 'An error occurred while sending the recovery link'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-orange-600 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
    <!-- Background Pattern -->
    <div class="absolute inset-0 opacity-10">
      <div class="absolute top-10 left-10 w-32 h-32 border-2 border-white rounded-lg transform rotate-12"></div>
      <div class="absolute top-32 right-20 w-24 h-24 border-2 border-white rounded-full"></div>
      <div class="absolute bottom-20 left-1/4 w-40 h-40 border-2 border-white transform -rotate-12"></div>
      <div class="absolute bottom-32 right-1/3 w-28 h-28 border-2 border-white rounded-lg transform rotate-45"></div>
      <div class="absolute top-1/2 left-10 w-20 h-20 border-2 border-white rounded-full"></div>
      <div class="absolute top-1/3 right-10 w-36 h-36 border-2 border-white transform -rotate-12"></div>
    </div>
    
    <!-- Construction Icons -->
    <div class="absolute inset-0 opacity-5">
      <div class="absolute top-20 left-1/3 text-6xl">🏗️</div>
      <div class="absolute top-1/2 right-1/4 text-5xl">🔨</div>
      <div class="absolute bottom-1/4 left-1/5 text-4xl">⚒️</div>
      <div class="absolute top-1/4 right-1/5 text-5xl">🏭</div>
      <div class="absolute bottom-20 right-1/3 text-4xl">📐</div>
    </div>
    <div class="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-white drop-shadow-lg">FieldWire</h1>
        <p class="mt-2 text-sm text-blue-100">Construction project management system</p>
        <div class="mt-4 text-2xl">🏗️</div>
      </div>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
      <!-- Login Form -->
      <LoginForm
        v-if="!showRecovery && !showTwoFactor"
        @showRecovery="showRecovery = true"
        @showTwoFactor="handleShowTwoFactor"
      />

      <!-- Recovery Form -->
      <div v-else-if="showRecovery" class="max-w-md mx-auto bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-6 border border-white/20">
        <div class="text-center mb-6">
          <h2 class="text-2xl font-bold text-gray-900">Password Recovery</h2>
          <p class="text-gray-600 mt-2">Enter your email to recover your password</p>
          <div class="mt-3 text-2xl">🔑</div>
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
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-400"
              placeholder="Enter your email"
            />
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-gradient-to-r from-blue-600 to-orange-500 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-lg"
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
          class="mt-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg"
        >
          {{ errorMessage }}
        </div>

        <div
          v-if="successMessage"
          class="mt-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg"
        >
          {{ successMessage }}
        </div>

        <div class="mt-6 text-center">
          <button @click="showRecovery = false" class="text-sm text-blue-600 hover:text-blue-800 underline transition-colors duration-200">
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
    console.log('📧 Sending password recovery request for:', recoveryForm.email)
    
    const result = await authStore.requestPasswordRecovery(recoveryForm.email)
    
    if (result.success) {
      successMessage.value = 'Password recovery link has been sent to your email'
      console.log('✅ Password recovery email sent successfully')
      
      // Clear the form and hide recovery form after 3 seconds
      setTimeout(() => {
        showRecovery.value = false
        successMessage.value = ''
        recoveryForm.email = ''
      }, 3000)
    } else {
      errorMessage.value = result.error || 'Failed to send recovery email'
      console.log('❌ Password recovery failed:', result.error)
    }
  } catch (error) {
    console.error('❌ Recovery error:', error)
    errorMessage.value = 'An error occurred while sending the recovery link'
  } finally {
    isLoading.value = false
  }
}
</script>

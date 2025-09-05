<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import TwoFactorDialog from '@/components/TwoFactorDialog.vue'
import api from '@/utils/api'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const loginForm = reactive({
  email: '',
  password: '',
  rememberMe: false,
})

const recoveryForm = reactive({
  email: '',
})



const isLoading = ref(false)
const showRecovery = ref(false)
const showTwoFactor = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Token validation state
const invitationToken = ref('')
const isValidatingToken = ref(false)
const tokenValidationResult = ref<{
  valid: boolean
  message?: string
  user?: {
    email: string
    first_name: string
    last_name: string
    user_type: string
  }
} | null>(null)

// Form visibility state - initially hidden if token is present
const isFormVisible = ref(false)

async function handleLogin() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const result = await authStore.login(loginForm.email, loginForm.password)

    if (result.success) {
      if (result.requires2FA) {
        showTwoFactor.value = true
      } else {
        // Check if we have a valid token - redirect to password change
        if (tokenValidationResult.value?.valid) {
          router.push(`/password-change?token=${invitationToken.value}`)
        } else {
          // Normal login - redirect to dashboard
          router.push('/')
        }
      }
    } else {
      errorMessage.value = result.error || 'Invalid email or password'
    }
  } catch (error) {
    console.error('Login error:', error)
    errorMessage.value = 'Login failed. Please try again.'
  } finally {
    isLoading.value = false
  }
}

function handleTwoFactorSuccess() {
  // Check if we have a valid token - redirect to password change
  if (tokenValidationResult.value?.valid) {
    router.push(`/password-change?token=${invitationToken.value}`)
  } else {
    // Normal 2FA - redirect to dashboard
    router.push('/')
  }
}

async function handlePasswordRecovery() {
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    // Simulate password recovery
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const user = authStore.users.find((u) => u.email === recoveryForm.email)
    if (user) {
      successMessage.value = 'Password recovery email sent. Please check your inbox.'
      showRecovery.value = false
    } else {
      errorMessage.value = 'Email not found'
    }
  } catch {
    errorMessage.value = 'Password recovery failed'
  } finally {
    isLoading.value = false
  }
}

function toggleRecovery() {
  showRecovery.value = !showRecovery.value
  errorMessage.value = ''
  successMessage.value = ''
}

function backToLogin() {
  showTwoFactor.value = false
  showRecovery.value = false
  errorMessage.value = ''
  successMessage.value = ''
}

// Validate invitation token
async function validateInvitationToken(token: string) {
  isValidatingToken.value = true
  errorMessage.value = ''

  try {
    const response = await api.get(`/api/v1/registration/validate/${token}`)
    const result = response.data

    if (result.status === 'success' && result.data.valid) {
      tokenValidationResult.value = {
        valid: true,
        user: result.data.user
      }
      // Pre-fill email if token is valid
      loginForm.email = result.data.user.email
      successMessage.value = `Welcome ${result.data.user.first_name}! Please set your password to complete registration.`
      // Show form only if token is valid
      isFormVisible.value = true
    } else {
      tokenValidationResult.value = {
        valid: false,
        message: result.message || 'Invalid or expired invitation token'
      }
      errorMessage.value = result.message || 'Invalid or expired invitation token'
      // Keep form hidden if token is invalid
      isFormVisible.value = false
    }
  } catch (error) {
    console.error('Token validation error:', error)
    tokenValidationResult.value = {
      valid: false,
      message: 'Failed to validate invitation token'
    }
    errorMessage.value = 'Failed to validate invitation token'
    // Keep form hidden if token validation fails
    isFormVisible.value = false
  } finally {
    isValidatingToken.value = false
  }
}

// Check for token in URL on component mount
onMounted(() => {
  const token = route.query.token as string
  if (token) {
    invitationToken.value = token
    // Form is hidden by default when token is present
    isFormVisible.value = false
    validateInvitationToken(token)
  } else {
    // No token - show form immediately
    isFormVisible.value = true
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="flex justify-center">
        <div class="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            ></path>
          </svg>
        </div>
      </div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        {{
          isValidatingToken
            ? 'Validating Invitation...'
            : tokenValidationResult?.valid
              ? 'Complete Registration'
              : showRecovery
                ? 'Password Recovery'
                : showTwoFactor
                  ? 'Two-Factor Authentication'
                  : 'Sign in to FieldWire'
        }}
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        {{
          isValidatingToken
            ? 'Please wait while we validate your invitation...'
            : tokenValidationResult?.valid
              ? 'Set your password to complete your account setup'
              : showRecovery
                ? 'Enter your email to receive a password reset link'
                : showTwoFactor
                  ? 'Enter the 6-digit code from your authenticator app'
                  : 'Access your construction projects'
        }}
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <!-- Token Validation Loading -->
        <div v-if="isValidatingToken" class="mb-4 bg-blue-50 border border-blue-200 rounded-md p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg
                class="animate-spin h-5 w-5 text-blue-400"
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
            </div>
            <div class="ml-3">
              <p class="text-sm text-blue-800">Validating your invitation...</p>
            </div>
          </div>
        </div>

        <!-- Error/Success Messages -->
        <div v-if="errorMessage" class="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg
                class="h-5 w-5 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                ></path>
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-red-800">{{ errorMessage }}</p>
            </div>
          </div>
        </div>

        <div v-if="successMessage" class="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg
                class="h-5 w-5 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-green-800">{{ successMessage }}</p>
            </div>
          </div>
        </div>

        <!-- Login Form -->
        <form
          v-if="!showRecovery && !showTwoFactor && !isValidatingToken && isFormVisible"
          @submit.prevent="handleLogin"
          class="space-y-6"
        >
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">Email address</label>
            <div class="mt-1">
              <input
                id="email"
                v-model="loginForm.email"
                name="email"
                type="email"
                autocomplete="email"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
            <div class="mt-1">
              <input
                id="password"
                v-model="loginForm.password"
                name="password"
                type="password"
                autocomplete="current-password"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input
                id="remember-me"
                v-model="loginForm.rememberMe"
                name="remember-me"
                type="checkbox"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label for="remember-me" class="ml-2 block text-sm text-gray-900">Remember me</label>
            </div>

            <div class="text-sm">
              <button
                type="button"
                @click="toggleRecovery"
                class="font-medium text-blue-600 hover:text-blue-500"
              >
                Forgot your password?
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
              {{ isLoading ? 'Signing in...' : 'Sign in' }}
            </button>
          </div>
        </form>

        <!-- Password Recovery Form -->
        <form v-if="showRecovery && !isValidatingToken && isFormVisible" @submit.prevent="handlePasswordRecovery" class="space-y-6">
          <div>
            <label for="recovery-email" class="block text-sm font-medium text-gray-700"
              >Email address</label
            >
            <div class="mt-1">
              <input
                id="recovery-email"
                v-model="recoveryForm.email"
                name="email"
                type="email"
                autocomplete="email"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div class="flex space-x-3">
            <button
              type="button"
              @click="backToLogin"
              class="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Sign in
            </button>
            <button
              type="submit"
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
              {{ isLoading ? 'Sending...' : 'Send Reset Link' }}
            </button>
          </div>
        </form>

        <!-- Demo Info -->
        <div v-if="isFormVisible" class="mt-6 bg-gray-50 rounded-md p-4">
          <h3 class="text-sm font-medium text-gray-900 mb-2">Test Credentials:</h3>
          <div class="text-sm text-gray-600 space-y-1">
            <p><strong>Admin:</strong> admin@medicalcontractor.ca / password1234</p>
            <p><strong>2FA Flow:</strong></p>
            <ul class="text-xs text-gray-500 ml-2 space-y-1">
              <li>• Войдите с email/password</li>
              <li>• Если 2FA включен → появится диалог для ввода кода</li>
              <li>• Введите код из SMS → успешный логин</li>
              <li>• Если 2FA выключен → прямой вход в систему</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Two-Factor Authentication Dialog -->
    <TwoFactorDialog
      v-if="isFormVisible"
      :is-open="showTwoFactor"
      @close="backToLogin"
      @success="handleTwoFactorSuccess"
    />
  </div>
</template>

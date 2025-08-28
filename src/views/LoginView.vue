<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const loginForm = reactive({
  email: '',
  password: '',
  rememberMe: false,
})

const recoveryForm = reactive({
  email: '',
})

const twoFactorForm = reactive({
  code: '',
})

const isLoading = ref(false)
const showRecovery = ref(false)
const showTwoFactor = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

async function handleLogin() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const result = await authStore.login(loginForm.email, loginForm.password)

    if (result.success) {
      if (result.requires2FA) {
        showTwoFactor.value = true
      } else {
        // Login successful
        localStorage.setItem(
          'user',
          JSON.stringify({
            email: result.user?.email,
            role: result.user?.role,
            name: result.user?.name,
          }),
        )
        router.push('/')
      }
    } else {
      errorMessage.value = 'Invalid email or password'
    }
  } catch {
    errorMessage.value = 'Login failed. Please try again.'
  } finally {
    isLoading.value = false
  }
}

async function handleTwoFactor() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const success = await authStore.verifyTwoFactor(twoFactorForm.code)

    if (success) {
      // 2FA successful
      localStorage.setItem(
        'user',
        JSON.stringify({
          email: authStore.currentUser?.email,
          role: authStore.currentUser?.role,
          name: authStore.currentUser?.name,
        }),
      )
      router.push('/')
    } else {
      errorMessage.value = 'Invalid 2FA code'
    }
  } catch {
    errorMessage.value = '2FA verification failed'
  } finally {
    isLoading.value = false
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
          showRecovery
            ? 'Password Recovery'
            : showTwoFactor
              ? 'Two-Factor Authentication'
              : 'Sign in to FieldWire'
        }}
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        {{
          showRecovery
            ? 'Enter your email to receive a password reset link'
            : showTwoFactor
              ? 'Enter the 6-digit code from your authenticator app'
              : 'Access your construction projects'
        }}
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
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
          v-if="!showRecovery && !showTwoFactor"
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
        <form v-if="showRecovery" @submit.prevent="handlePasswordRecovery" class="space-y-6">
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

        <!-- Two-Factor Authentication Form -->
        <form v-if="showTwoFactor" @submit.prevent="handleTwoFactor" class="space-y-6">
          <div>
            <label for="two-factor-code" class="block text-sm font-medium text-gray-700"
              >Authentication Code</label
            >
            <div class="mt-1">
              <input
                id="two-factor-code"
                v-model="twoFactorForm.code"
                name="code"
                type="text"
                maxlength="6"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-center text-lg tracking-widest"
                placeholder="000000"
              />
            </div>
            <p class="mt-2 text-sm text-gray-500">
              Enter the 6-digit code from your authenticator app
            </p>
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
              {{ isLoading ? 'Verifying...' : 'Verify' }}
            </button>
          </div>
        </form>

        <!-- Demo Info -->
        <div class="mt-6 bg-gray-50 rounded-md p-4">
          <h3 class="text-sm font-medium text-gray-900 mb-2">Demo Credentials:</h3>
          <div class="text-sm text-gray-600 space-y-1">
            <p><strong>Admin:</strong> admin@company.com / password123 / 2FA: 123456</p>
            <p><strong>Manager:</strong> manager@company.com / password123</p>
            <p><strong>Supervisor:</strong> supervisor@company.com / password123 / 2FA: 123456</p>
            <p><strong>Engineer:</strong> engineer@company.com / password123</p>
            <p><strong>Viewer:</strong> viewer@company.com / password123</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

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
        <p class="mt-2 text-sm text-blue-100">Reset your password</p>
        <div class="mt-4 text-2xl">🔑</div>
      </div>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
      <div class="max-w-md mx-auto bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-6 border border-white/20">
        <div class="text-center mb-6">
          <h2 class="text-2xl font-bold text-gray-900">Reset Password</h2>
          <p class="text-gray-600 mt-2">Enter your new password</p>
        </div>

        <form @submit.prevent="handleResetPassword" class="space-y-4">
          <div>
            <label for="reset-new-password" class="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              id="reset-new-password"
              v-model="resetForm.newPassword"
              type="password"
              required
              minlength="8"
              autocomplete="new-password"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-400"
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label for="reset-confirm-password" class="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              id="reset-confirm-password"
              v-model="resetForm.confirmPassword"
              type="password"
              required
              autocomplete="new-password"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-400"
              placeholder="Confirm new password"
            />
          </div>

          <!-- Password Requirements -->
          <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 class="text-sm font-medium text-blue-900 mb-2">Password Requirements:</h4>
            <ul class="text-xs text-blue-800 space-y-1">
              <li>• Minimum 8 characters</li>
              <li>• At least one uppercase letter (A-Z)</li>
              <li>• At least one lowercase letter (a-z)</li>
              <li>• At least one number (0-9)</li>
              <li>• At least one special character (@$!%*?&)</li>
            </ul>
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
              Resetting...
            </span>
            <span v-else>Reset Password</span>
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
          <router-link to="/login" class="text-sm text-blue-600 hover:text-blue-800 underline transition-colors duration-200">
            ← Back to login
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/core/stores/auth'
import { api } from '@/core/utils/api'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const resetForm = reactive({
  newPassword: '',
  confirmPassword: '',
})

const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const token = ref('')

async function handleResetPassword() {
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    console.log('🔐 Resetting password with token:', token.value ? 'present' : 'missing')

    console.log('🔧 Using direct API call as workaround')

    // Validate passwords match
    if (resetForm.newPassword !== resetForm.confirmPassword) {
      errorMessage.value = 'New passwords do not match'
      return
    }

    // Validate password strength
    const password = resetForm.newPassword
    const errors = []

    if (password.length < 8) {
      errors.push('at least 8 characters')
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('at least one uppercase letter (A-Z)')
    }

    if (!/[a-z]/.test(password)) {
      errors.push('at least one lowercase letter (a-z)')
    }

    if (!/[0-9]/.test(password)) {
      errors.push('at least one number (0-9)')
    }

    if (!/[@$!%*?&]/.test(password)) {
      errors.push('at least one special character (@$!%*?&)')
    }

    if (errors.length > 0) {
      errorMessage.value = `Password must contain: ${errors.join(', ')}`
      return
    }

    console.log('📤 Sending reset password request:')
    console.log('🔑 Token:', token.value)
    console.log('🔑 New password:', resetForm.newPassword)
    console.log('🔑 Confirm password:', resetForm.confirmPassword)

    const response = await api.post('/api/v1/auth/reset-password', {
      token: token.value,
      new_password: resetForm.newPassword,
      confirm_password: resetForm.confirmPassword,
    })

    console.log('✅ Reset password response:', response.data)

    if (response.data.status === 'success') {
      successMessage.value = 'Password reset successfully! Redirecting to login...'
      console.log('✅ Password reset successfully')

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } else {
      errorMessage.value = response.data.message || 'Failed to reset password'
      console.log('❌ Password reset failed:', response.data.message)
    }
  } catch (error) {
    console.error('❌ Reset password error:', error)

    // Show detailed error information
    if (error.response) {
      console.log('🔍 Error response status:', error.response.status)
      console.log('🔍 Error response data:', error.response.data)
      console.log('🔍 Error response headers:', error.response.headers)

      if (error.response.data && error.response.data.message) {
        errorMessage.value = error.response.data.message
      } else {
        errorMessage.value = `Server error: ${error.response.status}`
      }
    } else if (error.request) {
      console.log('🔍 Error request:', error.request)
      errorMessage.value = 'Network error - please check your connection'
    } else {
      console.log('🔍 Error message:', error.message)
      errorMessage.value = 'An unexpected error occurred'
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  console.log('🔍 ResetPasswordView mounted')
  console.log('🔍 Route query:', route.query)
  console.log('🔍 Route params:', route.params)
  console.log('🔍 Full route:', route)

  // Clear form fields
  resetForm.newPassword = ''
  resetForm.confirmPassword = ''
  errorMessage.value = ''
  successMessage.value = ''

  // Force clear after DOM update
  await nextTick()
  resetForm.newPassword = ''
  resetForm.confirmPassword = ''

  const urlToken = route.query.token as string
  console.log('🔍 URL token:', urlToken)

  if (!urlToken) {
    console.log('❌ No reset token found, but continuing for testing')
    errorMessage.value = 'Invalid or missing token.'
    // TEMPORARY: Don't redirect for testing
    // setTimeout(() => {
    //   router.replace('/login')
    // }, 3000)
    // return
  }
  token.value = urlToken
  console.log('✅ Reset token found:', urlToken ? 'present' : 'missing')
})
</script>

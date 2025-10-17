<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api } from '@/core/utils/api'
import { useAuthStore } from '@/core/stores/auth'

const router = useRouter()
const route = useRoute()

const passwordForm = reactive({
  password: '',
  confirmPassword: '',
})

const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const token = ref('')

// Validation
const passwordErrors = ref<string[]>([])
const confirmPasswordError = ref('')

function validatePassword(password: string): string[] {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)')
  }

  // Update the reactive errors array
  passwordErrors.value = errors
  return errors
}

function validateConfirmPassword(): void {
  if (passwordForm.confirmPassword && passwordForm.password !== passwordForm.confirmPassword) {
    confirmPasswordError.value = 'Passwords do not match'
  } else {
    confirmPasswordError.value = ''
  }
}

function validateForm(): boolean {
  passwordErrors.value = validatePassword(passwordForm.password)
  confirmPasswordError.value = ''

  if (passwordForm.password !== passwordForm.confirmPassword) {
    confirmPasswordError.value = 'Passwords do not match'
    return false
  }

  return passwordErrors.value.length === 0
}

async function handlePasswordChange() {
  if (!validateForm()) {
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    let response

    if (token.value) {
      // Password reset scenario - using token from email
      console.log('🔧 Using password reset endpoint with token')
      response = await api.post('/api/v1/registration/complete', {
        token: token.value,
        password: passwordForm.password,
      })
    } else {
      // Invited user scenario - need to get token from auth store
      console.log('🔧 Using invited user password change endpoint')

      // Get the token that was received during login but not saved
      const tempToken = localStorage.getItem('tempAuthToken') // We'll need to store this temporarily

      if (tempToken) {
        // Temporarily set the token for this request
        api.defaults.headers.common['Authorization'] = `Bearer ${tempToken}`
        console.log('🔑 Using temporary token for password change')
      }

      response = await api.post('/api/v1/auth/change-password', {
        new_password: passwordForm.password,
        confirm_password: passwordForm.confirmPassword,
      })

      // DON'T clear the token yet - we need it for auth state update
      if (tempToken) {
        delete api.defaults.headers.common['Authorization']
        console.log('🔑 Temporary token cleared from headers (keeping in localStorage)')
      }
    }

      if (response.data.status === 'success') {
        successMessage.value = 'Password changed successfully! Redirecting to dashboard...'

        // Update auth state after successful password change
        console.log('✅ Password changed successfully, updating auth state...')

        // For invited users, we need to set the user as authenticated
        if (!token.value) {
          // This is an invited user scenario - update auth store
          const authStore = useAuthStore()

          // Get the user data that was stored during login
          const savedUser = localStorage.getItem('user')
          console.log('🔍 Saved user from localStorage:', savedUser ? 'exists' : 'missing')

          if (savedUser) {
            const user = JSON.parse(savedUser)

            // Save the permanent token that was used for the password change
            const tempToken = localStorage.getItem('tempAuthToken')
            console.log('🔍 Temp token before saving:', tempToken ? 'exists' : 'missing')

            if (tempToken) {
              localStorage.setItem('authToken', tempToken)
              api.defaults.headers.common['Authorization'] = `Bearer ${tempToken}`
              localStorage.removeItem('tempAuthToken') // Clean up temp token
              console.log('🔑 Permanent token saved after password change')
              console.log('🔍 Auth token after save:', localStorage.getItem('authToken') ? 'exists' : 'missing')
            } else {
              console.error('❌ No temp token found for permanent save!')
            }

            // Re-initialize auth state properly
            console.log('🔄 Re-initializing auth state...')
            await authStore.initializeAuth()

            console.log('✅ Auth state re-initialized for invited user:', user.email)
            console.log('🔍 Final auth state:', {
              isAuthenticated: authStore.isAuthenticated,
              hasUser: !!authStore.currentUser,
              userEmail: authStore.currentUser?.email
            })
          } else {
            console.error('❌ No saved user found in localStorage!')
          }
        }

        // Redirect to dashboard after successful password change
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        errorMessage.value = response.data.message || 'Failed to change password'
      }
  } catch (error: unknown) {
    console.error('Password change error:', error)
    const apiError = error as { response?: { data?: { message?: string } } }
    errorMessage.value = apiError.response?.data?.message || 'Failed to change password'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  console.log('🔍 PasswordChangeView mounted!')
  console.log('🔍 Current route:', route.path)
  console.log('🔍 Route query:', route.query)

  // Clear form fields to ensure they are empty
  passwordForm.password = ''
  passwordForm.confirmPassword = ''
  errorMessage.value = ''
  successMessage.value = ''
  passwordErrors.value = []
  confirmPasswordError.value = ''

  // Force DOM update to clear any browser autofill
  await nextTick()

  // Additional clearing with direct DOM manipulation
  setTimeout(() => {
    const passwordInput = document.getElementById('password') as HTMLInputElement
    const confirmInput = document.getElementById('confirmPassword') as HTMLInputElement
    if (passwordInput) passwordInput.value = ''
    if (confirmInput) confirmInput.value = ''
  }, 100)

  const urlToken = route.query.token as string

  if (urlToken) {
    // Password reset scenario - token from email
    console.log('✅ Token found in URL - password reset scenario:', urlToken)
    token.value = urlToken
  } else {
    // Invited user scenario - no token needed
    console.log('✅ No token in URL - invited user scenario')
    // Don't redirect - this is for invited users
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
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
      </div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Set Your Password</h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Please create a secure password to complete your registration
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <!-- Error Message -->
        <div v-if="errorMessage" class="mb-4">
          <div class="rounded-md bg-red-50 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm text-red-800">{{ errorMessage }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Success Message -->
        <div v-if="successMessage" class="mb-4">
          <div class="rounded-md bg-green-50 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm text-green-800">{{ successMessage }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Password Requirements -->
        <div class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h4 class="text-sm font-medium text-blue-900 mb-2">Password Requirements:</h4>
          <ul class="text-sm text-blue-800 space-y-1">
            <li>• Minimum 8 characters</li>
            <li>• At least one uppercase letter (A-Z)</li>
            <li>• At least one lowercase letter (a-z)</li>
            <li>• At least one number (0-9)</li>
            <li>• At least one special character (@$!%*?&)</li>
          </ul>
        </div>

        <!-- Password Change Form -->
        <form @submit.prevent="handlePasswordChange" class="space-y-6">
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <div class="mt-1">
              <input
                id="password"
                v-model="passwordForm.password"
                type="password"
                required
                autocomplete="new-password"
                @input="validatePassword(passwordForm.password)"
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                :class="{ 'border-red-300': passwordErrors.length > 0 }"
              />
            </div>
            <div v-if="passwordErrors.length > 0" class="mt-1">
              <ul class="text-sm text-red-600 space-y-1">
                <li v-for="error in passwordErrors" :key="error">• {{ error }}</li>
              </ul>
            </div>
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <div class="mt-1">
              <input
                id="confirmPassword"
                v-model="passwordForm.confirmPassword"
                type="password"
                required
                autocomplete="new-password"
                @input="validateConfirmPassword()"
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                :class="{ 'border-red-300': confirmPasswordError }"
              />
            </div>
            <div v-if="confirmPasswordError" class="mt-1">
              <p class="text-sm text-red-600">{{ confirmPasswordError }}</p>
            </div>
          </div>

          <div>
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isLoading ? 'Setting Password...' : 'Set Password' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

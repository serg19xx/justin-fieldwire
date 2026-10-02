<template>
  <div class="max-w-md mx-auto bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-6 border border-white/20">
    <div class="text-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Sign In</h1>
      <p class="text-gray-600 mt-2">
        {{ loginMode === 'staff' ? 'Enter your credentials' : 'Enter the task access key' }}
      </p>
    </div>

    <div class="flex gap-1.5 mb-5">
      <button
        type="button"
        class="flex-1 px-2.5 py-2 text-xs sm:text-sm font-medium rounded-md border transition-colors"
        :class="loginMode === 'staff'
          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
        @click="loginMode = 'staff'"
      >
        Staff
      </button>
      <button
        type="button"
        class="flex-1 px-2.5 py-2 text-xs sm:text-sm font-medium rounded-md border transition-colors"
        :class="loginMode === 'client'
          ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
        @click="loginMode = 'client'"
      >
        Client (MD / Rx)
      </button>
      <button
        type="button"
        class="flex-1 px-2.5 py-2 text-xs sm:text-sm font-medium rounded-md border transition-colors"
        :class="loginMode === 'contractor'
          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
        @click="loginMode = 'contractor'"
      >
        Contractor
      </button>
    </div>

    <form v-if="loginMode === 'staff'" @submit.prevent="handleLogin" class="space-y-4">
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700 mb-1"> Email </label>
        <input
          id="email"
          v-model="loginForm.email"
          type="email"
          required
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-400 text-gray-900"
          placeholder="Enter your email"
        />
      </div>

      <div>
        <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          id="password"
          v-model="loginForm.password"
          type="password"
          required
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-400 text-gray-900"
          placeholder="Enter your password"
        />
      </div>

      <div class="flex items-center justify-between">
        <label class="flex items-center">
          <input
            v-model="loginForm.rememberMe"
            type="checkbox"
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span class="ml-2 text-sm text-gray-700">Remember me</span>
        </label>
      </div>

      <button
        type="submit"
        :disabled="isLoading"
        class="w-full bg-gradient-to-r from-blue-600 to-orange-500 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-lg"
      >
        <span v-if="isLoading">Signing in...</span>
        <span v-else>Sign In</span>
      </button>
    </form>

    <!-- Client Portal Form (Doctor / Pharmacist) -->
    <div v-else-if="loginMode === 'client'" class="space-y-4">
      <div class="flex border-b border-gray-200 mb-3">
        <button
          type="button"
          @click="clientSubMode = 'signin'"
          class="flex-1 pb-2 text-xs font-semibold border-b-2 text-center transition-colors"
          :class="clientSubMode === 'signin' ? 'border-teal-700 text-teal-800' : 'border-transparent text-gray-400 hover:text-gray-600'"
        >
          Client Sign In
        </button>
        <button
          type="button"
          @click="clientSubMode = 'request'"
          class="flex-1 pb-2 text-xs font-semibold border-b-2 text-center transition-colors"
          :class="clientSubMode === 'request' ? 'border-teal-700 text-teal-800' : 'border-transparent text-gray-400 hover:text-gray-600'"
        >
          Request Account Access
        </button>
      </div>

      <!-- Client Sign In -->
      <form v-if="clientSubMode === 'signin'" @submit.prevent="handleClientLogin" class="space-y-4">
        <div>
          <label for="client-email" class="block text-sm font-medium text-gray-700 mb-1">
            Doctor / Pharmacist Email
          </label>
          <input
            id="client-email"
            v-model="clientLoginForm.email"
            type="email"
            required
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 text-sm"
            placeholder="Enter your registered email"
          />
        </div>

        <div>
          <label for="client-password" class="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="client-password"
            v-model="clientLoginForm.password"
            type="password"
            required
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 text-sm"
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full bg-teal-700 hover:bg-teal-800 text-white py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 text-sm font-semibold shadow-md transition-colors"
        >
          <span v-if="isLoading">Signing in...</span>
          <span v-else>Sign In to Client Portal</span>
        </button>

        <p class="text-xs text-center text-gray-500 mt-2">
          New doctor or pharmacist? Switch to "Request Account Access" above.
        </p>
      </form>

      <!-- Client Self-Serve Request Form -->
      <form v-else @submit.prevent="handleClientRequestAccess" class="space-y-3.5">
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">
            Select Your Role
          </label>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              @click="clientRequestForm.role = 'doctor'"
              class="py-2 px-3 text-xs font-semibold rounded-md border text-center transition-colors"
              :class="clientRequestForm.role === 'doctor'
                ? 'bg-teal-700 text-white border-teal-700'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
            >
              Doctor (Physician)
            </button>
            <button
              type="button"
              @click="clientRequestForm.role = 'pharmacist'"
              class="py-2 px-3 text-xs font-semibold rounded-md border text-center transition-colors"
              :class="clientRequestForm.role === 'pharmacist'
                ? 'bg-teal-700 text-white border-teal-700'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
            >
              Pharmacist
            </button>
          </div>
        </div>

        <div>
          <label for="req-email" class="block text-xs font-semibold text-gray-700 mb-1">
            Registered Email Address
          </label>
          <input
            id="req-email"
            v-model="clientRequestForm.email"
            type="email"
            required
            class="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm text-gray-900"
            placeholder="doctor@clinic.com or rx@pharmacy.com"
          />
        </div>

        <div>
          <label for="req-phone" class="block text-xs font-semibold text-gray-700 mb-1">
            Cell Phone Number
          </label>
          <input
            id="req-phone"
            v-model="clientRequestForm.phone"
            type="tel"
            required
            class="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm text-gray-900"
            placeholder="(416) 555-0123"
          />
          <p class="text-[11px] text-gray-500 mt-1">
            Must match the cell phone number attached to your profile record.
          </p>
        </div>

        <div>
          <label for="req-password" class="block text-xs font-semibold text-gray-700 mb-1">
            Create Password
          </label>
          <input
            id="req-password"
            v-model="clientRequestForm.password"
            type="password"
            required
            minlength="6"
            class="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm text-gray-900"
            placeholder="Minimum 6 characters"
          />
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full bg-teal-700 hover:bg-teal-800 text-white py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 text-sm font-semibold shadow-md transition-colors"
        >
          <span v-if="isLoading">Verifying record...</span>
          <span v-else>Verify & Request Account</span>
        </button>
      </form>
    </div>

    <form v-else @submit.prevent="handleContractorLogin" class="space-y-4">
      <div>
        <label for="access-key" class="block text-sm font-medium text-gray-700 mb-1">
          Access key
        </label>
        <input
          id="access-key"
          v-model="accessKey"
          type="text"
          required
          autocomplete="off"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 tracking-wider uppercase"
          placeholder="FW-XXXX-XXXX"
        />
        <p class="mt-2 text-xs text-gray-500">
          Ask the project manager or foreman for the temporary key for your task. You can share it
          with your crew on site.
        </p>
        <p class="mt-2 text-xs text-gray-500">
          Key expired or lost? Call your project manager or foreman — they can generate a new one.
        </p>
      </div>

      <button
        type="submit"
        :disabled="isLoading"
        class="w-full bg-gradient-to-r from-blue-600 to-orange-500 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
      >
        <span v-if="isLoading">Opening access...</span>
        <span v-else>Open task access</span>
      </button>
    </form>

    <div v-if="errorMessage" class="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
      {{ errorMessage }}
    </div>

    <div
      v-if="successMessage"
      class="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded"
    >
      {{ successMessage }}
    </div>

    <div v-if="loginMode === 'staff'" class="mt-6 text-center">
      <button @click="$emit('showRecovery')" class="text-sm text-blue-600 hover:text-blue-800">
        Forgot password?
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/core/stores/auth'
import { requestClientAccess } from '@/core/utils/client-access-api'

const router = useRouter()
const authStore = useAuthStore()

const emit = defineEmits<{
  showRecovery: []
  showTwoFactor: [user: Record<string, unknown>]
}>()

const loginMode = ref<'staff' | 'client' | 'contractor'>('staff')
const clientSubMode = ref<'signin' | 'request'>('signin')
const accessKey = ref('')

const loginForm = reactive({
  email: '',
  password: '',
  rememberMe: false,
})

const clientLoginForm = reactive({
  email: '',
  password: '',
})

const clientRequestForm = reactive({
  role: 'doctor' as 'doctor' | 'pharmacist',
  email: '',
  phone: '',
  password: '',
})

const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

async function handleLogin() {
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const result = await authStore.login(loginForm.email, loginForm.password)

    if (result.success) {
      if (result.requiresPasswordChange && result.user) {
        await router.push('/password-change')
        return
      }

      if (result.requires2FA && result.user) {
        emit('showTwoFactor', result.user as unknown as Record<string, unknown>)
        return
      }

      const role = result.user?.role_code
      if (role === 'doctor') {
        await router.push('/doctor/projects')
        return
      }
      if (role === 'pharmacist') {
        await router.push('/pharmacist/marketplace')
        return
      }

      router.push('/')
    } else {
      errorMessage.value = result.error || 'Login error'
    }
  } catch (error) {
    console.error('Login error:', error)
    errorMessage.value = 'An error occurred during login'
  } finally {
    isLoading.value = false
  }
}

async function handleClientLogin() {
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const result = await authStore.login(clientLoginForm.email, clientLoginForm.password)

    if (result.success) {
      const role = result.user?.role_code
      if (role === 'doctor') {
        await router.push('/doctor/projects')
        return
      }
      if (role === 'pharmacist') {
        await router.push('/pharmacist/marketplace')
        return
      }
      router.push('/')
    } else {
      errorMessage.value = result.error || 'Invalid email or password.'
    }
  } catch (err) {
    console.error('Client login error:', err)
    errorMessage.value = 'An error occurred during client login.'
  } finally {
    isLoading.value = false
  }
}

async function handleClientRequestAccess() {
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const res = await requestClientAccess({
      role: clientRequestForm.role,
      email: clientRequestForm.email,
      phone: clientRequestForm.phone,
      password: clientRequestForm.password,
    })

    if (!res.success) {
      errorMessage.value = res.message
      return
    }

    successMessage.value = 'Access verified! Signing you in...'

    // Automatically sign in with verified credentials
    const loginResult = await authStore.login(clientRequestForm.email, clientRequestForm.password)
    if (loginResult.success) {
      if (clientRequestForm.role === 'doctor') {
        await router.push('/doctor/projects')
      } else {
        await router.push('/pharmacist/marketplace')
      }
    } else {
      successMessage.value = 'Account created. You can now sign in with your password.'
      clientSubMode.value = 'signin'
      clientLoginForm.email = clientRequestForm.email
    }
  } catch (err) {
    console.error('Request access error:', err)
    errorMessage.value = 'Failed to process account request.'
  } finally {
    isLoading.value = false
  }
}

async function handleContractorLogin() {
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const result = await authStore.loginWithAccessKey(accessKey.value)
    if (result.success) {
      await router.push('/contractor')
    } else {
      errorMessage.value = result.error || 'Invalid access key'
    }
  } catch (error) {
    console.error('Contractor login error:', error)
    errorMessage.value = 'An error occurred during access'
  } finally {
    isLoading.value = false
  }
}
</script>

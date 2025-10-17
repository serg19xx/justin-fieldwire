<template>
  <div class="max-w-md mx-auto bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-6 border border-white/20">
    <div class="text-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Sign In</h1>
      <p class="text-gray-600 mt-2">Enter your credentials</p>
    </div>

    <form @submit.prevent="handleLogin" class="space-y-4">
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700 mb-1"> Email </label>
        <input
          id="email"
          v-model="loginForm.email"
          type="email"
          required
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-400"
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
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-400"
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
          Signing in...
        </span>
        <span v-else>Sign In</span>
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

    <div class="mt-6 text-center">
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

const router = useRouter()
const authStore = useAuthStore()

const emit = defineEmits<{
  showRecovery: []
  showTwoFactor: [user: Record<string, unknown>]
}>()

const loginForm = reactive({
  email: '',
  password: '',
  rememberMe: false,
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
    console.log('🔍 Login result:', result)

    if (result.success) {
      if (result.requiresPasswordChange && result.user) {
        // Пользователь должен сменить временный пароль
        console.log('🔑 Redirecting to password change page')
        console.log('🔍 User data:', result.user)
        console.log('🔍 Current route before redirect:', router.currentRoute.value.path)

        try {
          await router.push('/password-change')
          console.log('✅ Router.push completed successfully')
          console.log('🔍 Current route after redirect:', router.currentRoute.value.path)
        } catch (error) {
          console.error('❌ Router.push failed:', error)
        }
        return
      }

      if (result.requires2FA && result.user) {
        // Показать диалог 2FA
        emit('showTwoFactor', result.user as unknown as Record<string, unknown>)
        return
      }

      // Успешный логин - перенаправляем на главную страницу
      // CategoryRouter сам определит нужный дашборд
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
</script>

<template>
  <div v-if="isLoading" class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <div class="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
      <p class="mt-4 text-gray-600">Загрузка...</p>
    </div>
  </div>

  <div v-else-if="!isAuthenticated" class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h1>
      <p class="text-gray-600 mb-6">Please log in to continue</p>
      <button
        @click="redirectToLogin"
        class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
      >
        Login
      </button>
    </div>
  </div>

  <div v-else-if="!user" class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-gray-800 mb-4">User Loading Error</h1>
      <p class="text-gray-600 mb-6">Failed to load user data</p>
      <button @click="logout" class="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700">
        Logout
      </button>
    </div>
  </div>

  <div v-else-if="!user.role_category" class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-gray-800 mb-4">Undefined User Category</h1>
      <p class="text-gray-600 mb-6">User category is not defined</p>
      <div class="bg-gray-50 p-4 rounded-lg mb-6">
        <p><strong>User:</strong> {{ user.name }}</p>
        <p><strong>Email:</strong> {{ user.email }}</p>
        <p><strong>Role:</strong> {{ user.role_code }}</p>
        <p><strong>Category:</strong> {{ user.role_category || 'NOT DEFINED' }}</p>
        <p><strong>ID:</strong> {{ user.id }}</p>
        <p><strong>Status:</strong> {{ user.isActive ? 'Active' : 'Inactive' }}</p>
      </div>
      <button @click="logout" class="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700">
        Logout
      </button>
    </div>
  </div>

  <slot v-else />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/core/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isLoading = ref(true)

const isAuthenticated = computed(() => authStore.isAuthenticated)
const user = computed(() => authStore.currentUser)

onMounted(async () => {
  // Инициализируем авторизацию
  await authStore.initializeAuth()
  isLoading.value = false
})

function redirectToLogin() {
  router.push('/login')
}

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

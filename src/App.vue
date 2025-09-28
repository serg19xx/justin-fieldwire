<template>
  <div class="min-h-screen" @click="handleClickOutside">
    <!-- Redirect unauthenticated users to login -->
    <div v-if="!authStore.isAuthenticated && route.path !== '/login'" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <h1 class="text-2xl font-bold text-gray-800 mb-4">Redirecting to login...</h1>
        <p class="text-gray-600 mb-6">Please wait...</p>
      </div>
    </div>

    <!-- Show router content for authenticated users or login page -->
    <RouterView v-else />
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/core/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// Auto-redirect unauthenticated users to login
watch(() => authStore.isAuthenticated, (isAuthenticated) => {
  if (!isAuthenticated && route.path !== '/login') {
    console.log('🔒 User not authenticated, redirecting to login')
    router.replace('/login')
  }
}, { immediate: true })

// Close user menu when clicking outside
function handleClickOutside(event: Event) {
  const target = event.target as HTMLElement
  const userMenu = document.querySelector('.user-menu')
  if (userMenu && !userMenu.contains(target)) {
    // This will be handled by individual layouts
  }
}
</script>

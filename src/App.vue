<template>
  <div class="min-h-screen" @click="handleClickOutside">
    <!-- Auth pages (login, password change, reset password) -->
    <template v-if="['/login', '/reset-password', '/password-change'].includes(route.path)">
      <RouterView />
    </template>

    <!-- Dynamic Layouts based on user role -->
    <template v-else-if="authStore.isAuthenticated">
      <!-- Global Layout for global users -->
      <GlobalLayout v-if="authStore.currentUser?.role_category === 'global'">
        <RouterView />
      </GlobalLayout>

      <!-- Project Layout for Project Managers -->
      <ProjectLayout v-else-if="authStore.currentUser?.role_category === 'project'">
        <RouterView />
      </ProjectLayout>

      <!-- Task Layout for Task Executors -->
      <TaskLayout v-else-if="authStore.currentUser?.role_category === 'task'">
        <RouterView />
      </TaskLayout>

      <!-- Default fallback -->
      <ProjectLayout v-else>
        <RouterView />
      </ProjectLayout>
    </template>

    <!-- Redirect unauthenticated users to login -->
    <template v-else>
      <div class="flex items-center justify-center min-h-screen">
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-800 mb-4">Redirecting to login...</h1>
          <p class="text-gray-600 mb-6">Please wait...</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/core/stores/auth'
import GlobalLayout from '@/layouts/GlobalLayout.vue'
import ProjectLayout from '@/layouts/ProjectLayout.vue'
import TaskLayout from '@/layouts/TaskLayout.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// Auto-redirect unauthenticated users to login (except for auth pages)
watch(() => authStore.isAuthenticated, (isAuthenticated) => {
  const authPages = ['/login', '/reset-password', '/password-change']

  // Don't redirect if we're on an auth page
  if (authPages.includes(route.path)) {
    return
  }

  if (!isAuthenticated) {
    // Add delay to allow router to navigate first
    setTimeout(() => {
      // Double-check we're still not on an auth page
      if (!authPages.includes(route.path)) {
        router.replace('/login')
      }
    }, 200)
  }
}, { immediate: false })

// Close user menu when clicking outside
function handleClickOutside(event: Event) {
  const target = event.target as HTMLElement
  const userMenu = document.querySelector('.user-menu')
  if (userMenu && !userMenu.contains(target)) {
    // This will be handled by individual layouts
  }
}
</script>

<template>
  <div class="min-h-screen" @click="handleClickOutside">
    <!-- Auth pages (login, password change, reset password) -->
    <template v-if="route.matched.some(r => r.meta && r.meta.isAuthPage)">
      <RouterView />
    </template>

    <!-- Dynamic Layouts based on user role -->
    <template v-else-if="authStore.isAuthenticated">
      <!-- Debug info -->
      <div v-if="false" class="fixed top-0 left-0 bg-red-500 text-white p-2 z-50">
        Role: {{ authStore.currentUser?.role_category }} | Code: {{ authStore.currentUser?.role_code }}
      </div>

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
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p class="text-gray-600">Loading...</p>
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
  // Wait for router to process the route
  if (!route.matched.length) {
    return
  }

  const onAuthPage = route.matched.some(r => r.meta && r.meta.isAuthPage)

  // Don't redirect if we're on an auth page
  if (onAuthPage) {
    return
  }

  if (!isAuthenticated) {
    // Immediate redirect to login
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

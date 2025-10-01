<template>
  <div class="min-h-screen" @click="handleClickOutside">
    <!-- Redirect unauthenticated users to login -->
    <div v-if="!authStore.isAuthenticated && route.path !== '/login'" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <h1 class="text-2xl font-bold text-gray-800 mb-4">Redirecting to login...</h1>
        <p class="text-gray-600 mb-6">Please wait...</p>
      </div>
    </div>

    <!-- Dynamic Layouts based on user role -->
    <template v-else-if="authStore.isAuthenticated">
      <!-- Debug info -->
      <div class="fixed top-0 left-0 bg-black text-white p-2 z-50 text-xs">
        Job: {{ authStore.currentUser?.job_title }} | Role: {{ authStore.currentUser?.role_category }}
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

    <!-- Show router content for login page -->
    <RouterView v-else />
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

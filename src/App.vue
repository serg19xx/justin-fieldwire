<template>
  <div class="min-h-screen" @click="handleClickOutside">
    <!-- Redirect unauthenticated users to login (except for auth pages) -->
    <div v-if="!authStore.isAuthenticated && !['/login', '/reset-password', '/password-change'].includes(route.path)" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <h1 class="text-2xl font-bold text-gray-800 mb-4">Redirecting to login...</h1>
        <p class="text-gray-600 mb-6">Please wait...</p>
      </div>
    </div>

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

// Auto-redirect unauthenticated users to login (except for auth pages)
watch(() => authStore.isAuthenticated, (isAuthenticated) => {
  const authPages = ['/login', '/reset-password', '/password-change']

  if (!isAuthenticated && !authPages.includes(route.path)) {
    // Add small delay to allow router to navigate first
    setTimeout(() => {
      if (!authPages.includes(route.path)) {
        router.replace('/login')
      }
    }, 100)
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

<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Global Header -->
    <header
      class="bg-white shadow-sm border-b border-gray-200 h-12 fixed top-0 left-0 right-0 z-50"
    >
      <div class="flex justify-between items-center h-12 px-4">
        <!-- Left side -->
        <div class="flex items-center space-x-3">
          <RouterLink to="/" class="hover:opacity-80">
            <h1 class="text-lg font-semibold text-gray-900">FieldWire</h1>
          </RouterLink>
          <div class="hidden md:flex items-center space-x-2">
            <span class="text-xs font-medium text-gray-500 uppercase tracking-wider">Global</span>
            <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>
        </div>

        <!-- Desktop Navigation Menu -->
        <nav class="hidden lg:flex items-center space-x-6">
          <RouterLink
            to="/dashboard"
            class="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md"
            :class="{ 'bg-gray-100 text-gray-900': $route.path === '/dashboard' }"
          >
            Dashboard
          </RouterLink>
          <RouterLink
            to="/projects"
            class="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md"
            :class="{ 'bg-gray-100 text-gray-900': $route.path.startsWith('/projects') }"
          >
            Projects
          </RouterLink>
          <RouterLink
            to="/team"
            class="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md"
            :class="{ 'bg-gray-100 text-gray-900': $route.path === '/team' }"
          >
            Team
          </RouterLink>
          <RouterLink
            to="/reports"
            class="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md"
            :class="{ 'bg-gray-100 text-gray-900': $route.path === '/reports' }"
          >
            Reports
          </RouterLink>
        </nav>


        <!-- Right side -->
        <div class="flex items-center space-x-2">
          <div class="relative user-menu">
            <button @click="toggleUserMenu" class="p-1 rounded-full hover:bg-gray-100">
              <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span class="text-white text-sm font-medium">
                  {{ authStore.currentUser?.name?.charAt(0) || 'U' }}
                </span>
              </div>
            </button>
            <div
              v-if="isUserMenuOpen"
              class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50"
            >
              <RouterLink
                to="/account"
                @click="closeUserMenu"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Account Settings
              </RouterLink>
              <button
                @click="handleLogout"
                class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="pt-12 min-h-screen">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/core/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isUserMenuOpen = ref(false)

function toggleUserMenu() {
  isUserMenuOpen.value = !isUserMenuOpen.value
}

function closeUserMenu() {
  isUserMenuOpen.value = false
}

async function handleLogout() {
  await authStore.logout()
  router.replace('/login')
}
</script>

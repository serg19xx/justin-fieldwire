<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Task Header -->
    <header
      class="bg-orange-600 shadow-sm border-b border-orange-700 h-12 fixed top-0 left-0 right-0 z-50"
    >
      <div class="flex justify-between items-center h-12 px-4">
        <div class="flex items-center space-x-3">
          <button
            @click="toggleMobileMenu"
            class="lg:hidden p-2 text-white hover:text-orange-100 text-2xl font-bold"
          >
            {{ isMobileMenuOpen ? '✕' : '☰' }}
          </button>
          <RouterLink to="/" class="hover:opacity-80">
            <h1 class="text-lg font-semibold text-white hidden lg:block">FieldWire - Task</h1>
          </RouterLink>
        </div>

        <!-- Desktop Navigation -->
        <nav class="hidden lg:flex items-center space-x-6">
          <RouterLink
            to="/"
            class="text-sm font-medium text-white hover:text-orange-100 px-3 py-2 rounded-md"
            :class="{ 'bg-orange-700 text-white': $route.path === '/' }"
          >
            Dashboard
          </RouterLink>
          <RouterLink
            to="/tasks"
            class="text-sm font-medium text-white hover:text-orange-100 px-3 py-2 rounded-md"
            :class="{ 'bg-orange-700 text-white': $route.path === '/tasks' }"
          >
            My Tasks
          </RouterLink>
          <RouterLink
            to="/calendar"
            class="text-sm font-medium text-white hover:text-orange-100 px-3 py-2 rounded-md"
            :class="{ 'bg-orange-700 text-white': $route.path === '/calendar' }"
          >
            Calendar
          </RouterLink>
          <RouterLink
            to="/photos"
            class="text-sm font-medium text-white hover:text-orange-100 px-3 py-2 rounded-md"
            :class="{ 'bg-orange-700 text-white': $route.path === '/photos' }"
          >
            Photos
          </RouterLink>
        </nav>

        <!-- User menu -->
        <div class="flex items-center space-x-2">
          <div class="relative user-menu">
            <button @click="toggleUserMenu" class="p-1 rounded-full hover:bg-orange-700">
              <div class="w-8 h-8 bg-orange-800 rounded-full flex items-center justify-center">
                <span class="text-white text-sm font-medium">{{
                  authStore.currentUser?.name?.charAt(0) || 'U'
                }}</span>
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
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/core/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isMobileMenuOpen = ref(false)
const isUserMenuOpen = ref(false)

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false
}

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

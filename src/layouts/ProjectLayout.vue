<template>
  <div class="bg-gray-100">
    <!-- Project Header -->
    <header
      class="bg-green-600 shadow-sm border-b border-green-700 h-12 fixed top-0 left-0 right-0 z-50"
    >
      <div class="flex justify-between items-center h-12 px-4">
        <div class="flex items-center space-x-3">
          <button
            @click="toggleMobileMenu"
            class="lg:hidden p-2 text-white hover:text-green-100 text-2xl font-bold"
          >
            {{ isMobileMenuOpen ? '✕' : '☰' }}
          </button>
          <RouterLink to="/" class="hover:opacity-80">
            <h1 class="text-lg font-semibold text-white hidden lg:block">FieldWire</h1>
          </RouterLink>
        </div>

        <!-- Desktop Navigation -->
        <nav class="hidden lg:flex items-center space-x-6">
          <RouterLink
            to="/dashboard"
            class="text-sm font-medium text-white hover:text-green-100 px-3 py-2 rounded-md"
            :class="{ 'bg-green-700 text-white': $route.path === '/dashboard' }"
          >
            Dashboard
          </RouterLink>
          <RouterLink
            to="/projects"
            class="text-sm font-medium text-white hover:text-green-100 px-3 py-2 rounded-md"
            :class="{ 'bg-green-700 text-white': $route.path.startsWith('/projects') }"
          >
            My Projects
          </RouterLink>
          <RouterLink
            to="/team"
            class="text-sm font-medium text-white hover:text-green-100 px-3 py-2 rounded-md"
            :class="{ 'bg-green-700 text-white': $route.path === '/team' }"
          >
            Team
          </RouterLink>
          <RouterLink
            to="/reports"
            class="text-sm font-medium text-white hover:text-green-100 px-3 py-2 rounded-md"
            :class="{ 'bg-green-700 text-white': $route.path === '/reports' }"
          >
            Reports
          </RouterLink>
        </nav>

        <!-- User menu -->
        <div class="flex items-center space-x-2">
          <div class="relative user-menu">
            <button @click="toggleUserMenu" class="p-1 rounded-full hover:bg-green-700">
              <TopBarAvatar />
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

    <!-- Mobile Menu -->
    <div
      v-if="isMobileMenuOpen"
      class="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
      @click="closeMobileMenu"
    >
      <div class="fixed inset-y-0 left-0 w-64 bg-white shadow-lg" @click.stop>
        <div class="flex items-center justify-between p-4 border-b">
          <h2 class="text-lg font-semibold text-gray-900">Menu</h2>
          <button @click="closeMobileMenu" class="text-gray-500 hover:text-gray-700">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        <nav class="mt-4">
          <RouterLink
            to="/dashboard"
            @click="closeMobileMenu"
            class="block px-4 py-3 text-gray-700 hover:bg-gray-100 border-l-4 border-transparent hover:border-green-500"
          >
            Dashboard
          </RouterLink>
          <RouterLink
            to="/projects"
            @click="closeMobileMenu"
            class="block px-4 py-3 text-gray-700 hover:bg-gray-100 border-l-4 border-transparent hover:border-green-500"
          >
            My Projects
          </RouterLink>
          <RouterLink
            to="/team"
            @click="closeMobileMenu"
            class="block px-4 py-3 text-gray-700 hover:bg-gray-100 border-l-4 border-transparent hover:border-green-500"
          >
            Team
          </RouterLink>
          <RouterLink
            to="/reports"
            @click="closeMobileMenu"
            class="block px-4 py-3 text-gray-700 hover:bg-gray-100 border-l-4 border-transparent hover:border-green-500"
          >
            Reports
          </RouterLink>
        </nav>
      </div>
    </div>

    <!-- Main content -->
    <main class="pt-12" style="margin-top: 0; padding-top: 1.5rem;">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/core/stores/auth'
import TopBarAvatar from '@/components/TopBarAvatar.vue'

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

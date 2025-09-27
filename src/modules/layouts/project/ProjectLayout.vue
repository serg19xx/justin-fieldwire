<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Debug info removed -->
    <!-- Project Category Header -->
    <header class="bg-green-600 shadow-sm border-b border-green-700 h-12 fixed top-0 left-0 right-0 z-50">
      <div class="flex justify-between items-center h-12 px-4">
        <!-- Left side -->
        <div class="flex items-center space-x-3">
          <!-- Mobile menu button -->
          <button
            @click="toggleMobileMenu"
            class="lg:hidden p-2 text-white hover:text-green-100 text-2xl font-bold"
          >
            {{ isMobileMenuOpen ? '✕' : '☰' }}
          </button>

          <RouterLink to="/project" class="hover:opacity-80">
            <h1 class="text-lg font-semibold text-white hidden lg:block">FieldWire - Project</h1>
          </RouterLink>
        </div>

        <!-- Desktop Navigation Menu -->
        <nav class="hidden lg:flex items-center space-x-6">
          <RouterLink
            to="/dashboard"
            class="text-sm font-medium text-white hover:text-green-100 px-3 py-2 rounded-md"
            :class="{ 'bg-green-700 text-white': route.path === '/dashboard' }"
          >
            Dashboard
          </RouterLink>
          <RouterLink
            to="/projects"
            class="text-sm font-medium text-white hover:text-green-100 px-3 py-2 rounded-md"
            :class="{ 'bg-green-700 text-white': route.path === '/projects' }"
          >
            My Projects
          </RouterLink>
          <RouterLink
            to="/tasks"
            class="text-sm font-medium text-white hover:text-green-100 px-3 py-2 rounded-md"
            :class="{ 'bg-green-700 text-white': route.path === '/tasks' }"
          >
            Tasks
          </RouterLink>
          <RouterLink
            to="/team"
            class="text-sm font-medium text-white hover:text-green-100 px-3 py-2 rounded-md"
            :class="{ 'bg-green-700 text-white': route.path === '/team' }"
          >
            Team
          </RouterLink>
          <RouterLink
            to="/reports"
            class="text-sm font-medium text-white hover:text-green-100 px-3 py-2 rounded-md"
            :class="{ 'bg-green-700 text-white': route.path === '/reports' }"
          >
            Reports
          </RouterLink>
        </nav>

        <!-- Right side -->
        <div class="flex items-center space-x-2">
          <!-- User menu -->
          <div class="relative user-menu">
            <button
              @click="toggleUserMenu"
              class="p-1 rounded-full hover:bg-green-700"
            >
              <div class="w-8 h-8 bg-green-800 rounded-full flex items-center justify-center">
                <span class="text-white text-sm font-medium">
                  {{ user?.name?.charAt(0) || 'U' }}
                </span>
              </div>
            </button>

            <!-- User dropdown menu -->
            <div
              v-if="isUserMenuOpen"
              class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50"
            >
              <RouterLink
                to="/account"
                @click="closeUserMenu"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                My Profile
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

    <!-- Mobile Sidebar -->
    <div
      v-if="isMobileMenuOpen"
      class="fixed inset-0 z-40 lg:hidden"
      @click="closeMobileMenu"
    >
      <div class="fixed inset-0 bg-black bg-opacity-25"></div>
      <div class="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
        <div class="flex items-center justify-between h-12 px-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Menu</h2>
          <button
            @click="closeMobileMenu"
            class="p-2 text-gray-400 hover:text-gray-600"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
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
            to="/tasks"
            @click="closeMobileMenu"
            class="block px-4 py-3 text-gray-700 hover:bg-gray-100 border-l-4 border-transparent hover:border-green-500"
          >
            Tasks
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
    <main class="pt-12">
      <!-- Dashboard content directly here -->
      <div class="p-6">
        <!-- Welcome Section -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">
            Dashboard
          </h1>
          <p class="text-gray-600">
            Here's what's happening with your projects today.
          </p>
        </div>

        <!-- Dashboard content -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Active Projects</h3>
            <p class="text-3xl font-bold text-green-600">12</p>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Tasks This Week</h3>
            <p class="text-3xl font-bold text-blue-600">156</p>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Team Members</h3>
            <p class="text-3xl font-bold text-purple-600">8</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/core/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isMobileMenuOpen = ref(false)
const isUserMenuOpen = ref(false)

const user = computed(() => authStore.currentUser)

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
  console.log('🔓 Starting logout process...')
  isUserMenuOpen.value = false
  await authStore.logout()
  console.log('🔓 Logout completed, redirecting to login...')
  router.replace('/login')
}

// Close user menu when clicking outside
function handleClickOutside(event: Event) {
  const target = event.target as HTMLElement
  const userMenu = document.querySelector('.user-menu')
  if (userMenu && !userMenu.contains(target)) {
    isUserMenuOpen.value = false
  }
}
</script>

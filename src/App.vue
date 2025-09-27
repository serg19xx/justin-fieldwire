<template>
  <div class="min-h-screen" @click="handleClickOutside">
    <!-- No header for login page -->

    <!-- Global Category Header -->
    <header
      v-if="authStore.isAuthenticated && user?.role_category === 'global'"
      class="bg-white shadow-sm border-b border-gray-200 h-12 fixed top-0 left-0 right-0 z-50"
    >
      <div class="flex justify-between items-center h-12 px-4">
        <!-- Left side -->
        <div class="flex items-center space-x-3">
          <!-- Mobile menu button -->
          <button
            @click="toggleMobileMenu"
            class="lg:hidden p-2 text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ☰
          </button>

          <RouterLink to="/" class="hover:opacity-80">
            <h1 class="text-lg font-semibold text-gray-900">FieldWire</h1>
          </RouterLink>
        </div>

        <!-- Desktop Navigation Menu -->
        <nav class="hidden lg:flex items-center space-x-6">
          <RouterLink
            to="/"
            class="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md"
            :class="{ 'bg-gray-100 text-gray-900': route.path === '/' }"
          >
            Dashboard
          </RouterLink>

          <RouterLink
            to="/projects"
            class="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md"
            :class="{ 'bg-gray-100 text-gray-900': route.path.startsWith('/projects') }"
          >
            Projects
          </RouterLink>

          <RouterLink
            to="/people"
            class="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md"
            :class="{ 'bg-gray-100 text-gray-900': route.path === '/people' }"
          >
            Builders
          </RouterLink>

          <RouterLink
            to="/reports"
            class="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md"
            :class="{ 'bg-gray-100 text-gray-900': route.path === '/reports' }"
          >
            Reports
          </RouterLink>

          <!-- Contacts Dropdown -->
          <div class="relative group">
            <button
              class="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md flex items-center"
            >
              Contacts
              <svg class="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <!-- Dropdown Menu -->
            <div
              class="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
            >
              <RouterLink
                to="/contacts/patients"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Patients
              </RouterLink>
              <RouterLink
                to="/contacts/drivers"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Drivers
              </RouterLink>
              <RouterLink
                to="/contacts/pharmacies"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Pharmacies
              </RouterLink>
              <RouterLink
                to="/contacts/pharmacists"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Pharmacists
              </RouterLink>
              <RouterLink
                to="/contacts/physicians"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Physicians & Providers
              </RouterLink>
              <RouterLink
                to="/contacts/medical-clinics"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Medical Clinics
              </RouterLink>
            </div>
          </div>
        </nav>

        <!-- Right side -->
        <div class="flex items-center space-x-2">
          <!-- User menu -->
          <div class="relative user-menu">
            <button
              @click="toggleUserMenu"
              class="p-1 rounded-full hover:bg-gray-100"
            >
              <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
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

    <!-- Debug info removed -->

    <!-- Project Category - Use dedicated layout -->
    <div v-if="authStore.isAuthenticated && (user?.role_category === 'project' || !user?.role_category)">
      <ProjectLayout />
    </div>

    <!-- Task Category Header -->
    <header
      v-if="authStore.isAuthenticated && user?.role_category === 'task'"
      class="bg-orange-600 shadow-sm border-b border-orange-700 h-12 fixed top-0 left-0 right-0 z-50"
    >
      <div class="flex justify-between items-center h-12 px-4">
        <div class="flex items-center space-x-3">
          <button
            @click="toggleMobileMenu"
            class="lg:hidden p-2 text-white hover:text-orange-100 text-2xl font-bold"
          >
            ☰
          </button>
          <RouterLink to="/" class="hover:opacity-80">
            <h1 class="text-lg font-semibold text-white">FieldWire - Task</h1>
          </RouterLink>
        </div>
        <nav class="hidden lg:flex items-center space-x-6">
          <RouterLink to="/" class="text-sm font-medium text-white hover:text-orange-100 px-3 py-2 rounded-md">
            Dashboard
          </RouterLink>
          <RouterLink to="/tasks" class="text-sm font-medium text-white hover:text-orange-100 px-3 py-2 rounded-md">
            My Tasks
          </RouterLink>
          <RouterLink to="/calendar" class="text-sm font-medium text-white hover:text-orange-100 px-3 py-2 rounded-md">
            Calendar
          </RouterLink>
          <RouterLink to="/photos" class="text-sm font-medium text-white hover:text-orange-100 px-3 py-2 rounded-md">
            Photos
          </RouterLink>
        </nav>
        <div class="flex items-center space-x-2">
          <div class="relative user-menu">
            <button @click="toggleUserMenu" class="flex items-center space-x-2 p-1 rounded-full hover:bg-orange-700">
              <div class="w-8 h-8 bg-orange-800 rounded-full flex items-center justify-center">
                <span class="text-white text-sm font-medium">{{ user?.name?.charAt(0) || 'U' }}</span>
              </div>
            </button>
            <div v-if="isUserMenuOpen" class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
              <RouterLink to="/account" @click="closeUserMenu" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Account Settings
              </RouterLink>
              <button @click="handleLogout" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <div class="min-h-screen" :class="getBackgroundClass()">
      <div :class="authStore.isAuthenticated ? 'pt-12' : ''">
        <main class="w-full">
          <!-- Redirect unauthenticated users to login -->
          <div v-if="!authStore.isAuthenticated && route.path !== '/login'" class="flex items-center justify-center min-h-screen">
            <div class="text-center">
              <h1 class="text-2xl font-bold text-gray-800 mb-4">Redirecting to login...</h1>
              <p class="text-gray-600 mb-6">Please wait...</p>
            </div>
          </div>
          <!-- Show router content for authenticated users or login page -->
          <RouterView v-else />
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/core/stores/auth'
import ProjectLayout from '@/modules/layouts/project/ProjectLayout.vue'

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

const isMobileMenuOpen = ref(false)
const isUserMenuOpen = ref(false)

// Reset menu states when user changes
watch(() => authStore.isAuthenticated, (isAuthenticated) => {
  if (!isAuthenticated) {
    isUserMenuOpen.value = false
    isMobileMenuOpen.value = false
  }
})

const user = computed(() => authStore.currentUser)

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

function toggleUserMenu() {
  isUserMenuOpen.value = !isUserMenuOpen.value
}

function closeUserMenu() {
  isUserMenuOpen.value = false
}

// Close user menu when clicking outside
function handleClickOutside(event: Event) {
  const target = event.target as HTMLElement
  const userMenu = document.querySelector('.user-menu')
  if (userMenu && !userMenu.contains(target)) {
    isUserMenuOpen.value = false
  }
}

async function handleLogout() {
  console.log('🔓 Starting logout process...')
  // Close user menu before logout
  isUserMenuOpen.value = false
  await authStore.logout()
  console.log('🔓 Logout completed, redirecting to login...')
  router.replace('/login')
}

function getBackgroundClass() {
  if (!authStore.isAuthenticated) return 'bg-gray-50'
  if (user.value?.role_category === 'project') return 'bg-green-50'
  if (user.value?.role_category === 'task') return 'bg-orange-50'
  return 'bg-gray-50'
}

</script>

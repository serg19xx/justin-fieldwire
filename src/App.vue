<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { computed, ref, onMounted, onUnmounted } from 'vue'
import EnvironmentIndicator from '@/components/EnvironmentIndicator.vue'

const authStore = useAuthStore()
const route = useRoute()
const isMobileMenuOpen = ref(false)
const isUserMenuOpen = ref(false)
const currentUser = computed(() => authStore.currentUser)

// Проверяем, находимся ли мы на странице логина
const isLoginPage = computed(() => route.path === '/login')

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
  console.log('Menu state:', isMobileMenuOpen.value)
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
  try {
    await authStore.logout()
    // Redirect to login page after successful logout
    window.location.href = '/login'
  } catch (error) {
    console.error('Logout error:', error)
    // Still redirect even if logout fails
    window.location.href = '/login'
  }
}

// Close user menu when clicking outside
function handleClickOutside(event: Event) {
  const target = event.target as HTMLElement
  if (!target.closest('.user-menu')) {
    closeUserMenu()
  }
}

// Add and remove event listeners
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="min-h-screen">
    <EnvironmentIndicator />
    <!-- Header -->
    <header v-if="!isLoginPage" class="bg-white shadow-sm border-b border-gray-200 h-12 fixed top-0 left-0 right-0 z-50">
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
            v-if="currentUser?.user_type === 'System Administrator' || currentUser?.user_type === 'Project Manager'"
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

          <!-- Contacts Dropdown - Only for System Administrator -->
          <div v-if="currentUser?.user_type === 'System Administrator'" class="relative group">
            <button class="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md flex items-center">
              Contacts
              <svg class="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Dropdown Menu -->
            <div class="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
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
              class="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100"
            >
              <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span class="text-white text-sm font-medium">
                  {{ currentUser?.name?.charAt(0) || 'U' }}
                </span>
              </div>
              <!-- Dropdown arrow -->
              <svg
                class="h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
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

    <!-- Mobile Menu - скрываем на странице логина -->
    <div
      v-if="isMobileMenuOpen && !isLoginPage"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
    >
      <!-- Backdrop - клик по нему закрывает меню -->
      <div
        class="fixed inset-0 bg-black bg-opacity-50"
        @click="closeMobileMenu"
      ></div>

      <!-- Sidebar -->
      <div class="fixed left-0 top-0 h-full w-64 bg-white shadow-lg">
        <div class="flex items-center justify-between h-12 px-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Menu</h2>
          <button
            @click="closeMobileMenu"
            class="p-1 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <nav class="px-4 py-6 space-y-2">
          <RouterLink
            to="/"
            @click="closeMobileMenu"
            class="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
          >
            Dashboard
          </RouterLink>

          <RouterLink
            to="/projects"
            @click="closeMobileMenu"
            class="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
          >
            Projects
          </RouterLink>

          <RouterLink
            v-if="currentUser?.user_type === 'System Administrator' || currentUser?.user_type === 'Project Manager'"
            to="/people"
            @click="closeMobileMenu"
            class="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
          >
            Builders
          </RouterLink>

          <RouterLink
            to="/reports"
            @click="closeMobileMenu"
            class="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
          >
            Reports
          </RouterLink>

          <!-- Contacts Section - Only for System Administrator -->
          <div v-if="currentUser?.user_type === 'System Administrator'">
            <div class="border-t border-gray-200 my-4"></div>

            <div class="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
              Contacts
            </div>

            <RouterLink
              to="/contacts/patients"
              @click="closeMobileMenu"
              class="block px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              Patients
            </RouterLink>

            <RouterLink
              to="/contacts/drivers"
              @click="closeMobileMenu"
              class="block px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              Drivers
            </RouterLink>

            <RouterLink
              to="/contacts/pharmacies"
              @click="closeMobileMenu"
              class="block px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              Pharmacies
            </RouterLink>

            <RouterLink
              to="/contacts/physicians"
              @click="closeMobileMenu"
              class="block px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              Physicians & Providers
            </RouterLink>

            <RouterLink
              to="/contacts/pharmacists"
              @click="closeMobileMenu"
              class="block px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              Pharmacists
            </RouterLink>

            <RouterLink
              to="/contacts/medical-clinics"
              @click="closeMobileMenu"
              class="block px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              Medical Clinics
            </RouterLink>
          </div>
        </nav>
      </div>
    </div>

    <!-- Main content -->
    <div class="min-h-screen bg-gray-50">
      <div :class="{ 'pt-12': !isLoginPage }">
        <main class="w-full">
          <RouterView />
        </main>
      </div>
    </div>

  </div>
</template>

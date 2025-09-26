<template>
  <div class="project-layout min-h-screen bg-gray-50">
    <!-- Project Header -->
    <header class="bg-green-600 text-white shadow-lg">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo and Title -->
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <h1 class="text-xl font-bold">FieldWire Projects</h1>
            </div>
          </div>

          <!-- Navigation -->
          <nav class="hidden md:flex space-x-8">
            <router-link
              to="/project/dashboard"
              class="text-green-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              :class="{ 'bg-green-700 text-white': $route.path === '/project/dashboard' }"
            >
              Dashboard
            </router-link>
            <router-link
              to="/project/projects"
              class="text-green-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              :class="{ 'bg-green-700 text-white': $route.path.startsWith('/project/projects') }"
            >
              My Projects
            </router-link>
            <router-link
              to="/project/tasks"
              class="text-green-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              :class="{ 'bg-green-700 text-white': $route.path.startsWith('/project/tasks') }"
            >
              Tasks
            </router-link>
            <router-link
              to="/project/team"
              class="text-green-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              :class="{ 'bg-green-700 text-white': $route.path.startsWith('/project/team') }"
            >
              Team
            </router-link>
            <router-link
              to="/project/reports"
              class="text-green-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              :class="{ 'bg-green-700 text-white': $route.path.startsWith('/project/reports') }"
            >
              Reports
            </router-link>
          </nav>

          <!-- User Menu -->
          <div class="flex items-center space-x-4">
            <div class="relative">
              <button
                @click="toggleUserMenu"
                class="flex items-center space-x-2 text-green-100 hover:text-white"
              >
                <div class="w-8 h-8 bg-green-700 rounded-full flex items-center justify-center">
                  <span class="text-white text-sm font-medium">
                    {{ user?.name?.charAt(0) || 'P' }}
                  </span>
                </div>
                <span class="text-sm">{{ user?.name }}</span>
                <span class="text-xs text-green-200"
                  >({{ user?.role_category }}/{{ user?.role_code }})</span
                >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              <!-- User Dropdown -->
              <div
                v-if="isUserMenuOpen"
                class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50"
              >
                <router-link
                  to="/account"
                  @click="closeUserMenu"
                  class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Account Settings
                </router-link>
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
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <slot />
      </div>
    </main>

    <!-- Mobile Menu -->
    <div v-if="isMobileMenuOpen" class="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50">
      <div class="fixed left-0 top-0 h-full w-64 bg-white shadow-lg">
        <div class="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Project Menu</h2>
          <button @click="closeMobileMenu" class="p-1 text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <nav class="px-4 py-6 space-y-2">
          <router-link
            to="/project/dashboard"
            @click="closeMobileMenu"
            class="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
          >
            Dashboard
          </router-link>
          <router-link
            to="/project/projects"
            @click="closeMobileMenu"
            class="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
          >
            My Projects
          </router-link>
          <router-link
            to="/project/tasks"
            @click="closeMobileMenu"
            class="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
          >
            Tasks
          </router-link>
          <router-link
            to="/project/team"
            @click="closeMobileMenu"
            class="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
          >
            Team
          </router-link>
          <router-link
            to="/project/reports"
            @click="closeMobileMenu"
            class="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
          >
            Reports
          </router-link>
        </nav>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/core/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isUserMenuOpen = ref(false)
const isMobileMenuOpen = ref(false)

const user = computed(() => authStore.currentUser)

function toggleUserMenu() {
  isUserMenuOpen.value = !isUserMenuOpen.value
}

function closeUserMenu() {
  isUserMenuOpen.value = false
}

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false
}

async function handleLogout() {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Logout error:', error)
    router.push('/login')
  }
}

// Close user menu when clicking outside
function handleClickOutside(event: Event) {
  const target = event.target as HTMLElement
  if (!target.closest('.user-menu')) {
    closeUserMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.project-layout {
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
}
</style>

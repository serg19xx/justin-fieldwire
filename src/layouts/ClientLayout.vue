<template>
  <div class="bg-gray-100 min-h-screen">
    <!-- Client Top Header -->
    <header
      class="bg-teal-700 shadow-sm border-b border-teal-800 h-12 fixed top-0 left-0 right-0 z-[60]"
    >
      <div class="flex justify-between items-center h-12 px-4">
        <div class="flex items-center space-x-3">
          <button
            type="button"
            @click="toggleMobileMenu"
            class="md:hidden p-1.5 text-white hover:text-teal-100 text-lg font-bold rounded focus:outline-none focus:ring-2 focus:ring-teal-400"
            aria-label="Toggle navigation menu"
          >
            <span v-if="isMobileMenuOpen">✕</span>
            <span v-else>☰</span>
          </button>

          <RouterLink to="/dashboard" class="hover:opacity-90 flex items-center gap-2">
            <h1 class="text-base sm:text-lg font-semibold text-white">FieldWire</h1>
            <span
              v-if="clientRoleLabel"
              class="inline-block text-xs font-medium bg-teal-800 text-teal-100 px-2 py-0.5 rounded border border-teal-600"
            >
              {{ clientRoleLabel }}
            </span>
          </RouterLink>
        </div>

        <!-- Desktop Navigation -->
        <nav class="hidden md:flex items-center space-x-3">
          <template v-if="isDoctor">
            <RouterLink
              to="/doctor/projects"
              class="text-sm font-medium text-white hover:text-teal-100 px-3 py-1.5 rounded-md transition-colors"
              :class="{ 'bg-teal-800 text-white shadow-inner': $route.path.startsWith('/doctor/projects') || $route.path.startsWith('/projects') }"
            >
              My Projects
            </RouterLink>
          </template>

          <template v-else-if="isPharmacist">
            <RouterLink
              to="/pharmacist/marketplace"
              class="text-sm font-medium text-white hover:text-teal-100 px-3 py-1.5 rounded-md transition-colors"
              :class="{ 'bg-teal-800 text-white shadow-inner': $route.path.startsWith('/pharmacist/marketplace') }"
            >
              Marketplace
            </RouterLink>
            <RouterLink
              to="/pharmacist/projects"
              class="text-sm font-medium text-white hover:text-teal-100 px-3 py-1.5 rounded-md transition-colors"
              :class="{ 'bg-teal-800 text-white shadow-inner': $route.path.startsWith('/pharmacist/projects') }"
            >
              My Projects
            </RouterLink>
          </template>
        </nav>

        <!-- Right Side User Menu -->
        <div class="flex items-center space-x-3">
          <div class="hidden sm:block text-right">
            <p class="text-xs font-semibold text-white truncate max-w-[160px]">
              {{ authStore.currentUser?.name || authStore.currentUser?.email || 'User' }}
            </p>
            <p class="text-[11px] text-teal-200">
              {{ clientRoleLabel }}
            </p>
          </div>

          <div class="relative">
            <button
              type="button"
              @click="toggleUserMenu"
              class="p-1 rounded-full hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
              aria-label="User profile menu"
            >
              <TopBarAvatar />
            </button>

            <!-- Dropdown Menu -->
            <div
              v-if="isUserMenuOpen"
              class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
            >
              <div class="px-4 py-2 border-b border-gray-100">
                <p class="text-xs font-medium text-gray-900 truncate">
                  {{ authStore.currentUser?.name || 'User' }}
                </p>
                <p class="text-xs text-gray-500 truncate">
                  {{ authStore.currentUser?.email }}
                </p>
              </div>

              <RouterLink
                to="/account"
                @click="closeUserMenu"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Profile & Settings
              </RouterLink>

              <button
                type="button"
                @click="handleLogout"
                class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile Navigation Drawer -->
      <div
        v-if="isMobileMenuOpen"
        class="md:hidden bg-teal-800 border-t border-teal-600 px-4 py-3 space-y-2 shadow-lg"
      >
        <template v-if="isDoctor">
          <RouterLink
            to="/doctor/projects"
            @click="isMobileMenuOpen = false"
            class="block text-sm font-medium text-white hover:bg-teal-700 px-3 py-2 rounded-md"
            :class="{ 'bg-teal-900': $route.path.startsWith('/doctor/projects') }"
          >
            My Projects
          </RouterLink>
        </template>

        <template v-else-if="isPharmacist">
          <RouterLink
            to="/pharmacist/marketplace"
            @click="isMobileMenuOpen = false"
            class="block text-sm font-medium text-white hover:bg-teal-700 px-3 py-2 rounded-md"
            :class="{ 'bg-teal-900': $route.path.startsWith('/pharmacist/marketplace') }"
          >
            Marketplace
          </RouterLink>
          <RouterLink
            to="/pharmacist/projects"
            @click="isMobileMenuOpen = false"
            class="block text-sm font-medium text-white hover:bg-teal-700 px-3 py-2 rounded-md"
            :class="{ 'bg-teal-900': $route.path.startsWith('/pharmacist/projects') }"
          >
            My Projects
          </RouterLink>
        </template>

        <RouterLink
          to="/account"
          @click="isMobileMenuOpen = false"
          class="block text-sm font-medium text-white hover:bg-teal-700 px-3 py-2 rounded-md"
        >
          Profile
        </RouterLink>

        <button
          type="button"
          @click="handleLogout"
          class="w-full text-left text-sm font-medium text-red-200 hover:bg-teal-700 px-3 py-2 rounded-md"
        >
          Sign out
        </button>
      </div>
    </header>

    <!-- Main Content Outlet with top offset -->
    <main class="pt-12 min-h-[calc(100vh-3rem)]">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/core/stores/auth'
import TopBarAvatar from '@/components/TopBarAvatar.vue'

const router = useRouter()
const authStore = useAuthStore()

const isMobileMenuOpen = ref(false)
const isUserMenuOpen = ref(false)

const isDoctor = computed(() => authStore.currentUser?.role_code === 'doctor')
const isPharmacist = computed(() => authStore.currentUser?.role_code === 'pharmacist')

const clientRoleLabel = computed(() => {
  if (isDoctor.value) return 'Doctor'
  if (isPharmacist.value) return 'Pharmacist'
  return 'Client'
})

function toggleMobileMenu(): void {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

function toggleUserMenu(): void {
  isUserMenuOpen.value = !isUserMenuOpen.value
}

function closeUserMenu(): void {
  isUserMenuOpen.value = false
}

async function handleLogout(): Promise<void> {
  closeUserMenu()
  isMobileMenuOpen.value = false
  await authStore.logout()
  router.push('/login')
}

function handleDocumentClick(event: MouseEvent): void {
  const target = event.target as HTMLElement | null
  if (!target) return
  if (!target.closest('.user-menu') && !target.closest('button[aria-label="User profile menu"]')) {
    isUserMenuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

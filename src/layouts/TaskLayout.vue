<template>
  <div class="min-h-screen bg-gray-100 flex flex-col safe-area-pb">
    <!-- Compact top bar: logo, role, avatar -->
    <header
      class="bg-orange-600 shadow-sm border-b border-orange-700 h-12 flex-shrink-0 flex items-center justify-between px-3 safe-area-pt z-40"
    >
      <RouterLink to="/dashboard" class="flex items-center gap-2 min-w-0">
        <span class="text-base font-semibold text-white truncate">FieldWire</span>
        <span
          v-if="displayRole"
          class="hidden xs:inline text-xs font-medium text-orange-100 border-l border-orange-400 pl-2 truncate max-w-[120px]"
        >
          {{ displayRole }}
        </span>
      </RouterLink>

      <div class="relative flex-shrink-0" data-task-layout-user-menu>
        <button
          type="button"
          @click="toggleUserMenu"
          class="p-1.5 rounded-full hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
          aria-label="User menu"
        >
          <TopBarAvatar />
        </button>
        <div
          v-if="isUserMenuOpen"
          class="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200"
        >
          <RouterLink
            to="/account"
            @click="closeUserMenu"
            class="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100"
          >
            Account
          </RouterLink>
          <button
            type="button"
            @click="handleLogout"
            class="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>

    <!-- Main content: scrollable, padding for bottom nav (5 tabs) -->
    <main class="flex-1 overflow-auto pb-24">
      <slot />
    </main>

    <!-- Bottom navigation (mobile-first) -->
    <nav
      class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-stretch justify-around min-h-16 safe-area-pb z-40"
      role="navigation"
      aria-label="Main"
    >
      <RouterLink
        to="/dashboard"
        class="flex flex-col items-center justify-center flex-1 py-2 min-w-0"
        :class="$route.path === '/dashboard' ? 'text-orange-600 bg-orange-50 font-medium' : 'text-gray-500 hover:bg-gray-50'"
      >
        <svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 6h6m-3 3v3m0 0v3m0-3h3m-3 0h-3" />
        </svg>
        <span class="text-[10px] sm:text-xs mt-0.5 truncate w-full text-center px-0.5 leading-tight">Home</span>
      </RouterLink>
      <RouterLink
        to="/tasks"
        class="flex flex-col items-center justify-center flex-1 py-2 min-w-0"
        :class="isProjectsTabActive ? 'text-orange-600 bg-orange-50 font-medium' : 'text-gray-500 hover:bg-gray-50'"
      >
        <svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <span class="text-[10px] sm:text-xs mt-0.5 truncate w-full text-center px-0.5 leading-tight">Projects</span>
      </RouterLink>
      <RouterLink
        to="/tasks/schedule"
        class="flex flex-col items-center justify-center flex-1 py-2 min-w-0"
        :class="isScheduleTabActive ? 'text-orange-600 bg-orange-50 font-medium' : 'text-gray-500 hover:bg-gray-50'"
      >
        <svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span class="text-[10px] sm:text-xs mt-0.5 truncate w-full text-center px-0.5 leading-tight">Schedule</span>
      </RouterLink>
      <RouterLink
        to="/reports"
        class="flex flex-col items-center justify-center flex-1 py-2 min-w-0"
        :class="$route.path === '/reports' ? 'text-orange-600 bg-orange-50 font-medium' : 'text-gray-500 hover:bg-gray-50'"
      >
        <svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span class="text-xs mt-0.5 truncate w-full text-center px-0.5">Reports</span>
      </RouterLink>
      <RouterLink
        to="/account"
        class="flex flex-col items-center justify-center flex-1 h-full min-w-0"
        :class="$route.path === '/account' ? 'text-orange-600 bg-orange-50 font-medium' : 'text-gray-500 hover:bg-gray-50'"
      >
        <svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span class="text-[10px] sm:text-xs mt-0.5 truncate w-full text-center px-0.5 leading-tight">Account</span>
      </RouterLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/core/stores/auth'
import { getDisplayRole } from '@/core/utils/role-utils'
import TopBarAvatar from '@/components/TopBarAvatar.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isScheduleTabActive = computed(() => route.path === '/tasks/schedule' || route.path.startsWith('/tasks/schedule/'))

const isProjectsTabActive = computed(() => {
  if (route.path.startsWith('/projects')) return true
  if (!route.path.startsWith('/tasks')) return false
  return !isScheduleTabActive.value
})

const displayRole = computed(() => {
  const u = authStore.currentUser
  if (!u) return ''
  const role = getDisplayRole({
    role_id: u.role_id,
    role_code: u.role_code,
    role_name: u.role_name,
  })
  return role || u.job_title || ''
})

const isUserMenuOpen = ref(false)

function toggleUserMenu() {
  isUserMenuOpen.value = !isUserMenuOpen.value
}

function closeUserMenu() {
  isUserMenuOpen.value = false
}

function handleClickOutside(event: MouseEvent) {
  if (!isUserMenuOpen.value) return
  const target = event.target as HTMLElement
  if (!target.closest('[data-task-layout-user-menu]')) {
    closeUserMenu()
  }
}

async function handleLogout() {
  await authStore.logout()
  router.replace('/login')
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.safe-area-pt {
  padding-top: env(safe-area-inset-top, 0);
}
.safe-area-pb {
  padding-bottom: env(safe-area-inset-bottom, 0);
}
@media (min-width: 475px) {
  .xs\:inline {
    display: inline;
  }
}
</style>

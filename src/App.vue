<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { computed, ref, onMounted, onUnmounted } from 'vue'

const authStore = useAuthStore()
const isUserMenuOpen = ref(false)
const isContactsMenuOpen = ref(false)

const currentUser = computed(() => authStore.currentUser)

function handleLogout() {
  authStore.logout()
  window.location.href = '/login'
}

function toggleUserMenu() {
  isUserMenuOpen.value = !isUserMenuOpen.value
}

function closeUserMenu() {
  isUserMenuOpen.value = false
}

function toggleContactsMenu() {
  isContactsMenuOpen.value = !isContactsMenuOpen.value
}

function closeContactsMenu() {
  isContactsMenuOpen.value = false
}

// Close user menu when clicking outside
function handleClickOutside(event: Event) {
  const target = event.target as HTMLElement
  if (!target.closest('.user-menu')) {
    closeUserMenu()
  }
  if (!target.closest('.contacts-menu')) {
    closeContactsMenu()
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
    <!-- Compact Header -->
    <header
      class="bg-white shadow-sm border-b border-gray-200 h-12 fixed top-0 left-0 right-0 z-50"
    >
      <div class="flex justify-between items-center h-12 px-4">
        <!-- Left side - Title -->
        <div class="flex items-center space-x-4">
          <RouterLink to="/" class="hover:opacity-80 transition-opacity">
            <h1 class="text-lg font-semibold text-gray-900">FieldWire</h1>
          </RouterLink>
        </div>

        <!-- Right side - Notifications and user menu -->
        <div class="flex items-center space-x-3">
          <!-- Dashboard -->
          <RouterLink
            to="/"
            class="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            Dashboard
          </RouterLink>

          <!-- Projects -->
          <RouterLink
            to="/projects"
            class="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            Projects
          </RouterLink>

          <!-- Builders -->
          <RouterLink
            v-if="authStore.checkPermission('people:read')"
            to="/people"
            class="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            Builders
          </RouterLink>

          <!-- Reports -->
          <RouterLink
            to="/reports"
            class="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            Reports
          </RouterLink>

          <!-- Contacts -->
          <div class="relative contacts-menu">
            <button
              @click="toggleContactsMenu"
              class="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors flex items-center space-x-1"
            >
              <span>Contacts</span>
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

            <!-- Contacts dropdown menu -->
            <div
              v-if="isContactsMenuOpen"
              class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50"
            >
              <RouterLink
                to="/contacts"
                @click="closeContactsMenu"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                All Contacts
              </RouterLink>
              <RouterLink
                to="/contacts/patients"
                @click="closeContactsMenu"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Patients
              </RouterLink>
              <RouterLink
                to="/contacts/drivers"
                @click="closeContactsMenu"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Drivers
              </RouterLink>
              <RouterLink
                to="/contacts/pharmacies"
                @click="closeContactsMenu"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Pharmacies
              </RouterLink>
              <RouterLink
                to="/contacts/physicians"
                @click="closeContactsMenu"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Physicians & Providers
              </RouterLink>
              <RouterLink
                to="/contacts/clinics"
                @click="closeContactsMenu"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Medical Clinics/Offices
              </RouterLink>
            </div>
          </div>

          <!-- Notifications -->
          <button class="relative p-1 text-gray-400 hover:text-gray-500">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 17h5l-5 5v-5z"
              ></path>
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              ></path>
            </svg>
            <span
              class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center"
              >56</span
            >
          </button>

          <!-- Help -->
          <button class="p-1 text-gray-400 hover:text-gray-500">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </button>

          <!-- User menu dropdown -->
          <div class="relative user-menu">
            <button
              @click="toggleUserMenu"
              class="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100"
            >
              <!-- User avatar -->
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

            <!-- Dropdown menu -->
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
    <div class="min-h-screen bg-gray-50">
      <div class="pt-12">
        <main class="w-full">
          <RouterView />
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped></style>

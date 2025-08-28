<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  isOpen?: boolean
  onClose?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false
})

const emit = defineEmits<{
  close: []
}>()

const selectedMainMenu = ref('plans') // Default selected menu

// Dynamic submenu items based on selected main menu
const submenuItems = computed(() => {
  switch (selectedMainMenu.value) {
    case 'plans':
      return [
        { id: 'all-plans', name: 'All plans', count: 0 },
        { id: 'load-calculations', name: '4 88 Centre St N Load', count: 21 },
        { id: 'architectural', name: 'Architectural Set', count: 10 },
        { id: 'structural', name: 'Structural Set', count: 8 },
        { id: 'mechanical', name: 'Mechanical Set', count: 6 },
        { id: 'electrical', name: 'Electrical Set', count: 5 },
      ]
    case 'specifications':
      return [
        { id: 'all-specs', name: 'All specifications', count: 0 },
        { id: 'electrical-specs', name: 'Electrical', count: 12 },
        { id: 'plumbing-specs', name: 'Plumbing', count: 8 },
        { id: 'hvac-specs', name: 'HVAC', count: 6 },
        { id: 'structural-specs', name: 'Structural', count: 4 },
      ]
    case 'tasks':
      return [
        { id: 'all-tasks', name: 'All tasks', count: 0 },
        { id: 'ba-baseboards', name: 'BA Baseboards', count: 1 },
        { id: 'cw-concrete', name: 'CW Concrete Work', count: 1 },
        { id: 'de-demolition', name: 'DE Demolition', count: 2 },
        { id: 'el-electrical', name: 'EL Electrical', count: 3 },
        { id: 'fi-finishes', name: 'FI Finishes', count: 1 },
        { id: 'hv-hvac', name: 'HV HVAC', count: 2 },
        { id: 'pl-plumbing', name: 'PL Plumbing', count: 1 },
        { id: 'st-structural', name: 'ST Structural', count: 2 },
      ]
    case 'reports':
      return [
        { id: 'all-reports', name: 'All reports', count: 0 },
        { id: 'progress-reports', name: 'Progress Reports', count: 8 },
        { id: 'financial-reports', name: 'Financial Reports', count: 5 },
        { id: 'safety-reports', name: 'Safety Reports', count: 3 },
        { id: 'quality-reports', name: 'Quality Reports', count: 4 },
        { id: 'compliance-reports', name: 'Compliance Reports', count: 2 },
      ]
    case 'photos':
      return [
        { id: 'all-photos', name: 'All photos', count: 0 },
        { id: 'progress-photos', name: 'Progress', count: 45 },
        { id: 'quality-photos', name: 'Quality', count: 23 },
        { id: 'safety-photos', name: 'Safety', count: 12 },
        { id: 'issues-photos', name: 'Issues', count: 8 },
      ]
    case 'forms':
      return [
        { id: 'all-forms', name: 'All forms', count: 0 },
        { id: 'safety-forms', name: 'Safety', count: 15 },
        { id: 'quality-forms', name: 'Quality', count: 8 },
        { id: 'equipment-forms', name: 'Equipment', count: 23 },
        { id: 'inspection-forms', name: 'Inspection', count: 12 },
      ]
    case 'files':
      return [
        { id: 'all-files', name: 'All files', count: 0 },
        { id: 'contracts', name: 'Contracts', count: 5 },
        { id: 'drawings', name: 'Drawings', count: 18 },
        { id: 'specifications', name: 'Specifications', count: 12 },
        { id: 'reports', name: 'Reports', count: 8 },
        { id: 'permits', name: 'Permits', count: 3 },
      ]
    default:
      return []
  }
})

// Get submenu title based on selected main menu
const submenuTitle = computed(() => {
  switch (selectedMainMenu.value) {
    case 'plans':
      return 'PLAN MANAGEMENT'
    case 'specifications':
      return 'SPECIFICATION MANAGEMENT'
    case 'tasks':
      return 'TASK MANAGEMENT'
    case 'reports':
      return 'REPORT MANAGEMENT'
    case 'photos':
      return 'PHOTO MANAGEMENT'
    case 'forms':
      return 'FORM MANAGEMENT'
    case 'files':
      return 'FILE MANAGEMENT'
    default:
      return ''
  }
})

function selectMainMenu(menu: string) {
  selectedMainMenu.value = menu
}

function closeSidebar() {
  emit('close')
}
</script>

<template>
  <!-- Mobile overlay -->
  <div v-if="isOpen" class="fixed inset-0 z-40 lg:hidden" @click="closeSidebar">
    <div class="fixed inset-0 bg-gray-600 bg-opacity-75"></div>
  </div>

  <!-- Fixed Sidebar -->
  <div
    :class="[
      'fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out lg:translate-x-0',
      isOpen ? 'translate-x-0' : '-translate-x-full',
    ]"
  >
    <div class="flex flex-col h-full">
      <!-- Sidebar header -->
      <div class="flex items-center justify-between h-12 px-4 border-b border-gray-700">
        <h2 class="text-lg font-semibold text-white">Navigation</h2>
        <button
          @click="closeSidebar"
          class="lg:hidden p-1 rounded-md text-gray-400 hover:text-white"
        >
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </button>
      </div>

      <!-- Sidebar navigation -->
      <nav class="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
        <!-- FIELD MANAGEMENT Section -->
        <div>
          <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            FIELD MANAGEMENT
          </h3>
          <div class="space-y-1">
            <button
              @click="selectMainMenu('plans')"
              class="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors"
              :class="[
                selectedMainMenu === 'plans'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white',
              ]"
            >
              <svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                ></path>
              </svg>
              Plans
            </button>

            <button
              @click="selectMainMenu('specifications')"
              class="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors"
              :class="[
                selectedMainMenu === 'specifications'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white',
              ]"
            >
              <svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                ></path>
              </svg>
              Specifications
            </button>

            <button
              @click="selectMainMenu('tasks')"
              class="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors"
              :class="[
                selectedMainMenu === 'tasks'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white',
              ]"
            >
              <svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                ></path>
              </svg>
              Tasks
            </button>

            <button
              @click="selectMainMenu('photos')"
              class="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors"
              :class="[
                selectedMainMenu === 'photos'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white',
              ]"
            >
              <svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                ></path>
              </svg>
              Photos
            </button>

            <button
              @click="selectMainMenu('forms')"
              class="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors"
              :class="[
                selectedMainMenu === 'forms'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white',
              ]"
            >
              <svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                ></path>
              </svg>
              Forms
            </button>

            <button
              @click="selectMainMenu('files')"
              class="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors"
              :class="[
                selectedMainMenu === 'files'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white',
              ]"
            >
              <svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                ></path>
              </svg>
              Files
              <svg
                class="ml-auto h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                ></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Dynamic Submenu Section -->
        <div v-if="submenuItems.length > 0">
          <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {{ submenuTitle }}
          </h3>
          <div class="space-y-1">
            <button
              v-for="item in submenuItems"
              :key="item.id"
              class="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <span class="flex-1 text-left">{{ item.name }}</span>
              <span v-if="item.count > 0" class="text-xs text-gray-400">{{ item.count }}</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  </div>
</template>

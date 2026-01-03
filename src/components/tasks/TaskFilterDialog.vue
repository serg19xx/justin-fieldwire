<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    @click.self="closeDialog"
  >
    <div
      class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
        <div>
          <h2 class="text-lg sm:text-xl font-semibold text-gray-900">Filter Tasks</h2>
          <p class="text-sm text-gray-500 mt-1">
            Apply filters to all task views (Calendar, List, Gantt)
          </p>
        </div>
        <button @click="closeDialog" class="text-gray-400 hover:text-gray-600 transition-colors">
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

      <!-- Filter Content -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-6">
        <TaskFilterPanel
          :filter-state="filterState"
          :available-workers="availableWorkers"
          :clear-filters="clearFilters"
          :active-filters-count="activeFiltersCount"
          @update:filter-state="updateFilterState"
        />
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between p-4 sm:p-6 border-t border-gray-200 flex-shrink-0 bg-gray-50">
        <div class="text-sm text-gray-600">
          <span v-if="activeFiltersCount > 0" class="text-blue-600">
            {{ activeFiltersCount }} filter{{ activeFiltersCount !== 1 ? 's' : '' }} active
          </span>
          <span v-else class="text-gray-500">No filters applied</span>
        </div>
        <div class="flex gap-3">
          <button
            v-if="activeFiltersCount > 0"
            @click="clearFilters"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Clear All
          </button>
          <button
            @click="applyFilters"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import TaskFilterPanel from './TaskFilterPanel.vue'
import type { TaskFilterState } from '@/composables/useTaskFilters'

interface Props {
  isOpen: boolean
  filterState: TaskFilterState
  availableWorkers: Array<{ id: number; name: string; role: string }>
  clearFilters: () => void
  activeFiltersCount: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  'update:filterState': [state: TaskFilterState]
  'apply-filters': []
}>()

function closeDialog() {
  emit('close')
}

function updateFilterState(newState: TaskFilterState) {
  emit('update:filterState', newState)
}

function applyFilters() {
  emit('apply-filters')
  closeDialog()
}
</script>


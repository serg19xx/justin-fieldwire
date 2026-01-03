<template>
  <div class="bg-white border-b border-gray-200 p-4 space-y-4">
    <!-- Search -->
    <div>
      <label class="block text-xs font-medium text-gray-700 mb-1">Search</label>
      <input
        :value="filterState.search"
        @input="updateFilter('search', ($event.target as HTMLInputElement).value)"
        type="text"
        placeholder="Search tasks..."
        class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
      />
    </div>

    <!-- Worker Filter -->
    <div>
      <label class="block text-xs font-medium text-gray-700 mb-1">Worker</label>
      <select
        :value="filterState.workerId === null ? '' : filterState.workerId"
        @change="handleWorkerChange($event)"
        class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
      >
        <option value="">All Workers</option>
        <option v-for="worker in availableWorkers" :key="worker.id" :value="worker.id">
          {{ worker.name }} ({{ worker.role }})
        </option>
      </select>
    </div>

    <!-- Status Filter -->
    <div>
      <label class="block text-xs font-medium text-gray-700 mb-2">Status</label>
      <div class="space-y-1 max-h-32 overflow-y-auto">
        <label
          v-for="status in availableStatuses"
          :key="status.value"
          class="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
        >
          <input
            type="checkbox"
            :value="status.value"
            :checked="filterState.statuses.includes(status.value)"
            @change="toggleStatus(status.value)"
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span class="text-sm text-gray-700">{{ status.label }}</span>
        </label>
      </div>
    </div>

    <!-- Date Filters -->
    <div class="grid grid-cols-2 gap-2">
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
        <input
          :value="filterState.startDate || ''"
          @input="updateFilter('startDate', ($event.target as HTMLInputElement).value || null)"
          type="date"
          class="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1">End Date</label>
        <input
          :value="filterState.endDate || ''"
          @input="updateFilter('endDate', ($event.target as HTMLInputElement).value || null)"
          type="date"
          class="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        />
      </div>
    </div>

    <!-- Task Type Filter -->
    <div>
      <label class="block text-xs font-medium text-gray-700 mb-1">Type</label>
      <select
        :value="filterState.taskType"
        @change="updateFilter('taskType', ($event.target as HTMLSelectElement).value as 'task' | 'milestone' | 'all')"
        class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
      >
        <option value="all">All Types</option>
        <option value="task">Tasks Only</option>
        <option value="milestone">Milestones Only</option>
      </select>
    </div>

    <!-- Active Filters Count & Clear -->
    <div class="flex items-center justify-between pt-2 border-t border-gray-200">
      <span class="text-xs text-gray-600">
        {{ activeFiltersCount }} filter{{ activeFiltersCount !== 1 ? 's' : '' }} active
      </span>
      <button
        v-if="activeFiltersCount > 0"
        @click="clearFilters"
        class="text-xs text-blue-600 hover:text-blue-800 font-medium"
      >
        Clear All
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TaskStatus } from '@/core/types/task'
import type { TaskFilterState } from '@/composables/useTaskFilters'

interface Props {
  filterState: TaskFilterState
  availableWorkers: Array<{ id: number; name: string; role: string }>
  clearFilters: () => void
  activeFiltersCount: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:filterState': [state: TaskFilterState]
}>()

const availableStatuses: Array<{ value: TaskStatus; label: string }> = [
  { value: 'planned', label: 'Planned' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'scheduled_accepted', label: 'Scheduled Accepted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'partially_completed', label: 'Partially Completed' },
  { value: 'delayed_due_to_issue', label: 'Delayed' },
  { value: 'ready_for_inspection', label: 'Ready for Inspection' },
  { value: 'completed', label: 'Completed' },
]

function updateFilter(key: keyof TaskFilterState, value: any) {
  emit('update:filterState', {
    ...props.filterState,
    [key]: value,
  })
}

function handleWorkerChange(event: Event) {
  const selectElement = event.target as HTMLSelectElement
  const value = selectElement.value
  // Convert empty string to null, otherwise convert to number
  const workerId = value === '' ? null : Number(value)
  updateFilter('workerId', workerId)
}

function toggleStatus(status: TaskStatus) {
  const currentStatuses = [...props.filterState.statuses]
  const index = currentStatuses.indexOf(status)
  
  if (index > -1) {
    currentStatuses.splice(index, 1)
  } else {
    currentStatuses.push(status)
  }
  
  updateFilter('statuses', currentStatuses)
}
</script>


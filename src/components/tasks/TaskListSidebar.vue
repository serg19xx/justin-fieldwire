<template>
  <div class="flex flex-col h-full bg-white border-r border-gray-200">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200 bg-gray-50">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-sm font-semibold text-gray-900">Tasks</h3>
        <span class="text-xs text-gray-500">({{ filteredTasks.length }})</span>
      </div>
      <p v-if="activeFiltersCount > 0" class="text-xs text-blue-600">
        {{ activeFiltersCount }} filter{{ activeFiltersCount !== 1 ? 's' : '' }} active
      </p>
    </div>

    <!-- Task List -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="filteredTasks.length === 0" class="p-4 text-center text-gray-500">
        <div class="text-2xl mb-2">📋</div>
        <p class="text-xs">No tasks found</p>
        <p v-if="activeFiltersCount > 0" class="text-xs mt-1 text-gray-400">
          Try adjusting filters
        </p>
      </div>
      <div v-else class="divide-y divide-gray-100">
        <button
          v-for="task in filteredTasks"
          :key="task.id"
          @click="selectTask(task)"
          :class="[
            'w-full text-left p-3 transition-all relative border-l-4',
            isSelected(task.id)
              ? 'bg-blue-50 border-l-blue-500 font-medium'
              : 'bg-white border-l-transparent hover:bg-gray-50',
          ]"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <!-- Task Name -->
              <div class="flex items-center gap-2 mb-1">
                <span v-if="isMilestone(task.milestone)" class="text-xs">🎯</span>
                <span class="text-sm font-medium text-gray-900 truncate">{{ task.name }}</span>
              </div>

              <!-- Dates -->
              <div class="text-xs text-gray-500 space-y-0.5">
                <div v-if="task.start_planned" class="flex items-center gap-1">
                  <span>📅</span>
                  <span>{{ formatDate(task.start_planned) }}</span>
                  <span v-if="task.end_planned">- {{ formatDate(task.end_planned) }}</span>
                </div>
                <div v-else class="text-gray-400">No dates</div>
              </div>

              <!-- Status Badge -->
              <div class="mt-1.5">
                <span
                  :class="[
                    'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                    getStatusClass(task.status),
                  ]"
                >
                  {{ getStatusLabel(task.status) }}
                </span>
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { isMilestone } from '@/core/types/task'
import type { Task, TaskStatus } from '@/core/types/task'

interface Props {
  filteredTasks: Task[]
  selectedTaskId?: string | number | null
  activeFiltersCount: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'task-selected': [task: Task]
}>()

// Normalize selectedTaskId to string for consistent comparison
const normalizedSelectedId = computed(() => {
  return props.selectedTaskId ? String(props.selectedTaskId) : null
})

function selectTask(task: Task) {
  emit('task-selected', task)
}

function isSelected(taskId: string | number | undefined): boolean {
  if (!normalizedSelectedId.value || !taskId) return false
  // Compare normalized strings
  return normalizedSelectedId.value === String(taskId)
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getStatusLabel(status: TaskStatus): string {
  const labels: Record<TaskStatus, string> = {
    planned: 'Planned',
    scheduled: 'Scheduled',
    scheduled_accepted: 'Scheduled',
    in_progress: 'In Progress',
    partially_completed: 'Partial',
    delayed_due_to_issue: 'Delayed',
    ready_for_inspection: 'Ready',
    completed: 'Done',
  }
  return labels[status] || status
}

function getStatusClass(status: TaskStatus): string {
  const classes: Record<TaskStatus, string> = {
    planned: 'bg-blue-100 text-blue-800',
    scheduled: 'bg-purple-100 text-purple-800',
    scheduled_accepted: 'bg-purple-100 text-purple-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    partially_completed: 'bg-orange-100 text-orange-800',
    delayed_due_to_issue: 'bg-red-100 text-red-800',
    ready_for_inspection: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}
</script>

<style scoped>
/* Ensure selected task has consistent blue border */
button.border-l-blue-500 {
  border-left-color: #3b82f6 !important;
  border-left-width: 4px !important;
  background-color: #eff6ff !important;
}

/* Ensure non-selected tasks have transparent border */
button.border-l-transparent {
  border-left-color: transparent !important;
  border-left-width: 4px !important;
}
</style>


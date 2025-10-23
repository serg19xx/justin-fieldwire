<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" @click="closeModal"></div>
    
    <!-- Modal -->
    <div class="flex min-h-full items-center justify-center p-4">
      <div class="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200">
          <div class="flex items-center space-x-3">
            <div class="flex items-center space-x-2">
              <span v-if="task?.milestone" class="text-2xl">🎯</span>
              <span v-else class="text-2xl">📋</span>
              <h3 class="text-lg font-semibold text-gray-900">
                {{ task?.name || 'Task Details' }}
              </h3>
            </div>
            <span :class="statusBadgeClass" class="px-2 py-1 text-xs font-medium rounded-full">
              {{ statusLabel }}
            </span>
          </div>
          <div class="flex items-center space-x-2">
            <button
              v-if="canEdit"
              @click="editTask"
              class="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
            >
              Edit
            </button>
            <button
              v-if="canDelete"
              @click="deleteTask"
              class="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
            >
              Delete
            </button>
            <button
              @click="closeModal"
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div v-if="task" class="p-6">
          <!-- Basic Information -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Left Column -->
            <div class="space-y-6">
              <!-- Task Type -->
              <div>
                <h4 class="text-sm font-medium text-gray-700 mb-2">Task Type</h4>
                <div class="flex items-center space-x-2">
                  <span v-if="task.milestone" class="text-lg">🎯</span>
                  <span v-else class="text-lg">📋</span>
                  <span class="text-sm text-gray-900">
                    {{ task.milestone ? 'Milestone' : 'Regular Task' }}
                  </span>
                  <span v-if="task.milestone && task.milestone_type" class="text-xs text-gray-500">
                    ({{ task.milestone_type }})
                  </span>
                </div>
              </div>

              <!-- Dates -->
              <div>
                <h4 class="text-sm font-medium text-gray-700 mb-2">Schedule</h4>
                <div class="space-y-2">
                  <div class="flex justify-between">
                    <span class="text-sm text-gray-600">Start Date:</span>
                    <span class="text-sm font-medium">{{ formatDate(task.start_planned) }}</span>
                  </div>
                  <div v-if="task.end_planned" class="flex justify-between">
                    <span class="text-sm text-gray-600">End Date:</span>
                    <span class="text-sm font-medium">{{ formatDate(task.end_planned) }}</span>
                  </div>
                  <div v-if="task.duration_days" class="flex justify-between">
                    <span class="text-sm text-gray-600">Duration:</span>
                    <span class="text-sm font-medium">{{ task.duration_days }} days</span>
                  </div>
                </div>
              </div>

              <!-- Progress -->
              <div>
                <h4 class="text-sm font-medium text-gray-700 mb-2">Progress</h4>
                <div class="space-y-2">
                  <div class="flex justify-between">
                    <span class="text-sm text-gray-600">Completion:</span>
                    <span class="text-sm font-medium">{{ task.progress_pct }}%</span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      :style="{ width: `${task.progress_pct}%` }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column -->
            <div class="space-y-6">
              <!-- Status -->
              <div>
                <h4 class="text-sm font-medium text-gray-700 mb-2">Status</h4>
                <div class="flex items-center space-x-2">
                  <div :class="statusIndicatorClass" class="w-3 h-3 rounded-full"></div>
                  <span class="text-sm font-medium">{{ statusLabel }}</span>
                </div>
              </div>

              <!-- Created/Updated -->
              <div>
                <h4 class="text-sm font-medium text-gray-700 mb-2">Timeline</h4>
                <div class="space-y-2">
                  <div class="flex justify-between">
                    <span class="text-sm text-gray-600">Created:</span>
                    <span class="text-sm font-medium">{{ formatDateTime(task.created_at) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm text-gray-600">Updated:</span>
                    <span class="text-sm font-medium">{{ formatDateTime(task.updated_at) }}</span>
                  </div>
                </div>
              </div>

              <!-- Dependencies -->
              <div v-if="task.dependencies && task.dependencies.length > 0">
                <h4 class="text-sm font-medium text-gray-700 mb-2">Dependencies</h4>
                <div class="space-y-2">
                  <div 
                    v-for="dep in task.dependencies" 
                    :key="dep.predecessor_id"
                    class="text-sm text-gray-600"
                  >
                    <span class="font-medium">{{ getDependencyTypeLabel(dep.type) }}</span>
                    <span v-if="dep.lag_days > 0" class="text-gray-500">
                      (+{{ dep.lag_days }}d)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div v-if="task.notes" class="mt-6 pt-6 border-t border-gray-200">
            <h4 class="text-sm font-medium text-gray-700 mb-2">Notes</h4>
            <p class="text-sm text-gray-900 whitespace-pre-wrap">{{ task.notes }}</p>
          </div>

          <!-- Dependencies Details -->
          <div v-if="hasDependencies" class="mt-6 pt-6 border-t border-gray-200">
            <h4 class="text-sm font-medium text-gray-700 mb-4">Dependency Details</h4>
            <div class="space-y-3">
              <div 
                v-for="dep in task.dependencies" 
                :key="dep.predecessor_id"
                class="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <div class="flex items-center space-x-3">
                  <span class="text-sm font-medium">{{ getDependencyTypeLabel(dep.type) }}</span>
                  <span v-if="dep.lag_days > 0" class="text-xs text-gray-500">
                    +{{ dep.lag_days }} days
                  </span>
                </div>
                <span class="text-xs text-gray-500">Predecessor ID: {{ dep.predecessor_id }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Task } from '@/core/types/task'

interface Props {
  isOpen: boolean
  task: Task | null
  canEdit?: boolean
  canDelete?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  task: null,
  canEdit: false,
  canDelete: false
})

const emit = defineEmits<{
  'close': []
  'edit': [task: Task]
  'delete': [task: Task]
}>()

// Computed properties
const statusLabel = computed(() => {
  if (!props.task) return ''
  
  switch (props.task.status) {
    case 'planned': return 'Planned'
    case 'in_progress': return 'In Progress'
    case 'done': return 'Completed'
    case 'blocked': return 'Blocked'
    case 'delayed': return 'Delayed'
    default: return 'Unknown'
  }
})

const statusBadgeClass = computed(() => {
  if (!props.task) return ''
  
  switch (props.task.status) {
    case 'planned': return 'bg-blue-100 text-blue-800'
    case 'in_progress': return 'bg-green-100 text-green-800'
    case 'done': return 'bg-gray-100 text-gray-800'
    case 'blocked': return 'bg-red-100 text-red-800'
    case 'delayed': return 'bg-yellow-100 text-yellow-800'
    default: return 'bg-gray-100 text-gray-800'
  }
})

const statusIndicatorClass = computed(() => {
  if (!props.task) return ''
  
  switch (props.task.status) {
    case 'planned': return 'bg-blue-500'
    case 'in_progress': return 'bg-green-500'
    case 'done': return 'bg-gray-500'
    case 'blocked': return 'bg-red-500'
    case 'delayed': return 'bg-yellow-500'
    default: return 'bg-gray-500'
  }
})

const hasDependencies = computed(() => {
  return props.task?.dependencies && props.task.dependencies.length > 0
})

// Methods
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getDependencyTypeLabel(type: string): string {
  switch (type) {
    case 'FS': return 'Finish-to-Start'
    case 'SS': return 'Start-to-Start'
    case 'FF': return 'Finish-to-Finish'
    case 'SF': return 'Start-to-Finish'
    default: return type
  }
}

function editTask() {
  if (props.task) {
    emit('edit', props.task)
  }
}

function deleteTask() {
  if (props.task) {
    emit('delete', props.task)
  }
}

function closeModal() {
  emit('close')
}
</script>

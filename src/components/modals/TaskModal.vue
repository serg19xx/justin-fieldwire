<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" @click="closeModal"></div>
    
    <!-- Modal -->
    <div class="flex min-h-full items-center justify-center p-4">
      <div class="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ isEditing ? 'Edit Task' : 'Create New Task' }}
          </h3>
          <button
            @click="closeModal"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
          <!-- Task Name -->
          <div>
            <label for="taskName" class="block text-sm font-medium text-gray-700 mb-2">
              Task Name *
            </label>
            <input
              id="taskName"
              v-model="formData.name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter task name"
            />
          </div>

          <!-- Task Type -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="taskType" class="block text-sm font-medium text-gray-700 mb-2">
                Task Type
              </label>
              <select
                id="taskType"
                v-model="formData.milestone"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                @change="handleTaskTypeChange"
              >
                <option :value="false">Regular Task</option>
                <option :value="true">Milestone</option>
              </select>
            </div>

            <!-- Milestone Type (only for milestones) -->
            <div v-if="formData.milestone">
              <label for="milestoneType" class="block text-sm font-medium text-gray-700 mb-2">
                Milestone Type
              </label>
              <select
                id="milestoneType"
                v-model="formData.milestone_type"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="inspection">Inspection</option>
                <option value="visit">Visit</option>
                <option value="meeting">Meeting</option>
                <option value="review">Review</option>
                <option value="delivery">Delivery</option>
                <option value="approval">Approval</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <!-- Dates -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="startDate" class="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                id="startDate"
                v-model="formData.start_planned"
                type="date"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div v-if="!formData.milestone">
              <label for="endDate" class="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                id="endDate"
                v-model="formData.end_planned"
                type="date"
                :min="formData.start_planned"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <!-- Duration (only for regular tasks) -->
            <div v-if="!formData.milestone">
              <label for="duration" class="block text-sm font-medium text-gray-700 mb-2">
                Duration (days)
              </label>
              <input
                id="duration"
                v-model.number="formData.duration_days"
                type="number"
                min="1"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                @change="calculateEndDate"
              />
            </div>
          </div>

          <!-- Status and Progress -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="status" class="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                v-model="formData.status"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="planned">Planned</option>
                <option value="scheduled">Scheduled</option>
                <option value="scheduled_accepted">Scheduled Accepted</option>
                <option value="in_progress">In Progress</option>
                <option value="partially_completed">Partially Completed</option>
                <option value="delayed_due_to_issue">Delayed Due To Issue</option>
                <option value="ready_for_inspection">Ready For Inspection</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label for="progress" class="block text-sm font-medium text-gray-700 mb-2">
                Progress (%)
              </label>
              <input
                id="progress"
                v-model.number="formData.progress_pct"
                type="number"
                min="0"
                max="100"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <!-- Notes -->
          <div>
            <label for="notes" class="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              v-model="formData.notes"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter task notes or description"
            ></textarea>
          </div>

          <!-- Actions -->
          <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isSubmitting ? 'Saving...' : (isEditing ? 'Update Task' : 'Create Task') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Task, TaskCreateUpdate, MilestoneType, TaskStatus } from '@/core/types/task'
import { tasksApi } from '@/core/utils/tasks-api'

interface Props {
  isOpen: boolean
  task?: Task | null
  projectId: number
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  task: null,
  projectId: 0
})

const emit = defineEmits<{
  'close': []
  'task-saved': [task: Task]
  'task-updated': [task: Task]
}>()

// Form data
const formData = ref<TaskCreateUpdate>({
  name: '',
  start_planned: '',
  end_planned: '',
  duration_days: 1,
  milestone: false,
  milestone_type: 'other',
  status: 'planned',
  progress_pct: 0,
  notes: ''
})

const isSubmitting = ref(false)

// Computed properties
const isEditing = computed(() => !!props.task)

// Watch for task changes
watch(() => props.task, (newTask) => {
  if (newTask) {
    formData.value = {
      name: newTask.name,
      start_planned: newTask.start_planned,
      end_planned: newTask.end_planned || '',
      duration_days: newTask.duration_days || 1,
      milestone: newTask.milestone,
      milestone_type: newTask.milestone_type || 'other',
      status: newTask.status,
      progress_pct: newTask.progress_pct,
      notes: newTask.notes || ''
    }
  } else {
    resetForm()
  }
}, { immediate: true })

// Methods
function resetForm() {
  formData.value = {
    name: '',
    start_planned: '',
    end_planned: '',
    duration_days: 1,
    milestone: false,
    milestone_type: 'other',
    status: 'planned',
    progress_pct: 0,
    notes: ''
  }
}

function handleTaskTypeChange() {
  if (formData.value.milestone) {
    // For milestones, clear end date and duration
    formData.value.end_planned = ''
    formData.value.duration_days = 1
  } else {
    // For regular tasks, calculate end date if start date is set
    calculateEndDate()
  }
}

function calculateEndDate() {
  if (!formData.value.milestone && formData.value.start_planned && formData.value.duration_days) {
    const startDate = new Date(formData.value.start_planned)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + formData.value.duration_days - 1)
    formData.value.end_planned = endDate.toISOString().split('T')[0]
  }
}

async function handleSubmit() {
  if (isSubmitting.value) return

  isSubmitting.value = true

  try {
    if (isEditing.value && props.task) {
      // Update existing task
      const updatedTask = await tasksApi.update(Number(props.task.id), {
        ...formData.value,
        project_id: props.projectId
      })
      emit('task-updated', updatedTask)
    } else {
      // Create new task
      const newTask = await tasksApi.create({
        ...formData.value,
        project_id: props.projectId
      })
      emit('task-saved', newTask)
    }
    
    closeModal()
  } catch (error) {
    console.error('Error saving task:', error)
    // TODO: Show error message to user
  } finally {
    isSubmitting.value = false
  }
}

function closeModal() {
  emit('close')
}
</script>

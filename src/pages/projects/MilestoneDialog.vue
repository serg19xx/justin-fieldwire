<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
    @click="closeDialog"
  >
    <div
      class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
      @click.stop
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
        <h2 class="text-lg sm:text-xl font-semibold text-gray-900">
          {{
            mode === 'create'
              ? 'Create New Milestone'
              : mode === 'edit'
                ? 'Edit Milestone'
                : 'Milestone Details'
          }}
        </h2>
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

      <!-- Content -->
      <div class="p-4 sm:p-6">
        <form @submit.prevent="handleSubmit">
          <!-- Milestone Name -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2"> Milestone Name * </label>
            <input
              v-model="form.name"
              :disabled="mode === 'view'"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              placeholder="Enter milestone name"
            />
          </div>

          <!-- Project Lead -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Project Lead <span class="text-red-400">*</span>
            </label>
            <select
              v-model="form.project_lead"
              :disabled="mode === 'view'"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            >
              <option value="">Select responsible person</option>
              <option v-for="person in availablePeople" :key="person.id" :value="person.id">
                {{ person.name }} ({{ person.role }})
              </option>
            </select>
          </div>

          <!-- Milestone Date -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2"> Milestone Date * </label>
            <input
              v-model="form.start_planned"
              :disabled="mode === 'view'"
              type="date"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            />
          </div>

          <!-- Status -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2"> Status </label>
            <select
              v-model="form.status"
              :disabled="mode === 'view'"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            >
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
              <option value="blocked">Blocked</option>
              <option value="delayed">Delayed</option>
            </select>
          </div>

          <!-- Milestone Type -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2"> Milestone Type </label>
            <select
              v-model="form.milestone_type"
              :disabled="mode === 'view'"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            >
              <option value="inspection">🔍 Inspection</option>
              <option value="visit">🏗️ Site Visit</option>
              <option value="meeting">👥 Meeting</option>
              <option value="review">📋 Review</option>
              <option value="delivery">📦 Delivery</option>
              <option value="approval">✅ Approval</option>
              <option value="other">🎯 Other</option>
            </select>
          </div>

          <!-- Notes -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2"> Notes </label>
            <textarea
              v-model="form.notes"
              :disabled="mode === 'view'"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              placeholder="Milestone description and notes"
            ></textarea>
          </div>

          <!-- Validation Messages -->
          <div
            v-if="validationResult && !validationResult.isValid"
            class="mb-4 p-4 bg-red-50 border border-red-200 rounded-md"
          >
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div class="ml-3 flex-1">
                <h3 class="text-sm font-medium text-red-800">Validation Errors</h3>
                <div class="mt-2 text-sm text-red-700">
                  <ul class="list-disc list-inside space-y-1">
                    <li v-for="error in validationResult.errors" :key="error">{{ error }}</li>
                  </ul>
                </div>
                <!-- Action buttons for validation errors -->
                <div class="mt-3 flex space-x-2">
                  <!-- Project timeline not set -->
                  <div
                    v-if="
                      validationResult.errors.some(
                        (e) =>
                          e.includes('Project timeline is not set') ||
                          e.includes('Project timeline is incomplete'),
                      )
                    "
                    class="flex space-x-2"
                  >
                    <button
                      v-if="canManageProject"
                      @click="openProjectSettings"
                      type="button"
                      class="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Set Project Timeline
                    </button>
                    <span v-else class="text-sm text-gray-600">
                      Contact project manager to set project timeline
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Warnings -->
          <div
            v-if="validationResult && validationResult.warnings.length > 0"
            class="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md"
          >
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fill-rule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div class="ml-3 flex-1">
                <h3 class="text-sm font-medium text-yellow-800">Validation Warnings</h3>
                <div class="mt-2 text-sm text-yellow-700">
                  <ul class="list-disc list-inside space-y-1">
                    <li v-for="warning in validationResult.warnings" :key="warning">
                      {{ warning }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <button
                @click="closeDialog"
                type="button"
                class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                v-if="mode === 'edit' && canManageProject"
                @click="handleDelete"
                type="button"
                class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Delete
              </button>
              <button
                v-if="mode !== 'view'"
                type="submit"
                :disabled="!form.name || !form.start_planned"
                class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {{ mode === 'create' ? 'Create Milestone' : 'Save Changes' }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { Task, TaskStatus, MilestoneType } from '@/core/types/task'
import {
  validateTask,
  suggestProjectBoundsExtension,
  type ValidationResult,
} from '@/core/utils/task-validation'
import { projectApi, type Project } from '@/core/utils/project-api'
import { useAuthStore } from '@/core/stores/auth'

// Props
interface Props {
  isOpen: boolean
  mode: 'create' | 'edit' | 'view'
  task?: Task | null
  projectId: number
  initialDate?: string
  projectInfo?: Project | null
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  mode: 'create',
  task: null,
})

// Auth store
const authStore = useAuthStore()

// Check if current user is project owner/creator
// const isProjectOwner = computed(() => {
//   if (!projectInfo.value || !authStore.currentUser) return false
//   return projectInfo.value.prj_managger === authStore.currentUser.id
// })

// Check if user can manage project (owner or admin)
const canManageProject = computed(() => {
  if (!authStore.currentUser) return false

  // Simplified logic - allow all Project Managers and System Administrators
  const canManage = authStore.currentUser.role_code === 'admin' ||
         authStore.currentUser.role_code === 'project_manager'

  console.log('🔧 MilestoneDialog canManageProject check:', {
    roleCode: authStore.currentUser.role_code,
    canManage,
    currentUser: authStore.currentUser
  })

  // Temporary: always return true for debugging
  console.log('🔧 FORCING canManageProject to true for debugging')
  return true
})

// Emits
const emit = defineEmits<{
  close: []
  save: [task: Partial<Task>]
  delete: [taskId: string]
  projectUpdated: [project: Project]
  openProjectSettings: []
}>()

// Form data - simplified for milestones
const form = ref({
  name: '',
  start_planned: '',
  milestone: true, // Always true for milestones
  milestone_type: 'other' as MilestoneType,
  status: 'planned' as TaskStatus,
  notes: '',
  project_lead: null as number | null,
})

// Validation state
const validationResult = ref<ValidationResult>({ isValid: true, errors: [], warnings: [] })
const showValidationErrors = ref(false)
const projectBoundsExtension = ref({
  needsExtension: false,
  suggestedStart: '',
  suggestedEnd: '',
  reason: '',
})

// Use projectInfo from props or load it
const projectInfo = computed(() => props.projectInfo)

// Initialize form when dialog opens
watch(
  () => props.isOpen,
  async (isOpen) => {
    console.log('🔍 MilestoneDialog watch triggered:', {
      isOpen,
      mode: props.mode,
      initialDate: props.initialDate,
      hasTask: !!props.task,
    })

    if (isOpen && props.mode === 'create') {
      const currentDate = new Date().toISOString().split('T')[0]
      const startDate = props.initialDate || currentDate

      console.log('📅 Creating form for create mode:', {
        initialDate: props.initialDate,
        currentDate,
        startDate,
      })

      // Reset form for create mode
      form.value = {
        name: '',
        start_planned: startDate,
        milestone: true,
        milestone_type: 'other' as MilestoneType,
        status: 'planned' as TaskStatus,
        notes: '',
        project_lead: null as number | null,
      }

      // Force update after next tick to ensure DOM is updated
      await nextTick()
      console.log('✅ Form initialized for create mode:', {
        initialDate: props.initialDate,
        startPlanned: form.value.start_planned,
      })

      // Double-check that the date is set correctly
      if (props.initialDate && form.value.start_planned !== props.initialDate) {
        console.log('⚠️ Date mismatch detected, forcing update:', {
          expected: props.initialDate,
          actual: form.value.start_planned,
        })
        form.value.start_planned = props.initialDate
      }
    } else if (isOpen && props.task) {
      // Initialize form with task data for edit/view mode
      form.value = {
        name: props.task.name || '',
        start_planned: props.task.start_planned || '',
        milestone: true,
        milestone_type: props.task.milestone_type || 'other',
        status: props.task.status || 'planned',
        notes: props.task.notes || '',
        project_lead: props.task.task_lead_id || null,
      }
      console.log('📅 Form initialized for edit/view mode:', form.value)
    }
  },
)

// Watch for changes in initialDate to update form
watch(
  () => props.initialDate,
  (newInitialDate) => {
    if (props.isOpen && props.mode === 'create' && newInitialDate) {
      console.log('🔄 InitialDate changed, updating form:', {
        oldDate: form.value.start_planned,
        newDate: newInitialDate,
      })
      form.value.start_planned = newInitialDate
    }
  },
)

// Available data for dropdowns
const availablePeople = ref<Array<{ id: number; name: string; role: string }>>([
  { id: 47, name: 'Mike Davis', role: 'Project Manager' },
  { id: 23, name: 'John Smith', role: 'Foreman' },
  { id: 15, name: 'Sarah Johnson', role: 'Electrician' },
  { id: 8, name: 'Safety Team', role: 'Inspector' },
  { id: 52, name: 'Unknown User', role: 'Worker' },
])

// Load project information (only if not provided via props)
async function loadProjectInfo() {
  if (!props.projectId) return

  // If projectInfo is already provided via props, use it
  if (props.projectInfo) {
    console.log('📋 Using project info from props:', props.projectInfo)
    // Validate milestone data after project info is available
    if (form.value.start_planned) {
      validateMilestoneData()
    }
    return
  }

  // Fallback: load project info if not provided
  try {
    console.log('📋 Loading project info for validation:', props.projectId)
    const response = await projectApi.getById(props.projectId)
    console.log('✅ Project info loaded:', response)

    // Validate milestone data after project info is loaded
    if (form.value.start_planned) {
      validateMilestoneData()
    }
  } catch (error) {
    console.error('❌ Error loading project info:', error)
  }
}

watch(
  [() => props.isOpen, () => props.task, () => props.mode],
  () => {
    if (props.isOpen) {
      loadProjectInfo()
    }
  },
  { immediate: true },
)

// Watch for form changes to validate in real-time
watch(
  [() => form.value.start_planned],
  () => {
    if (props.isOpen && projectInfo.value && form.value.start_planned) {
      // Debounce validation to avoid too many calls
      setTimeout(() => {
        validateMilestoneData()
      }, 500)
    }
  },
  { deep: true },
)

// Validate milestone data
function validateMilestoneData(): boolean {
  if (!projectInfo.value) {
    console.warn('⚠️ No project info available for validation')
    validationResult.value = {
      isValid: false,
      errors: ['Project information not available. Please refresh the page.'],
      warnings: [],
    }
    return false
  }

  // Check if project has bounds set
  if (!projectInfo.value.date_start || !projectInfo.value.date_end) {
    console.warn('⚠️ Project bounds not set, blocking milestone creation')
    console.log('🔍 Project bounds details:', {
      date_start: projectInfo.value.date_start,
      date_end: projectInfo.value.date_end,
      hasStart: !!projectInfo.value.date_start,
      hasEnd: !!projectInfo.value.date_end,
    })

    const errorMessage =
      projectInfo.value.date_start || projectInfo.value.date_end
        ? 'Project timeline is incomplete. Please set both start and end dates in project settings.'
        : 'Project timeline is not set. Please set project start and end dates in project settings.'

    validationResult.value = {
      isValid: false,
      errors: [errorMessage],
      warnings: [],
    }
    return false
  }

  const taskData = {
    name: form.value.name,
    start_planned: form.value.start_planned,
    end_planned: form.value.start_planned, // For milestones, end = start
    startPlanned: form.value.start_planned,
    endPlanned: form.value.start_planned, // For milestones, end = start
    dependencies: [], // Milestones don't have dependencies
  }

  const projectBounds = {
    startDate: projectInfo.value.date_start,
    endDate: projectInfo.value.date_end,
  }

  console.log('🔍 Project bounds for validation:', projectBounds)
  console.log('🔍 Milestone date for validation:', {
    start_planned: form.value.start_planned,
    end_planned: form.value.start_planned,
  })

  validationResult.value = validateTask(taskData, projectBounds, [])

  // Check if project bounds extension is needed
  projectBoundsExtension.value = suggestProjectBoundsExtension(taskData, projectBounds)

  console.log('🔍 Validation result:', validationResult.value)
  console.log('🔍 Project bounds extension:', projectBoundsExtension.value)

  if (!validationResult.value.isValid) {
    return false
  }

  return true
}

function closeDialog() {
  emit('close')
  showValidationErrors.value = false
  validationResult.value = { isValid: true, errors: [], warnings: [] }
  projectBoundsExtension.value = {
    needsExtension: false,
    suggestedStart: '',
    suggestedEnd: '',
    reason: '',
  }
}

function openProjectSettings() {
  emit('openProjectSettings')
  closeDialog()
}

function handleSubmit() {
  console.log('💾 Submitting milestone form:', form.value)
  console.log('🔍 Form validation state:', validationResult.value)

  // Validate milestone data before submission
  if (!validateMilestoneData()) {
    console.log('❌ Milestone validation failed, not submitting')
    console.log('❌ Validation errors:', validationResult.value.errors)
    console.log('❌ Validation warnings:', validationResult.value.warnings)
    return
  }

  console.log('✅ Milestone validation passed, proceeding with save')

  const taskData: Partial<Task> = {
    ...form.value,
    project_id: props.projectId,
    // For milestones, end_planned = start_planned
    end_planned: form.value.start_planned,
    // Milestones don't have these fields
    wbs_path: undefined,
    duration_days: 1,
    progress_pct: 0,
    dependencies: [],
    resources: [],
    team_members: [],
    // Send task lead
    task_lead_id: form.value.project_lead || undefined,
  }

  if (props.mode === 'edit' && props.task) {
    taskData.id = props.task.id
  }

  console.log('📤 Emitting save event with milestone data:', taskData)
  emit('save', taskData)
  console.log('✅ Save event emitted successfully')
}

function handleDelete() {
  if (props.task) {
    if (
      confirm(`Are you sure you want to delete "${props.task.name}"? This action cannot be undone.`)
    ) {
      emit('delete', props.task.id)
      closeDialog()
    }
  }
}
</script>

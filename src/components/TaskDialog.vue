<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click="closeDialog"
  >
    <div
      class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      @click.stop
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 class="text-xl font-semibold text-gray-900">
          {{
            mode === 'create'
              ? 'Create New Task'
              : mode === 'edit'
                ? 'Edit Task'
                : 'Task Details'
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
      <div class="p-6">
        <form @submit.prevent="handleSubmit">
          <!-- Task Name -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2"> Task Name * </label>
            <input
              v-model="form.name"
              :disabled="mode === 'view'"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              placeholder="Enter task name"
            />
          </div>

          <!-- WBS Path and Project Lead Row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                WBS Path <span class="text-gray-400">(optional)</span>
              </label>
              <input
                v-model="form.wbs_path"
                :disabled="mode === 'view'"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                placeholder="e.g., 1.1.1"
              />
            </div>
            <div>
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
          </div>


          <!-- Dates Row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"> Start Date * </label>
              <input
                v-model="form.start_planned"
                :disabled="mode === 'view'"
                type="date"
                required
                :class="[
                  'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 disabled:bg-gray-50',
                  hasDateValidationError('start') ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                ]"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"> End Date </label>
              <input
                v-model="form.end_planned"
                :disabled="mode === 'view'"
                type="date"
                :class="[
                  'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 disabled:bg-gray-50',
                  hasDateValidationError('end') ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                ]"
              />
            </div>
          </div>

          <!-- Duration and Progress Row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Duration (Days) <span class="text-gray-400">(auto-calculated)</span>
              </label>
              <input
                :value="computedDuration"
                disabled
                type="number"
                class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"> Progress (%) </label>
              <input
                v-model.number="form.progress_pct"
                :disabled="mode === 'view'"
                type="number"
                min="0"
                max="100"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>
          </div>


          <!-- Status Row -->
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


          <!-- Dependencies -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Dependencies
              <span class="text-gray-400">(tasks that must finish before this task)</span>
            </label>
            <!-- Debug info -->
            <div class="text-xs text-gray-500 mb-2">
              Debug: Available tasks: {{ availableTasks?.length || 0 }},
              Dependencies: {{ form.dependencies.length }},
              Current deps: {{ JSON.stringify(form.dependencies) }}
            </div>
            <div class="space-y-2">
              <div
                v-for="(dep, index) in form.dependencies"
                :key="index"
                class="flex items-center space-x-2 p-2 bg-gray-50 rounded-md"
              >
                <select
                  v-model="dep.taskId"
                  :disabled="mode === 'view'"
                  class="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Select predecessor task</option>
                  <option v-for="task in availableTasks || []" :key="task.id" :value="String(task.id)">
                    {{ task.milestone ? '🎯' : '📋' }} {{ task.name }} ({{ task.wbs_path || 'No WBS' }})
                  </option>
                </select>
                <select
                  v-model="dep.type"
                  :disabled="mode === 'view'"
                  class="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="FS">Finish-to-Start</option>
                  <option value="SS">Start-to-Start</option>
                  <option value="FF">Finish-to-Finish</option>
                  <option value="SF">Start-to-Finish</option>
                </select>
                <input
                  v-model.number="dep.lagDays"
                  :disabled="mode === 'view'"
                  type="number"
                  min="0"
                  placeholder="Lag"
                  class="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
                <span class="text-xs text-gray-500">days</span>
                <button
                  v-if="mode !== 'view'"
                  @click="removeDependency(index)"
                  type="button"
                  class="p-1 text-red-500 hover:text-red-700"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                </button>
              </div>
              <button
                v-if="mode !== 'view'"
                @click="addDependency"
                type="button"
                class="w-full px-3 py-2 border border-dashed border-gray-300 text-gray-600 rounded-md hover:border-gray-400 hover:text-gray-800 transition-colors text-sm"
              >
                + Add Dependency
              </button>
            </div>
          </div>

          <!-- Resources -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Resources <span class="text-gray-400">(equipment, materials)</span>
            </label>
            <div class="space-y-2">
              <div
                v-for="(resource, index) in form.resources"
                :key="index"
                class="flex items-center space-x-2"
              >
                <input
                  v-model="form.resources[index]"
                  :disabled="mode === 'view'"
                  type="text"
                  placeholder="e.g., excavator_1, concrete_mixer, crane_2"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 text-sm"
                />
                <button
                  v-if="mode !== 'view'"
                  @click="removeResource(index)"
                  type="button"
                  class="p-2 text-red-500 hover:text-red-700"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                </button>
              </div>
              <button
                v-if="mode !== 'view'"
                @click="addResource"
                type="button"
                class="w-full px-3 py-2 border border-dashed border-gray-300 text-gray-600 rounded-md hover:border-gray-400 hover:text-gray-800 transition-colors text-sm"
              >
                + Add Resource
              </button>
            </div>
          </div>

          <!-- Team Members (Working Team) -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Team Members <span class="text-gray-400">(people working on this task)</span>
            </label>
            <div class="space-y-2">
              <div
                v-for="(member, index) in form.team_members"
                :key="index"
                class="flex items-center space-x-2"
              >
                <select
                  v-model="form.team_members[index]"
                  :disabled="mode === 'view'"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 text-sm"
                >
                  <option value="">Select team member</option>
                  <option v-for="person in availablePeople" :key="person.id" :value="person.id">
                    {{ person.name }} ({{ person.role }})
                  </option>
                </select>
                <button
                  v-if="mode !== 'view'"
                  @click="removeTeamMember(index)"
                  type="button"
                  class="p-2 text-red-500 hover:text-red-700"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                </button>
              </div>
              <button
                v-if="mode !== 'view'"
                @click="addTeamMember"
                type="button"
                class="w-full px-3 py-2 border border-dashed border-gray-300 text-gray-600 rounded-md hover:border-gray-400 hover:text-gray-800 transition-colors text-sm"
              >
                + Add Team Member
              </button>
            </div>
          </div>

          <!-- Notes -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2"> Notes </label>
            <textarea
              v-model="form.notes"
              :disabled="mode === 'view'"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              placeholder="Task description and notes"
            ></textarea>
          </div>

          <!-- Validation Messages -->
          <div v-if="validationResult && !validationResult.isValid" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
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
                  <div v-if="validationResult.errors.some(e => e.includes('Project timeline is not set') || e.includes('Project timeline is incomplete'))" class="flex space-x-2">
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
          <div v-if="validationResult && validationResult.warnings.length > 0" class="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3 flex-1">
                <h3 class="text-sm font-medium text-yellow-800">Validation Warnings</h3>
                <div class="mt-2 text-sm text-yellow-700">
                  <ul class="list-disc list-inside space-y-1">
                    <li v-for="warning in validationResult.warnings" :key="warning">{{ warning }}</li>
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
                 v-if="mode === 'edit' && canManageProject"
                 @click="handleDuplicate"
                 type="button"
                 class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
               >
                 Duplicate
               </button>
              <button
                v-if="mode !== 'view'"
                type="submit"
                :disabled="!form.name || !form.start_planned || !form.end_planned"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {{ mode === 'create' ? 'Create Task' : 'Save Changes' }}
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
import type { Task, TaskStatus } from '@/types/task'
import { validateTask, suggestProjectBoundsExtension, type ValidationResult } from '@/utils/task-validation'
import { projectsApi, type Project } from '@/utils/contacts-api'
import { useAuthStore } from '@/stores/auth'

// Props
interface Props {
  isOpen: boolean
  mode: 'create' | 'edit' | 'view'
  task?: Task | null
  projectId: number
  availableTasks?: Task[]
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
const isProjectOwner = computed(() => {
  if (!projectInfo.value || !authStore.currentUser) return false

  // Check if current user is the project creator/owner
  // Check if user is project manager
  return projectInfo.value.prj_managger === authStore.currentUser.id
})

// Check if user can manage project (owner or admin)
const canManageProject = computed(() => {
  if (!authStore.currentUser) return false

  return isProjectOwner.value ||
         authStore.currentUser.user_type === 'System Administrator' ||
         authStore.currentUser.user_type === 'Project Manager'
})

// Emits
const emit = defineEmits<{
  close: []
  save: [task: Partial<Task>]
  delete: [taskId: string]
  duplicate: [task: Task]
  projectUpdated: [project: Project]
  openProjectSettings: []
}>()

// Form data
const form = ref({
  name: '',
  wbs_path: '',
  start_planned: '',
  end_planned: '',
  duration_days: 1,
  milestone: false,
  status: 'planned' as TaskStatus,
  progress_pct: 0,
  notes: '',
  dependencies: [] as Array<{ taskId: string; type: string; lagDays: number }>,
  resources: [] as string[],
  project_lead: null as number | null,
  team_members: [] as number[],
})

// Validation state
const validationResult = ref<ValidationResult>({ isValid: true, errors: [], warnings: [] })
const showValidationErrors = ref(false)
const projectBoundsExtension = ref({ needsExtension: false, suggestedStart: '', suggestedEnd: '', reason: '' })

// Use projectInfo from props or load it
const projectInfo = computed(() => props.projectInfo)

// Initialize form when dialog opens
watch(() => props.isOpen, async (isOpen) => {
  console.log('🔍 TaskDialog watch triggered:', {
    isOpen,
    mode: props.mode,
    initialDate: props.initialDate,
    hasTask: !!props.task
  })

  if (isOpen && props.mode === 'create') {
    const currentDate = new Date().toISOString().split('T')[0]
    const startDate = props.initialDate || currentDate

    console.log('📅 Creating form for create mode:', {
      initialDate: props.initialDate,
      currentDate,
      startDate
    })

    // Reset form for create mode
    form.value = {
      name: '',
      wbs_path: '',
      start_planned: startDate, // Use initialDate or current date
      end_planned: '', // End date for tasks
      duration_days: 1,
      milestone: false,
      status: 'planned' as TaskStatus,
      progress_pct: 0,
      notes: '',
      dependencies: [] as Array<{ taskId: string; type: string; lagDays: number }>,
      resources: [] as string[],
      project_lead: null as number | null,
      team_members: [] as number[],
    }

    // Force update after next tick to ensure DOM is updated
    await nextTick()
    console.log('✅ Form initialized for create mode:', {
      initialDate: props.initialDate,
      startPlanned: form.value.start_planned,
      formStartPlanned: form.value.start_planned
    })

    // Double-check that the date is set correctly
    if (props.initialDate && form.value.start_planned !== props.initialDate) {
      console.log('⚠️ Date mismatch detected, forcing update:', {
        expected: props.initialDate,
        actual: form.value.start_planned
      })
      form.value.start_planned = props.initialDate
    }
  } else if (isOpen && props.task) {
    // Initialize form with task data for edit/view mode
    form.value = {
      name: props.task.name || '',
      wbs_path: props.task.wbs_path || '',
      start_planned: props.task.start_planned || '',
      end_planned: props.task.end_planned || '',
      duration_days: props.task.duration_days || 1,
      milestone: props.task.milestone || false,
      status: props.task.status || 'planned',
      progress_pct: props.task.progress_pct || 0,
      notes: props.task.notes || '',
      dependencies: (props.task.dependencies || []).map(dep => {
        if (typeof dep === 'object') {
          return {
            taskId: String(dep.predecessor_id),
            type: dep.type,
            lagDays: dep.lag_days || 0
          }
        }
        return {
          taskId: String(dep),
          type: 'FS',
          lagDays: 0
        }
      }),
      resources: props.task.resources || [],
      project_lead: props.task.task_lead_id || null,
      team_members: props.task.team_members || [],
    }
    console.log('📅 Form initialized for edit/view mode:', form.value)
  }
})

// Watch for changes in initialDate to update form
watch(() => props.initialDate, (newInitialDate) => {
  if (props.isOpen && props.mode === 'create' && newInitialDate) {
    console.log('🔄 InitialDate changed, updating form:', {
      oldDate: form.value.start_planned,
      newDate: newInitialDate
    })
    form.value.start_planned = newInitialDate
  }
})

// Available data for dropdowns
const availablePeople = ref<Array<{ id: number; name: string; role: string }>>([
  { id: 47, name: 'Mike Davis', role: 'Project Manager' },
  { id: 23, name: 'John Smith', role: 'Foreman' },
  { id: 15, name: 'Sarah Johnson', role: 'Electrician' },
  { id: 8, name: 'Safety Team', role: 'Inspector' },
  { id: 52, name: 'Unknown User', role: 'Worker' }, // Add missing user
])

// Computed duration
const computedDuration = computed(() => {
  if (form.value.start_planned && form.value.end_planned) {
    const startDate = new Date(form.value.start_planned)
    const endDate = new Date(form.value.end_planned)
    const diffTime = endDate.getTime() - startDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays > 0 ? diffDays : 1
  }
  return form.value.duration_days || 1
})

// Date validation helpers
function hasDateValidationError(dateType: 'start' | 'end'): boolean {
  if (!validationResult.value || !validationResult.value.errors) return false

  const errors = validationResult.value.errors
  if (dateType === 'start') {
    return errors.some(error =>
      error.includes('starts before project') ||
      error.includes('start date')
    )
  } else {
    return errors.some(error =>
      error.includes('ends after project') ||
      error.includes('end date') ||
      error.includes('before start date')
    )
  }
}


// Reset form when dialog opens/closes or task changes
// Load project information (only if not provided via props)
async function loadProjectInfo() {
  if (!props.projectId) return

  // If projectInfo is already provided via props, use it
  if (props.projectInfo) {
    console.log('📋 Using project info from props:', props.projectInfo)
    console.log('🔍 Project bounds check:', {
      date_start: props.projectInfo?.date_start,
      date_end: props.projectInfo?.date_end,
      date_start_type: typeof props.projectInfo?.date_start,
      date_end_type: typeof props.projectInfo?.date_end,
      date_start_null: props.projectInfo?.date_start === null,
      date_end_null: props.projectInfo?.date_end === null,
      date_start_undefined: props.projectInfo?.date_start === undefined,
      date_end_undefined: props.projectInfo?.date_end === undefined,
      date_start_empty: props.projectInfo?.date_start === '',
      date_end_empty: props.projectInfo?.date_end === ''
    })

    // Validate task data after project info is available
    if (form.value.start_planned) {
      validateTaskData()
    }
    return
  }

  // Fallback: load project info if not provided
  try {
    console.log('📋 Loading project info for validation:', props.projectId)
    const response = await projectsApi.getById(props.projectId)
    console.log('✅ Project info loaded:', response)
    console.log('🔍 Project bounds check:', {
      date_start: response?.date_start,
      date_end: response?.date_end,
      date_start_type: typeof response?.date_start,
      date_end_type: typeof response?.date_end,
      date_start_null: response?.date_start === null,
      date_end_null: response?.date_end === null,
      date_start_undefined: response?.date_start === undefined,
      date_end_undefined: response?.date_end === undefined,
      date_start_empty: response?.date_start === '',
      date_end_empty: response?.date_end === ''
    })

    // Validate task data after project info is loaded
    if (form.value.start_planned) {
      validateTaskData()
    }
  } catch (error) {
    console.error('❌ Error loading project info:', error)
  }
}

watch(
  [() => props.isOpen, () => props.task, () => props.mode],
  () => {
    if (props.isOpen) {
      resetForm()
      loadProjectInfo()
    }
  },
  { immediate: true },
)

// Watch for form changes to validate in real-time
watch(
  [() => form.value.start_planned, () => form.value.end_planned, () => form.value.dependencies],
  () => {
    if (props.isOpen && projectInfo.value && form.value.start_planned) {
      // Debounce validation to avoid too many calls
      setTimeout(() => {
        validateTaskData()
      }, 500)
    }
  },
  { deep: true }
)

// Duration is now computed automatically from dates

function resetForm() {
  if (props.task && (props.mode === 'edit' || props.mode === 'view')) {
    // Populate form with existing task data
    console.log('🔧 Loading task data:', props.task)
    console.log('🔧 Task lead ID:', props.task.task_lead_id)
    console.log('🔧 Legacy assignees:', props.task.assignees)
    console.log(
      '🔧 Available people:',
      availablePeople.value.map((p) => ({ id: p.id, name: p.name })),
    )

    // Add missing users to the list if they don't exist
    const leadId =
      props.task.task_lead_id ||
      (props.task.assignees && props.task.assignees.length > 0 ? props.task.assignees[0] : null)

    console.log('🔧 Calculated lead ID:', leadId, 'type:', typeof leadId)

    if (leadId) {
      const existingPerson = availablePeople.value.find(
        (p) => p.id === leadId || String(p.id) === String(leadId),
      )
      console.log('🔧 Found existing person:', existingPerson)

      if (!existingPerson) {
        console.log('🔧 Adding missing user to list:', leadId)
        availablePeople.value.push({ id: Number(leadId), name: `User ${leadId}`, role: 'Worker' })
        console.log(
          '🔧 Updated people list:',
          availablePeople.value.map((p) => ({ id: p.id, name: p.name })),
        )
      }
    }

    console.log('📝 Initializing form with task:', props.task.name)
    console.log('🔗 Task dependencies (raw from API):', props.task.dependencies)
    console.log('🔗 Task dependencies type:', typeof props.task.dependencies)
    console.log('🔗 Task dependencies length:', props.task.dependencies?.length)
    console.log('📋 Available tasks for dependencies:', props.availableTasks?.length || 0)
    console.log('📋 Available task IDs:', props.availableTasks?.map(t => ({ id: t.id, name: t.name })))

    const processedDependencies = (props.task.dependencies || []).map((dep, index) => {
      console.log(`🔗 Processing dependency ${index}:`, dep, 'type:', typeof dep)

      if (typeof dep === 'number') {
        // Old format - just ID
        console.log('🔗 Old format dependency (number):', dep)
        return {
          taskId: String(dep),
          type: 'FS',
          lagDays: 0,
        }
      } else if (typeof dep === 'string') {
        // String format - just ID as string
        console.log('🔗 String format dependency:', dep)
        return {
          taskId: dep,
          type: 'FS',
          lagDays: 0,
        }
      } else if (dep && typeof dep === 'object') {
        // New format - full dependency object
        console.log('🔗 Object format dependency:', dep)
        console.log('🔗 Object keys:', Object.keys(dep))
        console.log('🔗 predecessor_id:', dep.predecessor_id, 'type:', typeof dep.predecessor_id)
        return {
          taskId: String(dep.predecessor_id),
          type: dep.type || 'FS',
          lagDays: dep.lag_days || 0,
        }
      } else {
        console.log('🔗 Unknown dependency format:', dep)
        return {
          taskId: '',
          type: 'FS',
          lagDays: 0,
        }
      }
    })

    console.log('🔗 Processed dependencies:', processedDependencies)

    form.value = {
      name: props.task.name,
      wbs_path: props.task.wbs_path || '',
      start_planned: props.task.start_planned,
      end_planned: props.task.end_planned || '',
      duration_days: props.task.duration_days || 1,
      milestone: props.task.milestone,
      status: props.task.status,
      progress_pct: props.task.progress_pct,
      notes: props.task.notes || '',
      dependencies: processedDependencies,
      resources: [...(props.task.resources || [])],
      project_lead:
        props.task.task_lead_id ||
        (props.task.assignees && props.task.assignees.length > 0 ? props.task.assignees[0] : null),
      team_members: [...(props.task.team_members || props.task.assignees?.slice(1) || [])],
    }
  } else {
    // Reset to default values for create mode
    form.value = {
      name: '',
      wbs_path: '',
      start_planned: new Date().toISOString().split('T')[0], // Today's date
      end_planned: '',
      duration_days: 1,
      milestone: false,
      status: 'planned',
      progress_pct: 0,
      notes: '',
      dependencies: [],
      resources: [],
      project_lead: null,
      team_members: [],
    }
  }

  // Validate task data after form is reset
  if (projectInfo.value && form.value.start_planned) {
    setTimeout(() => {
      validateTaskData()
    }, 100)
  }
}

// Dependency management
function addDependency() {
  form.value.dependencies.push({
    taskId: '',
    type: 'FS',
    lagDays: 0,
  })
}

function removeDependency(index: number) {
  form.value.dependencies.splice(index, 1)
}

// Resource management
function addResource() {
  form.value.resources.push('')
}

function removeResource(index: number) {
  form.value.resources.splice(index, 1)
}

// Team member management
function addTeamMember() {
  form.value.team_members.push(0)
}

function removeTeamMember(index: number) {
  form.value.team_members.splice(index, 1)
}

// Validate task data
function validateTaskData(): boolean {
  if (!projectInfo.value) {
    console.warn('⚠️ No project info available for validation')
    validationResult.value = {
      isValid: false,
      errors: ['Project information not available. Please refresh the page.'],
      warnings: []
    }
    return false
  }

  // Check if project has bounds set
  if (!projectInfo.value.date_start || !projectInfo.value.date_end) {
    console.warn('⚠️ Project bounds not set, blocking task creation')
    console.log('🔍 Project bounds details:', {
      date_start: projectInfo.value.date_start,
      date_end: projectInfo.value.date_end,
      hasStart: !!projectInfo.value.date_start,
      hasEnd: !!projectInfo.value.date_end
    })

    const errorMessage = projectInfo.value.date_start || projectInfo.value.date_end
      ? 'Project timeline is incomplete. Please set both start and end dates in project settings.'
      : 'Project timeline is not set. Please set project start and end dates in project settings.'

    validationResult.value = {
      isValid: false,
      errors: [errorMessage],
      warnings: []
    }
    return false
  }

  const taskData = {
    name: form.value.name,
    start_planned: form.value.start_planned,
    end_planned: form.value.end_planned,
    startPlanned: form.value.start_planned,
    endPlanned: form.value.end_planned,
    dependencies: form.value.dependencies
      .filter((dep) => dep.taskId)
      .map((dep) => ({
        predecessor_id: Number(dep.taskId),
        type: dep.type,
        lag_days: dep.lagDays || 0,
      })),
  }

  const projectBounds = {
    startDate: projectInfo.value.date_start,
    endDate: projectInfo.value.date_end,
  }

  console.log('🔍 Project bounds for validation:', projectBounds)
  console.log('🔍 Task dates for validation:', {
    start_planned: form.value.start_planned,
    end_planned: form.value.end_planned
  })

  validationResult.value = validateTask(taskData, projectBounds, props.availableTasks || [])

  // Check if project bounds extension is needed
  projectBoundsExtension.value = suggestProjectBoundsExtension(taskData, projectBounds)

  console.log('🔍 Validation result:', validationResult.value)
  console.log('🔍 Project bounds extension:', projectBoundsExtension.value)
  console.log('👤 User permissions:', {
    currentUser: authStore.currentUser?.name,
    userId: authStore.currentUser?.id,
    userType: authStore.currentUser?.user_type,
    projectInfo: projectInfo.value,
    isProjectOwner: isProjectOwner.value,
    canManageProject: canManageProject.value
  })

  if (!validationResult.value.isValid) {
    // Validation errors are now shown directly in the dialog
    return false
  }

  return true
}



function closeDialog() {
  emit('close')
  showValidationErrors.value = false
  validationResult.value = { isValid: true, errors: [], warnings: [] }
  projectBoundsExtension.value = { needsExtension: false, suggestedStart: '', suggestedEnd: '', reason: '' }
}

function openProjectSettings() {
  emit('openProjectSettings')
  closeDialog()
}

function handleSubmit() {
  console.log('💾 Submitting task form:', form.value)
  console.log('🔍 Form validation state:', validationResult.value)

  // Validate task data before submission
  if (!validateTaskData()) {
    console.log('❌ Task validation failed, not submitting')
    console.log('❌ Validation errors:', validationResult.value.errors)
    console.log('❌ Validation warnings:', validationResult.value.warnings)
    return
  }

  console.log('✅ Task validation passed, proceeding with save')

  const taskData: Partial<Task> = {
    ...form.value,
    project_id: props.projectId,
    // Convert empty strings to null/undefined
    end_planned: form.value.end_planned || undefined,
    wbs_path: form.value.wbs_path || undefined,
    notes: form.value.notes || undefined,
    // Duration is calculated on frontend only, not stored in DB
    // Process dependencies - convert to full dependency objects
    dependencies: form.value.dependencies
      .filter((dep) => dep.taskId)
      .map((dep) => ({
        predecessor_id: Number(dep.taskId),
        type: dep.type,
        lag_days: dep.lagDays || 0,
      })),
    // Clean up resources - remove empty strings
    resources: form.value.resources.filter((r) => r.trim()),
    // Send task lead and team members separately
    task_lead_id: form.value.project_lead || undefined,
    team_members: (() => {
      console.log('👥 Raw team_members from form:', form.value.team_members)
      const filtered = form.value.team_members.filter((a) => a > 0)
      console.log('👥 Filtered team_members:', filtered)
      return filtered
    })(),
  }

  if (props.mode === 'edit' && props.task) {
    taskData.id = props.task.id
  }

  console.log('📤 Emitting save event with task data:', taskData)
  emit('save', taskData)
  console.log('✅ Save event emitted successfully')
}

 function handleDelete() {
   if (props.task) {
     if (confirm(`Are you sure you want to delete "${props.task.name}"? This action cannot be undone.`)) {
       emit('delete', props.task.id)
       closeDialog()
     }
   }
 }

 function handleDuplicate() {
   if (props.task) {
     console.log('📋 Duplicating task:', props.task.name)
     emit('duplicate', props.task)
     closeDialog()
   }
 }

</script>

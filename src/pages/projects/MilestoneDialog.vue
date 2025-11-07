<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
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
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 text-gray-900"
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
              :disabled="mode === 'view' || isProjectManager"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-700 text-gray-900"
            >
              <option value="">Select responsible person</option>
              <option v-for="person in availablePeople" :key="person.id" :value="person.id" class="text-gray-900">
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
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 text-gray-900"
            />
          </div>

          <!-- Status -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2"> Status </label>
            <select
              v-model="form.status"
              :disabled="mode === 'view'"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 text-gray-900"
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
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 text-gray-900"
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
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 text-gray-900"
              placeholder="Milestone description and notes"
            ></textarea>
          </div>

          <!-- Invited People Section -->
          <div v-if="mode === 'edit' || mode === 'create'" class="mb-6 border-t border-gray-200 pt-6">
            <div class="flex items-center justify-between mb-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Invited People</label>
                <p class="text-xs text-gray-500">External people invited to this milestone (informational)</p>
              </div>
              <button
                v-if="mode === 'create' || mode === 'edit'"
                @click="openInvitedPersonDialog"
                type="button"
                class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                + Add Invited Person
              </button>
            </div>
            <div v-if="invitedPeople.length === 0" class="text-center py-6 text-gray-500 bg-gray-50 rounded-md">
              <svg
                class="mx-auto h-8 w-8 text-gray-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                ></path>
              </svg>
              <p class="text-sm">No invited people yet.</p>
              <p class="text-xs mt-1">Click "Add Invited Person" to add external invitees.</p>
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="invited in invitedPeople"
                :key="invited.id"
                class="flex items-center justify-between p-3 bg-blue-50 rounded-md border border-blue-200"
              >
                <div class="flex items-center space-x-3 flex-1 min-w-0">
                  <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span v-if="getInvitedAvatar(invited)" class="w-8 h-8 rounded-full overflow-hidden">
                      <img :src="getInvitedAvatar(invited)" :alt="getInvitedName(invited)" class="w-full h-full object-cover" />
                    </span>
                    <span v-else class="text-xs font-medium text-blue-600">
                      {{ getInvitedPersonInitials(getInvitedName(invited)) }}
                    </span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">{{ getInvitedName(invited) }}</p>
                    <p v-if="getInvitedEmail(invited)" class="text-xs text-gray-500 truncate">{{ getInvitedEmail(invited) }}</p>
                    <p v-if="getInvitedCompany(invited)" class="text-xs text-gray-400 truncate">{{ getInvitedCompany(invited) }}</p>
                  </div>
                </div>
                <button
                  v-if="mode === 'create' || mode === 'edit'"
                  @click="removeInvitedPerson(invited.id)"
                  class="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors flex-shrink-0"
                  title="Remove invited person"
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
            </div>
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

    <!-- Invited Person Dialog -->
    <div
      v-if="showInvitedPersonDialog"
      class="fixed inset-0 z-50 overflow-y-auto"
      @click.self="showInvitedPersonDialog = false"
    >
      <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" @click="showInvitedPersonDialog = false"></div>
        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Add Invited Person</h3>
            <form @submit.prevent="handleAddInvitedPerson" class="space-y-4">
              <div>
                <label for="invited-name" class="block text-sm font-medium text-gray-700">Name *</label>
                <input
                  id="invited-name"
                  v-model="invitedPersonForm.name"
                  type="text"
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label for="invited-email" class="block text-sm font-medium text-gray-700">Email</label>
                <input
                  id="invited-email"
                  v-model="invitedPersonForm.email"
                  type="email"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label for="invited-company" class="block text-sm font-medium text-gray-700">Company</label>
                <input
                  id="invited-company"
                  v-model="invitedPersonForm.company"
                  type="text"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
                  placeholder="Company Name"
                />
              </div>
              <div>
                <label for="invited-phone" class="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  id="invited-phone"
                  v-model="invitedPersonForm.phone"
                  type="tel"
                  @input="handlePhoneInput"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
                  placeholder="+1 (555) 123-4567"
                  maxlength="17"
                />
                <p class="mt-1 text-xs text-gray-500">Format: +1 (XXX) XXX-XXXX or +1XXXXXXXXXX</p>
              </div>
              <div>
                <label for="invited-notes" class="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  id="invited-notes"
                  v-model="invitedPersonForm.notes"
                  rows="3"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
                  placeholder="Additional information..."
                ></textarea>
              </div>
              <div class="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  @click="showInvitedPersonDialog = false"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add Person
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { Task, TaskStatus, MilestoneType, TaskCreateUpdate } from '@/core/types/task'
import {
  validateTask,
  suggestProjectBoundsExtension,
  type ValidationResult,
} from '@/core/utils/task-validation'
import { projectApi, type Project, type ProjectTeamMember } from '@/core/utils/project-api'
import type { WorkerUser } from '@/core/utils/hr-api'
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
//   return projectInfo.value.prj_manager === authStore.currentUser.id
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

// Check if user is project manager
const isProjectManager = computed(() => {
  return authStore.currentUser?.role_code === 'project_manager'
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
      // For PM, automatically set project_lead to current user
      const defaultProjectLead = isProjectManager.value && authStore.currentUser?.id
        ? authStore.currentUser.id
        : null

      form.value = {
        name: '',
        start_planned: startDate,
        milestone: true,
        milestone_type: 'other' as MilestoneType,
        status: 'planned' as TaskStatus,
        notes: '',
        project_lead: defaultProjectLead as number | null,
      }

      // Clear invited people for new milestone
      invitedPeople.value = []

      // Force update after next tick to ensure DOM is updated
      await nextTick()

      // Ensure project_lead is set after availablePeople is loaded
      if (defaultProjectLead && form.value.project_lead !== defaultProjectLead) {
        console.log('🔄 Setting project_lead after nextTick:', defaultProjectLead)
        form.value.project_lead = defaultProjectLead
      }

      console.log('✅ Form initialized for create mode:', {
        initialDate: props.initialDate,
        startPlanned: form.value.start_planned,
        projectLead: form.value.project_lead,
        defaultProjectLead,
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
      // For PM in edit mode, if no project_lead is set, use current user
      let projectLead = props.task.task_lead_id || null
      if (isProjectManager.value && !projectLead && authStore.currentUser?.id) {
        projectLead = authStore.currentUser.id
      }

      form.value = {
        name: props.task.name || '',
        start_planned: props.task.start_planned || '',
        milestone: true,
        milestone_type: props.task.milestone_type || 'other',
        status: props.task.status || 'planned',
        notes: props.task.notes || '',
        project_lead: projectLead,
      }
      console.log('📅 Form initialized for edit/view mode:', form.value)

      // Don't load invited people here - it will be loaded in the other watch
      // to avoid duplicate calls and ensure proper order
      invitedPeople.value = []
    } else if (isOpen && props.mode === 'create') {
      invitedPeople.value = []
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

// Available data for dropdowns - loaded from API
const availablePeople = ref<Array<{ id: number; name: string; role: string }>>([])

// Load available people - for new milestones load all system users, for existing milestones load project team
async function loadAvailablePeople() {
  // For new milestones (create mode), load all system users
  if (props.mode === 'create') {
    await loadAllSystemUsers()
    return
  }

  // For existing milestones (edit/view mode), try to use cached task team members first
  // This avoids an extra API call if we're already loading task team for invited people
  if (props.mode === 'edit' && props.task?.id && props.projectId && taskTeamMembersCache.value) {
    try {
      console.log('👥 Using cached task team members for available people:', props.task.id)
      const members = taskTeamMembersCache.value

      // Map task team members to available people format
      const { getDisplayRole } = await import('@/core/utils/role-utils')
      const mappedPeople = members
        .filter((m: ProjectTeamMember) => m.role_in_project !== 'invited' && m.role_in_project !== 'Invited') // Exclude invited people
        .map((member: ProjectTeamMember & { full_name?: string; first_name?: string; last_name?: string; role_name?: string; role_code?: string; project_role?: string; role?: string; team_member_id?: number }) => ({
          id: member.id || member.user_id || member.team_member_id,
          name: member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.name || 'Unknown',
          role: getDisplayRole({
            role_name: member.role_name,
            role_code: member.role_code,
            project_role: member.project_role,
            role: member.role,
          }),
        }))

      // Filter to show only project managers and other relevant roles (exclude admin)
      availablePeople.value = mappedPeople
        .filter((person: { id?: number; name: string; role: string }): person is { id: number; name: string; role: string } => {
          if (!person.id) return false
          const roleLower = person.role.toLowerCase()
          return (
            roleLower.includes('project manager') ||
            roleLower.includes('project_manager') ||
            roleLower !== 'admin'
          )
        })

      console.log('✅ Available people loaded from cached task team:', availablePeople.value.length)

      // If we got some people, return early (no need for project team call)
      if (availablePeople.value.length > 0) {
        return
      }
    } catch (error) {
      console.warn('⚠️ Error using cached task team members, falling back to project team:', error)
      // Fall through to load project team
    }
  }

  // For existing milestones (edit/view mode), try to load task team members first
  // This avoids an extra API call if we're already loading task team for invited people
  if (props.mode === 'edit' && props.task?.id && props.projectId && !taskTeamMembersCache.value) {
    try {
      console.log('👥 Loading task team members for milestone (will cache for reuse):', props.task.id)
      const response = await projectApi.getTaskTeamMembers(props.projectId, Number(props.task.id))
      const members = response.data?.team_members || response.team_members || []

      // Cache the members for reuse
      taskTeamMembersCache.value = members

      // Map task team members to available people format
      const { getDisplayRole } = await import('@/core/utils/role-utils')
      const mappedPeople = members
        .filter((m: ProjectTeamMember) => m.role_in_project !== 'invited' && m.role_in_project !== 'Invited') // Exclude invited people
        .map((member: ProjectTeamMember & { full_name?: string; first_name?: string; last_name?: string; role_name?: string; role_code?: string; project_role?: string; role?: string; team_member_id?: number }) => ({
          id: member.id || member.user_id || member.team_member_id,
          name: member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.name || 'Unknown',
          role: getDisplayRole({
            role_name: member.role_name,
            role_code: member.role_code,
            project_role: member.project_role,
            role: member.role,
          }),
        }))

      // Filter to show only project managers and other relevant roles (exclude admin)
      availablePeople.value = mappedPeople
        .filter((person: { id?: number; name: string; role: string }): person is { id: number; name: string; role: string } => {
          if (!person.id) return false
          const roleLower = person.role.toLowerCase()
          return (
            roleLower.includes('project manager') ||
            roleLower.includes('project_manager') ||
            roleLower !== 'admin'
          )
        })

      console.log('✅ Available people loaded from task team:', availablePeople.value.length)

      // If we got some people, return early (no need for project team call)
      if (availablePeople.value.length > 0) {
        return
      }
    } catch (error) {
      console.warn('⚠️ Error loading task team members, falling back to project team:', error)
      // Fall through to load project team
    }
  }

  // For existing milestones, try to load project team members
  if (!props.projectId) {
    console.warn('⚠️ No project ID provided, cannot load team members')
    availablePeople.value = []
    return
  }

  try {
    console.log('👥 Loading project team members for project:', props.projectId)
    const response = await projectApi.getTeamMembers(props.projectId)
    console.log('🔍 Full API response:', response)

    // Map the API response structure to our expected format
    // Map using unified role formatter
    const { getDisplayRole } = await import('@/core/utils/role-utils')
    const apiTeamMembers = response.data?.team_members || response.team_members || []
    const mappedPeople = apiTeamMembers.map((member: ProjectTeamMember & { full_name?: string; first_name?: string; last_name?: string; role_name?: string; role_code?: string; project_role?: string; role?: string; team_member_id?: number }) => ({
      id: member.id || member.user_id || member.team_member_id,
      name: member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.name || 'Unknown',
      role: getDisplayRole({
        role_name: member.role_name,
        role_code: member.role_code,
        project_role: member.project_role,
        role: member.role,
      }),
    }))

    // Filter to show only project managers and other relevant roles (exclude admin)
    availablePeople.value = mappedPeople
      .filter((person: { id?: number; name: string; role: string }): person is { id: number; name: string; role: string } => {
        if (!person.id) return false
        const roleLower = person.role.toLowerCase()
        return (
          roleLower.includes('project manager') ||
          roleLower.includes('project_manager') ||
          roleLower !== 'admin'
        )
      })

    console.log('✅ Available people loaded:', availablePeople.value.length)
    console.log('👥 People data:', availablePeople.value)

    // If project team is empty, fallback to all system users
    if (availablePeople.value.length === 0) {
      console.log('⚠️ Project team is empty, loading all system users as fallback')
      await loadAllSystemUsers()
    }
  } catch (error) {
    console.error('❌ Error loading project team members:', error)
    // Fallback to all system users
    await loadAllSystemUsers()
  }
}

// Load all system users (excluding admin) - for new milestones
async function loadAllSystemUsers() {
  try {
    console.log('👥 Loading all system users (excluding admin)')
    // Use hrResourcesApi to get all workers
    const { hrResourcesApi } = await import('@/core/utils/hr-api')
    const response = await hrResourcesApi.getAllWorkerUsers(1, 1000, {
      status: '1', // active only
      invitation_status: 'registered',
    })

    if ('workers' in response && Array.isArray(response.workers)) {
      // Filter out admin only (project managers can be assigned to milestones)
      const filteredWorkers = response.workers.filter((worker: { role_code?: string }) => {
        return worker.role_code !== 'admin'
      })

      // Map to our format using unified role formatter
      const { getDisplayRole: getDisplayRoleForMilestone } = await import('@/core/utils/role-utils')
      availablePeople.value = filteredWorkers.map((worker: WorkerUser) => ({
        id: worker.id,
        name: `${worker.first_name || ''} ${worker.last_name || ''}`.trim() || worker.name || 'Unknown',
        role: getDisplayRoleForMilestone({
          role_name: worker.role_name,
          role_code: worker.role_code,
          role: worker.role?.name || undefined,
        }),
      }))

      // If current user is PM and not in the list, add them
      if (isProjectManager.value && authStore.currentUser?.id) {
        const pmExists = availablePeople.value.some(p => p.id === authStore.currentUser!.id)
        if (!pmExists) {
          availablePeople.value.unshift({
            id: authStore.currentUser.id,
            name: authStore.currentUser.name || `${authStore.currentUser.first_name || ''} ${authStore.currentUser.last_name || ''}`.trim() || 'Current User',
            role: authStore.currentUser.role_name || 'Project Manager',
          })
          console.log('✅ Added current PM to available people list')
        }
      }

      console.log('✅ All system users loaded:', availablePeople.value.length)
    }
  } catch (error) {
    console.error('❌ Error loading all system users:', error)
    availablePeople.value = []

    // Fallback: if PM, add current user to list
    if (isProjectManager.value && authStore.currentUser?.id) {
      availablePeople.value = [{
        id: authStore.currentUser.id,
        name: authStore.currentUser.name || `${authStore.currentUser.first_name || ''} ${authStore.currentUser.last_name || ''}`.trim() || 'Current User',
        role: authStore.currentUser.role_name || 'Project Manager',
      }]
    }
  }
}

// Invited people
const invitedPeople = ref<ProjectTeamMember[]>([])
const showInvitedPersonDialog = ref(false)
// Cache for task team members to avoid duplicate API calls
const taskTeamMembersCache = ref<ProjectTeamMember[] | null>(null)
const invitedPersonForm = ref({
  name: '',
  email: '',
  company: '',
  phone: '',
  notes: '',
  avatar: '',
})

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
  async () => {
    console.log('🔄 Watch triggered:', {
      isOpen: props.isOpen,
      mode: props.mode,
      taskId: props.task?.id,
      projectId: props.projectId,
    })

    if (props.isOpen) {
      loadProjectInfo()
      // For edit mode with task, load task team first (will be reused for available people)
      if ((props.mode === 'edit' || props.mode === 'view') && props.task?.id && props.projectId) {
        console.log('📋 Loading data for edit/view mode')
        // Load task team members first (this will cache the data)
        await loadInvitedPeople() // This loads task team members and caches them
        console.log('✅ After loadInvitedPeople, invitedPeople.value.length:', invitedPeople.value.length)
        await loadAvailablePeople() // This will reuse the cached data
        console.log('✅ After loadAvailablePeople, invitedPeople.value.length:', invitedPeople.value.length)
      } else {
        await loadAvailablePeople()
      }
    } else {
      // Clear cache when dialog closes
      taskTeamMembersCache.value = null
      invitedPeople.value = []
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
  // Clear cache when dialog closes
  taskTeamMembersCache.value = null
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

  // Prepare invited people data for API
  // For milestones, always send array (empty [] if no invited people, never null)
  const invitedPeopleData = invitedPeople.value
    .filter(invited => {
      // For create mode, include all (they have temporary IDs)
      // For edit mode, include only those with role_in_project = 'invited'
      if (props.mode === 'create') {
        return true
      }
      return invited.role_in_project === 'invited' || invited.role_in_project === 'Invited'
    })
    .map(invited => ({
      name: getInvitedName(invited),
      email: getInvitedEmail(invited),
      company: getInvitedCompany(invited),
      phone: invited.invited_people?.phone,
      notes: invited.invited_people?.notes,
      avatar: getInvitedAvatar(invited),
    }))

  // Always ensure invited_people is an array (never null for milestones)
  // If no invited people, send empty array []
  // Explicitly set as array to ensure it's never undefined or null
  const finalInvitedPeople = Array.isArray(invitedPeopleData) ? invitedPeopleData : []

  const taskData: TaskCreateUpdate & { id?: string } = {
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
    // Explicitly set milestone fields
    milestone: form.value.milestone_type || 'other',
    milestone_type: form.value.milestone_type || 'other',
    // Send task lead
    task_lead_id: form.value.project_lead || undefined,
    // Send invited people - ALWAYS an array for milestones (empty [] if none, never null)
    invited_people: finalInvitedPeople,
  }

  console.log('👥 Invited people data being sent:', {
    invitedPeopleCount: invitedPeople.value.length,
    invitedPeopleDataCount: invitedPeopleData.length,
    finalInvitedPeopleCount: finalInvitedPeople.length,
    finalInvitedPeople,
  })

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

// Phone formatting function for invited person
function formatPhoneNumber(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '')

  // If empty, return empty
  if (!digits) return ''

  // If starts with 1, format as +1 (XXX) XXX-XXXX
  if (digits.startsWith('1') && digits.length <= 11) {
    const areaCode = digits.slice(1, 4)
    const firstPart = digits.slice(4, 7)
    const secondPart = digits.slice(7, 11)

    if (digits.length <= 1) return '+1'
    if (digits.length <= 4) return `+1 (${areaCode}`
    if (digits.length <= 7) return `+1 (${areaCode}) ${firstPart}`
    return `+1 (${areaCode}) ${firstPart}-${secondPart}`
  }

  // If doesn't start with 1, add +1 prefix
  if (digits.length <= 10) {
    const areaCode = digits.slice(0, 3)
    const firstPart = digits.slice(3, 6)
    const secondPart = digits.slice(6, 10)

    if (digits.length <= 0) return ''
    if (digits.length <= 3) return `+1 (${areaCode}`
    if (digits.length <= 6) return `+1 (${areaCode}) ${firstPart}`
    return `+1 (${areaCode}) ${firstPart}-${secondPart}`
  }

  // If too long, truncate to 10 digits after +1
  const truncated = digits.slice(0, 11)
  const areaCode = truncated.slice(1, 4)
  const firstPart = truncated.slice(4, 7)
  const secondPart = truncated.slice(7, 11)
  return `+1 (${areaCode}) ${firstPart}-${secondPart}`
}

function handlePhoneInput(event: Event) {
  const target = event.target as HTMLInputElement
  const formatted = formatPhoneNumber(target.value)
  invitedPersonForm.value.phone = formatted
}

// Invited people methods
function openInvitedPersonDialog() {
  invitedPersonForm.value = {
    name: '',
    email: '',
    company: '',
    phone: '',
    notes: '',
    avatar: '',
  }
  showInvitedPersonDialog.value = true
}

function handleAddInvitedPerson() {
  // Add to local list (will be sent together on save)
  const newInvited: ProjectTeamMember = {
    id: Date.now(), // Temporary ID for local tracking
    project_id: props.projectId,
    task_id: props.task?.id ? Number(props.task.id) : null,
    user_id: null,
    role_in_project: 'invited',
    assigned_at: new Date().toISOString(),
    invited_people: {
      name: invitedPersonForm.value.name,
      email: invitedPersonForm.value.email || undefined,
      company: invitedPersonForm.value.company || undefined,
      phone: invitedPersonForm.value.phone || undefined,
      notes: invitedPersonForm.value.notes || undefined,
      avatar: invitedPersonForm.value.avatar || undefined,
    },
  }
  invitedPeople.value.push(newInvited)
  showInvitedPersonDialog.value = false
}

function removeInvitedPerson(teamMemberId: number) {
  // Remove from local list (will be sent together on save)
  const index = invitedPeople.value.findIndex(invited => invited.id === teamMemberId)
  if (index !== -1) {
    invitedPeople.value.splice(index, 1)
  }
}

async function loadInvitedPeople() {
  if (!props.task?.id || !props.projectId) {
    console.log('⚠️ Cannot load invited people - missing task.id or projectId', {
      taskId: props.task?.id,
      projectId: props.projectId,
    })
    invitedPeople.value = []
    return
  }

  try {
    // Use cache if available (set by previous call)
    if (taskTeamMembersCache.value) {
      console.log('📦 Using cached task team members:', taskTeamMembersCache.value.length)
      const members = taskTeamMembersCache.value

      // Debug: log all members and their roles
      console.log('🔍 All cached members:', members.map((m: ProjectTeamMember) => ({
        id: m.id,
        name: m.name,
        role_in_project: m.role_in_project,
        has_invited_people: !!m.invited_people,
      })))

      const filtered = members.filter((m: ProjectTeamMember) => {
        const role = m.role_in_project?.toLowerCase() || ''
        return role === 'invited'
      })

      // Force reactivity update
      invitedPeople.value = [...filtered]

      console.log('✅ Loaded invited people from cache:', invitedPeople.value.length)
      console.log('👥 Invited people data:', invitedPeople.value)

      // Force DOM update
      await nextTick()
      console.log('🔄 After nextTick (cache), invitedPeople.value.length:', invitedPeople.value.length)
      return
    }

    console.log('📞 Loading task team members from API...', {
      projectId: props.projectId,
      taskId: props.task.id,
    })
    const response = await projectApi.getTaskTeamMembers(props.projectId, Number(props.task.id))
    console.log('📥 Full API response:', JSON.stringify(response, null, 2))
    console.log('📥 Response structure:', {
      hasData: !!response.data,
      hasTeamMembers: !!response.data?.team_members,
      hasTeamMembersDirect: !!response.team_members,
      dataKeys: response.data ? Object.keys(response.data) : [],
      responseKeys: Object.keys(response),
    })

    // Try multiple possible paths for team members
    const members = response.data?.team_members || response.data?.data?.team_members || response.team_members || response.data || []
    console.log('👥 All team members from API:', members.length)
    console.log('👥 Members type:', Array.isArray(members) ? 'array' : typeof members)

    // Debug: log all members and their roles
    if (Array.isArray(members)) {
      console.log('🔍 All team members with roles:', members.map((m: ProjectTeamMember) => ({
        id: m.id,
        name: m.name,
        role_in_project: m.role_in_project,
        user_id: m.user_id,
        has_invited_people: !!m.invited_people,
        invited_people: m.invited_people,
        fullObject: m,
      })))
    } else {
      console.log('⚠️ Members is not an array:', members)
    }

    // Check if invited people are in a separate field
    const invitedFromSeparateField = response.data?.invited_people || response.data?.invited_members || response.invited_people || response.invited_members || []
    console.log('👥 Invited people from separate field:', Array.isArray(invitedFromSeparateField) ? invitedFromSeparateField.length : 'not an array')
    console.log('👥 Invited people data:', invitedFromSeparateField)

    // Cache the members for reuse
    taskTeamMembersCache.value = Array.isArray(members) ? members : []

    // Filter only invited people - check multiple possible role values
    let filtered: ProjectTeamMember[] = []

    if (Array.isArray(members)) {
      // First, check for members with role_in_project = 'invited'
      filtered = members.filter((m: ProjectTeamMember) => {
        const role = m.role_in_project?.toLowerCase() || ''
        const isInvited = role === 'invited'
        console.log(`🔍 Member ${m.id} (${m.name}): role_in_project="${m.role_in_project}", role.toLowerCase()="${role}", isInvited=${isInvited}`)
        return isInvited
      })

      // Second, extract invited people from invited_people array inside each member
      console.log('🔍 Checking for invited_people arrays inside members...')
      members.forEach((m: ProjectTeamMember) => {
        // Check if member has invited_people as an array
        if (Array.isArray(m.invited_people) && m.invited_people.length > 0) {
          console.log(`✅ Found ${m.invited_people.length} invited people in member ${m.id} (${m.name})`)
          const mappedInvited: ProjectTeamMember[] = m.invited_people
            .map((invited: ProjectTeamMember['invited_people'], index: number) => {
              if (!invited || typeof invited !== 'object') {
                console.warn('⚠️ Invalid invited person data:', invited)
                return null
              }

              const invitedData: ProjectTeamMember['invited_people'] = {
                name: invited.name || '',
                email: invited.email,
                company: invited.company,
                phone: invited.phone,
                notes: invited.notes,
                avatar: invited.avatar,
              }

              const taskId = props.task?.id ? Number(props.task.id) : null
              return {
                id: (m.id * 1000) + index, // Generate unique ID based on member ID and index
                project_id: props.projectId,
                task_id: taskId,
                user_id: null,
                role_in_project: 'invited',
                assigned_at: m.assigned_at || new Date().toISOString(),
                name: invitedData.name,
                email: invitedData.email,
                invited_people: invitedData,
              } as ProjectTeamMember
            })
            .filter((item): item is ProjectTeamMember => item !== null)

          filtered = [...filtered, ...mappedInvited]
          console.log(`👥 Added ${mappedInvited.length} invited people from member ${m.id}`)
        } else if (m.invited_people && typeof m.invited_people === 'object' && !Array.isArray(m.invited_people)) {
          // Handle case where invited_people is a single object, not an array
          console.log(`✅ Found single invited person object in member ${m.id} (${m.name})`)
          const invited = m.invited_people as ProjectTeamMember['invited_people']
          if (invited) {
            const invitedData: ProjectTeamMember['invited_people'] = {
              name: invited.name || '',
              email: invited.email,
              company: invited.company,
              phone: invited.phone,
              notes: invited.notes,
              avatar: invited.avatar,
            }

            const taskId = props.task?.id ? Number(props.task.id) : null
            filtered.push({
              id: m.id * 1000,
              project_id: props.projectId,
              task_id: taskId,
              user_id: null,
              role_in_project: 'invited',
              assigned_at: m.assigned_at || new Date().toISOString(),
              name: invitedData.name,
              email: invitedData.email,
              invited_people: invitedData,
            } as ProjectTeamMember)
          }
        }
      })
    }

    // If we have invited people in a separate field, add them
    if (Array.isArray(invitedFromSeparateField) && invitedFromSeparateField.length > 0 && props.task?.id) {
      console.log('✅ Found invited people in separate field, adding them')
      const taskId = props.task.id
      // Map invited people to ProjectTeamMember format
      const mappedInvited = invitedFromSeparateField.map((invited: Record<string, unknown>) => {
        const invitedData: ProjectTeamMember['invited_people'] = {
          name: (invited.name as string) || '',
          email: invited.email as string | undefined,
          company: invited.company as string | undefined,
          phone: invited.phone as string | undefined,
          notes: invited.notes as string | undefined,
          avatar: invited.avatar as string | undefined,
        }
        return {
          id: (invited.id as number) || Date.now(),
          project_id: props.projectId,
          task_id: Number(taskId),
          user_id: null,
          role_in_project: 'invited',
          assigned_at: (invited.assigned_at as string) || new Date().toISOString(),
          name: invitedData.name,
          email: invitedData.email,
          invited_people: invitedData,
        }
      })
      filtered = [...filtered, ...mappedInvited]
      console.log('👥 Combined invited people:', filtered.length)
    }

    // Force reactivity update
    invitedPeople.value = [...filtered]

    console.log('✅ Loaded invited people:', invitedPeople.value.length)
    console.log('👥 Filtered invited people:', invitedPeople.value.map((p: ProjectTeamMember) => ({
      id: p.id,
      name: p.name,
      role_in_project: p.role_in_project,
      invited_people: p.invited_people,
    })))

    // Force DOM update
    await nextTick()
    console.log('🔄 After nextTick, invitedPeople.value.length:', invitedPeople.value.length)
  } catch (error) {
    console.error('❌ Error loading invited people:', error)
    invitedPeople.value = []
  }
}

function getInvitedName(invited: ProjectTeamMember): string {
  if (invited.invited_people?.name) {
    return invited.invited_people.name
  }
  return invited.name || 'Unknown'
}

function getInvitedEmail(invited: ProjectTeamMember): string | undefined {
  return invited.invited_people?.email || invited.email
}

function getInvitedCompany(invited: ProjectTeamMember): string | undefined {
  return invited.invited_people?.company
}

function getInvitedAvatar(invited: ProjectTeamMember): string | undefined {
  return invited.invited_people?.avatar
}

function getInvitedPersonInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
</script>

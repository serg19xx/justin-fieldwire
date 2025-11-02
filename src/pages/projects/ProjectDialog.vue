<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4"
    @click="closeDialog"
  >
    <div
      class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      @click.stop
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 class="text-xl font-semibold text-gray-900">Create New Project</h2>
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
          <!-- Project Name -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2"> Project Name <span class="text-red-500">*</span> </label>
            <input
              v-model="form.prj_name"
              type="text"
              :class="[
                'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                validationErrors.prj_name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
              ]"
              placeholder="Enter project name"
            />
            <p v-if="validationErrors.prj_name" class="mt-1 text-sm text-red-600">
              {{ validationErrors.prj_name }}
            </p>
          </div>

          <!-- Address -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2"> Address <span class="text-red-500">*</span> </label>
            <textarea
              v-model="form.address"
              rows="3"
              :class="[
                'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                validationErrors.address ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
              ]"
              placeholder="Enter project address"
            ></textarea>
            <p v-if="validationErrors.address" class="mt-1 text-sm text-red-600">
              {{ validationErrors.address }}
            </p>
          </div>

          <!-- Date Range -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"> Start Date <span class="text-red-500">*</span> </label>
              <input
                v-model="form.date_start"
                type="date"
                :class="[
                  'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                  validationErrors.date_start ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                ]"
              />
              <p v-if="validationErrors.date_start" class="mt-1 text-sm text-red-600">
                {{ validationErrors.date_start }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"> End Date <span class="text-red-500">*</span> </label>
              <input
                v-model="form.date_end"
                type="date"
                :class="[
                  'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                  validationErrors.date_end ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                ]"
              />
              <p v-if="validationErrors.date_end" class="mt-1 text-sm text-red-600">
                {{ validationErrors.date_end }}
              </p>
            </div>
          </div>

          <!-- Priority and Status -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"> Priority </label>
              <select
                v-model="form.priority"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"> Status </label>
              <select
                v-model="form.status"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <!-- Project Manager -->
          <div v-if="canAssignManager" class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Project Manager <span class="text-red-500">*</span>
            </label>
            <select
              v-model="form.prj_manager"
              :class="[
                'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                validationErrors.prj_manager ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
              ]"
            >
              <option value="">Select Project Manager</option>
              <option v-for="manager in availableManagers" :key="manager.id" :value="manager.id">
                {{ manager.name }} ({{ manager.email }})
              </option>
            </select>
            <p v-if="validationErrors.prj_manager" class="mt-1 text-sm text-red-600">
              {{ validationErrors.prj_manager }}
            </p>
          </div>

          <!-- Auto-assigned manager info for Project Managers -->
          <div v-else class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2"> Project Manager </label>
            <div
              class="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600"
            >
              {{ authStore.currentUser?.name }} ({{ authStore.currentUser?.email }}) - Auto-assigned
            </div>
            <!-- Manager ID is already set in form.prj_manager during initialization -->
          </div>

          <!-- Description -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2"> Description </label>
            <textarea
              v-model="form.description"
              rows="4"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter project description (optional)"
            ></textarea>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end space-x-3">
            <button
              type="button"
              @click="closeDialog"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSubmitting || !isFormValid"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isSubmitting ? 'Creating...' : 'Create Project' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { projectApi, type Project } from '@/core/utils/project-api'
import { hrResourcesApi, type WorkerUser } from '@/core/utils/hr-api'
import { useAuthStore } from '@/core/stores/auth'

// Props
interface Props {
  isOpen: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
})

// Emits
const emit = defineEmits<{
  close: []
  created: [project: Project]
}>()

// Auth store
const authStore = useAuthStore()

// Form data
const form = ref({
  prj_name: '',
  address: '',
  date_start: '',
  date_end: '',
  priority: 'Medium',
  status: 'Active',
  prj_manager: '',
  description: '',
})

// State
const isSubmitting = ref(false)
const availableManagers = ref<Array<{ id: number; name: string; email: string }>>([])
const validationErrors = ref<Record<string, string>>({})

// Access control
const canAssignManager = computed(() => {
  if (!authStore.currentUser) {
    console.log('🔍 canAssignManager: no current user')
    return false
  }

  // Check if user is admin based on job_title
  const isAdmin = authStore.currentUser.job_title === 'System Administrator'
  // Admin check complete

  // Only administrators can assign managers
  return isAdmin
})

const isProjectManager = computed(() => {
  if (!authStore.currentUser) {
    console.log('🔍 isProjectManager: no current user')
    return false
  }

  // Check if user is project manager based on job_title (including variations)
  const jobTitle = authStore.currentUser.job_title?.toLowerCase() || ''
  const isPM = jobTitle.includes('project manager')
  console.log('🔍 isProjectManager check:', {
    job_title: authStore.currentUser.job_title,
    jobTitle_lower: jobTitle,
    isPM: isPM,
    currentUser: authStore.currentUser,
  })

  return isPM
})

// Form validation
function validateForm() {
  const errors: Record<string, string> = {}

  // Basic required fields
  if (!form.value.prj_name?.trim()) {
    errors.prj_name = 'Project name is required'
  }

  if (!form.value.address?.trim()) {
    errors.address = 'Address is required'
  }

  if (!form.value.date_start) {
    errors.date_start = 'Start date is required'
  }

  if (!form.value.date_end) {
    errors.date_end = 'End date is required'
  }

  // Admin must select a project manager
  if (canAssignManager.value && !form.value.prj_manager) {
    errors.prj_manager = 'Project Manager is required for administrators'
  }

  // Date validation
  if (form.value.date_start && form.value.date_end) {
    const startDate = new Date(form.value.date_start)
    const endDate = new Date(form.value.date_end)
    if (startDate >= endDate) {
      errors.date_end = 'End date must be after start date'
    }
  }

  validationErrors.value = errors
  return Object.keys(errors).length === 0
}

const isFormValid = computed(() => {
  return validateForm()
})

// Initialize form when dialog opens
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      // Reset form
      const today = new Date().toISOString().split('T')[0]
      const nextMonth = new Date()
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      const nextMonthStr = nextMonth.toISOString().split('T')[0]

      // Form initialization complete

      // Debug current user info
      console.log('🔍 Form initialization - current user:', {
        id: authStore.currentUser?.id,
        job_title: authStore.currentUser?.job_title,
        isProjectManager: isProjectManager.value,
        canAssignManager: canAssignManager.value,
      })

      // Determine if user should be auto-assigned as manager
      const shouldAutoAssign =
        isProjectManager.value || (authStore.currentUser?.id && !canAssignManager.value) // If not admin, auto-assign current user

      console.log('🔍 Auto-assignment logic:', {
        isProjectManager: isProjectManager.value,
        canAssignManager: canAssignManager.value,
        shouldAutoAssign: shouldAutoAssign,
        currentUserId: authStore.currentUser?.id,
      })

      form.value = {
        prj_name: '',
        address: '',
        date_start: today,
        date_end: nextMonthStr,
        priority: 'Medium',
        status: 'Active',
        prj_manager: shouldAutoAssign ? String(authStore.currentUser?.id || '') : '', // Auto-assign for project managers or non-admins
        description: '',
      }

      console.log('🔍 Form initialized with prj_manager:', form.value.prj_manager)

      // Clear any validation errors
      validationErrors.value = {}

      // Form initialized
    }
  },
)

// Load available managers
async function loadManagers() {
  try {
    console.log('🔍 Loading managers, canAssignManager:', canAssignManager.value)

    if (canAssignManager.value) {
      // Only load managers if user can assign them (administrators)
      try {
        console.log('🔍 Loading project managers from API...')

        // Use hrResourcesApi to get all workers with role_id filter for project managers
        const response = await hrResourcesApi.getAllWorkerUsers(1, 100, {
          role_id: 10, // Project Manager role
        })

        console.log('✅ Managers loaded from API:', response.workers)

        // Build managers list from workers
        availableManagers.value = response.workers.map((worker: WorkerUser) => ({
          id: worker.id,
          name: `${worker.first_name} ${worker.last_name}`.trim() || worker.email,
          email: worker.email,
        }))

        console.log('📋 Available managers:', availableManagers.value)

        // If no managers found, show fallback
        if (availableManagers.value.length === 0) {
          console.warn('⚠️ No project managers found in API response')
          if (authStore.currentUser) {
            availableManagers.value = [
              {
                id: authStore.currentUser.id,
                name: authStore.currentUser.name,
                email: authStore.currentUser.email,
              },
            ]
          }
        }
      } catch (apiError) {
        console.warn('⚠️ Failed to load managers from API, using fallback:', apiError)
        // Fallback: use current user as the only option
        if (authStore.currentUser) {
          availableManagers.value = [
            {
              id: authStore.currentUser.id,
              name: authStore.currentUser.name,
              email: authStore.currentUser.email,
            },
          ]
        }
      }
    } else {
      // Project managers don't need to load other managers
      console.log('🔍 User is project manager, no need to load other managers')
      availableManagers.value = []
    }
  } catch (error) {
    console.error('❌ Error loading managers:', error)
    availableManagers.value = []
  }
}

// Methods
function closeDialog() {
  emit('close')
}

async function handleSubmit() {
  if (isSubmitting.value) return

  // Validate form
  if (!validateForm()) {
    console.warn('⚠️ Validation failed:', validationErrors.value)
    return
  }

  isSubmitting.value = true
  try {
    console.log('🚀 Creating project with data:', form.value)
    console.log('🔍 Current user info during submit:', {
      id: authStore.currentUser?.id,
      job_title: authStore.currentUser?.job_title,
      isProjectManager: isProjectManager.value,
    })

    // Prepare API data
    const apiData = {
      prj_name: form.value.prj_name,
      address: form.value.address,
      date_start: form.value.date_start,
      date_end: form.value.date_end,
      priority: form.value.priority,
      status: form.value.status,
      prj_manager: form.value.prj_manager ? Number(form.value.prj_manager) : null,
      created_by: authStore.currentUser?.id || null, // ID текущего активного пользователя
      description: form.value.description || null,
    }

    console.log('📤 API payload:', apiData)
    console.log('🔍 prj_manager value:', {
      original: form.value.prj_manager,
      converted: apiData.prj_manager,
      type: typeof apiData.prj_manager,
    })
    console.log('🔍 created_by value:', {
      currentUserId: authStore.currentUser?.id,
      created_by: apiData.created_by,
      type: typeof apiData.created_by,
    })

    // Create project via API
    const response = await projectApi.create(apiData)
    console.log('✅ Project created successfully:', response)
    console.log('🔍 Created project details:', {
      id: response.data.project.id,
      name: response.data.project.prj_name,
      created_by: response.data.project.created_by,
      created_by_name: response.data.project.created_by_name,
    })

    // Emit success event
    emit('created', response.data.project)
    closeDialog()
  } catch (error) {
    console.error('❌ Error creating project:', error)
    alert('Failed to create project. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadManagers()
})

defineOptions({
  name: 'ProjectDialog',
})
</script>

<template>
  <div class="settings-section flex-1 flex flex-col">
    <!-- Settings Form -->
    <div class="bg-white rounded-lg shadow p-6">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Project Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2"> Project Name * </label>
          <input
            v-model="settingsForm.name"
            type="text"
            :disabled="!canEdit"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="Enter project name"
            required
          />
        </div>

        <!-- Project Address -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2"> Project Address * </label>
          <textarea
            v-model="settingsForm.address"
            :disabled="!canEdit"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="Enter project address"
            required
          ></textarea>
        </div>

        <!-- Priority and Status -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Priority -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Priority </label>
            <select
              v-model="settingsForm.priority"
              :disabled="!canEdit"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <!-- Status -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Status </label>
            <select
              v-model="settingsForm.status"
              :disabled="!canEdit"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <!-- Dates -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Start Date -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Start Date </label>
            <input
              v-model="settingsForm.startDate"
              type="date"
              :disabled="!canEdit"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <!-- End Date -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> End Date </label>
            <input
              v-model="settingsForm.endDate"
              type="date"
              :disabled="!canEdit"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
        </div>

        <!-- Action Buttons -->
        <div
          v-if="canEdit"
          class="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200"
        >
          <button
            type="submit"
            :disabled="isSaving"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {{ isSaving ? 'Saving...' : 'Save' }}
          </button>
        </div>

        <!-- Read-only notice for non-managers -->
        <div v-else class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div class="flex">
            <svg
              class="h-5 w-5 text-yellow-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              ></path>
            </svg>
            <div class="ml-3">
              <p class="text-sm text-yellow-800">
                You can only view project settings. Only Project Managers can edit project
                information.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'

defineOptions({
  name: 'SettingsSection',
})

// Props
interface ProjectData {
  name: string
  address: string
  startDate: string
  endDate: string
  priority: string
  status: string
}

interface Props {
  canEdit?: boolean
  project?: ProjectData | { value: ProjectData }
}

const props = withDefaults(defineProps<Props>(), {
  canEdit: false,
})

// Emits
const emit = defineEmits<{
  saveSettings: []
  resetSettings: []
}>()

// State
const isSaving = ref(false)

// Settings form
const settingsForm = reactive({
  name: '',
  address: '',
  priority: 'medium',
  status: 'draft',
  startDate: '',
  endDate: '',
})

// Initialize form with project data
function initializeForm() {
  console.log('🔧 initializeForm called, props.project:', props.project)
  if (props.project) {
    // Handle both ref and direct value
    const project =
      (props.project as { value: ProjectData })?.value || (props.project as ProjectData)
    console.log('🔧 Project data:', project)
    console.log('🔧 Project keys:', Object.keys(project))
    console.log('🔧 Project fields:', {
      name: project.name,
      address: project.address,
      startDate: project.startDate,
      endDate: project.endDate,
      priority: project.priority,
      status: project.status,
    })

    // Check each field individually
    console.log('🔍 Field checks:')
    console.log('  name:', project.name, '->', String(project.name || ''))
    console.log('  address:', project.address, '->', String(project.address || ''))
    console.log('  startDate:', project.startDate, '->', String(project.startDate || ''))
    console.log('  endDate:', project.endDate, '->', String(project.endDate || ''))
    console.log('  priority:', project.priority, '->', String(project.priority || 'medium'))
    console.log('  status:', project.status, '->', String(project.status || 'draft'))

    settingsForm.name = String(project.name || '')
    settingsForm.address = String(project.address || '')
    settingsForm.priority = String(project.priority || 'medium')
    settingsForm.status = String(project.status || 'draft')
    settingsForm.startDate = String(project.startDate || '')
    settingsForm.endDate = String(project.endDate || '')

    console.log('📝 Form after initialization:', settingsForm)
  } else {
    console.log('⚠️ No project data available')
  }
}

// Update form when project data changes
watch(
  () => props.project,
  (newProject) => {
    if (newProject) {
      console.log('🔄 Project changed, reinitializing form')
      initializeForm()
    }
  },
  { immediate: true },
)

// Initialize form on mount
onMounted(() => {
  initializeForm()
})

// Methods
const handleSubmit = () => {
  console.log('🔧 SettingsSection handleSubmit called')
  if (isSaving.value) {
    console.log('⚠️ Already saving, preventing double submission')
    return // Prevent double submission
  }
  isSaving.value = true
  console.log('📤 Emitting saveSettings')
  emit('saveSettings')
  // Reset saving state after a short delay
  setTimeout(() => {
    isSaving.value = false
  }, 1000)
}

// Removed duplicate saveSettings method - using handleSubmit instead

// const resetSettings = () => {
//   emit('resetSettings')
// }

// Expose settingsForm to parent component
defineExpose({
  settingsForm,
})
</script>

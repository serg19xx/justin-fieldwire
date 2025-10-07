<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
  >
    <div class="bg-white rounded-lg shadow-xl w-full max-w-md">
      <!-- Header -->
      <div class="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
        <h3 class="text-base sm:text-lg font-semibold text-gray-900">Project Timeline Extension Required</h3>
      </div>

      <!-- Content -->
      <div class="px-4 sm:px-6 py-3 sm:py-4">
        <div class="mb-4">
          <p class="text-sm text-gray-600 mb-3">
            The task dates are outside the current project timeline:
          </p>

          <div class="bg-gray-50 rounded-lg p-3 mb-4">
            <div class="text-sm">
              <div class="flex justify-between mb-1">
                <span class="font-medium">Current Project:</span>
                <span>{{ projectInfo.date_start }} to {{ projectInfo.date_end }}</span>
              </div>
              <div class="flex justify-between">
                <span class="font-medium">Task Dates:</span>
                <span>{{ taskData.startPlanned }} to {{ taskData.endPlanned }}</span>
              </div>
            </div>
          </div>

          <div v-if="boundsExtension.needsExtension" class="bg-blue-50 rounded-lg p-3 mb-4">
            <div class="text-sm">
              <div class="flex justify-between mb-1">
                <span class="font-medium">Suggested Extension:</span>
                <span
                  >{{ boundsExtension.suggestedStart }} to {{ boundsExtension.suggestedEnd }}</span
                >
              </div>
              <div class="text-xs text-gray-600">
                {{ boundsExtension.reason }}
              </div>
            </div>
          </div>
        </div>

        <div class="text-sm text-gray-600 mb-4">
          <p v-if="canManageProject">
            You can extend the project timeline to accommodate this task.
          </p>
          <p v-else>Please contact the project manager to extend the project timeline.</p>
        </div>
      </div>

      <!-- Actions -->
      <div class="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
        <button
          @click="handleCancel"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>

        <button
          v-if="canManageProject"
          @click="handleExtendBounds"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Extend Project Timeline
        </button>

        <button
          v-else
          @click="handleRequestExtension"
          class="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          Request Extension
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { TaskCreateUpdate } from '@/core/types/task'
import type { Project } from '@/core/utils/project-api'
import { projectApi } from '@/core/utils/project-api'

// Props
interface Props {
  isOpen: boolean
  taskData: TaskCreateUpdate
  projectInfo: Project
  boundsExtension: {
    needsExtension: boolean
    suggestedStart: string
    suggestedEnd: string
    reason: string
  }
  canManageProject: boolean
}

const props = defineProps<Props>()

// Debug logging
watch(
  () => props.isOpen,
  (newValue) => {
    console.log('🚪 ProjectBoundsDialog isOpen changed:', newValue)
    console.log('🚪 ProjectBoundsDialog props:', props)
  },
)

// Emits
const emit = defineEmits<{
  close: []
  boundsExtended: [updatedProject: Project]
  extensionRequested: []
}>()

// State
const isExtending = ref(false)

// Methods
async function handleExtendBounds() {
  if (!props.boundsExtension.needsExtension) return

  isExtending.value = true

  try {
    const updateData = {
      date_start: props.boundsExtension.suggestedStart,
      date_end: props.boundsExtension.suggestedEnd,
    }

    console.log('📤 Extending project bounds:', updateData)

    const updatedProject = await projectApi.update(props.projectInfo.id, updateData)

    console.log('✅ Project bounds extended successfully')

    emit('boundsExtended', updatedProject)
    emit('close')
  } catch (error) {
    console.error('❌ Error extending project bounds:', error)
    alert('Failed to extend project bounds. Please try again.')
  } finally {
    isExtending.value = false
  }
}

function handleRequestExtension() {
  console.log('📤 Requesting project extension for task:', props.taskData)

  // TODO: Implement actual request logic (email, notification, etc.)
  alert('Extension request sent to project manager.')

  emit('extensionRequested')
  emit('close')
}

function handleCancel() {
  emit('close')
}
</script>

<template>
  <div>
    <!-- Template Selection Dialog -->
    <div
      v-if="showSelector"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
      @click.self="closeSelector"
    >
      <div
        class="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0"
        >
          <div>
            <h2 class="text-lg sm:text-xl font-semibold text-gray-900">Select Task Templates</h2>
            <p class="text-sm text-gray-500 mt-1">
              Choose templates to create tasks from. You can select multiple templates.
            </p>
          </div>
          <button
            @click="closeSelector"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
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

        <!-- Selector Content -->
        <div class="flex-1 overflow-y-auto p-4 sm:p-6">
          <TaskTemplateSelector
            ref="selectorRef"
            v-model:selected-template-ids="selectedTemplateIds"
            @selection-changed="handleSelectionChanged"
          />
        </div>

        <!-- Footer -->
        <div
          class="flex items-center justify-between p-4 sm:p-6 border-t border-gray-200 flex-shrink-0 bg-gray-50"
        >
          <div class="text-sm text-gray-600">
            <span v-if="selectedTemplates.length === 0" class="text-gray-500">
              Select at least one template to continue
            </span>
            <span v-else class="text-blue-600">
              {{ selectedTemplates.length }} template{{ selectedTemplates.length !== 1 ? 's' : '' }}
              selected
            </span>
          </div>
          <div class="flex gap-3">
            <button
              @click="closeSelector"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              @click="proceedToBatchCreation"
              :disabled="selectedTemplates.length === 0"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Continue ({{ selectedTemplates.length }})
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Batch Creation Dialog -->
    <TaskTemplateBatchDialog
      :is-open="showBatchDialog"
      :project-id="projectId"
      :selected-templates="selectedTemplates"
      :project-start-date="projectStartDate"
      :available-people="availablePeople"
      @close="closeBatchDialog"
      @tasks-created="handleTasksCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import TaskTemplateSelector from './TaskTemplateSelector.vue'
import TaskTemplateBatchDialog from './TaskTemplateBatchDialog.vue'
import type { TaskTemplate } from '@/core/types/task'

interface Props {
  isOpen: boolean
  projectId: number
  projectStartDate?: string
  availablePeople?: Array<{ id: number; name: string; role: string }>
}

interface Emits {
  (e: 'close'): void
  (e: 'tasks-created', tasks: unknown[]): void
}

const props = withDefaults(defineProps<Props>(), {
  projectStartDate: '',
  availablePeople: () => [],
})

const emit = defineEmits<Emits>()

const showSelector = ref(props.isOpen)
const showBatchDialog = ref(false)
const selectedTemplateIds = ref<number[]>([])
const selectedTemplates = ref<TaskTemplate[]>([])
const selectorRef = ref<InstanceType<typeof TaskTemplateSelector> | null>(null)

watch(
  () => props.isOpen,
  (newValue) => {
    showSelector.value = newValue
    if (!newValue) {
      // Reset when closed
      selectedTemplateIds.value = []
      selectedTemplates.value = []
      showBatchDialog.value = false
    }
  },
)

function handleSelectionChanged(templates: TaskTemplate[]) {
  selectedTemplates.value = templates
}

function proceedToBatchCreation() {
  if (selectedTemplates.value.length === 0) return
  showSelector.value = false
  showBatchDialog.value = true
}

function closeSelector() {
  showSelector.value = false
  emit('close')
}

function closeBatchDialog() {
  showBatchDialog.value = false
  emit('close')
}

function handleTasksCreated(tasks: unknown[]) {
  emit('tasks-created', tasks)
  closeBatchDialog()
}
</script>

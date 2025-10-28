<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4"
    @click="closePreview"
  >
    <div
      class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      @click.stop
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 class="text-xl font-semibold text-gray-900">Template Preview: {{ template?.name }}</h2>
        <button @click="closePreview" class="text-gray-400 hover:text-gray-600 transition-colors">
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
        <!-- Template Info -->
        <div class="mb-6">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="font-medium text-gray-700">Type:</span>
              <span
                :class="template?.template_type === 'system' ? 'text-blue-600' : 'text-green-600'"
                class="ml-2 font-medium"
              >
                {{ template?.template_type }}
              </span>
            </div>
            <div>
              <span class="font-medium text-gray-700">Message Type:</span>
              <span class="ml-2 font-medium text-gray-900">
                {{ template?.message_type?.toUpperCase() }}
              </span>
            </div>
            <div>
              <span class="font-medium text-gray-700">Event:</span>
              <span class="ml-2 font-medium text-gray-900">
                {{ getEventTypeName(template?.event_type || '') }}
              </span>
            </div>
            <div>
              <span class="font-medium text-gray-700">Status:</span>
              <span
                :class="template?.is_active ? 'text-green-600' : 'text-red-600'"
                class="ml-2 font-medium"
              >
                {{ template?.is_active ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Preview -->
        <div class="space-y-4">
          <!-- Email Subject (if email template) -->
          <div
            v-if="template?.message_type === 'email'"
            class="border border-gray-200 rounded-lg p-4"
          >
            <h3 class="text-sm font-medium text-gray-700 mb-2">Email Subject</h3>
            <div class="bg-gray-50 rounded p-3 text-sm font-medium">
              {{ previewSubject }}
            </div>
          </div>

          <!-- Message Content -->
          <div class="border border-gray-200 rounded-lg p-4">
            <h3 class="text-sm font-medium text-gray-700 mb-2">Message Content</h3>
            <div class="bg-gray-50 rounded p-3 text-sm">
              <div v-html="previewContent"></div>
            </div>
          </div>

          <!-- Variables Used -->
          <div
            v-if="template?.variables && template.variables.length > 0"
            class="border border-gray-200 rounded-lg p-4"
          >
            <h3 class="text-sm font-medium text-gray-700 mb-2">Variables Used</h3>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="variable in template.variables"
                :key="variable"
                class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
              >
                {{ getVariableDisplay(variable) }}
              </span>
            </div>
          </div>

          <!-- Test Data -->
          <div class="border border-gray-200 rounded-lg p-4">
            <h3 class="text-sm font-medium text-gray-700 mb-2">Test Data Used</h3>
            <div class="bg-gray-50 rounded p-3 text-xs">
              <div class="grid grid-cols-2 gap-2">
                <div v-for="variable in template?.variables" :key="variable">
                  <span class="font-medium">{{ variable }}:</span>
                  <span class="ml-1">{{ getMockValue(variable) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
          <button
            @click="closePreview"
            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MessageTemplate, EventType } from '@/core/utils/admin-api'

// Props
interface Props {
  isOpen: boolean
  template?: MessageTemplate | null
  eventTypes: EventType[]
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  template: null,
  eventTypes: () => [],
})

// Emits
const emit = defineEmits<{
  close: []
}>()

// Computed
const selectedEventType = computed(() => {
  return props.eventTypes.find((et) => et.type === props.template?.event_type)
})

const previewSubject = computed(() => {
  return replaceVariables(props.template?.subject || '')
})

const previewContent = computed(() => {
  return replaceVariables(props.template?.content || '').replace(/\n/g, '<br>')
})

// Methods
function replaceVariables(text: string): string {
  if (!selectedEventType.value) return text

  let result = text
  selectedEventType.value.available_variables.forEach((variable) => {
    const placeholder = `{{${variable}}}`
    const mockValue = getMockValue(variable)
    result = result.replace(new RegExp(placeholder, 'g'), mockValue)
  })

  return result
}

function getMockValue(variable: string): string {
  const mockValues: Record<string, string> = {
    task_name: 'Install Windows',
    project_name: 'Office Renovation',
    assignee_name: 'John Smith',
    due_date: '2024-01-15',
    created_by: 'Jane Doe',
    completed_date: '2024-01-14',
    completed_by: 'John Smith',
    project_manager: 'Mike Johnson',
    start_date: '2024-01-01',
    end_date: '2024-03-31',
    days_remaining: '3',
  }

  return mockValues[variable] || `[${variable}]`
}

function getVariableDisplay(variable: string): string {
  return `{{${variable}}}`
}

function getEventTypeName(eventType: string): string {
  const type = props.eventTypes.find((t) => t.type === eventType)
  return type?.name || eventType
}

function closePreview() {
  emit('close')
}

defineOptions({
  name: 'MessageTemplatePreview',
})
</script>

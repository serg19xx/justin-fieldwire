<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4"
    @click="closeDialog"
  >
    <div
      class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      @click.stop
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 class="text-xl font-semibold text-gray-900">
          {{ editingTemplate ? 'Edit Message Template' : 'Create Message Template' }}
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
          <!-- Basic Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Template Name <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                required
                :class="[
                  'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                  validationErrors.name
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300',
                ]"
                placeholder="Enter template name"
              />
              <p v-if="validationErrors.name" class="mt-1 text-sm text-red-600">
                {{ validationErrors.name }}
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Template Type <span class="text-red-500">*</span>
              </label>
              <select
                v-model="form.template_type"
                required
                :disabled="editingTemplate?.template_type === 'system'"
                :class="[
                  'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                  validationErrors.template_type
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300',
                  editingTemplate?.template_type === 'system'
                    ? 'bg-gray-100 cursor-not-allowed'
                    : '',
                ]"
              >
                <option value="custom">Custom</option>
                <option value="system">System</option>
              </select>
              <p v-if="validationErrors.template_type" class="mt-1 text-sm text-red-600">
                {{ validationErrors.template_type }}
              </p>
              <p
                v-if="editingTemplate?.template_type === 'system'"
                class="mt-1 text-xs text-gray-500"
              >
                System templates cannot be changed to custom
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Message Type <span class="text-red-500">*</span>
              </label>
              <select
                v-model="form.message_type"
                required
                :class="[
                  'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                  validationErrors.message_type
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300',
                ]"
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
              </select>
              <p v-if="validationErrors.message_type" class="mt-1 text-sm text-red-600">
                {{ validationErrors.message_type }}
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Event Type <span class="text-red-500">*</span>
              </label>
              <select
                v-model="form.event_type"
                required
                :class="[
                  'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                  validationErrors.event_type
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300',
                ]"
              >
                <option value="">Select event type</option>
                <option
                  v-for="eventType in eventTypes"
                  :key="eventType.type"
                  :value="eventType.type"
                >
                  {{ eventType.name }}
                </option>
              </select>
              <p v-if="validationErrors.event_type" class="mt-1 text-sm text-red-600">
                {{ validationErrors.event_type }}
              </p>
            </div>
          </div>

          <!-- Email Subject (only for email templates) -->
          <div v-if="form.message_type === 'email'" class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Email Subject <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.subject"
              type="text"
              required
              :class="[
                'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                validationErrors.subject
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300',
              ]"
              placeholder="Enter email subject"
            />
            <p v-if="validationErrors.subject" class="mt-1 text-sm text-red-600">
              {{ validationErrors.subject }}
            </p>
          </div>

          <!-- Available Variables -->
          <div v-if="selectedEventType" class="mb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-3">Available Variables</h3>
            <div class="bg-gray-50 rounded-lg p-4">
              <p class="text-sm text-gray-600 mb-3">
                Use these variables in your template by wrapping them in double curly braces:
              </p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="variable in selectedEventType.available_variables"
                  :key="variable"
                  type="button"
                  @click="insertVariable(variable)"
                  class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                >
                  {{ getVariableDisplay(variable) }}
                </button>
              </div>
            </div>
          </div>

          <!-- Template Content -->
          <div class="mb-6">
            <div class="flex items-center justify-between mb-3">
              <label class="block text-sm font-medium text-gray-700">
                Template Content <span class="text-red-500">*</span>
              </label>
              <div class="flex space-x-2">
                <button
                  type="button"
                  @click="showPreview = !showPreview"
                  class="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-800"
                >
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    ></path>
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    ></path>
                  </svg>
                  {{ showPreview ? 'Hide Preview' : 'Show Preview' }}
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <!-- Editor -->
              <div>
                <textarea
                  v-model="form.content"
                  required
                  rows="12"
                  :class="[
                    'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm',
                    validationErrors.content
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300',
                  ]"
                  placeholder="Enter template content..."
                ></textarea>
                <p v-if="validationErrors.content" class="mt-1 text-sm text-red-600">
                  {{ validationErrors.content }}
                </p>
              </div>

              <!-- Preview -->
              <div v-if="showPreview" class="border border-gray-300 rounded-md p-4 bg-gray-50">
                <h4 class="text-sm font-medium text-gray-700 mb-2">Preview</h4>
                <div class="bg-white border rounded p-3 text-sm">
                  <div v-if="form.message_type === 'email'" class="mb-2">
                    <strong>Subject:</strong> {{ previewSubject }}
                  </div>
                  <div v-html="previewContent"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Status -->
          <div class="mb-6">
            <label class="flex items-center">
              <input
                v-model="form.is_active"
                type="checkbox"
                class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span class="ml-2 text-sm text-gray-700">Active (template is enabled)</span>
            </label>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              @click="closeDialog"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{
                isSubmitting ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'
              }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
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
  save: [template: any]
}>()

// State
const isSubmitting = ref(false)
const showPreview = ref(false)
const validationErrors = ref<Record<string, string>>({})

const form = ref({
  name: '',
  template_type: 'custom' as 'system' | 'custom',
  message_type: 'email' as 'sms' | 'email',
  event_type: '',
  subject: '',
  content: '',
  is_active: true,
})

// Computed
const editingTemplate = computed(() => props.template)

const selectedEventType = computed(() => {
  return props.eventTypes.find((et) => et.type === form.value.event_type)
})

const previewSubject = computed(() => {
  return replaceVariables(form.value.subject || '')
})

const previewContent = computed(() => {
  return replaceVariables(form.value.content || '').replace(/\n/g, '<br>')
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

function insertVariable(variable: string) {
  const textarea = document.querySelector('textarea') as HTMLTextAreaElement
  if (textarea) {
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value
    const before = text.substring(0, start)
    const after = text.substring(end, text.length)
    const variableText = `{{${variable}}}`

    form.value.content = before + variableText + after

    // Set cursor position after the inserted variable
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + variableText.length, start + variableText.length)
    }, 0)
  }
}

function validateForm(): boolean {
  const errors: Record<string, string> = {}

  if (!form.value.name.trim()) {
    errors.name = 'Template name is required'
  }

  if (!form.value.event_type) {
    errors.event_type = 'Event type is required'
  }

  if (form.value.message_type === 'email' && !form.value.subject.trim()) {
    errors.subject = 'Email subject is required'
  }

  if (!form.value.content.trim()) {
    errors.content = 'Template content is required'
  }

  validationErrors.value = errors
  return Object.keys(errors).length === 0
}

async function handleSubmit() {
  if (!validateForm()) {
    return
  }

  isSubmitting.value = true
  try {
    const templateData = {
      ...form.value,
      variables: selectedEventType.value?.available_variables || [],
    }

    emit('save', templateData)
  } finally {
    isSubmitting.value = false
  }
}

function closeDialog() {
  emit('close')
}

// Watch for template changes
watch(
  () => props.template,
  (newTemplate) => {
    if (newTemplate) {
      form.value = {
        name: newTemplate.name,
        template_type: newTemplate.template_type,
        message_type: newTemplate.message_type,
        event_type: newTemplate.event_type,
        subject: newTemplate.subject || '',
        content: newTemplate.content,
        is_active: newTemplate.is_active,
      }
    } else {
      // Reset form for new template
      form.value = {
        name: '',
        template_type: 'custom',
        message_type: 'email',
        event_type: '',
        subject: '',
        content: '',
        is_active: true,
      }
    }
    validationErrors.value = {}
  },
  { immediate: true },
)

defineOptions({
  name: 'MessageTemplateDialog',
})
</script>

<template>
  <teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]"
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
                Message Type <span class="text-red-500">*</span>
              </label>
              <select
                v-model="form.type"
                required
                :class="[
                  'w-full px-3 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500',
                  validationErrors.type
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300',
                ]"
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
              </select>
              <p v-if="validationErrors.type" class="mt-1 text-sm text-red-600">
                {{ validationErrors.type }}
              </p>
            </div>

          </div>

          <!-- Email Subject (only for email templates) -->
          <div v-if="form.type === 'email'" class="mb-6">
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

            <!-- Light HTML Toolbar for Email templates -->
            <div v-if="form.type === 'email'" class="mb-2 flex flex-wrap gap-1 text-xs">
              <button type="button" @click="onCmd('bold')" class="px-2 py-1 border rounded bg-white hover:bg-gray-50">B</button>
              <button type="button" @click="onCmd('italic')" class="px-2 py-1 border rounded bg-white hover:bg-gray-50"><em>I</em></button>
              <span class="mx-1 text-gray-300">|</span>
              <button type="button" @click="onCmd('p')" class="px-2 py-1 border rounded bg-white hover:bg-gray-50">p</button>
              <button type="button" @click="onCmd('br')" class="px-2 py-1 border rounded bg-white hover:bg-gray-50">br</button>
              <button type="button" @click="onCmd('h2')" class="px-2 py-1 border rounded bg-white hover:bg-gray-50">h2</button>
              <button type="button" @click="onCmd('h3')" class="px-2 py-1 border rounded bg-white hover:bg-gray-50">h3</button>
              <span class="mx-1 text-gray-300">|</span>
              <button type="button" @click="onCmd('ul')" class="px-2 py-1 border rounded bg-white hover:bg-gray-50">ul</button>
              <button type="button" @click="onCmd('ol')" class="px-2 py-1 border rounded bg-white hover:bg-gray-50">ol</button>
              <span class="mx-1 text-gray-300">|</span>
              <button type="button" @click="onCmd('span')" class="px-2 py-1 border rounded bg-white hover:bg-gray-50">span</button>
              <button type="button" @click="onCmd('div')" class="px-2 py-1 border rounded bg-white hover:bg-gray-50">div</button>
              <span class="mx-1 text-gray-300">|</span>
              <button type="button" @click="onCmd('link')" class="px-2 py-1 border rounded bg-white hover:bg-gray-50">link</button>
            </div>

            <div class="mb-3 text-xs text-gray-600">
              Use variables by wrapping them in double curly braces, for example:
              <code v-pre class="px-1 py-0.5 rounded bg-gray-100 text-gray-800">{{PROJECT_NAME}}</code>.
              Common variables:
              <div class="mt-2 flex flex-wrap gap-2">
                <button
                  v-for="v in commonVariables"
                  :key="v"
                  type="button"
                  @click="insertVariable(v)"
                  class="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200"
                >
                  {{ formatVar(v) }}
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <!-- Editor -->
              <div>
                <textarea
                  ref="editorRef"
                  v-model="form.body"
                  required
                  rows="12"
                  :class="[
                    'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm',
                    validationErrors.body
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300',
                  ]"
                  placeholder="Enter template content..."
                ></textarea>
                <p v-if="validationErrors.body" class="mt-1 text-sm text-red-600">
                  {{ validationErrors.body }}
                </p>
              </div>

              <!-- Preview -->
              <div v-if="showPreview" class="border border-gray-300 rounded-md p-4 bg-gray-50">
                <h4 class="text-sm font-medium text-gray-700 mb-2">Preview</h4>
                <div class="bg-white border rounded p-3 text-sm">
                  <div v-if="form.type === 'email'" class="mb-2">
                    <strong>Subject:</strong> {{ previewSubject }}
                  </div>
                  <div v-html="previewContent"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Variables Editor -->
          <div v-if="Object.keys(variablesMap).length > 0" class="mb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-3">Variables</h3>
            <p class="text-xs text-gray-600 mb-3">
              Customize labels shown to users for each variable. Keys are detected from content automatically.
            </p>
            <div class="space-y-2">
              <div
                v-for="key in Object.keys(variablesMap)"
                :key="key"
                class="grid grid-cols-1 md:grid-cols-3 gap-3 items-center"
              >
                <div class="text-xs md:text-sm font-mono text-gray-700">
                  {{ formatVar(key) }}
                </div>
                <input
                  v-model="variablesMap[key]"
                  type="text"
                  class="md:col-span-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter label"
                />
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
  </teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { MessageTemplate, EventType, CreateMessageTemplateRequest, UpdateMessageTemplateRequest } from '@/core/utils/admin-api'

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
  save: [template: CreateMessageTemplateRequest | UpdateMessageTemplateRequest]
}>()

// State
const isSubmitting = ref(false)
const showPreview = ref(false)
const validationErrors = ref<Record<string, string>>({})

const form = ref({
  name: '',
  type: 'email' as 'sms' | 'email',
  subject: '',
  body: '',
  is_active: true,
})

const commonVariables = [
  'PROJECT_NAME',
  'TASK_NAME',
  'ASSIGNEE_NAME',
  'DUE_DATE',
  'CREATED_BY',
] as const

const variablesMap = ref<Record<string, string>>({})
const editorRef = ref<HTMLTextAreaElement | null>(null)

// Computed
const editingTemplate = computed(() => props.template)



const previewSubject = computed(() => form.value.subject || '')

const previewContent = computed(() => (form.value.body || '').replace(/\n/g, '<br>'))

// Methods






function validateForm(): boolean {
  const errors: Record<string, string> = {}

  if (!form.value.name.trim()) {
    errors.name = 'Template name is required'
  }

  if (form.value.type === 'email' && !form.value.subject.trim()) {
    errors.subject = 'Email subject is required'
  }

  if (!form.value.body.trim()) {
    errors.body = 'Template content is required'
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
    const base = {
      name: form.value.name,
      type: form.value.type,
      body: form.value.body,
      is_active: form.value.is_active,
      category: 'custom' as const,
    }

    // Use current variables map (keeps user-edited labels)
    const variables = { ...variablesMap.value }

    const templateData: CreateMessageTemplateRequest = {
      ...base,
      ...(Object.keys(variables).length > 0 ? { variables } : {}),
      ...(form.value.type === 'email' && form.value.subject.trim()
        ? { subject: form.value.subject.trim() }
        : {}),
    }

    emit('save', templateData)
  } finally {
    isSubmitting.value = false
  }
}

function insertVariable(variable: string) {
  const textarea = editorRef.value as HTMLTextAreaElement | null
  if (textarea) {
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value
    const before = text.substring(0, start)
    const after = text.substring(end, text.length)
    const variableText = `{{${variable}}}`

    form.value.body = before + variableText + after

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + variableText.length, start + variableText.length)
    }, 0)
  }
}

function formatVar(variable: string): string {
  return `{{${variable}}}`
}

function extractVariablesFromBody(
  body: string,
  existing?: Record<string, string> | undefined,
): Record<string, string> {
  const result: Record<string, string> = {}
  if (!body) return result
  const regex = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g
  let match: RegExpExecArray | null
  const seen = new Set<string>()
  while ((match = regex.exec(body)) !== null) {
    const key = match[1]
    if (seen.has(key)) continue
    seen.add(key)
    // Preserve existing label if present; otherwise generate a readable label
    const existingLabel = existing?.[key]
    result[key] = existingLabel ?? toReadableLabel(key)
  }
  return result
}

function toReadableLabel(key: string): string {
  // Convert "PROJECT_NAME" or "project_name" to "Project name"
  const normalized = key.replace(/_/g, ' ')
  return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase()
}

// Keep variablesMap in sync with body content and existing variables when editing
watch(
  () => form.value.body,
  (newBody) => {
    const extracted = extractVariablesFromBody(newBody, variablesMap.value)
    // Remove keys not present anymore
    const next: Record<string, string> = {}
    Object.keys(extracted).forEach((k) => {
      next[k] = extracted[k]
    })
    variablesMap.value = next
  },
  { immediate: true },
)

// Simple HTML commands operating on textarea selection
function onCmd(cmd: 'bold' | 'italic' | 'p' | 'br' | 'ul' | 'ol' | 'span' | 'div' | 'h2' | 'h3' | 'link') {
  const el = editorRef.value
  if (!el) return
  const start = el.selectionStart
  const end = el.selectionEnd
  const value = form.value.body
  const selected = value.substring(start, end)

  function replace(withText: string) {
    form.value.body = value.substring(0, start) + withText + value.substring(end)
    const cursor = start + withText.length
    requestAnimationFrame(() => {
      const target = editorRef.value
      if (!target) return
      target.focus()
      target.setSelectionRange(cursor, cursor)
    })
  }

  function wrap(openTag: string, closeTag: string) {
    const content = selected || 'text'
    replace(`${openTag}${content}${closeTag}`)
  }

  if (cmd === 'bold') return wrap('<strong>', '</strong>')
  if (cmd === 'italic') return wrap('<em>', '</em>')
  if (cmd === 'p') return wrap('<p>', '</p>')
  if (cmd === 'br') return replace('<br>')
  if (cmd === 'h2') return wrap('<h2>', '</h2>')
  if (cmd === 'h3') return wrap('<h3>', '</h3>')
  if (cmd === 'span') return wrap('<span>', '</span>')
  if (cmd === 'div') return wrap('<div>', '</div>')
  if (cmd === 'ul') return replace('<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>')
  if (cmd === 'ol') return replace('<ol>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ol>')
  if (cmd === 'link') return wrap('<a href="https://example.com">', '</a>')
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
        type: newTemplate.type,
        subject: newTemplate.subject || '',
        body: newTemplate.body,
        is_active: newTemplate.is_active,
      }
      variablesMap.value = { ...(newTemplate.variables || {}) }
    } else {
      // Reset form for new template
      form.value = {
        name: '',
        type: 'email',
        subject: '',
        body: '',
        is_active: true,
      }
      variablesMap.value = {}
    }
    validationErrors.value = {}
  },
  { immediate: true },
)

defineOptions({
  name: 'MessageTemplateDialog',
})
</script>

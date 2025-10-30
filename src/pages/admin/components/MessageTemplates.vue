<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold text-gray-900">Message Templates</h2>
        <p class="mt-1 text-sm text-gray-600">
          Manage email and SMS templates for system notifications
        </p>
      </div>
      <button
        @click="openCreateDialog"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          ></path>
        </svg>
        Create Template
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-white p-4 rounded-lg border border-gray-200">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            v-model="filters.category"
            class="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            <option value="system">System</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            v-model="filters.type"
            class="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
          </select>
        </div>

        <div class="flex items-end">
          <button
            @click="clearFilters"
            class="w-full px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>

    <!-- Templates Table -->
    <div class="bg-white shadow-sm rounded-lg border border-gray-200">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Name
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Category
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Type
              </th>

              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Created
              </th>
              <th
                class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="template in filteredTemplates" :key="template.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ template.name }}</div>
                <div
                  v-if="template.type === 'email' && template.subject"
                  class="text-xs text-gray-500 mt-1"
                >
                  Subject: {{ template.subject }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="
                    template.category === 'system'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  "
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                >
                  {{ template.category }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="
                    template.type === 'email'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-yellow-100 text-yellow-800'
                  "
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                >
                  {{ template.type.toUpperCase() }}
                </span>
              </td>

              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="
                    template.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  "
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                >
                  {{ template.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(template.created_at) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center justify-end space-x-2">
                  <button
                    @click="previewTemplate(template)"
                    class="text-blue-600 hover:text-blue-900"
                  >
                    Preview
                  </button>
                  <button
                    @click="editTemplate(template)"
                    :disabled="template.category === 'system'"
                    :class="
                      template.category === 'system'
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-blue-600 hover:text-blue-900'
                    "
                  >
                    Edit
                  </button>
                  <button
                    @click="deleteTemplate(template.id)"
                    :disabled="template.category === 'system'"
                    :class="
                      template.category === 'system'
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-red-600 hover:text-red-900'
                    "
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="filteredTemplates.length === 0" class="text-center py-12">
        <svg
          class="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          ></path>
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No message templates</h3>
        <p class="mt-1 text-sm text-gray-500">Get started by creating a new message template.</p>
        <div class="mt-6">
          <button
            @click="openCreateDialog"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              ></path>
            </svg>
            Create Template
          </button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Dialog -->
    <MessageTemplateDialog
      :is-open="showDialog"
      :template="editingTemplate"
      :event-types="eventTypes"
      @close="closeDialog"
      @save="handleSave"
    />

    <!-- Preview Dialog -->
    <MessageTemplatePreview
      :is-open="showPreview"
      :template="previewTemplateData"
      :event-types="eventTypes"
      @close="closePreview"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { adminApi, type MessageTemplate, type EventType, type CreateMessageTemplateRequest, type UpdateMessageTemplateRequest } from '@/core/utils/admin-api'
import MessageTemplateDialog from './MessageTemplateDialog.vue'
import MessageTemplatePreview from './MessageTemplatePreview.vue'

// State
const templates = ref<MessageTemplate[]>([])
const eventTypes = ref<EventType[]>([])
const loading = ref(false)
const showDialog = ref(false)
const showPreview = ref(false)
const editingTemplate = ref<MessageTemplate | null>(null)
const previewTemplateData = ref<MessageTemplate | null>(null)

// Filters
const filters = ref({
  category: '',
  type: '',
})

// Computed
const filteredTemplates = computed(() => {
  return templates.value.filter((template) => {
    if (filters.value.category && template.category !== filters.value.category) return false
    if (filters.value.type && template.type !== filters.value.type) return false

    return true
  })
})

// Methods
async function loadData() {
  loading.value = true
  try {
    const p1 = adminApi
      .getMessageTemplates()
      .then((data) => (templates.value = data))
      .catch(() => (templates.value = []))

    const p2 = adminApi
      .getEventTypes()
      .then((data) => (eventTypes.value = data))
      .catch(() => void 0)

    await Promise.allSettled([p1, p2])
  } catch (error) {
    console.error('Error loading message templates data:', error)
    // Don't set empty array, keep existing data
    templates.value = []
    eventTypes.value = await adminApi.getEventTypes()
  } finally {
    loading.value = false
  }
}



function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString()
}

function openCreateDialog() {
  editingTemplate.value = null
  showDialog.value = true
}

function editTemplate(template: MessageTemplate) {
  editingTemplate.value = template
  showDialog.value = true
}

function previewTemplate(template: MessageTemplate) {
  previewTemplateData.value = template
  showPreview.value = true
}

function closeDialog() {
  showDialog.value = false
  editingTemplate.value = null
}

function closePreview() {
  showPreview.value = false
  previewTemplateData.value = null
}

async function handleSave(templateData: CreateMessageTemplateRequest | UpdateMessageTemplateRequest) {
  try {
    if (editingTemplate.value) {
      await adminApi.updateMessageTemplate(editingTemplate.value.id, templateData as UpdateMessageTemplateRequest)
    } else {
      await adminApi.createMessageTemplate(templateData as CreateMessageTemplateRequest)
    }
    await loadData()
    closeDialog()
  } catch (error) {
    const err = error as { response?: { data?: unknown; status?: number } }
    console.error('Error saving message template:', err)
    if (err.response?.data) {
      console.error('Server response:', err.response.data)
      alert(`Failed to save template: ${JSON.stringify(err.response.data)}`)
    } else {
      alert('Failed to save template: unknown error')
    }
  }
}

async function deleteTemplate(id: number) {
  if (confirm('Are you sure you want to delete this message template?')) {
    try {
      await adminApi.deleteMessageTemplate(id)
      await loadData()
    } catch (error) {
      console.error('Error deleting message template:', error)
    }
  }
}

function clearFilters() {
  filters.value = {
    category: '',
    type: '',
  }
}

// Lifecycle
onMounted(() => {
  loadData()
})

defineOptions({
  name: 'MessageTemplates',
})
</script>

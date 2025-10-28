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
          {{ editingRule ? 'Edit Event Rule' : 'Create Event Rule' }}
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
                Rule Name <span class="text-red-500">*</span>
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
                placeholder="Enter rule name"
              />
              <p v-if="validationErrors.name" class="mt-1 text-sm text-red-600">
                {{ validationErrors.name }}
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Rule Type <span class="text-red-500">*</span>
              </label>
              <select
                v-model="form.rule_type"
                required
                :disabled="editingRule?.rule_type === 'system'"
                :class="[
                  'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                  validationErrors.rule_type
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300',
                  editingRule?.rule_type === 'system' ? 'bg-gray-100 cursor-not-allowed' : '',
                ]"
              >
                <option value="custom">Custom</option>
                <option value="system">System</option>
              </select>
              <p v-if="validationErrors.rule_type" class="mt-1 text-sm text-red-600">
                {{ validationErrors.rule_type }}
              </p>
              <p v-if="editingRule?.rule_type === 'system'" class="mt-1 text-xs text-gray-500">
                System rules cannot be changed to custom
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

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Status <span class="text-red-500">*</span>
              </label>
              <select
                v-model="form.status"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Execution Location
              </label>
              <select
                v-model="form.execution_location"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Manual</option>
                <option value="server">Server</option>
                <option value="auto">Auto</option>
              </select>
            </div>
          </div>

          <!-- Conditions -->
          <div class="mb-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-medium text-gray-900">Conditions</h3>
              <button
                type="button"
                @click="addCondition"
                class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4v16m8-8H4"
                  ></path>
                </svg>
                Add Condition
              </button>
            </div>

            <div v-if="form.conditions.length === 0" class="text-center py-8 bg-gray-50 rounded-lg">
              <p class="text-gray-500">
                No conditions added. Rules without conditions will trigger on all events.
              </p>
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="(condition, index) in form.conditions"
                :key="index"
                class="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
              >
                <div class="flex-1">
                  <select
                    v-model="condition.condition_type"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="role">Role</option>
                    <option value="time">Time</option>
                    <option value="project">Project</option>
                    <option value="task">Task</option>
                  </select>
                </div>
                <div class="flex-1">
                  <select
                    v-model="condition.operator"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="equals">Equals</option>
                    <option value="not_equals">Not Equals</option>
                    <option value="contains">Contains</option>
                    <option value="not_contains">Not Contains</option>
                    <option value="greater_than">Greater Than</option>
                    <option value="less_than">Less Than</option>
                  </select>
                </div>
                <div class="flex-1">
                  <input
                    v-model="condition.condition_value"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Condition value"
                  />
                </div>
                <button
                  type="button"
                  @click="removeCondition(index)"
                  class="text-red-600 hover:text-red-800"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    ></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="mb-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-medium text-gray-900">Actions</h3>
              <button
                type="button"
                @click="addAction"
                class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4v16m8-8H4"
                  ></path>
                </svg>
                Add Action
              </button>
            </div>

            <div v-if="form.actions.length === 0" class="text-center py-8 bg-gray-50 rounded-lg">
              <p class="text-gray-500">No actions added. Add at least one action for the rule.</p>
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="(action, index) in form.actions"
                :key="index"
                class="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
              >
                <div class="flex-1">
                  <select
                    v-model="action.action_type"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="notify">Notify</option>
                    <option value="log_only">Log Only</option>
                    <option value="create_daily_report">Create Daily Report</option>
                  </select>
                </div>
                <div v-if="action.action_type === 'notify'" class="flex-1">
                  <select
                    v-model="action.template_id"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select template</option>
                    <!-- Template options would be loaded here -->
                  </select>
                </div>
                <button
                  type="button"
                  @click="removeAction(index)"
                  class="text-red-600 hover:text-red-800"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    ></path>
                  </svg>
                </button>
              </div>
            </div>
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
              {{ isSubmitting ? 'Saving...' : editingRule ? 'Update Rule' : 'Create Rule' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type {
  EventRule,
  EventType,
  EventRuleCondition,
  EventRuleAction,
} from '@/core/utils/admin-api'

// Props
interface Props {
  isOpen: boolean
  rule?: EventRule | null
  eventTypes: EventType[]
  conditions: EventRuleCondition[]
  actions: EventRuleAction[]
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  rule: null,
  eventTypes: () => [],
  conditions: () => [],
  actions: () => [],
})

// Emits
const emit = defineEmits<{
  close: []
  save: [rule: any]
}>()

// State
const isSubmitting = ref(false)
const validationErrors = ref<Record<string, string>>({})

const form = ref({
  name: '',
  rule_type: 'custom' as 'system' | 'custom',
  event_type: '',
  status: 'active' as 'active' | 'inactive',
  execution_location: '' as 'server' | 'auto' | null,
  conditions: [] as Array<{
    condition_type: string
    operator: string
    condition_value: string
  }>,
  actions: [] as Array<{
    action_type: string
    template_id?: number
    action_config: Record<string, unknown>
  }>,
})

// Computed
const editingRule = computed(() => props.rule)

// Methods
function addCondition() {
  form.value.conditions.push({
    condition_type: 'role',
    operator: 'equals',
    condition_value: '',
  })
}

function removeCondition(index: number) {
  form.value.conditions.splice(index, 1)
}

function addAction() {
  form.value.actions.push({
    action_type: 'notify',
    action_config: {},
  })
}

function removeAction(index: number) {
  form.value.actions.splice(index, 1)
}

function validateForm(): boolean {
  const errors: Record<string, string> = {}

  if (!form.value.name.trim()) {
    errors.name = 'Rule name is required'
  }

  if (!form.value.event_type) {
    errors.event_type = 'Event type is required'
  }

  if (form.value.actions.length === 0) {
    errors.actions = 'At least one action is required'
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
    const ruleData = {
      ...form.value,
      execution_location: form.value.execution_location || null,
    }

    emit('save', ruleData)
  } finally {
    isSubmitting.value = false
  }
}

function closeDialog() {
  emit('close')
}

// Watch for rule changes
watch(
  () => props.rule,
  (newRule) => {
    if (newRule) {
      form.value = {
        name: newRule.name,
        rule_type: newRule.rule_type,
        event_type: newRule.event_type,
        status: newRule.status,
        execution_location: newRule.execution_location,
        conditions: (newRule.conditions || []).map((c) => ({
          condition_type: c.condition_type,
          operator: c.operator,
          condition_value: c.condition_value,
        })),
        actions: (newRule.actions || []).map((a) => ({
          action_type: a.action_type,
          template_id: a.template_id,
          action_config: a.action_config,
        })),
      }
    } else {
      // Reset form for new rule
      form.value = {
        name: '',
        rule_type: 'custom',
        event_type: '',
        status: 'active',
        execution_location: '',
        conditions: [],
        actions: [],
      }
    }
    validationErrors.value = {}
  },
  { immediate: true },
)

defineOptions({
  name: 'EventRuleDialog',
})
</script>

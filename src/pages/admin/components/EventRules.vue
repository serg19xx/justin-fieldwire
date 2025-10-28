<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold text-gray-900">Event Rules</h2>
        <p class="mt-1 text-sm text-gray-600">
          Manage automated rules for system events (System rules are predefined, Custom rules are
          user-created)
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
        Create Rule
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-white p-4 rounded-lg border border-gray-200">
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Rule Type</label>
          <select
            v-model="filters.ruleType"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="system">System</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Search Event Type</label>
          <input
            v-model="filters.searchEventType"
            type="text"
            placeholder="Search by event type..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            v-model="filters.enabled"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Execution Location</label>
          <select
            v-model="filters.executionLocation"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Locations</option>
            <option value="server">Server</option>
            <option value="auto">Auto</option>
            <option value="null">Manual</option>
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

    <!-- Rules Table -->
    <div class="bg-white shadow-sm rounded-lg border border-gray-200">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Event Type
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Rule Type
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Execution
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Updated
              </th>
              <th
                class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="rule in filteredRules" :key="rule.event_type" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ rule.event_type }}</div>
                <div class="text-xs text-gray-500">{{ rule.comment }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="action in rule.actions"
                    :key="action"
                    class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {{ action }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="
                    getRuleType(rule) === 'system'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  "
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                >
                  {{ getRuleType(rule) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="rule.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                >
                  {{ rule.enabled ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ rule.execution_location || 'Manual' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(rule.updated_at) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center justify-end space-x-2">
                  <button @click="editRule(rule)" class="text-blue-600 hover:text-blue-900">
                    Edit
                  </button>
                  <button
                    @click="deleteRule(rule.event_type)"
                    class="text-red-600 hover:text-red-900"
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
      <div v-if="filteredRules.length === 0" class="text-center py-12">
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          ></path>
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No event rules</h3>
        <p class="mt-1 text-sm text-gray-500">Get started by creating a new event rule.</p>
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
            Create Rule
          </button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Dialog -->
    <EventRuleDialog
      :is-open="showDialog"
      :rule="editingRule"
      :event-types="eventTypes"
      :conditions="conditions"
      :actions="actions"
      @close="closeDialog"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  adminApi,
  type EventRule,
  type EventType,
  type EventRuleCondition,
  type EventRuleAction,
} from '@/core/utils/admin-api'
import EventRuleDialog from './EventRuleDialog.vue'

// State
const rules = ref<EventRule[]>([])
const eventTypes = ref<EventType[]>([])
const conditions = ref<EventRuleCondition[]>([])
const actions = ref<EventRuleAction[]>([])
const loading = ref(false)
const showDialog = ref(false)
const editingRule = ref<EventRule | null>(null)

// Filters
const filters = ref({
  ruleType: '',
  searchEventType: '',
  enabled: '',
  executionLocation: '',
})

// Computed
const filteredRules = computed(() => {
  return rules.value.filter((rule) => {
    if (filters.value.ruleType && getRuleType(rule) !== filters.value.ruleType) return false
    if (
      filters.value.searchEventType &&
      !rule.event_type.toLowerCase().includes(filters.value.searchEventType.toLowerCase())
    )
      return false
    if (filters.value.enabled && rule.enabled.toString() !== filters.value.enabled) return false
    if (
      filters.value.executionLocation &&
      rule.execution_location !== filters.value.executionLocation
    )
      return false
    return true
  })
})

// Methods
async function loadData() {
  loading.value = true
  try {
    const [rulesData, eventTypesData, conditionsData, actionsData] = await Promise.all([
      adminApi.getEventRules(),
      adminApi.getEventTypes(),
      adminApi.getEventRuleConditions(),
      adminApi.getEventRuleActions(),
    ])

    rules.value = rulesData
    eventTypes.value = eventTypesData
    conditions.value = conditionsData
    actions.value = actionsData
  } catch (error) {
    console.error('Error loading event rules data:', error)
    // For now, use mock data
    rules.value = []
    eventTypes.value = await adminApi.getEventTypes()
    conditions.value = []
    actions.value = []
  } finally {
    loading.value = false
  }
}

function getRuleType(rule: EventRule): 'system' | 'custom' {
  // System rules are those without updated_by (created by system)
  // Custom rules are those with updated_by (created by users)
  return rule.updated_by === null ? 'system' : 'custom'
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString()
}

function openCreateDialog() {
  editingRule.value = null
  showDialog.value = true
}

function editRule(rule: EventRule) {
  editingRule.value = rule
  showDialog.value = true
}

function closeDialog() {
  showDialog.value = false
  editingRule.value = null
}

async function handleSave(ruleData: any) {
  try {
    if (editingRule.value) {
      await adminApi.updateEventRule(editingRule.value.id, ruleData)
    } else {
      await adminApi.createEventRule(ruleData)
    }
    await loadData()
    closeDialog()
  } catch (error) {
    console.error('Error saving event rule:', error)
  }
}

async function deleteRule(eventType: string) {
  if (confirm('Are you sure you want to delete this event rule?')) {
    try {
      await adminApi.deleteEventRule(eventType)
      await loadData()
    } catch (error) {
      console.error('Error deleting event rule:', error)
    }
  }
}

function clearFilters() {
  filters.value = {
    ruleType: '',
    searchEventType: '',
    enabled: '',
    executionLocation: '',
  }
}

// Lifecycle
onMounted(() => {
  loadData()
})

defineOptions({
  name: 'EventRules',
})
</script>

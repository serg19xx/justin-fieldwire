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
            class="w-full h-10 px-4 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-400 text-gray-900"
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
            class="w-full h-10 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-400 text-gray-900"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            v-model="filters.enabled"
            class="w-full h-10 px-4 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-400 text-gray-900"
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
            class="w-full h-10 px-4 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-400 text-gray-900"
          >
            <option value="">All Locations</option>
            <option value="server">Server</option>
            <option value="n8n">N8N</option>
            <option value="both">Both</option>
            <option value="null">Auto</option>
          </select>
        </div>
        <div class="flex items-end">
          <button
            @click="clearFilters"
            class="w-full h-10 px-4 border border-gray-300 text-sm font-medium rounded-lg text-gray-800 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all duration-200 hover:border-blue-400"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>

    <!-- Rules Table -->
    <div class="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
      <table class="w-full table-fixed divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[70%]">
              Rule
            </th>
            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">
              Status
            </th>
            <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">
              Edit
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr
            v-for="rule in filteredRules"
            :key="rule.event_type"
            class="hover:bg-gray-50 cursor-pointer"
            @click="editRule(rule)"
          >
            <td class="px-3 py-2 align-top">
              <div class="flex flex-wrap items-center gap-1.5 min-w-0">
                <span class="text-sm font-medium text-gray-900 break-all">{{ rule.event_type }}</span>
                <span
                  :class="
                    getRuleType(rule) === 'system'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  "
                  class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase"
                >
                  {{ getRuleType(rule) }}
                </span>
              </div>
              <div
                class="mt-0.5 text-xs text-gray-600 line-clamp-2"
                :title="formatActionsSummary(rule)"
              >
                {{ formatActionsSummary(rule) }}
              </div>
              <div v-if="rule.comment" class="mt-0.5 text-xs text-gray-400 truncate">
                {{ rule.comment }}
              </div>
            </td>
            <td class="px-3 py-2 align-top whitespace-nowrap">
              <span
                :class="rule.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              >
                {{ rule.enabled ? 'Active' : 'Off' }}
              </span>
            </td>
            <td class="px-3 py-2 align-top whitespace-nowrap text-right text-sm font-medium" @click.stop>
              <button
                type="button"
                @click="editRule(rule)"
                class="text-blue-600 hover:text-blue-900"
              >
                Edit
              </button>
              <button
                type="button"
                @click="deleteRule(rule)"
                :disabled="getRuleType(rule) === 'system'"
                :class="[
                  'ml-2 text-red-600',
                  getRuleType(rule) === 'system'
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:text-red-900',
                ]"
              >
                Del
              </button>
            </td>
          </tr>
        </tbody>
      </table>

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
  type EventRuleConditionType,
  type EventRuleActionType,
  type EventRuleAction,
  type NotifyChannel,
} from '@/core/utils/admin-api'
import EventRuleDialog from './EventRuleDialog.vue'

// State
const rules = ref<EventRule[]>([])
const eventTypes = ref<EventType[]>([])
const conditions = ref<EventRuleConditionType[]>([])
const actions = ref<EventRuleActionType[]>([])
const loading = ref(false)
const showDialog = ref(false)
const editingRule = ref<EventRule | null>(null)
// Helpers
function sanitizeRule(rule: EventRule): EventRule {
  // Deep clone with typing
  const clone = JSON.parse(JSON.stringify(rule)) as EventRule

  // Normalize execution_location: only 'server' | 'n8n' | 'both' | null
  if (clone.execution_location !== 'server' && clone.execution_location !== 'n8n' && clone.execution_location !== 'both') {
    clone.execution_location = null
  }

  // Normalize priority: allow null or one of allowed
  if (
    clone.priority !== 'critical' &&
    clone.priority !== 'high' &&
    clone.priority !== 'normal' &&
    clone.priority !== 'low'
  ) {
    clone.priority = null
  }

  // Actions normalization
  if (Array.isArray(clone.actions)) {
    const allowedChannels: NotifyChannel[] = ['email', 'sms', 'push']
    clone.actions = clone.actions.map((a: EventRuleAction) => {
      if (a.type === 'notify') {
        a.channels = Array.isArray(a.channels)
          ? (a.channels.filter((c) => allowedChannels.includes(c as NotifyChannel)) as NotifyChannel[])
          : []
        if (!Array.isArray(a.recipients)) a.recipients = []

        // Prefer channel_content; migrate legacy channel_templates
        const content: NonNullable<typeof a.channel_content> = { ...(a.channel_content || {}) }
        const legacy = a.channel_templates || {}
        for (const ch of allowedChannels) {
          if (content[ch]) continue
          const tid = legacy[ch]
          if (tid != null && Number(tid) > 0) {
            content[ch] = { mode: 'local', template_id: Number(tid) }
          }
        }
        // Keep only channels in use
        const pruned: typeof content = {}
        for (const ch of a.channels) {
          pruned[ch] = content[ch] || { mode: 'system' }
        }
        a.channel_content = pruned
        delete a.channel_templates
      }
      if (a.type === 'create_report') {
        const allowed = ['daily', 'weekly', 'monthly', 'quarterly', 'custom']
        const p = a.period ?? 'daily'
        if (!allowed.includes(p)) a.period = 'daily'
        if (a.period !== 'custom') delete a.custom_period
        if (!Array.isArray(a.recipients)) a.recipients = []
      }
      return a
    })
  }

  // Conditions: keep schedule filter only; strip legacy notify_roles / strict_mode
  if (!clone.conditions || typeof clone.conditions !== 'object') {
    clone.conditions = {}
  } else {
    const raw = clone.conditions as Record<string, unknown>
    const next: Record<string, unknown> = {}
    if (raw.time_conditions && typeof raw.time_conditions === 'object') {
      const tc = raw.time_conditions as Record<string, unknown>
      next.time_conditions =
        'value' in tc && tc.value && typeof tc.value === 'object' ? tc.value : tc
    }
    clone.conditions = next
  }
  return clone as EventRule
}

// Send new schema directly to backend
function buildNewSchemaPayload(rule: EventRule): EventRule {
  return {
    event_type: rule.event_type,
    enabled: rule.enabled,
    severity: rule.severity,
    priority: rule.priority,
    actions: rule.actions,
    conditions: rule.conditions,
    execution_location: rule.execution_location,
    comment: rule.comment,
    updated_at: rule.updated_at,
    updated_by: rule.updated_by,
  }
}


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
    const p1 = adminApi
      .getEventRules()
      .then((data) => (rules.value = data))
      .catch(() => (rules.value = []))

    const p2 = adminApi
      .getEventTypes()
      .then((data) => (eventTypes.value = data))
      .catch(() => void 0)

    const p3 = adminApi
      .getEventRuleConditions()
      .then((data) => (conditions.value = data))
      .catch(() => (conditions.value = []))

    const p4 = adminApi
      .getEventRuleActions()
      .then((data) => (actions.value = data))
      .catch(() => (actions.value = []))

    await Promise.allSettled([p1, p2, p3, p4])
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

function formatActionsSummary(rule: EventRule): string {
  if (!Array.isArray(rule.actions) || rule.actions.length === 0) {
    return '—'
  }
  return rule.actions
    .map((a) => {
      if (a.type === 'notify') {
        const channels = (a.channels || []).join('/') || '?'
        const recipients = (a.recipients || []).map(shortRole).join(',') || 'default'
        return `Notify ${channels}→${recipients}`
      }
      if (a.type === 'create_report') {
        const recipients = (a.recipients || []).map(shortRole).join(',') || 'default'
        return `Report ${a.period || 'daily'}→${recipients}`
      }
      if (a.type === 'log_only') {
        return 'Log only'
      }
      return String((a as { type?: string }).type ?? 'action')
    })
    .join(' · ')
}

function shortRole(role: string): string {
  const map: Record<string, string> = {
    admin: 'admin',
    project_manager: 'PM',
    task_lead: 'lead',
    team_members: 'team',
    foreman: 'foreman',
    worker: 'worker',
    contractor: 'contractor',
    inspector: 'inspector',
  }
  return map[role] || role
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

async function handleSave(ruleData: EventRule) {
  try {
    const payload = sanitizeRule(ruleData)
    // Send new schema directly to backend
    const newSchema = buildNewSchemaPayload(payload)
    console.log('📝 Submitting new schema event-rule payload:', newSchema)
    if (!Array.isArray(newSchema.actions) || newSchema.actions.length === 0) {
      alert('Add at least one action before saving the rule')
      return
    }
    if (editingRule.value) {
      await adminApi.updateEventRule(editingRule.value.event_type, newSchema)
    } else {
      await adminApi.createEventRule(newSchema)
    }
    await loadData()
    closeDialog()
  } catch (error) {
    const err = error as { response?: { data?: unknown; status?: number } }
    console.error('Error saving event rule:', err)
    if (err.response?.data) {
      console.error('Server response:', err.response.data)
      alert(`Failed to save rule: ${JSON.stringify(err.response.data)}`)
    } else {
      alert('Failed to save rule: unknown error')
    }
  }
}

async function deleteRule(rule: EventRule) {
  if (getRuleType(rule) === 'system') {
    alert('Only custom (user-created) rules can be deleted')
    return
  }
  if (confirm('Are you sure you want to delete this event rule?')) {
    try {
      await adminApi.deleteEventRule(rule.event_type)
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

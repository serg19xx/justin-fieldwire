<template>
  <div class="px-4 py-6 md:px-6 max-w-5xl mx-auto">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Event log</h1>
        <p class="text-sm text-slate-500 mt-0.5">
          Audit trail of system events — filter and inspect what happened.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <PageUserGuideLink href="/USER_GUIDE_EVENT_LOG.html" />
        <button
          class="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
          :disabled="isLoading"
          @click="load"
        >
          <svg
            class="w-4 h-4"
            :class="{ 'animate-spin': isLoading }"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg border border-slate-200 shadow-sm p-4 mb-5">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div>
          <label class="block text-xs font-medium text-slate-500 mb-1">Search</label>
          <input
            v-model="filters.q"
            type="search"
            placeholder="Comment, type, project…"
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            @keydown.enter="applyFilters"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-500 mb-1">Event type</label>
          <select
            v-model="filters.event_type"
            class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="">All types</option>
            <option v-for="type in eventTypes" :key="type" :value="type">{{ type }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-500 mb-1">Project</label>
          <select
            v-model="filters.project_id"
            class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="">All projects</option>
            <option v-for="p in projects" :key="p.id" :value="String(p.id)">
              {{ p.prj_name || `Project #${p.id}` }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-500 mb-1">From</label>
          <input
            v-model="filters.date_from"
            type="date"
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-500 mb-1">To</label>
          <input
            v-model="filters.date_to"
            type="date"
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-500 mb-1">Actor</label>
          <select
            v-model="filters.actor_type"
            class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="">All actors</option>
            <option value="user">User</option>
            <option value="system">System</option>
            <option value="api">API</option>
          </select>
        </div>
      </div>
      <div class="flex flex-wrap gap-2 mt-4">
        <button
          class="text-sm px-3 py-1.5 rounded-md bg-slate-800 text-white hover:bg-slate-700"
          @click="applyFilters"
        >
          Apply
        </button>
        <button
          class="text-sm px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
          @click="resetFilters"
        >
          Reset
        </button>
      </div>
    </div>

    <div v-if="hasError" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-5">
      Failed to load event log.
      <button class="underline ml-1" @click="load">Retry</button>
    </div>

    <div v-if="isLoading && logs.length === 0" class="py-12 text-center text-slate-400 text-sm">
      Loading…
    </div>

    <template v-else>
      <div class="flex items-center justify-between mb-3">
        <p class="text-sm text-slate-500">
          {{ total }} event{{ total === 1 ? '' : 's' }}
          <span v-if="total > 0">· showing {{ offset + 1 }}–{{ Math.min(offset + limit, total) }}</span>
        </p>
      </div>

      <div
        v-if="logs.length === 0"
        class="bg-white rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400"
      >
        No events match these filters.
      </div>

      <ul v-else class="bg-white rounded-lg border border-slate-200 shadow-sm divide-y divide-slate-100">
        <li
          v-for="log in logs"
          :key="log.id"
          class="px-4 py-3 hover:bg-slate-50 cursor-pointer"
          @click="openDetail(log)"
        >
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-sm font-medium text-slate-900 font-mono">{{ log.event_type }}</span>
                <span
                  v-if="log.severity"
                  class="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded"
                  :class="
                    log.severity === 'critical'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-slate-100 text-slate-600'
                  "
                >
                  {{ log.severity }}
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-1">
                <template v-if="log.project_name">{{ log.project_name }}</template>
                <template v-if="log.task_name">
                  <span v-if="log.project_name"> · </span>{{ log.task_name }}
                </template>
                <template v-if="!log.project_name && !log.task_name">
                  {{ log.entity_type }}{{ log.entity_id != null ? ` #${log.entity_id}` : '' }}
                </template>
              </p>
              <p v-if="log.comment" class="text-sm text-slate-600 mt-1 line-clamp-2">
                {{ log.comment }}
              </p>
            </div>
            <div class="text-right shrink-0">
              <div class="text-xs text-slate-500">{{ formatWhen(log.occurred_at) }}</div>
              <div class="text-xs text-slate-400 mt-0.5">{{ log.actor_name || log.actor_type || '—' }}</div>
            </div>
          </div>
        </li>
      </ul>

      <div v-if="total > limit" class="flex justify-center gap-3 mt-4">
        <button
          class="text-sm px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          :disabled="offset === 0 || isLoading"
          @click="prevPage"
        >
          Previous
        </button>
        <button
          class="text-sm px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          :disabled="offset + limit >= total || isLoading"
          @click="nextPage"
        >
          Next
        </button>
      </div>
    </template>

    <!-- Detail drawer -->
    <div
      v-if="selected"
      class="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
    >
      <div class="absolute inset-0 bg-black/40" @click="closeDetail" />
      <aside
        class="relative w-full max-w-lg h-full bg-white shadow-xl overflow-y-auto p-5"
        @click.stop
      >
        <div class="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 class="text-lg font-semibold text-slate-900 font-mono">{{ selected.event_type }}</h2>
            <p class="text-xs text-slate-500 mt-1">{{ formatWhen(selected.occurred_at) }}</p>
          </div>
          <button
            type="button"
            class="text-slate-400 hover:text-slate-700 p-1"
            aria-label="Close"
            @click="closeDetail"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <dl class="space-y-3 text-sm mb-6">
          <div class="flex justify-between gap-4">
            <dt class="text-slate-500">Actor</dt>
            <dd class="text-slate-900 text-right">
              {{ selected.actor_name || selected.actor_type || '—' }}
            </dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-slate-500">Severity</dt>
            <dd class="text-slate-900 text-right">{{ selected.severity || '—' }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-slate-500">Project</dt>
            <dd class="text-slate-900 text-right">
              {{ selected.project_name || (selected.project_id ? `#${selected.project_id}` : '—') }}
            </dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-slate-500">Task</dt>
            <dd class="text-slate-900 text-right">
              {{ selected.task_name || (selected.task_id ? `#${selected.task_id}` : '—') }}
            </dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-slate-500">Entity</dt>
            <dd class="text-slate-900 text-right">
              {{ selected.entity_type
              }}{{ selected.entity_id != null ? ` #${selected.entity_id}` : '' }}
            </dd>
          </div>
          <div v-if="selected.comment" class="pt-2 border-t border-slate-100">
            <dt class="text-slate-500 mb-1">Comment</dt>
            <dd class="text-slate-900 whitespace-pre-wrap">{{ selected.comment }}</dd>
          </div>
        </dl>

        <section v-if="hasChangedFields" class="mb-5">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
            Changed fields
          </h3>
          <pre
            class="text-xs bg-slate-50 border border-slate-200 rounded-md p-3 overflow-x-auto text-slate-700"
          >{{ formatJson(selected.changed_fields) }}</pre>
        </section>

        <section v-if="selected.before_data" class="mb-5">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Before</h3>
          <pre
            class="text-xs bg-slate-50 border border-slate-200 rounded-md p-3 overflow-x-auto text-slate-700"
          >{{ formatJson(selected.before_data) }}</pre>
        </section>

        <section v-if="selected.after_data" class="mb-5">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">After</h3>
          <pre
            class="text-xs bg-slate-50 border border-slate-200 rounded-md p-3 overflow-x-auto text-slate-700"
          >{{ formatJson(selected.after_data) }}</pre>
        </section>

        <p v-if="selected.correlation_id" class="text-[11px] text-slate-400 break-all">
          Correlation: {{ selected.correlation_id }}
        </p>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import PageUserGuideLink from '@/components/PageUserGuideLink.vue'
import {
  eventLogsApi,
  type EventLogFilters,
  type EventLogItem,
} from '@/core/utils/event-logs-api'
import { adminApi } from '@/core/utils/admin-api'
import { projectApi, type Project } from '@/core/utils/project-api'
import {
  getProjectListQueryFiltersForUser,
  parseProjectsFromListResponse,
} from '@/core/utils/project-list-for-user'
import { useAuthStore } from '@/core/stores/auth'

defineOptions({ name: 'EventLogPage' })

const authStore = useAuthStore()

const logs = ref<EventLogItem[]>([])
const total = ref(0)
const limit = 50
const offset = ref(0)
const isLoading = ref(false)
const hasError = ref(false)
const selected = ref<EventLogItem | null>(null)
const eventTypes = ref<string[]>([])
const projects = ref<Project[]>([])

const filters = reactive({
  q: '',
  event_type: '',
  project_id: '',
  date_from: '',
  date_to: '',
  actor_type: '',
})

const hasChangedFields = computed(() => {
  const fields = selected.value?.changed_fields
  if (!fields) return false
  if (Array.isArray(fields)) return fields.length > 0
  return Object.keys(fields).length > 0
})

function buildQuery(): EventLogFilters {
  const query: EventLogFilters = {
    limit,
    offset: offset.value,
  }
  if (filters.q.trim()) query.q = filters.q.trim()
  if (filters.event_type) query.event_type = filters.event_type
  if (filters.project_id) query.project_id = Number(filters.project_id)
  if (filters.date_from) query.date_from = filters.date_from
  if (filters.date_to) query.date_to = filters.date_to
  if (filters.actor_type) query.actor_type = filters.actor_type
  return query
}

async function load(): Promise<void> {
  isLoading.value = true
  hasError.value = false
  try {
    const result = await eventLogsApi.list(buildQuery())
    logs.value = result.logs || []
    total.value = Number(result.total) || 0
  } catch {
    hasError.value = true
    logs.value = []
    total.value = 0
  } finally {
    isLoading.value = false
  }
}

function applyFilters(): void {
  offset.value = 0
  void load()
}

function resetFilters(): void {
  filters.q = ''
  filters.event_type = ''
  filters.project_id = ''
  filters.date_from = ''
  filters.date_to = ''
  filters.actor_type = ''
  offset.value = 0
  void load()
}

function prevPage(): void {
  offset.value = Math.max(0, offset.value - limit)
  void load()
}

function nextPage(): void {
  offset.value += limit
  void load()
}

async function openDetail(log: EventLogItem): Promise<void> {
  selected.value = log
  try {
    selected.value = await eventLogsApi.getById(log.id)
  } catch {
    // Keep list row data if detail fetch fails
  }
}

function closeDetail(): void {
  selected.value = null
}

function formatWhen(value: string): string {
  if (!value) return '—'
  const parsed = new Date(value.replace(' ', 'T'))
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

async function loadFilterOptions(): Promise<void> {
  try {
    const rules = await adminApi.getEventRules()
    eventTypes.value = rules
      .map((r) => r.event_type)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
  } catch {
    eventTypes.value = []
  }

  try {
    const query = getProjectListQueryFiltersForUser(authStore.currentUser)
    const data = await projectApi.getAll(1, 200, query)
    projects.value = parseProjectsFromListResponse(data)
  } catch {
    projects.value = []
  }
}

onMounted(async () => {
  await loadFilterOptions()
  await load()
})
</script>

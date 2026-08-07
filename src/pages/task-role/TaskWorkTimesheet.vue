<template>
  <div class="px-4 py-4 max-w-lg mx-auto pb-8">
    <header class="mb-4">
      <h1 class="text-xl font-semibold text-gray-900">Timesheet</h1>
      <p class="mt-1">
        <PageUserGuideLink
          href="/CLIENT_SCHEDULE_AND_WORKER_TIMESHEET_GUIDE.html"
          label="Testing guide"
        />
      </p>
      <p class="text-sm text-gray-500 mt-1">
        Actual hours from your tasks (Gantt plan + day Start/End). Read-only — not the PM schedule
        notebook.
      </p>
    </header>

    <div class="mb-4 flex items-center justify-between gap-2">
      <button
        type="button"
        class="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40"
        :disabled="isLoading"
        @click="shiftMonth(-1)"
      >
        ← Prev
      </button>
      <p class="text-sm font-semibold text-gray-900 tabular-nums">{{ monthLabel }}</p>
      <button
        type="button"
        class="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40"
        :disabled="isLoading"
        @click="shiftMonth(1)"
      >
        Next →
      </button>
    </div>

    <div
      class="mb-4 rounded-xl border border-orange-100 bg-orange-50 px-3 py-2.5 flex items-baseline justify-between gap-3"
    >
      <span class="text-xs font-medium text-orange-800 uppercase tracking-wide">Total</span>
      <span class="text-lg font-semibold text-orange-900 tabular-nums">
        {{ formatHours(sheet?.total_hours ?? 0) }} h
      </span>
    </div>

    <div
      v-if="loadError"
      class="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
    >
      {{ loadError }}
    </div>

    <div v-if="isLoading" class="flex justify-center py-12">
      <div class="animate-spin w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full" />
    </div>

    <div
      v-else-if="!sheet || sheet.days.length === 0"
      class="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500"
    >
      No planned or recorded work this month.
    </div>

    <ul v-else class="space-y-3">
      <li
        v-for="day in sheet.days"
        :key="day.work_date"
        class="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
      >
        <div
          class="flex items-center justify-between gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50/80"
        >
          <p class="text-sm font-semibold text-gray-900">{{ formatDayLabel(day.work_date) }}</p>
          <p class="text-xs font-medium text-gray-600 tabular-nums">
            {{ day.hours > 0 ? `${formatHours(day.hours)} h` : '—' }}
          </p>
        </div>
        <ul class="divide-y divide-gray-100">
          <li
            v-for="entry in day.entries"
            :key="`${day.work_date}-${entry.task_id}`"
            class="px-3 py-2.5"
          >
            <p class="text-sm font-medium text-gray-900 truncate">
              {{ entry.project_name || `Project #${entry.project_id}` }}
            </p>
            <p v-if="entry.task_name" class="text-xs text-gray-600 truncate mt-0.5">
              {{ entry.task_name }}
            </p>
            <p
              v-if="siteAddress(entry)"
              class="text-xs text-gray-500 truncate mt-0.5"
            >
              {{ siteAddress(entry) }}
            </p>
            <p class="mt-1.5 text-[11px] text-gray-600 tabular-nums">
              <template v-if="entry.has_actual">
                Actual:
                {{ formatTime(entry.work_start_at) }}
                –
                {{ formatTime(entry.work_end_at) }}
                <span v-if="entry.hours != null" class="text-gray-500">
                  ({{ formatHours(entry.hours) }} h)
                </span>
              </template>
              <template v-else>
                <span class="text-gray-400">No Start/End recorded</span>
              </template>
            </p>
          </li>
        </ul>
      </li>
    </ul>

    <p class="mt-6 text-xs text-gray-500 text-center leading-relaxed">
      PM payroll Schedule is separate —
      <RouterLink to="/tasks/schedule" class="font-medium text-blue-700 hover:underline">
        open Schedule
      </RouterLink>
      to clock in on days your PM assigned.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import PageUserGuideLink from '@/components/PageUserGuideLink.vue'
import {
  fetchMyWorkTimesheet,
  type WorkerTimesheetEntry,
  type WorkerTimesheetMonth,
} from '@/core/utils/work-timesheet-api'

const route = useRoute()
const router = useRouter()

const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth() + 1)
const sheet = ref<WorkerTimesheetMonth | null>(null)
const isLoading = ref(false)
const loadError = ref('')

const monthLabel = computed(() => {
  const d = new Date(year.value, month.value - 1, 1)
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
})

function formatHours(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '')
}

function formatDayLabel(ymd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd)
  if (!m) return ymd
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function siteAddress(entry: WorkerTimesheetEntry): string | null {
  return entry.project_address || entry.task_address || null
}

function shiftMonth(delta: number): void {
  let y = year.value
  let m = month.value + delta
  while (m < 1) {
    m += 12
    y -= 1
  }
  while (m > 12) {
    m -= 12
    y += 1
  }
  year.value = y
  month.value = m
  void router.replace({
    query: { ...route.query, year: String(y), month: String(m) },
  })
  void load()
}

function applyQuery(): void {
  const qy = Number(route.query.year)
  const qm = Number(route.query.month)
  if (Number.isFinite(qy) && qy >= 2000 && qy <= 2100) year.value = qy
  if (Number.isFinite(qm) && qm >= 1 && qm <= 12) month.value = qm
}

async function load(): Promise<void> {
  isLoading.value = true
  loadError.value = ''
  try {
    sheet.value = await fetchMyWorkTimesheet(year.value, month.value)
  } catch (e: unknown) {
    sheet.value = null
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    loadError.value = err.response?.data?.message || err.message || 'Could not load timesheet.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  applyQuery()
  void load()
})

watch(
  () => [route.query.year, route.query.month] as const,
  () => {
    const prevY = year.value
    const prevM = month.value
    applyQuery()
    if (year.value !== prevY || month.value !== prevM) {
      void load()
    }
  },
)
</script>

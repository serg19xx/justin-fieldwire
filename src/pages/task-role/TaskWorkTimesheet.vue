<template>
  <div class="px-4 py-4 max-w-6xl mx-auto pb-8">
    <header class="mb-4">
      <h1 class="text-xl font-semibold text-gray-900">Timesheet</h1>
      <p class="mt-1">
        <PageUserGuideLink
          href="/CLIENT_SCHEDULE_AND_WORKER_TIMESHEET_GUIDE.html"
          label="Testing guide"
        />
      </p>
      <p class="text-sm text-gray-500 mt-1">
        Your week from the schedule published by your project manager. Start and end your day with a
        photo on site. Paid hours are the time between Start day and End day minus a 30 min unpaid
        break.
      </p>
    </header>

    <TaskDayClockCard class="mb-4 max-w-lg" @updated="onDayClockUpdated" />

    <div class="mb-3 flex items-center justify-between gap-2">
      <button
        type="button"
        class="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40"
        :disabled="isLoading"
        @click="shiftWeek(-1)"
      >
        ← Prev week
      </button>
      <div class="text-center">
        <p class="text-sm font-semibold text-gray-900 tabular-nums">Week of {{ weekLabel }}</p>
        <button
          v-if="!isCurrentWeek"
          type="button"
          class="text-xs font-medium text-orange-700 hover:underline"
          @click="goToThisWeek"
        >
          This week
        </button>
      </div>
      <button
        type="button"
        class="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40"
        :disabled="isLoading"
        @click="shiftWeek(1)"
      >
        Next week →
      </button>
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

    <template v-else-if="week">
      <div class="overflow-x-auto -mx-4 px-4 pb-2">
        <ol class="grid grid-cols-7 gap-2 min-w-[56rem]">
          <li
            v-for="day in week.days"
            :key="day.work_date"
            class="flex flex-col rounded-xl border bg-white shadow-sm overflow-hidden"
            :class="day.work_date === week.today ? 'border-orange-400 ring-1 ring-orange-300' : 'border-gray-200'"
          >
            <div
              class="px-2 py-2 border-b text-center"
              :class="day.work_date === week.today ? 'bg-orange-50 border-orange-100' : 'bg-gray-50 border-gray-100'"
            >
              <p class="text-xs font-semibold uppercase tracking-wide text-gray-700">
                {{ weekdayLabel(day.work_date) }}
              </p>
              <p class="text-[11px] text-gray-500 tabular-nums">{{ dateLabel(day.work_date) }}</p>
            </div>

            <div class="flex-1 px-2 py-2 space-y-2">
              <p v-if="day.slots.length === 0" class="text-[11px] text-gray-400 text-center py-2">
                Not scheduled
              </p>
              <div
                v-for="slot in day.slots"
                :key="slot.entry_id"
                class="rounded-lg border border-gray-100 bg-gray-50/60 px-2 py-1.5"
              >
                <p class="text-xs font-medium text-gray-900 leading-snug break-words">
                  {{ slot.project_name || `Project #${slot.project_id}` }}
                </p>
                <p v-if="slot.project_address" class="text-[10px] text-gray-500 leading-snug break-words mt-0.5">
                  {{ slot.project_address }}
                </p>
                <p v-if="slot.day_part !== 'full'" class="text-[10px] text-gray-500 mt-0.5">
                  {{ slot.day_part === 'am' ? 'Morning' : 'Afternoon' }}
                </p>
                <p
                  v-if="slot.expected_start_time || slot.expected_end_time"
                  class="text-[11px] text-gray-700 tabular-nums mt-1"
                >
                  {{ slot.expected_start_time || '—' }} – {{ slot.expected_end_time || '—' }}
                </p>
                <p v-if="slot.distance_km" class="text-[10px] text-gray-500 mt-0.5">
                  {{ slot.distance_km }} km
                </p>
              </div>
            </div>

            <div class="border-t border-gray-100 px-2 py-2 text-[11px] tabular-nums space-y-0.5">
              <p class="flex justify-between gap-1 text-gray-600">
                <span>Scheduled</span>
                <span class="font-medium text-gray-900">{{ hoursOrDash(day.scheduled_hours) }}</span>
              </p>
              <p class="flex justify-between gap-1 text-gray-600">
                <span>Worked</span>
                <span class="font-medium text-gray-900">{{ hoursOrDash(day.worked_hours) }}</span>
              </p>
              <p v-if="day.day_work?.work_start_at" class="text-[10px] text-blue-900">
                {{ formatTime(day.day_work.work_start_at) }} –
                <template v-if="day.day_work.work_end_at">{{ formatTime(day.day_work.work_end_at) }}</template>
                <span v-else class="text-amber-700">no End day</span>
              </p>
              <p v-if="day.km > 0" class="flex justify-between gap-1 text-gray-600">
                <span>KM</span>
                <span class="font-medium text-gray-900">{{ formatNumber(day.km) }}</span>
              </p>
            </div>
          </li>
        </ol>
      </div>

      <dl class="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div class="rounded-xl border border-orange-100 bg-orange-50 px-3 py-2.5 flex items-baseline justify-between gap-3">
          <dt class="text-xs font-medium text-orange-800 uppercase tracking-wide">Total Hours Scheduled</dt>
          <dd class="text-lg font-semibold text-orange-900 tabular-nums">
            {{ formatNumber(week.totals.scheduled_hours) }} h
          </dd>
        </div>
        <div class="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 flex items-baseline justify-between gap-3">
          <dt class="text-xs font-medium text-emerald-800 uppercase tracking-wide">Total Hours Worked</dt>
          <dd class="text-lg font-semibold text-emerald-900 tabular-nums">
            {{ formatNumber(week.totals.worked_hours) }} h
          </dd>
        </div>
        <div class="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 flex items-baseline justify-between gap-3">
          <dt class="text-xs font-medium text-blue-800 uppercase tracking-wide">Total KM</dt>
          <dd class="text-lg font-semibold text-blue-900 tabular-nums">
            {{ formatNumber(week.totals.km) }} km
          </dd>
        </div>
      </dl>
      <p class="mt-2 text-[11px] text-gray-500">
        Scheduled hours use the expected start and finish from the schedule minus the
        {{ formatNumber(week.break_hours * 60) }} min break. KM is entered by your project manager.
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageUserGuideLink from '@/components/PageUserGuideLink.vue'
import TaskDayClockCard from '@/components/task-role/TaskDayClockCard.vue'
import { fetchMyWorkWeek, type WorkWeek } from '@/core/utils/work-timesheet-api'
import { parseWorkYmd, todayWorkYmd } from '@/core/utils/work-day'

const route = useRoute()
const router = useRouter()

const weekStart = ref(mondayOf(parseWorkYmd(route.query.week) ?? todayWorkYmd()))
const week = ref<WorkWeek | null>(null)
const isLoading = ref(false)
const loadError = ref('')

const isCurrentWeek = computed(() => weekStart.value === mondayOf(todayWorkYmd()))

const weekLabel = computed(() => {
  const start = ymdToDate(weekStart.value)
  const end = ymdToDate(addDays(weekStart.value, 6))
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, {
    ...opts,
    year: 'numeric',
  })}`
})

function ymdToDate(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function dateToYmd(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

function addDays(ymd: string, days: number): string {
  const d = ymdToDate(ymd)
  d.setDate(d.getDate() + days)
  return dateToYmd(d)
}

function mondayOf(ymd: string): string {
  const dow = ymdToDate(ymd).getDay()
  return addDays(ymd, dow === 0 ? -6 : 1 - dow)
}

function weekdayLabel(ymd: string): string {
  return ymdToDate(ymd).toLocaleDateString(undefined, { weekday: 'long' })
}

function dateLabel(ymd: string): string {
  return ymdToDate(ymd).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '')
}

function hoursOrDash(n: number): string {
  return n > 0 ? `${formatNumber(n)} h` : '—'
}

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

function setWeek(monday: string): void {
  weekStart.value = monday
  void router.replace({ query: { ...route.query, week: monday } })
  void load()
}

function shiftWeek(delta: number): void {
  setWeek(addDays(weekStart.value, delta * 7))
}

function goToThisWeek(): void {
  setWeek(mondayOf(todayWorkYmd()))
}

async function load(): Promise<void> {
  isLoading.value = true
  loadError.value = ''
  try {
    week.value = await fetchMyWorkWeek(weekStart.value)
  } catch (e: unknown) {
    week.value = null
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    loadError.value = err.response?.data?.message || err.message || 'Could not load timesheet.'
  } finally {
    isLoading.value = false
  }
}

function onDayClockUpdated(): void {
  if (isCurrentWeek.value) void load()
}

onMounted(() => {
  void load()
})

watch(
  () => route.query.week,
  (q) => {
    const parsed = parseWorkYmd(q)
    if (parsed && mondayOf(parsed) !== weekStart.value) {
      weekStart.value = mondayOf(parsed)
      void load()
    }
  },
)
</script>

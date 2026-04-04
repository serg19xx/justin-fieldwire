<template>
  <div class="px-4 py-4 max-w-lg mx-auto pb-8">
    <header class="mb-3">
      <h1 class="text-xl font-semibold text-gray-900">Schedule</h1>
      <p class="text-sm text-gray-500 mt-0.5">
        Your published assignments by day (morning / afternoon / full day). Plan is set by the project manager.
      </p>
    </header>

    <div class="flex flex-col gap-2 mb-3">
      <!-- Prev/Next: hidden only on real phones (narrow + coarse pointer). Narrow desktop / responsive mode keeps mouse → buttons stay. -->
      <div class="flex items-center justify-between gap-2 max-md:[@media(pointer:coarse)]:hidden">
        <button
          type="button"
          class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm disabled:opacity-45 disabled:cursor-not-allowed shrink-0"
          :disabled="isLoading"
          @click="goPrevWeek"
        >
          ← Prev
        </button>
        <span class="text-sm font-medium text-gray-900 text-center truncate min-w-0">{{ weekLabel }}</span>
        <button
          type="button"
          class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm disabled:opacity-45 disabled:cursor-not-allowed shrink-0"
          :disabled="isLoading"
          @click="goNextWeek"
        >
          Next →
        </button>
      </div>
      <p
        class="hidden max-md:[@media(pointer:coarse)]:block text-sm font-medium text-gray-900 text-center md:hidden"
      >
        {{ weekLabel }}
      </p>
      <button
        type="button"
        class="w-full py-2.5 text-sm font-semibold text-orange-800 bg-orange-50 border border-orange-200 rounded-lg shadow-sm active:bg-orange-100 disabled:opacity-45 disabled:cursor-not-allowed"
        :disabled="isLoading"
        @click="goToday"
      >
        Today
      </button>
    </div>

    <div
      v-if="loadError"
      class="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
    >
      {{ loadError }}
      <span class="block text-xs mt-1 text-amber-800">If the backend is not ready, this is expected until the API exists.</span>
    </div>

    <p class="text-xs text-gray-500 mb-2">
      <span class="hidden max-md:[@media(pointer:coarse)]:inline md:hidden">
        Swipe horizontally. The orange column is this calendar week (anchor). Tap Today to jump back here.
      </span>
      <span class="hidden max-md:[@media(pointer:fine)]:inline md:inline">
        Prev / Next jump the anchor week (with empty-week skip). Swipe works too. Tap Today for the current
        calendar week.
      </span>
    </p>

    <div v-if="isLoading" class="flex justify-center py-12">
      <div class="animate-spin w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full" />
    </div>

    <div
      v-else
      class="flex gap-2.5 overflow-x-auto snap-x snap-mandatory pb-2 pt-1 -mx-4 px-4 scroll-smooth touch-pan-x"
    >
      <div
        v-for="week in stripWeeks"
        :id="stripWeekElementId(week.offset)"
        :key="week.offset"
        class="flex-none w-[min(76vw,17.5rem)] min-w-[12.5rem] snap-center shrink-0 rounded-xl border bg-white p-3 shadow-sm"
        :class="
          week.isAnchorWeek
            ? 'border-orange-400 ring-2 ring-orange-100'
            : 'border-gray-200'
        "
      >
        <h3 class="text-xs font-semibold text-gray-900 mb-2.5 text-center leading-tight">
          {{ week.rangeLabel }}
        </h3>
        <div class="flex flex-col gap-2 min-h-0">
          <div v-for="day in week.days" :key="day.ymd" class="flex flex-col gap-2 min-h-0">
            <template v-if="day.slots.length > 0">
              <div
                v-for="(slot, sIdx) in day.slots"
                :key="`${day.ymd}-${slot.day_part}-${sIdx}`"
                role="button"
                tabindex="0"
                class="rounded-lg border px-2.5 py-2 border-orange-100 bg-orange-50/50 text-left w-full cursor-pointer transition-colors hover:border-orange-200 hover:bg-orange-50 active:bg-orange-100/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-1"
                :aria-label="`Open details: ${slot.taskName}`"
                @click="openSlotDetail(slot)"
                @keydown.enter.prevent="openSlotDetail(slot)"
                @keydown.space.prevent="openSlotDetail(slot)"
              >
                <div class="flex items-baseline justify-between gap-2">
                  <span class="text-[11px] font-semibold text-gray-500 uppercase tracking-wide min-w-0">
                    {{ day.shortLabel }}
                  </span>
                  <span class="text-xs font-semibold text-gray-900 shrink-0 text-right">
                    {{ dayPartLabel(slot.day_part) }}
                  </span>
                </div>
                <p class="text-xs font-medium text-gray-800 mt-1.5 line-clamp-2 leading-snug">
                  {{ slot.taskName }}
                </p>
                <p class="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                  {{ slot.projectName || '—' }}
                </p>
                <p class="text-xs text-gray-600 mt-0.5 line-clamp-2 leading-snug">
                  {{ slot.projectAddress || '—' }}
                </p>
                <p class="text-[11px] text-gray-400 truncate mt-0.5">
                  {{ slot.projectDebugLabel }}
                </p>
                <p class="text-[10px] text-orange-700/80 mt-1 font-medium">Tap for details →</p>
              </div>
            </template>
            <div v-else class="rounded-md border px-2.5 py-2 border-gray-100 bg-gray-50/80">
              <div class="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                {{ day.shortLabel }}
              </div>
              <p class="text-xs text-gray-400 mt-0.5">—</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  fetchMySchedule,
  type MyScheduleEntry,
  type ScheduleDayPart,
} from '@/core/utils/schedule-weeks-api'
import { addDays, startOfWeekMonday, toYmd } from '@/core/utils/week-utils'

interface DisplaySlot {
  day_part: ScheduleDayPart
  workYmd: string
  projectId: number
  taskId: number
  taskName: string
  projectName: string
  projectAddress: string
  projectDebugLabel: string
}

const router = useRouter()

const weekOffset = ref(0)
const isLoading = ref(false)
const loadError = ref('')
const stripEntries = ref<MyScheduleEntry[]>([])

const STRIP_WEEKS_BEFORE = 3
const STRIP_WEEKS_AFTER = 4

const MAX_EMPTY_WEEK_SKIP = 8

let loadGeneration = 0

const weekStart = computed(() => {
  const base = new Date()
  const monday = startOfWeekMonday(base)
  monday.setDate(monday.getDate() + weekOffset.value * 7)
  return monday
})

const weekEnd = computed(() => addDays(weekStart.value, 6))

const weekLabel = computed(() => {
  const a = weekStart.value.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const b = weekEnd.value.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  return `${a} – ${b}`
})

function formatWeekRangeLabel(monday: Date): string {
  const end = addDays(monday, 6)
  const a = monday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const b = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  return `${a} – ${b}`
}

function stripWeekElementId(offset: number): string {
  return `strip-week-${offset}`
}

function mondayDateForWeekOffset(offset: number): Date {
  const base = new Date()
  const monday = startOfWeekMonday(base)
  monday.setDate(monday.getDate() + offset * 7)
  return monday
}

function ymdBoundsForWeekOffset(offset: number): { start: string; end: string } {
  const monday = mondayDateForWeekOffset(offset)
  return { start: toYmd(monday), end: toYmd(addDays(monday, 6)) }
}

function entryWorkYmd(e: MyScheduleEntry): string {
  const w = e.work_date
  return typeof w === 'string' && w.length >= 10 ? w.slice(0, 10) : String(w)
}

function slotsForDayFromRows(rows: MyScheduleEntry[], ymd: string): DisplaySlot[] {
  const r = rows.filter((e) => entryWorkYmd(e) === ymd)
  const order: ScheduleDayPart[] = ['am', 'pm', 'full']
  r.sort((a, b) => order.indexOf(a.day_part) - order.indexOf(b.day_part))
  return r.map((e) => ({
    day_part: e.day_part,
    workYmd: entryWorkYmd(e),
    projectId: e.project_id,
    taskId: e.task_id,
    taskName: (e.task?.name ?? `Task #${e.task_id}`).trim(),
    projectName: (e.project_name ?? '').trim(),
    projectAddress: (e.task?.address ?? '').trim(),
    projectDebugLabel: e.project_id != null ? `Project #${e.project_id}` : '—',
  }))
}

function filterEntriesForWeekOffset(rows: MyScheduleEntry[], offset: number): MyScheduleEntry[] {
  const { start, end } = ymdBoundsForWeekOffset(offset)
  return rows.filter((e) => {
    const y = entryWorkYmd(e)
    return y >= start && y <= end
  })
}

async function fetchEntriesForWeekOffset(offset: number): Promise<MyScheduleEntry[]> {
  const monday = mondayDateForWeekOffset(offset)
  const from = toYmd(monday)
  const to = toYmd(addDays(monday, 6))
  return fetchMySchedule(from, to)
}

function wideYmdRangeForSkipProbe(anchorOffset: number, direction: 1 | -1): { from: string; to: string } {
  const firstOff = anchorOffset + direction
  const lastOff = anchorOffset + direction * MAX_EMPTY_WEEK_SKIP
  const lo = Math.min(firstOff, lastOff)
  const hi = Math.max(firstOff, lastOff)
  const monLo = mondayDateForWeekOffset(lo)
  const monHi = mondayDateForWeekOffset(hi)
  return {
    from: toYmd(monLo),
    to: toYmd(addDays(monHi, 6)),
  }
}

async function resolveWeekOffsetWithSkip(
  gen: number,
  anchorOffset: number,
  direction: 1 | -1,
): Promise<number> {
  const anchorRows = await fetchEntriesForWeekOffset(anchorOffset)
  if (gen !== loadGeneration) return anchorOffset
  if (anchorRows.length > 0) {
    return anchorOffset
  }

  const { from, to } = wideYmdRangeForSkipProbe(anchorOffset, direction)
  const wideRows = await fetchMySchedule(from, to)
  if (gen !== loadGeneration) return anchorOffset

  for (let step = 1; step <= MAX_EMPTY_WEEK_SKIP; step++) {
    const o = anchorOffset + direction * step
    const rows = filterEntriesForWeekOffset(wideRows, o)
    if (rows.length > 0) {
      return o
    }
  }

  return anchorOffset
}

const stripWeeks = computed(() => {
  const lo = weekOffset.value - STRIP_WEEKS_BEFORE
  const hi = weekOffset.value + STRIP_WEEKS_AFTER
  const anchor = weekOffset.value
  const rows: Array<{
    offset: number
    rangeLabel: string
    isAnchorWeek: boolean
    days: Array<{ ymd: string; shortLabel: string; slots: DisplaySlot[] }>
  }> = []
  for (let o = lo; o <= hi; o++) {
    const monday = mondayDateForWeekOffset(o)
    const rangeLabel = formatWeekRangeLabel(monday)
    const days = []
    for (let i = 0; i < 7; i++) {
      const d = addDays(monday, i)
      const ymd = toYmd(d)
      days.push({
        ymd,
        shortLabel: d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
        slots: slotsForDayFromRows(stripEntries.value, ymd),
      })
    }
    rows.push({ offset: o, rangeLabel, isAnchorWeek: o === anchor, days })
  }
  return rows
})

function dayPartLabel(part: ScheduleDayPart): string {
  if (part === 'am') return 'Morning'
  if (part === 'pm') return 'Afternoon'
  return 'All day'
}

function openSlotDetail(slot: DisplaySlot): void {
  const pid = slot.projectId
  const tid = slot.taskId
  if (!pid || !tid) return
  void router.push({
    path: `/tasks/project/${pid}/task/${tid}`,
    query: {
      from: 'schedule',
      workDate: slot.workYmd,
      dayPart: slot.day_part,
    },
  })
}

async function refreshStripData(gen: number): Promise<void> {
  const lo = weekOffset.value - STRIP_WEEKS_BEFORE
  const hi = weekOffset.value + STRIP_WEEKS_AFTER
  const from = toYmd(mondayDateForWeekOffset(lo))
  const to = toYmd(addDays(mondayDateForWeekOffset(hi), 6))
  stripEntries.value = await fetchMySchedule(from, to)
  if (gen !== loadGeneration) return
}

/**
 * Strip columns are not mounted while `isLoading` is true (spinner replaces the strip).
 * Scroll only after loading ends and the scroll container exists in the DOM.
 */
async function scrollAnchorColumnIntoView(gen: number): Promise<void> {
  if (gen !== loadGeneration) return
  await nextTick()
  if (gen !== loadGeneration) return
  document.getElementById(stripWeekElementId(weekOffset.value))?.scrollIntoView({
    inline: 'center',
    block: 'nearest',
    behavior: 'smooth',
  })
}

async function fetchStrip(): Promise<void> {
  const gen = ++loadGeneration
  loadError.value = ''
  isLoading.value = true
  try {
    await refreshStripData(gen)
  } catch (e: unknown) {
    if (gen !== loadGeneration) return
    stripEntries.value = []
    const err = e as { response?: { status?: number; data?: { message?: string } } }
    const msg = err.response?.data?.message
    loadError.value =
      msg ||
      (err.response?.status === 404
        ? 'Schedule API not found.'
        : 'Could not load schedule. Check connection or API availability.')
  } finally {
    if (gen === loadGeneration) {
      isLoading.value = false
    }
  }
  await scrollAnchorColumnIntoView(gen)
}

async function navigateWeek(direction: 1 | -1): Promise<void> {
  const gen = ++loadGeneration
  loadError.value = ''
  isLoading.value = true
  try {
    const anchor = weekOffset.value + direction
    const offset = await resolveWeekOffsetWithSkip(gen, anchor, direction)
    if (gen !== loadGeneration) return
    weekOffset.value = offset
    await refreshStripData(gen)
  } catch (e: unknown) {
    if (gen !== loadGeneration) return
    stripEntries.value = []
    const err = e as { response?: { status?: number; data?: { message?: string } } }
    const msg = err.response?.data?.message
    loadError.value =
      msg ||
      (err.response?.status === 404
        ? 'Schedule API not found.'
        : 'Could not load schedule. Check connection or API availability.')
  } finally {
    if (gen === loadGeneration) {
      isLoading.value = false
    }
  }
  await scrollAnchorColumnIntoView(gen)
}

function goPrevWeek(): void {
  void navigateWeek(-1)
}

function goNextWeek(): void {
  void navigateWeek(1)
}

function goToday(): void {
  weekOffset.value = 0
  void fetchStrip()
}

onMounted(() => {
  void fetchStrip()
})
</script>

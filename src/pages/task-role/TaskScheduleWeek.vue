<template>
  <div class="px-4 py-4 max-w-3xl mx-auto pb-8">
    <header class="mb-4">
      <h1 class="text-xl font-semibold text-gray-900">Schedule</h1>
      <p class="text-sm text-gray-500 mt-0.5">
        Tap a row to open the task screen for that day — instructions, files, and notes are all there.
      </p>
    </header>

    <div
      v-if="loadError"
      class="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
    >
      {{ loadError }}
    </div>

    <div v-if="isLoading" class="flex justify-center py-12">
      <div class="animate-spin w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full" />
    </div>

    <div v-else-if="sortedSlots.length === 0" class="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
      No published assignments found.
    </div>

    <ul v-else class="space-y-2">
      <li v-for="row in scheduleListRows" :key="row.slot.entryKey">
        <RouterLink
          class="flex w-full items-stretch rounded-xl border border-gray-200 bg-white text-left shadow-sm transition hover:border-orange-300 hover:bg-orange-50/30 active:bg-orange-50/50"
          :to="{
            path: `/tasks/schedule/task/${row.slot.projectId}/${row.slot.taskId}`,
            query: { workDate: row.slot.workYmd, dayPart: row.slot.dayPart },
          }"
        >
          <div class="min-w-0 flex-1 p-3">
            <p class="text-sm font-semibold text-gray-900 truncate">{{ row.slot.taskName }}</p>
            <p class="text-xs text-gray-600 mt-0.5">
              {{ row.slot.fullDateLabel }} · {{ dayPartLabel(row.slot.dayPart) }}
            </p>
            <p class="text-xs text-gray-500 truncate mt-0.5">{{ row.slot.projectName || `Project #${row.slot.projectId}` }}</p>
            <p v-if="row.slot.taskAddress" class="text-xs text-gray-600 truncate mt-0.5">{{ row.slot.taskAddress }}</p>
            <p v-if="row.slot.assignmentNote" class="mt-2 text-xs text-gray-700 line-clamp-2">
              {{ row.slot.assignmentNote }}
            </p>
          </div>
          <div class="flex shrink-0 flex-col items-end justify-between border-l border-gray-100 px-2 py-2">
            <span
              class="rounded-full px-2 py-0.5 text-[11px] font-medium"
              :class="row.chipClass"
            >
              {{ row.chipLabel }}
            </span>
            <span class="text-gray-300 text-lg leading-none pr-0.5" aria-hidden="true">›</span>
          </div>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { fetchMySchedule, type MyScheduleEntry, type ScheduleDayPart } from '@/core/utils/schedule-weeks-api'
import { addDays, toYmd } from '@/core/utils/week-utils'

interface DisplaySlot {
  entryKey: string
  scheduleEntryId: number
  projectId: number
  taskId: number
  workYmd: string
  dayPart: ScheduleDayPart
  taskName: string
  projectName: string
  assignmentNote: string
  fullDateLabel: string
  taskAddress: string
}

interface ScheduleListRow {
  slot: DisplaySlot
  chipLabel: string
  chipClass: string
}

const isLoading = ref(false)
const loadError = ref('')
const allEntries = ref<MyScheduleEntry[]>([])
const rangeDaysPast = 180
const rangeDaysFuture = 365
const maxScheduleApiRangeDays = 60

/** Bumps when the tab becomes visible again so list chips re-read TaskDayWorkPanel localStorage. */
const listEpoch = ref(0)

const rangeStart = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() - rangeDaysPast)
  return d
})

const rangeEnd = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + rangeDaysFuture)
  return d
})

const sortedSlots = computed((): DisplaySlot[] => {
  const partRank: Record<ScheduleDayPart, number> = { am: 1, pm: 2, full: 3 }
  return [...allEntries.value]
    .sort((a, b) => {
      const da = String(a.work_date || '').slice(0, 10)
      const db = String(b.work_date || '').slice(0, 10)
      if (da !== db) return da.localeCompare(db)
      return partRank[a.day_part] - partRank[b.day_part]
    })
    .map((e) => {
      const ymd = String(e.work_date || '').slice(0, 10)
      const dt = /^\d{4}-\d{2}-\d{2}$/.test(ymd)
        ? new Date(`${ymd}T12:00:00`).toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : ymd
      return {
        entryKey: `${e.project_id}_${e.task_id}_${ymd}_${e.day_part}`,
        scheduleEntryId: e.scheduleRowIdForMessages > 0 ? e.scheduleRowIdForMessages : 0,
        projectId: e.project_id,
        taskId: e.task_id,
        workYmd: ymd,
        dayPart: e.day_part,
        taskName: (e.task?.name ?? `Task #${e.task_id}`).trim(),
        projectName: (e.project_name ?? '').trim(),
        assignmentNote: (typeof e.assignment_note === 'string' ? e.assignment_note : '').trim(),
        fullDateLabel: dt,
        taskAddress: (e.task?.address ?? '').trim(),
      }
    })
})

function dayWorkStatusStorageKey(slot: DisplaySlot): string {
  return `fw_task_day_status_${slot.projectId}_${slot.taskId}_${slot.workYmd}_${slot.dayPart}`
}

function dayWorkStatusLabel(slot: DisplaySlot): string {
  try {
    const raw = localStorage.getItem(dayWorkStatusStorageKey(slot))
    if (raw === 'in_progress') return 'In progress'
    if (raw === 'completed') return 'Completed'
    if (raw === 'blocked') return 'Blocked'
    if (raw === 'absent') return 'N/A'
    return 'Not started'
  } catch {
    return 'Not started'
  }
}

function dayWorkStatusChipClass(slot: DisplaySlot): string {
  try {
    const raw = localStorage.getItem(dayWorkStatusStorageKey(slot))
    if (raw === 'in_progress') return 'bg-blue-50 text-blue-700'
    if (raw === 'completed') return 'bg-emerald-50 text-emerald-700'
    if (raw === 'blocked') return 'bg-amber-50 text-amber-800'
    if (raw === 'absent') return 'bg-gray-100 text-gray-600'
    return 'bg-gray-100 text-gray-700'
  } catch {
    return 'bg-gray-100 text-gray-700'
  }
}

const scheduleListRows = computed((): ScheduleListRow[] => {
  void listEpoch.value
  return sortedSlots.value.map((slot) => ({
    slot,
    chipLabel: dayWorkStatusLabel(slot),
    chipClass: dayWorkStatusChipClass(slot),
  }))
})

function dayPartLabel(part: ScheduleDayPart): string {
  if (part === 'am') return 'Morning'
  if (part === 'pm') return 'Afternoon'
  return 'All day'
}

function buildScheduleRequestRanges(fromDate: Date, toDate: Date): Array<{ from: string; to: string }> {
  const ranges: Array<{ from: string; to: string }> = []
  const cursor = new Date(fromDate)
  while (cursor <= toDate) {
    const chunkEnd = addDays(cursor, maxScheduleApiRangeDays - 1)
    const boundedEnd = chunkEnd <= toDate ? chunkEnd : toDate
    ranges.push({ from: toYmd(cursor), to: toYmd(boundedEnd) })
    cursor.setDate(cursor.getDate() + maxScheduleApiRangeDays)
  }
  return ranges
}

async function fetchScheduleChunked(fromDate: Date, toDate: Date): Promise<MyScheduleEntry[]> {
  const ranges = buildScheduleRequestRanges(fromDate, toDate)
  const all: MyScheduleEntry[] = []
  for (const r of ranges) {
    const rows = await fetchMySchedule(r.from, r.to)
    all.push(...rows)
  }
  const seen = new Set<string>()
  const unique: MyScheduleEntry[] = []
  for (const row of all) {
    const key = `${row.id}_${row.project_id}_${row.task_id}_${String(row.work_date).slice(0, 10)}_${row.day_part}`
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(row)
  }
  return unique
}

async function fetchScheduleRange(): Promise<void> {
  isLoading.value = true
  loadError.value = ''
  try {
    const rows = await fetchScheduleChunked(rangeStart.value, rangeEnd.value)
    allEntries.value = rows
    listEpoch.value++
  } catch (e: unknown) {
    allEntries.value = []
    const err = e as { response?: { data?: { message?: string } } }
    loadError.value = err.response?.data?.message || 'Could not load schedule.'
  } finally {
    isLoading.value = false
  }
}

function onVisibilityChange(): void {
  if (document.visibilityState === 'visible') {
    listEpoch.value++
  }
}

onMounted(() => {
  void fetchScheduleRange()
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
</script>

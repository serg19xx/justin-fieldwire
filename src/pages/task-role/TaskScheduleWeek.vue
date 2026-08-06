<template>
  <div class="px-4 py-4 max-w-3xl mx-auto pb-8">
    <header class="mb-4">
      <h1 class="text-xl font-semibold text-gray-900">Schedule</h1>
      <p class="text-sm text-gray-500 mt-0.5">
        Where you are scheduled for a full working day. Use Start / End to drop a phone location pin.
      </p>
    </header>

    <div
      v-if="loadError"
      class="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
    >
      {{ loadError }}
    </div>
    <div
      v-if="actionError"
      class="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
    >
      {{ actionError }}
    </div>

    <div v-if="isLoading" class="flex justify-center py-12">
      <div class="animate-spin w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full" />
    </div>

    <div v-else-if="sortedSlots.length === 0" class="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
      No published assignments found.
    </div>

    <ul v-else class="space-y-2">
      <li
        v-for="row in scheduleListRows"
        :key="row.slot.entryKey"
        class="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
      >
        <RouterLink
          class="flex w-full items-stretch text-left transition hover:bg-orange-50/30 active:bg-orange-50/50"
          :to="slotLink(row.slot)"
        >
          <div class="min-w-0 flex-1 p-3">
            <p class="text-sm font-semibold text-gray-900 truncate">
              {{ row.slot.projectName || `Project #${row.slot.projectId}` }}
            </p>
            <p class="text-xs text-gray-600 mt-0.5">
              {{ row.slot.fullDateLabel }} · {{ dayPartLabel(row.slot.dayPart) }}
            </p>
            <p v-if="row.slot.siteAddress" class="text-xs text-gray-600 truncate mt-0.5">
              {{ row.slot.siteAddress }}
            </p>
            <p v-if="row.slot.assignmentNote" class="mt-2 text-xs text-gray-700 line-clamp-2">
              {{ row.slot.assignmentNote }}
            </p>
            <p v-if="row.slot.distanceKm" class="mt-1 text-xs text-gray-600">
              Distance: {{ row.slot.distanceKm }} km
            </p>
            <p class="mt-1 text-[11px] text-gray-500">
              Start: {{ formatCheckIn(row.slot.workStartAt, row.slot.workStartDistanceKm) }}
              · End: {{ formatCheckIn(row.slot.workEndAt, row.slot.workEndDistanceKm) }}
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
        <div
          v-if="row.slot.scheduleEntryId > 0"
          class="flex flex-wrap gap-2 border-t border-gray-100 px-3 py-2 bg-gray-50/80"
        >
          <button
            type="button"
            class="px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-45"
            :disabled="
              checkInBusyId === row.slot.scheduleEntryId ||
              !!row.slot.workStartAt ||
              isPastDay(row.slot.workYmd)
            "
            @click="onCheckIn(row.slot, 'start')"
          >
            Start work
          </button>
          <button
            type="button"
            class="px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-45"
            :disabled="
              checkInBusyId === row.slot.scheduleEntryId ||
              !row.slot.workStartAt ||
              !!row.slot.workEndAt ||
              isPastDay(row.slot.workYmd)
            "
            @click="onCheckIn(row.slot, 'end')"
          >
            End work
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  checkInMyScheduleEntry,
  fetchMySchedule,
  type MyScheduleEntry,
  type ScheduleDayPart,
} from '@/core/utils/schedule-weeks-api'
import { addDays, toYmd } from '@/core/utils/week-utils'

interface DisplaySlot {
  entryKey: string
  scheduleEntryId: number
  projectId: number
  taskId: number
  workYmd: string
  dayPart: ScheduleDayPart
  projectName: string
  siteAddress: string
  assignmentNote: string
  distanceKm: string
  workStartAt: string | null
  workEndAt: string | null
  workStartDistanceKm: number | null
  workEndDistanceKm: number | null
  fullDateLabel: string
}

interface ScheduleListRow {
  slot: DisplaySlot
  chipLabel: string
  chipClass: string
}

const isLoading = ref(false)
const loadError = ref('')
const actionError = ref('')
const allEntries = ref<MyScheduleEntry[]>([])
const checkInBusyId = ref(0)
const rangeDaysPast = 180
const rangeDaysFuture = 365
const maxScheduleApiRangeDays = 60

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

const todayYmd = computed(() => toYmd(new Date()))

function isPastDay(ymd: string): boolean {
  return ymd < todayYmd.value
}

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
        entryKey: `${e.project_id}_${e.task_id ?? 0}_${ymd}_${e.day_part}_${e.id}`,
        scheduleEntryId: e.scheduleRowIdForMessages > 0 ? e.scheduleRowIdForMessages : 0,
        projectId: e.project_id,
        taskId: e.task_id != null && e.task_id > 0 ? e.task_id : 0,
        workYmd: ymd,
        dayPart: e.day_part,
        projectName: (e.project_name ?? '').trim(),
        siteAddress: (e.project_address ?? e.task?.address ?? '').trim(),
        assignmentNote: (typeof e.assignment_note === 'string' ? e.assignment_note : '').trim(),
        distanceKm: (typeof e.distance_km === 'string' ? e.distance_km : '').trim(),
        workStartAt: e.work_start_at ?? null,
        workEndAt: e.work_end_at ?? null,
        workStartDistanceKm: e.work_start_distance_km ?? null,
        workEndDistanceKm: e.work_end_distance_km ?? null,
        fullDateLabel: dt,
      }
    })
})

function attendanceChip(slot: DisplaySlot): { label: string; className: string } {
  if (slot.workEndAt) {
    return { label: 'Ended', className: 'bg-emerald-50 text-emerald-700' }
  }
  if (slot.workStartAt) {
    return { label: 'Started', className: 'bg-blue-50 text-blue-700' }
  }
  if (isPastDay(slot.workYmd)) {
    return { label: 'No check-in', className: 'bg-gray-100 text-gray-600' }
  }
  return { label: 'Not started', className: 'bg-gray-100 text-gray-700' }
}

const scheduleListRows = computed((): ScheduleListRow[] =>
  sortedSlots.value.map((slot) => {
    const chip = attendanceChip(slot)
    return { slot, chipLabel: chip.label, chipClass: chip.className }
  }),
)

function dayPartLabel(part: ScheduleDayPart): string {
  if (part === 'am') return 'Morning'
  if (part === 'pm') return 'Afternoon'
  return 'Full day'
}

function formatCheckIn(at: string | null, distanceKm: number | null): string {
  if (!at) return '—'
  const d = new Date(at)
  const time = Number.isNaN(d.getTime())
    ? at
    : d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  if (distanceKm != null && Number.isFinite(distanceKm)) {
    return `${time} (${distanceKm} km)`
  }
  return time
}

function slotLink(slot: DisplaySlot): { path: string; query?: Record<string, string> } {
  if (slot.taskId > 0) {
    return {
      path: `/tasks/schedule/task/${slot.projectId}/${slot.taskId}`,
      query: { workDate: slot.workYmd, dayPart: slot.dayPart },
    }
  }
  return { path: `/tasks/projects/${slot.projectId}` }
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
    const key = `${row.id}_${row.project_id}_${row.task_id ?? 0}_${String(row.work_date).slice(0, 10)}_${row.day_part}`
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
    allEntries.value = await fetchScheduleChunked(rangeStart.value, rangeEnd.value)
  } catch (e: unknown) {
    allEntries.value = []
    const err = e as { response?: { data?: { message?: string } } }
    loadError.value = err.response?.data?.message || 'Could not load schedule.'
  } finally {
    isLoading.value = false
  }
}

function readDevicePosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not available on this device.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      (err) => {
        reject(new Error(err.message || 'Could not read location. Allow location access and try again.'))
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    )
  })
}

async function onCheckIn(slot: DisplaySlot, phase: 'start' | 'end'): Promise<void> {
  if (slot.scheduleEntryId <= 0) {
    actionError.value = 'This assignment has no live schedule id yet. Ask a PM to re-publish the week.'
    return
  }
  actionError.value = ''
  checkInBusyId.value = slot.scheduleEntryId
  try {
    const { lat, lng } = await readDevicePosition()
    const updated = await checkInMyScheduleEntry(slot.scheduleEntryId, phase, lat, lng)
    if (updated) {
      const idx = allEntries.value.findIndex(
        (e) =>
          (e.scheduleRowIdForMessages > 0 ? e.scheduleRowIdForMessages : e.id) === slot.scheduleEntryId,
      )
      if (idx >= 0) {
        const prev = allEntries.value[idx]!
        allEntries.value[idx] = {
          ...prev,
          work_start_at: updated.work_start_at ?? prev.work_start_at,
          work_end_at: updated.work_end_at ?? prev.work_end_at,
          work_start_lat: updated.work_start_lat ?? prev.work_start_lat,
          work_start_lng: updated.work_start_lng ?? prev.work_start_lng,
          work_end_lat: updated.work_end_lat ?? prev.work_end_lat,
          work_end_lng: updated.work_end_lng ?? prev.work_end_lng,
          work_start_distance_km: updated.work_start_distance_km ?? prev.work_start_distance_km,
          work_end_distance_km: updated.work_end_distance_km ?? prev.work_end_distance_km,
        }
      } else {
        await fetchScheduleRange()
      }
    }
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    actionError.value =
      err.response?.data?.message || err.message || 'Check-in failed.'
  } finally {
    checkInBusyId.value = 0
  }
}

function onVisibilityChange(): void {
  if (document.visibilityState === 'visible') {
    void fetchScheduleRange()
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

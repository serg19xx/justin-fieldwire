<template>
  <section class="rounded-xl border border-blue-200 bg-blue-50/60 p-4 shadow-sm" aria-label="Work day">
    <div class="flex items-center justify-between gap-3">
      <div class="min-w-0">
        <p class="text-[11px] font-semibold uppercase tracking-wide text-blue-900/70">
          Today<template v-if="todayLabel"> · {{ todayLabel }}</template>
          <template v-if="shift"> · Shift {{ shift.start_time }}–{{ shift.end_time }}</template>
        </p>
        <p class="mt-0.5 text-sm font-semibold text-gray-900 tabular-nums">
          <template v-if="isLoading">Loading…</template>
          <template v-else-if="!dayWork?.work_start_at">Day not started</template>
          <template v-else-if="!dayWork.work_end_at">
            Working since {{ formatClock(dayWork.work_start_at) }}
          </template>
          <template v-else>
            {{ formatClock(dayWork.work_start_at) }} – {{ formatClock(dayWork.work_end_at) }}
            <span v-if="dayWork.hours != null" class="font-medium text-gray-600">
              · {{ formatHours(dayWork.hours) }} h
            </span>
            <span v-if="dayWork.break_hours > 0" class="block text-[11px] text-gray-400">
              {{ formatHours(dayWork.break_hours * 60) }} min unpaid break deducted
            </span>
          </template>
        </p>
        <p v-if="paidLabel" class="mt-0.5 text-[11px] text-blue-900/80 tabular-nums">{{ paidLabel }}</p>
      </div>

      <button
        v-if="!isLoading && !dayWork?.work_start_at"
        type="button"
        class="shrink-0 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        :disabled="isBusy"
        @click="openPhoto('start')"
      >
        Start day
      </button>
      <button
        v-else-if="!isLoading && !dayWork?.work_end_at"
        type="button"
        class="shrink-0 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        :disabled="isBusy"
        @click="openPhoto('end')"
      >
        End day
      </button>
      <span
        v-else-if="!isLoading"
        class="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800"
      >
        Day ended
      </span>
    </div>

    <div v-if="isDayOpen && pendingSites.length > 0" class="mt-3 space-y-2 border-t border-blue-100 pt-3">
      <p class="text-[11px] font-semibold uppercase tracking-wide text-blue-900/70">Other sites today</p>
      <div
        v-for="site in pendingSites"
        :key="site.project_id"
        class="flex items-center justify-between gap-3 rounded-lg bg-white/70 px-3 py-2"
      >
        <div class="min-w-0">
          <p class="truncate text-sm font-medium text-gray-900">{{ siteName(site) }}</p>
          <p class="text-[11px] text-gray-500 tabular-nums">
            <template v-if="site.arrived_at">Arrived {{ formatClock(site.arrived_at) }}</template>
            <template v-else-if="site.expected_start_time">From {{ site.expected_start_time }}</template>
          </p>
        </div>
        <button
          v-if="!site.arrived_at"
          type="button"
          class="shrink-0 rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-50 disabled:opacity-50"
          :disabled="isBusy"
          @click="onArrive(site)"
        >
          Arrived
        </button>
      </div>
    </div>

    <div v-if="canWorkLate" class="mt-3 border-t border-blue-100 pt-3">
      <p class="text-xs text-gray-700">
        <span class="font-semibold">Working late?</span>
        <template v-if="dayWork?.extended_open"> Reminders are paused until you tap End day.</template>
        <template v-else-if="dayWork?.extended_until">
          Reminders are paused until {{ dayWork.extended_until }}.
        </template>
        <template v-else> Pause the End day reminders while you finish.</template>
      </p>
      <div class="mt-2 flex flex-wrap gap-2">
        <button
          v-for="option in WORKING_LATE_OPTIONS"
          :key="option.mode"
          type="button"
          class="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
          :disabled="isBusy"
          @click="onWorkingLate(option.mode)"
        >
          {{ option.label }}
        </button>
        <button
          v-if="dayWork?.extended_open || dayWork?.extended_until"
          type="button"
          class="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:underline disabled:opacity-50"
          :disabled="isBusy"
          @click="onWorkingLate('cancel')"
        >
          Back to scheduled end
        </button>
      </div>
      <p class="mt-1 text-[11px] text-gray-500">Overtime is paid after your project manager approves it.</p>
    </div>

    <p v-if="errorMessage" class="mt-2 text-xs text-red-700">{{ errorMessage }}</p>

    <TaskDayPhotoDialog
      :phase="photoPhase"
      :is-busy="isBusy"
      :error-message="photoError"
      @confirm="punch"
      @cancel="photoPhase = null"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import TaskDayPhotoDialog from '@/components/task-role/TaskDayPhotoDialog.vue'
import { readDevicePosition } from '@/core/utils/device-geolocation'
import { fileToCompressedUploadFile, isAcceptedImageFile } from '@/core/utils/task-field-photos-storage'
import {
  arriveAtSite,
  checkInMyWorkDay,
  fetchMyWorkDay,
  setMyWorkingLate,
  type WorkDaySite,
  type WorkerDayWork,
  type WorkingLateMode,
} from '@/core/utils/work-timesheet-api'
import { formatWorkYmdLabel } from '@/core/utils/work-day'

const emit = defineEmits<{ updated: [dayWork: WorkerDayWork] }>()

const LOCATION_TIMEOUT_MS = 8000

const WORKING_LATE_OPTIONS: ReadonlyArray<{ mode: WorkingLateMode; label: string }> = [
  { mode: '1h', label: '+1 hour' },
  { mode: '2h', label: '+2 hours' },
  { mode: 'open', label: 'Until I finish' },
]

const today = ref('')
const dayWork = ref<WorkerDayWork | null>(null)
const shift = ref<{ start_time: string; end_time: string } | null>(null)
const sites = ref<WorkDaySite[]>([])
const isAttendanceAvailable = ref(false)
const isLoading = ref(true)
const isBusy = ref(false)
const errorMessage = ref('')
const photoPhase = ref<'start' | 'end' | null>(null)
const photoError = ref('')

const todayLabel = computed(() => (today.value ? formatWorkYmdLabel(today.value) : ''))

const isDayOpen = computed(() => !!dayWork.value?.work_start_at && !dayWork.value.work_end_at)

const canWorkLate = computed(() => isDayOpen.value && isAttendanceAvailable.value && shift.value != null)

const pendingSites = computed(() => (sites.value.length > 1 ? sites.value.filter((s) => !s.is_first) : []))

/** Paid times differ from the punches when attendance rules or the PM set them. */
const paidLabel = computed(() => {
  const day = dayWork.value
  if (!day || (!day.adjusted_start_time && !day.adjusted_end_time)) return ''
  const start = day.adjusted_start_time ?? (day.work_start_at ? formatClock(day.work_start_at) : '—')
  const end = day.adjusted_end_time ?? (day.work_end_at ? formatClock(day.work_end_at) : '…')
  return `Paid time: ${start} – ${end}`
})

function formatClock(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

function formatHours(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '')
}

function siteName(site: WorkDaySite): string {
  return site.project_name || `Project #${site.project_id}`
}

function readError(e: unknown, fallback: string): string {
  const err = e as { response?: { data?: { message?: string } }; message?: string }
  return err.response?.data?.message || err.message || fallback
}

/** Best effort: a missing or denied location must not block the punch. */
async function tryReadPosition(): Promise<{ lat: number; lng: number } | null> {
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), LOCATION_TIMEOUT_MS))
  return Promise.race([readDevicePosition().catch(() => null), timeout])
}

async function load(): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const status = await fetchMyWorkDay()
    today.value = status.today
    dayWork.value = status.day_work
    shift.value = status.shift
    sites.value = status.sites
    isAttendanceAvailable.value = status.attendance_available
  } catch {
    errorMessage.value = "Could not load today's work day."
  } finally {
    isLoading.value = false
  }
}

function openPhoto(phase: 'start' | 'end'): void {
  errorMessage.value = ''
  photoError.value = ''
  photoPhase.value = phase
}

async function punch(file: File): Promise<void> {
  const phase = photoPhase.value
  if (!today.value || !phase) return
  if (!isAcceptedImageFile(file)) {
    photoError.value = 'This file is not a supported image. Take the photo again.'
    return
  }
  isBusy.value = true
  photoError.value = ''
  try {
    const [photo, position] = await Promise.all([fileToCompressedUploadFile(file), tryReadPosition()])
    const saved = await checkInMyWorkDay(today.value, phase, position, photo)
    dayWork.value = saved
    photoPhase.value = null
    emit('updated', saved)
  } catch (e: unknown) {
    photoError.value = readError(e, 'Could not save. Try again.')
  } finally {
    isBusy.value = false
  }
}

async function onWorkingLate(mode: WorkingLateMode): Promise<void> {
  isBusy.value = true
  errorMessage.value = ''
  try {
    dayWork.value = await setMyWorkingLate(mode)
  } catch (e: unknown) {
    errorMessage.value = readError(e, 'Could not save. Try again.')
  } finally {
    isBusy.value = false
  }
}

async function onArrive(site: WorkDaySite): Promise<void> {
  isBusy.value = true
  errorMessage.value = ''
  try {
    sites.value = await arriveAtSite(site.project_id, await tryReadPosition())
  } catch (e: unknown) {
    errorMessage.value = readError(e, 'Could not record the arrival. Try again.')
  } finally {
    isBusy.value = false
  }
}

onMounted(() => {
  void load()
})
</script>

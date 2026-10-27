<template>
  <section class="rounded-xl border border-blue-200 bg-blue-50/60 p-4 shadow-sm" aria-label="Work day">
    <div class="flex items-center justify-between gap-3">
      <div class="min-w-0">
        <p class="text-[11px] font-semibold uppercase tracking-wide text-blue-900/70">
          Today<template v-if="todayLabel"> · {{ todayLabel }}</template>
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
  checkInMyWorkDay,
  fetchMyWorkDay,
  type WorkerDayWork,
} from '@/core/utils/work-timesheet-api'
import { formatWorkYmdLabel } from '@/core/utils/work-day'

const emit = defineEmits<{ updated: [dayWork: WorkerDayWork] }>()

const LOCATION_TIMEOUT_MS = 8000

const today = ref('')
const dayWork = ref<WorkerDayWork | null>(null)
const isLoading = ref(true)
const isBusy = ref(false)
const errorMessage = ref('')
const photoPhase = ref<'start' | 'end' | null>(null)
const photoError = ref('')

const todayLabel = computed(() => (today.value ? formatWorkYmdLabel(today.value) : ''))

function formatClock(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

function formatHours(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '')
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
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    photoError.value = err.response?.data?.message || err.message || 'Could not save. Try again.'
  } finally {
    isBusy.value = false
  }
}

onMounted(() => {
  void load()
})
</script>

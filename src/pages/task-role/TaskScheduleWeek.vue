<template>
  <div class="px-4 py-4 max-w-lg mx-auto pb-8">
    <header class="mb-4">
      <h1 class="text-xl font-semibold text-gray-900">Schedule</h1>
      <p class="text-sm text-gray-500 mt-0.5">
        Your published assignments by day (morning / afternoon / full day). Plan is set by the project manager.
      </p>
    </header>

    <div class="flex items-center justify-between gap-2 mb-4">
      <button
        type="button"
        class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm"
        @click="weekOffset--"
      >
        ← Prev
      </button>
      <span class="text-sm font-medium text-gray-900 text-center truncate">{{ weekLabel }}</span>
      <button
        type="button"
        class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm"
        @click="weekOffset++"
      >
        Next →
      </button>
    </div>

    <div v-if="loadError" class="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
      {{ loadError }}
      <span class="block text-xs mt-1 text-amber-800">If the backend is not ready, this is expected until the API exists.</span>
    </div>

    <div v-if="isLoading" class="flex justify-center py-12">
      <div class="animate-spin w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full" />
    </div>

    <div v-else class="space-y-4">
      <section
        v-for="day in weekDays"
        :key="day.ymd"
        class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
      >
        <h2 class="text-sm font-semibold text-gray-900 mb-3">{{ day.label }}</h2>
        <div v-if="slotsForDay(day.ymd).length === 0" class="text-sm text-gray-500">No assignments.</div>
        <ul v-else class="space-y-2">
          <li
            v-for="(slot, idx) in slotsForDay(day.ymd)"
            :key="`${day.ymd}-${slot.day_part}-${idx}`"
            class="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="font-medium text-gray-800">{{ dayPartLabel(slot.day_part) }}</span>
              <span v-if="slot.projectLabel" class="text-xs text-gray-500 truncate">{{ slot.projectLabel }}</span>
            </div>
            <p class="text-gray-900 mt-0.5">{{ slot.taskName }}</p>
            <p v-if="slot.taskStatus" class="text-xs text-gray-500 mt-0.5">Status: {{ slot.taskStatus }}</p>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  fetchMySchedule,
  type MyScheduleEntry,
  type ScheduleDayPart,
} from '@/core/utils/schedule-weeks-api'
import { addDays, startOfWeekMonday, toYmd } from '@/core/utils/week-utils'

interface DisplaySlot {
  day_part: ScheduleDayPart
  taskName: string
  taskStatus?: string
  projectLabel?: string
}

const weekOffset = ref(0)
const isLoading = ref(false)
const loadError = ref('')
const entries = ref<MyScheduleEntry[]>([])

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

const weekDays = computed(() => {
  const out: { ymd: string; label: string }[] = []
  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStart.value, i)
    const ymd = toYmd(d)
    const label = d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
    out.push({ ymd, label })
  }
  return out
})

function dayPartLabel(part: ScheduleDayPart): string {
  if (part === 'am') return 'Morning'
  if (part === 'pm') return 'Afternoon'
  return 'Full day'
}

function slotsForDay(ymd: string): DisplaySlot[] {
  const rows = entries.value.filter((e) => e.work_date === ymd)
  const order: ScheduleDayPart[] = ['am', 'pm', 'full']
  rows.sort((a, b) => order.indexOf(a.day_part) - order.indexOf(b.day_part))
  return rows.map((e) => ({
    day_part: e.day_part,
    taskName: e.task?.name ?? `Task #${e.task_id}`,
    taskStatus: e.task?.status,
    projectLabel: e.project_id ? `Project #${e.project_id}` : undefined,
  }))
}

async function load() {
  loadError.value = ''
  isLoading.value = true
  try {
    const from = toYmd(weekStart.value)
    const to = toYmd(weekEnd.value)
    entries.value = await fetchMySchedule(from, to)
  } catch (e: unknown) {
    entries.value = []
    const err = e as { response?: { status?: number; data?: { message?: string } } }
    const msg = err.response?.data?.message
    loadError.value =
      msg ||
      (err.response?.status === 404
        ? 'Schedule API not found.'
        : 'Could not load schedule. Check connection or API availability.')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  load()
})

watch(weekOffset, () => {
  load()
})
</script>

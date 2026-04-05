<template>
  <section
    class="mb-6 rounded-xl border-2 border-orange-200 bg-white p-4 shadow-sm"
    aria-labelledby="task-day-work-heading"
  >
    <h2 id="task-day-work-heading" class="text-sm font-semibold text-gray-900 mb-1">
      Work for this day
    </h2>
    <p class="text-xs text-gray-500 mb-4">
      {{ dateHeading }} · {{ partLabel(dayPart) }}. Marks here apply to this day and slot only, not the whole task.
      Saved on this device until the server sync is ready.
    </p>

    <div class="space-y-4">
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1">Status for this day</label>
        <select
          v-model="dayStatus"
          class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          @change="persistDayStatus"
        >
          <option v-for="opt in dayStatusOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1">Notes for this day</label>
        <textarea
          v-model="dayNotes"
          rows="5"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          placeholder="What you did, blockers, handoff for tomorrow…"
          @blur="persistDayNotes"
        />
      </div>

      <p v-if="saveHint" class="text-xs text-green-700">{{ saveHint }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { ScheduleDayPart } from '@/core/utils/schedule-weeks-api'

interface Props {
  projectId: string
  taskId: string
  /** Calendar date for this slice (YYYY-MM-DD). */
  workYmd: string
  dayPart: ScheduleDayPart
}

const props = defineProps<Props>()

const dayStatusOptions = [
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'blocked', label: 'Blocked / issue' },
  { value: 'absent', label: 'Not on site / N/A' },
] as const

const dayStatus = ref<string>('not_started')
const dayNotes = ref('')
const saveHint = ref('')

const dateHeading = computed(() => {
  const d = props.workYmd
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return d || '—'
  return new Date(`${d}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
})

function partLabel(part: ScheduleDayPart): string {
  if (part === 'am') return 'Morning'
  if (part === 'pm') return 'Afternoon'
  return 'All day'
}

function storageKeyStatus(): string {
  return `fw_task_day_status_${props.projectId}_${props.taskId}_${props.workYmd}_${props.dayPart}`
}

function storageKeyNotes(): string {
  return `fw_task_day_notes_${props.projectId}_${props.taskId}_${props.workYmd}_${props.dayPart}`
}

function loadState(): void {
  try {
    const s = localStorage.getItem(storageKeyStatus())
    if (s && dayStatusOptions.some((o) => o.value === s)) {
      dayStatus.value = s
    } else {
      dayStatus.value = 'not_started'
    }
    dayNotes.value = localStorage.getItem(storageKeyNotes()) ?? ''
  } catch {
    dayStatus.value = 'not_started'
    dayNotes.value = ''
  }
}

function persistDayStatus(): void {
  try {
    localStorage.setItem(storageKeyStatus(), dayStatus.value)
    flashSaved()
  } catch {
    saveHint.value = 'Could not save status.'
    window.setTimeout(() => {
      saveHint.value = ''
    }, 3000)
  }
}

function persistDayNotes(): void {
  try {
    localStorage.setItem(storageKeyNotes(), dayNotes.value)
    flashSaved()
  } catch {
    saveHint.value = 'Could not save notes.'
    window.setTimeout(() => {
      saveHint.value = ''
    }, 3000)
  }
}

function flashSaved(): void {
  saveHint.value = 'Saved on this device.'
  window.setTimeout(() => {
    saveHint.value = ''
  }, 2000)
}

onMounted(() => {
  loadState()
})

watch(
  () => [props.projectId, props.taskId, props.workYmd, props.dayPart] as const,
  () => {
    loadState()
  },
)
</script>

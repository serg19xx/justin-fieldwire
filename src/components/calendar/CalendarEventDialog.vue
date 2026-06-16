<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type {
  CalendarAvailabilityConflict,
  CalendarEvent,
  CalendarEventInput,
  CalendarSaveOptions,
} from '@/core/types/calendar-event'
import { calendarApi } from '@/core/utils/calendar-api'
import { formatEventDateTime } from '@/core/utils/calendar-event-utils'

const props = defineProps<{
  isOpen: boolean
  mode: 'create' | 'edit' | 'view'
  event?: CalendarEvent | null
  initialDate?: string
  initialStartTime?: string
  initialEndTime?: string
  initialAllDay?: boolean
  canCreate?: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [payload: CalendarEventInput, options?: CalendarSaveOptions]
  delete: []
}>()

const title = ref('')
const description = ref('')
const location = ref('')
const startDate = ref('')
const startTime = ref('09:00')
const endDate = ref('')
const endTime = ref('10:00')
const allDay = ref(false)
const requiresPresence = ref(false)
const saving = ref(false)
const conflicts = ref<CalendarAvailabilityConflict[]>([])
const checkingAvailability = ref(false)
const saveAnywayArmed = ref(false)

const isReadOnly = computed(() => props.mode === 'view')

const dialogTitle = computed(() => {
  if (props.mode === 'create') return 'New event'
  if (props.mode === 'edit') return 'Edit event'
  return 'Event details'
})

const scopeLabel = computed(() => {
  const e = props.event
  if (!e) return ''
  if (e.scope === 'global') return 'Personal'
  return e.project_name ? `Project: ${e.project_name}` : 'Project event'
})

const presenceHint = computed(() =>
  requiresPresence.value
    ? 'Your presence is required — overlapping presence events will be flagged.'
    : 'Reminder only — you can schedule unlimited events at the same time.',
)

function resetFromProps() {
  conflicts.value = []
  saveAnywayArmed.value = false
  checkingAvailability.value = false
  saving.value = false

  if (props.mode === 'create') {
    const raw = props.initialDate ?? new Date().toISOString().slice(0, 10)
    title.value = ''
    description.value = ''
    location.value = ''
    requiresPresence.value = false
    startDate.value = raw.slice(0, 10)
    endDate.value = raw.slice(0, 10)
    allDay.value = props.initialAllDay ?? false
    if (raw.length > 10 && !props.initialAllDay) {
      startTime.value = raw.slice(11, 16)
      allDay.value = false
    } else {
      startTime.value = props.initialStartTime ?? '10:00'
    }
    endTime.value = props.initialEndTime ?? '12:00'
    return
  }

  const e = props.event
  if (!e) return

  title.value = e.title
  description.value = e.description ?? ''
  location.value = e.location ?? ''
  requiresPresence.value = e.requires_presence
  allDay.value = e.all_day
  startDate.value = e.start_at.slice(0, 10)
  endDate.value = (e.end_at ?? e.start_at).slice(0, 10)
  if (!e.all_day) {
    startTime.value = e.start_at.slice(11, 16)
    endTime.value = (e.end_at ?? e.start_at).slice(11, 16)
  }
}

watch(
  () =>
    [
      props.isOpen,
      props.mode,
      props.event?.id,
      props.initialDate,
      props.initialStartTime,
      props.initialEndTime,
      props.initialAllDay,
    ] as const,
  () => {
    if (props.isOpen) resetFromProps()
  },
)

function buildPayload(): CalendarEventInput | null {
  if (!title.value.trim()) {
    alert('Title is required')
    return null
  }
  if (!startDate.value) {
    alert('Start date is required')
    return null
  }

  let start_at: string
  let end_at: string | null

  if (allDay.value) {
    start_at = startDate.value
    end_at = endDate.value || startDate.value
  } else {
    start_at = `${startDate.value}T${startTime.value}:00`
    end_at = `${endDate.value || startDate.value}T${endTime.value}:00`
    const startMs = new Date(start_at).getTime()
    const endMs = new Date(end_at).getTime()
    if (!Number.isNaN(startMs) && !Number.isNaN(endMs) && endMs <= startMs) {
      alert('End time must be after start time')
      return null
    }
  }

  return {
    title: title.value.trim(),
    description: description.value.trim() || null,
    location: location.value.trim() || null,
    start_at,
    end_at,
    all_day: allDay.value,
    requires_presence: requiresPresence.value,
  }
}

function conflictLabel(c: CalendarAvailabilityConflict): string {
  const when = `${formatEventDateTime(c.start_at, c.all_day)}${c.end_at ? ` — ${formatEventDateTime(c.end_at, c.all_day)}` : ''}`
  const where = c.project_name ? ` (${c.project_name})` : c.scope === 'global' ? ' (personal)' : ''
  return `${c.title}${where} · ${when}`
}

let availabilityTimer: ReturnType<typeof setTimeout> | null = null

async function runAvailabilityCheck() {
  if (props.mode === 'view' || !requiresPresence.value) {
    conflicts.value = []
    return
  }

  const payload = buildPayload()
  if (!payload) {
    conflicts.value = []
    return
  }

  checkingAvailability.value = true
  try {
    conflicts.value = await calendarApi.checkAvailability(
      payload,
      props.mode === 'edit' && props.event ? props.event.id : undefined,
    )
    if (conflicts.value.length === 0) {
      saveAnywayArmed.value = false
    }
  } catch (e) {
    console.warn('Availability check failed', e)
    conflicts.value = []
  } finally {
    checkingAvailability.value = false
  }
}

function scheduleAvailabilityCheck() {
  if (availabilityTimer) clearTimeout(availabilityTimer)
  availabilityTimer = setTimeout(() => {
    void runAvailabilityCheck()
  }, 400)
}

watch(
  [requiresPresence, allDay, startDate, startTime, endDate, endTime],
  () => {
    if (!props.isOpen || props.mode === 'view') return
    saveAnywayArmed.value = false
    scheduleAvailabilityCheck()
  },
)

watch(requiresPresence, (on) => {
  if (!on) {
    conflicts.value = []
    saveAnywayArmed.value = false
  }
})

function handleSave(force = false) {
  const payload = buildPayload()
  if (!payload) return

  if (payload.requires_presence && conflicts.value.length > 0 && !force && !saveAnywayArmed.value) {
    saveAnywayArmed.value = true
    return
  }

  saving.value = true
  emit('save', payload, { force: force || saveAnywayArmed.value })
}

function handleDelete() {
  if (!confirm('Delete this event?')) return
  emit('delete')
}

function showServerConflicts(list: CalendarAvailabilityConflict[]) {
  conflicts.value = list
  saveAnywayArmed.value = list.length > 0
  saving.value = false
}

function resetSaving() {
  saving.value = false
}

defineExpose({ showServerConflicts, resetSaving })
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
    @click.self="emit('close')"
  >
    <div class="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
      <div class="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">{{ dialogTitle }}</h2>
          <p v-if="event && mode === 'view'" class="text-xs text-gray-500 mt-0.5">{{ scopeLabel }}</p>
        </div>
        <button type="button" class="text-gray-400 hover:text-gray-600" @click="emit('close')">✕</button>
      </div>

      <div v-if="mode === 'view' && event" class="p-4 space-y-3 text-sm">
        <div>
          <span class="text-xs font-medium text-gray-500 uppercase">Title</span>
          <p class="text-gray-900 font-medium">{{ event.title }}</p>
        </div>
        <div>
          <span class="text-xs font-medium text-gray-500 uppercase">Type</span>
          <p class="text-gray-700">{{ event.requires_presence ? 'Requires your presence' : 'Reminder' }}</p>
        </div>
        <div v-if="event.description">
          <span class="text-xs font-medium text-gray-500 uppercase">Notes</span>
          <p class="text-gray-700 whitespace-pre-wrap">{{ event.description }}</p>
        </div>
        <div v-if="event.location">
          <span class="text-xs font-medium text-gray-500 uppercase">Location</span>
          <p class="text-gray-700">{{ event.location }}</p>
        </div>
        <div>
          <span class="text-xs font-medium text-gray-500 uppercase">When</span>
          <p class="text-gray-700">
            {{ formatEventDateTime(event.start_at, event.all_day) }}
            <template v-if="event.end_at && event.end_at !== event.start_at">
              — {{ formatEventDateTime(event.end_at, event.all_day) }}
            </template>
          </p>
        </div>
        <p v-if="!event.editable" class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
          Read-only here. Edit in
          <template v-if="event.scope === 'project'">the project calendar</template>
          <template v-else>your personal calendar</template>.
        </p>
      </div>

      <form v-else class="p-4 space-y-3" @submit.prevent="handleSave()">
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Title *</label>
          <input
            v-model="title"
            type="text"
            required
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="Event title"
          />
        </div>

        <div class="rounded-md border border-gray-200 p-3 space-y-2">
          <label class="flex items-start gap-2 text-sm text-gray-800 cursor-pointer">
            <input v-model="requiresPresence" type="checkbox" class="rounded mt-0.5" />
            <span>
              <span class="font-medium">Requires my presence</span>
              <span class="block text-xs text-gray-500 mt-0.5">{{ presenceHint }}</span>
            </span>
          </label>
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            v-model="description"
            rows="2"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="Optional notes"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Location</label>
          <input
            v-model="location"
            type="text"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="Optional — site, address, room"
          />
        </div>
        <label class="flex items-center gap-2 text-sm text-gray-700">
          <input v-model="allDay" type="checkbox" class="rounded" />
          All day
        </label>
        <div v-if="!allDay" class="rounded-md border border-blue-100 bg-blue-50/50 p-3 space-y-3">
          <p class="text-xs font-medium text-blue-800">Time</p>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Start time</label>
              <input v-model="startTime" type="time" step="900" class="w-full border border-gray-300 rounded-md px-2 py-2 text-sm bg-white" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">End time</label>
              <input v-model="endTime" type="time" step="900" class="w-full border border-gray-300 rounded-md px-2 py-2 text-sm bg-white" />
            </div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Start date *</label>
            <input v-model="startDate" type="date" required class="w-full border border-gray-300 rounded-md px-2 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">End date</label>
            <input v-model="endDate" type="date" class="w-full border border-gray-300 rounded-md px-2 py-2 text-sm" />
          </div>
        </div>

        <div
          v-if="requiresPresence && (checkingAvailability || conflicts.length > 0)"
          class="rounded-md border px-3 py-2 text-xs"
          :class="conflicts.length > 0 ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-gray-200 bg-gray-50 text-gray-600'"
        >
          <p v-if="checkingAvailability">Checking availability…</p>
          <template v-else-if="conflicts.length > 0">
            <p class="font-medium mb-1">You are already booked:</p>
            <ul class="list-disc list-inside space-y-0.5">
              <li v-for="c in conflicts" :key="c.id">{{ conflictLabel(c) }}</li>
            </ul>
            <p v-if="saveAnywayArmed" class="mt-2 text-amber-800">
              Click <strong>Save anyway</strong> to create this event despite the overlap.
            </p>
          </template>
        </div>
      </form>

      <div class="px-4 py-3 border-t border-gray-200 flex justify-between gap-2">
        <button
          v-if="mode === 'edit' && event?.editable"
          type="button"
          class="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md"
          @click="handleDelete"
        >
          Delete
        </button>
        <div v-else class="flex-1" />
        <div class="flex gap-2">
          <button
            type="button"
            class="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
            @click="emit('close')"
          >
            {{ mode === 'view' ? 'Close' : 'Cancel' }}
          </button>
          <button
            v-if="mode !== 'view' && saveAnywayArmed && conflicts.length > 0"
            type="button"
            :disabled="saving"
            class="px-3 py-1.5 text-sm bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50"
            @click="handleSave(true)"
          >
            Save anyway
          </button>
          <button
            v-if="mode !== 'view'"
            type="button"
            :disabled="saving"
            class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            @click="handleSave()"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

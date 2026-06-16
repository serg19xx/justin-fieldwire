<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import type { CalendarEvent, CalendarEventInput, CalendarSaveOptions, UserCalendarMode } from '@/core/types/calendar-event'
import { calendarApi, CalendarConflictError } from '@/core/utils/calendar-api'
import { calendarEventToFcEvent, toHm, toYmd } from '@/core/utils/calendar-event-utils'
import { downloadCalendarICal, openGoogleCalendarImportHint } from '@/core/utils/calendar-ical-export'
import CalendarEventDialog from '@/components/calendar/CalendarEventDialog.vue'

const props = defineProps<{
  mode: UserCalendarMode
  projectId?: number
}>()

const events = ref<CalendarEvent[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null)
const eventDialogRef = ref<InstanceType<typeof CalendarEventDialog> | null>(null)
const rangeFrom = ref<string>()
const rangeTo = ref<string>()
const selectedDate = ref<string | null>(null)
const lastDateClick = ref<{ date: string; time: number } | null>(null)
const isExporting = ref(false)
const exportMenuOpen = ref(false)

const selectedDateLabel = computed(() => {
  if (!selectedDate.value) return null
  const d = new Date(selectedDate.value + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
})

const dialog = ref({
  isOpen: false,
  mode: 'create' as 'create' | 'edit' | 'view',
  event: null as CalendarEvent | null,
  initialDate: undefined as string | undefined,
  initialStartTime: undefined as string | undefined,
  initialEndTime: undefined as string | undefined,
  initialAllDay: undefined as boolean | undefined,
})

interface CreateDialogOptions {
  date?: string
  startTime?: string
  endTime?: string
  allDay?: boolean
}

const legendItems = computed(() => {
  const presence = { color: '#F59E0B', label: 'Requires presence (amber border)', border: true }
  if (props.mode === 'global') {
    return [
      { color: '#3B82F6', label: 'Personal (editable)' },
      { color: '#6B7280', label: 'Project events (read-only)' },
      presence,
    ]
  }
  return [
    { color: '#059669', label: 'Project events (editable)' },
    { color: '#93C5FD', label: 'Personal (read-only)' },
    presence,
  ]
})

const subtitle = computed(() => {
  if (props.mode === 'global') {
    return 'Your personal calendar. Project events are shown for reference only.'
  }
  return 'Project events are editable here. Personal events are shown for reference only.'
})

async function loadEvents(from?: string, to?: string) {
  loading.value = true
  error.value = null
  try {
    if (props.mode === 'global') {
      events.value = await calendarApi.listGlobal(from, to)
    } else if (props.projectId) {
      events.value = await calendarApi.listForProject(props.projectId, from, to)
    } else {
      events.value = []
    }
  } catch (e) {
    console.error('Failed to load calendar events', e)
    error.value = 'Failed to load calendar events'
    events.value = []
  } finally {
    loading.value = false
  }
}

function refreshCalendar() {
  calendarRef.value?.getApi()?.refetchEvents()
}

const calendarOptions = {
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
  },
  height: 'auto',
  selectable: false,
  selectMirror: true,
  displayEventTime: true,
  slotDuration: '00:30:00',
  slotLabelInterval: '01:00:00',
  editable: false,
  eventStartEditable: false,
  eventDurationEditable: false,
  events: (
    info: { start: Date; end: Date },
    successCallback: (items: Record<string, unknown>[]) => void,
  ) => {
    const from = toYmd(info.start)
    const to = toYmd(new Date(info.end.getTime() - 86400000))
    rangeFrom.value = from
    rangeTo.value = to
    void loadEvents(from, to).then(() => {
      successCallback(events.value.map(calendarEventToFcEvent))
    })
  },
  datesSet: (info: { start: Date; end: Date; view: { type: string; calendar: { setOption: (k: string, v: boolean) => void } } }) => {
    const from = toYmd(info.start)
    const to = toYmd(new Date(info.end.getTime() - 86400000))
    const isTimeView = info.view.type.startsWith('timeGrid')
    info.view.calendar.setOption('selectable', isTimeView)
    if (from !== rangeFrom.value || to !== rangeTo.value) {
      rangeFrom.value = from
      rangeTo.value = to
      void loadEvents(from, to).then(() => refreshCalendar())
    }
  },
  select: (info: { start: Date; end: Date; allDay: boolean; view: { type: string } }) => {
    if (!info.view.type.startsWith('timeGrid')) {
      calendarRef.value?.getApi()?.unselect()
      return
    }
    if (info.allDay) {
      openCreateDialog({ date: toYmd(info.start), allDay: true })
    } else {
      openCreateDialog({
        date: toYmd(info.start),
        startTime: toHm(info.start),
        endTime: toHm(info.end),
        allDay: false,
      })
    }
    calendarRef.value?.getApi()?.unselect()
  },
  dateClick: (info: { dateStr: string; date: Date; allDay: boolean; view: { type: string } }) => {
    const isTimeView = info.view.type.startsWith('timeGrid')
    const date = toYmd(info.date)
    const now = Date.now()
    const last = lastDateClick.value

    if (isTimeView && !info.allDay) {
      const slotKey = `${date}T${toHm(info.date)}`
      if (last?.date === slotKey && now - last.time < 450) {
        lastDateClick.value = null
        const end = new Date(info.date.getTime() + 2 * 60 * 60 * 1000)
        openCreateDialog({
          date,
          startTime: toHm(info.date),
          endTime: toHm(end),
          allDay: false,
        })
        return
      }
      lastDateClick.value = { date: slotKey, time: now }
      selectedDate.value = date
      return
    }

    if (last?.date === date && now - last.time < 450) {
      lastDateClick.value = null
      openCreateDialog({ date, allDay: false, startTime: '10:00', endTime: '12:00' })
      return
    }
    lastDateClick.value = { date, time: now }
    selectedDate.value = date
  },
  dayCellClassNames: (arg: { date: Date }) => {
    const ymd = toYmd(arg.date)
    return selectedDate.value === ymd ? ['fc-day-selected-user'] : []
  },
  eventClick: (info: { event: { extendedProps: { calendarEvent?: CalendarEvent } } }) => {
    const ev = info.event.extendedProps.calendarEvent
    if (!ev) return
    dialog.value = {
      isOpen: true,
      mode: ev.editable ? 'edit' : 'view',
      event: ev,
      initialDate: undefined,
    }
  },
}

function closeDialog() {
  dialog.value.isOpen = false
  dialog.value.event = null
  dialog.value.initialStartTime = undefined
  dialog.value.initialEndTime = undefined
  dialog.value.initialAllDay = undefined
}

async function handleSave(payload: CalendarEventInput, options?: CalendarSaveOptions) {
  const body: CalendarEventInput = {
    ...payload,
    force: options?.force ?? false,
  }
  try {
    if (dialog.value.mode === 'create') {
      if (props.mode === 'global') {
        await calendarApi.createGlobal(body)
      } else if (props.projectId) {
        await calendarApi.createForProject(props.projectId, body)
      }
    } else if (dialog.value.event) {
      const id = dialog.value.event.id
      if (props.mode === 'global') {
        await calendarApi.updateGlobal(id, body)
      } else if (props.projectId) {
        await calendarApi.updateForProject(props.projectId, id, body)
      }
    }
    closeDialog()
    await loadEvents(rangeFrom.value, rangeTo.value)
    refreshCalendar()
  } catch (e) {
    if (e instanceof CalendarConflictError) {
      eventDialogRef.value?.showServerConflicts(e.conflicts)
      return
    }
    console.error('Save calendar event failed', e)
    alert('Failed to save event')
    eventDialogRef.value?.resetSaving()
  }
}

async function handleDelete() {
  const ev = dialog.value.event
  if (!ev) return
  try {
    if (props.mode === 'global') {
      await calendarApi.deleteGlobal(ev.id)
    } else if (props.projectId) {
      await calendarApi.deleteForProject(props.projectId, ev.id)
    }
    closeDialog()
    await loadEvents(rangeFrom.value, rangeTo.value)
    refreshCalendar()
  } catch (e) {
    console.error('Delete calendar event failed', e)
    alert('Failed to delete event')
  }
}

function openCreateDialog(options?: string | CreateDialogOptions) {
  const opts: CreateDialogOptions =
    typeof options === 'string' ? { date: options } : (options ?? {})
  dialog.value = {
    isOpen: true,
    mode: 'create',
    event: null,
    initialDate: opts.date ?? selectedDate.value ?? new Date().toISOString().slice(0, 10),
    initialStartTime: opts.startTime,
    initialEndTime: opts.endTime,
    initialAllDay: opts.allDay,
  }
}

watch(selectedDate, () => {
  nextTick(() => calendarRef.value?.getApi()?.render())
})

async function fetchAllEventsForExport(): Promise<CalendarEvent[]> {
  if (props.mode === 'global') {
    return calendarApi.listGlobal()
  }
  if (props.projectId) {
    return calendarApi.listForProject(props.projectId)
  }
  return []
}

function exportFilename(extension: 'ics'): string {
  const dateStr = new Date().toISOString().slice(0, 10)
  if (props.mode === 'project' && props.projectId) {
    return `fieldwire_project_${props.projectId}_calendar_${dateStr}.${extension}`
  }
  return `fieldwire_calendar_${dateStr}.${extension}`
}

function calendarExportName(): string {
  return props.mode === 'project' ? 'FieldWire Project Calendar' : 'FieldWire Calendar'
}

async function handleExportICal(): Promise<boolean> {
  exportMenuOpen.value = false
  isExporting.value = true
  try {
    const list = await fetchAllEventsForExport()
    if (list.length === 0) {
      alert('No events to export')
      return false
    }
    downloadCalendarICal(list, exportFilename('ics'), calendarExportName())
    return true
  } catch (e) {
    console.error('Calendar iCal export failed', e)
    alert('Failed to export calendar. Please try again.')
    return false
  } finally {
    isExporting.value = false
  }
}

async function handleExportGoogleCalendar() {
  const ok = await handleExportICal()
  if (!ok) return
  openGoogleCalendarImportHint()
  alert(
    'The .ics file was downloaded.\n\nIn Google Calendar: click the + next to "Other calendars" → Import → upload the file.',
  )
}

function toggleExportMenu() {
  exportMenuOpen.value = !exportMenuOpen.value
}
</script>

<template>
  <div class="user-calendar flex flex-col min-h-0">
    <div class="px-4 py-3 border-b border-gray-200 bg-white">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">Calendar</h2>
          <p class="text-xs text-gray-500 mt-0.5">{{ subtitle }}</p>
        </div>
        <div class="flex flex-wrap items-center gap-2 self-start">
          <button
            type="button"
            class="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700"
            @click="openCreateDialog()"
          >
            + New event
          </button>
          <div class="relative">
            <button
              type="button"
              :disabled="isExporting"
              class="px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-1.5 transition-colors"
              :class="
                isExporting
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              "
              title="Export to iCalendar (.ics) or Google Calendar"
              @click="toggleExportMenu"
            >
              <span v-if="isExporting" class="animate-spin">⏳</span>
              <span v-else>📅</span>
              <span>{{ isExporting ? 'Exporting…' : 'Export iCal' }}</span>
              <span class="text-xs opacity-80">▾</span>
            </button>
            <div
              v-if="exportMenuOpen && !isExporting"
              class="absolute right-0 mt-1 w-52 bg-white border border-gray-200 rounded-md shadow-lg z-20 py-1 text-sm"
            >
              <button
                type="button"
                class="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-800"
                @click="handleExportICal"
              >
                iCalendar (.ics)
              </button>
              <button
                type="button"
                class="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-800"
                @click="handleExportGoogleCalendar"
              >
                Google Calendar…
              </button>
            </div>
          </div>
        </div>
      </div>
      <p class="text-xs text-gray-500 mt-2">
        Month: click a day to select; double-click or <strong>+ New event</strong> to create (default 10:00–12:00).
        Week/Day: drag a time range to create, or double-click a slot.
        <strong>Requires my presence</strong> checks conflicts across all your calendars.
        <span v-if="selectedDateLabel" class="text-gray-700"> Selected: {{ selectedDateLabel }}.</span>
      </p>
      <div class="flex flex-wrap gap-4 mt-3 text-xs">
        <div v-for="item in legendItems" :key="item.label" class="flex items-center gap-1.5">
          <span
            class="w-3 h-3 rounded-full flex-shrink-0"
            :class="item.border ? 'ring-2 ring-amber-500 bg-white' : ''"
            :style="item.border ? undefined : { backgroundColor: item.color }"
          />
          <span class="text-gray-600">{{ item.label }}</span>
        </div>
      </div>
      <p v-if="loading" class="text-xs text-gray-500 mt-2">Loading…</p>
      <p v-if="error" class="text-xs text-red-600 mt-2">{{ error }}</p>
    </div>

    <div class="flex-1 p-4 bg-white overflow-auto min-h-[500px]">
      <FullCalendar ref="calendarRef" :options="calendarOptions" />
    </div>

    <CalendarEventDialog
      ref="eventDialogRef"
      :is-open="dialog.isOpen"
      :mode="dialog.mode"
      :event="dialog.event"
      :initial-date="dialog.initialDate"
      :initial-start-time="dialog.initialStartTime"
      :initial-end-time="dialog.initialEndTime"
      :initial-all-day="dialog.initialAllDay"
      @close="closeDialog"
      @save="handleSave"
      @delete="handleDelete"
    />
  </div>
</template>

<style scoped>
:deep(.fc) {
  font-size: 0.875rem;
}
:deep(.fc .fc-daygrid-day.fc-day-selected-user) {
  background-color: rgb(239 246 255);
}
:deep(.fc .calendar-event-presence) {
  box-shadow: inset 0 0 0 2px #f59e0b;
}
</style>

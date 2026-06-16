import type { CalendarEvent } from '@/core/types/calendar-event'

/** FullCalendar exclusive end for all-day events (add one day). */
export function calendarEventToFcEvent(event: CalendarEvent): Record<string, unknown> {
  const color = eventColor(event)
  let start = event.start_at
  let end = event.end_at ?? event.start_at

  if (event.all_day) {
    start = event.start_at.slice(0, 10)
    const endDate = new Date((event.end_at ?? event.start_at).slice(0, 10) + 'T00:00:00')
    endDate.setDate(endDate.getDate() + 1)
    end = endDate.toISOString().slice(0, 10)
  }

  return {
    id: String(event.id),
    title: event.title,
    start,
    end,
    allDay: event.all_day,
    backgroundColor: color,
    borderColor: event.requires_presence ? '#F59E0B' : color,
    classNames: event.requires_presence ? ['calendar-event-presence'] : [],
    editable: event.editable,
    extendedProps: {
      calendarEvent: event,
    },
  }
}

export function eventColor(event: CalendarEvent): string {
  if (event.scope === 'global') {
    return event.editable ? '#3B82F6' : '#93C5FD'
  }
  return event.editable ? '#059669' : '#6B7280'
}

export function formatEventDateTime(iso: string, allDay: boolean): string {
  const d = new Date(iso)
  if (allDay) {
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** HH:mm from Date (local) */
export function toHm(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

/** YYYY-MM-DD from Date */
export function toYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

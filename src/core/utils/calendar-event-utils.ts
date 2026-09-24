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

/**
 * Map FullCalendar drop/resize dates back to API start_at / end_at.
 * All-day FC end is exclusive (+1 day); API stores inclusive calendar dates.
 */
export function fcDropToApiDates(info: {
  event: {
    start: Date | null
    end: Date | null
    allDay: boolean
    startStr?: string
    endStr?: string
  }
}): { start_at: string; end_at: string | null; all_day: boolean } | null {
  const ev = info.event
  if (!ev.start) return null

  if (ev.allDay) {
    const startYmd = (ev.startStr || toYmd(ev.start)).slice(0, 10)
    let endYmd = startYmd
    if (ev.endStr) {
      const exclusive = ev.endStr.slice(0, 10)
      const d = new Date(exclusive + 'T00:00:00')
      d.setDate(d.getDate() - 1)
      endYmd = toYmd(d)
    } else if (ev.end) {
      const d = new Date(ev.end.getTime())
      d.setDate(d.getDate() - 1)
      endYmd = toYmd(d)
    }
    if (endYmd < startYmd) endYmd = startYmd
    return { start_at: startYmd, end_at: endYmd, all_day: true }
  }

  const start = ev.start
  const end = ev.end ?? new Date(start.getTime() + 60 * 60 * 1000)
  return {
    start_at: `${toYmd(start)}T${toHm(start)}:00`,
    end_at: `${toYmd(end)}T${toHm(end)}:00`,
    all_day: false,
  }
}

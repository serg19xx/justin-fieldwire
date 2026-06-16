import type { CalendarEvent } from '@/core/types/calendar-event'
import { downloadFile } from '@/core/utils/task-utils'

function escapeIcalText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function toUtcStamp(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function ymdFromIso(iso: string): string {
  return iso.slice(0, 10)
}

function addDaysYmd(ymd: string, days: number): string {
  const d = new Date(ymd + 'T12:00:00')
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function eventDescription(event: CalendarEvent): string {
  const lines = [
    event.description?.trim() || '',
    event.location?.trim() ? `Location: ${event.location.trim()}` : '',
    event.requires_presence ? 'Requires your presence' : 'Reminder',
    event.project_name ? `Project: ${event.project_name}` : event.scope === 'global' ? 'Personal event' : '',
  ].filter(Boolean)
  return escapeIcalText(lines.join('\n'))
}

export function exportCalendarEventsToICal(
  events: CalendarEvent[],
  calendarName = 'FieldWire Calendar',
): string {
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FieldWire//User Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcalText(calendarName)}`,
    'X-WR-CALDESC:Events exported from FieldWire',
  ]

  for (const event of events) {
    const summary = escapeIcalText(event.title)
    const uid = `fw-calendar-${event.id}@fieldwire.com`
    const vevent = ['BEGIN:VEVENT', `UID:${uid}`, `DTSTAMP:${now}`, `SUMMARY:${summary}`]

    if (event.location?.trim()) {
      vevent.push(`LOCATION:${escapeIcalText(event.location.trim())}`)
    }

    const description = eventDescription(event)
    if (description) {
      vevent.push(`DESCRIPTION:${description}`)
    }

    if (event.all_day) {
      const startYmd = ymdFromIso(event.start_at)
      const endYmd = addDaysYmd(ymdFromIso(event.end_at ?? event.start_at), 1)
      vevent.push(`DTSTART;VALUE=DATE:${startYmd.replace(/-/g, '')}`)
      vevent.push(`DTEND;VALUE=DATE:${endYmd.replace(/-/g, '')}`)
    } else {
      const start = toUtcStamp(event.start_at)
      let end = event.end_at ? toUtcStamp(event.end_at) : ''
      if (!end && start) {
        const fallback = new Date(event.start_at)
        fallback.setHours(fallback.getHours() + 1)
        end = toUtcStamp(fallback.toISOString())
      }
      if (start) vevent.push(`DTSTART:${start}`)
      if (end) vevent.push(`DTEND:${end}`)
    }

    vevent.push('END:VEVENT')
    lines.push(...vevent)
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export function downloadCalendarICal(events: CalendarEvent[], filename: string, calendarName?: string): void {
  const content = exportCalendarEventsToICal(events, calendarName)
  downloadFile(content, filename, 'text/calendar;charset=utf-8')
}

export function openGoogleCalendarImportHint(): void {
  window.open('https://calendar.google.com/calendar/u/0/r', '_blank', 'noopener,noreferrer')
}

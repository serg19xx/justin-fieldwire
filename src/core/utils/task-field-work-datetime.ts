/**
 * Field work times are site wall-clock values (no timezone conversion).
 * What the foreman enters is what is stored and displayed.
 */

const WALL_CLOCK_RE = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/

/** Parse API / DB naive datetime as local wall-clock components. */
export function parseWallClockDateTime(value: string | null | undefined): Date | null {
  if (!value?.trim()) return null
  const trimmed = value.trim().replace(/\.\d+/, '').replace(/Z$/i, '')
  const m = trimmed.match(WALL_CLOCK_RE)
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  const hour = Number(m[4])
  const minute = Number(m[5])
  const second = Number(m[6] ?? '0')
  const d = new Date(year, month - 1, day, hour, minute, second)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Format Date or wall-clock string for `<input type="datetime-local">`. */
export function toDatetimeLocalValue(value: Date | string): string {
  const d =
    value instanceof Date
      ? value
      : parseWallClockDateTime(value) ?? new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Convert datetime-local input to naive MySQL-style string for API. */
export function datetimeLocalToApiValue(localValue: string): string | null {
  if (!localValue.trim()) return null
  const m = localValue.trim().match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/)
  if (!m) return null
  return `${m[1]} ${m[2]}:00`
}

/** @deprecated Use {@link datetimeLocalToApiValue} */
export function datetimeLocalToIso(localValue: string): string | null {
  return datetimeLocalToApiValue(localValue)
}

export function formatTaskDateTimeDisplay(value: string | null | undefined): string {
  const d = parseWallClockDateTime(value)
  if (!d) return value?.trim() ? value : 'Not set'
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Build planned start as datetime-local from task planned date + start_time. */
export function plannedStartDatetimeLocal(
  startPlanned?: string | null,
  startTime?: string | null,
): string | null {
  if (!startPlanned) return null
  const datePart = startPlanned.slice(0, 10)
  const timePart = startTime?.trim() ? startTime.slice(0, 5) : '08:00'
  return `${datePart}T${timePart}`
}

/** Human-readable planned window for dialog hint. */
export function formatPlannedWorkHint(
  startPlanned?: string | null,
  endPlanned?: string | null,
  startTime?: string | null,
  endTime?: string | null,
): string {
  const fmtDate = (d: string) => {
    try {
      return new Date(d + 'T12:00:00').toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return d
    }
  }
  const fmtTime = (t: string) => t.slice(0, 5)
  let dates = ''
  if (startPlanned && endPlanned && startPlanned !== endPlanned) {
    dates = `${fmtDate(startPlanned)} – ${fmtDate(endPlanned)}`
  } else if (startPlanned) {
    dates = fmtDate(startPlanned)
  }
  const st = startTime ? fmtTime(startTime) : ''
  const et = endTime ? fmtTime(endTime) : ''
  const times = st && et ? `${st} – ${et}` : st ? `from ${st}` : et ? `until ${et}` : ''
  if (dates && times) return `Planned: ${dates} · ${times}`
  if (dates) return `Planned: ${dates}`
  if (times) return `Planned time: ${times}`
  return ''
}

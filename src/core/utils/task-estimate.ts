/** PM "Estimated time to complete" for a task, stored by the API as whole minutes. */
export interface TaskEstimateParts {
  days: number
  hours: number
  minutes: number
}

const MINUTES_PER_HOUR = 60
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR

function wholeNonNegative(value: unknown, max: number): number {
  const n = Math.floor(Number(value))
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.min(n, max)
}

export function emptyTaskEstimate(): TaskEstimateParts {
  return { days: 0, hours: 0, minutes: 0 }
}

export function splitEstimateMinutes(total: number | null | undefined): TaskEstimateParts {
  const t = wholeNonNegative(total, Number.MAX_SAFE_INTEGER)
  return {
    days: Math.floor(t / MINUTES_PER_DAY),
    hours: Math.floor((t % MINUTES_PER_DAY) / MINUTES_PER_HOUR),
    minutes: t % MINUTES_PER_HOUR,
  }
}

/** Total minutes, or null when nothing was entered. */
export function joinEstimateParts(parts: TaskEstimateParts): number | null {
  const total =
    wholeNonNegative(parts.days, 365) * MINUTES_PER_DAY +
    wholeNonNegative(parts.hours, 23) * MINUTES_PER_HOUR +
    wholeNonNegative(parts.minutes, 59)
  return total > 0 ? total : null
}

/** e.g. "2d 4h 30m"; empty string when there is no estimate. */
export function formatTaskEstimate(total: number | null | undefined): string {
  const { days, hours, minutes } = splitEstimateMinutes(total)
  const out: string[] = []
  if (days) out.push(`${days}d`)
  if (hours) out.push(`${hours}h`)
  if (minutes) out.push(`${minutes}m`)
  return out.join(' ')
}

/**
 * Calendar days the task occupies on the Gantt / calendar: each full day counts,
 * and leftover hours or minutes take one more day (a same-day job is 1 day).
 */
export function estimateSpanDays(total: number | null | undefined): number {
  const { days, hours, minutes } = splitEstimateMinutes(total)
  return Math.max(1, days + (hours > 0 || minutes > 0 ? 1 : 0))
}

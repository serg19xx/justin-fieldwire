/** Monday-based week start (local timezone), 00:00:00.000 */
export function startOfWeekMonday(base: Date): Date {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate())
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

/** First day of the month containing `base` (local). */
export function startOfMonth(base: Date): Date {
  return new Date(base.getFullYear(), base.getMonth(), 1)
}

/** Last day of the month containing `base` (local). */
export function endOfMonth(base: Date): Date {
  return new Date(base.getFullYear(), base.getMonth() + 1, 0)
}

/** Local calendar date YYYY-MM-DD */
export function toYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

/** Parse YYYY-MM-DD as local noon (stable for DST). */
export function parseYmdLocal(ymd: string): Date {
  const core = ymd.length >= 10 ? ymd.slice(0, 10) : ymd
  return new Date(`${core}T12:00:00`)
}

/** Inclusive list of YYYY-MM-DD from `startYmd` through `endYmd` (empty if invalid / reversed). */
export function eachYmdInRange(startYmd: string, endYmd: string, maxDays = 62): string[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startYmd) || !/^\d{4}-\d{2}-\d{2}$/.test(endYmd)) return []
  if (startYmd > endYmd) return []
  const out: string[] = []
  let cur = parseYmdLocal(startYmd)
  const end = parseYmdLocal(endYmd)
  while (cur <= end && out.length < maxDays) {
    out.push(toYmd(cur))
    cur = addDays(cur, 1)
  }
  return out
}

/** Monday YYYY-MM-DD of the local calendar week that contains `ymd` (ISO date string). */
export function weekStartMondayYmdFromIsoDate(ymd: string): string {
  const core = ymd.length >= 10 ? ymd.slice(0, 10) : ymd
  const d = new Date(`${core}T12:00:00`)
  if (Number.isNaN(d.getTime())) return core
  return toYmd(startOfWeekMonday(d))
}

/** Mondays (YYYY-MM-DD) covering every day from `startYmd` through `endYmd`. */
export function mondaysCoveringRange(startYmd: string, endYmd: string): string[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startYmd) || !/^\d{4}-\d{2}-\d{2}$/.test(endYmd)) return []
  if (startYmd > endYmd) return []
  let m = weekStartMondayYmdFromIsoDate(startYmd)
  const last = weekStartMondayYmdFromIsoDate(endYmd)
  const out: string[] = []
  while (m <= last) {
    out.push(m)
    m = toYmd(addDays(parseYmdLocal(m), 7))
  }
  return out
}

/**
 * Hours between two API timestamps (ISO or MySQL-like). Null if incomplete or end before start.
 */
export function hoursBetweenTimestamps(
  startAt: string | null | undefined,
  endAt: string | null | undefined,
): number | null {
  if (startAt == null || endAt == null || startAt === '' || endAt === '') return null
  const a = new Date(startAt)
  const b = new Date(endAt)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null
  const sec = (b.getTime() - a.getTime()) / 1000
  if (sec < 0) return null
  return Math.round((sec / 3600) * 100) / 100
}

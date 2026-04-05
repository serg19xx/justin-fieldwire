/** Monday-based week start (local timezone), 00:00:00.000 */
export function startOfWeekMonday(base: Date): Date {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate())
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
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

/** Monday YYYY-MM-DD of the local calendar week that contains `ymd` (ISO date string). */
export function weekStartMondayYmdFromIsoDate(ymd: string): string {
  const core = ymd.length >= 10 ? ymd.slice(0, 10) : ymd
  const d = new Date(`${core}T12:00:00`)
  if (Number.isNaN(d.getTime())) return core
  return toYmd(startOfWeekMonday(d))
}

/** Shared work-day helpers for worker task-role screens (YYYY-MM-DD). */

export function todayWorkYmd(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseWorkYmd(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const s = raw.trim().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const t = new Date(`${s}T12:00:00`)
  if (Number.isNaN(t.getTime())) return null
  return s
}

export function addDaysToWorkYmd(ymd: string, deltaDays: number): string {
  const base = parseWorkYmd(ymd) ?? todayWorkYmd()
  const d = new Date(`${base}T12:00:00`)
  d.setDate(d.getDate() + deltaDays)
  return todayWorkYmd(d)
}

export function formatWorkYmdLabel(ymd: string, opts?: { includeWeekday?: boolean }): string {
  const parsed = parseWorkYmd(ymd)
  if (!parsed) return ymd
  const d = new Date(`${parsed}T12:00:00`)
  return d.toLocaleDateString(undefined, {
    weekday: opts?.includeWeekday === false ? undefined : 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** True when calendar day falls inside task planned start/end (inclusive). */
export function taskCoversWorkYmd(
  task: { start_planned?: string | null; end_planned?: string | null },
  workYmd: string,
): boolean {
  const day = parseWorkYmd(workYmd)
  if (!day) return false
  const start = String(task.start_planned ?? '').slice(0, 10)
  const endRaw = String(task.end_planned ?? '').slice(0, 10)
  const end = /^\d{4}-\d{2}-\d{2}$/.test(endRaw) ? endRaw : start
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return false
  return start <= day && day <= end
}

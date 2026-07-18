/** Period label helpers shared by the global and project report pages. */

export type ReportPeriodType = 'daily' | 'weekly' | 'monthly'

function parseDate(date: string): Date | null {
  const parsed = new Date(`${date}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/**
 * Human label for a stored report_date depending on the report type:
 * daily → "Sat, July 18, 2026"
 * weekly → "Week Jul 13 – Jul 19, 2026" (week containing report_date, Mon–Sun)
 * monthly → "July 2026"
 */
export function formatReportPeriod(date: string, type: ReportPeriodType): string {
  const parsed = parseDate(date)
  if (!parsed) return date

  if (type === 'monthly') {
    return parsed.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  if (type === 'weekly') {
    const day = parsed.getDay()
    const mondayOffset = day === 0 ? -6 : 1 - day
    const start = new Date(parsed)
    start.setDate(parsed.getDate() + mondayOffset)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    const startLabel = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const endLabel = end.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    return `Week ${startLabel} – ${endLabel}`
  }

  return parsed.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

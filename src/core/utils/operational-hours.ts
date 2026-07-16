/** Operational Hours weekly schedule (Open/Close selects). */

export type OperationalHoursDayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export const OPERATIONAL_HOURS_TIME_OPTIONS = [
  '24 Hours',
  '6am',
  '7am',
  '8am',
  '9am',
  '10am',
  '11am',
  '12pm',
  '1pm',
  '2pm',
  '3pm',
  '4pm',
  '5pm',
  '6pm',
  '7pm',
  '8pm',
  '9pm',
  '10pm',
] as const

export type OperationalHoursTimeOption = (typeof OPERATIONAL_HOURS_TIME_OPTIONS)[number]

export const OPERATIONAL_HOURS_TIME_OPTION_SET = new Set<string>(OPERATIONAL_HOURS_TIME_OPTIONS)

export interface OperationalHoursDayDef {
  key: OperationalHoursDayKey
  label: string
}

export const OPERATIONAL_HOURS_DAYS: readonly OperationalHoursDayDef[] = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
]

export interface OperationalHoursDayValue {
  day: OperationalHoursDayKey
  open: OperationalHoursTimeOption | null
  close: OperationalHoursTimeOption | null
}

export interface OperationalHoursData {
  days: OperationalHoursDayValue[]
}

export function createEmptyOperationalHours(): OperationalHoursData {
  return {
    days: OPERATIONAL_HOURS_DAYS.map((d) => ({
      day: d.key,
      open: null,
      close: null,
    })),
  }
}

function isDayKey(value: string): value is OperationalHoursDayKey {
  return OPERATIONAL_HOURS_DAYS.some((d) => d.key === value)
}

function normalizeTime(raw: unknown): OperationalHoursTimeOption | null {
  if (raw === null || raw === undefined || raw === '') {
    return null
  }
  if (typeof raw !== 'string') {
    return null
  }
  return OPERATIONAL_HOURS_TIME_OPTION_SET.has(raw)
    ? (raw as OperationalHoursTimeOption)
    : null
}

/** Normalize API/form payload into a complete weekly schedule (nulls for empty). */
export function normalizeOperationalHours(input: unknown): OperationalHoursData {
  const empty = createEmptyOperationalHours()
  if (input == null || input === '') {
    return empty
  }

  let daysInput: unknown[] | null = null
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input) as unknown
      if (parsed && typeof parsed === 'object' && Array.isArray((parsed as OperationalHoursData).days)) {
        daysInput = (parsed as OperationalHoursData).days
      }
    } catch {
      return empty
    }
  } else if (typeof input === 'object' && Array.isArray((input as OperationalHoursData).days)) {
    daysInput = (input as OperationalHoursData).days
  }

  if (!daysInput) {
    return empty
  }

  const byDay = new Map<OperationalHoursDayKey, OperationalHoursDayValue>()
  for (const row of daysInput) {
    if (!row || typeof row !== 'object') {
      continue
    }
    const day = (row as { day?: unknown }).day
    if (typeof day !== 'string' || !isDayKey(day)) {
      continue
    }
    byDay.set(day, {
      day,
      open: normalizeTime((row as { open?: unknown }).open),
      close: normalizeTime((row as { close?: unknown }).close),
    })
  }

  return {
    days: empty.days.map((row) => byDay.get(row.day) ?? row),
  }
}

/** Payload suitable for API (always complete week). */
export function serializeOperationalHours(
  data: OperationalHoursData | null | undefined,
): OperationalHoursData {
  return normalizeOperationalHours(data ?? createEmptyOperationalHours())
}

/** Convert a clock option to minutes from midnight. "24 Hours" returns null. */
export function operationalHoursTimeToMinutes(
  value: OperationalHoursTimeOption | null | undefined,
): number | null {
  if (!value || value === '24 Hours') {
    return null
  }
  const match = /^(\d{1,2})(am|pm)$/.exec(value)
  if (!match) {
    return null
  }
  let hour = Number(match[1])
  const meridiem = match[2]
  if (meridiem === 'am') {
    if (hour === 12) {
      hour = 0
    }
  } else if (hour !== 12) {
    hour += 12
  }
  return hour * 60
}

/**
 * Open must be strictly before Close when both are clock times.
 * "24 Hours" is valid only when both Open and Close are "24 Hours".
 * Incomplete days (missing Open or Close) are allowed.
 */
export function isOperationalHoursDayValid(day: OperationalHoursDayValue): boolean {
  const { open, close } = day
  if (!open || !close) {
    return true
  }
  if (open === '24 Hours' || close === '24 Hours') {
    return open === '24 Hours' && close === '24 Hours'
  }
  const openMinutes = operationalHoursTimeToMinutes(open)
  const closeMinutes = operationalHoursTimeToMinutes(close)
  if (openMinutes === null || closeMinutes === null) {
    return true
  }
  return openMinutes < closeMinutes
}

export function getInvalidOperationalHoursDays(
  data: OperationalHoursData | null | undefined,
): OperationalHoursDayKey[] {
  const normalized = normalizeOperationalHours(data)
  return normalized.days.filter((day) => !isOperationalHoursDayValid(day)).map((day) => day.day)
}

export function getOperationalHoursValidationError(
  data: OperationalHoursData | null | undefined,
): string | null {
  const invalidKeys = getInvalidOperationalHoursDays(data)
  if (invalidKeys.length === 0) {
    return null
  }
  const labels = invalidKeys.map(
    (key) => OPERATIONAL_HOURS_DAYS.find((d) => d.key === key)?.label ?? key,
  )
  return `Open must be before Close for: ${labels.join(', ')}`
}

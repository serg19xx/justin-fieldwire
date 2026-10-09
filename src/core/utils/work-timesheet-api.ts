import { api } from './api'

export interface WorkerTimesheetEntry {
  project_id: number
  project_name: string | null
  project_address: string | null
  task_id: number
  task_name: string | null
  task_address: string | null
  /** Planned time of day from the task ("08:00"); tasks have no clock in/out. */
  scheduled_start: string | null
  scheduled_end: string | null
  scheduled_hours: number | null
}

/** Day-level Start day / End day (one pair per worker per calendar day). */
export interface WorkerDayWork {
  work_date: string
  work_start_at: string | null
  work_end_at: string | null
  /** Paid hours: span between start and end minus the unpaid break. */
  hours: number | null
  break_hours: number
}

export interface WorkerTimesheetDay {
  work_date: string
  day_work: WorkerDayWork | null
  entries: WorkerTimesheetEntry[]
  hours: number
}

export interface WorkerTimesheetMonth {
  year: number
  month: number
  from: string
  to: string
  days: WorkerTimesheetDay[]
  total_hours: number
}

function readEnvelopeData<T>(payload: unknown): T | null {
  if (payload == null || typeof payload !== 'object') return null
  const root = payload as Record<string, unknown>
  if (root.data != null && typeof root.data === 'object') {
    return root.data as T
  }
  return payload as T
}

function pickNullableString(raw: unknown): string | null {
  if (raw == null) return null
  const s = String(raw).trim()
  return s === '' ? null : s
}

function pickNullableNumber(raw: unknown): number | null {
  if (raw == null || raw === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function mapEntry(raw: Record<string, unknown>): WorkerTimesheetEntry {
  return {
    project_id: Number(raw.project_id) || 0,
    project_name: pickNullableString(raw.project_name),
    project_address: pickNullableString(raw.project_address),
    task_id: Number(raw.task_id) || 0,
    task_name: pickNullableString(raw.task_name),
    task_address: pickNullableString(raw.task_address),
    scheduled_start: pickNullableString(raw.scheduled_start),
    scheduled_end: pickNullableString(raw.scheduled_end),
    scheduled_hours: pickNullableNumber(raw.scheduled_hours),
  }
}

function mapDayWork(raw: unknown): WorkerDayWork | null {
  if (raw == null || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  return {
    work_date: String(r.work_date ?? ''),
    work_start_at: pickNullableString(r.work_start_at),
    work_end_at: pickNullableString(r.work_end_at),
    hours: pickNullableNumber(r.hours),
    break_hours: pickNullableNumber(r.break_hours) ?? 0,
  }
}

function mapDay(raw: Record<string, unknown>): WorkerTimesheetDay {
  const entriesRaw = Array.isArray(raw.entries) ? raw.entries : []
  return {
    work_date: String(raw.work_date ?? ''),
    day_work: mapDayWork(raw.day_work),
    hours: pickNullableNumber(raw.hours) ?? 0,
    entries: entriesRaw
      .filter((e): e is Record<string, unknown> => e != null && typeof e === 'object')
      .map(mapEntry),
  }
}

/**
 * Read-only monthly timesheet from Gantt plan + task day-work actuals (worker app).
 */
export async function fetchMyWorkTimesheet(
  year: number,
  month: number,
): Promise<WorkerTimesheetMonth> {
  const response = await api.get('/api/v1/me/work-timesheet', {
    params: { year, month },
  })
  const data = readEnvelopeData<Record<string, unknown>>(response.data)
  if (!data) {
    return { year, month, from: '', to: '', days: [], total_hours: 0 }
  }
  const daysRaw = Array.isArray(data.days) ? data.days : []
  return {
    year: Number(data.year) || year,
    month: Number(data.month) || month,
    from: String(data.from ?? ''),
    to: String(data.to ?? ''),
    total_hours: pickNullableNumber(data.total_hours) ?? 0,
    days: daysRaw
      .filter((d): d is Record<string, unknown> => d != null && typeof d === 'object')
      .map(mapDay),
  }
}

export interface WorkerDayStatus {
  today: string
  day_work: WorkerDayWork | null
}

export async function fetchMyWorkDay(workDateYmd?: string): Promise<WorkerDayStatus> {
  const response = await api.get('/api/v1/me/work-day', {
    params: workDateYmd ? { work_date: workDateYmd } : {},
  })
  const data = readEnvelopeData<Record<string, unknown>>(response.data)
  return {
    today: String(data?.today ?? ''),
    day_work: mapDayWork(data?.day_work),
  }
}

/** Location is optional; the API records the punch without it. */
export async function checkInMyWorkDay(
  workDateYmd: string,
  phase: 'start' | 'end',
  position: { lat: number; lng: number } | null,
): Promise<WorkerDayWork> {
  const response = await api.post('/api/v1/me/work-day/check-in', {
    work_date: workDateYmd,
    phase,
    ...(position ? { lat: position.lat, lng: position.lng } : {}),
  })
  const data = readEnvelopeData<Record<string, unknown>>(response.data)
  const dayWork = mapDayWork(data?.day_work)
  if (!dayWork) throw new Error('Invalid work day response')
  return dayWork
}

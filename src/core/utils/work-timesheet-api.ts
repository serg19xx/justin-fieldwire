import { api } from './api'

export interface WorkerTimesheetEntry {
  project_id: number
  project_name: string | null
  project_address: string | null
  task_id: number
  task_name: string | null
  task_address: string | null
  work_start_at: string | null
  work_end_at: string | null
  hours: number | null
  has_actual: boolean
}

export interface WorkerTimesheetDay {
  work_date: string
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
    work_start_at: pickNullableString(raw.work_start_at),
    work_end_at: pickNullableString(raw.work_end_at),
    hours: pickNullableNumber(raw.hours),
    has_actual: Boolean(raw.has_actual),
  }
}

function mapDay(raw: Record<string, unknown>): WorkerTimesheetDay {
  const entriesRaw = Array.isArray(raw.entries) ? raw.entries : []
  return {
    work_date: String(raw.work_date ?? ''),
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

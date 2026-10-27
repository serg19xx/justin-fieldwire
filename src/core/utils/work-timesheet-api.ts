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
  has_start_photo: boolean
  has_end_photo: boolean
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
    has_start_photo: r.has_start_photo === true,
    has_end_photo: r.has_end_photo === true,
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

/** The on-site photo is required; location is optional and the API records the punch without it. */
export async function checkInMyWorkDay(
  workDateYmd: string,
  phase: 'start' | 'end',
  position: { lat: number; lng: number } | null,
  photo: File,
): Promise<WorkerDayWork> {
  const form = new FormData()
  form.append('work_date', workDateYmd)
  form.append('phase', phase)
  form.append('photo', photo)
  if (position) {
    form.append('lat', String(position.lat))
    form.append('lng', String(position.lng))
  }
  const response = await api.post('/api/v1/me/work-day/check-in', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  const data = readEnvelopeData<Record<string, unknown>>(response.data)
  const dayWork = mapDayWork(data?.day_work)
  if (!dayWork) throw new Error('Invalid work day response')
  return dayWork
}

/** Start day / End day photo of a worker (self, admin or PM). */
export async function fetchWorkDayPhoto(
  userId: number,
  workDateYmd: string,
  phase: 'start' | 'end',
): Promise<Blob> {
  const response = await api.get(`/api/v1/users/${userId}/work-day/${workDateYmd}/photo/${phase}`, {
    responseType: 'blob',
  })
  return response.data as Blob
}

/** One destination from the published PM Schedule. */
export interface WorkWeekSlot {
  entry_id: number
  project_id: number
  project_name: string | null
  project_address: string | null
  work_date: string
  day_part: 'am' | 'pm' | 'full'
  assignment_note: string | null
  distance_km: string | null
  expected_start_time: string | null
  expected_end_time: string | null
}

export interface WorkWeekDay {
  work_date: string
  slots: WorkWeekSlot[]
  day_work: WorkerDayWork | null
  scheduled_hours: number
  worked_hours: number
  km: number
}

export interface WorkWeek {
  week_start: string
  week_end: string
  today: string
  break_hours: number
  days: WorkWeekDay[]
  totals: { scheduled_hours: number; worked_hours: number; km: number }
}

function mapWeekSlot(raw: Record<string, unknown>): WorkWeekSlot {
  const part = String(raw.day_part ?? 'full')
  return {
    entry_id: Number(raw.entry_id) || 0,
    project_id: Number(raw.project_id) || 0,
    project_name: pickNullableString(raw.project_name),
    project_address: pickNullableString(raw.project_address),
    work_date: String(raw.work_date ?? ''),
    day_part: part === 'am' || part === 'pm' ? part : 'full',
    assignment_note: pickNullableString(raw.assignment_note),
    distance_km: pickNullableString(raw.distance_km),
    expected_start_time: pickNullableString(raw.expected_start_time),
    expected_end_time: pickNullableString(raw.expected_end_time),
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object'
}

/** Published PM Schedule for one week (Monday..Sunday) with punches and weekly totals. */
export async function fetchMyWorkWeek(weekStartYmd?: string): Promise<WorkWeek> {
  const response = await api.get('/api/v1/me/work-week', {
    params: weekStartYmd ? { week_start: weekStartYmd } : {},
  })
  const data = readEnvelopeData<Record<string, unknown>>(response.data) ?? {}
  const totals = isRecord(data.totals) ? data.totals : {}
  const days = Array.isArray(data.days) ? data.days.filter(isRecord) : []
  return {
    week_start: String(data.week_start ?? ''),
    week_end: String(data.week_end ?? ''),
    today: String(data.today ?? ''),
    break_hours: pickNullableNumber(data.break_hours) ?? 0,
    totals: {
      scheduled_hours: pickNullableNumber(totals.scheduled_hours) ?? 0,
      worked_hours: pickNullableNumber(totals.worked_hours) ?? 0,
      km: pickNullableNumber(totals.km) ?? 0,
    },
    days: days.map((d) => ({
      work_date: String(d.work_date ?? ''),
      slots: (Array.isArray(d.slots) ? d.slots.filter(isRecord) : []).map(mapWeekSlot),
      day_work: mapDayWork(d.day_work),
      scheduled_hours: pickNullableNumber(d.scheduled_hours) ?? 0,
      worked_hours: pickNullableNumber(d.worked_hours) ?? 0,
      km: pickNullableNumber(d.km) ?? 0,
    })),
  }
}

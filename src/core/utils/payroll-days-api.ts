import { api } from './api'

/** PM payroll review of one worker day: phone punches, PM corrections, note and manual lock. */
export interface PayrollDay {
  user_id: number
  work_date: string
  /** Phone punches (ISO with offset); never changed by the PM. */
  work_start_at: string | null
  work_end_at: string | null
  /** PM-corrected wall-clock times "HH:MM"; override the punches for paid hours. */
  adjusted_start_time: string | null
  adjusted_end_time: string | null
  /** Paid hours from the effective times minus the unpaid break. */
  hours: number | null
  has_start_photo: boolean
  has_end_photo: boolean
  payroll_note: string | null
  locked: boolean
  locked_at: string | null
}

export interface PayrollDayInput {
  adjusted_start_time: string | null
  adjusted_end_time: string | null
  payroll_note: string | null
}

function pickNullableString(raw: unknown): string | null {
  if (raw == null) return null
  const s = String(raw).trim()
  return s === '' ? null : s
}

function mapPayrollDay(raw: Record<string, unknown>): PayrollDay {
  const hours = raw.hours == null || raw.hours === '' ? null : Number(raw.hours)
  return {
    user_id: Number(raw.user_id) || 0,
    work_date: String(raw.work_date ?? '').slice(0, 10),
    work_start_at: pickNullableString(raw.work_start_at),
    work_end_at: pickNullableString(raw.work_end_at),
    adjusted_start_time: pickNullableString(raw.adjusted_start_time),
    adjusted_end_time: pickNullableString(raw.adjusted_end_time),
    hours: hours != null && Number.isFinite(hours) ? hours : null,
    has_start_photo: raw.has_start_photo === true,
    has_end_photo: raw.has_end_photo === true,
    payroll_note: pickNullableString(raw.payroll_note),
    locked: raw.locked === true,
    locked_at: pickNullableString(raw.locked_at),
  }
}

function dayFromResponse(payload: unknown): PayrollDay {
  const data = (payload as { data?: { day?: Record<string, unknown> } } | null)?.data
  return mapPayrollDay(data?.day ?? {})
}

export async function fetchPayrollDays(userId: number, from: string, to: string): Promise<PayrollDay[]> {
  const res = await api.get(`/api/v1/users/${userId}/payroll-days`, { params: { from, to } })
  const days = (res.data as { data?: { days?: unknown } } | null)?.data?.days
  if (!Array.isArray(days)) return []
  return days
    .filter((d): d is Record<string, unknown> => d != null && typeof d === 'object')
    .map(mapPayrollDay)
}

export async function savePayrollDay(userId: number, workDate: string, input: PayrollDayInput): Promise<PayrollDay> {
  const res = await api.put(`/api/v1/users/${userId}/payroll-days/${workDate}`, input)
  return dayFromResponse(res.data)
}

export async function setPayrollDayLocked(userId: number, workDate: string, locked: boolean): Promise<PayrollDay> {
  const res = await api.post(`/api/v1/users/${userId}/payroll-days/${workDate}/${locked ? 'lock' : 'unlock'}`)
  return dayFromResponse(res.data)
}

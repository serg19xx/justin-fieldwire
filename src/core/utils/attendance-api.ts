import { api } from './api'
import { mapPayrollDay, type PayrollDay } from './payroll-days-api'
import { mapWorkDaySite, type WorkDaySite } from './work-timesheet-api'

export type AttendanceIssueCode =
  | 'no_start'
  | 'late_start'
  | 'auto_closed'
  | 'no_end'
  | 'working_late'
  | 'early_leave'
  | 'overtime'
  | 'site_unconfirmed'

export interface AttendanceIssue {
  code: AttendanceIssueCode
  label: string
}

/** One worker-day in the PM attendance review. */
export interface AttendanceEntry {
  user_id: number
  worker_name: string
  work_date: string
  shift: { start_time: string; end_time: string; source: 'schedule' | 'tasks' } | null
  day: PayrollDay | null
  sites: WorkDaySite[]
  issues: AttendanceIssue[]
}

export interface AttendanceReport {
  today: string
  attendance_available: boolean
  entries: AttendanceEntry[]
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object'
}

function mapEntry(raw: Record<string, unknown>): AttendanceEntry {
  const shift = isRecord(raw.shift) ? raw.shift : null
  return {
    user_id: Number(raw.user_id) || 0,
    worker_name: String(raw.worker_name ?? ''),
    work_date: String(raw.work_date ?? '').slice(0, 10),
    shift: shift
      ? {
          start_time: String(shift.start_time ?? ''),
          end_time: String(shift.end_time ?? ''),
          source: shift.source === 'tasks' ? 'tasks' : 'schedule',
        }
      : null,
    day: isRecord(raw.day) ? mapPayrollDay(raw.day) : null,
    sites: Array.isArray(raw.sites) ? raw.sites.filter(isRecord).map(mapWorkDaySite) : [],
    issues: Array.isArray(raw.issues)
      ? raw.issues.filter(isRecord).map((i) => ({
          code: String(i.code ?? '') as AttendanceIssueCode,
          label: String(i.label ?? ''),
        }))
      : [],
  }
}

export async function fetchAttendance(from: string, to: string): Promise<AttendanceReport> {
  const res = await api.get('/api/v1/attendance', { params: { from, to } })
  const data = (res.data as { data?: Record<string, unknown> } | null)?.data ?? {}
  return {
    today: String(data.today ?? ''),
    attendance_available: data.attendance_available === true,
    entries: Array.isArray(data.entries) ? data.entries.filter(isRecord).map(mapEntry) : [],
  }
}

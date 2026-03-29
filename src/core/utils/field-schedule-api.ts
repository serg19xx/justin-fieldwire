import { api } from './api'
import type { FieldScheduleByDate } from '@/core/types/field-schedule'
import {
  mergeSlot,
  pickRange,
  readLocalFieldSchedule,
} from './field-schedule-storage'

/**
 * Load field schedule for the current user in [fromYmd, toYmd] (inclusive).
 * Tries GET /api/v1/me/field-schedule; falls back to localStorage.
 */
export async function fetchMyFieldSchedule(
  userId: number,
  fromYmd: string,
  toYmd: string,
): Promise<FieldScheduleByDate> {
  try {
    const res = await api.get('/api/v1/me/field-schedule', {
      params: { from: fromYmd, to: toYmd },
    })
    const body = res.data as Record<string, unknown>
    const inner = (body?.data as Record<string, unknown> | undefined) ?? body
    const assignments = inner?.assignments
    if (assignments && typeof assignments === 'object' && !Array.isArray(assignments)) {
      return pickRange(assignments as FieldScheduleByDate, fromYmd, toYmd)
    }
    if (Array.isArray(assignments)) {
      return arrayAssignmentsToRecord(assignments as Array<Record<string, unknown>>, fromYmd, toYmd)
    }
  } catch {
    /* local fallback */
  }
  return pickRange(readLocalFieldSchedule(userId), fromYmd, toYmd)
}

function arrayAssignmentsToRecord(
  rows: Array<Record<string, unknown>>,
  fromYmd: string,
  toYmd: string,
): FieldScheduleByDate {
  const out: FieldScheduleByDate = {}
  for (const row of rows) {
    const date = String(row.date ?? row.day ?? '').slice(0, 10)
    if (!date || date < fromYmd || date > toYmd) continue
    const part = String(row.slot ?? row.part ?? 'am').toLowerCase()
    const pid = row.project_id ?? row.projectId
    const n = Number(pid)
    if (!out[date]) out[date] = {}
    if (part === 'pm') {
      out[date].pm = Number.isFinite(n) && n > 0 ? { project_id: n } : null
    } else if (part === 'full') {
      out[date].full = Number.isFinite(n) && n > 0 ? { project_id: n } : null
    } else {
      out[date].am = Number.isFinite(n) && n > 0 ? { project_id: n } : null
    }
  }
  return out
}

/**
 * Persist one slot; updates localStorage and tries PUT/PATCH against backend if present.
 */
export async function persistFieldScheduleSlot(
  userId: number,
  dateYmd: string,
  part: 'am' | 'pm' | 'full',
  projectId: number | null,
): Promise<FieldScheduleByDate> {
  const merged = mergeSlot(userId, dateYmd, part, projectId)
  try {
    await api.put('/api/v1/me/field-schedule', {
      date: dateYmd,
      slot: part,
      project_id: projectId,
    })
  } catch {
    /* local-only mode */
  }
  return pickRange(merged, dateYmd, dateYmd)
}

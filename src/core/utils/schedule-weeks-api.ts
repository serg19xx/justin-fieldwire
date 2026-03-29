import { api } from './api'

export type ScheduleDayPart = 'am' | 'pm' | 'full'

export interface MyScheduleTaskSummary {
  id: number
  name: string
  project_id: number
  status: string
}

export interface MyScheduleEntry {
  id: number
  project_id: number
  user_id?: number
  schedule_week_id?: number
  task_id: number
  work_date: string
  day_part: ScheduleDayPart
  task?: MyScheduleTaskSummary
  /** Project display name (e.g. prj_name); optional for /me/schedule compatibility */
  project_name?: string
}

export interface ScheduleWeekMeta {
  id: number
  project_id: number
  week_start: string
  status: 'draft' | 'published'
  published_at: string | null
  published_by: number | null
}

export interface ScheduleWeekEntryRow {
  id?: number
  user_id: number
  task_id: number
  work_date: string
  day_part: ScheduleDayPart
}

function readEnvelopeData<T>(body: unknown): T | null {
  if (body == null || typeof body !== 'object') return null
  const o = body as Record<string, unknown>
  if ('data' in o && o.data != null && typeof o.data === 'object') {
    return o.data as T
  }
  return null
}

/**
 * Schedule week responses should nest payload in `data`, but some backends return
 * `{ status, message }` on POST (e.g. "already exists") or put `week` at the root.
 */
function readScheduleWeekPayload(body: unknown): Record<string, unknown> | null {
  const nested = readEnvelopeData<Record<string, unknown>>(body)
  if (nested != null) return nested
  if (body != null && typeof body === 'object' && !Array.isArray(body)) {
    const o = body as Record<string, unknown>
    if ('week' in o || 'schedule_week' in o || 'entries' in o) return o
  }
  return null
}

/**
 * Published schedule slots for the current user (see docs/SCHEDULE_WEEKS_API.md).
 */
export async function fetchMySchedule(from: string, to: string): Promise<MyScheduleEntry[]> {
  const response = await api.get('/api/v1/me/schedule', { params: { from, to } })
  const data = readEnvelopeData<{ entries?: MyScheduleEntry[] }>(response.data)
  return Array.isArray(data?.entries) ? data.entries : []
}

/**
 * Published schedule slots for a user across all projects (RBAC: admin/PM or shared project team).
 * Same entry shape as /me/schedule; see docs/SCHEDULE_WEEKS_API.md.
 */
export async function fetchUserSchedule(
  userId: number,
  from: string,
  to: string,
): Promise<MyScheduleEntry[]> {
  if (userId <= 0) return []
  const response = await api.get(`/api/v1/users/${userId}/schedule`, {
    params: { from, to },
  })
  const data = readEnvelopeData<{ entries?: MyScheduleEntry[] }>(response.data)
  return Array.isArray(data?.entries) ? data.entries : []
}

export interface ProjectScheduleWeekResponse {
  week: ScheduleWeekMeta | null
  entries: ScheduleWeekEntryRow[]
}

function normalizeWeekResponse(raw: Record<string, unknown>): ProjectScheduleWeekResponse {
  const weekRaw = raw.week ?? raw.schedule_week
  let week: ScheduleWeekMeta | null = null
  if (weekRaw != null && typeof weekRaw === 'object' && !Array.isArray(weekRaw)) {
    const w = weekRaw as Record<string, unknown>
    week = {
      id: Number(w.id),
      project_id: Number(w.project_id),
      week_start: String(w.week_start ?? ''),
      status: w.status === 'published' ? 'published' : 'draft',
      published_at: w.published_at != null ? String(w.published_at) : null,
      published_by: w.published_by != null ? Number(w.published_by) : null,
    }
  }
  const entriesRaw = raw.entries
  const entries: ScheduleWeekEntryRow[] = []
  if (Array.isArray(entriesRaw)) {
    for (const row of entriesRaw) {
      if (row == null || typeof row !== 'object') continue
      const e = row as Record<string, unknown>
      entries.push({
        id: e.id != null ? Number(e.id) : undefined,
        user_id: Number(e.user_id),
        task_id: Number(e.task_id),
        work_date: String(e.work_date ?? ''),
        day_part: (String(e.day_part ?? 'am') as ScheduleDayPart) || 'am',
      })
    }
  }
  return { week, entries }
}

/**
 * GET project week + entries (team read or PM).
 */
export async function fetchProjectScheduleWeek(
  projectId: number,
  weekStartYmd: string,
): Promise<ProjectScheduleWeekResponse> {
  const response = await api.get(`/api/v1/projects/${projectId}/schedule-weeks`, {
    params: { week_start: weekStartYmd },
  })
  const data = readScheduleWeekPayload(response.data)
  if (data == null) return { week: null, entries: [] }
  return normalizeWeekResponse(data)
}

/**
 * POST create or return draft week.
 */
export async function ensureProjectScheduleDraft(
  projectId: number,
  weekStartYmd: string,
): Promise<ProjectScheduleWeekResponse> {
  const response = await api.post(`/api/v1/projects/${projectId}/schedule-weeks`, {
    week_start: weekStartYmd,
  })
  const data = readScheduleWeekPayload(response.data)
  let out: ProjectScheduleWeekResponse =
    data != null ? normalizeWeekResponse(data) : { week: null, entries: [] }
  // Backend may return 200 + message only ("already exists") without `data.week`; reload via GET.
  if (out.week == null) {
    out = await fetchProjectScheduleWeek(projectId, weekStartYmd)
  }
  return out
}

/**
 * Replace all slots for a draft week.
 */
export async function replaceProjectScheduleEntries(
  projectId: number,
  weekId: number,
  entries: Omit<ScheduleWeekEntryRow, 'id'>[],
): Promise<ProjectScheduleWeekResponse> {
  const response = await api.put(`/api/v1/projects/${projectId}/schedule-weeks/${weekId}/entries`, {
    entries,
  })
  const data = readScheduleWeekPayload(response.data)
  if (data == null) return { week: null, entries: [] }
  return normalizeWeekResponse(data)
}

export async function publishProjectScheduleWeek(projectId: number, weekId: number): Promise<ScheduleWeekMeta | null> {
  const response = await api.post(`/api/v1/projects/${projectId}/schedule-weeks/${weekId}/publish`, {})
  const data = readEnvelopeData<{ week?: ScheduleWeekMeta }>(response.data)
  return data?.week ?? null
}

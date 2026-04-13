import axios from 'axios'
import { api } from './api'
import { weekStartMondayYmdFromIsoDate } from './week-utils'

export type ScheduleDayPart = 'am' | 'pm' | 'full'

/** Matches DB `assignment_note` VARCHAR(2000) */
export const ASSIGNMENT_NOTE_MAX_CHARS = 2000

export interface MyScheduleTaskSummary {
  id: number
  name: string
  project_id: number
  status: string
  /** Work site when API embeds task row (same as task.address) */
  address?: string
}

export interface MyScheduleEntry {
  /**
   * List / card identity: prefers the real `worker_task_schedules.id` when the API
   * exposes it; otherwise falls back to `id` from the payload (often a snapshot /
   * view row — not valid for the messages API).
   */
  id: number
  /**
   * Same id as `data.entries[].id` on GET/PUT project schedule-weeks — required for
   * `/schedule-entries/{id}/messages`. Zero when `/me/schedule` only returns a
   * snapshot row id and omits `worker_task_schedule_id` (or equivalent); do not call
   * the messages API in that case.
   */
  scheduleRowIdForMessages: number
  project_id: number
  user_id?: number
  schedule_week_id?: number
  task_id: number
  work_date: string
  day_part: ScheduleDayPart
  /** PM instruction for this slot (nullable) */
  assignment_note?: string | null
  task?: MyScheduleTaskSummary
  /** Project display name (e.g. prj_name); optional for /me/schedule compatibility */
  project_name?: string
}

/**
 * Resolves **fw_worker_task_schedules.id** from /me/schedule rows.
 * - Prefer `worker_task_schedule_id` only for the canonical FK name.
 * - Other aliases are fallback; if a value equals `schedule_week_id`, ignore it — backends
 *   often mistakenly put the **week** PK (e.g. 42) into `schedule_entry_id` / `worker_schedule_id`.
 * - Omits ambiguous `worker_schedule_id` (confusable with `schedule_week_id`).
 * - Does not use generic `id` (snapshot / view row).
 */
function pickExplicitWorkerTaskScheduleRowId(row: Record<string, unknown>): number {
  const swRaw = row.schedule_week_id
  const weekFk = swRaw != null ? Number(swRaw) : NaN
  const weekFkNorm = Number.isFinite(weekFk) && weekFk > 0 ? weekFk : 0

  const primary = ['worker_task_schedule_id', 'workerTaskScheduleId'] as const
  for (const k of primary) {
    const n = Number(row[k])
    if (Number.isFinite(n) && n > 0) return n
  }

  const secondary = [
    'schedule_entry_id',
    'scheduleEntryId',
    'schedule_week_entry_id',
    'scheduleWeekEntryId',
  ] as const
  for (const k of secondary) {
    const n = Number(row[k])
    if (!Number.isFinite(n) || n <= 0) continue
    if (weekFkNorm > 0 && n === weekFkNorm) continue
    return n
  }
  return 0
}

function pickSnapshotOrCorrelationId(row: Record<string, unknown>): number {
  const n = Number(row.id)
  return Number.isFinite(n) && n > 0 ? n : 0
}

function normalizeMyScheduleEntry(raw: unknown): MyScheduleEntry | null {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return null
  const r = raw as Record<string, unknown>
  const scheduleRowIdForMessages = pickExplicitWorkerTaskScheduleRowId(r)
  const snap = pickSnapshotOrCorrelationId(r)
  const id = scheduleRowIdForMessages > 0 ? scheduleRowIdForMessages : snap
  const project_id = Number(r.project_id)
  if (!Number.isFinite(project_id) || project_id <= 0) return null
  const task_id = Number(r.task_id)
  if (!Number.isFinite(task_id) || task_id <= 0) return null
  const work_date = String(r.work_date ?? '').trim()
  if (!work_date) return null
  const dp = String(r.day_part ?? 'am').toLowerCase()
  const day_part: ScheduleDayPart =
    dp === 'pm' || dp === 'full' ? (dp as ScheduleDayPart) : 'am'
  const uidNum = r.user_id != null ? Number(r.user_id) : NaN
  const user_id = Number.isFinite(uidNum) && uidNum > 0 ? uidNum : undefined
  const swNum = r.schedule_week_id != null ? Number(r.schedule_week_id) : NaN
  const schedule_week_id = Number.isFinite(swNum) && swNum > 0 ? swNum : undefined
  const an = r.assignment_note
  const assignment_note: string | null = typeof an === 'string' ? an : null
  const pn = r.project_name ?? r.projectName
  const project_name = typeof pn === 'string' ? pn : undefined

  let task: MyScheduleTaskSummary | undefined
  const t = r.task
  if (t != null && typeof t === 'object' && !Array.isArray(t)) {
    const o = t as Record<string, unknown>
    const tid = Number(o.id)
    if (Number.isFinite(tid) && tid > 0) {
      task = {
        id: tid,
        name: String(o.name ?? '').trim() || `Task #${tid}`,
        project_id: Number(o.project_id) > 0 ? Number(o.project_id) : project_id,
        status: String(o.status ?? ''),
        address: typeof o.address === 'string' ? o.address : undefined,
      }
    }
  }

  return {
    id,
    scheduleRowIdForMessages,
    project_id,
    user_id,
    schedule_week_id,
    task_id,
    work_date,
    day_part,
    assignment_note,
    task,
    project_name,
  }
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
  /** PM instruction for this slot; empty / omitted → null on save */
  assignment_note?: string | null
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
  const data = readEnvelopeData<{ entries?: unknown[] }>(response.data)
  const list = Array.isArray(data?.entries) ? data.entries : []
  const out: MyScheduleEntry[] = []
  for (const item of list) {
    const e = normalizeMyScheduleEntry(item)
    if (e != null && e.id > 0) out.push(e)
  }
  return out
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
  const data = readEnvelopeData<{ entries?: unknown[] }>(response.data)
  const list = Array.isArray(data?.entries) ? data.entries : []
  const out: MyScheduleEntry[] = []
  for (const item of list) {
    const e = normalizeMyScheduleEntry(item)
    if (e != null && e.id > 0) out.push(e)
  }
  return out
}

function myScheduleEntryWorkYmd(e: MyScheduleEntry): string {
  const w = e.work_date
  return typeof w === 'string' && w.length >= 10 ? w.slice(0, 10) : String(w ?? '')
}

function sliceWorkYmd(workDate: string): string {
  return workDate.length >= 10 ? workDate.slice(0, 10) : workDate
}

/**
 * When several `entries[]` rows match the same slot key, `Array.find` order is arbitrary.
 * Messages are stored by `worker_task_schedules.id`; pick the **lowest** matching PK so we
 * align with the canonical row when the API returns duplicates or reordering (e.g. 40 vs 42).
 */
function pickWeekEntryIdForSlot(
  rows: ScheduleWeekEntryRow[],
  currentUserId: number,
  taskId: number,
  workYmd: string,
  dayPart: ScheduleDayPart,
): number {
  const uid = Number(currentUserId)
  const tid = Number(taskId)
  const candidates = rows.filter(
    (r) =>
      Number(r.user_id) === uid &&
      Number(r.task_id) === tid &&
      sliceWorkYmd(r.work_date) === workYmd &&
      r.day_part === dayPart,
  )
  const ids = candidates
    .map((r) => r.id)
    .filter((id): id is number => id != null && Number.isFinite(id) && id > 0)
  if (ids.length === 0) return 0
  ids.sort((a, b) => a - b)
  return ids[0]!
}

/** Same rule as `resolveScheduleSlotIdForMessages` but uses an already-fetched `entries` list (e.g. PM tree). */
export function resolveScheduleSlotIdFromWeekEntries(
  rows: ScheduleWeekEntryRow[],
  workerUserId: number,
  taskId: number,
  workDateYmd: string,
  dayPart: ScheduleDayPart,
): number {
  const ymd = workDateYmd.length >= 10 ? workDateYmd.slice(0, 10) : workDateYmd
  return pickWeekEntryIdForSlot(rows, workerUserId, taskId, ymd, dayPart)
}

export interface ProjectScheduleWeekResponse {
  week: ScheduleWeekMeta | null
  entries: ScheduleWeekEntryRow[]
}

/**
 * Worker account id for a schedule entry. APIs may use `user_id`, camelCase, or nest `user.id`.
 */
export function normalizeScheduleWeekEntryUserId(e: Record<string, unknown>): number {
  const flatKeys = [
    'user_id',
    'userId',
    'worker_user_id',
    'workerUserId',
    'assignee_user_id',
    'assigneeUserId',
  ] as const
  for (const k of flatKeys) {
    const n = Number(e[k])
    if (Number.isFinite(n) && n > 0) return n
  }
  const u = e.user
  if (u != null && typeof u === 'object' && !Array.isArray(u)) {
    const o = u as Record<string, unknown>
    for (const k of ['id', 'user_id', 'userId'] as const) {
      const n = Number(o[k])
      if (Number.isFinite(n) && n > 0) return n
    }
  }
  return 0
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
      const n = e.assignment_note
      const assignment_note: string | null = typeof n === 'string' ? n : null
      entries.push({
        id: e.id != null ? Number(e.id) : undefined,
        user_id: normalizeScheduleWeekEntryUserId(e),
        task_id: Number(e.task_id),
        work_date: String(e.work_date ?? ''),
        day_part: (String(e.day_part ?? 'am') as ScheduleDayPart) || 'am',
        assignment_note,
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
 * Canonical slot PK for schedule-entry messages — same source as PM (`entries[].id` from
 * GET schedule-weeks). Matches by worker user, task, calendar date, and day_part so PM and
 * worker hit the same `fw_worker_task_schedules.id` for one logical slot.
 */
export async function resolveScheduleSlotIdForMessages(
  projectId: number,
  workerUserId: number,
  taskId: number,
  workDateYmd: string,
  dayPart: ScheduleDayPart,
): Promise<number> {
  if (
    projectId <= 0 ||
    workerUserId <= 0 ||
    !Number.isFinite(taskId) ||
    taskId <= 0 ||
    workDateYmd.length < 10
  ) {
    return 0
  }
  const ymd = workDateYmd.slice(0, 10)
  const mon = weekStartMondayYmdFromIsoDate(ymd)
  try {
    const { entries } = await fetchProjectScheduleWeek(projectId, mon)
    return pickWeekEntryIdForSlot(entries, workerUserId, taskId, ymd, dayPart)
  } catch {
    return 0
  }
}

/**
 * Sets `scheduleRowIdForMessages` only from GET project `schedule-weeks` (never from
 * `/me/schedule` ids) so strip + chat use the same PK as PM schedule-messages.
 */
export async function enrichMyScheduleEntriesWithWeekEntryIds(
  entries: MyScheduleEntry[],
  currentUserId: number,
): Promise<MyScheduleEntry[]> {
  if (currentUserId <= 0 || entries.length === 0) return entries
  const cache = new Map<string, ScheduleWeekEntryRow[]>()
  async function rowsForProjectWeek(
    projectId: number,
    workYmd: string,
  ): Promise<ScheduleWeekEntryRow[]> {
    const mon = weekStartMondayYmdFromIsoDate(workYmd)
    const key = `${projectId}\0${mon}`
    const hit = cache.get(key)
    if (hit) return hit
    try {
      const { entries: rows } = await fetchProjectScheduleWeek(projectId, mon)
      cache.set(key, rows)
      return rows
    } catch {
      cache.set(key, [])
      return []
    }
  }
  const out: MyScheduleEntry[] = []
  for (const e of entries) {
    const ymd = myScheduleEntryWorkYmd(e)
    const rows = await rowsForProjectWeek(e.project_id, ymd)
    const weekPk = pickWeekEntryIdForSlot(rows, currentUserId, e.task_id, ymd, e.day_part)
    out.push({
      ...e,
      scheduleRowIdForMessages: weekPk > 0 ? weekPk : 0,
    })
  }
  return out
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

function scheduleEntryToApiPayload(
  e: ScheduleWeekEntryRow,
): Pick<ScheduleWeekEntryRow, 'user_id' | 'task_id' | 'work_date' | 'day_part'> & {
  assignment_note: string | null
} {
  const raw = e.assignment_note
  const trimmed = typeof raw === 'string' ? raw.trim() : ''
  return {
    user_id: e.user_id,
    task_id: e.task_id,
    work_date: e.work_date,
    day_part: e.day_part,
    assignment_note: trimmed.length > 0 ? trimmed : null,
  }
}

/**
 * Replace all slots for a draft week.
 */
export async function replaceProjectScheduleEntries(
  projectId: number,
  weekId: number,
  entries: ScheduleWeekEntryRow[],
): Promise<ProjectScheduleWeekResponse> {
  const response = await api.put(`/api/v1/projects/${projectId}/schedule-weeks/${weekId}/entries`, {
    entries: entries.map(scheduleEntryToApiPayload),
  })
  const data = readScheduleWeekPayload(response.data)
  if (data == null) return { week: null, entries: [] }
  return normalizeWeekResponse(data)
}

/**
 * @param weekStartYmdForReload - Monday (or any day) of the week; used to GET refresh if the POST body omits `week`/`schedule_week`.
 */
export async function publishProjectScheduleWeek(
  projectId: number,
  weekId: number,
  weekStartYmdForReload?: string,
): Promise<ScheduleWeekMeta | null> {
  const response = await api.post(`/api/v1/projects/${projectId}/schedule-weeks/${weekId}/publish`, {})
  const raw =
    readScheduleWeekPayload(response.data) ?? readEnvelopeData<Record<string, unknown>>(response.data)
  let week: ScheduleWeekMeta | null = null
  if (raw != null) {
    week = normalizeWeekResponse(raw).week
  }
  if (week == null && weekStartYmdForReload) {
    const reload = await fetchProjectScheduleWeek(projectId, weekStartYmdForReload)
    week = reload.week
  }
  return week
}

/**
 * Turn a published week back into a draft so entries can be edited and re-published.
 * Backend must implement POST .../reopen-as-draft (see docs/SCHEDULE_WEEKS_API.md).
 */
export async function reopenProjectScheduleWeekAsDraft(
  projectId: number,
  weekId: number,
  weekStartYmdForReload?: string,
): Promise<ProjectScheduleWeekResponse> {
  const response = await api.post(
    `/api/v1/projects/${projectId}/schedule-weeks/${weekId}/reopen-as-draft`,
    {},
  )
  const data = readScheduleWeekPayload(response.data)
  let out: ProjectScheduleWeekResponse =
    data != null ? normalizeWeekResponse(data) : { week: null, entries: [] }
  if (out.week == null && weekStartYmdForReload) {
    out = await fetchProjectScheduleWeek(projectId, weekStartYmdForReload)
  }
  return out
}

/** See `docs/SCHEDULE_ENTRY_MESSAGES_FOREMAN_PM.md` */
export type ScheduleEntryMessageChannel = 'foreman' | 'pm'

export const SCHEDULE_ENTRY_MESSAGE_BODY_MAX_CHARS = 4000

/**
 * Normalizes query/body `channel` (trim, strip trailing dots). Backend validation
 * rejects values like `pm.`.
 */
export function sanitizeScheduleEntryMessageChannel(raw: unknown): ScheduleEntryMessageChannel {
  let s = String(raw ?? '').trim()
  while (s.endsWith('.')) s = s.slice(0, -1).trim()
  s = s.toLowerCase()
  if (s === 'pm') return 'pm'
  if (s === 'foreman') return 'foreman'
  throw new Error('Invalid schedule message channel (expected pm or foreman)')
}

export interface ScheduleEntryMessage {
  id: number
  worker_task_schedule_id: number
  channel: ScheduleEntryMessageChannel
  author_user_id: number
  body: string
  created_at: string
  updated_at: string | null
  deleted_at: string | null
}

function normalizeScheduleEntryMessage(
  raw: Record<string, unknown>,
  channelFallback?: ScheduleEntryMessageChannel,
  scheduleEntryIdFallback?: number,
): ScheduleEntryMessage | null {
  const id = Number(raw.id)
  if (!Number.isFinite(id) || id <= 0) return null
  const ch = raw.channel
  const channel: ScheduleEntryMessageChannel | null =
    ch === 'foreman' || ch === 'pm' ? ch : channelFallback ?? null
  if (channel == null) return null
  const widRaw = Number(raw.worker_task_schedule_id ?? raw.workerTaskScheduleId)
  const wid =
    Number.isFinite(widRaw) && widRaw > 0
      ? widRaw
      : scheduleEntryIdFallback != null &&
          Number.isFinite(scheduleEntryIdFallback) &&
          scheduleEntryIdFallback > 0
        ? scheduleEntryIdFallback
        : NaN
  const aidRaw = Number(
    raw.author_user_id ?? raw.authorUserId ?? raw.user_id ?? raw.userId ?? raw.author_id,
  )
  const author_user_id = Number.isFinite(aidRaw) && aidRaw > 0 ? aidRaw : 0
  const body = typeof raw.body === 'string' ? raw.body : ''
  if (!Number.isFinite(wid) || wid <= 0) return null
  return {
    id,
    worker_task_schedule_id: wid,
    channel,
    author_user_id,
    body,
    created_at: (() => {
      const ca = raw.created_at ?? raw.createdAt
      if (typeof ca === 'string' && ca.length > 0) return ca
      if (typeof ca === 'number' && Number.isFinite(ca)) return new Date(ca).toISOString()
      return new Date().toISOString()
    })(),
    updated_at:
      raw.updated_at != null
        ? String(raw.updated_at)
        : raw.updatedAt != null
          ? String(raw.updatedAt)
          : null,
    deleted_at:
      raw.deleted_at != null
        ? String(raw.deleted_at)
        : raw.deletedAt != null
          ? String(raw.deletedAt)
          : null,
  }
}

function extractMessagesArrayFromPayload(root: Record<string, unknown>): unknown[] {
  for (const key of ['messages', 'items', 'results', 'list'] as const) {
    const v = root[key]
    if (Array.isArray(v)) return v
  }
  const inner = root.data
  if (inner != null && typeof inner === 'object' && !Array.isArray(inner)) {
    const d = inner as Record<string, unknown>
    for (const key of ['messages', 'items', 'results', 'list'] as const) {
      const v = d[key]
      if (Array.isArray(v)) return v
    }
  }
  return []
}

function parseScheduleEntryMessagesPayload(
  body: unknown,
  channelFallback: ScheduleEntryMessageChannel,
  scheduleEntryId: number,
): { channel: ScheduleEntryMessageChannel; messages: ScheduleEntryMessage[] } | null {
  const nestedUnknown = readEnvelopeData<unknown>(body)
  let list: unknown[] = []
  let ch: ScheduleEntryMessageChannel = channelFallback

  if (Array.isArray(nestedUnknown)) {
    list = nestedUnknown
  } else {
    const root =
      (nestedUnknown != null && typeof nestedUnknown === 'object' && !Array.isArray(nestedUnknown)
        ? (nestedUnknown as Record<string, unknown>)
        : null) ??
      (body != null && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : null)
    if (root == null) return null
    const chRaw = root.channel
    ch = chRaw === 'foreman' || chRaw === 'pm' ? chRaw : channelFallback
    list = extractMessagesArrayFromPayload(root)
  }
  const messages: ScheduleEntryMessage[] = []
  for (const item of list) {
    if (item == null || typeof item !== 'object') continue
    const m = normalizeScheduleEntryMessage(
      item as Record<string, unknown>,
      ch,
      scheduleEntryId,
    )
    if (m != null && m.deleted_at == null) messages.push(m)
  }
  messages.sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime() || a.id - b.id,
  )
  return { channel: ch, messages }
}

const SCHEDULE_MSG_SEG_CACHE = 'fw_schedule_messages_resource_segment'

/** URL segment before `{scheduleEntryId}/messages` — backends differ (see docs). */
let resolvedScheduleMessagesSegment: string | null = null

function readCachedScheduleMessagesSegment(): void {
  if (resolvedScheduleMessagesSegment != null) return
  try {
    const s = sessionStorage.getItem(SCHEDULE_MSG_SEG_CACHE)
    if (s && /^[a-z][a-z0-9-]*$/i.test(s)) resolvedScheduleMessagesSegment = s
  } catch {
    /* ignore */
  }
}

function rememberScheduleMessagesSegment(segment: string): void {
  resolvedScheduleMessagesSegment = segment
  try {
    sessionStorage.setItem(SCHEDULE_MSG_SEG_CACHE, segment)
  } catch {
    /* ignore */
  }
}

/**
 * Candidate path segments for `/projects/{id}/{segment}/{entryId}/messages`.
 * Override with `VITE_SCHEDULE_ENTRY_MESSAGES_SEGMENT` if your API uses one path only.
 */
function scheduleMessageResourceSegments(): string[] {
  readCachedScheduleMessagesSegment()
  const fromEnv = import.meta.env.VITE_SCHEDULE_ENTRY_MESSAGES_SEGMENT?.trim()
  const out: string[] = []
  if (fromEnv && /^[a-z][a-z0-9-]*$/i.test(fromEnv)) out.push(fromEnv)
  if (resolvedScheduleMessagesSegment && !out.includes(resolvedScheduleMessagesSegment)) {
    out.unshift(resolvedScheduleMessagesSegment)
  }
  for (const s of ['schedule-entries', 'worker-task-schedules']) {
    if (!out.includes(s)) out.push(s)
  }
  return out
}

function scheduleEntryMessagesUrl(projectId: number, scheduleEntryId: number, segment: string): string {
  return `/api/v1/projects/${projectId}/${segment}/${scheduleEntryId}/messages`
}

/**
 * GET schedule-entry messages for one channel (`docs/SCHEDULE_ENTRY_MESSAGES_FOREMAN_PM.md`).
 * Retries alternate URL segments on **404** (common mismatch: `schedule-entries` vs `worker-task-schedules`).
 */
export async function fetchScheduleEntryMessages(
  projectId: number,
  scheduleEntryId: number,
  channel: ScheduleEntryMessageChannel,
  options?: { limit?: number; before_id?: number },
): Promise<{ channel: ScheduleEntryMessageChannel; messages: ScheduleEntryMessage[] }> {
  const ch = sanitizeScheduleEntryMessageChannel(channel)
  const params: Record<string, string | number> = { channel: ch }
  if (options?.limit != null) params.limit = options.limit
  if (options?.before_id != null) params.before_id = options.before_id
  let last404: unknown
  for (const segment of scheduleMessageResourceSegments()) {
    try {
      const response = await api.get(scheduleEntryMessagesUrl(projectId, scheduleEntryId, segment), {
        params,
      })
      rememberScheduleMessagesSegment(segment)
      const parsed = parseScheduleEntryMessagesPayload(response.data, ch, scheduleEntryId)
      if (parsed != null) return parsed
      return { channel: ch, messages: [] }
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 404) {
        last404 = e
        continue
      }
      throw e
    }
  }
  throw last404 instanceof Error ? last404 : new Error('Schedule messages GET: no matching route (404).')
}

function parsePostedScheduleEntryMessage(
  body: unknown,
  channelFallback: ScheduleEntryMessageChannel,
  scheduleEntryId: number,
): ScheduleEntryMessage | null {
  const nested = readEnvelopeData<Record<string, unknown>>(body)
  if (nested != null) {
    const inner = nested.message ?? nested
    if (inner != null && typeof inner === 'object' && !Array.isArray(inner)) {
      const row = inner as Record<string, unknown>
      const fb =
        nested.channel === 'foreman' || nested.channel === 'pm' ? nested.channel : channelFallback
      const fromBody =
        row.channel === 'foreman' || row.channel === 'pm' ? row.channel : fb
      return normalizeScheduleEntryMessage(row, fromBody, scheduleEntryId)
    }
  }
  if (body != null && typeof body === 'object' && !Array.isArray(body)) {
    const o = body as Record<string, unknown>
    if (o.data != null && typeof o.data === 'object' && !Array.isArray(o.data)) {
      const d = o.data as Record<string, unknown>
      const inner = d.message ?? d
      if (inner != null && typeof inner === 'object' && !Array.isArray(inner)) {
        const row = inner as Record<string, unknown>
        const fb =
          d.channel === 'foreman' || d.channel === 'pm' ? d.channel : channelFallback
        const fromRow =
          row.channel === 'foreman' || row.channel === 'pm' ? row.channel : fb
        return normalizeScheduleEntryMessage(row, fromRow, scheduleEntryId)
      }
    }
  }
  return null
}

/**
 * POST a message to a schedule-entry channel.
 * Retries alternate URL segments on **404** (same as GET).
 */
export async function postScheduleEntryMessage(
  projectId: number,
  scheduleEntryId: number,
  channel: ScheduleEntryMessageChannel,
  body: string,
): Promise<ScheduleEntryMessage> {
  const ch = sanitizeScheduleEntryMessageChannel(channel)
  let last404: unknown
  for (const segment of scheduleMessageResourceSegments()) {
    try {
      const response = await api.post(scheduleEntryMessagesUrl(projectId, scheduleEntryId, segment), {
        channel: ch,
        body,
      })
      rememberScheduleMessagesSegment(segment)
      const msg = parsePostedScheduleEntryMessage(response.data, ch, scheduleEntryId)
      if (msg != null) return msg
      throw new Error('Invalid message response from server')
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 404) {
        last404 = e
        continue
      }
      throw e
    }
  }
  throw last404 instanceof Error ? last404 : new Error('Schedule messages POST: no matching route (404).')
}

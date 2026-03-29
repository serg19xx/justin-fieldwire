import type { FieldDayAssignment, FieldScheduleByDate, VisitSlotPart } from '@/core/types/field-schedule'

const LS_PREFIX = 'fieldwire_field_schedule_v1_'

export function fieldScheduleStorageKey(userId: number): string {
  return `${LS_PREFIX}${userId}`
}

export function readLocalFieldSchedule(userId: number): FieldScheduleByDate {
  try {
    const raw = localStorage.getItem(fieldScheduleStorageKey(userId))
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return parsed as FieldScheduleByDate
  } catch {
    return {}
  }
}

export function writeLocalFieldSchedule(userId: number, data: FieldScheduleByDate): void {
  try {
    localStorage.setItem(fieldScheduleStorageKey(userId), JSON.stringify(data))
  } catch {
    /* ignore */
  }
}

export function pickRange(data: FieldScheduleByDate, fromYmd: string, toYmd: string): FieldScheduleByDate {
  const out: FieldScheduleByDate = {}
  for (const [k, v] of Object.entries(data)) {
    if (k >= fromYmd && k <= toYmd) {
      out[k] = v
    }
  }
  return out
}

function prunedDay(day: FieldDayAssignment | undefined): FieldDayAssignment | undefined {
  if (!day) return undefined
  const next: FieldDayAssignment = {}
  for (const part of ['am', 'pm', 'full'] as VisitSlotPart[]) {
    const s = day[part]
    if (s && s.project_id != null && Number.isFinite(Number(s.project_id)) && Number(s.project_id) > 0) {
      next[part] = { project_id: Number(s.project_id), note: s.note }
    }
  }
  if (Object.keys(next).length === 0) return undefined
  return next
}

export function mergeSlot(
  userId: number,
  dateYmd: string,
  part: VisitSlotPart,
  projectId: number | null,
): FieldScheduleByDate {
  const all = readLocalFieldSchedule(userId)
  const cur = { ...(all[dateYmd] || {}) }

  if (part === 'full') {
    delete cur.am
    delete cur.pm
    cur.full =
      projectId != null && Number.isFinite(projectId) && projectId > 0
        ? { project_id: projectId }
        : null
    if (!cur.full) delete cur.full
  } else {
    delete cur.full
    cur[part] =
      projectId != null && Number.isFinite(projectId) && projectId > 0
        ? { project_id: projectId }
        : null
    if (!cur[part]) delete cur[part]
  }

  const cleaned = prunedDay(cur)
  if (cleaned) {
    all[dateYmd] = cleaned
  } else {
    delete all[dateYmd]
  }
  writeLocalFieldSchedule(userId, all)
  return all
}

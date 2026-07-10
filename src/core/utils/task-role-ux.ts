import { FOREMAN_ROLE_DB_ID } from '@/config/roles'
import type { Project } from '@/core/utils/project-api'
import type { Task } from '@/core/types/task'
import { isProjectActiveForTaskUi } from '@/core/utils/project-list-for-user'

export { resolveSessionUserId } from '@/core/utils/session-user-id'

const CURRENT_PROJECT_STORAGE_KEY = 'fieldwire_task_role_current_project_id'

export function readStoredCurrentProjectId(): number | null {
  try {
    const raw = localStorage.getItem(CURRENT_PROJECT_STORAGE_KEY)
    if (!raw) return null
    const n = Number(raw)
    return Number.isFinite(n) && n > 0 ? n : null
  } catch {
    return null
  }
}

export function writeStoredCurrentProjectId(projectId: number): void {
  try {
    localStorage.setItem(CURRENT_PROJECT_STORAGE_KEY, String(projectId))
  } catch {
    /* ignore */
  }
}

function startOfDayUtc(d: Date): number {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
}

/**
 * Project is "current" if today falls within [date_start, date_end] when both exist.
 */
export function isProjectCurrentByDates(project: Project, now = new Date()): boolean {
  const t = startOfDayUtc(now)
  if (project.date_start && project.date_end) {
    const a = new Date(project.date_start + 'T12:00:00.000Z').getTime()
    const b = new Date(project.date_end + 'T12:00:00.000Z').getTime()
    if (!Number.isFinite(a) || !Number.isFinite(b)) return false
    return t >= a && t <= b
  }
  if (project.date_start) {
    const a = new Date(project.date_start + 'T12:00:00.000Z').getTime()
    return Number.isFinite(a) && t >= a
  }
  return false
}

/**
 * Split non-archived projects into one "current" card and the rest as "planned".
 */
export function partitionProjectsForTaskRoleList(
  projects: Project[],
  storedCurrentId: number | null,
): { current: Project | null; planned: Project[] } {
  const active = projects.filter((p) => isProjectActiveForTaskUi(p))
  if (active.length === 0) {
    return { current: null, planned: [] }
  }

  function sortPlannedProjects(planned: Project[]): Project[] {
    return [...planned].sort((a, b) => {
      const as = a.date_start ? new Date(a.date_start).getTime() : Infinity
      const bs = b.date_start ? new Date(b.date_start).getTime() : Infinity
      if (as !== bs) return as - bs
      return (a.id ?? 0) - (b.id ?? 0)
    })
  }

  if (storedCurrentId != null) {
    const byStored = active.find((p) => p.id === storedCurrentId)
    if (byStored) {
      return {
        current: byStored,
        planned: sortPlannedProjects(active.filter((p) => p.id !== storedCurrentId)),
      }
    }
  }

  const byDates = active.filter((p) => isProjectCurrentByDates(p))
  if (byDates.length === 1) {
    const c = byDates[0]
    return { current: c, planned: sortPlannedProjects(active.filter((p) => p.id !== c.id)) }
  }
  if (byDates.length > 1) {
    byDates.sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
    const c = byDates[0]
    return { current: c, planned: sortPlannedProjects(active.filter((p) => p.id !== c.id)) }
  }

  const withFutureStart = [...active].sort((a, b) => {
    const as = a.date_start ? new Date(a.date_start).getTime() : Infinity
    const bs = b.date_start ? new Date(b.date_start).getTime() : Infinity
    return as - bs
  })
  const c = withFutureStart[0]
  return { current: c, planned: sortPlannedProjects(active.filter((p) => p.id !== c.id)) }
}

/**
 * Foreman sees the full project task list in task-role routes; workers and contractors only see assigned tasks.
 * Matches `role_code` `foreman` or global role id {@link FOREMAN_ROLE_DB_ID} when the API sends `role_id` only.
 */
export function isTaskRoleForeman(
  roleCode?: string | null | undefined,
  roleId?: number | null | undefined,
): boolean {
  const id = Number(roleId)
  if (Number.isFinite(id) && id === FOREMAN_ROLE_DB_ID) return true
  return (roleCode || '').toLowerCase() === 'foreman'
}

/**
 * True if the user is task lead, team member, or legacy assignee.
 */
export function isUserInvolvedInTask(
  task: Task,
  userId: number | string | null | undefined,
): boolean {
  const uid = typeof userId === 'number' && Number.isFinite(userId) ? userId : Number(userId)
  if (!Number.isFinite(uid) || uid <= 0) return false
  return (
    (task.task_lead_id != null && Number(task.task_lead_id) === uid) ||
    (task.team_members || []).some((x) => Number(x) === uid) ||
    (task.assignees || []).some((x) => Number(x) === uid)
  )
}

/**
 * Tasks visible to a worker in task-role project views (server may still return extras).
 */
export function filterTasksForInvolvedUser(
  tasks: Task[],
  userId: number | string | null | undefined,
): Task[] {
  const uid = Number(userId)
  if (!Number.isFinite(uid) || uid <= 0) return []
  return tasks.filter((t) => isUserInvolvedInTask(t, uid))
}

/**
 * Pick the single "active" task for the worker list (top of screen).
 */
export function pickPrimaryActiveTask(
  tasks: Task[],
  userId?: number | string | null,
): Task | null {
  const involves = (t: Task) =>
    userId == null || isUserInvolvedInTask(t, userId)

  const inProg = tasks.filter((t) => t.status === 'in_progress')
  const mineInProg = inProg.filter(involves)
  if (mineInProg.length) return mineInProg[0]
  if (inProg.length) return inProg[0]

  const partial = tasks.filter((t) => t.status === 'partially_completed')
  const mineP = partial.filter(involves)
  if (mineP.length) return mineP[0]
  if (partial.length) return partial[0]

  const accepted = tasks.filter((t) => t.status === 'scheduled_accepted')
  if (accepted.length) return accepted.filter(involves)[0] ?? accepted[0]

  return null
}

function plannedSortKey(t: Task): number {
  const s = t.start_planned ? new Date(t.start_planned).getTime() : 0
  return Number.isFinite(s) ? s : 0
}

function sortPlannedTasksDesc(rest: Task[]): Task[] {
  const out = [...rest]
  out.sort((a, b) => {
    const ka = plannedSortKey(a)
    const kb = plannedSortKey(b)
    const aHas = ka > 0
    const bHas = kb > 0
    if (aHas && bHas) return kb - ka
    if (aHas && !bHas) return -1
    if (!aHas && bHas) return 1
    return String(a.name).localeCompare(String(b.name))
  })
  return out
}

/**
 * Primary "active" task (if any) + remaining tasks sorted by start_planned descending.
 */
export function splitTasksForTaskRolePanel(
  tasks: Task[],
  userId?: number | null,
): { primary: Task | null; planned: Task[] } {
  const primary = pickPrimaryActiveTask(tasks, userId)
  const rest = primary
    ? tasks.filter((t) => String(t.id) !== String(primary.id))
    : [...tasks]
  return { primary, planned: sortPlannedTasksDesc(rest) }
}

/**
 * Flat list: primary first (if any), then planned block.
 */
export function orderTasksForTaskRolePanel(tasks: Task[], userId?: number | null): Task[] {
  const { primary, planned } = splitTasksForTaskRolePanel(tasks, userId)
  return primary ? [primary, ...planned] : planned
}

const WORKER_ROLE_CODES = ['worker', 'contractor'] as const

export function isTaskRoleWorker(roleCode?: string | null): boolean {
  return WORKER_ROLE_CODES.includes((roleCode || '').toLowerCase() as (typeof WORKER_ROLE_CODES)[number])
}

export function isTaskRoleContractor(roleCode?: string | null): boolean {
  return (roleCode || '').toLowerCase() === 'contractor'
}

export function isUserTaskLead(task: Task, userId: number | string | null | undefined): boolean {
  const uid = typeof userId === 'number' && Number.isFinite(userId) ? userId : Number(userId)
  if (!Number.isFinite(uid) || uid <= 0) return false
  return task.task_lead_id != null && Number(task.task_lead_id) === uid
}

/**
 * Assigned foreman, worker, or contractor (global role) may update field progress and work report on site.
 */
export function canActAsFieldCrewOnTask(
  task: Task,
  userId: number | string | null | undefined,
  roleCode?: string | null,
  roleId?: number | null,
): boolean {
  const uid = typeof userId === 'number' && Number.isFinite(userId) ? userId : Number(userId)
  if (!Number.isFinite(uid) || uid <= 0) return false
  if (!isUserInvolvedInTask(task, uid)) return false
  if (isTaskRoleForeman(roleCode, roleId)) return true
  return isTaskRoleWorker(roleCode)
}

/**
 * Task lead, or assigned foreman/worker, may update field progress and work report.
 */
export function canEditTaskFieldWork(
  task: Task,
  userId: number | string | null | undefined,
  roleCode?: string | null,
  roleId?: number | null,
): boolean {
  if (isUserTaskLead(task, userId)) return true
  return canActAsFieldCrewOnTask(task, userId, roleCode, roleId)
}

/**
 * @deprecated Prefer {@link canEditTaskFieldWork} — same rules for progress slider and field work.
 */
export function canEditTaskProgress(
  task: Task,
  userId: number | string | null | undefined,
  roleCode?: string | null,
  roleId?: number | null,
): boolean {
  return canEditTaskFieldWork(task, userId, roleCode, roleId)
}

/**
 * Assigned users without field-work edit rights see read-only task field data.
 */
export function isFieldTaskReadOnly(
  task: Task,
  userId: number | string | null | undefined,
  roleCode?: string | null,
  roleId?: number | null,
): boolean {
  const uid = typeof userId === 'number' && Number.isFinite(userId) ? userId : Number(userId)
  if (!Number.isFinite(uid) || uid <= 0) return true
  if (canEditTaskFieldWork(task, uid, roleCode, roleId)) return false
  return isUserInvolvedInTask(task, uid)
}

export function fieldTaskReadOnlyHint(_roleCode?: string | null): string {
  return 'View only — field updates are done by your foreman or an assigned crew member.'
}

export function formatBackendTaskStatus(status: string | undefined | null): string {
  if (!status) return 'Planned'
  const map: Record<string, string> = {
    planned: 'Planned',
    in_progress: 'In progress',
    done: 'Closed',
    blocked: 'Blocked',
    delayed: 'Delayed',
    completed: 'Closed',
    scheduled: 'Planned',
    scheduled_accepted: 'Planned',
    partially_completed: 'In progress',
    ready_for_inspection: 'In progress',
    delayed_due_to_issue: 'Delayed',
  }
  const key = status.toLowerCase().replace(/-/g, '_').replace(/\s+/g, '_')
  return map[key] ?? status
}

/** Task list buckets for field-role project task tabs */
export type TaskRoleStatusBucket = 'active' | 'planned' | 'finished'

export function getTaskRoleStatusBucket(status: string | undefined | null): TaskRoleStatusBucket {
  const key = (status || 'planned').toLowerCase().replace(/-/g, '_').replace(/\s+/g, '_')
  if (['done', 'completed'].includes(key)) {
    return 'finished'
  }
  if (['planned', 'scheduled', 'scheduled_accepted'].includes(key)) {
    return 'planned'
  }
  return 'active'
}

export function sortTasksForRoleBucket(tasks: Task[], bucket: TaskRoleStatusBucket): Task[] {
  const list = [...tasks]
  if (bucket === 'planned') {
    return list.sort((a, b) => {
      const as = a.start_planned ? new Date(a.start_planned).getTime() : Infinity
      const bs = b.start_planned ? new Date(b.start_planned).getTime() : Infinity
      if (as !== bs) return as - bs
      return String(a.name).localeCompare(String(b.name))
    })
  }
  if (bucket === 'finished') {
    return list.sort((a, b) => {
      const ae = a.end_planned ? new Date(a.end_planned).getTime() : 0
      const be = b.end_planned ? new Date(b.end_planned).getTime() : 0
      if (ae !== be) return be - ae
      return String(a.name).localeCompare(String(b.name))
    })
  }
  // active: in_progress first, then higher progress, then sooner start
  const weight = (s: string | undefined) => {
    const b = getTaskRoleStatusBucket(s)
    if (b !== 'active') return 99
    const k = (s || '').toLowerCase()
    if (k === 'in_progress' || k === 'partially_completed') return 0
    if (k === 'ready_for_inspection') return 1
    return 2
  }
  return list.sort((a, b) => {
    const wa = weight(String(a.status))
    const wb = weight(String(b.status))
    if (wa !== wb) return wa - wb
    const pa = a.progress_pct ?? 0
    const pb = b.progress_pct ?? 0
    if (pa !== pb) return pb - pa
    const as = a.start_planned ? new Date(a.start_planned).getTime() : Infinity
    const bs = b.start_planned ? new Date(b.start_planned).getTime() : Infinity
    return as - bs
  })
}

/**
 * Field UI: one project = one site/object. `prj_name` is the site label (e.g. pharmacy name).
 * Task `address` is the work location; falls back to project address when empty.
 */
export function resolveTaskSiteName(
  project: Pick<Project, 'prj_name'> | null | undefined,
): string {
  const name = (project?.prj_name ?? '').trim()
  return name || 'Site'
}

export function resolveTaskSiteAddress(
  task: Pick<Task, 'address'> | null | undefined,
  project: Pick<Project, 'address'> | null | undefined,
): string {
  const taskAddr = (task?.address ?? '').trim()
  if (taskAddr) return taskAddr
  return (project?.address ?? '').trim()
}

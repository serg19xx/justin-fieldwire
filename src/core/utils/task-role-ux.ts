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

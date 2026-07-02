import type { Task, TaskCreateUpdate } from '@/core/types/task'
import { hrResourcesApi } from '@/core/utils/hr-api'
import { projectApi, type Project } from '@/core/utils/project-api'
import { resolveProjectSysStatus, PROJECT_SYS_STATUS_LABELS } from '@/core/utils/project-sys-status'
import {
  formatBackendTaskStatus,
  getTaskRoleStatusBucket,
  isUserInvolvedInTask,
  isUserTaskLead,
  pickPrimaryActiveTask,
} from '@/core/utils/task-role-ux'
import { tasksApi } from '@/core/utils/tasks-api'

export type TaskAssignmentRole = 'lead' | 'member'

export type AssignmentProjectHint = Pick<Project, 'id' | 'prj_name' | 'address' | 'sys_status'>

export interface WorkerAssignmentTaskRow {
  id: string
  name: string
  statusLabel: string
  start_planned: string
  end_planned?: string
  progress_pct: number
  address?: string
  roleOnTask: TaskAssignmentRole
  task: Task
}

export interface WorkerAssignmentProjectGroup {
  projectId: number
  projectName: string
  projectAddress?: string
  sysStatusLabel: string
  tasks: WorkerAssignmentTaskRow[]
}

export type PmWorkerTasksTab = 'planned' | 'current' | 'archive'

export interface PmWorkerProjectTasksView {
  projectId: number
  projectName: string
  projectAddress?: string
  sysStatusLabel: string
  planned: WorkerAssignmentTaskRow[]
  currentPrimary: WorkerAssignmentTaskRow | null
  currentUpcoming: WorkerAssignmentTaskRow[]
  archive: WorkerAssignmentTaskRow[]
}

export function buildPmProjectTasksView(group: WorkerAssignmentProjectGroup): PmWorkerProjectTasksView {
  const planned: WorkerAssignmentTaskRow[] = []
  const active: WorkerAssignmentTaskRow[] = []
  const archive: WorkerAssignmentTaskRow[] = []

  for (const row of group.tasks) {
    const bucket = getTaskRoleStatusBucket(row.task.status)
    if (bucket === 'planned') planned.push(row)
    else if (bucket === 'finished') archive.push(row)
    else active.push(row)
  }

  const primaryTask = pickPrimaryActiveTask(
    active.map((r) => r.task),
    null,
  )
  const currentPrimary = primaryTask
    ? active.find((r) => String(r.id) === String(primaryTask.id)) ?? null
    : null
  const currentUpcoming = active
    .filter((r) => !currentPrimary || r.id !== currentPrimary.id)
    .sort((a, b) => {
      const as = a.start_planned ? new Date(a.start_planned).getTime() : Infinity
      const bs = b.start_planned ? new Date(b.start_planned).getTime() : Infinity
      if (as !== bs) return as - bs
      return a.name.localeCompare(b.name)
    })

  planned.sort((a, b) => {
    const as = a.start_planned ? new Date(a.start_planned).getTime() : Infinity
    const bs = b.start_planned ? new Date(b.start_planned).getTime() : Infinity
    if (as !== bs) return as - bs
    return a.name.localeCompare(b.name)
  })

  archive.sort((a, b) => {
    const ae = a.end_planned ? new Date(a.end_planned).getTime() : 0
    const be = b.end_planned ? new Date(b.end_planned).getTime() : 0
    if (ae !== be) return be - ae
    return a.name.localeCompare(b.name)
  })

  return {
    projectId: group.projectId,
    projectName: group.projectName,
    projectAddress: group.projectAddress,
    sysStatusLabel: group.sysStatusLabel,
    planned,
    currentPrimary,
    currentUpcoming,
    archive,
  }
}

export function pmProjectTasksTotal(view: PmWorkerProjectTasksView): number {
  return (
    view.planned.length +
    (view.currentPrimary ? 1 : 0) +
    view.currentUpcoming.length +
    view.archive.length
  )
}

export function pmTabCount(view: PmWorkerProjectTasksView, tab: PmWorkerTasksTab): number {
  if (tab === 'planned') return view.planned.length
  if (tab === 'archive') return view.archive.length
  return (view.currentPrimary ? 1 : 0) + view.currentUpcoming.length
}

export function getTaskAssignmentRole(task: Task, userId: number): TaskAssignmentRole | null {
  if (isUserTaskLead(task, userId)) return 'lead'
  const team = task.team_members || []
  if (team.some((id) => Number(id) === userId)) return 'member'
  const assignees = task.assignees || []
  if (assignees.some((id) => Number(id) === userId)) return 'member'
  return null
}

export function mapTasksToAssignmentRows(tasks: Task[], userId: number): WorkerAssignmentTaskRow[] {
  const rows: WorkerAssignmentTaskRow[] = []
  for (const task of tasks) {
    const role = getTaskAssignmentRole(task, userId)
    if (!role) continue
    rows.push({
      id: String(task.id),
      name: task.name,
      statusLabel: formatBackendTaskStatus(String(task.status)),
      start_planned: task.start_planned,
      end_planned: task.end_planned,
      progress_pct: task.progress_pct ?? 0,
      address: task.address,
      roleOnTask: role,
      task,
    })
  }
  rows.sort((a, b) => {
    const as = a.start_planned ? new Date(a.start_planned).getTime() : 0
    const bs = b.start_planned ? new Date(b.start_planned).getTime() : 0
    return bs - as
  })
  return rows
}

function projectMetaFromApi(project: Pick<Project, 'id' | 'prj_name' | 'address' | 'sys_status'>): {
  projectId: number
  projectName: string
  projectAddress?: string
  sysStatusLabel: string
} {
  const sys = resolveProjectSysStatus(project)
  return {
    projectId: project.id,
    projectName: project.prj_name || `Project #${project.id}`,
    projectAddress: project.address || undefined,
    sysStatusLabel: PROJECT_SYS_STATUS_LABELS[sys],
  }
}

function buildProjectGroup(
  meta: ReturnType<typeof projectMetaFromApi>,
  tasks: Task[],
  userId: number,
): WorkerAssignmentProjectGroup | null {
  const assignmentTasks = mapTasksToAssignmentRows(tasks, userId)
  if (assignmentTasks.length === 0) return null
  return {
    ...meta,
    tasks: assignmentTasks,
  }
}

export function buildProjectAssignmentFromTasks(
  project: Pick<Project, 'id' | 'prj_name' | 'address' | 'sys_status'>,
  tasks: Task[],
  userId: number,
): WorkerAssignmentProjectGroup | null {
  return buildProjectGroup(projectMetaFromApi(project), tasks, userId)
}

export function listTasksAvailableForAssign(tasks: Task[], userId: number): Task[] {
  return tasks.filter((t) => !isUserInvolvedInTask(t, userId))
}

function taskToUpdatePayload(task: Task, projectId: number): Partial<TaskCreateUpdate> {
  return {
    project_id: projectId,
    name: task.name,
    start_planned: task.start_planned,
    start_time: task.start_time,
    end_planned: task.end_planned,
    end_time: task.end_time,
    status: task.status,
    progress_pct: task.progress_pct ?? 0,
    task_lead_id: task.task_lead_id,
    team_members: task.team_members || [],
    resources: task.resources || [],
    address: task.address,
    notes: task.notes,
    milestone: task.milestone,
  }
}

export async function removeWorkerFromTaskAssignment(
  projectId: number,
  task: Task,
  workerId: number,
): Promise<Task> {
  const payload = taskToUpdatePayload(task, projectId)
  if (task.task_lead_id === workerId) {
    payload.task_lead_id = undefined
  }
  payload.team_members = (task.team_members || []).filter((id) => Number(id) !== workerId)
  return tasksApi.update(projectId, String(task.id), payload)
}

export async function addWorkerToTaskAsMember(
  projectId: number,
  task: Task,
  workerId: number,
): Promise<Task> {
  if (isUserInvolvedInTask(task, workerId)) {
    return task
  }
  const payload = taskToUpdatePayload(task, projectId)
  const team = [...(task.team_members || [])]
  if (!team.includes(workerId)) {
    team.push(workerId)
  }
  payload.team_members = team
  return tasksApi.update(projectId, String(task.id), payload)
}

interface LoadAssignmentsScope {
  projectId?: number
  project?: Pick<Project, 'id' | 'prj_name' | 'address' | 'sys_status'>
  /** All tasks for a single-project scope (used for add-task dropdown too) */
  projectTasks?: Task[]
}

async function loadProjectAssignmentsForUser(
  projectId: number,
  userId: number,
  projectHint?: Pick<Project, 'id' | 'prj_name' | 'address' | 'sys_status'>,
): Promise<WorkerAssignmentProjectGroup | null> {
  let project = projectHint
  if (!project?.prj_name) {
    try {
      project = await projectApi.getById(projectId)
    } catch {
      project = { id: projectId, prj_name: `Project #${projectId}`, address: '', sys_status: null }
    }
  }
  const scoped = await tasksApi.getAll(projectId, 1, 500, { workerId: userId })
  const involved = scoped.tasks.filter((t) => isUserInvolvedInTask(t, userId))
  const resolved = project ?? { id: projectId, prj_name: `Project #${projectId}`, address: '', sys_status: null }
  return buildProjectAssignmentFromTasks(resolved, involved, userId)
}

async function discoverProjectsForUser(userId: number): Promise<Array<{ id: number; name: string; address?: string }>> {
  const profile = await hrResourcesApi.getWorkerById(userId)
  if (!profile?.projects?.length) {
    return []
  }

  const byId = new Map<number, { id: number; name: string; address?: string }>()
  for (const p of profile.projects as Array<{ id: number; name: string; address?: string }>) {
    if (!p?.id || byId.has(p.id)) continue
    byId.set(p.id, { id: p.id, name: p.name, address: p.address })
  }
  return Array.from(byId.values())
}

function mergeAssignmentGroupsByProject(
  groups: WorkerAssignmentProjectGroup[],
): WorkerAssignmentProjectGroup[] {
  const byId = new Map<number, WorkerAssignmentProjectGroup>()

  for (const group of groups) {
    const existing = byId.get(group.projectId)
    if (!existing) {
      byId.set(group.projectId, { ...group, tasks: [...group.tasks] })
      continue
    }

    const seenTaskIds = new Set(existing.tasks.map((t) => t.id))
    for (const row of group.tasks) {
      if (seenTaskIds.has(row.id)) continue
      existing.tasks.push(row)
      seenTaskIds.add(row.id)
    }
  }

  const merged = Array.from(byId.values())
  for (const group of merged) {
    group.tasks.sort((a, b) => {
      const as = a.start_planned ? new Date(a.start_planned).getTime() : 0
      const bs = b.start_planned ? new Date(b.start_planned).getTime() : 0
      return bs - as
    })
  }
  merged.sort((a, b) => a.projectName.localeCompare(b.projectName))
  return merged
}

export async function loadWorkerAssignmentGroups(
  userId: number,
  scope?: LoadAssignmentsScope,
): Promise<WorkerAssignmentProjectGroup[]> {
  if (scope?.projectId) {
    const tasks =
      scope.projectTasks ??
      (await tasksApi.getAll(scope.projectId, 1, 500, { workerId: userId })).tasks
    const group = buildProjectAssignmentFromTasks(
      scope.project ?? {
        id: scope.projectId,
        prj_name: `Project #${scope.projectId}`,
        address: '',
        sys_status: null,
      },
      tasks.filter((t) => isUserInvolvedInTask(t, userId)),
      userId,
    )
    if (group) return [group]
    return [
      {
        ...projectMetaFromApi(
          scope.project ?? {
            id: scope.projectId,
            prj_name: `Project #${scope.projectId}`,
            address: '',
            sys_status: null,
          },
        ),
        tasks: [],
      },
    ]
  }

  const projectRefs = await discoverProjectsForUser(userId)
  if (projectRefs.length === 0) {
    return []
  }

  const groups: WorkerAssignmentProjectGroup[] = []
  const chunkSize = 4
  for (let i = 0; i < projectRefs.length; i += chunkSize) {
    const chunk = projectRefs.slice(i, i + chunkSize)
    const chunkGroups = await Promise.all(
      chunk.map(async (ref) => {
        try {
          return await loadProjectAssignmentsForUser(ref.id, userId, {
            id: ref.id,
            prj_name: ref.name,
            address: ref.address ?? '',
            sys_status: null,
          })
        } catch {
          return null
        }
      }),
    )
    for (const g of chunkGroups) {
      if (g) groups.push(g)
    }
  }

  groups.sort((a, b) => a.projectName.localeCompare(b.projectName))
  return mergeAssignmentGroupsByProject(groups)
}

export async function loadProjectTasksForAssignPicker(projectId: number): Promise<Task[]> {
  const res = await tasksApi.getAll(projectId, 1, 500)
  return res.tasks ?? []
}

export function formatAssignmentDates(start?: string, end?: string): string {
  const fmt = (d: string) => {
    try {
      return new Date(d + 'T12:00:00').toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return d
    }
  }
  if (start && end) return `${fmt(start)} – ${fmt(end)}`
  if (start) return fmt(start)
  if (end) return fmt(end)
  return '—'
}

import type { User } from '@/core/stores/auth'
import type { Task } from '@/core/types/task'
import { mapApiProjectTeamRowsToRoster } from '@/core/utils/map-api-project-team-response'
import { projectApi, type Project } from '@/core/utils/project-api'
import { isProjectSysStatusDone } from '@/core/utils/project-sys-status'
import { tasksApi } from '@/core/utils/tasks-api'

/** Avoid hammering the API if GET /projects returns an unfiltered megalist */
const MAX_PROJECTS_TO_SCOPED_FILTER = 150

/**
 * Normalize GET /api/v1/projects response body (projectApi.getAll returns response.data.data).
 */
export function parseProjectsFromListResponse(data: unknown): Project[] {
  if (data == null) return []
  if (typeof data !== 'object') return []
  const d = data as Record<string, unknown>
  if (Array.isArray(d.projects)) return d.projects as Project[]
  if (Array.isArray(d.data)) return d.data as Project[]
  return []
}

/**
 * Query params for GET /api/v1/projects so non-admin users only see relevant projects.
 * Backend should honor:
 * - `prj_manager` — projects managed by that user (PM).
 * - `user_id` — projects where the user appears on the project team / assignments (workers, foremen, contractors).
 * If `user_id` is not implemented yet, backend should add filtering by fw_prj_team_members (and/or task assignees).
 */
const TASK_EXECUTOR_ROLE_CODES = ['worker', 'foreman', 'contractor'] as const

export function isTaskExecutorUser(user: User | null): boolean {
  if (!user) return false
  if (user.role_category === 'task') return true
  return TASK_EXECUTOR_ROLE_CODES.includes(user.role_code as (typeof TASK_EXECUTOR_ROLE_CODES)[number])
}

export function getProjectListQueryFiltersForUser(user: User | null): Record<string, unknown> {
  if (!user?.id) return {}

  if (user.role_code === 'project_manager') {
    return { prj_manager: user.id }
  }

  if (isTaskExecutorUser(user)) {
    return { user_id: user.id }
  }

  return {}
}

function taskInvolvesUserForProjectList(task: Task, userId: number): boolean {
  if (task.task_lead_id != null && Number(task.task_lead_id) === userId) return true
  const team = task.team_members || []
  if (team.some((x) => Number(x) === userId)) return true
  const assignees = task.assignees || []
  if (assignees.some((x) => Number(x) === userId)) return true
  return false
}

/**
 * When GET /projects ignores user_id, keep only projects where the user is on the project team
 * OR is assigned on at least one task (lead / team_members / assignees).
 * Runs team + task checks in parallel per project (chunked) to limit concurrency.
 */
export async function filterProjectsForTaskExecutorUser(
  projects: Project[],
  userId: number,
): Promise<Project[]> {
  if (projects.length === 0) return []

  if (projects.length > MAX_PROJECTS_TO_SCOPED_FILTER) {
    console.warn(
      `[project-list] Task user has ${projects.length} projects from API; ` +
        `client-side filter only checks first ${MAX_PROJECTS_TO_SCOPED_FILTER}. Implement GET /projects?user_id= on the backend.`,
    )
  }

  const slice = projects.slice(0, MAX_PROJECTS_TO_SCOPED_FILTER)

  async function projectMatchesUser(p: Project): Promise<Project | null> {
    try {
      const teamRes = await projectApi.getTeamMembers(p.id)
      const roster = mapApiProjectTeamRowsToRoster(teamRes)
      const onProjectTeam = roster.some(
        (m) => m.user_id != null && Number(m.user_id) === userId,
      )
      if (onProjectTeam) return p

      const taskRes = await tasksApi.getAll(p.id, 1, 500)
      const tasks = taskRes.tasks ?? []
      const onAnyTask = tasks.some((t) => taskInvolvesUserForProjectList(t, userId))
      return onAnyTask ? p : null
    } catch {
      return null
    }
  }

  const chunkSize = 6
  const kept: Project[] = []
  for (let i = 0; i < slice.length; i += chunkSize) {
    const chunk = slice.slice(i, i + chunkSize)
    const results = await Promise.all(chunk.map(projectMatchesUser))
    for (const r of results) {
      if (r) kept.push(r)
    }
  }

  return kept
}

/**
 * Active tab: `sys_status` is not `done`. Client `status` is ignored (sales notes only).
 * Missing `sys_status` → draft (see resolveProjectSysStatus).
 */
export function isProjectActiveForTaskUi(project: Project): boolean {
  return !isProjectSysStatusDone(project)
}

export function isProjectArchivedForTaskUi(project: Project): boolean {
  return isProjectSysStatusDone(project)
}

import type { User } from '@/core/stores/auth'
import type { Task } from '@/core/types/task'
import { mapApiProjectTeamRowsToRoster } from '@/core/utils/map-api-project-team-response'
import { projectApi, type Project } from '@/core/utils/project-api'
import { isProjectSysStatusDone } from '@/core/utils/project-sys-status'
import { resolveSessionUserId } from '@/core/utils/session-user-id'
import { tasksApi } from '@/core/utils/tasks-api'

/** Avoid hammering the API if GET /projects returns an unfiltered megalist */
const MAX_PROJECTS_TO_SCOPED_FILTER = 150

/**
 * Normalize GET /api/v1/projects response body (projectApi.getAll returns response.data.data).
 */
export function parseProjectsFromListResponse(data: unknown): Project[] {
  if (data == null) return []
  if (Array.isArray(data)) return data as Project[]
  if (typeof data !== 'object') return []
  const d = data as Record<string, unknown>

  if (Array.isArray(d.projects)) return d.projects as Project[]
  if (Array.isArray(d.data)) return d.data as Project[]
  if (Array.isArray(d.results)) return d.results as Project[]
  if (Array.isArray(d.items)) return d.items as Project[]

  const single = d.project
  if (single && typeof single === 'object' && !Array.isArray(single)) {
    return [single as Project]
  }

  // Nested envelope e.g. { data: { projects: [...] } }
  const inner = d.data
  if (inner != null && typeof inner === 'object' && !Array.isArray(inner)) {
    const nested = parseProjectsFromListResponse(inner)
    if (nested.length > 0) return nested
  }

  return []
}

/**
 * Query params for GET /api/v1/projects so non-admin users only see relevant projects.
 * Backend should honor:
 * - `prj_manager` — projects managed by that user (PM).
 * - `user_id` — projects where the user appears on the project team / assignments (workers, foremen).
 * If `user_id` is not implemented yet, backend should add filtering by fw_prj_team_members (and/or task assignees).
 */
const TASK_EXECUTOR_ROLE_CODES = ['worker', 'foreman'] as const

export function isMarketplaceStatus(status?: string | null): boolean {
  if (!status) return false
  const s = status.trim().toLowerCase()
  return (
    s === 'actively looking for a location' ||
    s === 'securing location' ||
    s === 'securing a location'
  )
}

function getClientDataEmail(clientData: unknown): string {
  if (!clientData || typeof clientData !== 'object') return ''
  return String((clientData as Record<string, unknown>).email || '')
    .trim()
    .toLowerCase()
}

/** Doctors see projects where they are the primary or any additional physician client. */
export function filterProjectsForDoctorUser(projects: Project[], user: User): Project[] {
  if (!user) return []
  const physicianId = user.physician_id != null ? Number(user.physician_id) : null
  const userEmail = (user.email || '').trim().toLowerCase()

  function matchesPhysician(
    table: string | null | undefined,
    clientId: number | string | null | undefined,
    clientData: unknown,
  ): boolean {
    if ((table || '').toLowerCase() !== 'physician') return false
    if (physicianId != null && clientId != null && Number(clientId) === physicianId) return true
    return userEmail !== '' && getClientDataEmail(clientData) === userEmail
  }

  return projects.filter((p) => {
    if (matchesPhysician(p.client_table, p.client_id, p.client_data)) return true
    if (matchesPhysician(p.client2_table, p.client2_id, p.client2_data)) return true
    return (p.additional_clients ?? []).some((c) =>
      matchesPhysician(c.client_table, c.client_id, c.client_data),
    )
  })
}

export function filterProjectsForPharmacistSecondaryUser(
  projects: Project[],
  user: User,
): Project[] {
  if (!user) return []
  const pharmacistId = user.pharmacist_id != null ? Number(user.pharmacist_id) : null
  const pharmacyId = user.pharmacy_id != null ? Number(user.pharmacy_id) : null
  const userEmail = (user.email || '').trim().toLowerCase()

  return projects.filter((p) => {
    // Check additional_clients
    if (Array.isArray(p.additional_clients) && p.additional_clients.length > 0) {
      const match = p.additional_clients.some((c) => {
        const table = (c.client_table || '').toLowerCase()
        const cid = Number(c.client_id)
        if (table === 'pharmacist' && pharmacistId != null && cid === pharmacistId) return true
        if (table === 'pharma' && pharmacyId != null && cid === pharmacyId) return true
        if (userEmail && c.client_data && typeof c.client_data === 'object') {
          const email = String((c.client_data as Record<string, unknown>).email || '')
            .trim()
            .toLowerCase()
          if (email && email === userEmail) return true
        }
        return false
      })
      if (match) return true
    }

    // Check legacy client2
    const c2Table = (p.client2_table || '').toLowerCase()
    const c2Id = p.client2_id != null ? Number(p.client2_id) : null
    if (c2Table === 'pharmacist' && pharmacistId != null && c2Id === pharmacistId) return true
    if (c2Table === 'pharma' && pharmacyId != null && c2Id === pharmacyId) return true

    return false
  })
}

export function filterProjectsForMarketplace(projects: Project[]): Project[] {
  return projects.filter((p) => isMarketplaceStatus(p.status))
}

export function isTaskExecutorUser(user: User | null): boolean {
  if (!user) return false
  if (user.role_category === 'task') return true
  const code = (user.role_code || '').toLowerCase()
  return TASK_EXECUTOR_ROLE_CODES.includes(code as (typeof TASK_EXECUTOR_ROLE_CODES)[number])
}

export function getProjectListQueryFiltersForUser(user: User | null): Record<string, unknown> {
  if (!user?.id) return {}

  if ((user.role_code || '').toLowerCase() === 'project_manager') {
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
      // 1) Tasks with user_id in query — if backend returns any rows, that means this user has work here.
      // Do not require task_lead_id/assignees on each row (API often omits them on scoped lists).
      try {
        const scoped = await tasksApi.getAll(p.id, 1, 200, { workerId: userId })
        const scopedTasks = scoped.tasks ?? []
        if (scopedTasks.length > 0) return p
      } catch {
        // 403 / unsupported — fall through to team and full task list
      }

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

/**
 * Shared loader for task-role dashboards (home screen project cards).
 * Applies server filters, parses list shape, then client-side scope for executors when needed.
 */
export async function fetchProjectsForTaskScope(
  user: User | null,
  options?: { page?: number; limit?: number },
): Promise<Project[]> {
  const sessionUid = resolveSessionUserId(user)
  if (user == null || sessionUid == null) return []
  const page = options?.page ?? 1
  const limit = options?.limit ?? 100
  const filters = getProjectListQueryFiltersForUser(user)
  const data = await projectApi.getAll(page, limit, filters)
  let list = parseProjectsFromListResponse(data)

  const serverScopedByUserId = filters.user_id != null
  if (
    isTaskExecutorUser(user) &&
    serverScopedByUserId &&
    list.length > 0 &&
    list.length <= MAX_PROJECTS_TO_SCOPED_FILTER
  ) {
    // Avoid per-project GET /tasks (200 + 500) when API already filtered projects by user_id.
    return list
  }

  if (isTaskExecutorUser(user) && list.length > 0) {
    const filtered = await filterProjectsForTaskExecutorUser(list, sessionUid)
    if (filtered.length === 0) {
      console.warn(
        '[project-list] Client-side scope removed all projects; using API list (server likely already filtered by user_id).',
      )
    } else {
      list = filtered
    }
  }
  return list
}

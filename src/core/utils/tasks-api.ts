import { api } from './api'
import type { Task, TaskCreateUpdate, TaskFilter, TaskStats, TaskStatus } from '@/core/types/task'
import { isMilestone, type MilestoneType } from '@/core/types/task'

// Backend accepts only: planned, in_progress, done, blocked, delayed
const BACKEND_STATUSES = ['planned', 'in_progress', 'done', 'blocked', 'delayed'] as const
type BackendStatus = (typeof BACKEND_STATUSES)[number]

function mapStatusToBackend(status: string | undefined): BackendStatus {
  if (!status) return 'planned'
  const normalized = status.toLowerCase().replace(/-/g, '_').replace(/\s+/g, '_')
  if (BACKEND_STATUSES.includes(normalized as BackendStatus)) {
    return normalized as BackendStatus
  }
  const mapping: Record<string, BackendStatus> = {
    scheduled: 'planned',
    scheduled_accepted: 'planned',
    partially_completed: 'done',
    ready_for_inspection: 'done',
    completed: 'done',
    delayed_due_to_issue: 'delayed',
  }
  return mapping[normalized] ?? 'planned'
}

function asPositiveUserId(v: unknown): number | null {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : null
}

/**
 * Normalize assignee / team arrays: numeric ids, string ids, or objects with user_id / userId.
 */
export function coerceParticipantIds(raw: unknown): number[] {
  if (!Array.isArray(raw)) return []
  const out: number[] = []
  for (const x of raw) {
    if (typeof x === 'number' || typeof x === 'string') {
      const n = asPositiveUserId(x)
      if (n != null) out.push(n)
      continue
    }
    if (x && typeof x === 'object') {
      const o = x as Record<string, unknown>
      const n = asPositiveUserId(o.user_id) ?? asPositiveUserId(o.userId)
      if (n != null) out.push(n)
    }
  }
  return out
}

/**
 * Backend response shapes differ: { data: { tasks, pagination } }, { tasks }, nested data, or tasks array only.
 */
function extractTaskRowsAndPagination(responseBody: unknown): {
  rows: Record<string, unknown>[]
  pagination: Record<string, unknown> | undefined
} {
  if (responseBody == null || typeof responseBody !== 'object') {
    return { rows: [], pagination: undefined }
  }

  function readTasksNode(node: unknown): { rows: Record<string, unknown>[]; pagination?: unknown } | null {
    if (node == null) return null
    if (Array.isArray(node)) {
      return { rows: node as Record<string, unknown>[] }
    }
    if (typeof node !== 'object') return null
    const o = node as Record<string, unknown>
    for (const key of ['tasks', 'results', 'items'] as const) {
      const arr = o[key]
      if (Array.isArray(arr)) {
        return { rows: arr as Record<string, unknown>[], pagination: o.pagination }
      }
    }
    return null
  }

  let cur: unknown = responseBody
  for (let depth = 0; depth < 6; depth++) {
    const got = readTasksNode(cur)
    if (got != null) {
      const pag =
        got.pagination != null && typeof got.pagination === 'object'
          ? (got.pagination as Record<string, unknown>)
          : undefined
      return { rows: got.rows, pagination: pag }
    }
    if (cur && typeof cur === 'object' && 'data' in cur) {
      cur = (cur as Record<string, unknown>).data
      continue
    }
    break
  }

  return { rows: [], pagination: undefined }
}

/**
 * Collect every user id the backend might attach to a task (arrays + common scalar keys).
 * Used so worker-side filtering matches real API payloads.
 */
function extractAllParticipantUserIds(task: Record<string, unknown>): number[] {
  const set = new Set<number>()
  const arrayKeys = [
    'assignees',
    'team_members',
    'member_ids',
    'team_member_ids',
    'user_ids',
    'worker_ids',
    'assignee_ids',
    'assigned_users',
    'members',
    'team',
    'workers',
    'participants',
  ] as const
  for (const k of arrayKeys) {
    for (const id of coerceParticipantIds(task[k])) {
      set.add(id)
    }
  }
  const leadObj =
    task.task_lead && typeof task.task_lead === 'object'
      ? (task.task_lead as Record<string, unknown>)
      : null
  if (leadObj) {
    const n = asPositiveUserId(leadObj.user_id) ?? asPositiveUserId(leadObj.userId)
    if (n != null) set.add(n)
  }
  const scalarKeys = [
    'task_lead_id',
    'lead_id',
    'task_lead_user_id',
    'assigned_user_id',
    'primary_assignee_id',
    'responsible_user_id',
    'owner_user_id',
  ] as const
  for (const k of scalarKeys) {
    const n = asPositiveUserId(task[k])
    if (n != null) set.add(n)
  }
  return Array.from(set)
}

function normalizeApiTaskStatus(raw: unknown): TaskStatus {
  if (typeof raw !== 'string' || raw.length === 0) return 'planned'
  return raw as TaskStatus
}

function transformTaskFromApiRow(task: Record<string, unknown>): Task {
  const legacyAssigneeOrder = coerceParticipantIds(task.assignees)
  const allParticipantIds = extractAllParticipantUserIds(task)
  const leadObj =
    task.task_lead && typeof task.task_lead === 'object'
      ? (task.task_lead as Record<string, unknown>)
      : null

  const explicitLead =
    asPositiveUserId(task.task_lead_id) ??
    asPositiveUserId(task.lead_id) ??
    asPositiveUserId(task.task_lead_user_id) ??
    asPositiveUserId(task.assigned_user_id) ??
    (leadObj ? asPositiveUserId(leadObj.user_id) ?? asPositiveUserId(leadObj.userId) : null)

  const task_lead_id =
    explicitLead ?? (legacyAssigneeOrder.length > 0 ? legacyAssigneeOrder[0] : null) ?? (allParticipantIds[0] ?? null)

  const teamFromField = coerceParticipantIds(task.team_members)
  let team_members: number[]
  if (teamFromField.length > 0) {
    team_members = teamFromField
  } else if (task_lead_id != null && allParticipantIds.length > 0) {
    team_members = allParticipantIds.filter((id) => id !== task_lead_id)
  } else {
    team_members =
      legacyAssigneeOrder.length > 1 ? legacyAssigneeOrder.slice(1) : allParticipantIds.slice(1)
  }

  const assignees = allParticipantIds.length > 0 ? allParticipantIds : legacyAssigneeOrder

  const id = task.id != null ? String(task.id) : ''
  const projectNum = Number(task.project_id)
  const project_id = Number.isFinite(projectNum) ? projectNum : 0
  const name = task.name != null ? String(task.name) : ''
  const start_planned = task.start_planned != null ? String(task.start_planned) : ''
  const progressRaw = task.progress_pct
  const progress_pct =
    typeof progressRaw === 'number' && Number.isFinite(progressRaw)
      ? progressRaw
      : Number(progressRaw) || 0

  const resources: string[] = Array.isArray(task.resources)
    ? task.resources.map((x) => String(x))
    : []
  const dependencies: Task['dependencies'] = Array.isArray(task.dependencies)
    ? (task.dependencies as Task['dependencies'])
    : []

  const milestone =
    typeof task.milestone === 'string'
      ? (task.milestone as MilestoneType)
      : task.milestone
        ? 'other'
        : null

  return {
    id,
    project_id,
    name,
    wbs_path: task.wbs_path != null ? String(task.wbs_path) : '',
    start_planned,
    start_time: task.start_time != null ? String(task.start_time) : undefined,
    end_planned: task.end_planned != null ? String(task.end_planned) : undefined,
    end_time: task.end_time != null ? String(task.end_time) : undefined,
    duration_days: typeof task.duration_days === 'number' ? task.duration_days : undefined,
    milestone,
    milestone_type:
      typeof task.milestone === 'string'
        ? (task.milestone as MilestoneType)
        : task.milestone
          ? 'other'
          : undefined,
    status: normalizeApiTaskStatus(task.status),
    progress_pct,
    notes: task.notes != null ? String(task.notes) : undefined,
    task_lead_id: task_lead_id ?? undefined,
    team_members,
    assignees,
    created_at: task.created_at != null ? String(task.created_at) : '',
    updated_at: task.updated_at != null ? String(task.updated_at) : '',
    resources,
    dependencies,
    baseline_start: task.baseline_start != null ? String(task.baseline_start) : undefined,
    baseline_end: task.baseline_end != null ? String(task.baseline_end) : undefined,
    actual_start: task.actual_start != null ? String(task.actual_start) : undefined,
    actual_end: task.actual_end != null ? String(task.actual_end) : undefined,
    slack_days: typeof task.slack_days === 'number' ? task.slack_days : undefined,
    task_order: typeof task.task_order === 'number' ? task.task_order : undefined,
  }
}

// API response interfaces
interface TasksResponse {
  tasks: Task[]
  pagination: {
    current_page: number
    per_page: number
    total: number
    last_page: number
  }
}

// interface TaskResponse {
//   task: Task
// }

// Tasks API object
export const tasksApi = {
  // Get all tasks for a project
  async getAll(
    projectId: number,
    page?: number,
    limit?: number,
    filters?: TaskFilter,
  ): Promise<TasksResponse> {
    try {
      console.log('🔍 Tasks API: Attempting to fetch tasks for project:', projectId)

      const params = new URLSearchParams()

      // Add pagination only if provided
      if (page) {
        params.append('page', page.toString())
      }
      if (limit) {
        params.append('limit', limit.toString())
      }

      if (filters?.status?.length) {
        filters.status.forEach((status) => params.append('status[]', status))
      }
      if (filters?.assignees?.length) {
        filters.assignees.forEach((assignee) => params.append('assignees[]', assignee))
      }
      if (filters?.wbsPath?.length) {
        filters.wbsPath.forEach((path) => params.append('wbs_path[]', path))
      }
      if (filters?.dateRange) {
        params.append('date_start', filters.dateRange.start)
        params.append('date_end', filters.dateRange.end)
      }

      // Add sorting parameters
      if (filters?.sortBy) {
        params.append('sort_by', filters.sortBy)
      }
      if (filters?.sortOrder) {
        params.append('sort_order', filters.sortOrder)
      }
      if (filters?.workerId != null && filters.workerId > 0) {
        params.append('user_id', String(filters.workerId))
      }

      const url = params.toString()
        ? `/api/v1/projects/${projectId}/tasks?${params.toString()}`
        : `/api/v1/projects/${projectId}/tasks`
      console.log('📡 Tasks API: Making request to:', url)

      const response = await api.get(url)
      console.log('✅ Tasks API: Response received:', response.data)

      if (response.data == null) {
        throw new Error('Empty response from tasks API')
      }

      const { rows, pagination } = extractTaskRowsAndPagination(response.data)
      if (rows.length === 0) {
        console.warn(
          '⚠️ Tasks API: No task rows parsed from response (check envelope: data.tasks, tasks, results).',
          { projectId, url },
        )
      }

      const transformedTasks = rows.map((task) => {
        console.log('🔍 Raw task from API:', task.name, 'dependencies:', task.dependencies)
        return transformTaskFromApiRow(task)
      })

      const pag = pagination || {
        current_page: page ?? 1,
        per_page: transformedTasks.length,
        total: transformedTasks.length,
        last_page: 1,
      }

      const totalParsed = Number(pag.total)
      const currentPageParsed = Number(pag.current_page)
      const perPageParsed = Number(pag.per_page)
      const lastPageParsed = Number(pag.last_page)

      return {
        tasks: transformedTasks,
        pagination: {
          current_page: Number.isFinite(currentPageParsed) && currentPageParsed > 0 ? currentPageParsed : page ?? 1,
          per_page:
            Number.isFinite(perPageParsed) && perPageParsed > 0 ? perPageParsed : transformedTasks.length,
          total: Number.isFinite(totalParsed) ? totalParsed : transformedTasks.length,
          last_page: Number.isFinite(lastPageParsed) && lastPageParsed > 0 ? lastPageParsed : 1,
        },
      }
    } catch (error) {
      console.error('❌ Tasks API: Error fetching tasks:', error)
      // Check if it's a 404 (endpoint doesn't exist yet)
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } }
        if (axiosError.response?.status === 404) {
          console.log('🚫 Tasks API: Endpoint not found (404) - backend not ready yet')
        }
      }
      throw error
    }
  },

  // Get task by ID
  async getById(projectId: number, taskId: string): Promise<Task> {
    try {
      const response = await api.get(`/api/v1/projects/${projectId}/tasks/${taskId}`)
      const body = response.data as Record<string, unknown> | undefined
      const envelope = body?.data
      const raw =
        envelope && typeof envelope === 'object' && !Array.isArray(envelope)
          ? (envelope as Record<string, unknown>).task
          : undefined
      if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
        throw new Error('Malformed get task response')
      }
      return transformTaskFromApiRow(raw as Record<string, unknown>)
    } catch (error) {
      console.error('Error fetching task:', error)
      throw error
    }
  },

  // Create new task
  async create(projectId: number, data: TaskCreateUpdate): Promise<Task> {
    try {
      // Convert camelCase to snake_case for API and filter out undefined values
      const apiData: Record<string, unknown> = {}

      // Required fields
      if (data.name !== undefined) apiData.name = data.name
      // Handle both naming conventions for dates
      if (data.startPlanned !== undefined) apiData.start_planned = data.startPlanned
      if (data.endPlanned !== undefined) apiData.end_planned = data.endPlanned
      if (data.start_planned !== undefined) apiData.start_planned = data.start_planned
      if (data.end_planned !== undefined) apiData.end_planned = data.end_planned
      // Handle time fields
      if (data.start_time !== undefined) apiData.start_time = data.start_time
      if (data.end_time !== undefined) apiData.end_time = data.end_time
      // Handle milestone: store text code directly, or null/0 for regular tasks
      if (data.milestone_type !== undefined && data.milestone_type !== null) {
        apiData.milestone = data.milestone_type
      } else if (data.milestone !== undefined && data.milestone !== null && data.milestone !== false && data.milestone !== 0) {
        // If milestone is provided as string, use it; if boolean true, use 'other'; if false/null/0, use null
        if (typeof data.milestone === 'string') {
          apiData.milestone = data.milestone
        } else if (data.milestone === true) {
          apiData.milestone = 'other'
        } else {
          apiData.milestone = null
        }
      } else {
        // No milestone specified, set to null for regular task
        apiData.milestone = null
      }
      if (data.status !== undefined) apiData.status = mapStatusToBackend(String(data.status))
      else apiData.status = 'planned'
      if (data.progress_pct !== undefined) apiData.progress_pct = data.progress_pct

      // Optional fields - include if they exist
      if (data.wbsPath !== undefined) apiData.wbs_path = data.wbsPath
      if (data.wbs_path !== undefined) apiData.wbs_path = data.wbs_path

      // Calculate duration_days if not provided but dates are available
      if (data.durationDays !== undefined && data.durationDays !== null) {
        apiData.duration_days = data.durationDays
      } else if (data.duration_days !== undefined && data.duration_days !== null) {
        apiData.duration_days = data.duration_days
      } else {
        // Get dates from either naming convention
        const startDate = data.startPlanned || data.start_planned
        const endDate = data.endPlanned || data.end_planned

        if (startDate && endDate) {
          const start = new Date(startDate)
          const end = new Date(endDate)
          const diffTime = Math.abs(end.getTime() - start.getTime())
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 to include both start and end days
          apiData.duration_days = diffDays
          console.log(
            '📅 Calculated duration_days:',
            diffDays,
            'from dates:',
            startDate,
            'to',
            endDate,
          )
        }
      }
      if (data.notes !== undefined) apiData.notes = data.notes

      // Use task_lead_id from data if provided and valid (not null, 0, or empty string)
      if (data.task_lead_id !== undefined && data.task_lead_id !== null && data.task_lead_id !== 0) {
        const leadId = Number(data.task_lead_id)
        if (!isNaN(leadId) && leadId > 0) {
          apiData.task_lead_id = leadId
          console.log('👤 Using task_lead_id from data:', apiData.task_lead_id)
        } else {
          console.log('👤 task_lead_id is not a valid positive number, skipping:', data.task_lead_id)
        }
      } else {
        console.log('👤 task_lead_id is undefined/null/0/empty, not including in payload')
      }
      if (data.team_members !== undefined) {
        apiData.team_members = data.team_members
        console.log(
          '👥 Team members being sent:',
          data.team_members,
          'type:',
          typeof data.team_members,
        )
      }
      // Invited people only for milestones
      if (data.milestone || data.milestone_type) {
        // For milestones, always set invited_people (empty array if none, never null)
        if (data.invited_people !== undefined && Array.isArray(data.invited_people) && data.invited_people.length > 0) {
          apiData.invited_people = data.invited_people
          console.log('👥 Invited people being sent:', data.invited_people)
        } else {
          // Empty array for milestone with no invited people (always set, never null)
          apiData.invited_people = []
          console.log('👥 No invited people, sending empty array for milestone (never null)')
        }
      } else {
        // For regular tasks, set to null
        apiData.invited_people = null
        console.log('👥 Regular task, setting invited_people to null')
      }
      if (data.resources !== undefined) {
        apiData.resources = data.resources
        console.log('📦 Resources being sent:', data.resources, 'type:', typeof data.resources)
      }
      if (data.dependencies !== undefined) {
        apiData.dependencies = data.dependencies
        console.log(
          '🔗 Dependencies being sent:',
          data.dependencies,
          'type:',
          typeof data.dependencies,
        )
      }
      // Note: baseline_start, baseline_end, actual_start, actual_end, slack_days are not part of TaskCreateUpdate

      console.log('📤 Creating task with data:', data)
      console.log('📤 Converted to API format:', apiData)
      console.log('📤 API payload keys:', Object.keys(apiData))
      console.log('📤 API payload values:', Object.values(apiData))

      // Send full data to API
      const response = await api.post(`/api/v1/projects/${projectId}/tasks`, apiData)
      console.log('✅ Task created successfully:', response.data)
      
      // Check if response contains error status
      if (response.data.status === 'error' || response.data.error_code) {
        const errorMessage = response.data.message || 'Failed to create task'
        console.error('❌ Server returned error in response:', errorMessage)
        const error = new Error(errorMessage) as Error & { response?: { data?: { message?: string; error_code?: number } } }
        error.response = {
          data: {
            message: errorMessage,
            error_code: response.data.error_code,
          },
        }
        throw error
      }
      
      // Validate response structure
      if (!response.data.data || !response.data.data.task) {
        const errorMessage = 'Invalid response format from server'
        console.error('❌ Invalid response structure:', response.data)
        const error = new Error(errorMessage) as Error & { response?: { data?: { message?: string } } }
        error.response = {
          data: {
            message: errorMessage,
          },
        }
        throw error
      }
      
      return response.data.data.task
    } catch (error) {
      console.error('Error creating task:', error)

      // Log detailed error information
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown; status?: number } }
        console.error('🔍 API Error Details:', {
          status: axiosError.response?.status,
          data: axiosError.response?.data,
          payload: data,
        })
        console.error('🔍 Full error response:', axiosError.response)
        console.error('🔍 Error data details:', axiosError.response?.data)
        console.error(
          '🔍 Error message:',
          (axiosError.response?.data as { message?: string })?.message,
        )
        console.error(
          '🔍 Error code:',
          (axiosError.response?.data as { error_code?: string })?.error_code,
        )
      }

      throw error
    }
  },

  // Update task
  async update(projectId: number, taskId: string, data: Partial<TaskCreateUpdate>): Promise<Task> {
    try {
      // Convert camelCase to snake_case for API and handle both naming conventions
      const apiData: Record<string, unknown> = {}
      if (data.name !== undefined) apiData.name = data.name
      if (data.wbsPath !== undefined) apiData.wbs_path = data.wbsPath
      if (data.wbs_path !== undefined) apiData.wbs_path = data.wbs_path
      if (data.startPlanned !== undefined) apiData.start_planned = data.startPlanned
      if (data.endPlanned !== undefined) apiData.end_planned = data.endPlanned
      if (data.start_planned !== undefined) apiData.start_planned = data.start_planned
      if (data.end_planned !== undefined) apiData.end_planned = data.end_planned
      // Handle time fields
      if (data.start_time !== undefined) apiData.start_time = data.start_time
      if (data.end_time !== undefined) apiData.end_time = data.end_time
      if (data.durationDays !== undefined) apiData.duration_days = data.durationDays
      if (data.duration_days !== undefined) apiData.duration_days = data.duration_days
      // Handle milestone: store text code directly, or null/0 for regular tasks
      if (data.milestone_type !== undefined && data.milestone_type !== null) {
        apiData.milestone = data.milestone_type
      } else if (data.milestone !== undefined && data.milestone !== null && data.milestone !== false && data.milestone !== 0) {
        // If milestone is provided as string, use it; if boolean true, use 'other'; if false/null/0, use null
        if (typeof data.milestone === 'string') {
          apiData.milestone = data.milestone
        } else if (data.milestone === true) {
          apiData.milestone = 'other'
        } else {
          apiData.milestone = null
        }
      } else {
        // No milestone specified, set to null for regular task
        apiData.milestone = null
      }
      if (data.status !== undefined) apiData.status = mapStatusToBackend(String(data.status))
      if (data.progress_pct !== undefined) apiData.progress_pct = data.progress_pct
      if (data.notes !== undefined) apiData.notes = data.notes
      // Use task_lead_id from data if provided and valid (not null, 0, or empty string)
      if (data.task_lead_id !== undefined && data.task_lead_id !== null && data.task_lead_id !== 0) {
        const leadId = Number(data.task_lead_id)
        if (!isNaN(leadId) && leadId > 0) {
          apiData.task_lead_id = leadId
          console.log('👤 Using task_lead_id from data for update:', apiData.task_lead_id)
        } else {
          console.log('👤 task_lead_id is not a valid positive number, skipping:', data.task_lead_id)
        }
      } else if (data.task_lead_id === null) {
        // Explicitly set to null if it's explicitly null (to clear the field)
        apiData.task_lead_id = null
        console.log('👤 Setting task_lead_id to null to clear the field')
      } else {
        console.log('👤 task_lead_id is undefined/0/empty, not including in update payload')
      }
      if (data.team_members !== undefined) apiData.team_members = data.team_members
      // Invited people only for milestones
      if (data.milestone || data.milestone_type) {
        // For milestones, always set invited_people (empty array if none, never null)
        if (data.invited_people !== undefined && Array.isArray(data.invited_people) && data.invited_people.length > 0) {
          apiData.invited_people = data.invited_people
          console.log('👥 Invited people being sent for update:', data.invited_people)
        } else {
          // Empty array for milestone with no invited people (always set, never null)
          apiData.invited_people = []
          console.log('👥 No invited people, sending empty array for milestone update (never null)')
        }
      } else {
        // For regular tasks, set to null
        apiData.invited_people = null
        console.log('👥 Regular task update, setting invited_people to null')
      }
      if (data.resources !== undefined) apiData.resources = data.resources
      if (data.dependencies !== undefined) apiData.dependencies = data.dependencies
      if (data.task_order !== undefined) apiData.task_order = data.task_order
      // Note: baseline_start, baseline_end, actual_start, actual_end, slack_days are not part of TaskCreateUpdate

      const url = `/api/v1/projects/${projectId}/tasks/${taskId}`
      console.log('📤 PUT request to update task:', url)
      console.log('📤 Request payload:', apiData)
      if (apiData.start_planned || apiData.end_planned) {
        console.log('📅 Drag & Drop detected - updating dates:', {
          start_planned: apiData.start_planned,
          end_planned: apiData.end_planned,
        })
      }
      const response = await api.put(url, apiData)
      console.log('✅ Task updated successfully via PUT:', response.data)
      
      // Check if response contains error status
      if (response.data.status === 'error' || response.data.error_code) {
        const errorMessage = response.data.message || 'Failed to update task'
        console.error('❌ Server returned error in response:', errorMessage)
        const error = new Error(errorMessage) as Error & { response?: { data?: { message?: string; error_code?: number } } }
        error.response = {
          data: {
            message: errorMessage,
            error_code: response.data.error_code,
          },
        }
        throw error
      }
      
      // Validate response structure
      if (!response.data.data || !response.data.data.task) {
        const errorMessage = 'Invalid response format from server'
        console.error('❌ Invalid response structure:', response.data)
        const error = new Error(errorMessage) as Error & { response?: { data?: { message?: string } } }
        error.response = {
          data: {
            message: errorMessage,
          },
        }
        throw error
      }
      
      return response.data.data.task
    } catch (error) {
      console.error('Error updating task:', error)

      // Log detailed error information
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown; status?: number } }
        console.error('🔍 API Update Error Details:', {
          status: axiosError.response?.status,
          data: axiosError.response?.data,
          payload: data,
        })
      }

      throw error
    }
  },

  // Delete task
  async delete(projectId: number, taskId: string): Promise<void> {
    try {
      await api.delete(`/api/v1/projects/${projectId}/tasks/${taskId}`)
    } catch (error) {
      console.error('Error deleting task:', error)
      throw error
    }
  },

  // Get task statistics
  async getStats(projectId: number): Promise<TaskStats> {
    try {
      const response = await api.get(`/api/v1/projects/${projectId}/tasks/stats`)
      return response.data.data
    } catch (error) {
      console.error('Error fetching task stats:', error)
      throw error
    }
  },

  // Update task progress
  async updateProgress(projectId: number, taskId: string, progressPct: number): Promise<Task> {
    try {
      const response = await api.patch(`/api/v1/projects/${projectId}/tasks/${taskId}/progress`, {
        progressPct,
      })
      return response.data.data.task
    } catch (error) {
      console.error('Error updating task progress:', error)
      throw error
    }
  },

  // Update task status
  async updateStatus(projectId: number, taskId: string, status: string): Promise<Task> {
    try {
      const response = await api.patch(`/api/v1/projects/${projectId}/tasks/${taskId}/status`, {
        status: mapStatusToBackend(status),
      })
      return response.data.data.task
    } catch (error) {
      console.error('Error updating task status:', error)
      throw error
    }
  },

  // Reorder tasks
  async reorderTasks(projectId: number, taskOrder: number[]): Promise<void> {
    try {
      console.log('🔄 Reordering tasks for project:', projectId, 'with order:', taskOrder)

      const response = await api.put(`/api/v1/projects/${projectId}/tasks/reorder`, {
        projectId: projectId,
        order: taskOrder,
      })

      console.log('✅ Tasks reordered successfully:', response.data)
    } catch (error) {
      console.error('❌ Error reordering tasks:', error)

      // Log detailed error information
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown; status?: number } }
        console.error('🔍 Reorder API Error Details:', {
          status: axiosError.response?.status,
          data: axiosError.response?.data,
          projectId,
          taskOrder,
        })
      }

      throw error
    }
  },

  // Get available workers for a task (excluding busy workers and already assigned)
  async getAvailableWorkers(
    taskId: string,
    startDate: string,
    endDate: string,
  ): Promise<Array<{ id: number; name: string; role: string; email?: string; avatar_url?: string }>> {
    try {
      console.log('👥 Getting available workers for task:', taskId, 'dates:', startDate, 'to', endDate)
      
      const response = await api.get(`/api/v1/tasks/${taskId}/available-workers`, {
        params: {
          start_date: startDate,
          end_date: endDate,
        },
      })
      
      console.log('✅ Available workers response:', response.data)
      
      if (response.data?.data?.workers) {
        return response.data.data.workers.map((worker: any) => ({
          id: worker.id || worker.user_id,
          name: worker.full_name || `${worker.first_name || ''} ${worker.last_name || ''}`.trim() || worker.name || 'Unknown',
          role: worker.role_name || worker.role || 'Worker',
          email: worker.email,
          avatar_url: worker.avatar_url,
        }))
      }
      
      return []
    } catch (error) {
      console.error('❌ Error getting available workers:', error)
      // Fallback: return empty array if endpoint doesn't exist yet
      return []
    }
  },
}

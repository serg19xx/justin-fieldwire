import { api } from './api'
import type { ProjectPurchaseLeaseType } from './constants'

// Types
export interface ProjectTeamMember {
  id: number
  project_id: number
  task_id?: number | null // For task/milestone assignments
  user_id: number | null // Can be null for invited external people
  role_in_project: string // 'task_lead', 'member', 'invited', etc.
  assigned_at: string
  added_by?: number
  name?: string // From user or invited_data
  email?: string // From user or invited_data
  /** Mobile / cell phone from user profile or invited_data */
  phone?: string
  user_type?: string
  job_title?: string
  status?: number
  invited_people?: InvitedPersonData // JSON data for external invited people
  avatar_url?: string | null // User avatar URL (from API)
  full_img_url?: string | null // Full image URL (from API)
}

// Invited person data (stored in invited_people JSON field)
export interface InvitedPersonData {
  name: string
  email?: string
  company?: string
  phone?: string
  notes?: string
  avatar?: string
}

export type ClientTableType = 'pharma' | 'physician' | 'pharmacist' | 'medical_clinic'

/** Project level enum (DB: level) */
export type ProjectLevel = 'Basics' | 'Full Service' | 'Medical Nice' | 'High End' | 'Extravagant'

export interface Project {
  id: number
  prj_name: string
  address: string
  description?: string
  priority?: string
  date_start?: string | null
  date_end?: string | null
  status: string
  /** System lifecycle: draft | active | closing | suspended | done (see project-sys-status.ts) */
  sys_status?: string | null
  purchase_or_lease?: ProjectPurchaseLeaseType
  notes?: string | null
  /** Note from notes table (fw_notes.note), if API returns it */
  note?: string | null
  /** Area (e.g. sq ft); mediumint unsigned */
  area?: number | null
  /** Project level enum */
  level?: ProjectLevel | null
  client_id?: number | null
  client_type?: string | null
  client_table?: ClientTableType | null
  client_data?: Record<string, unknown> | null // JSON field for additional client information
  client_name?: string | null // Client name from server
  client2_id?: number | null
  client2_type?: string | null
  client2_table?: ClientTableType | null
  client2_data?: Record<string, unknown> | null
  client2_name?: string | null // Secondary client name from server
  prj_manager?: number
  manager_name?: string
  created_by?: number
  created_by_name?: string
  created_at: string
  updated_at: string
}

/**
 * Read lifecycle from API JSON (some backends use camelCase `sysStatus`).
 * First non-empty value wins: `sys_status`, then `sysStatus`.
 */
export function readSysStatusFromApiRow(row: Record<string, unknown> | null | undefined): string | null {
  if (!row) return null
  for (const key of ['sys_status', 'sysStatus'] as const) {
    const v = row[key]
    if (v == null) continue
    const s = typeof v === 'string' ? v.trim() : String(v).trim()
    if (s) return s
  }
  return null
}

function normalizeProjectRecordFromApi(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw
  const row = raw as Record<string, unknown>
  const next: Record<string, unknown> = { ...row }
  const sys = readSysStatusFromApiRow(row)
  if (sys != null) next.sys_status = sys
  if (next.prj_name == null && typeof next.name === 'string' && next.name.trim()) {
    next.prj_name = next.name
  }
  return next
}

function normalizeProjectsListPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw
  const o = raw as Record<string, unknown>
  const out: Record<string, unknown> = { ...o }
  if (Array.isArray(o.projects)) {
    out.projects = o.projects.map((p) => normalizeProjectRecordFromApi(p))
  }
  if (Array.isArray(o.data)) {
    out.data = o.data.map((p) => normalizeProjectRecordFromApi(p))
  }
  if (Array.isArray(o.results)) {
    out.results = o.results.map((p) => normalizeProjectRecordFromApi(p))
  }
  if (Array.isArray(o.items)) {
    out.items = o.items.map((p) => normalizeProjectRecordFromApi(p))
  }
  return out
}

/**
 * Unwrap axios `response.data`: list may be at `data`, nested `data.projects`, or top-level `projects`.
 */
function extractProjectsListRoot(response: { data?: unknown }): unknown {
  const body = response.data as Record<string, unknown> | undefined
  if (body == null) return null
  if (Array.isArray(body)) return body

  const inner = body.data
  if (Array.isArray(inner)) return inner
  if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
    const mid = inner as Record<string, unknown>
    if (
      Array.isArray(mid.projects) ||
      Array.isArray(mid.data) ||
      Array.isArray(mid.results) ||
      Array.isArray(mid.items)
    ) {
      return inner
    }
  }

  return body
}

/** Result of project list endpoint: plain array or envelope with `projects` / `data` / pagination. */
export type ProjectsListApiResult =
  | Project[]
  | {
      projects?: Project[]
      data?: Project[]
      results?: Project[]
      items?: Project[]
      pagination?: Record<string, unknown>
      meta?: Record<string, unknown>
      total?: number
      last_page?: number
    }

// Project API
export const projectApi = {
  async getAll(
    page: number = 1,
    limit: number = 100,
    filters: Record<string, unknown> = {},
  ): Promise<ProjectsListApiResult> {
    const response = await api.get('/api/v1/projects', {
      params: { page, limit, ...filters },
    })
    const raw = extractProjectsListRoot(response)
    if (Array.isArray(raw)) {
      return raw.map((p) => normalizeProjectRecordFromApi(p)) as Project[]
    }
    return normalizeProjectsListPayload(raw) as ProjectsListApiResult
  },

  async getById(id: number) {
    const response = await api.get(`/api/v1/projects/${id}`)
    const data = response.data?.data as Record<string, unknown> | undefined
    const proj = (data?.project ?? data) as unknown
    return normalizeProjectRecordFromApi(proj) as Project
  },

  async update(id: number, data: Record<string, unknown>) {
    // Ensure all client and client2 fields are explicitly included in the request
    const requestData = {
      ...data,
      client_id: data.client_id !== undefined ? data.client_id : null,
      client_type: data.client_type !== undefined ? data.client_type : null,
      client_table: data.client_table !== undefined ? data.client_table : null,
      client_data: data.client_data !== undefined ? data.client_data : null,
      client2_id: data.client2_id !== undefined ? data.client2_id : null,
      client2_type: data.client2_type !== undefined ? data.client2_type : null,
      client2_table: data.client2_table !== undefined ? data.client2_table : null,
      client2_data: data.client2_data !== undefined ? data.client2_data : null,
    }

    const response = await api.put(`/api/v1/projects/${id}`, requestData)
    return response.data
  },

  async getTeamMembers(projectId: number) {
    const response = await api.get(`/api/v1/projects/${projectId}/team`)
    return response.data
  },

  // Get team members for a specific task/milestone
  async getTaskTeamMembers(projectId: number, taskId: number) {
    const response = await api.get(`/api/v1/projects/${projectId}/tasks/${taskId}/team`)
    return response.data
  },

  // Add invited person to milestone (creates record in fw_prj_team_members)
  async addInvitedPerson(
    projectId: number,
    taskId: number,
    invitedData: InvitedPersonData,
    userId?: number | null
  ) {
    const response = await api.post(`/api/v1/projects/${projectId}/tasks/${taskId}/invited`, {
      user_id: userId || null,
      role_in_project: 'invited',
      invited_people: invitedData,
    })
    return response.data
  },

  // Remove invited person
  async removeInvitedPerson(projectId: number, teamMemberId: number) {
    const response = await api.delete(`/api/v1/projects/${projectId}/team/${teamMemberId}`)
    return response.data
  },

  async updateTeamMemberRole(projectId: number, memberId: number, role: string) {
    const response = await api.put(`/api/v1/projects/${projectId}/team/${memberId}`, {
      role,
    })
    return response.data
  },

  async removeTeamMember(projectId: number, memberId: number) {
    const response = await api.delete(`/api/v1/projects/${projectId}/team/${memberId}`)
    return response.data
  },

  async create(data: Record<string, unknown>) {
    const response = await api.post('/api/v1/projects', data)
    return response.data
  },

  async delete(id: number) {
    const response = await api.delete(`/api/v1/projects/${id}`)
    return response.data
  },
}

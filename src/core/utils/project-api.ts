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
export type ProjectLevel = 'Bacics' | 'Full Service' | 'Medical Nice' | 'High End' | 'Extravagant'

export interface Project {
  id: number
  prj_name: string
  address: string
  description?: string
  priority?: string
  date_start?: string | null
  date_end?: string | null
  status: string
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

// Project API
export const projectApi = {
  async getAll(page: number = 1, limit: number = 100, filters: Record<string, unknown> = {}) {
    const response = await api.get('/api/v1/projects', {
      params: { page, limit, ...filters },
    })
    return response.data.data
  },

  async getById(id: number) {
    const response = await api.get(`/api/v1/projects/${id}`)
    return response.data.data.project
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

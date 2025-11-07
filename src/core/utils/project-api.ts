import { api } from './api'

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

export interface Project {
  id: number
  prj_name: string
  address: string
  description?: string
  priority: string
  date_start: string
  date_end: string
  status: string
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
    const response = await api.put(`/api/v1/projects/${id}`, data)
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

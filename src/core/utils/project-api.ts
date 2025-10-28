import { api } from './api'

// Types
export interface ProjectTeamMember {
  id: number
  project_id: number
  user_id: number
  role: string
  added_at: string
  added_by: number
  name: string
  email: string
  user_type: string
  job_title: string
  status: number
}

export interface Project {
  id: number
  prj_name: string
  address: string
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

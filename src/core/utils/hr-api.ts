import { api } from './api'
import type { ProjectTeamMember } from './project-api'

// HR Resources API - Get all available users for HR management
export const hrResourcesApi = {
  async getAllUsers(
    page: number = 1,
    limit: number = 100,
    filters: {
      status?: string
      search?: string
      user_type?: string
      project_id?: number | null
    } = {},
  ): Promise<{
    users: Worker[]
    pagination: {
      current_page: number
      per_page: number
      total: number
      last_page: number
    }
  }> {
    try {
      const requestBody = {
        page,
        limit,
        ...filters,
        // For general projects, pass null instead of project_id
        project_id: filters.project_id || null,
      }

      console.log('🔍 Making request to:', `/api/v1/workers`, requestBody)
      const response = await api.post(`/api/v1/workers`, requestBody)
      console.log('✅ Users API response:', response.data)
      return response.data.data
    } catch (error: any) {
      console.error('Error fetching users:', error)
      if (error.response) {
        console.error('Response status:', error.response.status)
        console.error('Response data:', error.response.data)
        console.error('Response headers:', error.response.headers)
      }
      throw error
    }
  },

  // Get project team members
  async getProjectTeam(projectId: number): Promise<ProjectTeamMember[]> {
    try {
      console.log('🔍 Getting team for project:', projectId)
      const response = await api.get(`/api/v1/projects/${projectId}/team`)
      console.log('✅ Project team response:', response.data)
      return response.data.data || []
    } catch (error: any) {
      console.error('Error fetching project team:', error)
      throw error
    }
  },

  // Add team member to project
  async addTeamMember(
    projectId: number | null,
    userId: number,
    role: string = 'member',
  ): Promise<ProjectTeamMember> {
    try {
      console.log('🔍 Adding team member:', { projectId, userId, role })
      const response = await api.post(`/api/v1/projects/${projectId}/team`, {
        user_id: userId,
        role: role,
        project_id: projectId, // Pass in body for general projects
      })
      console.log('✅ Team member added:', response.data)
      return response.data.data
    } catch (error: any) {
      console.error('Error adding team member:', error)
      throw error
    }
  },

  // Update team member role
  async updateTeamMember(
    projectId: number,
    teamMemberId: number,
    role: string,
  ): Promise<ProjectTeamMember> {
    try {
      console.log('🔍 Updating team member:', { projectId, teamMemberId, role })
      const response = await api.put(`/api/v1/projects/${projectId}/team/${teamMemberId}`, {
        role: role,
      })
      console.log('✅ Team member updated:', response.data)
      return response.data.data
    } catch (error: any) {
      console.error('Error updating team member:', error)
      throw error
    }
  },

  // Remove team member from project
  async removeTeamMember(projectId: number, teamMemberId: number): Promise<void> {
    try {
      console.log('🔍 Removing team member:', { projectId, teamMemberId })
      const response = await api.delete(`/api/v1/projects/${projectId}/team/${teamMemberId}`)
      console.log('✅ Team member removed:', response.data)
    } catch (error: any) {
      console.error('Error removing team member:', error)
      throw error
    }
  },
}

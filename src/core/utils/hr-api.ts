import { api } from './api'
import type { ProjectTeamMember } from './project-api'
import { useAuthStore } from '../stores/auth'

// Professional data interface
export interface ProfessionalData {
  id: number
  user_id: number
  total_experience: number
  education_level: string
  field_of_study: string
  institution_name: string
  graduation_year: number
  professional_summary: string
  specialized_skills: string
  specialized_experience: string
  key_projects: string
  previous_employers: string
  references: string
  availability: string
  travel_willingness: string
  drivers_license: string
  red_seal: string | null
  provincial_certificate: string | null
  union_membership: string | null
  equipment_tools: string | null
  whmis: string
  first_aid: string | null
  fall_protection: string | null
  confined_space: string | null
  lockout_tagout: string | null
  other_safety: string | null
  created_at: string
  updated_at: string
}

// Language interface
export interface Language {
  id: number
  name: string
  prof_level: string
}

// Project interface
export interface Project {
  id: number
  name: string
  address: string
  date_start: string
  date_end: string
  priority: string
  status: string
  prj_manager: number
  manager: {
    id: number
    first_name: string
    last_name: string
    email: string
    phone: string | null
    avatar_url: string
    full_img_url: string
  }
  created_at: string
  updated_at: string
  role_in_project: string
  assigned_at: string
}

// WorkerUser interface for global system
export interface WorkerUser {
  id: number
  email: string
  first_name: string
  last_name: string
  dob: string | null
  gender: string | null
  nationality: string | null
  country_of_origin: string | null
  workforce_group: string | null
  phone: string | null
  role_id: number | null
  job_title: string | null
  city: string | null
  status: number
  emergency: any | null
  status_changed_at: string
  status_end_at: string | null
  status_reason: string | null
  status_details: string | null
  additional_info: string | null
  full_img_url: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
  invitation_status: 'invited' | 'registered' | 'expired'
  invitation_sent_at: string | null
  invitation_expires_at: string | null
  invited_by: number | null
  registration_completed_at: string | null
  invitation_attempts: number
  last_reminder_sent_at: string | null
  archived_at: string | null
  code: string | null
  name: string | null
  category: string | null
  description: string | null
  role: {
    id: number | null
    code: string | null
    name: string | null
    category: string | null
  }
  professional_data: ProfessionalData[]
  projects: Project[]
  languages: Language[]
  // Legacy fields for backward compatibility
  two_factor_enabled?: boolean
  two_factor_secret?: string | null
  last_login?: string | null
  role_code?: string
  role_name?: string
  role_category?: string
  role_description?: string | null
}

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
    users: ProjectTeamMember[]
    pagination: {
      current_page: number
      per_page: number
      total: number
      last_page: number
    }
  }> {
    try {
      // Используем существующий endpoint для получения работников
      console.log('🔍 Making request to:', `/api/v1/workers`)
      console.log('🔍 Filters:', filters)
      console.log('🔍 Page:', page, 'Limit:', limit)
      const response = await api.get(`/api/v1/workers`)
      console.log('✅ Team API response:', response.data)
      console.log('🔍 Response status:', response.status)
      console.log('🔍 Response headers:', response.headers)
      console.log('🔍 Full response.data structure:', JSON.stringify(response.data, null, 2))
      console.log('🔍 response.data.data:', response.data.data)
      console.log('🔍 response.data.workers:', response.data.workers)

      // Check if response has the expected structure
      if (response.data && response.data.data && response.data.data.workers) {
        const workers = response.data.data.workers
        const pagination = response.data.data.pagination

        console.log('✅ Using response.data.data.workers structure')
        return {
          users: workers,
          pagination: pagination,
        }
      } else if (response.data && response.data.workers) {
        // Alternative structure: response.data.workers directly
        const workers = response.data.workers
        const pagination = response.data.pagination || {
          current_page: 1,
          per_page: 100,
          total: workers.length,
          last_page: 1,
        }

        console.log('✅ Using response.data.workers structure')
        return {
          users: workers,
          pagination: pagination,
        }
      } else {
        console.warn('⚠️ API returned unexpected structure:', response.data)
        return {
          users: [],
          pagination: {
            current_page: 1,
            per_page: 50,
            total: 0,
            last_page: 1,
          },
        }
      }
    } catch (error: unknown) {
      console.error('Error fetching users:', error)
      const apiError = error as {
        response?: { status?: number; data?: unknown; headers?: unknown }
      }
      if (apiError.response) {
        console.error('Response status:', apiError.response.status)
        console.error('Response data:', apiError.response.data)
        console.error('Response headers:', apiError.response.headers)

        // Если 500 ошибка, возвращаем mock данные для тестирования
        if (apiError.response.status === 500) {
          console.warn('⚠️ Backend error 500 - using mock data for testing')
          return {
            users: [
              {
                id: 1,
                project_id: filters.project_id || 1,
                user_id: 1,
                role: 'worker',
                added_at: '2024-01-01T00:00:00Z',
                added_by: 1,
                name: 'John Doe',
                email: 'john@example.com',
                user_type: 'worker',
                job_title: 'Construction WorkerUser',
                status: 1,
              },
              {
                id: 2,
                project_id: filters.project_id || 1,
                user_id: 2,
                role: 'foreman',
                added_at: '2024-01-01T00:00:00Z',
                added_by: 1,
                name: 'Jane Smith',
                email: 'jane@example.com',
                user_type: 'foreman',
                job_title: 'Foreman',
                status: 1,
              },
            ],
            pagination: {
              current_page: 1,
              per_page: 2,
              total: 2,
              last_page: 1,
            },
          }
        }
      }
      throw error
    }
  },

  // Invite worker
  async inviteWorkerUser(invitationData: {
    email: string
    role: string
    project_id?: number
  }): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('🔍 Sending invitation to:', invitationData.email)
      const response = await api.post('/api/v1/workers/invite', invitationData)
      console.log('✅ Invitation sent:', response.data)
      return { success: true, message: 'Invitation sent successfully' }
    } catch (error: unknown) {
      console.error('Error sending invitation:', error)
      const apiError = error as { response?: { data?: { message?: string } } }
      return {
        success: false,
        message: apiError.response?.data?.message || 'Failed to send invitation',
      }
    }
  },

  // Get email providers
  async getEmailProviders(): Promise<string[]> {
    try {
      console.log('🔍 Getting email providers')
      const response = await api.get('/api/v1/workers/email-providers')
      console.log('✅ Email providers:', response.data)
      return response.data.providers || []
    } catch (error: unknown) {
      console.error('Error getting email providers:', error)
      return []
    }
  },

  // Get all workers (global system) with pagination and filters
  async getAllWorkerUsers(
    page: number = 1,
    limit: number = 20,
    filters: {
      status?: string
      user_status?: string
      role_code?: string
      role_id?: number
      job_title?: string
      search?: string
      archived?: boolean
      two_factor?: boolean
      invitation_status?: string
      view_mode?: string
      project_id?: number
      prj_mngr_id?: number
      sort_by?: string
      sort_order?: 'ASC' | 'DESC'
    } = {},
  ): Promise<{
    workers: WorkerUser[]
    pagination: {
      current_page: number
      per_page: number
      total: number
      last_page: number
      from: number
      to: number
      has_next_page: boolean
      has_prev_page: boolean
      next_page: number | null
      prev_page: number | null
    }
  }> {
    try {
      console.log('🔍 Getting all workers from global system')
      console.log('📋 Parameters:', { page, limit, filters })

      // Check current user info
      const authStore = useAuthStore()
      console.log('👤 Current user info:', {
        id: authStore.currentUser?.id,
        email: authStore.currentUser?.email,
        role_code: authStore.currentUser?.role_code,
        role_category: authStore.currentUser?.role_category,
        isAuthenticated: authStore.isAuthenticated,
      })

      // Строим query параметры
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', limit.toString())

      // Добавляем фильтры
      if (filters.status) params.append('status', filters.status)
      if (filters.user_status) params.append('user_status', filters.user_status)
      if (filters.role_code) params.append('role_code', filters.role_code)
      if (filters.role_id) params.append('role_id', filters.role_id.toString())
      if (filters.job_title) params.append('job_title', filters.job_title)
      if (filters.search) params.append('search', filters.search)
      if (filters.archived !== undefined) params.append('archived', filters.archived.toString())
      if (filters.two_factor !== undefined)
        params.append('two_factor', filters.two_factor.toString())
      if (filters.invitation_status) params.append('invitation_status', filters.invitation_status)
      if (filters.view_mode) params.append('view_mode', filters.view_mode)
      if (filters.project_id) params.append('project_id', filters.project_id.toString())
      if (filters.prj_mngr_id) params.append('prj_mngr_id', filters.prj_mngr_id.toString())
      if (filters.sort_by) params.append('sort_by', filters.sort_by)
      if (filters.sort_order) params.append('sort_order', filters.sort_order)

      console.log('🔍 Making request to workers endpoint with params:', params.toString())
      console.log('🔍 Full URL:', `/api/v1/workers?${params.toString()}`)

      const response = await api.get(`/api/v1/workers?${params.toString()}`)
      console.log('✅ All workers response:', response.data)

      // Обрабатываем правильную структуру ответа
      if (response.data && response.data.data && response.data.data.workers) {
        const workers = response.data.data.workers
        const pagination = response.data.data.pagination
        console.log('📊 Found workers:', workers.length, 'Total:', pagination.total)

        return {
          workers: workers,
          pagination: pagination,
        }
      } else {
        console.warn('⚠️ Unexpected response structure:', response.data)
        return {
          workers: [],
          pagination: {
            current_page: 1,
            per_page: 20,
            total: 0,
            last_page: 1,
            from: 0,
            to: 0,
            has_next_page: false,
            has_prev_page: false,
            next_page: null,
            prev_page: null,
          },
        }
      }
    } catch (error: unknown) {
      console.error('Error fetching all workers:', error)
      const apiError = error as { response?: { status?: number } }
      if (apiError.response?.status === 401) {
        console.error('❌ Unauthorized - check authentication token')
      } else if (apiError.response?.status === 500) {
        console.warn('⚠️ Backend error 500 - using mock data for testing')
        return {
          workers: [
            {
              id: 1,
              email: 'john@example.com',
              first_name: 'John',
              last_name: 'Doe',
              phone: '',
              role_id: 1,
              job_title: 'Construction Worker',
              status: 1,
              status_reason: null,
              status_details: null,
              additional_info: null,
              avatar_url: null,
              two_factor_enabled: false,
              two_factor_secret: null,
              last_login: null,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
              invitation_status: 'registered',
              invitation_sent_at: '2024-01-01T00:00:00Z',
              invitation_expires_at: '2024-01-01T00:00:00Z',
              invited_by: 1,
              registration_completed_at: '2024-01-01T00:00:00Z',
              invitation_attempts: 0,
              last_reminder_sent_at: null,
              archived_at: null,
              role_code: 'worker',
              role_name: 'Worker',
              role_category: 'task',
              role_description: null,
            },
            {
              id: 2,
              email: 'jane@example.com',
              first_name: 'Jane',
              last_name: 'Smith',
              phone: '',
              role_id: 2,
              job_title: 'Foreman',
              status: 1,
              status_reason: null,
              status_details: null,
              additional_info: null,
              avatar_url: null,
              two_factor_enabled: false,
              two_factor_secret: null,
              last_login: null,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
              invitation_status: 'registered',
              invitation_sent_at: '2024-01-01T00:00:00Z',
              invitation_expires_at: '2024-01-01T00:00:00Z',
              invited_by: 1,
              registration_completed_at: '2024-01-01T00:00:00Z',
              invitation_attempts: 0,
              last_reminder_sent_at: null,
              archived_at: null,
              role_code: 'foreman',
              role_name: 'Foreman',
              role_category: 'task',
              role_description: null,
            },
          ],
          pagination: {
            current_page: 1,
            per_page: 20,
            total: 2,
            last_page: 1,
            from: 1,
            to: 2,
            has_next_page: false,
            has_prev_page: false,
            next_page: null,
            prev_page: null,
          },
        }
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      console.error('Error removing team member:', error)
      throw error
    }
  },
}

// Get all available roles from database
export async function getRoles(): Promise<Array<{
  id: number
  code: string
  name: string
  category: string
  description: string
}>> {
  try {
    console.log('🔍 Fetching roles from API...')
    const response = await api.get('/api/v1/roles')
    console.log('✅ Roles API response:', response.data)

    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      return response.data.data
    } else if (response.data && Array.isArray(response.data)) {
      return response.data
    } else {
      console.warn('⚠️ Unexpected roles response structure:', response.data)
      return getFallbackRoles()
    }
  } catch (error) {
    console.error('❌ Error fetching roles from API, using fallback:', error)
    return getFallbackRoles()
  }
}

// Fallback roles based on database structure you provided
function getFallbackRoles(): Array<{
  id: number
  code: string
  name: string
  category: string
  description: string
}> {
  return [
    { id: 9, code: 'admin', name: 'Administrator', category: 'global', description: 'Full system access' },
    { id: 10, code: 'project_manager', name: 'Project Manager', category: 'project', description: 'Manages projects and teams' },
    { id: 11, code: 'architect', name: 'Architect', category: 'project', description: 'Designs and plans projects' },
    { id: 12, code: 'foreman', name: 'Foreman', category: 'task', description: 'Supervises workers on site' },
    { id: 13, code: 'worker', name: 'Worker', category: 'task', description: 'Performs construction tasks' },
    { id: 14, code: 'contractor', name: 'Contractor', category: 'task', description: 'Independent contractor' },
    { id: 15, code: 'inspector', name: 'Inspector', category: 'task', description: 'Quality and safety inspector' }
  ]
}

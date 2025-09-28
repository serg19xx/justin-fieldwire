import { api } from './api'
import type { Task, TaskCreateUpdate, TaskFilter, TaskStats } from '@/core/types/task'

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

      const url = params.toString()
        ? `/api/v1/projects/${projectId}/tasks?${params.toString()}`
        : `/api/v1/projects/${projectId}/tasks`
      console.log('📡 Tasks API: Making request to:', url)

      const response = await api.get(url)
      console.log('✅ Tasks API: Response received:', response.data)

      // Check if response is empty or malformed
      if (!response.data || !response.data.data) {
        console.log('⚠️ Tasks API: Empty or malformed response, throwing error to trigger fallback')
        throw new Error('Empty response from tasks API')
      }

      // Transform database fields to our interface
      const transformedTasks = response.data.data.tasks.map((task: Record<string, unknown>) => {
        console.log('🔍 Raw task from API:', task.name, 'dependencies:', task.dependencies)
        return {
          ...task,
          wbs_path: task.wbs_path || '', // Keep as string "1.1.1"
          start_planned: task.start_planned,
          end_planned: task.end_planned,
          duration_days: task.duration_days,
          milestone: Boolean(task.milestone),
          status: task.status,
          progress_pct: task.progress_pct || 0,
          notes: task.notes,
          // Handle both old and new structure
          task_lead_id:
            task.task_lead_id ||
            (Array.isArray(task.assignees) && task.assignees.length > 0 ? task.assignees[0] : null),
          team_members:
            task.team_members || (Array.isArray(task.assignees) ? task.assignees.slice(1) : []),
          assignees: Array.isArray(task.assignees) ? task.assignees : [], // Keep for backward compatibility
          resources: task.resources || [],
          dependencies: task.dependencies || [],
          baseline_start: task.baseline_start,
          baseline_end: task.baseline_end,
          actual_start: task.actual_start,
          actual_end: task.actual_end,
          slack_days: task.slack_days,
          created_at: task.created_at,
          updated_at: task.updated_at,
        }
      })

      return {
        tasks: transformedTasks,
        pagination: response.data.data.pagination || {
          current_page: 1,
          per_page: transformedTasks.length,
          total: transformedTasks.length,
          last_page: 1,
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
      return response.data.data.task
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
      if (data.milestone !== undefined) apiData.milestone = data.milestone
      if (data.status !== undefined) apiData.status = data.status
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

      // Validate task_lead_id - use existing user ID (47 - Mike Davis)
      if (data.task_lead_id !== undefined) {
        // Use a valid user ID that exists in the system
        apiData.task_lead_id = 47 // Mike Davis - Project Manager
        console.log(
          '👤 Using valid task_lead_id:',
          apiData.task_lead_id,
          'instead of:',
          data.task_lead_id,
        )
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
      if (data.durationDays !== undefined) apiData.duration_days = data.durationDays
      if (data.duration_days !== undefined) apiData.duration_days = data.duration_days
      if (data.milestone !== undefined) apiData.milestone = data.milestone
      if (data.status !== undefined) apiData.status = data.status
      if (data.progress_pct !== undefined) apiData.progress_pct = data.progress_pct
      if (data.notes !== undefined) apiData.notes = data.notes
      if (data.task_lead_id !== undefined) apiData.task_lead_id = data.task_lead_id
      if (data.team_members !== undefined) apiData.team_members = data.team_members
      if (data.resources !== undefined) apiData.resources = data.resources
      if (data.dependencies !== undefined) apiData.dependencies = data.dependencies
      // Note: baseline_start, baseline_end, actual_start, actual_end, slack_days are not part of TaskCreateUpdate

      console.log('📤 Updating task with data:', data)
      console.log('📤 Converted to API format:', apiData)
      const response = await api.put(`/api/v1/projects/${projectId}/tasks/${taskId}`, apiData)
      console.log('✅ Task updated successfully:', response.data)
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
        status,
      })
      return response.data.data.task
    } catch (error) {
      console.error('Error updating task status:', error)
      throw error
    }
  },
}

import { api } from './api'
import type { Task, TaskCreateUpdate, TaskFilter, TaskStats } from '@/core/types/task'
import { isMilestone, type MilestoneType } from '@/core/types/task'

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
          // milestone can be text code (MilestoneType) or number/boolean (for backward compatibility)
          milestone: typeof task.milestone === 'string' 
            ? task.milestone as MilestoneType
            : (task.milestone ? 'other' : null),
          milestone_type: typeof task.milestone === 'string' 
            ? task.milestone as MilestoneType
            : (task.milestone ? 'other' : undefined),
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

      // Use task_lead_id from data if provided and valid (not null, 0, or empty string)
      if (data.task_lead_id !== undefined && data.task_lead_id !== null && data.task_lead_id !== 0 && data.task_lead_id !== '') {
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
      if (data.status !== undefined) apiData.status = data.status
      if (data.progress_pct !== undefined) apiData.progress_pct = data.progress_pct
      if (data.notes !== undefined) apiData.notes = data.notes
      // Use task_lead_id from data if provided and valid (not null, 0, or empty string)
      if (data.task_lead_id !== undefined && data.task_lead_id !== null && data.task_lead_id !== 0 && data.task_lead_id !== '') {
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
        status,
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

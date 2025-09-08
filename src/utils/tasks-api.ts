import { api } from './api'
import type { Task, TaskCreateUpdate, TaskFilter, TaskStats } from '@/types/task'

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

interface TaskResponse {
  task: Task
}

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
      const transformedTasks = response.data.data.tasks.map((task: any) => ({
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
          (task.assignees && task.assignees.length > 0 ? task.assignees[0] : null),
        team_members: task.team_members || (task.assignees ? task.assignees.slice(1) : []),
        assignees: task.assignees || [], // Keep for backward compatibility
        resources: task.resources || [],
        dependencies: task.dependencies || [],
        baseline_start: task.baseline_start,
        baseline_end: task.baseline_end,
        actual_start: task.actual_start,
        actual_end: task.actual_end,
        slack_days: task.slack_days,
        created_at: task.created_at,
        updated_at: task.updated_at,
      }))

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
      if (error.response?.status === 404) {
        console.log('🚫 Tasks API: Endpoint not found (404) - backend not ready yet')
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
      const response = await api.post(`/api/v1/projects/${projectId}/tasks`, data)
      return response.data.data.task
    } catch (error) {
      console.error('Error creating task:', error)
      throw error
    }
  },

  // Update task
  async update(projectId: number, taskId: string, data: Partial<TaskCreateUpdate>): Promise<Task> {
    try {
      const response = await api.put(`/api/v1/projects/${projectId}/tasks/${taskId}`, data)
      return response.data.data.task
    } catch (error) {
      console.error('Error updating task:', error)
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

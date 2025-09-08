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
    page: number = 1,
    limit: number = 20,
    filters?: TaskFilter,
  ): Promise<TasksResponse> {
    try {
      console.log('🔍 Tasks API: Attempting to fetch tasks for project:', projectId)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })

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

      const url = `/api/v1/projects/${projectId}/tasks?${params.toString()}`
      console.log('📡 Tasks API: Making request to:', url)

      const response = await api.get(url)
      console.log('✅ Tasks API: Response received:', response.data)

      // Check if response is empty or malformed
      if (!response.data || !response.data.data) {
        console.log('⚠️ Tasks API: Empty or malformed response, throwing error to trigger fallback')
        throw new Error('Empty response from tasks API')
      }

      return response.data.data
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

import { api } from './api'
import type { TaskTemplate, TaskCreateUpdate } from '@/core/types/task'
import { getMockTaskTemplates } from '@/core/mock-data/task-templates-loader'

// For now, templates are stored locally (can be extended to use API)
// In production, this would be stored in database
const LOCAL_TEMPLATES_KEY = 'fieldwire_task_templates'

// Task Templates API object
export const taskTemplatesApi = {
  // Get all task templates
  async getAll(): Promise<TaskTemplate[]> {
    try {
      // Try to fetch from API first (if endpoint exists)
      try {
        const response = await api.get('/api/v1/task-templates')
        if (response.data?.data?.templates) {
          return response.data.data.templates
        }
      } catch (apiError) {
        // API endpoint doesn't exist yet, fall back to local storage
        console.log('📦 Task Templates API: Using local storage (API endpoint not available)')
      }

      // Fallback to local storage
      const stored = localStorage.getItem(LOCAL_TEMPLATES_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as TaskTemplate[]
        if (parsed.length > 0) {
          return parsed
        }
      }

      // Fallback to mock data if no templates in storage
      const mockTemplates = getMockTaskTemplates()
      if (mockTemplates.length > 0) {
        // Convert mock data to TaskTemplate format with IDs
        return mockTemplates.map((template, index) => ({
          ...template,
          id: index + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })) as TaskTemplate[]
      }

      // Return empty array if no templates found
      return []
    } catch (error) {
      console.error('❌ Task Templates API: Error fetching templates:', error)
      // Return empty array on error
      return []
    }
  },

  // Get template by ID
  async getById(templateId: number): Promise<TaskTemplate | null> {
    try {
      try {
        const response = await api.get(`/api/v1/task-templates/${templateId}`)
        if (response.data?.data?.template) {
          return response.data.data.template
        }
      } catch (apiError) {
        // Fall back to local storage
      }

      const templates = await this.getAll()
      return templates.find((t) => t.id === templateId) || null
    } catch (error) {
      console.error('Error fetching template:', error)
      return null
    }
  },

  // Create new template
  async create(template: Omit<TaskTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<TaskTemplate> {
    try {
      // Try API first
      try {
        const response = await api.post('/api/v1/task-templates', { template })
        if (response.data?.data?.template) {
          // Also save to local storage for offline access
          const templates = await this.getAll()
          templates.push(response.data.data.template)
          localStorage.setItem(LOCAL_TEMPLATES_KEY, JSON.stringify(templates))
          return response.data.data.template
        }
      } catch (apiError) {
        // Fall back to local storage
      }

      // Fallback to local storage
      const templates = await this.getAll()
      const newTemplate: TaskTemplate = {
        ...template,
        id: Date.now(), // Simple ID generation for local storage
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      templates.push(newTemplate)
      localStorage.setItem(LOCAL_TEMPLATES_KEY, JSON.stringify(templates))
      return newTemplate
    } catch (error) {
      console.error('Error creating template:', error)
      throw error
    }
  },

  // Update template
  async update(templateId: number, template: Partial<TaskTemplate>): Promise<TaskTemplate> {
    try {
      // Try API first
      try {
        const response = await api.put(`/api/v1/task-templates/${templateId}`, { template })
        if (response.data?.data?.template) {
          // Also update local storage
          const templates = await this.getAll()
          const index = templates.findIndex((t) => t.id === templateId)
          if (index !== -1) {
            templates[index] = { ...templates[index], ...response.data.data.template }
            localStorage.setItem(LOCAL_TEMPLATES_KEY, JSON.stringify(templates))
          }
          return response.data.data.template
        }
      } catch (apiError) {
        // Fall back to local storage
      }

      // Fallback to local storage
      const templates = await this.getAll()
      const index = templates.findIndex((t) => t.id === templateId)
      if (index === -1) {
        throw new Error('Template not found')
      }
      templates[index] = {
        ...templates[index],
        ...template,
        id: templateId,
        updated_at: new Date().toISOString(),
      }
      localStorage.setItem(LOCAL_TEMPLATES_KEY, JSON.stringify(templates))
      return templates[index]
    } catch (error) {
      console.error('Error updating template:', error)
      throw error
    }
  },

  // Delete template
  async delete(templateId: number): Promise<void> {
    try {
      // Try API first
      try {
        await api.delete(`/api/v1/task-templates/${templateId}`)
        // Also remove from local storage
        const templates = await this.getAll()
        const filtered = templates.filter((t) => t.id !== templateId)
        localStorage.setItem(LOCAL_TEMPLATES_KEY, JSON.stringify(filtered))
        return
      } catch (apiError) {
        // Fall back to local storage
      }

      // Fallback to local storage
      const templates = await this.getAll()
      const filtered = templates.filter((t) => t.id !== templateId)
      localStorage.setItem(LOCAL_TEMPLATES_KEY, JSON.stringify(filtered))
    } catch (error) {
      console.error('Error deleting template:', error)
      throw error
    }
  },

  // Get templates by category
  async getByCategory(category: string): Promise<TaskTemplate[]> {
    const templates = await this.getAll()
    return templates.filter((t) => t.category === category)
  },

  // Get all categories
  async getCategories(): Promise<string[]> {
    const templates = await this.getAll()
    const categories = new Set<string>()
    templates.forEach((t) => {
      if (t.category) {
        categories.add(t.category)
      }
    })
    return Array.from(categories).sort()
  },
}

// Helper function to convert template to task creation data
export function templateToTaskData(
  template: TaskTemplate,
  projectId: number,
  projectStartDate: string,
  overrides?: {
    start_offset_days?: number | null
    duration_days?: number | null
    task_lead_id?: number | null
    status?: string
  },
): TaskCreateUpdate {
  const startOffset = overrides?.start_offset_days ?? template.start_offset_days
  const duration = overrides?.duration_days ?? template.duration_days

  // Calculate start date
  let startPlanned = projectStartDate
  if (startOffset !== null && startOffset !== undefined) {
    const startDate = new Date(projectStartDate)
    startDate.setDate(startDate.getDate() + startOffset)
    startPlanned = startDate.toISOString().split('T')[0]
  }

  // Calculate end date
  let endPlanned: string | undefined
  if (duration && duration > 0) {
    const endDate = new Date(startPlanned)
    endDate.setDate(endDate.getDate() + duration - 1) // -1 because start day counts as day 1
    endPlanned = endDate.toISOString().split('T')[0]
  } else if (template.end_offset_days !== null && template.end_offset_days !== undefined) {
    const endDate = new Date(projectStartDate)
    endDate.setDate(endDate.getDate() + template.end_offset_days)
    endPlanned = endDate.toISOString().split('T')[0]
  }

  const taskData: TaskCreateUpdate = {
    project_id: projectId,
    name: template.name,
    start_planned: startPlanned,
    end_planned: endPlanned,
    duration_days: duration,
    milestone: template.milestone || null,
    status: (overrides?.status as any) || template.status || 'planned',
    progress_pct: 0,
    notes: template.notes,
    wbs_path: template.wbs_path,
    task_order: template.task_order,
  }

  if (overrides?.task_lead_id !== undefined) {
    taskData.task_lead_id = overrides.task_lead_id
  }

  return taskData
}


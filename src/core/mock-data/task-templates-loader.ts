// Loader for mock task templates data
import type { TaskTemplate } from '../types/task'
// Vite supports JSON imports directly
import taskTemplatesMockData from './task-templates.json'

/**
 * Get mock task templates
 */
export function getMockTaskTemplates(): Omit<TaskTemplate, 'id' | 'created_at' | 'updated_at'>[] {
  return taskTemplatesMockData as Omit<TaskTemplate, 'id' | 'created_at' | 'updated_at'>[]
}

/**
 * Load mock templates into the system (for development/testing)
 */
export async function loadMockTemplates(): Promise<TaskTemplate[]> {
  const mockData = getMockTaskTemplates()
  const templates: TaskTemplate[] = []

  for (const template of mockData) {
    templates.push({
      ...template,
      id: Date.now() + Math.random(), // Simple ID generation
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }

  return templates
}


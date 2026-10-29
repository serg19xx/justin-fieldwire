// Utility to initialize default task templates
// This can be called on app startup or when templates are empty
import { taskTemplatesApi } from './task-templates-api'
import { getMockTaskTemplates } from '@/core/mock-data/task-templates-loader'
import type { TaskTemplate } from '@/core/types/task'

// Use mock data as default templates
const defaultTemplates: Omit<TaskTemplate, 'id' | 'created_at' | 'updated_at'>[] = getMockTaskTemplates()

/**
 * Initialize default templates if no templates exist
 * This function checks if templates exist and adds defaults if needed
 */
export async function initializeDefaultTemplates(): Promise<void> {
  try {
    const existingTemplates = await taskTemplatesApi.getAll()
    
    if (existingTemplates.length > 0) {
      console.log('📋 Templates already exist, skipping initialization')
      return
    }

    console.log('📋 Initializing default task templates...')
    
    for (const template of defaultTemplates) {
      await taskTemplatesApi.create(template)
    }

    console.log(`✅ Initialized ${defaultTemplates.length} default templates`)
  } catch (error) {
    console.error('❌ Error initializing default templates:', error)
  }
}

/**
 * Reset templates to defaults (removes all existing and creates defaults)
 * Use with caution - this will delete all existing templates!
 */
export async function resetTemplatesToDefaults(): Promise<void> {
  try {
    const existingTemplates = await taskTemplatesApi.getAll()
    
    // Delete all existing templates
    for (const template of existingTemplates) {
      if (template.id) {
        await taskTemplatesApi.delete(template.id)
      }
    }

    // Create defaults
    await initializeDefaultTemplates()
    
    console.log('✅ Templates reset to defaults')
  } catch (error) {
    console.error('❌ Error resetting templates:', error)
    throw error
  }
}


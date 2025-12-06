// Utility to initialize default task templates
// This can be called on app startup or when templates are empty
import { taskTemplatesApi } from './task-templates-api'
import { getMockTaskTemplates } from '@/core/mock-data/task-templates-loader'
import type { TaskTemplate } from '@/core/types/task'

// Use mock data as default templates
const defaultTemplates: Omit<TaskTemplate, 'id' | 'created_at' | 'updated_at'>[] = getMockTaskTemplates()

// Legacy default templates (kept for reference, but not used)
const legacyDefaultTemplates: Omit<TaskTemplate, 'id' | 'created_at' | 'updated_at'>[] = [
  // Site Preparation
  {
    name: 'Site Survey',
    description: 'Initial site survey and assessment',
    category: 'Site Preparation',
    duration_days: 1,
    start_offset_days: 0,
    status: 'planned',
    task_order: 1,
  },
  {
    name: 'Site Clearing',
    description: 'Clear site of vegetation and debris',
    category: 'Site Preparation',
    duration_days: 3,
    start_offset_days: 1,
    status: 'planned',
    task_order: 2,
  },
  {
    name: 'Excavation',
    description: 'Excavate foundation area',
    category: 'Site Preparation',
    duration_days: 5,
    start_offset_days: 4,
    status: 'planned',
    task_order: 3,
  },

  // Foundation
  {
    name: 'Foundation Layout',
    description: 'Mark foundation layout and dimensions',
    category: 'Foundation',
    duration_days: 1,
    start_offset_days: 9,
    status: 'planned',
    task_order: 10,
  },
  {
    name: 'Foundation Pour',
    description: 'Pour concrete foundation',
    category: 'Foundation',
    duration_days: 2,
    start_offset_days: 10,
    status: 'planned',
    task_order: 11,
  },
  {
    name: 'Foundation Curing',
    description: 'Allow foundation to cure',
    category: 'Foundation',
    duration_days: 7,
    start_offset_days: 12,
    status: 'planned',
    task_order: 12,
  },

  // Framing
  {
    name: 'Frame Walls',
    description: 'Frame exterior and interior walls',
    category: 'Framing',
    duration_days: 5,
    start_offset_days: 19,
    status: 'planned',
    task_order: 20,
  },
  {
    name: 'Frame Roof',
    description: 'Frame roof structure',
    category: 'Framing',
    duration_days: 3,
    start_offset_days: 24,
    status: 'planned',
    task_order: 21,
  },

  // Milestones
  {
    name: 'Foundation Inspection',
    description: 'Inspection of completed foundation',
    category: 'Milestones',
    duration_days: 1,
    start_offset_days: 19,
    milestone: 'inspection',
    status: 'planned',
    task_order: 13,
  },
  {
    name: 'Framing Inspection',
    description: 'Inspection of completed framing',
    category: 'Milestones',
    duration_days: 1,
    start_offset_days: 27,
    milestone: 'inspection',
    status: 'planned',
    task_order: 22,
  },
]

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


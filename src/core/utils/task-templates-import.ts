// Utility to import tasks from TSV file into task templates
import { taskTemplatesApi } from './task-templates-api'
import type { TaskTemplate, MilestoneType } from '@/core/types/task'

interface ParsedTask {
  name: string
  foreman?: string
  duration?: number
  status?: string
  dependencies?: string
  category?: string
  isMilestone?: boolean
}

/**
 * Parse TSV content and extract tasks
 */
function parseTSV(tsvContent: string): ParsedTask[] {
  const lines = tsvContent.split('\n').map((line) => line.trim())
  const tasks: ParsedTask[] = []

  // Find header row (should contain "Task Name")
  let headerIndex = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Task Name')) {
      headerIndex = i
      break
    }
  }

  if (headerIndex === -1) {
    throw new Error('Could not find header row with "Task Name"')
  }

  // Parse header to get column indices
  const header = lines[headerIndex].split('\t')
  const taskNameIndex = header.indexOf('Task Name')
  const foremanIndex = header.indexOf('Foreman')
  const durationIndex = header.indexOf('Duration')
  const statusIndex = header.indexOf('Status')
  const dependenciesIndex = header.indexOf('Dependencies')

  // Parse data rows
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line || line.trim() === '') continue

    // Handle quoted fields (remove quotes)
    const processedLine = line.replace(/^"|"$/g, '').replace(/""/g, '"')
    const columns = processedLine.split('\t')
    const taskName = columns[taskNameIndex]?.trim()

    if (!taskName || taskName === '' || taskName === 'Table 1' || taskName === 'Task List') continue

    // Parse duration (can be decimal like 0.5)
    let duration: number | undefined
    const durationStr = columns[durationIndex]?.trim()
    if (durationStr && durationStr !== '') {
      const parsed = parseFloat(durationStr)
      if (!isNaN(parsed)) {
        duration = Math.ceil(parsed) // Round up to nearest day
      }
    }

    const task: ParsedTask = {
      name: taskName,
      foreman: columns[foremanIndex]?.trim() || undefined,
      duration,
      status: columns[statusIndex]?.trim() || 'planned',
      dependencies: columns[dependenciesIndex]?.trim() || undefined,
    }

    // Determine category based on task name
    task.category = determineCategory(task.name)

    // Determine if milestone
    task.isMilestone = isMilestoneTask(task.name)

    tasks.push(task)
  }

  return tasks
}

/**
 * Determine category based on task name
 */
function determineCategory(taskName: string): string {
  const name = taskName.toLowerCase()

  // Planning & Design
  if (
    name.includes('meeting') ||
    name.includes('planning') ||
    name.includes('review') ||
    name.includes('pro-forma') ||
    name.includes('architectural') ||
    name.includes('design') ||
    name.includes('drawing') ||
    name.includes('millwork drawing')
  ) {
    return 'Planning & Design'
  }

  // Permits & Approvals
  if (name.includes('permit') || name.includes('approval') || name.includes('sign off')) {
    return 'Permits & Approvals'
  }

  // Demolition & Site Prep
  if (
    name.includes('demolition') ||
    name.includes('bin') ||
    name.includes('concrete coring') ||
    name.includes('concrete re-fill')
  ) {
    return 'Demolition & Site Prep'
  }

  // HVAC
  if (name.includes('hvac') || name.includes('havac')) {
    return 'HVAC'
  }

  // Plumbing
  if (name.includes('plumbing')) {
    return 'Plumbing'
  }

  // Electrical
  if (name.includes('electrical') || name.includes('esa permit')) {
    return 'Electrical'
  }

  // Sprinkler
  if (name.includes('sprinkler')) {
    return 'Sprinkler'
  }

  // Framing & Structure
  if (
    name.includes('framing') ||
    name.includes('insulation') ||
    name.includes('door operator') ||
    name.includes('strengthening')
  ) {
    return 'Framing & Structure'
  }

  // Drywall
  if (name.includes('drywall') || name.includes('taping')) {
    return 'Drywall'
  }

  // Painting
  if (name.includes('paint') || name.includes('epoxy')) {
    return 'Painting'
  }

  // Millwork
  if (name.includes('millwork')) {
    return 'Millwork'
  }

  // Doors & Hardware
  if (
    name.includes('door') ||
    name.includes('hardware') ||
    name.includes('security gate') ||
    name.includes('closer')
  ) {
    return 'Doors & Hardware'
  }

  // Ceiling
  if (name.includes('ceiling')) {
    return 'Ceiling'
  }

  // Flooring
  if (
    name.includes('flooring') ||
    name.includes('vinyl') ||
    name.includes('tile') ||
    name.includes('wood floor') ||
    name.includes('epoxy floor') ||
    name.includes('mortar') ||
    name.includes('transition')
  ) {
    return 'Flooring'
  }

  // Fixtures & Equipment
  if (
    name.includes('fixture') ||
    name.includes('bathroom') ||
    name.includes('barrier free') ||
    name.includes('equipment')
  ) {
    return 'Fixtures & Equipment'
  }

  // Finishing
  if (
    name.includes('trim') ||
    name.includes('baseboard') ||
    name.includes('wallpaper') ||
    name.includes('stone') ||
    name.includes('blinds') ||
    name.includes('door number')
  ) {
    return 'Finishing'
  }

  // Materials & Ordering
  if (
    name.includes('order') ||
    name.includes('material') ||
    name.includes('quote') ||
    name.includes('purchase')
  ) {
    return 'Materials & Ordering'
  }

  // Network & IT
  if (name.includes('network')) {
    return 'Network & IT'
  }

  // Roofing
  if (name.includes('roofing') || name.includes('flashing')) {
    return 'Roofing'
  }

  // Branding & Signage
  if (name.includes('brand') || name.includes('sign') || name.includes('decal')) {
    return 'Branding & Signage'
  }

  // Cleaning
  if (name.includes('clean')) {
    return 'Cleaning'
  }

  // Default
  return 'Other'
}

/**
 * Determine if task is a milestone
 */
function isMilestoneTask(taskName: string): boolean {
  const name = taskName.toLowerCase()
  return (
    name.includes('meeting') ||
    name.includes('inspection') ||
    name.includes('visit') ||
    name.includes('review') ||
    name.includes('sign off') ||
    name.includes('approval') ||
    name.includes('permit')
  )
}

/**
 * Determine milestone type
 */
function getMilestoneType(taskName: string): MilestoneType | null {
  const name = taskName.toLowerCase()

  if (name.includes('inspection')) return 'inspection'
  if (name.includes('visit')) return 'visit'
  if (name.includes('meeting')) return 'meeting'
  if (name.includes('review')) return 'review'
  if (name.includes('approval') || name.includes('sign off')) return 'approval'
  if (name.includes('delivery')) return 'delivery'

  return null
}

/**
 * Import tasks from TSV content
 */
export async function importTasksFromTSV(tsvContent: string): Promise<number> {
  try {
    console.log('📥 Starting TSV import...')

    // Parse TSV
    const parsedTasks = parseTSV(tsvContent)
    console.log(`📋 Parsed ${parsedTasks.length} tasks from TSV`)

    // Convert to templates
    const templates: Omit<TaskTemplate, 'id' | 'created_at' | 'updated_at'>[] = []

    // Track cumulative offset for sequential tasks
    // Start from 0 (project start)
    let currentOffset = 0

    for (let i = 0; i < parsedTasks.length; i++) {
      const task = parsedTasks[i]

      // For first task, start at project start (offset 0)
      // For subsequent tasks, calculate offset based on previous task
      if (i > 0) {
        const previousTask = parsedTasks[i - 1]
        const previousDuration = previousTask.duration || 1
        
        // If previous task had a duration, start after it ends
        if (previousDuration > 0) {
          currentOffset = currentOffset + previousDuration
        } else {
          // No duration specified, assume 1 day gap
          currentOffset += 1
        }
      }

      // Determine milestone type
      const milestoneType = task.isMilestone ? getMilestoneType(task.name) : null

      const template: Omit<TaskTemplate, 'id' | 'created_at' | 'updated_at'> = {
        name: task.name,
        category: task.category || 'Other',
        duration_days: task.duration,
        // Set start_offset_days to null if duration is not set (user must provide during creation)
        // Otherwise use calculated offset
        start_offset_days: task.duration ? currentOffset : null,
        milestone: milestoneType,
        status: (task.status as any) || 'planned',
        task_order: i + 1,
      }

      templates.push(template)
    }

    console.log(`✅ Converted to ${templates.length} templates`)

    // Import templates
    let importedCount = 0
    for (const template of templates) {
      try {
        await taskTemplatesApi.create(template)
        importedCount++
      } catch (error) {
        console.error(`❌ Error importing template "${template.name}":`, error)
      }
    }

    console.log(`✅ Successfully imported ${importedCount} templates`)
    return importedCount
  } catch (error) {
    console.error('❌ Error importing tasks from TSV:', error)
    throw error
  }
}

/**
 * Import tasks from TSV file (for use in browser)
 */
export async function importTasksFromTSVFile(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string
        const count = await importTasksFromTSV(content)
        resolve(count)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsText(file)
  })
}


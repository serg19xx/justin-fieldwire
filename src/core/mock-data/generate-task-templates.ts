/**
 * Script to generate mock task templates from TSV file
 * Run with: npx ts-node src/core/mock-data/generate-task-templates.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import type { TaskTemplate, MilestoneType } from '../types/task'

function determineCategory(taskName: string): string {
  const name = taskName.toLowerCase()

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

  if (name.includes('permit') || name.includes('approval') || name.includes('sign off')) {
    return 'Permits & Approvals'
  }

  if (
    name.includes('demolition') ||
    name.includes('bin') ||
    name.includes('concrete coring') ||
    name.includes('concrete re-fill')
  ) {
    return 'Demolition & Site Prep'
  }

  if (name.includes('hvac') || name.includes('havac')) {
    return 'HVAC'
  }

  if (name.includes('plumbing')) {
    return 'Plumbing'
  }

  if (name.includes('electrical') || name.includes('esa permit')) {
    return 'Electrical'
  }

  if (name.includes('sprinkler')) {
    return 'Sprinkler'
  }

  if (
    name.includes('framing') ||
    name.includes('insulation') ||
    name.includes('door operator') ||
    name.includes('strengthening')
  ) {
    return 'Framing & Structure'
  }

  if (name.includes('drywall') || name.includes('taping')) {
    return 'Drywall'
  }

  if (name.includes('paint') || name.includes('epoxy')) {
    return 'Painting'
  }

  if (name.includes('millwork')) {
    return 'Millwork'
  }

  if (
    name.includes('door') ||
    name.includes('hardware') ||
    name.includes('security gate') ||
    name.includes('closer')
  ) {
    return 'Doors & Hardware'
  }

  if (name.includes('ceiling')) {
    return 'Ceiling'
  }

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

  if (
    name.includes('fixture') ||
    name.includes('bathroom') ||
    name.includes('barrier free') ||
    name.includes('equipment')
  ) {
    return 'Fixtures & Equipment'
  }

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

  if (
    name.includes('order') ||
    name.includes('material') ||
    name.includes('quote') ||
    name.includes('purchase')
  ) {
    return 'Materials & Ordering'
  }

  if (name.includes('network')) {
    return 'Network & IT'
  }

  if (name.includes('roofing') || name.includes('flashing')) {
    return 'Roofing'
  }

  if (name.includes('brand') || name.includes('sign') || name.includes('decal')) {
    return 'Branding & Signage'
  }

  if (name.includes('clean')) {
    return 'Cleaning'
  }

  return 'Other'
}

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

function parseTSV(tsvContent: string): Omit<TaskTemplate, 'id' | 'created_at' | 'updated_at'>[] {
  const lines = tsvContent.split('\n').map((line) => line.trim())
  const tasks: Omit<TaskTemplate, 'id' | 'created_at' | 'updated_at'>[] = []

  // Find header row
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

  // Parse header
  const header = lines[headerIndex].split('\t')
  const taskNameIndex = header.indexOf('Task Name')
  const durationIndex = header.indexOf('Duration')
  const statusIndex = header.indexOf('Status')

  // Track cumulative offset
  let currentOffset = 0

  // Parse data rows
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line || line.trim() === '') continue

    const processedLine = line.replace(/^"|"$/g, '').replace(/""/g, '"')
    const columns = processedLine.split('\t')
    const taskName = columns[taskNameIndex]?.trim()

    if (!taskName || taskName === '' || taskName === 'Table 1' || taskName === 'Task List') continue

    // Parse duration
    let duration: number | undefined
    const durationStr = columns[durationIndex]?.trim()
    if (durationStr && durationStr !== '') {
      const parsed = parseFloat(durationStr)
      if (!isNaN(parsed)) {
        duration = Math.ceil(parsed)
      }
    }

    const status = columns[statusIndex]?.trim() || 'planned'

    // Calculate start offset
    if (i > headerIndex + 1 && tasks.length > 0) {
      const previousTask = tasks[tasks.length - 1]
      const previousDuration = previousTask.duration_days || 1

      if (previousDuration > 0) {
        currentOffset = currentOffset + previousDuration
      } else {
        currentOffset += 1
      }
    }

    // Determine category and milestone
    const category = determineCategory(taskName)
    const milestoneType = getMilestoneType(taskName)

    const template: Omit<TaskTemplate, 'id' | 'created_at' | 'updated_at'> = {
      name: taskName,
      category,
      duration_days: duration,
      start_offset_days: duration ? currentOffset : null,
      milestone: milestoneType,
      status: status as any,
      task_order: tasks.length + 1,
    }

    tasks.push(template)
  }

  return tasks
}

// Main execution
const tsvPath = path.join(__dirname, '../../../migrations/Task List.tsv')
const outputPath = path.join(__dirname, 'task-templates.json')

console.log('📥 Reading TSV file:', tsvPath)
const tsvContent = fs.readFileSync(tsvPath, 'utf-8')

console.log('🔄 Parsing TSV...')
const templates = parseTSV(tsvContent)

console.log(`✅ Parsed ${templates.length} templates`)

console.log('💾 Writing to:', outputPath)
fs.writeFileSync(outputPath, JSON.stringify(templates, null, 2), 'utf-8')

console.log('✅ Mock data generated successfully!')
console.log(`📊 Total templates: ${templates.length}`)

// Print category summary
const categories = new Map<string, number>()
templates.forEach((t) => {
  const cat = t.category || 'Other'
  categories.set(cat, (categories.get(cat) || 0) + 1)
})

console.log('\n📋 Categories:')
categories.forEach((count, cat) => {
  console.log(`  ${cat}: ${count}`)
})


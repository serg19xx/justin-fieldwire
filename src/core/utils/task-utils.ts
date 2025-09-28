import type { Task, CalendarTask, TaskStatus, MilestoneType } from '@/core/types/task'

// WBS utility functions
export function parseWbsPath(wbsPath?: string): string[] {
  return wbsPath ? wbsPath.split('.') : []
}

export function formatWbsPath(wbsArray: string[]): string {
  return wbsArray.join('.')
}

export function getWbsLevel(wbsPath: string): number {
  return wbsPath ? wbsPath.split('.').length : 0
}

export function getParentWbs(wbsPath: string): string {
  const parts = wbsPath.split('.')
  return parts.slice(0, -1).join('.')
}

// Универсальная функция для обработки даты окончания задачи
export function processEndDateForDisplay(endDate: string): string {
  if (!endDate) return ''

  // Для FullCalendar нужно добавить один день к дате окончания
  const endDateObj = new Date(endDate + 'T00:00:00')
  endDateObj.setDate(endDateObj.getDate() + 1)
  return endDateObj.toLocaleDateString('en-CA')
}

// Convert Task to CalendarTask for FullCalendar
export function taskToCalendarTask(
  task: Task,
  showDependencyIndicators: boolean = true,
): CalendarTask {
  // Add progress percentage to title
  const progressText = task.progress_pct > 0 ? ` (${task.progress_pct}%)` : ''

  // Add dependency indicators to title (only if enabled)
  const dependencyText = showDependencyIndicators ? getDependencyIndicators(task) : ''

  // Add task/milestone type icon at the beginning
  const typeIcon = task.milestone ? getMilestoneTypeIcon(task.milestone_type) : '📋'

  const calendarTask = {
    id: task.id,
    title: `${typeIcon} ${task.name}${progressText}${dependencyText}`,
    start: task.start_planned,
    end: task.end_planned ? processEndDateForDisplay(task.end_planned) : undefined,
    allDay: true, // All tasks are all-day events
    color: getTaskColor(task.status),
    // For milestones: allow dragging but disable resizing
    editable: true, // Allow dragging
    startEditable: true, // Allow moving start date
    durationEditable: !task.milestone, // Disable resizing for milestones
    extendedProps: {
      wbsPath: parseWbsPath(task.wbs_path), // Convert to array for display
      status: task.status,
      assignees: (task.assignees || []).map(String), // Convert numbers to strings for compatibility
      milestone: task.milestone,
      progressPct: task.progress_pct,
      description: task.notes || `${task.wbs_path || 'No WBS'} - ${task.name}`,
      dependencies: task.dependencies || [],
    },
  }

  console.log('🔄 Converting task to calendar event:', task.name, '→', calendarTask)
  return calendarTask
}

// Get dependency indicators for task title
export function getDependencyIndicators(task: Task): string {
  if (!task.dependencies || task.dependencies.length === 0) {
    return ''
  }

  const indicators: string[] = []

  // Count dependencies by type
  const depCounts: Record<string, number> = {
    FS: 0,
    SS: 0,
    FF: 0,
    SF: 0,
    total: 0,
  }

  task.dependencies.forEach((dep) => {
    if (typeof dep === 'object') {
      depCounts[dep.type]++
      depCounts.total++
    } else {
      // Legacy format - assume FS
      depCounts.FS++
      depCounts.total++
    }
  })

  // Add indicators based on dependency types
  if (depCounts.FS > 0) {
    indicators.push(`🔗${depCounts.FS > 1 ? depCounts.FS : ''}`)
  }
  if (depCounts.SS > 0) {
    indicators.push(`⚡${depCounts.SS > 1 ? depCounts.SS : ''}`)
  }
  if (depCounts.FF > 0) {
    indicators.push(`🎯${depCounts.FF > 1 ? depCounts.FF : ''}`)
  }
  if (depCounts.SF > 0) {
    indicators.push(`🔄${depCounts.SF > 1 ? depCounts.SF : ''}`)
  }

  // Add lag indicator if any dependencies have lag
  const hasLag = task.dependencies.some((dep) => typeof dep === 'object' && (dep.lag_days || 0) > 0)
  if (hasLag) {
    indicators.push('⏱️')
  }

  // Add predecessor count indicator
  if (depCounts.total > 0) {
    indicators.push(`📋${depCounts.total}`)
  }

  return indicators.length > 0 ? ` ${indicators.join('')}` : ''
}

// Get dependency tooltip text for calendar events
export function getDependencyTooltip(task: Task, allTasks: Task[] = []): string {
  if (!task.dependencies || task.dependencies.length === 0) {
    return ''
  }

  const tooltipParts: string[] = []

  task.dependencies.forEach((dep) => {
    if (typeof dep === 'object') {
      const predecessor = allTasks.find((t) => String(t.id) === String(dep.predecessor_id))
      const predecessorName = predecessor?.name || `Task ${dep.predecessor_id}`
      const lagText = dep.lag_days > 0 ? ` (+${dep.lag_days}d)` : ''

      let depTypeText = ''
      switch (dep.type) {
        case 'FS':
          depTypeText = 'Finish-to-Start'
          break
        case 'SS':
          depTypeText = 'Start-to-Start'
          break
        case 'FF':
          depTypeText = 'Finish-to-Finish'
          break
        case 'SF':
          depTypeText = 'Start-to-Finish'
          break
      }

      tooltipParts.push(`• ${depTypeText}: ${predecessorName}${lagText}`)
    } else {
      // Legacy format
      const predecessor = allTasks.find((t) => String(t.id) === String(dep))
      const predecessorName = predecessor?.name || `Task ${dep}`
      tooltipParts.push(`• Finish-to-Start: ${predecessorName}`)
    }
  })

  return tooltipParts.length > 0 ? `Dependencies:\n${tooltipParts.join('\n')}` : ''
}

// Get color based on task status (same colors for tasks and milestones)
export function getTaskColor(status?: TaskStatus): string {
  // Use same colors for both tasks and milestones based on status
  switch (status) {
    case 'planned':
      return '#3B82F6' // Blue
    case 'in_progress':
      return '#10B981' // Green
    case 'done':
      return '#6B7280' // Gray
    case 'blocked':
      return '#EF4444' // Red
    case 'delayed':
      return '#F59E0B' // Orange
    default:
      return '#3B82F6' // Default blue
  }
}

// Progress is shown in task title, colors remain standard by status

// Get milestone type icon
export function getMilestoneTypeIcon(milestoneType?: MilestoneType): string {
  switch (milestoneType) {
    case 'inspection':
      return '🔍'
    case 'visit':
      return '🏗️'
    case 'meeting':
      return '👥'
    case 'review':
      return '📋'
    case 'delivery':
      return '📦'
    case 'approval':
      return '✅'
    case 'other':
      return '🎯'
    default:
      return '🎯'
  }
}

// Get milestone type label
export function getMilestoneTypeLabel(milestoneType?: MilestoneType): string {
  switch (milestoneType) {
    case 'inspection':
      return 'Inspection'
    case 'visit':
      return 'Site Visit'
    case 'meeting':
      return 'Meeting'
    case 'review':
      return 'Review'
    case 'delivery':
      return 'Delivery'
    case 'approval':
      return 'Approval'
    case 'other':
      return 'Milestone'
    default:
      return 'Milestone'
  }
}

// Get status label
export function getTaskStatusLabel(status: TaskStatus): string {
  switch (status) {
    case 'planned':
      return 'Planned'
    case 'in_progress':
      return 'In Progress'
    case 'done':
      return 'Done'
    case 'blocked':
      return 'Blocked'
    case 'delayed':
      return 'Delayed'
    default:
      return 'Unknown'
  }
}

// Calculate task duration in days
export function calculateTaskDuration(startDate: string, endDate?: string): number {
  if (!endDate) return 1

  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Generate WBS path string
export function getWbsPathString(wbsPath: string[]): string {
  return wbsPath.join(' > ')
}

// Check if task is overdue
export function isTaskOverdue(task: Task): boolean {
  if (!task.end_planned || task.status === 'done') return false

  const endDate = new Date(task.end_planned)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return endDate < today
}

// Get task priority based on status and dates
export function getTaskPriority(task: Task): 'low' | 'medium' | 'high' | 'critical' {
  if (task.status === 'blocked') return 'critical'
  if (task.status === 'delayed') return 'high'
  if (isTaskOverdue(task)) return 'critical'

  // Check if task is starting soon (within 3 days)
  const startDate = new Date(task.start_planned)
  const today = new Date()
  const diffDays = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays <= 1) return 'high'
  if (diffDays <= 3) return 'medium'

  return 'low'
}

// Export tasks to iCal format (for system calendar compatibility)
export function exportTasksToICal(tasks: Task[]): string {
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  const ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FieldWire//Project Tasks//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:FieldWire Project Tasks',
    'X-WR-CALDESC:Project tasks exported from FieldWire',
  ]

  tasks.forEach((task) => {
    try {
      // Normalize date format - ensure we have proper ISO dates
      // Parse and format start date
      const startDateObj = new Date(task.start_planned + 'T00:00:00')
      if (isNaN(startDateObj.getTime())) {
        console.warn('⚠️ Invalid start date for task:', task.name, task.start_planned)
        return // Skip this task
      }
      const startDate = startDateObj.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

      // Parse and format end date
      let endDate: string
      if (task.end_planned) {
        const endDateObj = new Date(task.end_planned + 'T00:00:00')
        if (isNaN(endDateObj.getTime())) {
          console.warn('⚠️ Invalid end date for task:', task.name, task.end_planned)
          endDate = startDate // Use start date as fallback
        } else {
          endDate = endDateObj.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
        }
      } else {
        // For milestones or tasks without end date, use start date + 1 day
        const endDateObj = new Date(startDateObj.getTime() + 24 * 60 * 60 * 1000)
        endDate = endDateObj.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      }

      // Create description with more details
      const description = [
        task.wbs_path ? `WBS: ${task.wbs_path}` : 'No WBS',
        `Status: ${task.status}`,
        task.progress_pct > 0 ? `Progress: ${task.progress_pct}%` : '',
        task.notes ? `Notes: ${task.notes}` : '',
        task.milestone ? `Type: ${task.milestone_type || 'Milestone'}` : 'Type: Task',
      ]
        .filter(Boolean)
        .join('\\n')

      // Create summary with type indicator
      const typeIcon = task.milestone ? '🎯' : '📋'
      const summary = `${typeIcon} ${task.name}`

      ical.push(
        'BEGIN:VEVENT',
        `UID:${task.id}@fieldwire.com`,
        `DTSTAMP:${now}`,
        `DTSTART:${startDate}`,
        `DTEND:${endDate}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        `STATUS:${task.status === 'done' ? 'CONFIRMED' : 'TENTATIVE'}`,
        `CATEGORIES:${task.milestone ? 'MILESTONE' : 'TASK'}`,
        `PRIORITY:${getTaskPriority(task).toUpperCase()}`,
        'END:VEVENT',
      )
    } catch (error) {
      console.error('❌ Error processing task for iCal export:', task.name, error)
    }
  })

  ical.push('END:VCALENDAR')

  return ical.join('\r\n')
}

// Export tasks to JSON format (for Gantt chart compatibility)
export function exportTasksToGantt(tasks: Task[]): unknown {
  return {
    tasks: tasks.map((task) => ({
      id: task.id,
      text: task.name,
      start_date: task.start_planned,
      end_date: task.end_planned,
      duration: task.duration_days || calculateTaskDuration(task.start_planned, task.end_planned),
      progress: task.progress_pct || 0,
      type: task.milestone ? 'milestone' : 'task',
      color: getTaskColor(task.status),
      parent:
        task.wbs_path && task.wbs_path.split('.').length > 1
          ? task.wbs_path.split('.')[task.wbs_path.split('.').length - 2]
          : undefined,
      open: true,
      dependencies:
        task.deps?.map(
          (dep) => `${dep.predecessorId}${dep.type}${dep.lagDays ? `+${dep.lagDays}` : ''}`,
        ) || [],
    })),
    links: tasks.flatMap(
      (task) =>
        task.deps?.map((dep) => ({
          id: `${dep.predecessorId}-${task.id}`,
          source: dep.predecessorId,
          target: task.id,
          type: dep.type.toLowerCase(),
          lag: dep.lagDays || 0,
        })) || [],
    ),
  }
}

// Download file utility
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

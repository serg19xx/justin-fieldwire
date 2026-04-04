import type { Task, CalendarTask, TaskStatus, MilestoneType } from '@/core/types/task'
import { isMilestone } from '@/core/types/task'

// Universal helper for task end date display (calendar exclusive end)
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
  viewType: 'month' | 'week' | 'day' = 'month',
): CalendarTask {
  // Validate that task has required start date
  if (!task.start_planned) {
    console.error('❌ Task missing start_planned date:', {
      id: task.id,
      name: task.name,
      start_planned: task.start_planned,
      end_planned: task.end_planned,
    })
    throw new Error(`Task ${task.name} (ID: ${task.id}) is missing start_planned date`)
  }

  // Add progress percentage to title
  const progressText = task.progress_pct > 0 ? ` (${task.progress_pct}%)` : ''

  // Add dependency indicators to title (only if enabled)
  const dependencyText = showDependencyIndicators ? getDependencyIndicators(task) : ''

  // Add task/milestone type icon at the beginning
  const taskIsMilestone = isMilestone(task.milestone)
  const milestoneType = taskIsMilestone
    ? typeof task.milestone === 'string'
      ? task.milestone
      : task.milestone_type
    : undefined
  const typeIcon = taskIsMilestone ? MILESTONE_ICON : '📝'

  // Validate date format - ensure start date is in YYYY-MM-DD format
  let startDate = task.start_planned
  if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    console.warn('⚠️ Invalid start_planned format, attempting to fix:', startDate)
    try {
      const date = new Date(startDate)
      if (!isNaN(date.getTime())) {
        startDate = date.toISOString().split('T')[0]
        console.log('✅ Fixed start date format:', startDate)
      }
    } catch (e) {
      console.error('❌ Failed to fix start date format:', e)
    }
  }

  // All tasks are displayed as all-day events in all views (month, week, day)
  // Time (start_time, end_time) is informational only - used for calculations (work hours, payroll)
  // but does not affect task duration or calendar display
  // Task duration is determined only by dates (start_planned and end_planned)
  
  // Calculate end_planned if not provided but duration_days is available
  let endPlannedDate = task.end_planned
  if (!endPlannedDate && task.duration_days && task.duration_days > 0) {
    const startDateObj = new Date(startDate + 'T00:00:00')
    startDateObj.setDate(startDateObj.getDate() + task.duration_days - 1)
    endPlannedDate = startDateObj.toISOString().split('T')[0]
  }
  
  // For all-day events, use dates only (no time)
  // FullCalendar requires exclusive end date for all-day events (add one day)
  let startDateTime: string = startDate
  let endDateTime: string | undefined = endPlannedDate ? processEndDateForDisplay(endPlannedDate) : undefined

  const calendarTask = {
    id: String(task.id),
    title: `${typeIcon} ${task.name}${progressText}${dependencyText}`,
    start: startDateTime,
    end: endDateTime,
    allDay: true, // All tasks are all-day events in all views
    color: getTaskColor(task.status),
    // For milestones: allow dragging but disable resizing
    editable: true, // Allow dragging
    startEditable: true, // Allow moving start date
    durationEditable: !isMilestone(task.milestone), // Disable resizing for milestones
    // Add data attributes for selection; milestone class for distinct styling
    classNames: [`task-${task.id}`, ...(taskIsMilestone ? ['fc-event-milestone'] : [])],
    extendedProps: {
      address: task.address?.trim() || undefined,
      status: task.status,
      assignees: (task.assignees || []).map(String), // Convert numbers to strings for compatibility
      milestone: isMilestone(task.milestone),
      progressPct: task.progress_pct,
      description:
        task.notes ||
        (task.address?.trim() ? `${task.address.trim()} — ${task.name}` : task.name),
      dependencies: task.dependencies || [],
      // Add data attributes for selection
      'data-event-id': String(task.id),
      'data-id': String(task.id),
    },
  }

  console.log('🔄 Converting task to calendar event:', {
    taskName: task.name,
    taskId: task.id,
    start_planned: task.start_planned,
    end_planned: task.end_planned,
    calendarStart: calendarTask.start,
    calendarEnd: calendarTask.end,
  })
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
    case 'scheduled':
      return '#6366F1' // Indigo
    case 'scheduled_accepted':
      return '#8B5CF6' // Purple
    case 'in_progress':
      return '#10B981' // Green
    case 'partially_completed':
      return '#14B8A6' // Teal
    case 'delayed_due_to_issue':
      return '#F59E0B' // Orange
    case 'ready_for_inspection':
      return '#06B6D4' // Cyan
    case 'completed':
      return '#6B7280' // Gray
    default:
      return '#3B82F6' // Default blue
  }
}

// Progress is shown in task title, colors remain standard by status

// Diamond symbol for milestones - distinct from task bars, used across Gantt, lists, calendar
export const MILESTONE_ICON = '◆'

// Get milestone type icon (for milestone type - inspection, meeting, etc.)
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
    case 'scheduled':
      return 'Scheduled'
    case 'scheduled_accepted':
      return 'Scheduled Accepted'
    case 'in_progress':
      return 'In Progress'
    case 'partially_completed':
      return 'Partially Completed'
    case 'delayed_due_to_issue':
      return 'Delayed Due To Issue'
    case 'ready_for_inspection':
      return 'Ready For Inspection'
    case 'completed':
      return 'Completed'
    default:
      return 'Unknown'
  }
}

// Calculate task duration in days (inclusive of both start and end dates)
export function calculateTaskDuration(startDate: string, endDate?: string): number {
  if (!endDate) return 1

  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  // +1 to include both start and end days (inclusive)
  return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
}

// Check if task is overdue
export function isTaskOverdue(task: Task): boolean {
  if (!task.end_planned || task.status === 'completed') return false

  const endDate = new Date(task.end_planned)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return endDate < today
}

// Get task priority based on status and dates
export function getTaskPriority(task: Task): 'low' | 'medium' | 'high' | 'critical' {
  if (task.status === 'delayed_due_to_issue') return 'critical'
  if (task.status === 'ready_for_inspection') return 'high'
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
      // Normalize date format - ensure we have proper ISO dates with time
      // Use task time if available, otherwise default to 08:00:00
      const startTime = task.start_time || '08:00:00'
      // Ensure time is in HH:mm:ss format
      const startTimeFormatted = startTime.split(':').length === 2 ? `${startTime}:00` : startTime
      
      // Parse and format start date with time
      const startDateObj = new Date(task.start_planned + 'T' + startTimeFormatted)
      if (isNaN(startDateObj.getTime())) {
        console.warn('⚠️ Invalid start date/time for task:', task.name, task.start_planned, startTimeFormatted)
        return // Skip this task
      }
      const startDate = startDateObj.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

      // Parse and format end date with time
      let endDate: string
      if (task.end_planned) {
        // Use task end time if available, otherwise default to 17:00:00
        const endTime = task.end_time || '17:00:00'
        // Ensure time is in HH:mm:ss format
        const endTimeFormatted = endTime.split(':').length === 2 ? `${endTime}:00` : endTime
        
        const endDateObj = new Date(task.end_planned + 'T' + endTimeFormatted)
        if (isNaN(endDateObj.getTime())) {
          console.warn('⚠️ Invalid end date/time for task:', task.name, task.end_planned, endTimeFormatted)
          endDate = startDate // Use start date as fallback
        } else {
          endDate = endDateObj.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
        }
      } else {
        // For milestones or tasks without end date, use start date + 1 day with same time
        const endDateObj = new Date(startDateObj.getTime() + 24 * 60 * 60 * 1000)
        endDate = endDateObj.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      }

      // Create description with more details
      const description = [
        task.address?.trim() ? `Address: ${task.address.trim()}` : 'No address',
        `Status: ${task.status}`,
        task.progress_pct > 0 ? `Progress: ${task.progress_pct}%` : '',
        task.notes ? `Notes: ${task.notes}` : '',
        isMilestone(task.milestone)
          ? `Type: ${typeof task.milestone === 'string' ? task.milestone : task.milestone_type || 'Milestone'}`
          : 'Type: Task',
      ]
        .filter(Boolean)
        .join('\\n')

      // Create summary with type indicator
      const taskIsMilestone = isMilestone(task.milestone)
      const typeIcon = taskIsMilestone ? '🎯' : '📝'
      const summary = `${typeIcon} ${task.name}`

      ical.push(
        'BEGIN:VEVENT',
        `UID:${task.id}@fieldwire.com`,
        `DTSTAMP:${now}`,
        `DTSTART:${startDate}`,
        `DTEND:${endDate}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        `STATUS:${task.status === 'completed' ? 'CONFIRMED' : 'TENTATIVE'}`,
        `CATEGORIES:${taskIsMilestone ? 'MILESTONE' : 'TASK'}`,
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
      type: isMilestone(task.milestone) ? 'milestone' : 'task',
      color: getTaskColor(task.status),
      parent: undefined,
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

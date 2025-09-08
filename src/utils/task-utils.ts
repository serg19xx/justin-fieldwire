import type { Task, CalendarTask, TaskStatus } from '@/types/task'

// Convert Task to CalendarTask for FullCalendar
export function taskToCalendarTask(task: Task): CalendarTask {
  const calendarTask = {
    id: task.id,
    title: task.name,
    start: task.startPlanned,
    end: task.endPlanned,
    allDay: !task.endPlanned, // If no end date, treat as all-day event
    color: getTaskColor(task.status),
    extendedProps: {
      wbsPath: task.wbsPath,
      status: task.status || 'planned',
      assignees: task.assignees || [],
      milestone: task.milestone || false,
      progressPct: task.actual?.progressPct,
      description: `${task.wbsPath.join(' > ')} - ${task.name}`,
    },
  }

  console.log('🔄 Converting task to calendar event:', task.name, '→', calendarTask)
  return calendarTask
}

// Get color based on task status
export function getTaskColor(status?: TaskStatus): string {
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
      return '#F59E0B' // Yellow
    default:
      return '#3B82F6' // Default blue
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
  if (!task.endPlanned || task.status === 'done') return false

  const endDate = new Date(task.endPlanned)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return endDate < today && task.status !== 'done'
}

// Get task priority based on status and dates
export function getTaskPriority(task: Task): 'low' | 'medium' | 'high' | 'critical' {
  if (task.status === 'blocked') return 'critical'
  if (task.status === 'delayed') return 'high'
  if (isTaskOverdue(task)) return 'critical'

  // Check if task is starting soon (within 3 days)
  const startDate = new Date(task.startPlanned)
  const today = new Date()
  const diffDays = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays <= 1) return 'high'
  if (diffDays <= 3) return 'medium'

  return 'low'
}

// Export tasks to iCal format (for system calendar compatibility)
export function exportTasksToICal(tasks: Task[]): string {
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  let ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FieldWire//Project Tasks//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  tasks.forEach((task) => {
    const startDate = task.startPlanned.replace(/[-:]/g, '').split('.')[0] + 'Z'
    const endDate = task.endPlanned
      ? task.endPlanned.replace(/[-:]/g, '').split('.')[0] + 'Z'
      : startDate

    ical.push(
      'BEGIN:VEVENT',
      `UID:${task.id}@fieldwire.com`,
      `DTSTAMP:${now}`,
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      `SUMMARY:${task.name}`,
      `DESCRIPTION:${getWbsPathString(task.wbsPath)} - ${task.status || 'planned'}`,
      `STATUS:${task.status === 'done' ? 'CONFIRMED' : 'TENTATIVE'}`,
      'END:VEVENT',
    )
  })

  ical.push('END:VCALENDAR')

  return ical.join('\r\n')
}

// Export tasks to JSON format (for Gantt chart compatibility)
export function exportTasksToGantt(tasks: Task[]): any {
  return {
    tasks: tasks.map((task) => ({
      id: task.id,
      text: task.name,
      start_date: task.startPlanned,
      end_date: task.endPlanned,
      duration: task.durationDays || calculateTaskDuration(task.startPlanned, task.endPlanned),
      progress: task.actual?.progressPct || 0,
      type: task.milestone ? 'milestone' : 'task',
      color: getTaskColor(task.status),
      parent: task.wbsPath.length > 1 ? task.wbsPath[task.wbsPath.length - 2] : undefined,
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

export type TasksViewMode = 'ical' | 'list' | 'gantt'

/**
 * Task calendar (FullCalendar) in Project → Tasks.
 * Disabled per customer request: list + Gantt are enough; calendar code stays for later reuse.
 */
export const TASKS_CALENDAR_ENABLED = false

export const DEFAULT_TASKS_VIEW_MODE: TasksViewMode = TASKS_CALENDAR_ENABLED ? 'ical' : 'list'

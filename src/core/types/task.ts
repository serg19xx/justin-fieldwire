// Task dependency types
export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF'

// Task dependency interface
export interface TaskDependency {
  predecessorId: string
  type: DependencyType
  lagDays?: number
}

// Task baseline interface
export interface TaskBaseline {
  start: string
  end?: string
}

// Task actual progress interface
export interface TaskActual {
  start?: string
  end?: string
  progressPct?: number
}

// Task status type
export type TaskStatus = 'planned' | 'scheduled' | 'scheduled_accepted' | 'in_progress' | 'partially_completed' | 'delayed_due_to_issue' | 'ready_for_inspection' | 'completed'

// Milestone task types
export type MilestoneType = 'inspection' | 'visit' | 'meeting' | 'review' | 'delivery' | 'approval' | 'other'

// Helper function to check if value is a milestone
export function isMilestone(milestone: MilestoneType | string | number | boolean | null | undefined): boolean {
  if (milestone === null || milestone === undefined || milestone === false || milestone === 0 || milestone === '') {
    return false
  }
  if (typeof milestone === 'boolean') return milestone
  if (typeof milestone === 'number') return milestone > 0
  if (typeof milestone === 'string') {
    return ['inspection', 'visit', 'meeting', 'review', 'delivery', 'approval', 'other'].includes(milestone)
  }
  return false
}

// Main Task interface (matches database structure)
export interface Task {
  id: string
  project_id: number
  wbs_path?: string // WBS path as string "1.1.1"
  name: string
  start_planned: string // DATE from database
  end_planned?: string // DATE from database
  duration_days?: number
  milestone: MilestoneType | null | 0 | false // null/0/false = regular task, text code = milestone type
  milestone_type?: MilestoneType // Computed property for backward compatibility (same as milestone)
  status: TaskStatus
  progress_pct: number
  notes?: string
  task_lead_id?: number // single responsible person
  team_members?: number[] // array of team member IDs
  assignees?: number[] // legacy field for backward compatibility
  created_at: string
  updated_at: string
  // Extended properties (from database)
  resources: string[] // resource IDs
  task_order?: number // Order for manual sorting in Gantt chart
  dependencies: Array<{ predecessor_id: number; type: string; lag_days: number }> | number[] // Full dependency objects or legacy IDs
  baseline_start?: string
  baseline_end?: string
  actual_start?: string
  actual_end?: string
  slack_days?: number
  // For future use
  deps?: TaskDependency[]
  calendarId?: string
}

// Task for FullCalendar (simplified version)
export interface CalendarTask {
  id: string
  title: string
  start: string
  end?: string
  allDay?: boolean
  color?: string
  editable?: boolean
  startEditable?: boolean
  durationEditable?: boolean
  extendedProps: {
    wbsPath: string[]
    status: TaskStatus
    assignees: string[]
    milestone: boolean
    progressPct?: number
    description?: string
  }
}

// Task creation/update DTO
export interface TaskCreateUpdate {
  project_id?: number
  wbs_path?: string
  name: string
  start_planned: string
  end_planned?: string
  duration_days?: number
  milestone?: MilestoneType | null | 0 | false // null/0/false = regular task, text code = milestone type
  milestone_type?: MilestoneType // Computed property for backward compatibility (same as milestone)
  status?: TaskStatus
  progress_pct?: number
  notes?: string
  task_lead_id?: number
  team_members?: number[]
  assignees?: number[]
  invited_people?: Array<{ name: string; email?: string; company?: string; phone?: string; notes?: string; avatar?: string }> // For milestones - can be passed during creation
  resources?: string[]
  dependencies?: Array<{ predecessor_id: number; type: string; lag_days: number }>
  task_order?: number // Order for manual sorting in Gantt chart
  // Legacy fields for backward compatibility
  wbsPath?: string[]
  startPlanned?: string
  endPlanned?: string
  durationDays?: number
  deps?: TaskDependency[]
  calendarId?: string
}

// Task filter interface
export interface TaskFilter {
  status?: TaskStatus[]
  assignees?: string[]
  resources?: string[]
  wbsPath?: string[]
  dateRange?: {
    start: string
    end: string
  }
  // Additional filter fields
  priority?: string[]
  search?: string
  project_id?: string
  // Sorting options
  sortBy?: 'start_date' | 'end_date' | 'name' | 'created_at' | 'task_order' | 'original'
  sortOrder?: 'asc' | 'desc'
}

// Task statistics interface
export interface TaskStats {
  total: number
  planned: number
  scheduled: number
  scheduledAccepted: number
  inProgress: number
  partiallyCompleted: number
  delayedDueToIssue: number
  readyForInspection: number
  completed: number
  milestones: number
  avgProgress: number
}

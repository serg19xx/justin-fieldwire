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
export type TaskStatus = 'planned' | 'in_progress' | 'done' | 'blocked' | 'delayed'

// Main Task interface (matches database structure)
export interface Task {
  id: string
  project_id: number
  wbs_path?: string // WBS path as string "1.1.1"
  name: string
  start_planned: string // DATE from database
  end_planned?: string // DATE from database
  duration_days?: number
  milestone: boolean
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
  wbsPath: string[]
  name: string
  startPlanned: string
  endPlanned?: string
  durationDays?: number
  deps?: TaskDependency[]
  resources?: string[]
  assignees?: string[]
  calendarId?: string
  milestone?: boolean
  status?: TaskStatus
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
}

// Task statistics interface
export interface TaskStats {
  total: number
  planned: number
  inProgress: number
  done: number
  blocked: number
  delayed: number
  milestones: number
  avgProgress: number
}

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

// Main Task interface
export interface Task {
  id: string
  wbsPath: string[] // ['Фундамент','Опалубка']
  name: string
  startPlanned: string // ISO
  endPlanned?: string // ISO
  durationDays?: number
  deps?: TaskDependency[]
  resources?: string[] // ids бригад/техники/материалов
  assignees?: string[] // ids ответственных
  calendarId?: string // id календаря ресурса/проекта
  milestone?: boolean
  baseline?: TaskBaseline
  actual?: TaskActual
  slackDays?: number
  status?: TaskStatus
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

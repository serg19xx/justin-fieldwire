// Event Rules - TypeScript interfaces

// Severity shown to users (business importance)
export type EventSeverity = 'critical' | 'important'

// Technical processing priority (queue ordering)
export type EventPriority = 'critical' | 'high' | 'normal' | 'low'

// Delivery channels for notify action
export type NotifyChannel = 'email' | 'sms' | 'push' | 'webhook' | 'slack'

// Condition priority semantics
export type ConditionPriority = 'required' | 'preferred' | 'optional'

// Common roles in the system
export type UserRole =
  | 'admin'
  | 'project_manager'
  | 'contractor'
  | 'architect'
  | 'viewer'
  | 'guest'

export interface TimeRange {
  start: string // HH:mm
  end: string // HH:mm
}

export interface TimeConditionsValue {
  business_hours_only?: boolean
  weekdays_only?: boolean
  weekends_only?: boolean
  timezone?: string
  time_range?: TimeRange
  specific_hours?: number[]
  specific_days?: number[] // 1-7, 1 = Monday
  exclude_holidays?: boolean
}

export interface ProjectConditionsValue {
  min_budget?: number
  max_budget?: number
  status?: string[]
  exclude_status?: string[]
  project_type?: string
  priority?: string[]
  min_duration_days?: number
  max_duration_days?: number
}

export interface TaskConditionsValue {
  status?: string[]
  exclude_status?: string[]
  min_priority?: number
  max_priority?: number
  is_milestone?: boolean
  has_dependencies?: boolean
  overdue_only?: boolean
  due_soon_days?: number
}

export interface ConditionField<T> {
  value: T
  priority: ConditionPriority
}

export interface EventRuleConditions {
  strict_mode?: boolean
  notify_roles?: ConditionField<UserRole[]>
  user_roles?: ConditionField<UserRole[]>
  exclude_roles?: ConditionField<UserRole[]>
  time_conditions?: ConditionField<TimeConditionsValue>
  project_conditions?: ConditionField<ProjectConditionsValue>
  task_conditions?: ConditionField<TaskConditionsValue>
  // Allow future custom conditions without changing type consumers
  [key: string]: unknown
}

export interface NotifyAction {
  type: 'notify'
  channels: NotifyChannel[]
  channel_templates?: Partial<Record<NotifyChannel, number | null>>
  store_for_dashboard: boolean
}

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom'

export interface CreateReportAction {
  type: 'create_report'
  period: ReportPeriod
  custom_period?: string // ISO8601 duration (e.g., P7D)
  store_for_dashboard: boolean
  recipients?: UserRole[]
}

export interface LogOnlyAction {
  type: 'log_only'
  store_for_dashboard: boolean
}

export type EventRuleAction = NotifyAction | CreateReportAction | LogOnlyAction

export type ExecutionLocation = 'server' | 'n8n' | 'both' | null

export interface EventRule {
  event_type: string
  enabled: boolean
  severity: EventSeverity
  priority?: EventPriority | null
  actions: EventRuleAction[]
  conditions?: EventRuleConditions
  execution_location?: ExecutionLocation
  comment?: string
  updated_at?: string
}

// API response wrappers
export interface ApiSuccess<T> {
  error_code: 0
  status: 'success'
  data: T
}

export interface ApiError {
  error_code: number
  status: 'error'
  message: string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError



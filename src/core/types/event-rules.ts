// Event Rules - TypeScript interfaces

// Severity shown to users (business importance)
export type EventSeverity = 'critical' | 'important'

// Technical processing priority (queue ordering)
export type EventPriority = 'critical' | 'high' | 'normal' | 'low'

// Delivery channels for notify action (webhook/slack reserved for future)
export type NotifyChannel = 'email' | 'sms' | 'push'

// Roles resolved by EventOutboxProcessor::resolveRecipientUserIds
export type RecipientRole =
  | 'admin'
  | 'project_manager'
  | 'task_lead'
  | 'team_members'
  | 'foreman'
  | 'worker'
  | 'contractor'
  | 'inspector'

export type ChannelContentMode = 'system' | 'local' | 'manual'

export interface ChannelContentSpec {
  mode: ChannelContentMode
  template_id?: number | null
  subject?: string
  body?: string
}

export interface TimeRange {
  start: string // HH:mm
  end: string // HH:mm
}

/** Crontab-like schedule: periodicity + time-of-day window. */
export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly'

/** How monthly schedule picks the calendar day. */
export type MonthlyMode = 'day_of_month' | 'nth_weekday'

/** 1=1st, 2=2nd, 3=3rd, 4=4th, -1=last (e.g. last Monday). */
export type WeekdayOccurrence = 1 | 2 | 3 | 4 | -1

export interface TimeConditionsValue {
  /** How often the schedule may match (crontab-style). */
  frequency?: ScheduleFrequency
  /** 1=Monday … 7=Sunday. Weekly / daily mask / nth_weekday. */
  days_of_week?: number[]
  /** Monthly: calendar day vs Nth weekday (like cron DOM vs DOW). */
  monthly_mode?: MonthlyMode
  /** 1–31 when monthly_mode=day_of_month (ignored if day_of_month_last). */
  day_of_month?: number
  /** When true: last calendar day of the month (cron "L"). */
  day_of_month_last?: boolean
  /** When monthly_mode=nth_weekday: 1st/2nd/3rd/4th/last. */
  weekday_occurrence?: WeekdayOccurrence
  /** Optional month mask 1–12; empty/omit = every month. */
  months?: number[]
  /** Local time when the window opens (HH:mm). */
  at_time?: string
  /** Local time when the window closes (HH:mm). Defaults to at_time + 30m. */
  until_time?: string
  timezone?: string
  /** @deprecated migrated into frequency / days_of_week / at_time */
  business_hours_only?: boolean
  /** @deprecated migrated into days_of_week */
  weekdays_only?: boolean
  weekends_only?: boolean
  /** @deprecated migrated into at_time / until_time */
  time_range?: TimeRange
  specific_hours?: number[]
  specific_days?: number[] // 1-7, 1 = Monday
  exclude_holidays?: boolean
}

/** Schedule filter: when the rule may fire (not who receives notifications). */
export interface EventRuleConditions {
  time_conditions?: TimeConditionsValue
  // Allow legacy keys during migration without breaking consumers
  [key: string]: unknown
}

export interface NotifyAction {
  type: 'notify'
  channels: NotifyChannel[]
  channel_content?: Partial<Record<NotifyChannel, ChannelContentSpec>>
  /** @deprecated use channel_content */
  channel_templates?: Partial<Record<NotifyChannel, number | null>>
  recipients: RecipientRole[]
}

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom'

export interface CreateReportAction {
  type: 'create_report'
  period: ReportPeriod
  custom_period?: string // ISO8601 duration (e.g., P7D)
  recipients: RecipientRole[]
}

export interface LogOnlyAction {
  type: 'log_only'
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

import api from './api'

// Event Rules API (updated schema)
export type EventSeverity = 'critical' | 'important'
export type EventPriority = 'critical' | 'high' | 'normal' | 'low'
export type ExecutionLocation = 'server' | 'n8n' | 'both' | null

export type NotifyChannel = 'email' | 'sms' | 'push' | 'webhook' | 'slack'

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
  custom_period?: string
  store_for_dashboard: boolean
  recipients?: string[]
}

export interface LogOnlyAction {
  type: 'log_only'
  store_for_dashboard: boolean
}

export type EventRuleAction = NotifyAction | CreateReportAction | LogOnlyAction

export type ConditionPriority = 'required' | 'preferred' | 'optional'

export interface ConditionField<T> {
  value: T
  priority: ConditionPriority
}

export interface EventConditions {
  strict_mode?: boolean
  notify_roles?: ConditionField<string[]>
  user_roles?: ConditionField<string[]>
  exclude_roles?: ConditionField<string[]>
  time_conditions?: ConditionField<{
    business_hours_only?: boolean
    weekdays_only?: boolean
    weekends_only?: boolean
    timezone?: string
    time_range?: { start: string; end: string }
    specific_hours?: number[]
    specific_days?: number[]
    exclude_holidays?: boolean
  }>
  project_conditions?: ConditionField<Record<string, unknown>>
  task_conditions?: ConditionField<Record<string, unknown>>
}

export interface EventRule {
  event_type: string
  enabled: boolean
  severity: EventSeverity
  priority?: EventPriority | null
  actions: EventRuleAction[]
  conditions?: EventConditions | null
  execution_location?: ExecutionLocation
  comment?: string
  updated_at?: string
  updated_by?: number | null
}

export type CreateEventRuleRequest = EventRule
export type UpdateEventRuleRequest = EventRule

// Message Templates API
export interface MessageTemplate {
  id: number
  name: string
  type: 'email' | 'sms'
  category: 'system' | 'custom'
  subject?: string
  body: string
  variables: Record<string, string>
  is_editable: boolean
  is_active: boolean
  parent_id?: number | null
  created_by: number
  created_at: string
  updated_at: string
}

export interface CreateMessageTemplateRequest {
  name: string
  type: 'email' | 'sms'
  category: 'system' | 'custom'
  subject?: string
  body: string
  variables?: Record<string, string>
  is_editable?: boolean
  is_active?: boolean
}

export interface UpdateMessageTemplateRequest {
  name?: string
  type?: 'email' | 'sms'
  category?: 'system' | 'custom'
  subject?: string
  body?: string
  variables?: Record<string, string>
  is_editable?: boolean
  is_active?: boolean
}

// Event Types and Variables
export interface EventType {
  type: string
  name: string
  description: string
  available_variables: string[]
}

export interface EventRuleConditionType {
  type: string
  name: string
  description: string
  operators: string[]
}

export interface EventRuleActionType {
  type: string
  name: string
  description: string
  config_fields: string[]
}

// API Functions
export const adminApi = {
  // Event Rules
  async getEventRules(): Promise<EventRule[]> {
    const response = await api.get('/api/v1/admin/event-rules')
    return response.data.data.rules
  },

  async getEventRule(eventType: string): Promise<EventRule> {
    const response = await api.get(`/api/v1/admin/event-rules/${eventType}`)
    return response.data.data.rule
  },

  async createEventRule(data: CreateEventRuleRequest): Promise<EventRule> {
    const response = await api.post('/api/v1/admin/event-rules', data)
    return response.data.data.rule
  },

  async updateEventRule(eventType: string, data: UpdateEventRuleRequest): Promise<EventRule> {
    const response = await api.put(`/api/v1/admin/event-rules/${eventType}`, data)
    return response.data.data.rule
  },

  async deleteEventRule(eventType: string): Promise<void> {
    await api.delete(`/api/v1/admin/event-rules/${eventType}`)
  },

  async getEventRuleConditions(): Promise<EventRuleConditionType[]> {
    const response = await api.get('/api/v1/admin/event-rules/conditions')
    return response.data.data.conditions
  },

  async getEventRuleActions(): Promise<EventRuleActionType[]> {
    const response = await api.get('/api/v1/admin/event-rules/actions')
    return response.data.data.actions
  },

  // Message Templates
  async getMessageTemplates(): Promise<MessageTemplate[]> {
    const response = await api.get('/api/v1/admin/message-templates')
    return response.data.data.templates
  },

  async getSystemTemplates(): Promise<MessageTemplate[]> {
    const response = await api.get('/api/v1/admin/message-templates/system')
    return response.data.data.templates
  },

  async getCustomTemplates(): Promise<MessageTemplate[]> {
    const response = await api.get('/api/v1/admin/message-templates/custom')
    return response.data.data.templates
  },

  // Deprecated: templates are not bound to event_type anymore

  async getMessageTemplate(id: number): Promise<MessageTemplate> {
    const response = await api.get(`/api/v1/admin/message-templates/${id}`)
    return response.data.data.template
  },

  async createMessageTemplate(data: CreateMessageTemplateRequest): Promise<MessageTemplate> {
    const response = await api.post('/api/v1/admin/message-templates', data)
    return response.data.data.template
  },

  async updateMessageTemplate(
    id: number,
    data: UpdateMessageTemplateRequest,
  ): Promise<MessageTemplate> {
    const response = await api.put(`/api/v1/admin/message-templates/${id}`, data)
    return response.data.data.template
  },

  async deleteMessageTemplate(id: number): Promise<void> {
    await api.delete(`/api/v1/admin/message-templates/${id}`)
  },

  // Event Types and Variables
  async getEventTypes(): Promise<EventType[]> {
    // Mock data for now - replace with actual API call
    return [
      {
        type: 'TASK_CREATED',
        name: 'Task Created',
        description: 'Triggered when a new task is created',
        available_variables: [
          'TASK_NAME',
          'PROJECT_NAME',
          'ASSIGNEE_NAME',
          'DUE_DATE',
          'CREATED_BY',
        ],
      },
      {
        type: 'TASK_DELETED',
        name: 'Task Deleted',
        description: 'Triggered when a task is deleted',
        available_variables: ['TASK_NAME', 'PROJECT_NAME', 'ASSIGNEE_NAME', 'DELETED_BY'],
      },
      {
        type: 'PROJECT_CREATED',
        name: 'Project Created',
        description: 'Triggered when a new project is created',
        available_variables: ['PROJECT_NAME', 'PROJECT_MANAGER', 'START_DATE', 'END_DATE'],
      },
      {
        type: 'STATUS_CHANGED',
        name: 'Status Changed',
        description: 'Triggered when task status changes',
        available_variables: [
          'TASK_NAME',
          'PROJECT_NAME',
          'ASSIGNEE_NAME',
          'OLD_STATUS',
          'NEW_STATUS',
          'CHANGED_BY',
        ],
      },
      {
        type: 'SCHEDULE_CHANGED',
        name: 'Schedule Changed',
        description: 'Triggered when task schedule changes',
        available_variables: [
          'TASK_NAME',
          'PROJECT_NAME',
          'ASSIGNEE_NAME',
          'OLD_START_DATE',
          'NEW_START_DATE',
          'OLD_END_DATE',
          'NEW_END_DATE',
        ],
      },
      {
        type: 'ASSIGNEES_CHANGED',
        name: 'Assignees Changed',
        description: 'Triggered when task assignees change',
        available_variables: [
          'TASK_NAME',
          'PROJECT_NAME',
          'OLD_ASSIGNEES',
          'NEW_ASSIGNEES',
          'CHANGED_BY',
        ],
      },
      {
        type: 'DEPENDENCIES_CHANGED',
        name: 'Dependencies Changed',
        description: 'Triggered when task dependencies change',
        available_variables: [
          'TASK_NAME',
          'PROJECT_NAME',
          'OLD_DEPENDENCIES',
          'NEW_DEPENDENCIES',
          'CHANGED_BY',
        ],
      },
      {
        type: 'TASK_PUBLISHED',
        name: 'Task Published',
        description: 'Triggered when a draft task is published',
        available_variables: ['TASK_NAME', 'PROJECT_NAME', 'ASSIGNEE_NAME', 'PUBLISHED_BY'],
      },
      {
        type: 'USER_REGISTRATION_COMPLETED',
        name: 'User Registration Completed',
        description: 'Triggered when user completes registration',
        available_variables: ['USER_NAME', 'USER_EMAIL', 'REGISTRATION_DATE'],
      },
    ]
  },
}

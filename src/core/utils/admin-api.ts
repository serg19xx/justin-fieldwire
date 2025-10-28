import api from './api'

// Event Rules API
export interface EventRule {
  event_type: string
  enabled: boolean
  actions: string[]
  severity: 'critical' | 'important' | 'normal' | null
  conditions: EventConditions | null
  comment: string
  execution_location: 'server' | 'auto' | null
  updated_at: string
  updated_by: number | null
}

export interface EventConditions {
  user_roles?: string[]
  notify_roles?: string[]
  time_conditions?: {
    business_hours_only?: boolean
  }
  event_conditions?: {
    min_severity?: string
  }
}

export interface CreateEventRuleRequest {
  event_type: string
  enabled: boolean
  actions: string[]
  severity?: 'critical' | 'important' | 'normal'
  conditions?: EventConditions
  comment: string
  execution_location?: 'server' | 'auto'
}

export interface UpdateEventRuleRequest {
  enabled?: boolean
  actions?: string[]
  severity?: 'critical' | 'important' | 'normal'
  conditions?: EventConditions
  comment?: string
  execution_location?: 'server' | 'auto'
}

// Message Templates API
export interface MessageTemplate {
  id: number
  name: string
  type: 'email' | 'sms'
  category: 'system' | 'custom'
  event_type: string
  subject?: string
  body: string
  variables: Record<string, string>
  is_editable: boolean
  is_active: boolean
  created_by: number
  created_at: string
  updated_at: string
}

export interface CreateMessageTemplateRequest {
  name: string
  type: 'email' | 'sms'
  category: 'system' | 'custom'
  event_type: string
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
  event_type?: string
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

export interface EventRuleCondition {
  type: string
  name: string
  description: string
  operators: string[]
}

export interface EventRuleAction {
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

  async getEventRuleConditions(): Promise<EventRuleCondition[]> {
    const response = await api.get('/api/v1/admin/event-rules/conditions')
    return response.data.data.conditions
  },

  async getEventRuleActions(): Promise<EventRuleAction[]> {
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

  async getTemplatesByEvent(eventType: string): Promise<MessageTemplate[]> {
    const response = await api.get(`/api/v1/admin/message-templates/by-event/${eventType}`)
    return response.data.data.templates
  },

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

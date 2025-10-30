import { api } from './api'
import type { ApiResponse, EventRule } from '@/core/types/event-rules'

export interface EventRulesListData {
  rules: EventRule[]
}

export interface MessageTemplate {
  id: number
  name: string
  type: 'email' | 'sms'
  category: 'system' | 'custom'
  subject?: string
  body?: string
  variables?: Record<string, string>
  is_editable?: boolean
  is_active?: boolean
  parent_id?: number | null
  created_by?: number
  created_at?: string
  updated_at?: string
}

export interface MessageTemplatesData {
  templates: MessageTemplate[]
}

export const eventRulesApi = {
  async list(): Promise<ApiResponse<EventRulesListData>> {
    const { data } = await api.get('/api/v1/admin/event-rules')
    return data
  },

  async get(eventType: string): Promise<ApiResponse<{ rule: EventRule }>> {
    const { data } = await api.get(`/api/v1/admin/event-rules/${encodeURIComponent(eventType)}`)
    return data
  },

  async create(rule: EventRule): Promise<ApiResponse<{ rule: EventRule }>> {
    const { data } = await api.post('/api/v1/admin/event-rules', rule)
    return data
  },

  async update(eventType: string, rule: EventRule): Promise<ApiResponse<{ rule: EventRule }>> {
    const { data } = await api.put(
      `/api/v1/admin/event-rules/${encodeURIComponent(eventType)}`,
      rule,
    )
    return data
  },

  async remove(eventType: string): Promise<ApiResponse<unknown>> {
    const { data } = await api.delete(`/api/v1/admin/event-rules/${encodeURIComponent(eventType)}`)
    return data
  },

  async listTemplates(params?: {
    type?: 'email' | 'sms'
    category?: 'system' | 'custom'
  }): Promise<ApiResponse<MessageTemplatesData>> {
    const { data } = await api.get('/api/v1/admin/message-templates', { params })
    return data
  },
}

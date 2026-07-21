import { api } from './api'

export interface EventLogItem {
  id: number
  occurred_at: string
  entity_type: string
  entity_id: number | null
  event_type: string
  severity: string | null
  actor_type: string | null
  actor_id: number | null
  actor_name: string | null
  comment: string | null
  project_id: number | null
  project_name: string | null
  task_id: number | null
  task_name: string | null
  changed_fields: string[] | Record<string, unknown> | null
  before_data: Record<string, unknown> | null
  after_data: Record<string, unknown> | null
  correlation_id?: string | null
  ip?: string | null
}

export interface EventLogListResult {
  logs: EventLogItem[]
  total: number
  limit: number
  offset: number
}

export interface EventLogFilters {
  event_type?: string
  entity_type?: string
  entity_id?: number
  severity?: string
  actor_type?: string
  date_from?: string
  date_to?: string
  project_id?: number
  q?: string
  limit?: number
  offset?: number
}

export const eventLogsApi = {
  async list(filters: EventLogFilters = {}): Promise<EventLogListResult> {
    const params: Record<string, string | number> = {}
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null || value === '') continue
      params[key] = value as string | number
    }
    const response = await api.get('/api/v1/event-logs', { params })
    return response.data.data
  },

  async getById(id: number): Promise<EventLogItem> {
    const response = await api.get(`/api/v1/event-logs/${id}`)
    return response.data.data
  },
}

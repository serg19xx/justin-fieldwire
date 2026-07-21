import { api } from './api'

export interface DashboardKpis {
  active_projects: number
  field_work_started_today: number
  field_work_ended_today: number
  field_work_open_today: number
  foreman_submitted_today: number
  urgent_last_7_days: number
  events_last_24h: number
}

export interface DashboardAlert {
  severity: 'warning' | 'info'
  code: string
  message: string
  project_id: number
  project_name: string
  task_id: number
  task_name: string
  at: string
}

export interface DashboardActivityItem {
  at: string
  event_type: string
  title: string
  project_id: number
  project_name: string
  task_id: number | null
  task_name: string | null
  comment: string | null
}

export interface DashboardMessage {
  id: number
  title: string
  body: string
  at: string
  source: 'admin' | 'pm' | 'system'
}

export interface DashboardPayload {
  generated_at: string
  scope: 'global' | 'project' | 'field'
  project_id: number | null
  project_name: string | null
  kpis: DashboardKpis
  alerts: DashboardAlert[]
  activity: DashboardActivityItem[]
  messages?: DashboardMessage[]
}

export const dashboardApi = {
  async getGlobal(): Promise<DashboardPayload> {
    const response = await api.get('/api/v1/dashboard/global')
    return response.data.data
  },

  async getForProject(projectId: number): Promise<DashboardPayload> {
    const response = await api.get(`/api/v1/dashboard/project/${projectId}`)
    return response.data.data
  },

  async getField(): Promise<DashboardPayload> {
    const response = await api.get('/api/v1/dashboard/field')
    return response.data.data
  },
}

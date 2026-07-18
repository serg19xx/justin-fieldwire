import { api } from './api'

export interface ReportListItem {
  id: number
  report_date: string
  project_id: number
  project_name: string | null
  report_type: string
  scope: string
  title: string | null
  status: 'generated' | 'sent' | 'failed'
  generated_at: string
  sent_at: string | null
}

export interface ReportSectionRow {
  task_id?: number
  task_name?: string
  at?: string
  reason?: string
  comment?: string
  title?: string
  type?: string
  from?: string
  to?: string
  event_type?: string
  source?: string
  photo_count?: number
  photos?: ReportPhotoSnapshot[]
}

export interface ReportPhotoSnapshot {
  id: number
  slot: 'before' | 'after'
  original_name: string
  mime_type: string
  uploaded_at: string
  data_uri: string
}

export interface ReportTaskActivity {
  task_id: number
  task_name: string
  status: string
  progress_pct: number | null
  started_at: string
  ended_at: string
  worked_minutes: number | null
  start_reason: string
  end_reason: string
  notes: string
  submitted: boolean
  photos_before: ReportPhotoSnapshot[]
  photos_after: ReportPhotoSnapshot[]
}

export interface ReportCounts {
  field_work_starts: number
  field_work_ends: number
  urgent: number
  foreman_submitted: number
  lifecycle_changes: number
  events_logged: number
}

export interface ReportProjectSummary {
  project_id: number
  project_name: string
  counts: ReportCounts
}

export interface ReportPayload {
  report_date: string
  project_id?: number
  project_name?: string
  scope?: string
  sys_status?: string | null
  project_count?: number
  counts: ReportCounts
  projects?: ReportProjectSummary[]
  task_activities?: ReportTaskActivity[]
  field_work_started?: ReportSectionRow[]
  field_work_ended?: ReportSectionRow[]
  urgent?: ReportSectionRow[]
  foreman_submitted?: ReportSectionRow[]
  lifecycle?: ReportSectionRow[]
}

export interface ReportDetail {
  id: number
  report_date: string
  project_id: number
  report_type: string
  scope: string
  title: string | null
  status: string
  generated_at: string
  sent_at: string | null
  payload: ReportPayload
}

export interface ReportListFilters {
  type?: string
  scope?: 'project' | 'global'
  from?: string
  to?: string
  limit?: number
}

export const reportsApi = {
  async list(filters: ReportListFilters = {}): Promise<ReportListItem[]> {
    const response = await api.get('/api/v1/reports', { params: filters })
    return response.data.data?.items ?? []
  },

  async listForProject(
    projectId: number,
    filters: ReportListFilters = {},
  ): Promise<ReportListItem[]> {
    const response = await api.get(`/api/v1/projects/${projectId}/reports`, { params: filters })
    return response.data.data?.items ?? []
  },

  async getById(reportId: number): Promise<ReportDetail> {
    const response = await api.get(`/api/v1/reports/${reportId}`)
    return response.data.data
  },

  /**
   * Fetch the immutable HTML snapshot with auth and open it in a new tab.
   * Plain window.open would miss the Bearer token, so we go through a blob URL.
   */
  async openSnapshot(reportId: number): Promise<void> {
    const response = await api.get(`/api/v1/reports/${reportId}/view`, { responseType: 'text' })
    const blob = new Blob([response.data], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener')
    // Give the new tab time to load before revoking
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  },
}

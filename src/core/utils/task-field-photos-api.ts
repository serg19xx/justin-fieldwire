import { api } from './api'
import type { TaskFieldPhotoSlot } from './task-field-photos-storage'

/** Field before/after photos plus PM reference pictures that explain the task. */
export type TaskPhotoSlot = TaskFieldPhotoSlot | 'reference'

export interface TaskFieldPhoto {
  id: number
  project_id: number
  task_id: number
  work_date: string
  slot: TaskPhotoSlot
  file_name: string
  original_name: string
  mime_type: string
  file_size: number
  uploaded_by: number
  uploaded_at: string
}

export interface TaskFieldPhotosResponse {
  before: TaskFieldPhoto[]
  after: TaskFieldPhoto[]
  reference: TaskFieldPhoto[]
}

/** Row of the project-wide photo gallery. */
export interface ProjectTaskPhoto extends TaskFieldPhoto {
  task_name: string
  task_category: string | null
  uploaded_by_name: string
}

export interface TaskFieldPhotoUiRecord extends TaskFieldPhoto {
  previewUrl: string
}

/** Matches PlanController::TASK_FIELD_PHOTO_PLAN_FILE_ID_OFFSET */
export const TASK_FIELD_PHOTO_PLAN_FILE_ID_OFFSET = 1_000_000_000

export const taskFieldPhotoMaxUploadFileSizeBytes = 5 * 1024 * 1024

function toList(raw: unknown): TaskFieldPhoto[] {
  if (!Array.isArray(raw)) return []
  return raw.map(normalizePhoto).filter((p): p is TaskFieldPhoto => p != null)
}

function normalizePhoto(raw: unknown): TaskFieldPhoto | null {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return null
  const r = raw as Record<string, unknown>
  const id = Number(r.id)
  const projectId = Number(r.project_id)
  const taskId = Number(r.task_id)
  const slot: TaskPhotoSlot | null =
    r.slot === 'after' || r.slot === 'before' || r.slot === 'reference' ? r.slot : null
  if (!Number.isFinite(id) || id <= 0) return null
  if (!Number.isFinite(projectId) || projectId <= 0) return null
  if (!Number.isFinite(taskId) || taskId <= 0) return null
  if (slot == null) return null
  const workDate = String(r.work_date ?? '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(workDate)) return null
  return {
    id,
    project_id: projectId,
    task_id: taskId,
    work_date: workDate,
    slot,
    file_name: String(r.file_name ?? ''),
    original_name: String(r.original_name ?? r.file_name ?? ''),
    mime_type: String(r.mime_type ?? 'image/jpeg'),
    file_size: Number(r.file_size ?? 0),
    uploaded_by: Number(r.uploaded_by ?? 0),
    uploaded_at: String(r.uploaded_at ?? ''),
  }
}

function pickUploadCandidate(raw: unknown): unknown {
  if (raw == null) return null
  if (Array.isArray(raw)) return raw[0] ?? null
  if (typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  return r.data ?? r.photo ?? r.item ?? r
}

export function resolveFieldWorkPhotoWorkDate(fieldWorkStartedAt: string | null | undefined): string {
  const started = String(fieldWorkStartedAt ?? '').trim()
  if (started.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(started)) {
    return started.slice(0, 10)
  }
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const taskFieldPhotosApi = {
  async fetch(
    projectId: number,
    taskId: number,
    workDate: string,
  ): Promise<TaskFieldPhotosResponse> {
    const response = await api.get(
      `/api/v1/projects/${projectId}/tasks/${taskId}/field-photos`,
      { params: { work_date: workDate } },
    )
    const body = response.data as
      | {
          data?: { before?: unknown[]; after?: unknown[]; reference?: unknown[] }
          before?: unknown[]
          after?: unknown[]
          reference?: unknown[]
        }
      | undefined
    const data = body?.data ?? body
    return {
      before: toList(data?.before),
      after: toList(data?.after),
      reference: toList(data?.reference),
    }
  },

  /** Every task photo of the project (or of one task), newest first. */
  async listProject(projectId: number, taskId?: number): Promise<ProjectTaskPhoto[]> {
    const response = await api.get(`/api/v1/projects/${projectId}/field-photos`, {
      params: taskId ? { task_id: taskId } : undefined,
    })
    const body = response.data as { data?: unknown } | undefined
    const rows = Array.isArray(body?.data) ? body.data : []
    return rows.flatMap((raw: unknown) => {
      const photo = normalizePhoto(raw)
      if (!photo) return []
      const r = raw as Record<string, unknown>
      const category = typeof r.task_category === 'string' ? r.task_category.trim() : ''
      return [
        {
          ...photo,
          task_name: String(r.task_name ?? ''),
          task_category: category || null,
          uploaded_by_name: String(r.uploaded_by_name ?? ''),
        },
      ]
    })
  },

  async upload(
    projectId: number,
    taskId: number,
    slot: TaskPhotoSlot,
    workDate: string,
    file: File,
  ): Promise<TaskFieldPhoto> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('slot', slot)
    formData.append('work_date', workDate)
    const response = await api.post(
      `/api/v1/projects/${projectId}/tasks/${taskId}/field-photos`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    const normalized = normalizePhoto(pickUploadCandidate(response.data))
    if (normalized != null) return normalized

    const refreshed = await this.fetch(projectId, taskId, workDate)
    const list = refreshed[slot]
    const latest = [...list].sort((a, b) => {
      const byTime = Date.parse(b.uploaded_at) - Date.parse(a.uploaded_at)
      if (Number.isFinite(byTime) && byTime !== 0) return byTime
      return b.id - a.id
    })[0]
    if (latest != null) return latest
    throw new Error('Invalid upload response')
  },

  async download(projectId: number, taskId: number, photoId: number, preview = true): Promise<Blob> {
    const response = await api.get(
      `/api/v1/projects/${projectId}/tasks/${taskId}/field-photos/${photoId}/download`,
      {
        params: preview ? { action: 'preview' } : undefined,
        responseType: 'blob',
      },
    )
    return response.data as Blob
  },

  async remove(projectId: number, taskId: number, photoId: number): Promise<void> {
    await api.delete(`/api/v1/projects/${projectId}/tasks/${taskId}/field-photos/${photoId}`)
  },
}

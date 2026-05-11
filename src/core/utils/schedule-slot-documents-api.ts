import { api } from './api'

export type ScheduleSlotDocumentBucket = 'setup' | 'completed'

export interface ScheduleSlotDocument {
  id: number
  schedule_entry_id: number
  project_id: number
  bucket: ScheduleSlotDocumentBucket
  file_name: string
  original_name: string
  display_name?: string
  mime_type: string
  file_size: number
  uploaded_by: number
  uploaded_at: string
}

export interface ScheduleSlotDocumentsResponse {
  setup: ScheduleSlotDocument[]
  completed: ScheduleSlotDocument[]
}

export const scheduleSlotAllowedUploadAccept = 'image/*,application/pdf,.pdf'
export const scheduleSlotMaxUploadFileSizeBytes = 20 * 1024 * 1024

const scheduleSlotAllowedMimeTypes = new Set<string>(['application/pdf'])
const scheduleSlotAllowedExtensions = new Set<string>(['pdf'])

function formatBytesAsMegabytes(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  return Number.isInteger(mb) ? `${mb}` : mb.toFixed(1)
}

function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

function getFileExtension(fileName: string): string {
  const normalized = fileName.trim().toLowerCase()
  const dotIdx = normalized.lastIndexOf('.')
  if (dotIdx <= 0 || dotIdx === normalized.length - 1) return ''
  return normalized.slice(dotIdx + 1)
}

export function validateScheduleSlotUploadFile(file: File): string | null {
  if (file.size > scheduleSlotMaxUploadFileSizeBytes) {
    return `File is too large. Maximum allowed size is ${formatBytesAsMegabytes(scheduleSlotMaxUploadFileSizeBytes)} MB.`
  }

  const mimeType = String(file.type || '').toLowerCase()
  const extension = getFileExtension(file.name)

  const isAllowedByMime = isImageMimeType(mimeType) || scheduleSlotAllowedMimeTypes.has(mimeType)
  const isAllowedByExtension = scheduleSlotAllowedExtensions.has(extension)

  if (isAllowedByMime || isAllowedByExtension) return null
  return 'Only images and PDF files are allowed.'
}

function normalizeDocument(raw: unknown): ScheduleSlotDocument | null {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return null
  const r = raw as Record<string, unknown>
  const id = Number(r.id)
  const scheduleEntryId = Number(r.schedule_entry_id)
  const projectId = Number(r.project_id)
  const bucket = r.bucket === 'completed' ? 'completed' : r.bucket === 'setup' ? 'setup' : null
  if (!Number.isFinite(id) || id <= 0) return null
  if (!Number.isFinite(scheduleEntryId) || scheduleEntryId <= 0) return null
  if (!Number.isFinite(projectId) || projectId <= 0) return null
  if (bucket == null) return null
  return {
    id,
    schedule_entry_id: scheduleEntryId,
    project_id: projectId,
    bucket,
    file_name: String(r.file_name ?? ''),
    original_name: String(r.original_name ?? r.file_name ?? ''),
    display_name:
      r.display_name != null && String(r.display_name).trim().length > 0
        ? String(r.display_name).trim()
        : undefined,
    mime_type: String(r.mime_type ?? ''),
    file_size: Number(r.file_size ?? 0),
    uploaded_by: Number(r.uploaded_by ?? 0),
    uploaded_at: String(r.uploaded_at ?? ''),
  }
}

function toList(raw: unknown): ScheduleSlotDocument[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => normalizeDocument(item))
    .filter((item): item is ScheduleSlotDocument => item != null)
}

function pickUploadDocumentCandidate(raw: unknown): unknown {
  if (raw == null) return null
  if (Array.isArray(raw)) return raw[0] ?? null
  if (typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  return r.data ?? r.document ?? r.file ?? r.item ?? r
}

function pickDocumentCandidate(raw: unknown): unknown {
  if (raw == null) return null
  if (Array.isArray(raw)) return raw[0] ?? null
  if (typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  return r.data ?? r.document ?? r.item ?? r
}

export const scheduleSlotDocumentsApi = {
  async fetch(projectId: number, scheduleEntryId: number): Promise<ScheduleSlotDocumentsResponse> {
    const response = await api.get(
      `/api/v1/projects/${projectId}/schedule-entries/${scheduleEntryId}/documents`,
    )
    const body = response.data as
      | { data?: { setup?: unknown[]; completed?: unknown[] }; setup?: unknown[]; completed?: unknown[] }
      | undefined
    const data = body?.data ?? body
    return {
      setup: toList(data?.setup),
      completed: toList(data?.completed),
    }
  },

  async upload(
    projectId: number,
    scheduleEntryId: number,
    bucket: ScheduleSlotDocumentBucket,
    file: File,
    displayName?: string,
  ): Promise<ScheduleSlotDocument> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', bucket)
    const normalizedDisplayName = String(displayName ?? '').trim()
    if (normalizedDisplayName.length > 0) {
      formData.append('display_name', normalizedDisplayName)
    }
    const response = await api.post(
      `/api/v1/projects/${projectId}/schedule-entries/${scheduleEntryId}/documents`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    const normalized = normalizeDocument(pickUploadDocumentCandidate(response.data))
    if (normalized != null) return normalized

    // Some backend variants return a non-standard upload shape. Fallback to
    // reloading slot documents and use the latest item in the requested bucket.
    const refreshed = await this.fetch(projectId, scheduleEntryId)
    const list = bucket === 'setup' ? refreshed.setup : refreshed.completed
    const latest = [...list].sort((a, b) => {
      const byTime = Date.parse(b.uploaded_at) - Date.parse(a.uploaded_at)
      if (Number.isFinite(byTime) && byTime !== 0) return byTime
      return b.id - a.id
    })[0]
    if (latest != null) return latest
    throw new Error('Invalid upload response')
  },

  async download(projectId: number, scheduleEntryId: number, documentId: number): Promise<Blob> {
    const response = await api.get(
      `/api/v1/projects/${projectId}/schedule-entries/${scheduleEntryId}/documents/${documentId}/download`,
      { responseType: 'blob' },
    )
    return response.data as Blob
  },

  async remove(projectId: number, scheduleEntryId: number, documentId: number): Promise<void> {
    await api.delete(`/api/v1/projects/${projectId}/schedule-entries/${scheduleEntryId}/documents/${documentId}`)
  },

  async updateDisplayName(
    projectId: number,
    scheduleEntryId: number,
    documentId: number,
    displayName: string,
  ): Promise<ScheduleSlotDocument> {
    const normalizedDisplayName = String(displayName || '').trim()
    const payload = { display_name: normalizedDisplayName || null }
    const endpoints = [
      `/api/v1/projects/${projectId}/schedule-entries/${scheduleEntryId}/documents/${documentId}`,
      `/api/v1/projects/${projectId}/schedule-entries/${scheduleEntryId}/documents/${documentId}/rename`,
    ]

    for (const endpoint of endpoints) {
      try {
        const response = await api.patch(endpoint, payload)
        const normalized = normalizeDocument(pickDocumentCandidate(response.data))
        if (normalized != null) return normalized
      } catch {
        // Try alternative endpoint or fallback to fetch.
      }
    }

    const refreshed = await this.fetch(projectId, scheduleEntryId)
    const hit = [...refreshed.setup, ...refreshed.completed].find((doc) => doc.id === documentId)
    if (hit) {
      const currentDisplayName = String(hit.display_name || '').trim()
      if (currentDisplayName === normalizedDisplayName) return hit
    }
    throw new Error('Could not update document display name')
  },
}

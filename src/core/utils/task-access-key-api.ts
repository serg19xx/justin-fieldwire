import { api } from './api'

export interface TaskAccessKey {
  id: number | null
  task_id: number | null
  project_id: number | null
  contractor_id: number | null
  key_code?: string | null
  expires_at: string | null
  revoked_at: string | null
  is_active: boolean
  last_used_at?: string | null
  created_at?: string | null
}

export interface ContractorPortalWorkspace {
  task: {
    id: number
    project_id: number
    project_name?: string | null
    name: string
    category?: string | null
    address?: string | null
    start_planned?: string | null
    end_planned?: string | null
    start_time?: string | null
    end_time?: string | null
    status?: string | null
    progress_pct: number
    notes?: string | null
    milestone?: string | null
  }
  contractor?: {
    id: number
    name: string
    company?: string | null
    phone?: string | null
    email?: string | null
    trade?: string | null
  } | null
  field_photos: Array<{
    id: number
    work_date?: string | null
    slot?: string | null
    original_name?: string | null
    mime_type?: string | null
    size_bytes?: number | null
    created_at?: string | null
  }>
  key_expires_at?: string | null
}

function unwrapData<T>(body: unknown): T | null {
  if (!body || typeof body !== 'object') return null
  const root = body as Record<string, unknown>
  return (root.data as T) ?? null
}

export async function redeemContractorAccessKey(key: string): Promise<{
  token: string
  user: Record<string, unknown>
  key_expires_at?: string
  expires_at?: string
}> {
  const response = await api.post('/api/v1/auth/contractor-access', { key: key.trim() })
  const data = unwrapData<{
    token: string
    user: Record<string, unknown>
    key_expires_at?: string
    expires_at?: string
  }>(response.data)
  if (!data?.token) {
    throw new Error('Invalid response from access key login')
  }
  return data
}

export async function getTaskAccessKey(
  projectId: number,
  taskId: number,
): Promise<TaskAccessKey | null> {
  const response = await api.get(`/api/v1/projects/${projectId}/tasks/${taskId}/access-key`)
  const data = unwrapData<{ access_key: TaskAccessKey | null }>(response.data)
  return data?.access_key ?? null
}

export async function createTaskAccessKey(
  projectId: number,
  taskId: number,
  options: { expires_days?: number; expires_at?: string } = {},
): Promise<TaskAccessKey> {
  const response = await api.post(`/api/v1/projects/${projectId}/tasks/${taskId}/access-key`, options)
  const data = unwrapData<{ access_key: TaskAccessKey }>(response.data)
  if (!data?.access_key) {
    throw new Error('Failed to create access key')
  }
  return data.access_key
}

export async function revokeTaskAccessKey(projectId: number, taskId: number): Promise<void> {
  await api.post(`/api/v1/projects/${projectId}/tasks/${taskId}/access-key/revoke`)
}

export interface TaskAccessKeySendResult {
  sent: { email: boolean | null; sms: boolean | null }
  channels: { email?: string; phone?: string }
  message: string
}

export async function sendTaskAccessKey(
  projectId: number,
  taskId: number,
): Promise<TaskAccessKeySendResult> {
  const response = await api.post(`/api/v1/projects/${projectId}/tasks/${taskId}/access-key/send`)
  const root = response.data as { message?: string; data?: { sent?: TaskAccessKeySendResult['sent']; channels?: TaskAccessKeySendResult['channels'] } }
  const data = root?.data
  if (!data?.sent) {
    throw new Error(root?.message || 'Failed to send access key')
  }
  return {
    sent: data.sent,
    channels: data.channels || {},
    message: root.message || 'Sent',
  }
}

export async function fetchContractorWorkspace(): Promise<ContractorPortalWorkspace> {
  const response = await api.get('/api/v1/contractor-portal/workspace')
  const data = unwrapData<ContractorPortalWorkspace>(response.data)
  if (!data?.task) {
    throw new Error('Failed to load contractor workspace')
  }
  return data
}

export function contractorFieldPhotoDownloadUrl(photoId: number): string {
  return `/api/v1/contractor-portal/field-photos/${photoId}/download`
}

import { api } from './api'

export type OutreachClientType = 'pharma' | 'physician' | 'pharmacist' | 'medical_clinic'

export type OutreachCampaignStatus = 'draft' | 'running' | 'paused' | 'done' | 'failed'

export type OutreachEmailMode = 'custom' | 'sendgrid_full' | 'sendgrid_body'

export type OutreachRecipientStatus =
  | 'queued'
  | 'sent'
  | 'replied'
  | 'declined'
  | 'unsubscribed'
  | 'no_response'
  | 'failed'
  | 'skipped'

export interface OutreachCampaign {
  id: number
  client_type: OutreachClientType
  name: string | null
  status: OutreachCampaignStatus
  country: string | null
  region: string | null
  category: string | null
  specialty: string | null
  batch_size: number
  wait_hours: number
  email_mode?: OutreachEmailMode
  email_subject?: string | null
  email_body?: string | null
  sendgrid_template_id?: string | null
  sms_body?: string | null
  total_queued: number
  total_sent: number
  total_replied: number
  total_declined: number
  total_unsubscribed: number
  total_no_response: number
  total_failed: number
  total_skipped: number
  started_at: string | null
  finished_at: string | null
  last_error: string | null
  created_at: string | null
  updated_at: string | null
}

export interface OutreachRecipient {
  id: number
  campaign_id: number
  client_type: OutreachClientType
  client_id: number
  client_name: string | null
  channel: 'email' | 'sms'
  destination: string
  status: OutreachRecipientStatus
  batch_no: number | null
  sent_at: string | null
  wait_until: string | null
  responded_at: string | null
  response_note: string | null
  error_message: string | null
  created_at: string | null
  email_subject?: string | null
  email_body?: string | null
  sms_body?: string | null
  email_mode?: string | null
  sendgrid_template_id?: string | null
}

export interface OutreachEvent {
  id: number
  campaign_id: number
  recipient_id: number | null
  source: 'sendgrid' | 'twilio' | 'system' | 'link' | string
  event_type: string
  payload: unknown
  client_name: string | null
  destination: string | null
  channel: string | null
  recipient_status: string | null
  created_at: string | null
}

export interface CreateOutreachCampaignInput {
  client_type: OutreachClientType
  country?: string | null
  region?: string | null
  category?: string | null
  specialty?: string | null
  batch_size?: number
  wait_hours?: number
  name?: string | null
  start?: boolean
  email_mode?: OutreachEmailMode
  email_subject?: string | null
  email_body?: string | null
  sendgrid_template_id?: string | null
  sms_body?: string | null
}

function unwrapData<T>(body: unknown): T | null {
  if (!body || typeof body !== 'object') return null
  const root = body as Record<string, unknown>
  return (root.data as T) ?? null
}

export async function listOutreachCampaigns(
  clientType: OutreachClientType,
): Promise<OutreachCampaign[]> {
  const response = await api.get('/api/v1/outreach/campaigns', {
    params: { client_type: clientType },
  })
  const data = unwrapData<{ campaigns: OutreachCampaign[] }>(response.data)
  return data?.campaigns ?? []
}

export async function getOutreachCampaign(id: number): Promise<OutreachCampaign | null> {
  const response = await api.get(`/api/v1/outreach/campaigns/${id}`)
  const data = unwrapData<{ campaign: OutreachCampaign }>(response.data)
  return data?.campaign ?? null
}

export async function createOutreachCampaign(
  input: CreateOutreachCampaignInput,
): Promise<OutreachCampaign> {
  const response = await api.post('/api/v1/outreach/campaigns', input)
  const data = unwrapData<{ campaign: OutreachCampaign }>(response.data)
  if (!data?.campaign) {
    throw new Error((response.data as { message?: string })?.message || 'Failed to create campaign')
  }
  return data.campaign
}

export async function startOutreachCampaign(id: number): Promise<OutreachCampaign> {
  const response = await api.post(`/api/v1/outreach/campaigns/${id}/start`)
  const data = unwrapData<{ campaign: OutreachCampaign }>(response.data)
  if (!data?.campaign) {
    throw new Error((response.data as { message?: string })?.message || 'Failed to start campaign')
  }
  return data.campaign
}

export async function pauseOutreachCampaign(id: number): Promise<void> {
  await api.post(`/api/v1/outreach/campaigns/${id}/pause`)
}

export async function listOutreachRecipients(
  campaignId: number,
  options: { status?: string; page?: number; limit?: number } = {},
): Promise<{
  recipients: OutreachRecipient[]
  pagination: { page: number; limit: number; total: number; pages: number }
}> {
  const response = await api.get(`/api/v1/outreach/campaigns/${campaignId}/recipients`, {
    params: options,
  })
  const data = unwrapData<{
    recipients: OutreachRecipient[]
    pagination: { page: number; limit: number; total: number; pages: number }
  }>(response.data)
  return {
    recipients: data?.recipients ?? [],
    pagination: data?.pagination ?? { page: 1, limit: 50, total: 0, pages: 1 },
  }
}

export async function listOutreachEvents(
  campaignId: number,
  options: { event_type?: string; page?: number; limit?: number } = {},
): Promise<{
  events: OutreachEvent[]
  pagination: { page: number; limit: number; total: number; pages: number }
}> {
  const response = await api.get(`/api/v1/outreach/campaigns/${campaignId}/events`, {
    params: options,
  })
  const data = unwrapData<{
    events: OutreachEvent[]
    pagination: { page: number; limit: number; total: number; pages: number }
  }>(response.data)
  return {
    events: data?.events ?? [],
    pagination: data?.pagination ?? { page: 1, limit: 50, total: 0, pages: 1 },
  }
}

/**
 * BoldSign e-sign API client (status / send / list).
 * Backend returns configured:false until BOLDSIGN_API_KEY is set on the server.
 */
import { api } from './api'

export interface EsignStatus {
  provider: string
  configured: boolean
  sandbox: boolean
  base_url: string
  has_webhook_secret: boolean
  ready: boolean
  setup_hint?: string | null
  ping?: { ok: boolean; message: string; http_status?: number } | null
}

export interface EsignEnvelope {
  id: number
  project_id: number | null
  boldsign_document_id: string
  title: string
  status: string
  signer_email: string
  signer_name: string | null
  source_file_name: string | null
  completed_at: string | null
  created_at: string | null
}

export interface EsignSendPayload {
  title: string
  signer_name: string
  signer_email: string
  file_base64: string
  file_name?: string
  project_id?: number
  message?: string
}

export const esignApi = {
  async getStatus(): Promise<EsignStatus> {
    const response = await api.get('/api/v1/esign/status')
    return response.data.data
  },

  async listEnvelopes(projectId?: number): Promise<EsignEnvelope[]> {
    const response = await api.get('/api/v1/esign/envelopes', {
      params: projectId && projectId > 0 ? { project_id: projectId } : undefined,
    })
    return response.data.data.envelopes || []
  },

  async getEnvelope(id: number): Promise<{ envelope: EsignEnvelope; boldsign: unknown }> {
    const response = await api.get(`/api/v1/esign/envelopes/${id}`)
    return response.data.data
  },

  async send(payload: EsignSendPayload): Promise<{
    id: number
    boldsign_document_id: string
    status: string
    sandbox: boolean
  }> {
    const response = await api.post('/api/v1/esign/send', payload)
    return response.data.data
  },
}

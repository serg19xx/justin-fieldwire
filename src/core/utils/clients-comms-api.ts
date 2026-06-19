import { api } from './api'

export type ClientCommChannel = 'sms' | 'email' | 'fax'

export interface ClientCommPayload {
  message?: string
  subject?: string
  template_id?: string
  attachment?: File
}

export interface ClientCommResult {
  success: boolean
  message?: string
  sentTo?: string
  originalTo?: string
  testMode?: boolean
  sent?: number
  failed?: number
}

function unwrapData(body: unknown): Record<string, unknown> {
  const root = body as { data?: Record<string, unknown>; message?: string; status?: string }
  return (root?.data as Record<string, unknown>) ?? {}
}

function mapSingleResult(body: unknown): ClientCommResult {
  const root = body as { status?: string; message?: string }
  if (root?.status === 'error') {
    return { success: false, message: root.message ?? 'Send failed' }
  }
  const data = unwrapData(body)
  return {
    success: true,
    message: root.message,
    sentTo: String(data.sent_to ?? ''),
    originalTo: String(data.original_to ?? ''),
    testMode: Boolean(data.test_mode),
  }
}

function mapBulkResult(body: unknown): ClientCommResult {
  const root = body as { status?: string; message?: string }
  if (root?.status === 'error') {
    return { success: false, message: root.message ?? 'Bulk send failed' }
  }
  const data = unwrapData(body)
  return {
    success: true,
    message: root.message,
    sent: Number(data.sent ?? 0),
    failed: Number(data.failed ?? 0),
    testMode: Boolean(data.test_mode),
  }
}

export const clientsCommsApi = {
  async send(
    clientType: string,
    clientId: number,
    channel: ClientCommChannel,
    payload: ClientCommPayload,
  ): Promise<ClientCommResult> {
    const path =
      channel === 'sms'
        ? 'send-sms'
        : channel === 'email'
          ? 'send-email'
          : 'send-fax'

    if (channel === 'fax') {
      const form = new FormData()
      if (payload.message) form.append('message', payload.message)
      if (payload.subject) form.append('subject', payload.subject)
      if (payload.attachment) form.append('attachment', payload.attachment, payload.attachment.name)
      const response = await api.post(
        `/api/v1/clients/${clientType}/${clientId}/${path}`,
        form,
        {
          transformRequest: [
            (data, headers) => {
              if (data instanceof FormData) {
                delete headers['Content-Type']
              }
              return data
            },
          ],
          timeout: 120000,
        },
      )
      return mapSingleResult(response.data)
    }

    const response = await api.post(`/api/v1/clients/${clientType}/${clientId}/${path}`, payload)
    return mapSingleResult(response.data)
  },

  async sendBulk(
    clientType: string,
    channel: 'sms' | 'email',
    ids: number[],
    payload: ClientCommPayload,
  ): Promise<ClientCommResult> {
    const path = channel === 'sms' ? 'send-sms/bulk' : 'send-email/bulk'
    const response = await api.post(`/api/v1/clients/${clientType}/${path}`, {
      ids,
      ...payload,
    })
    return mapBulkResult(response.data)
  },
}

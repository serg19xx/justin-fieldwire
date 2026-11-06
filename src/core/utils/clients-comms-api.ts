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
  /** SMS already delivered with the same text (retry / duplicate phone), not sent again. */
  skipped?: number
}

/** Each bulk request must finish well inside the HTTP timeout, so large selections go in batches. */
const BULK_BATCH_SIZE = 25
const BULK_BATCH_TIMEOUT_MS = 120000

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
    skipped: Number(data.skipped ?? 0),
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
    onProgress?: (processed: number, total: number) => void,
  ): Promise<ClientCommResult> {
    const path = channel === 'sms' ? 'send-sms/bulk' : 'send-email/bulk'
    const total: ClientCommResult = { success: true, sent: 0, failed: 0, skipped: 0, testMode: false }
    onProgress?.(0, ids.length)

    for (let start = 0; start < ids.length; start += BULK_BATCH_SIZE) {
      const batch = ids.slice(start, start + BULK_BATCH_SIZE)
      let result: ClientCommResult
      try {
        const response = await api.post(
          `/api/v1/clients/${clientType}/${path}`,
          { ids: batch, ...payload },
          { timeout: BULK_BATCH_TIMEOUT_MS },
        )
        result = mapBulkResult(response.data)
      } catch (e) {
        const reason = e instanceof Error ? e.message : 'request failed'
        return {
          ...total,
          success: false,
          message: `Stopped after ${start} of ${ids.length} (${reason}). ${total.sent} sent so far.`,
        }
      }
      if (!result.success) {
        return { ...total, success: false, message: result.message }
      }
      total.sent = (total.sent ?? 0) + (result.sent ?? 0)
      total.failed = (total.failed ?? 0) + (result.failed ?? 0)
      total.skipped = (total.skipped ?? 0) + (result.skipped ?? 0)
      total.testMode = total.testMode || result.testMode
      onProgress?.(Math.min(start + batch.length, ids.length), ids.length)
    }

    return total
  },
}

import { api } from './api'

export interface MeetingInvitePayload {
  meeting_date: string
  slots: [string, string, string]
  duration_minutes?: number
  title?: string
  timezone?: string
}

export interface MeetingInviteRecord {
  id: number
  status: 'pending' | 'confirmed' | 'expired' | 'cancelled'
  meeting_date: string
  slot1_time: string
  slot2_time: string
  slot3_time: string
  duration_minutes: number
  meeting_title: string
  selected_slot: number | null
  calendar_event_id: number | null
  confirmed_at: string | null
  expires_at: string
  created_at: string
}

export interface MeetingInviteSendResult {
  success: boolean
  message?: string
  inviteId?: number
  sentTo?: string
  originalTo?: string
  testMode?: boolean
}

export const clientsMeetingInviteApi = {
  async send(
    clientType: string,
    clientId: number,
    payload: MeetingInvitePayload,
  ): Promise<MeetingInviteSendResult> {
    const response = await api.post(
      `/api/v1/clients/${clientType}/${clientId}/send-meeting-invite`,
      payload,
    )
    const root = response.data as {
      status?: string
      message?: string
      data?: {
        invite_id?: number
        sent_to?: string
        original_to?: string
        test_mode?: boolean
      }
    }
    if (root.status === 'error') {
      return { success: false, message: root.message ?? 'Send failed' }
    }
    const data = root.data ?? {}
    return {
      success: true,
      message: root.message,
      inviteId: data.invite_id,
      sentTo: data.sent_to,
      originalTo: data.original_to,
      testMode: data.test_mode,
    }
  },

  async getLatest(clientType: string, clientId: number): Promise<MeetingInviteRecord | null> {
    const response = await api.get(
      `/api/v1/clients/${clientType}/${clientId}/meeting-invite/latest`,
    )
    const root = response.data as { data?: { invite?: MeetingInviteRecord | null } }
    return root.data?.invite ?? null
  },
}

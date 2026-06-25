import { api } from './api'

export interface MeetingInviteSlot {
  date: string
  time: string
  label: string
}

export interface DayScheduleSlot {
  time: string
  available: boolean
  reason: string | null
}

export interface MeetingInvitePayload {
  meeting_date: string
  slots: string[]
  duration_minutes?: number
  title?: string
  timezone?: string
}

export interface MeetingInviteRecord {
  id: number
  status: 'pending' | 'confirmed' | 'expired' | 'cancelled'
  meeting_date: string
  slot1_date?: string
  slot2_date?: string
  slot3_date?: string
  slot1_time: string
  slot2_time: string | null
  slot3_time: string | null
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
  slots?: MeetingInviteSlot[]
}

export interface DayScheduleResult {
  success: boolean
  message?: string
  date: string
  minDate: string
  durationMinutes: number
  timezone: string
  holdDays: number
  schedule: DayScheduleSlot[]
  availableCount: number
}

function addDaysIso(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export const clientsMeetingInviteApi = {
  getDefaultMeetingDate(): string {
    return addDaysIso(3)
  },

  getMinMeetingDate(): string {
    return addDaysIso(3)
  },

  async getDaySchedule(
    date: string,
    durationMinutes = 30,
    timezone = 'America/Toronto',
  ): Promise<DayScheduleResult> {
    const response = await api.get('/api/v1/meeting-invite/day-schedule', {
      params: { date, duration_minutes: durationMinutes, timezone },
    })
    const root = response.data as {
      status?: string
      message?: string
      data?: {
        date?: string
        min_date?: string
        duration_minutes?: number
        timezone?: string
        hold_days?: number
        schedule?: DayScheduleSlot[]
        available_count?: number
      }
    }
    if (root.status === 'error') {
      return {
        success: false,
        message: root.message ?? 'Failed to load schedule',
        date,
        minDate: addDaysIso(3),
        durationMinutes,
        timezone,
        holdDays: 3,
        schedule: [],
        availableCount: 0,
      }
    }
    const data = root.data ?? {}
    return {
      success: true,
      date: data.date ?? date,
      minDate: data.min_date ?? addDaysIso(3),
      durationMinutes: data.duration_minutes ?? durationMinutes,
      timezone: data.timezone ?? timezone,
      holdDays: data.hold_days ?? 3,
      schedule: data.schedule ?? [],
      availableCount: data.available_count ?? 0,
    }
  },

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
        slots?: MeetingInviteSlot[]
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
      slots: data.slots,
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

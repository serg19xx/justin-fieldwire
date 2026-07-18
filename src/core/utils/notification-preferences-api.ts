import { api } from './api'

export interface NotificationPreferences {
  outbound_enabled: boolean
  email_enabled: boolean
  sms_enabled: boolean
  push_enabled: boolean
  field_work_start_enabled: boolean
  field_work_end_enabled: boolean
}

export type NotificationChannel = 'email' | 'sms' | 'push'

export interface NotificationEventPreference {
  event_type: string
  label: string
  description: string
  severity: 'critical' | 'important'
  allowed_channels: NotificationChannel[]
  email_enabled: boolean
  sms_enabled: boolean
  push_enabled: boolean
}

const DEFAULT_PREFS: NotificationPreferences = {
  outbound_enabled: true,
  email_enabled: true,
  sms_enabled: true,
  push_enabled: true,
  field_work_start_enabled: true,
  field_work_end_enabled: true,
}

function parsePreferences(payload: unknown): NotificationPreferences {
  const body = payload as Record<string, unknown> | null
  const data = ((body?.data as Record<string, unknown> | undefined) ?? body ?? {}) as Record<
    string,
    unknown
  >

  return {
    outbound_enabled:
      typeof data.outbound_enabled === 'boolean'
        ? data.outbound_enabled
        : typeof data.notifications_enabled === 'boolean'
          ? data.notifications_enabled
          : DEFAULT_PREFS.outbound_enabled,
    email_enabled:
      typeof data.email_enabled === 'boolean' ? data.email_enabled : DEFAULT_PREFS.email_enabled,
    sms_enabled: typeof data.sms_enabled === 'boolean' ? data.sms_enabled : DEFAULT_PREFS.sms_enabled,
    push_enabled:
      typeof data.push_enabled === 'boolean' ? data.push_enabled : DEFAULT_PREFS.push_enabled,
    field_work_start_enabled:
      typeof data.field_work_start_enabled === 'boolean'
        ? data.field_work_start_enabled
        : DEFAULT_PREFS.field_work_start_enabled,
    field_work_end_enabled:
      typeof data.field_work_end_enabled === 'boolean'
        ? data.field_work_end_enabled
        : DEFAULT_PREFS.field_work_end_enabled,
  }
}

export async function fetchNotificationPreferences(): Promise<NotificationPreferences> {
  const res = await api.get('/api/v1/me/notification-preferences')
  return parsePreferences(res.data)
}

export async function updateNotificationPreferences(
  patch: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
  const res = await api.patch('/api/v1/me/notification-preferences', patch)
  return parsePreferences(res.data)
}

export async function fetchNotificationEventPreferences(): Promise<
  NotificationEventPreference[]
> {
  const res = await api.get('/api/v1/me/notification-preferences/events')
  const body = res.data as Record<string, unknown>
  const data = (body.data as Record<string, unknown> | undefined) ?? body
  return Array.isArray(data.events) ? (data.events as NotificationEventPreference[]) : []
}

export async function updateNotificationEventPreference(
  eventType: string,
  patch: Partial<
    Pick<NotificationEventPreference, 'email_enabled' | 'sms_enabled' | 'push_enabled'>
  >,
): Promise<NotificationEventPreference> {
  const res = await api.patch(
    `/api/v1/me/notification-preferences/events/${encodeURIComponent(eventType)}`,
    patch,
  )
  const body = res.data as Record<string, unknown>
  return ((body.data as NotificationEventPreference | undefined) ?? body) as NotificationEventPreference
}

/** @deprecated Use fetchNotificationPreferences */
export async function fetchOutboundNotificationsEnabled(_userId: number): Promise<boolean> {
  try {
    const prefs = await fetchNotificationPreferences()
    return prefs.outbound_enabled
  } catch {
    return true
  }
}

/** @deprecated Use updateNotificationPreferences */
export async function setOutboundNotificationsEnabled(
  _userId: number,
  enabled: boolean,
): Promise<void> {
  await updateNotificationPreferences({ outbound_enabled: enabled })
}

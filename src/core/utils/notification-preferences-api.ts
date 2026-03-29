import { api } from './api'

const LS_KEY_PREFIX = 'fieldwire_notif_outbound_'

export function notificationOutboundStorageKey(userId: number): string {
  return `${LS_KEY_PREFIX}${userId}`
}

export async function fetchOutboundNotificationsEnabled(userId: number): Promise<boolean> {
  try {
    const res = await api.get('/api/v1/me/notification-preferences')
    const body = res.data as Record<string, unknown>
    const data = (body?.data as Record<string, unknown> | undefined) ?? body
    if (typeof data?.outbound_enabled === 'boolean') return data.outbound_enabled
    if (typeof data?.notifications_enabled === 'boolean') return data.notifications_enabled
  } catch {
    /* local */
  }
  try {
    const raw = localStorage.getItem(notificationOutboundStorageKey(userId))
    if (raw === '0') return false
    if (raw === '1') return true
  } catch {
    /* ignore */
  }
  return true
}

export async function setOutboundNotificationsEnabled(
  userId: number,
  enabled: boolean,
): Promise<void> {
  try {
    localStorage.setItem(notificationOutboundStorageKey(userId), enabled ? '1' : '0')
  } catch {
    /* ignore */
  }
  try {
    await api.patch('/api/v1/me/notification-preferences', {
      outbound_enabled: enabled,
    })
  } catch {
    /* local-only */
  }
}

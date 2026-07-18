import { api } from './api'
import type { BrowserPushSubscriptionPayload } from './web-push'

export async function savePushSubscription(payload: BrowserPushSubscriptionPayload): Promise<void> {
  await api.post('/api/v1/me/push-subscriptions', payload)
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  await api.delete('/api/v1/me/push-subscriptions', { data: { endpoint } })
}

export async function sendTestPushNotification(): Promise<void> {
  await api.post('/api/v1/me/push-subscriptions/test')
}

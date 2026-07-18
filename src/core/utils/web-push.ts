export type PushSupportState = 'unsupported' | 'denied' | 'default' | 'granted'

export interface BrowserPushSubscriptionPayload {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function arrayBufferToBase64Url(buffer: ArrayBuffer | null): string {
  if (!buffer) return ''
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return window
    .btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export function isWebPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isWebPushSupported()) return 'unsupported'
  return Notification.permission
}

export function getPushSupportState(): PushSupportState {
  const permission = getNotificationPermission()
  if (permission === 'unsupported') return 'unsupported'
  if (permission === 'denied') return 'denied'
  if (permission === 'granted') return 'granted'
  return 'default'
}

export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported in this browser')
  }
  const existing = await navigator.serviceWorker.getRegistration()
  if (existing) {
    await navigator.serviceWorker.ready
    return existing
  }
  return navigator.serviceWorker.ready
}

export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (!isWebPushSupported()) return null
  const registration = await getServiceWorkerRegistration()
  return registration.pushManager.getSubscription()
}

export function serializePushSubscription(
  subscription: PushSubscription,
): BrowserPushSubscriptionPayload {
  const json = subscription.toJSON()
  const p256dh = json.keys?.p256dh || arrayBufferToBase64Url(subscription.getKey('p256dh'))
  const auth = json.keys?.auth || arrayBufferToBase64Url(subscription.getKey('auth'))
  if (!json.endpoint || !p256dh || !auth) {
    throw new Error('Incomplete push subscription keys')
  }
  return {
    endpoint: json.endpoint,
    keys: { p256dh, auth },
  }
}

export async function subscribeToWebPush(): Promise<BrowserPushSubscriptionPayload> {
  if (!isWebPushSupported()) {
    throw new Error('Web Push is not supported in this browser')
  }

  const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
  if (!publicKey) {
    throw new Error('VITE_VAPID_PUBLIC_KEY is not configured')
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted')
  }

  const registration = await getServiceWorkerRegistration()
  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    })
  }

  return serializePushSubscription(subscription)
}

export async function unsubscribeFromWebPush(): Promise<string | null> {
  const subscription = await getCurrentPushSubscription()
  if (!subscription) return null
  const endpoint = subscription.endpoint
  await subscription.unsubscribe()
  return endpoint
}

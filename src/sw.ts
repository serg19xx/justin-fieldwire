/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

declare let self: ServiceWorkerGlobalScope

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
clientsClaim()

try {
  registerRoute(
    new NavigationRoute(createHandlerBoundToURL('/index.html'), {
      denylist: [/^\/api\//],
    }),
  )
} catch {
  // createHandlerBoundToURL may fail outside a full Vite PWA build
}

interface PushPayload {
  title?: string
  body?: string
  url?: string
}

self.addEventListener('push', (event) => {
  let payload: PushPayload = {
    title: 'FieldWire',
    body: 'You have a new notification',
    url: '/',
  }

  try {
    if (event.data) {
      const parsed = event.data.json() as PushPayload
      payload = { ...payload, ...parsed }
    }
  } catch {
    try {
      const text = event.data?.text()
      if (text) payload.body = text
    } catch {
      /* keep defaults */
    }
  }

  const title = payload.title || 'FieldWire'
  const options: NotificationOptions = {
    body: payload.body || 'You have a new notification',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: payload.url || '/' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = (event.notification.data?.url as string | undefined) || '/'

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of allClients) {
        if ('focus' in client) {
          await client.focus()
          if ('navigate' in client) {
            await (client as WindowClient).navigate(targetUrl)
          }
          return
        }
      }
      await self.clients.openWindow(targetUrl)
    })(),
  )
})

/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { NetworkFirst, NetworkOnly } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare let self: ServiceWorkerGlobalScope

// Required with injectManifest + autoUpdate: activate this SW immediately after install.
self.skipWaiting()
clientsClaim()

/**
 * Precache only the SPA shell (see vite.config injectManifest.globPatterns).
 * Hashed /assets/* chunks must NOT be precached — a stale Workbox entry after
 * deploy causes "ServiceWorker intercepted … unexpected error" on lazy imports.
 */
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// Hashed build chunks: always go to the network (browser HTTP cache still applies).
registerRoute(
  ({ url }) => url.pathname.startsWith('/assets/'),
  new NetworkOnly(),
)

/**
 * SPA navigations must prefer the network after deploy.
 * Cache-only (createHandlerBoundToURL) kept serving a stale index.html after FTP
 * uploads — hard refresh showed the new app, normal reload showed the old one.
 */
try {
  registerRoute(
    new NavigationRoute(
      new NetworkFirst({
        cacheName: 'fw-spa-navigations',
        networkTimeoutSeconds: 4,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 16,
            maxAgeSeconds: 24 * 60 * 60,
          }),
        ],
      }),
      {
        denylist: [/^\/api\//],
      },
    ),
  )
} catch {
  // NavigationRoute may fail outside a full Vite PWA build
}

/** Drop leftover Workbox / runtime caches from older SW versions. */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      cleanupOutdatedCaches()
      const keep = new Set(['fw-spa-navigations'])
      const keys = await caches.keys()
      await Promise.all(
        keys.map(async (key) => {
          // Keep current precache (workbox-precache-v2-*) and navigation cache.
          if (keep.has(key) || key.startsWith('workbox-precache')) return
          await caches.delete(key)
        }),
      )
    })(),
  )
})

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

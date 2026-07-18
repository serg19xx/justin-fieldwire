<template>
  <div class="border-t border-gray-200 pt-6 mt-6">
    <h3 class="text-lg font-medium text-gray-900 mb-2">Device notifications</h3>
    <p class="text-sm text-gray-600 mb-4">
      Receive FieldWire alerts in your phone or browser notification tray, even when the app is in
      the background.
    </p>

    <div v-if="state === 'unsupported'" class="rounded-md bg-amber-50 border border-amber-200 p-3">
      <p class="text-sm text-amber-800">
        Web Push is not supported in this browser. On iPhone, add FieldWire to the Home Screen first,
        then open it from the icon and enable notifications here.
      </p>
    </div>

    <div v-else class="space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p class="text-sm font-medium text-gray-900">Push notifications</p>
          <p class="text-xs text-gray-500 mt-0.5">{{ statusLabel }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-if="!isEnabled"
            type="button"
            :disabled="busy || state === 'denied'"
            class="px-3 py-1.5 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="enable"
          >
            Enable
          </button>
          <button
            v-else
            type="button"
            :disabled="busy"
            class="px-3 py-1.5 text-sm font-medium rounded-md text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
            @click="disable"
          >
            Disable
          </button>
          <button
            type="button"
            :disabled="busy || !isEnabled"
            class="px-3 py-1.5 text-sm font-medium rounded-md text-blue-700 border border-blue-300 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="sendTest"
          >
            Send test
          </button>
        </div>
      </div>

      <p v-if="state === 'denied'" class="text-sm text-red-600">
        Notifications are blocked in browser settings. Allow them for this site, then try Enable
        again.
      </p>
      <p v-else class="text-xs text-gray-500">
        On iPhone: Share → Add to Home Screen, open the installed app, then tap Enable.
      </p>
      <p v-if="message" class="text-sm" :class="messageIsError ? 'text-red-600' : 'text-green-700'">
        {{ message }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  deletePushSubscription,
  savePushSubscription,
  sendTestPushNotification,
} from '@/core/utils/push-subscriptions-api'
import {
  getCurrentPushSubscription,
  getPushSupportState,
  subscribeToWebPush,
  unsubscribeFromWebPush,
  type PushSupportState,
} from '@/core/utils/web-push'

const state = ref<PushSupportState>('unsupported')
const isEnabled = ref(false)
const busy = ref(false)
const message = ref('')
const messageIsError = ref(false)

const statusLabel = computed(() => {
  if (state.value === 'denied') return 'Blocked by the browser'
  if (isEnabled.value) return 'Enabled on this device'
  return 'Not enabled on this device'
})

async function refresh() {
  state.value = getPushSupportState()
  if (state.value === 'unsupported') {
    isEnabled.value = false
    return
  }
  try {
    const subscription = await getCurrentPushSubscription()
    isEnabled.value = Boolean(subscription) && state.value === 'granted'
  } catch {
    isEnabled.value = false
  }
}

function setMessage(text: string, isError = false) {
  message.value = text
  messageIsError.value = isError
}

async function enable() {
  busy.value = true
  setMessage('')
  try {
    const payload = await subscribeToWebPush()
    await savePushSubscription(payload)
    await refresh()
    setMessage('Push notifications enabled on this device.')
  } catch (error) {
    await refresh()
    setMessage(error instanceof Error ? error.message : 'Failed to enable push notifications', true)
  } finally {
    busy.value = false
  }
}

async function disable() {
  busy.value = true
  setMessage('')
  try {
    const endpoint = await unsubscribeFromWebPush()
    if (endpoint) {
      await deletePushSubscription(endpoint)
    }
    await refresh()
    setMessage('Push notifications disabled on this device.')
  } catch (error) {
    await refresh()
    setMessage(error instanceof Error ? error.message : 'Failed to disable push notifications', true)
  } finally {
    busy.value = false
  }
}

async function sendTest() {
  busy.value = true
  setMessage('')
  try {
    await sendTestPushNotification()
    setMessage('Test notification sent. Check your notification tray.')
  } catch (error) {
    setMessage(error instanceof Error ? error.message : 'Failed to send test notification', true)
  } finally {
    busy.value = false
  }
}

onMounted(() => {
  void refresh()
})
</script>

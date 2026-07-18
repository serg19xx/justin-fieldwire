<template>
  <div class="border-t border-gray-200 pt-6 mt-6">
    <h3 class="text-lg font-medium text-gray-900 mb-2">Notification channels</h3>
    <p class="text-sm text-gray-600 mb-4">
      Email and SMS are the main channels. Push is a short alert (for example: “a report was sent to
      your email”) or a duplicate of urgent SMS.
    </p>

    <div v-if="!hydrated" class="text-sm text-gray-500">Loading…</div>
    <div v-else class="space-y-4">
      <div class="flex items-center justify-between gap-4">
        <div>
          <p class="text-sm font-medium text-gray-900">Outbound notifications</p>
          <p class="text-xs text-gray-500 mt-0.5">
            Master switch for email, SMS, and push (except security messages).
          </p>
        </div>
        <button
          type="button"
          :disabled="saving"
          class="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          :class="outboundEnabled ? 'bg-blue-600' : 'bg-gray-200'"
          @click="toggle('outbound_enabled', !outboundEnabled)"
        >
          <span
            class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
            :class="outboundEnabled ? 'translate-x-6' : 'translate-x-1'"
          />
        </button>
      </div>

      <div class="rounded-md border border-gray-200 divide-y divide-gray-100" :class="{ 'opacity-50': !outboundEnabled }">
        <label class="flex items-center justify-between gap-4 px-3 py-3">
          <span>
            <span class="block text-sm font-medium text-gray-900">Email</span>
            <span class="block text-xs text-gray-500">Full messages and reports</span>
          </span>
          <input
            type="checkbox"
            class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            :checked="emailEnabled"
            :disabled="saving || !outboundEnabled"
            @change="toggle('email_enabled', ($event.target as HTMLInputElement).checked)"
          />
        </label>
        <label class="flex items-center justify-between gap-4 px-3 py-3">
          <span>
            <span class="block text-sm font-medium text-gray-900">SMS</span>
            <span class="block text-xs text-gray-500">Urgent short messages</span>
          </span>
          <input
            type="checkbox"
            class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            :checked="smsEnabled"
            :disabled="saving || !outboundEnabled"
            @change="toggle('sms_enabled', ($event.target as HTMLInputElement).checked)"
          />
        </label>
        <label class="flex items-center justify-between gap-4 px-3 py-3">
          <span>
            <span class="block text-sm font-medium text-gray-900">Push</span>
            <span class="block text-xs text-gray-500">Device alerts (enable device below)</span>
          </span>
          <input
            type="checkbox"
            class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            :checked="pushEnabled"
            :disabled="saving || !outboundEnabled"
            @change="toggle('push_enabled', ($event.target as HTMLInputElement).checked)"
          />
        </label>
      </div>

      <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useNotificationPreferencesStore } from '@/core/stores/notification-preferences'
import type { NotificationPreferences } from '@/core/utils/notification-preferences-api'

const prefStore = useNotificationPreferencesStore()
const {
  outboundEnabled,
  emailEnabled,
  smsEnabled,
  pushEnabled,
  hydrated,
  errorMessage,
} = storeToRefs(prefStore)
const saving = ref(false)

onMounted(async () => {
  await prefStore.hydrate()
})

async function toggle(key: keyof NotificationPreferences, value: boolean) {
  saving.value = true
  try {
    await prefStore.patch({ [key]: value })
  } catch {
    /* store already rolled back and set errorMessage */
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="border-t border-gray-200 pt-6 mt-6">
    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
      <div>
        <h3 class="text-lg font-medium text-gray-900">Events</h3>
        <p class="text-sm text-gray-600 mt-1">
          Choose only the events you need. New events are off by default and appear here only after
          an administrator enables them.
        </p>
      </div>
      <button
        type="button"
        class="self-start text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
        :disabled="isLoading"
        @click="load"
      >
        Refresh
      </button>
    </div>

    <div v-if="isLoading" class="text-sm text-gray-500 py-4">Loading events…</div>
    <div
      v-else-if="errorMessage"
      class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
    >
      {{ errorMessage }}
    </div>
    <div
      v-else-if="events.length === 0"
      class="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600"
    >
      No events are available for your role yet. When an administrator enables an event for
      field users, it will appear here — off by default until you turn it on.
    </div>
    <div v-else class="overflow-hidden rounded-md border border-gray-200">
      <div
        v-for="event in events"
        :key="event.event_type"
        class="border-b border-gray-100 p-4 last:border-b-0"
      >
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <p class="text-sm font-medium text-gray-900">{{ event.label }}</p>
              <span
                class="rounded-full px-2 py-0.5 text-xs"
                :class="
                  event.severity === 'critical'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'
                "
              >
                {{ event.severity }}
              </span>
            </div>
            <p v-if="event.description" class="mt-1 text-xs text-gray-500">
              {{ event.description }}
            </p>
            <p class="mt-1 text-xs text-gray-400">{{ event.event_type }}</p>
          </div>

          <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
            <label
              v-for="channel in event.allowed_channels"
              :key="channel"
              class="inline-flex items-center gap-2 text-sm text-gray-700"
            >
              <input
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                :checked="isChannelEnabled(event, channel)"
                :disabled="savingKey === `${event.event_type}:${channel}`"
                @change="
                  updateChannel(
                    event,
                    channel,
                    ($event.target as HTMLInputElement).checked,
                  )
                "
              />
              {{ channelLabel(channel) }}
            </label>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  fetchNotificationEventPreferences,
  updateNotificationEventPreference,
  type NotificationChannel,
  type NotificationEventPreference,
} from '@/core/utils/notification-preferences-api'

const events = ref<NotificationEventPreference[]>([])
const isLoading = ref(true)
const savingKey = ref('')
const errorMessage = ref('')

function channelField(
  channel: NotificationChannel,
): 'email_enabled' | 'sms_enabled' | 'push_enabled' {
  return `${channel}_enabled`
}

function isChannelEnabled(
  event: NotificationEventPreference,
  channel: NotificationChannel,
): boolean {
  return event[channelField(channel)]
}

function channelLabel(channel: NotificationChannel): string {
  return channel === 'sms' ? 'SMS' : channel.charAt(0).toUpperCase() + channel.slice(1)
}

async function load() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    events.value = await fetchNotificationEventPreferences()
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Failed to load notification events'
  } finally {
    isLoading.value = false
  }
}

async function updateChannel(
  event: NotificationEventPreference,
  channel: NotificationChannel,
  enabled: boolean,
) {
  const field = channelField(channel)
  const previous = event[field]
  event[field] = enabled
  savingKey.value = `${event.event_type}:${channel}`
  errorMessage.value = ''

  try {
    const updated = await updateNotificationEventPreference(event.event_type, {
      [field]: enabled,
    })
    const index = events.value.findIndex((item) => item.event_type === event.event_type)
    if (index >= 0) events.value[index] = updated
  } catch (error) {
    event[field] = previous
    errorMessage.value =
      error instanceof Error ? error.message : 'Failed to update event preference'
  } finally {
    savingKey.value = ''
  }
}

onMounted(() => {
  void load()
})
</script>

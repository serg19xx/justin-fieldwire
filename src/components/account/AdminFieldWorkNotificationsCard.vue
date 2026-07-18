<template>
  <div class="border-t border-gray-200 pt-6 mt-6">
    <h3 class="text-lg font-medium text-gray-900 mb-2">Field work updates</h3>
    <p class="text-sm text-gray-600 mb-4">
      Workers and contractors can send you email and SMS when they record work start or end. You can
      mute these. If they mark a send as Urgent, you still receive a push alert even when muted.
      Other automatic events are controlled in Admin Settings → Event Rules.
    </p>

    <div v-if="!hydrated" class="text-sm text-gray-500">Loading…</div>
    <div v-else class="rounded-md border border-gray-200 divide-y divide-gray-100">
      <label class="flex items-center justify-between gap-4 px-3 py-3">
        <span>
          <span class="block text-sm font-medium text-gray-900">Work start</span>
          <span class="block text-xs text-gray-500">Email / SMS when field work starts</span>
        </span>
        <input
          type="checkbox"
          class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          :checked="fieldWorkStartEnabled"
          :disabled="saving"
          @change="toggle('field_work_start_enabled', ($event.target as HTMLInputElement).checked)"
        />
      </label>
      <label class="flex items-center justify-between gap-4 px-3 py-3">
        <span>
          <span class="block text-sm font-medium text-gray-900">Work end</span>
          <span class="block text-xs text-gray-500">Email / SMS when field work ends</span>
        </span>
        <input
          type="checkbox"
          class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          :checked="fieldWorkEndEnabled"
          :disabled="saving"
          @change="toggle('field_work_end_enabled', ($event.target as HTMLInputElement).checked)"
        />
      </label>
    </div>

    <p v-if="errorMessage" class="mt-3 text-sm text-red-600">{{ errorMessage }}</p>

    <p class="mt-4 text-sm text-gray-600">
      Configure other system events in
      <router-link to="/admin-settings" class="font-medium text-blue-700 underline">
        Admin Settings → Event Rules
      </router-link>
      .
    </p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from '@/core/utils/notification-preferences-api'

const hydrated = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const fieldWorkStartEnabled = ref(true)
const fieldWorkEndEnabled = ref(true)

async function load(): Promise<void> {
  errorMessage.value = ''
  try {
    const prefs = await fetchNotificationPreferences()
    fieldWorkStartEnabled.value = prefs.field_work_start_enabled
    fieldWorkEndEnabled.value = prefs.field_work_end_enabled
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Failed to load notification preferences'
  } finally {
    hydrated.value = true
  }
}

async function toggle(
  key: 'field_work_start_enabled' | 'field_work_end_enabled',
  value: boolean,
): Promise<void> {
  const previousStart = fieldWorkStartEnabled.value
  const previousEnd = fieldWorkEndEnabled.value
  if (key === 'field_work_start_enabled') fieldWorkStartEnabled.value = value
  else fieldWorkEndEnabled.value = value

  saving.value = true
  errorMessage.value = ''
  try {
    const prefs = await updateNotificationPreferences({ [key]: value })
    fieldWorkStartEnabled.value = prefs.field_work_start_enabled
    fieldWorkEndEnabled.value = prefs.field_work_end_enabled
  } catch (error) {
    fieldWorkStartEnabled.value = previousStart
    fieldWorkEndEnabled.value = previousEnd
    errorMessage.value =
      error instanceof Error ? error.message : 'Failed to save notification preferences'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  void load()
})
</script>

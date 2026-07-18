import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from '@/core/utils/notification-preferences-api'

const DEFAULTS: NotificationPreferences = {
  outbound_enabled: true,
  email_enabled: true,
  sms_enabled: true,
  push_enabled: true,
  field_work_start_enabled: true,
  field_work_end_enabled: true,
}

export const useNotificationPreferencesStore = defineStore('notificationPreferences', () => {
  const outboundEnabled = ref(true)
  const emailEnabled = ref(true)
  const smsEnabled = ref(true)
  const pushEnabled = ref(true)
  const fieldWorkStartEnabled = ref(true)
  const fieldWorkEndEnabled = ref(true)
  const hydrated = ref(false)
  const errorMessage = ref('')

  function apply(prefs: NotificationPreferences) {
    outboundEnabled.value = prefs.outbound_enabled
    emailEnabled.value = prefs.email_enabled
    smsEnabled.value = prefs.sms_enabled
    pushEnabled.value = prefs.push_enabled
    fieldWorkStartEnabled.value = prefs.field_work_start_enabled
    fieldWorkEndEnabled.value = prefs.field_work_end_enabled
  }

  function snapshot(): NotificationPreferences {
    return {
      outbound_enabled: outboundEnabled.value,
      email_enabled: emailEnabled.value,
      sms_enabled: smsEnabled.value,
      push_enabled: pushEnabled.value,
      field_work_start_enabled: fieldWorkStartEnabled.value,
      field_work_end_enabled: fieldWorkEndEnabled.value,
    }
  }

  async function hydrate(_userId?: number) {
    errorMessage.value = ''
    try {
      apply(await fetchNotificationPreferences())
    } catch (error) {
      apply(DEFAULTS)
      errorMessage.value =
        error instanceof Error ? error.message : 'Failed to load notification preferences'
    } finally {
      hydrated.value = true
    }
  }

  async function patch(partial: Partial<NotificationPreferences>) {
    const previous = snapshot()
    apply({ ...previous, ...partial })
    errorMessage.value = ''
    try {
      apply(await updateNotificationPreferences(partial))
    } catch (error) {
      apply(previous)
      errorMessage.value =
        error instanceof Error ? error.message : 'Failed to save notification preferences'
      throw error
    }
  }

  async function setOutbound(_userId: number, enabled: boolean) {
    await patch({ outbound_enabled: enabled })
  }

  return {
    outboundEnabled,
    emailEnabled,
    smsEnabled,
    pushEnabled,
    fieldWorkStartEnabled,
    fieldWorkEndEnabled,
    hydrated,
    errorMessage,
    hydrate,
    patch,
    setOutbound,
  }
})

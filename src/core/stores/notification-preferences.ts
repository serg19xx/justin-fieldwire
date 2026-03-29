import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  fetchOutboundNotificationsEnabled,
  setOutboundNotificationsEnabled,
} from '@/core/utils/notification-preferences-api'

export const useNotificationPreferencesStore = defineStore('notificationPreferences', () => {
  const outboundEnabled = ref(true)
  const hydrated = ref(false)

  async function hydrate(userId: number) {
    outboundEnabled.value = await fetchOutboundNotificationsEnabled(userId)
    hydrated.value = true
  }

  async function setOutbound(userId: number, enabled: boolean) {
    outboundEnabled.value = enabled
    await setOutboundNotificationsEnabled(userId, enabled)
  }

  return { outboundEnabled, hydrated, hydrate, setOutbound }
})

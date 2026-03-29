<template>
  <div class="border-t border-gray-200 pt-6 mt-6">
    <h3 class="text-lg font-medium text-gray-900 mb-2">Field notifications</h3>
    <p class="text-sm text-gray-600 mb-4">
      Control email and text-style digests (schedule summaries, aggregated task reminders). Per-task spam is
      avoided by design; disabling stops outbound email/SMS/push when the server honors this flag.
    </p>
    <div v-if="!hydrated" class="text-sm text-gray-500">Loading…</div>
    <div v-else class="flex items-center justify-between gap-4">
      <div>
        <p class="text-sm font-medium text-gray-900">Outbound notifications</p>
        <p class="text-xs text-gray-500 mt-0.5">
          {{
            outboundEnabled
              ? 'You may receive digests and reminders on enabled channels.'
              : 'No outbound notifications (server must enforce when implemented).'
          }}
        </p>
      </div>
      <button
        type="button"
        :disabled="saving"
        class="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        :class="outboundEnabled ? 'bg-blue-600' : 'bg-gray-200'"
        @click="toggle"
      >
        <span
          class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
          :class="outboundEnabled ? 'translate-x-6' : 'translate-x-1'"
        />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/core/stores/auth'
import { useNotificationPreferencesStore } from '@/core/stores/notification-preferences'
import { resolveSessionUserId } from '@/core/utils/session-user-id'

const authStore = useAuthStore()
const prefStore = useNotificationPreferencesStore()
const { outboundEnabled, hydrated } = storeToRefs(prefStore)
const saving = ref(false)

const userId = computed(() => resolveSessionUserId(authStore.currentUser))

onMounted(async () => {
  const uid = userId.value
  if (uid == null) return
  await prefStore.hydrate(uid)
})

async function toggle() {
  const uid = userId.value
  if (uid == null) return
  saving.value = true
  try {
    await prefStore.setOutbound(uid, !outboundEnabled.value)
  } finally {
    saving.value = false
  }
}
</script>

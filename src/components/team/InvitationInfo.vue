<script setup lang="ts">
import { computed } from 'vue'
import type { WorkerUser } from '@/core/utils/hr-api'
import {
  formatInvitationDate,
  getEffectiveInvitationStatus,
} from '@/core/utils/invitation-status'

const props = defineProps<{
  worker: Pick<
    WorkerUser,
    'invitation_status' | 'invitation_sent_at' | 'invitation_expires_at' | 'invitation_is_expired'
  >
}>()

const status = computed(() => getEffectiveInvitationStatus(props.worker))
const isExpired = computed(() => status.value === 'expired')
</script>

<template>
  <div v-if="status !== 'registered'" class="flex flex-col items-start gap-1">
    <span
      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
      :class="isExpired ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'"
    >
      {{ isExpired ? 'Expired' : 'Invited' }}
    </span>
    <span class="text-xs text-gray-500">
      Sent {{ formatInvitationDate(worker.invitation_sent_at) }}
    </span>
    <span class="text-xs" :class="isExpired ? 'text-red-600 font-medium' : 'text-gray-500'">
      {{ isExpired ? 'Expired' : 'Expires' }} {{ formatInvitationDate(worker.invitation_expires_at) }}
    </span>
  </div>
</template>

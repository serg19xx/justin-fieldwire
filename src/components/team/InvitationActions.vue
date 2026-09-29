<script setup lang="ts">
import { computed, ref } from 'vue'
import { hrResourcesApi, type WorkerUser } from '@/core/utils/hr-api'
import { getEffectiveInvitationStatus } from '@/core/utils/invitation-status'

const props = withDefaults(
  defineProps<{
    worker: Pick<
      WorkerUser,
      | 'id'
      | 'email'
      | 'first_name'
      | 'last_name'
      | 'invitation_status'
      | 'invitation_expires_at'
      | 'invitation_is_expired'
    >
    compact?: boolean
  }>(),
  { compact: false },
)

const emit = defineEmits<{
  changed: []
}>()

const pendingAction = ref<'resend' | 'revoke' | null>(null)
const errorMessage = ref('')

const isExpired = computed(() => getEffectiveInvitationStatus(props.worker) === 'expired')
const displayName = computed(
  () => `${props.worker.first_name || ''} ${props.worker.last_name || ''}`.trim() || props.worker.email,
)
const sizeClass = computed(() => (props.compact ? 'text-xs' : 'text-sm'))

async function runAction(action: 'resend' | 'revoke'): Promise<void> {
  const question =
    action === 'resend'
      ? `Send a new invitation to ${props.worker.email}? The previous link will stop working.`
      : `Remove the invitation for ${displayName.value} (${props.worker.email})? This cannot be undone.`
  if (!window.confirm(question)) return

  pendingAction.value = action
  errorMessage.value = ''
  const result =
    action === 'resend'
      ? await hrResourcesApi.resendWorkerInvitation(props.worker.id)
      : await hrResourcesApi.revokeWorkerInvitation(props.worker.id)
  pendingAction.value = null

  if (result.success) {
    emit('changed')
  } else {
    errorMessage.value = result.message || 'Action failed'
  }
}
</script>

<template>
  <div class="flex flex-col items-start gap-1">
    <div class="flex flex-wrap gap-1">
      <button
        type="button"
        class="inline-flex items-center px-2 py-1 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        :class="[
          sizeClass,
          isExpired
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'text-blue-600 hover:text-blue-500 hover:bg-blue-50',
        ]"
        :disabled="pendingAction !== null"
        @click="runAction('resend')"
      >
        {{ pendingAction === 'resend' ? 'Sending…' : 'Resend' }}
      </button>
      <button
        type="button"
        class="inline-flex items-center px-2 py-1 rounded-md font-medium text-red-600 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        :class="sizeClass"
        :disabled="pendingAction !== null"
        @click="runAction('revoke')"
      >
        {{ pendingAction === 'revoke' ? 'Removing…' : 'Remove' }}
      </button>
    </div>
    <p v-if="errorMessage" class="text-xs text-red-600 whitespace-normal max-w-[14rem]">
      {{ errorMessage }}
    </p>
  </div>
</template>

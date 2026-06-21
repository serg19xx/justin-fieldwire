<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getApiErrorMessage } from '@/core/utils/api'
import {
  clientsMeetingInviteApi,
  type MeetingInviteRecord,
} from '@/core/utils/clients-meeting-invite-api'

const props = defineProps<{
  open: boolean
  clientType: string
  clientId: number
  clientName: string
  phone: string
}>()

const emit = defineEmits<{
  close: []
  sent: [message: string]
}>()

const meetingDate = ref('')
const slot1 = ref('10:00')
const slot2 = ref('14:00')
const slot3 = ref('15:30')
const durationMinutes = ref(30)
const title = ref('')
const sending = ref(false)
const loadingStatus = ref(false)
const error = ref<string | null>(null)
const latestInvite = ref<MeetingInviteRecord | null>(null)

const defaultTitle = computed(() => `Call with ${props.clientName}`)

const statusLabel = computed(() => {
  const inv = latestInvite.value
  if (!inv) return null
  if (inv.status === 'pending') {
    return `Pending reply — sent for ${inv.meeting_date} (expires ${formatDateTime(inv.expires_at)})`
  }
  if (inv.status === 'confirmed' && inv.selected_slot) {
    const slotTime = [inv.slot1_time, inv.slot2_time, inv.slot3_time][inv.selected_slot - 1]
    return `Confirmed: slot ${inv.selected_slot} (${slotTime}) on ${inv.meeting_date}`
  }
  if (inv.status === 'expired') return 'Last invite expired without a reply'
  if (inv.status === 'cancelled') return 'Previous invite was replaced by a newer one'
  return null
})

function formatDateTime(value: string): string {
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

function resetForm() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  meetingDate.value = tomorrow.toISOString().slice(0, 10)
  slot1.value = '10:00'
  slot2.value = '14:00'
  slot3.value = '15:30'
  durationMinutes.value = 30
  title.value = defaultTitle.value
  error.value = null
  sending.value = false
}

async function loadLatest() {
  loadingStatus.value = true
  try {
    latestInvite.value = await clientsMeetingInviteApi.getLatest(props.clientType, props.clientId)
  } catch {
    latestInvite.value = null
  } finally {
    loadingStatus.value = false
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      resetForm()
      void loadLatest()
    }
  },
)

watch(
  () => props.clientName,
  () => {
    if (props.open && !title.value) {
      title.value = defaultTitle.value
    }
  },
)

async function handleSend() {
  if (sending.value) return

  if (!meetingDate.value) {
    error.value = 'Meeting date is required'
    return
  }

  sending.value = true
  error.value = null

  try {
    const result = await clientsMeetingInviteApi.send(props.clientType, props.clientId, {
      meeting_date: meetingDate.value,
      slots: [slot1.value, slot2.value, slot3.value],
      duration_minutes: durationMinutes.value,
      title: title.value.trim() || defaultTitle.value,
      timezone: 'America/Toronto',
    })

    if (!result.success) {
      error.value = result.message ?? 'Send failed'
      return
    }

    let notice = result.message ?? 'Meeting invite sent'
    if (result.testMode && result.sentTo && result.originalTo && result.sentTo !== result.originalTo) {
      notice += ` (test mode: sent to ${result.sentTo}, client had ${result.originalTo})`
    } else if (result.sentTo) {
      notice += ` → ${result.sentTo}`
    }
    notice += '. Client should reply with 1, 2, or 3.'

    emit('sent', notice)
    emit('close')
  } catch (e) {
    error.value = getApiErrorMessage(e, 'Send failed')
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
  >
    <div class="absolute inset-0 bg-black/40" @click="emit('close')" />
    <div
      class="relative w-full sm:max-w-lg bg-white rounded-t-xl sm:rounded-xl shadow-xl max-h-[90vh] overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div class="px-4 py-4 sm:px-6 border-b border-gray-200 flex items-start justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">Schedule call via SMS</h2>
          <p class="mt-1 text-sm text-gray-500">{{ clientName }} · {{ phone || '—' }}</p>
        </div>
        <button
          type="button"
          class="text-gray-400 hover:text-gray-600 text-xl leading-none"
          @click="emit('close')"
        >
          ×
        </button>
      </div>

      <form class="px-4 py-4 sm:px-6 space-y-4" @submit.prevent="handleSend">
        <p class="text-xs text-gray-500">
          Client receives an SMS with three time slots and replies with 1, 2, or 3. A calendar event is
          created when they confirm.
        </p>

        <p
          v-if="statusLabel"
          class="text-xs rounded-md border px-3 py-2"
          :class="
            latestInvite?.status === 'confirmed'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-amber-200 bg-amber-50 text-amber-900'
          "
        >
          {{ loadingStatus ? 'Loading status…' : statusLabel }}
        </p>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Meeting title</label>
          <input
            v-model="title"
            type="text"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            :placeholder="defaultTitle"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Meeting date</label>
          <input
            v-model="meetingDate"
            type="date"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            required
          />
        </div>

        <div class="grid grid-cols-3 gap-2">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Slot 1</label>
            <input v-model="slot1" type="time" class="w-full border border-gray-300 rounded-md px-2 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Slot 2</label>
            <input v-model="slot2" type="time" class="w-full border border-gray-300 rounded-md px-2 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Slot 3</label>
            <input v-model="slot3" type="time" class="w-full border border-gray-300 rounded-md px-2 py-2 text-sm" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
          <input
            v-model.number="durationMinutes"
            type="number"
            min="5"
            max="480"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div class="rounded-md bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-600 whitespace-pre-line">
          SMS preview:
          FieldWire meeting invite for {{ clientName }}, {{ meetingDate }}:
          1 - {{ slot1 }}
          2 - {{ slot2 }}
          3 - {{ slot3 }}
          Reply with 1, 2, or 3.
        </div>

        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

        <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            :disabled="sending"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 disabled:opacity-50"
            :disabled="sending"
          >
            {{ sending ? 'Sending…' : 'Send meeting invite' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

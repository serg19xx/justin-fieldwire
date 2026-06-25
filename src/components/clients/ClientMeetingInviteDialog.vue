<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getApiErrorMessage } from '@/core/utils/api'
import { useAuthStore } from '@/core/stores/auth'
import {
  clientsMeetingInviteApi,
  type DayScheduleSlot,
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

const authStore = useAuthStore()

const meetingDate = ref('')
const minMeetingDate = ref(clientsMeetingInviteApi.getMinMeetingDate())
const durationMinutes = ref(30)
const title = ref('')
const sending = ref(false)
const loadingStatus = ref(false)
const loadingSchedule = ref(false)
const error = ref<string | null>(null)
const latestInvite = ref<MeetingInviteRecord | null>(null)
const daySchedule = ref<DayScheduleSlot[]>([])
const selectedTimes = ref<string[]>([])
const holdDays = ref(3)
const availableCount = ref(0)

const MAX_SELECTED = 3

const defaultTitle = computed(() => `Call with ${props.clientName}`)

const senderLine = computed(() => {
  const user = authStore.currentUser
  const name =
    user?.name?.trim() ||
    [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() ||
    user?.email ||
    'FieldWire'
  const role = user?.job_title?.trim() || user?.role_name?.trim() || ''
  return role ? `${name} (${role})` : name
})

function formatDurationLabel(minutes: number): string {
  if (minutes >= 60 && minutes % 60 === 0) {
    const hours = minutes / 60
    return hours === 1 ? '1 hour' : `${hours} hours`
  }
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours} hr ${mins} min`
  }
  return `${minutes} min`
}

function formatTimeLabel(value: string): string {
  const [hourPart, minutePart] = value.split(':')
  const hour = Number(hourPart)
  const minute = Number(minutePart)
  if (Number.isNaN(hour) || Number.isNaN(minute)) return value
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return minute === 0 ? `${hour12} ${suffix}` : `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`
}

function formatDateLabel(value: string): string {
  if (!value) return value
  try {
    return new Date(`${value}T12:00:00`).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return value
  }
}

function formatReplyInstruction(count: number): string {
  if (count === 1) return 'Text back 1 to confirm.'
  if (count === 2) return 'Text back 1 or 2.'
  return 'Text back 1, 2, or 3.'
}

const sortedSelectedTimes = computed(() => [...selectedTimes.value].sort())

const smsPreview = computed(() => {
  const meetingTitle = title.value.trim() || defaultTitle.value
  const lines = [
    'FieldWire — meeting request',
    '',
    `Hi ${props.clientName},`,
    '',
    `${senderLine.value} would like to schedule a call with you.`,
    '',
    `Topic: ${meetingTitle}`,
    `Date: ${formatDateLabel(meetingDate.value)}`,
    `Duration: ${formatDurationLabel(durationMinutes.value)}`,
    '',
    'Reply with your preferred time:',
  ]

  sortedSelectedTimes.value.forEach((time, index) => {
    lines.push(`${index + 1}) ${formatTimeLabel(time)}`)
  })

  lines.push('', formatReplyInstruction(sortedSelectedTimes.value.length))
  return lines.join('\n')
})

const canSend = computed(
  () =>
    selectedTimes.value.length >= 1 &&
    selectedTimes.value.length <= MAX_SELECTED &&
    !loadingSchedule.value &&
    !sending.value &&
    meetingDate.value !== '',
)

const statusLabel = computed(() => {
  const inv = latestInvite.value
  if (!inv) return null
  if (inv.status === 'pending') {
    return `Pending reply — selected slots held for ${holdDays.value} days (expires ${formatDateTime(inv.expires_at)})`
  }
  if (inv.status === 'confirmed' && inv.selected_slot) {
    const dates = [inv.slot1_date ?? inv.meeting_date, inv.slot2_date ?? inv.meeting_date, inv.slot3_date ?? inv.meeting_date]
    const times = [inv.slot1_time, inv.slot2_time, inv.slot3_time]
    const slotIndex = inv.selected_slot - 1
    const slotLabel = `${dates[slotIndex]} ${times[slotIndex]}`
    return `Confirmed: slot ${inv.selected_slot} (${slotLabel})`
  }
  if (inv.status === 'expired') return 'Last invite expired without a reply'
  if (inv.status === 'cancelled') return 'Previous invite was replaced by a newer one'
  return null
})

function formatDateTime(value: string): string {
  try {
    return new Date(value).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

function resetForm() {
  meetingDate.value = clientsMeetingInviteApi.getDefaultMeetingDate()
  minMeetingDate.value = clientsMeetingInviteApi.getMinMeetingDate()
  durationMinutes.value = 30
  title.value = defaultTitle.value
  error.value = null
  sending.value = false
  daySchedule.value = []
  selectedTimes.value = []
  availableCount.value = 0
}

function toggleSlot(slot: DayScheduleSlot) {
  if (!slot.available) return

  const index = selectedTimes.value.indexOf(slot.time)
  if (index >= 0) {
    selectedTimes.value.splice(index, 1)
    return
  }

  if (selectedTimes.value.length >= MAX_SELECTED) {
    error.value = `Select no more than ${MAX_SELECTED} time slots`
    return
  }

  error.value = null
  selectedTimes.value.push(slot.time)
}

function isSelected(time: string): boolean {
  return selectedTimes.value.includes(time)
}

async function loadDaySchedule() {
  if (!meetingDate.value) return

  loadingSchedule.value = true
  error.value = null
  selectedTimes.value = []

  try {
    const result = await clientsMeetingInviteApi.getDaySchedule(
      meetingDate.value,
      durationMinutes.value,
    )
    minMeetingDate.value = result.minDate
    holdDays.value = result.holdDays
    daySchedule.value = result.schedule
    availableCount.value = result.availableCount

    if (!result.success) {
      daySchedule.value = []
      error.value = result.message ?? 'Failed to load schedule for this date'
    }
  } catch (e) {
    daySchedule.value = []
    error.value = getApiErrorMessage(e, 'Failed to load schedule')
  } finally {
    loadingSchedule.value = false
  }
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
      void loadDaySchedule()
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

watch(meetingDate, () => {
  if (props.open) {
    void loadDaySchedule()
  }
})

watch(durationMinutes, () => {
  if (props.open) {
    void loadDaySchedule()
  }
})

async function handleSend() {
  if (sending.value || !canSend.value) return

  sending.value = true
  error.value = null

  try {
    const result = await clientsMeetingInviteApi.send(props.clientType, props.clientId, {
      meeting_date: meetingDate.value,
      slots: sortedSelectedTimes.value,
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
    notice += `. Slots held for ${holdDays.value} days until client replies.`

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
      class="relative w-full sm:max-w-2xl bg-white rounded-t-xl sm:rounded-xl shadow-xl max-h-[90vh] overflow-y-auto"
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
          Choose a meeting date (at least 3 days ahead), then pick up to 3 free 30-minute slots.
          Selected slots are held on your calendar for {{ holdDays }} days while waiting for the
          client reply.
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

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Meeting date</label>
            <input
              v-model="meetingDate"
              type="date"
              class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              :min="minMeetingDate"
              required
            />
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
        </div>

        <div>
          <div class="flex items-center justify-between gap-2 mb-2">
            <div>
              <label class="block text-sm font-medium text-gray-700">Day schedule</label>
              <p class="text-xs text-gray-500 mt-0.5">
                30-minute steps, 9:00 AM–5:00 PM · selected {{ selectedTimes.length }}/{{ MAX_SELECTED }}
                · {{ availableCount }} free
              </p>
            </div>
            <button
              type="button"
              class="text-xs text-teal-700 hover:underline disabled:opacity-50"
              :disabled="loadingSchedule"
              @click="loadDaySchedule"
            >
              {{ loadingSchedule ? 'Loading…' : 'Refresh' }}
            </button>
          </div>

          <div
            v-if="loadingSchedule"
            class="rounded-md border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-500"
          >
            Loading schedule for {{ meetingDate }}…
          </div>

          <div
            v-else-if="daySchedule.length > 0"
            class="grid grid-cols-2 sm:grid-cols-3 gap-2"
          >
            <button
              v-for="slot in daySchedule"
              :key="slot.time"
              type="button"
              class="rounded-md border px-2 py-2 text-sm text-left transition-colors"
              :class="
                isSelected(slot.time)
                  ? 'border-teal-600 bg-teal-50 text-teal-900 ring-1 ring-teal-600'
                  : slot.available
                    ? 'border-gray-200 bg-white hover:border-teal-300 hover:bg-teal-50/40'
                    : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
              "
              :disabled="!slot.available"
              :title="slot.available ? 'Select slot' : slot.reason ?? 'Unavailable'"
              @click="toggleSlot(slot)"
            >
              <span class="font-medium">{{ formatTimeLabel(slot.time) }}</span>
              <span v-if="!slot.available" class="block text-[11px] leading-tight mt-0.5 truncate">
                {{ slot.reason ?? 'Unavailable' }}
              </span>
            </button>
          </div>

          <p
            v-else
            class="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
          >
            No schedule loaded. Pick another date or refresh.
          </p>
        </div>

        <div
          v-if="selectedTimes.length > 0"
          class="rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-950"
        >
          <p class="font-medium mb-1">Selected for client SMS:</p>
          <ul class="list-disc pl-5 space-y-0.5">
            <li v-for="(time, index) in sortedSelectedTimes" :key="time">
              {{ index + 1 }}. {{ formatTimeLabel(time) }}
            </li>
          </ul>
        </div>

        <div class="rounded-md bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-600 whitespace-pre-line">
          SMS preview:
          {{ smsPreview }}
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
            :disabled="!canSend"
          >
            {{ sending ? 'Sending…' : 'Send meeting invite' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

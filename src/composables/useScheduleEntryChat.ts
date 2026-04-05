import { ref, watch, type ComputedRef, type Ref } from 'vue'
import axios from 'axios'
import { useAuthStore } from '@/core/stores/auth'
import {
  fetchScheduleEntryMessages,
  postScheduleEntryMessage,
  type ScheduleEntryMessage,
  type ScheduleEntryMessageChannel,
} from '@/core/utils/schedule-weeks-api'

function axiosErrorMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const d = e.response?.data as { message?: string } | undefined
    if (typeof d?.message === 'string' && d.message.trim()) return d.message.trim()
    if (e.response?.status === 403) return 'Not allowed to view or post in this chat.'
    if (e.response?.status === 404) return 'Schedule entry or project not found.'
  }
  if (e instanceof Error && e.message) return e.message
  return 'Something went wrong.'
}

export interface ScheduleEntryChatDisplayMessage {
  id: number
  outgoing: boolean
  body: string
  createdAtMs: number
}

export function useScheduleEntryChat(
  projectId: ComputedRef<number>,
  scheduleEntryId: ComputedRef<number>,
  channel: Ref<ScheduleEntryMessageChannel>,
) {
  const authStore = useAuthStore()
  const rawMessages = ref<ScheduleEntryMessage[]>([])
  const isLoading = ref(false)
  const isSending = ref(false)
  const loadError = ref('')
  const sendError = ref('')

  const displayMessages = ref<ScheduleEntryChatDisplayMessage[]>([])

  function mapToDisplay(list: ScheduleEntryMessage[]): ScheduleEntryChatDisplayMessage[] {
    const myId = authStore.currentUser?.id
    return list.map((m) => ({
      id: m.id,
      outgoing: myId != null && m.author_user_id === myId,
      body: m.body,
      createdAtMs: new Date(m.created_at).getTime(),
    }))
  }

  async function loadMessages(): Promise<void> {
    const pid = projectId.value
    const eid = scheduleEntryId.value
    const ch = channel.value
    if (!Number.isFinite(pid) || pid <= 0 || !Number.isFinite(eid) || eid <= 0) {
      rawMessages.value = []
      displayMessages.value = []
      loadError.value = ''
      return
    }
    isLoading.value = true
    loadError.value = ''
    try {
      const { messages } = await fetchScheduleEntryMessages(pid, eid, ch)
      rawMessages.value = messages
      displayMessages.value = mapToDisplay(messages)
    } catch (e) {
      rawMessages.value = []
      displayMessages.value = []
      loadError.value = axiosErrorMessage(e)
    } finally {
      isLoading.value = false
    }
  }

  async function sendMessage(text: string): Promise<boolean> {
    const trimmed = text.trim()
    const pid = projectId.value
    const eid = scheduleEntryId.value
    const ch = channel.value
    if (!trimmed || !Number.isFinite(pid) || pid <= 0 || !Number.isFinite(eid) || eid <= 0) {
      return false
    }
    isSending.value = true
    sendError.value = ''
    try {
      const created = await postScheduleEntryMessage(pid, eid, ch, trimmed)
      rawMessages.value = [...rawMessages.value, created].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime() || a.id - b.id,
      )
      displayMessages.value = mapToDisplay(rawMessages.value)
      return true
    } catch (e) {
      sendError.value = axiosErrorMessage(e)
      return false
    } finally {
      isSending.value = false
    }
  }

  watch(
    [projectId, scheduleEntryId, channel],
    () => {
      void loadMessages()
    },
    { immediate: true },
  )

  return {
    displayMessages,
    isLoading,
    isSending,
    loadError,
    sendError,
    loadMessages,
    sendMessage,
  }
}

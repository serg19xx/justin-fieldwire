<template>
  <div
    class="flex flex-col max-w-lg mx-auto px-3 pt-2 min-h-[calc(100dvh-7.5rem)] sm:min-h-[calc(100vh-7.5rem)]"
  >
    <nav class="mb-2 shrink-0" aria-label="Navigation">
      <RouterLink
        :to="backToTaskLocation"
        class="inline-flex items-center gap-1.5 min-h-11 min-w-11 -ml-1 px-1 text-sm font-medium text-orange-600 hover:text-orange-700 rounded-lg hover:bg-orange-50"
      >
        <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        <span>Back</span>
      </RouterLink>
    </nav>

    <header class="shrink-0 mb-3">
      <h1 class="text-lg font-semibold text-gray-900 leading-tight">Slot chat</h1>
      <p class="text-xs text-gray-500 mt-0.5">This assignment — choose who you are messaging.</p>
      <p v-if="slotWhenLabel" class="text-xs font-medium text-gray-700 mt-1.5">
        {{ slotWhenLabel }}
      </p>
      <p v-if="isResolvingEntryId" class="text-[10px] text-gray-400 mt-1">Resolving slot id…</p>
      <p v-else-if="scheduleEntryIdForChat > 0" class="text-[10px] text-gray-400 mt-1 font-mono">
        Entry #{{ scheduleEntryIdForChat }}
      </p>
      <p v-else class="text-xs text-amber-800 mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5">
        Open this chat from the weekly schedule so the server knows which slot (entry id) to use.
      </p>
    </header>

    <!-- Peer switcher: Foreman | PM -->
    <div
      role="tablist"
      aria-label="Chat with"
      class="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-gray-200/90 shrink-0 mb-3"
    >
      <button
        id="tab-foreman"
        type="button"
        role="tab"
        :aria-selected="activePeer === 'foreman'"
        :tabindex="activePeer === 'foreman' ? 0 : -1"
        class="flex items-center justify-center gap-2 min-h-[52px] rounded-xl text-sm font-semibold transition-colors touch-manipulation"
        :class="
          activePeer === 'foreman'
            ? 'bg-white text-orange-800 shadow-sm ring-1 ring-orange-200/80'
            : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
        "
        @click="activePeer = 'foreman'"
      >
        <svg class="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        Foreman
      </button>
      <button
        id="tab-pm"
        type="button"
        role="tab"
        :aria-selected="activePeer === 'pm'"
        :tabindex="activePeer === 'pm' ? 0 : -1"
        class="flex items-center justify-center gap-2 min-h-[52px] rounded-xl text-sm font-semibold transition-colors touch-manipulation"
        :class="
          activePeer === 'pm'
            ? 'bg-white text-orange-800 shadow-sm ring-1 ring-orange-200/80'
            : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
        "
        @click="activePeer = 'pm'"
      >
        <svg class="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        PM
      </button>
    </div>

    <!-- Message thread -->
    <div
      :id="activePeer === 'foreman' ? 'panel-foreman' : 'panel-pm'"
      role="tabpanel"
      :aria-labelledby="activePeer === 'foreman' ? 'tab-foreman' : 'tab-pm'"
      class="flex-1 flex flex-col min-h-0 mb-3"
    >
      <div
        v-if="loadError"
        class="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        role="alert"
      >
        {{ loadError }}
      </div>
      <div
        ref="threadScrollEl"
        class="flex-1 overflow-y-auto overscroll-contain space-y-4 px-1 py-2 rounded-2xl bg-gray-100/80 border border-gray-200/80 min-h-[200px] max-h-[min(52vh,28rem)]"
      >
        <div v-if="isLoading" class="flex justify-center py-10">
          <div
            class="animate-spin w-9 h-9 border-2 border-orange-500 border-t-transparent rounded-full"
            aria-hidden="true"
          />
        </div>
        <template v-else>
          <template v-for="msg in displayMessages" :key="msg.id">
            <div v-if="!msg.outgoing" class="flex flex-col items-start gap-1 max-w-[92%]">
              <span class="text-[11px] font-medium text-gray-500 pl-1">{{ incomingLabel(activePeer) }}</span>
              <div
                class="rounded-2xl rounded-tl-md border border-gray-200 bg-white px-3.5 py-3 text-[15px] leading-snug text-gray-900 shadow-sm"
              >
                {{ msg.body }}
              </div>
              <time
                class="text-[10px] text-gray-400 pl-1.5 tabular-nums"
                :datetime="isoDateTime(msg.createdAtMs)"
              >
                {{ formatMessageDateTime(msg.createdAtMs) }}
              </time>
            </div>
            <div v-else class="flex flex-col items-end gap-1 max-w-[92%] ml-auto">
              <span class="text-[11px] font-medium text-gray-500 pr-1">Me</span>
              <div
                class="rounded-2xl rounded-tr-md bg-orange-600 px-3.5 py-3 text-[15px] leading-snug text-white shadow-sm"
              >
                {{ msg.body }}
              </div>
              <time
                class="text-[10px] text-gray-400 pr-1.5 tabular-nums"
                :datetime="isoDateTime(msg.createdAtMs)"
              >
                {{ formatMessageDateTime(msg.createdAtMs) }}
              </time>
            </div>
          </template>
          <p
            v-if="displayMessages.length === 0 && canUseApi"
            class="text-center text-sm text-gray-500 py-10 px-4"
          >
            No messages with {{ activePeer === 'foreman' ? 'your foreman' : 'the project manager' }} yet.
          </p>
        </template>
      </div>
    </div>

    <!-- Composer -->
    <div class="shrink-0 sticky bottom-0 -mx-3 px-3 pt-2 pb-1 bg-gray-50 border-t border-gray-200/90">
      <p v-if="sendError" class="text-xs text-red-700 mb-2 text-center" role="alert">
        {{ sendError }}
      </p>
      <div class="flex gap-2 items-end">
        <label class="sr-only" for="slot-chat-input">Message text</label>
        <textarea
          id="slot-chat-input"
          v-model="draft"
          rows="1"
          maxlength="4000"
          placeholder="Text"
          :disabled="!canUseApi || isSending"
          class="flex-1 min-h-[52px] max-h-32 resize-y rounded-2xl border border-gray-300 bg-white px-4 py-3 text-[15px] text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/25 disabled:opacity-50"
          @keydown.enter.exact.prevent="onSend"
        />
        <button
          type="button"
          class="inline-flex shrink-0 items-center justify-center min-h-[52px] min-w-[52px] rounded-2xl bg-orange-600 text-white shadow-sm hover:bg-orange-700 active:bg-orange-800 active:scale-[0.98] transition-colors disabled:opacity-40 disabled:pointer-events-none touch-manipulation"
          :disabled="!canUseApi || !draftTrimmed || isSending"
          aria-label="Send message"
          @click="onSend"
        >
          <svg
            v-if="isSending"
            class="w-7 h-7 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <svg v-else class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { RouteLocationRaw } from 'vue-router'
import {
  resolveScheduleSlotIdForMessages,
  type ScheduleDayPart,
  type ScheduleEntryMessageChannel,
} from '@/core/utils/schedule-weeks-api'
import { useScheduleEntryChat } from '@/composables/useScheduleEntryChat'
import { useAuthStore } from '@/core/stores/auth'
import { resolveSessionUserId } from '@/core/utils/task-role-ux'

type ChatPeer = ScheduleEntryMessageChannel

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const projectIdNum = computed(() => Number(route.params.projectId))

const taskId = computed(() => String(route.params.taskId))

const workDate = computed(() => {
  const w = route.query.workDate
  return typeof w === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(w) ? w : ''
})

const dayPart = computed(() => {
  const p = route.query.dayPart
  if (p === 'am' || p === 'pm' || p === 'full') return p
  return ''
})

const entryIdFromQuery = computed(() => {
  const raw = route.query.entryId
  if (typeof raw !== 'string' || raw === '') return 0
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : 0
})

/** PK from GET /me/schedule + schedule-weeks reconciliation (fixes wrong query e.g. entryId=1). */
const resolvedEntryId = ref(0)
const isResolvingEntryId = ref(false)

const scheduleEntryIdForChat = computed(() => {
  const r = resolvedEntryId.value
  if (r > 0) return r
  if (isResolvingEntryId.value) return entryIdFromQuery.value
  const hasSlotContext =
    workDate.value.length > 0 &&
    projectIdNum.value > 0 &&
    Number.isFinite(Number(taskId.value)) &&
    Number(taskId.value) > 0
  if (hasSlotContext) return 0
  return entryIdFromQuery.value
})

/** Avoid firing messages GET with a stale query id while we reconcile from week API. */
const scheduleEntryIdForApi = computed(() => {
  if (isResolvingEntryId.value) return 0
  return scheduleEntryIdForChat.value
})

const canUseApi = computed(() => projectIdNum.value > 0 && scheduleEntryIdForApi.value > 0)

async function reconcileEntryIdFromSchedule(): Promise<void> {
  resolvedEntryId.value = 0
  const pid = projectIdNum.value
  const tid = Number(taskId.value)
  const ymd = workDate.value
  const partRaw = dayPart.value
  if (!pid || !Number.isFinite(tid) || !ymd) return
  if (partRaw !== 'am' && partRaw !== 'pm' && partRaw !== 'full') return
  const uid = resolveSessionUserId(authStore.currentUser)
  if (uid == null) return
  isResolvingEntryId.value = true
  try {
    const eid = await resolveScheduleSlotIdForMessages(pid, uid, tid, ymd, partRaw)
    if (Number.isFinite(eid) && eid > 0) {
      resolvedEntryId.value = eid
      if (eid !== entryIdFromQuery.value) {
        await router.replace({
          path: route.path,
          query: { ...route.query, entryId: String(eid) },
        })
      }
    } else if (entryIdFromQuery.value > 0) {
      const q = { ...route.query } as Record<string, string | string[]>
      delete q.entryId
      await router.replace({ path: route.path, query: q })
    }
  } catch {
    /* keep query entry id */
  } finally {
    isResolvingEntryId.value = false
  }
}

function dayPartHuman(p: string): string {
  if (p === 'am') return 'Morning'
  if (p === 'pm') return 'Afternoon'
  if (p === 'full') return 'All day'
  return ''
}

const slotWhenLabel = computed(() => {
  const ymd = workDate.value
  if (!ymd) return ''
  const d = new Date(`${ymd}T12:00:00`)
  const dateStr = d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const part = dayPartHuman(dayPart.value)
  return part ? `${dateStr} · ${part}` : dateStr
})

function formatMessageDateTime(ms: number): string {
  const d = new Date(ms)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function isoDateTime(ms: number): string {
  return new Date(ms).toISOString()
}

const backToTaskLocation = computed((): RouteLocationRaw => {
  const q: Record<string, string> = {}
  if (workDate.value) q.workDate = workDate.value
  if (dayPart.value) q.dayPart = dayPart.value
  const eid = scheduleEntryIdForChat.value
  if (eid > 0) q.entryId = String(eid)
  return {
    path: `/tasks/schedule/task/${route.params.projectId}/${taskId.value}`,
    query: q,
  }
})

const activePeer = ref<ChatPeer>('foreman')

const {
  displayMessages,
  isLoading,
  isSending,
  loadError,
  sendError,
  sendMessage,
} = useScheduleEntryChat(projectIdNum, scheduleEntryIdForApi, activePeer)

watch(
  () =>
    [
      projectIdNum.value,
      taskId.value,
      workDate.value,
      dayPart.value,
      route.query.entryId,
      authStore.currentUser?.id,
    ] as const,
  () => {
    void reconcileEntryIdFromSchedule()
  },
  { immediate: true },
)

const draft = ref('')
const threadScrollEl = ref<HTMLElement | null>(null)

const draftTrimmed = computed(() => draft.value.trim())

function incomingLabel(peer: ChatPeer): string {
  return peer === 'foreman' ? 'Foreman' : 'PM'
}

function scrollThreadToBottom(): void {
  const el = threadScrollEl.value
  if (!el) return
  el.scrollTop = el.scrollHeight
}

async function onSend(): Promise<void> {
  if (!draftTrimmed.value || !canUseApi.value) return
  const ok = await sendMessage(draft.value)
  if (ok) draft.value = ''
  void nextTick(() => scrollThreadToBottom())
}

watch(
  displayMessages,
  () => {
    void nextTick(() => scrollThreadToBottom())
  },
  { deep: true },
)

watch(activePeer, () => {
  void nextTick(() => scrollThreadToBottom())
})
</script>

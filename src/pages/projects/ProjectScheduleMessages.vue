<template>
  <div class="min-h-[calc(100dvh-3.5rem)] flex flex-col md:flex-row bg-gray-50">
    <!-- Contact tree (task → schedule slots) -->
    <aside
      class="w-full md:w-[min(100%,20rem)] lg:w-72 shrink-0 border-b md:border-b-0 md:border-r border-gray-200 bg-white flex flex-col max-h-[45vh] md:max-h-none md:min-h-[calc(100dvh-3.5rem)]"
    >
      <div class="p-3 border-b border-gray-100 shrink-0">
        <nav class="mb-2 text-sm">
          <RouterLink
            :to="{ path: `/projects/${projectId}/detail`, query: { section: 'schedule' } }"
            class="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-800"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Schedule
          </RouterLink>
        </nav>
        <h1 class="text-base font-semibold text-gray-900">Schedule messages</h1>
        <p class="text-xs text-gray-500 mt-0.5">By task, then worker &amp; slot (PM channel).</p>
        <div class="flex items-center justify-between gap-2 mt-3">
          <button
            type="button"
            class="p-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
            aria-label="Previous week"
            :disabled="treeLoading"
            @click="shiftWeek(-1)"
          >
            ←
          </button>
          <span class="text-xs font-medium text-gray-800 text-center truncate flex-1">{{ weekRangeLabel }}</span>
          <button
            type="button"
            class="p-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
            aria-label="Next week"
            :disabled="treeLoading"
            @click="shiftWeek(1)"
          >
            →
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-2 min-h-0">
        <div v-if="treeError" class="text-xs text-red-700 px-2 py-2">{{ treeError }}</div>
        <div v-else-if="treeLoading" class="flex justify-center py-10">
          <div class="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <p v-else-if="taskGroups.length === 0" class="text-sm text-gray-500 px-2 py-4">
          No schedule rows with saved ids this week — publish slots or pick another week.
        </p>
        <ul v-else class="space-y-1" role="tree" aria-label="Tasks and contacts">
          <li v-for="group in taskGroups" :key="group.taskId" class="rounded-lg border border-gray-100 overflow-hidden">
            <button
              type="button"
              class="flex w-full items-center gap-2 px-2 py-2.5 text-left text-sm font-semibold text-gray-900 bg-gray-50 hover:bg-gray-100"
              :aria-expanded="isTaskOpen(group.taskId)"
              @click="toggleTask(group.taskId)"
            >
              <svg
                class="w-4 h-4 text-gray-500 shrink-0 transition-transform"
                :class="isTaskOpen(group.taskId) ? 'rotate-90' : ''"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
              <span class="truncate">{{ group.taskName }}</span>
            </button>
            <ul v-show="isTaskOpen(group.taskId)" class="border-t border-gray-100 bg-white py-1">
              <li v-for="c in group.contacts" :key="c.entryId">
                <button
                  type="button"
                  class="w-full text-left px-3 py-2.5 text-sm transition-colors border-l-4"
                  :class="
                    contactMatchesSelection(c)
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-transparent text-gray-700 hover:bg-gray-50'
                  "
                  @click="selectContact(c)"
                >
                  <span class="font-medium block truncate">{{ c.workerLabel }}</span>
                  <span class="text-xs text-gray-500">{{ c.whenLabel }}</span>
                </button>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </aside>

    <!-- Thread: fixed PM channel -->
    <main class="flex-1 flex flex-col min-w-0 min-h-0 p-3 md:p-4">
      <div v-if="selectedEntryId <= 0" class="flex-1 flex items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-8">
        <p class="text-sm text-gray-500 text-center max-w-sm">
          Select a worker slot under a task to open the <strong class="font-medium text-gray-700">PM</strong> conversation for that published row.
        </p>
      </div>
      <template v-else>
        <div class="flex flex-wrap items-center gap-2 mb-3 shrink-0">
          <h2 class="text-lg font-semibold text-gray-900 truncate">{{ selectedContactSummary }}</h2>
          <RouterLink
            v-if="planLink"
            :to="planLink"
            class="text-xs font-medium text-blue-600 hover:text-blue-800 ml-auto"
          >
            Assignment
          </RouterLink>
        </div>
        <div v-if="loadError" class="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {{ loadError }}
        </div>
        <div
          ref="threadScrollEl"
          class="flex-1 overflow-y-auto space-y-3 rounded-xl border border-gray-200 bg-white p-3 min-h-[200px] max-h-[min(50vh,24rem)] md:max-h-[min(60vh,32rem)]"
        >
          <div v-if="isLoading" class="flex justify-center py-12">
            <div class="w-9 h-9 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <template v-else>
            <template v-for="msg in displayMessages" :key="msg.id">
              <div v-if="!msg.outgoing" class="flex flex-col items-start gap-0.5 max-w-[90%]">
                <span class="text-[10px] font-medium text-gray-500 pl-1">Worker</span>
                <div class="rounded-2xl rounded-tl-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900">
                  {{ msg.body }}
                </div>
                <time class="text-[10px] text-gray-400 pl-1 tabular-nums" :datetime="isoTime(msg.createdAtMs)">
                  {{ formatTime(msg.createdAtMs) }}
                </time>
              </div>
              <div v-else class="flex flex-col items-end gap-0.5 max-w-[90%] ml-auto">
                <span class="text-[10px] font-medium text-gray-500 pr-1">Me</span>
                <div class="rounded-2xl rounded-tr-md bg-blue-600 px-3 py-2.5 text-sm text-white">
                  {{ msg.body }}
                </div>
                <time class="text-[10px] text-gray-400 pr-1 tabular-nums" :datetime="isoTime(msg.createdAtMs)">
                  {{ formatTime(msg.createdAtMs) }}
                </time>
              </div>
            </template>
            <p v-if="displayMessages.length === 0" class="text-center text-sm text-gray-500 py-8">No messages yet.</p>
          </template>
        </div>
        <div class="mt-3 rounded-xl border border-gray-200 bg-white p-3 shrink-0">
          <p v-if="sendError" class="text-xs text-red-700 mb-2">{{ sendError }}</p>
          <div class="flex gap-2 items-end">
            <label class="sr-only" for="pm-thread-input">Message</label>
            <textarea
              id="pm-thread-input"
              v-model="draft"
              rows="2"
              maxlength="4000"
              placeholder="Message…"
              :disabled="isSending"
              class="flex-1 min-h-[48px] max-h-32 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
              @keydown.enter.exact.prevent="onSend"
            />
            <button
              type="button"
              class="min-h-[48px] min-w-[48px] rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-40"
              :disabled="!draftTrimmed || isSending"
              aria-label="Send"
              @click="onSend"
            >
              <svg v-if="isSending" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { RouteLocationRaw } from 'vue-router'
import { projectApi } from '@/core/utils/project-api'
import { tasksApi } from '@/core/utils/tasks-api'
import {
  fetchProjectScheduleWeek,
  resolveScheduleSlotIdForMessages,
  resolveScheduleSlotIdFromWeekEntries,
  type ScheduleDayPart,
  type ScheduleWeekEntryRow,
} from '@/core/utils/schedule-weeks-api'
import type { ScheduleEntryMessageChannel } from '@/core/utils/schedule-weeks-api'
import type { Task } from '@/core/types/task'
import { addDays, startOfWeekMonday, toYmd, weekStartMondayYmdFromIsoDate } from '@/core/utils/week-utils'
import { useScheduleEntryChat } from '@/composables/useScheduleEntryChat'

interface ApiTeamRow {
  id?: number
  user_id?: number
  full_name?: string
  name?: string
  email?: string
  team_member_id?: number
  project_id?: number
}

interface ContactRow {
  entryId: number
  userId: number
  taskId: number
  workYmd: string
  dayPart: ScheduleDayPart
  workerLabel: string
  whenLabel: string
}

interface TaskGroup {
  taskId: number
  taskName: string
  contacts: ContactRow[]
}

const route = useRoute()
const router = useRouter()

const projectId = computed(() => Number(route.params.id))

/** ISO Monday for the visible week (normalized from `week_start` query or today). */
const weekStartYmd = computed(() => {
  const q = route.query.week_start
  const raw =
    typeof q === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(q)
      ? q
      : toYmd(startOfWeekMonday(new Date()))
  return toYmd(startOfWeekMonday(new Date(`${raw}T12:00:00`)))
})

const weekMondayDate = computed(() => new Date(`${weekStartYmd.value}T12:00:00`))

const weekRangeLabel = computed(() => {
  const start = weekMondayDate.value
  const end = addDays(start, 6)
  const a = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const b = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  return `${a} – ${b}`
})

const selectedEntryId = computed(() => {
  const e = route.query.entryId
  if (typeof e !== 'string' || e === '') return 0
  const n = Number(e)
  return Number.isFinite(n) && n > 0 ? n : 0
})

/**
 * Same resolver as worker chat: GET schedule-weeks + match by user/task/date/day_part.
 * Corrects wrong `entries[].id` in the URL so PM POST/GET uses the same slot PK as the worker.
 */
const reconciledPmSlotId = ref(0)
const isReconcilingPmSlot = ref(false)

function normalizeEntryDayPart(raw: string | undefined): ScheduleDayPart {
  const dp = String(raw ?? 'am').toLowerCase()
  return dp === 'pm' || dp === 'full' ? dp : 'am'
}

/**
 * Canonical slot identity in the query (same composite the worker chat uses: user, task, date, day_part).
 * PM thread API must use the id resolved from this — never POST with a bare entryId that might point at another row.
 */
function parsePmSlotFromRoute(): {
  uid: number
  tid: number
  ymd: string
  part: ScheduleDayPart
} | null {
  const sw = route.query.slotWorker ?? route.query.slot_user
  const st = route.query.slotTask ?? route.query.slot_task
  const sd = route.query.slotDate ?? route.query.slot_date
  const sp = route.query.slotPart ?? route.query.slot_part
  if (typeof sw !== 'string' || typeof st !== 'string' || typeof sd !== 'string') return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sd)) return null
  if (typeof sp !== 'string' || (sp !== 'am' && sp !== 'pm' && sp !== 'full')) return null
  const uid = Number(sw)
  const tid = Number(st)
  if (!Number.isFinite(uid) || uid <= 0 || !Number.isFinite(tid) || tid <= 0) return null
  return { uid, tid, ymd: sd.slice(0, 10), part: sp }
}

const pmMessagesEntryId = computed(() => {
  if (isReconcilingPmSlot.value) return 0
  return reconciledPmSlotId.value > 0 ? reconciledPmSlotId.value : 0
})

function pmSlotQueryPatch(slot: {
  uid: number
  tid: number
  ymd: string
  part: ScheduleDayPart
  entryId: number
}): Record<string, string | string[]> {
  const q = { ...route.query } as Record<string, string | string[]>
  q.week_start = weekStartYmd.value
  q.entryId = String(slot.entryId)
  q.slotWorker = String(slot.uid)
  q.slotTask = String(slot.tid)
  q.slotDate = slot.ymd
  q.slotPart = slot.part
  return q
}

async function reconcilePmSlotIdWithWeek(): Promise<void> {
  reconciledPmSlotId.value = 0
  const pid = projectId.value
  if (pid <= 0) return

  const fromRoute = parsePmSlotFromRoute()
  if (fromRoute != null) {
    isReconcilingPmSlot.value = true
    try {
      const rowWeekMon = weekStartMondayYmdFromIsoDate(fromRoute.ymd)
      const rid =
        entries.value.length > 0 && rowWeekMon === weekStartYmd.value
          ? resolveScheduleSlotIdFromWeekEntries(
              entries.value,
              fromRoute.uid,
              fromRoute.tid,
              fromRoute.ymd,
              fromRoute.part,
            )
          : await resolveScheduleSlotIdForMessages(
              pid,
              fromRoute.uid,
              fromRoute.tid,
              fromRoute.ymd,
              fromRoute.part,
            )
      if (rid > 0) {
        reconciledPmSlotId.value = rid
        const nextQ = pmSlotQueryPatch({
          uid: fromRoute.uid,
          tid: fromRoute.tid,
          ymd: fromRoute.ymd,
          part: fromRoute.part,
          entryId: rid,
        })
        const curE = typeof route.query.entryId === 'string' ? route.query.entryId : ''
        const needsReplace =
          curE !== String(rid) ||
          String(route.query.slotWorker ?? '') !== String(fromRoute.uid) ||
          String(route.query.slotTask ?? '') !== String(fromRoute.tid) ||
          String(route.query.slotDate ?? '') !== fromRoute.ymd ||
          String(route.query.slotPart ?? '') !== fromRoute.part
        if (needsReplace) {
          await router.replace({ path: route.path, query: nextQ })
        }
      }
    } finally {
      isReconcilingPmSlot.value = false
    }
    return
  }

  const qid = selectedEntryId.value
  if (qid <= 0) return
  const row = entries.value.find((r) => r.id === qid)
  if (row == null) return
  const ymd = row.work_date.length >= 10 ? row.work_date.slice(0, 10) : row.work_date
  const part = normalizeEntryDayPart(row.day_part)
  isReconcilingPmSlot.value = true
  try {
    const rowWeekMon = weekStartMondayYmdFromIsoDate(ymd)
    const rid =
      entries.value.length > 0 && rowWeekMon === weekStartYmd.value
        ? resolveScheduleSlotIdFromWeekEntries(entries.value, row.user_id, row.task_id, ymd, part)
        : await resolveScheduleSlotIdForMessages(pid, row.user_id, row.task_id, ymd, part)
    if (rid > 0) {
      reconciledPmSlotId.value = rid
      const nextQ = pmSlotQueryPatch({
        uid: row.user_id,
        tid: row.task_id,
        ymd,
        part,
        entryId: rid,
      })
      const curE = typeof route.query.entryId === 'string' ? route.query.entryId : ''
      const needsReplace =
        curE !== String(rid) ||
        route.query.slotWorker == null ||
        route.query.slotTask == null ||
        route.query.slotDate == null ||
        route.query.slotPart == null
      if (needsReplace) {
        await router.replace({ path: route.path, query: nextQ })
      }
    }
  } finally {
    isReconcilingPmSlot.value = false
  }
}

/** PM channel only */
const pmChannel = ref<ScheduleEntryMessageChannel>('pm')

const {
  displayMessages,
  isLoading,
  isSending,
  loadError,
  sendError,
  sendMessage,
} = useScheduleEntryChat(projectId, pmMessagesEntryId, pmChannel)

const draft = ref('')
const threadScrollEl = ref<HTMLElement | null>(null)
const draftTrimmed = computed(() => draft.value.trim())

const treeLoading = ref(false)
const treeError = ref('')
const entries = ref<ScheduleWeekEntryRow[]>([])
const tasksById = ref<Map<number, Task>>(new Map())
const workerNameByUserId = ref<Map<number, string>>(new Map())
const openTaskIds = ref<Set<number>>(new Set())

function dayPartLabel(part: string): string {
  if (part === 'am') return 'Morning'
  if (part === 'pm') return 'Afternoon'
  return 'All day'
}

function contactMatchesSelection(c: ContactRow): boolean {
  const slot = parsePmSlotFromRoute()
  if (slot != null) {
    return (
      c.userId === slot.uid &&
      c.taskId === slot.tid &&
      c.workYmd === slot.ymd &&
      c.dayPart === slot.part
    )
  }
  return c.entryId === selectedEntryId.value
}

const taskGroups = computed((): TaskGroup[] => {
  const byTask = new Map<number, ContactRow[]>()
  for (const row of entries.value) {
    const eid = row.id
    if (eid == null || eid <= 0 || row.user_id <= 0) continue
    const name =
      tasksById.value.get(row.task_id)?.name?.trim() ||
      `Task #${row.task_id}`
    const worker =
      workerNameByUserId.value.get(row.user_id) ||
      `User #${row.user_id}`
    const d = row.work_date
    const pretty =
      d && d.length >= 10
        ? new Date(`${d.slice(0, 10)}T12:00:00`).toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })
        : row.work_date
    const whenLabel = `${pretty} · ${dayPartLabel(row.day_part)}`
    const workYmd = d && d.length >= 10 ? d.slice(0, 10) : String(row.work_date ?? '')
    const dayPart = normalizeEntryDayPart(row.day_part)
    const list = byTask.get(row.task_id) ?? []
    list.push({
      entryId: eid,
      userId: row.user_id,
      taskId: row.task_id,
      workYmd,
      dayPart,
      workerLabel: worker,
      whenLabel,
    })
    byTask.set(row.task_id, list)
  }
  const groups: TaskGroup[] = []
  for (const [taskId, contacts] of byTask) {
    contacts.sort((a, b) => a.whenLabel.localeCompare(b.whenLabel) || a.entryId - b.entryId)
    const taskName = tasksById.value.get(taskId)?.name?.trim() || `Task #${taskId}`
    groups.push({ taskId, taskName, contacts })
  }
  groups.sort((a, b) => a.taskName.localeCompare(b.taskName))
  return groups
})

const selectedContactSummary = computed(() => {
  if (selectedEntryId.value <= 0 && parsePmSlotFromRoute() == null) return ''
  for (const g of taskGroups.value) {
    const hit = g.contacts.find((c) => contactMatchesSelection(c))
    if (hit) return `${hit.workerLabel} · ${hit.whenLabel} · ${g.taskName}`
  }
  return selectedEntryId.value > 0 ? `Entry #${selectedEntryId.value}` : ''
})

const canonicalPlanEntryId = computed(() =>
  reconciledPmSlotId.value > 0 ? reconciledPmSlotId.value : selectedEntryId.value,
)

const planLink = computed((): RouteLocationRaw | null => {
  const id = canonicalPlanEntryId.value
  if (id <= 0) return null
  return {
    path: `/projects/${projectId.value}/detail/schedule-slot/${id}`,
    query: { week_start: weekStartYmd.value },
  }
})

function isTaskOpen(taskId: number): boolean {
  return openTaskIds.value.has(taskId)
}

function toggleTask(taskId: number): void {
  const next = new Set(openTaskIds.value)
  if (next.has(taskId)) next.delete(taskId)
  else next.add(taskId)
  openTaskIds.value = next
}

function selectContact(c: ContactRow): void {
  void router.replace({
    path: route.path,
    query: pmSlotQueryPatch({
      uid: c.userId,
      tid: c.taskId,
      ymd: c.workYmd,
      part: c.dayPart,
      entryId: c.entryId,
    }),
  })
}

function shiftWeek(delta: number): void {
  const d = new Date(`${weekStartYmd.value}T12:00:00`)
  d.setDate(d.getDate() + delta * 7)
  const next = toYmd(startOfWeekMonday(d))
  const q: Record<string, string | string[]> = { ...route.query } as Record<string, string | string[]>
  q.week_start = next
  delete q.entryId
  delete q.slotWorker
  delete q.slot_user
  delete q.slotTask
  delete q.slot_task
  delete q.slotDate
  delete q.slot_date
  delete q.slotPart
  delete q.slot_part
  void router.replace({ path: route.path, query: q })
}

function parseTeamToMap(data: unknown): Map<number, string> {
  const map = new Map<number, string>()
  const raw = data as { data?: { team_members?: ApiTeamRow[] }; team_members?: ApiTeamRow[] }
  const list = raw?.team_members ?? raw?.data?.team_members ?? []
  if (!Array.isArray(list)) return map
  for (const m of list as ApiTeamRow[]) {
    const uid = Number(m.user_id ?? m.id)
    if (!Number.isFinite(uid) || uid <= 0) continue
    const label = (m.full_name || m.name || m.email || `User ${uid}`).trim()
    if (!map.has(uid)) map.set(uid, label)
  }
  return map
}

async function loadTree(): Promise<void> {
  const pid = projectId.value
  if (!Number.isFinite(pid) || pid <= 0) return
  treeLoading.value = true
  treeError.value = ''
  try {
    const [weekRes, tasksRes, teamRaw] = await Promise.all([
      fetchProjectScheduleWeek(pid, weekStartYmd.value),
      tasksApi.getAll(pid, 1, 500).catch(() => ({ tasks: [] as Task[] })),
      projectApi.getTeamMembers(pid),
    ])
    entries.value = weekRes.entries ?? []
    const tmap = new Map<number, Task>()
    for (const t of tasksRes.tasks) {
      const id = Number(t.id)
      if (Number.isFinite(id)) tmap.set(id, t)
    }
    tasksById.value = tmap
    workerNameByUserId.value = parseTeamToMap(teamRaw)

    await nextTick()
    const groups = taskGroups.value
    const nextOpen = new Set<number>()
    for (const g of groups) {
      if (g.contacts.some((c) => contactMatchesSelection(c))) nextOpen.add(g.taskId)
    }
    if (nextOpen.size === 0) {
      for (const g of groups) nextOpen.add(g.taskId)
    }
    openTaskIds.value = nextOpen
    await nextTick()
    void reconcilePmSlotIdWithWeek()
  } catch (e) {
    treeError.value = e instanceof Error ? e.message : 'Could not load schedule tree.'
    entries.value = []
  } finally {
    treeLoading.value = false
  }
}

watch(
  () => [projectId.value, weekStartYmd.value] as const,
  () => {
    void loadTree()
  },
  { immediate: true },
)

watch(
  () => [selectedEntryId.value, entries.value.length, projectId.value] as const,
  () => {
    void reconcilePmSlotIdWithWeek()
  },
)

function formatTime(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function isoTime(ms: number): string {
  return new Date(ms).toISOString()
}

function scrollThreadToBottom(): void {
  const el = threadScrollEl.value
  if (!el) return
  el.scrollTop = el.scrollHeight
}

async function onSend(): Promise<void> {
  if (!draftTrimmed.value) return
  const ok = await sendMessage(draft.value)
  if (ok) draft.value = ''
  void nextTick(() => scrollThreadToBottom())
}

watch(displayMessages, () => void nextTick(() => scrollThreadToBottom()), { deep: true })
watch(selectedEntryId, () => void nextTick(() => scrollThreadToBottom()))
</script>

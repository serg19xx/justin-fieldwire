<template>
  <div class="p-4 md:p-6 max-w-5xl mx-auto w-full min-w-0">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">Weekly task schedule</h2>
        <p class="text-sm text-gray-500 mt-0.5">
          Choose <strong class="font-medium text-gray-700">one worker</strong>, then build their week (day, slot, task).
          The week bar reflects free / partly busy / fully blocked days using this draft plus
          <strong class="font-medium text-gray-700">published slots in other projects</strong> from
          <code class="text-xs bg-gray-100 px-1 rounded">GET /users/&#123;id&#125;/schedule</code> (when the server allows
          by RBAC). Saving adds people to the task team if needed.
        </p>
      </div>
        <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2 flex-wrap">
        <div class="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm"
            title="Go to the previous calendar week (read-only before this week)"
            @click="weekOffset--"
          >
            ← Prev week
          </button>
          <span class="text-sm font-medium text-gray-900">{{ weekRangeLabel }}</span>
          <button
            type="button"
            class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm"
            @click="weekOffset++"
          >
            Next week →
          </button>
        </div>
        <p class="text-xs text-gray-500 max-w-xl">
          You can open past weeks to review published history. Planning and drafts are only for this week
          and the future; days before today cannot be chosen in an editable draft.
        </p>
      </div>
    </div>

    <div
      v-if="bannerError"
      class="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
    >
      {{ bannerError }}
    </div>

    <div v-if="metaError" class="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
      {{ metaError }}
    </div>

    <div v-if="isLoading" class="flex justify-center py-16">
      <div class="animate-spin w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full" />
    </div>

    <template v-else>
      <div v-if="!weekMeta" class="rounded-xl border border-gray-200 bg-white p-6 text-center">
        <p class="text-sm text-gray-600 mb-4">
          {{ isViewingPastWeek ? 'No schedule data for this week.' : 'No schedule draft for this week yet.' }}
        </p>
        <button
          v-if="canEdit && !isViewingPastWeek"
          type="button"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          :disabled="isSaving"
          @click="onCreateDraft"
        >
          Create draft week
        </button>
        <p v-else-if="canEdit && isViewingPastWeek" class="text-xs text-gray-500">
          Past weeks cannot be created or edited here.
        </p>
        <p v-else-if="!canEdit && !isViewingPastWeek" class="text-xs text-gray-500">
          Only project managers can create the schedule.
        </p>
      </div>

      <template v-else>
        <div class="flex flex-wrap items-center gap-2 mb-3">
          <span
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
            :class="weekMeta.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'"
          >
            {{ weekMeta.status === 'published' ? 'Published' : 'Draft' }}
          </span>
          <span class="text-xs text-gray-500"> Week starts {{ weekMeta.week_start }} </span>
        </div>

        <div class="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table class="min-w-full divide-y divide-gray-200 text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th colspan="3" class="px-3 py-3 text-left align-middle border-b border-gray-200">
                  <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <label class="flex items-center gap-2 min-w-0">
                      <span class="text-xs font-medium text-gray-700 shrink-0">Worker</span>
                      <select
                        v-model.number="selectedPlannerWorkerId"
                        class="min-w-[12rem] max-w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                        :disabled="workerSelectDisabled"
                      >
                        <option :value="0">Select worker…</option>
                        <option v-for="w in workerOptions" :key="w.user_id" :value="w.user_id">
                          {{ w.label }}
                        </option>
                      </select>
                    </label>
                  </div>
                  <div
                    v-if="selectedPlannerWorkerId > 0"
                    class="mt-3 flex gap-1 w-full"
                    title="Day availability for this worker (this draft + other projects if loaded)"
                  >
                    <div
                      v-for="d in weekDayBadges"
                      :key="d.ymd"
                      class="flex-1 min-w-0 rounded-md border px-0.5 py-1.5 text-center text-[10px] sm:text-xs font-medium leading-tight"
                      :class="d.badgeClass"
                    >
                      {{ d.shortLabel }}<span class="hidden sm:block opacity-80">{{ d.sub }}</span>
                    </div>
                  </div>
                  <p v-if="showPlannerHint" class="mt-2 text-[11px] text-gray-500">
                    Unavailable slots use this worker’s
                    <strong class="font-medium text-gray-600">published</strong> plans in
                    <strong class="font-medium text-gray-600">other projects</strong> when the server returns them.
                    <template v-if="!hasExternalOtherProjectSlots">
                      No other-project overlap in this range, or the request failed (e.g. 403).
                    </template>
                  </p>
                </th>
                <th v-if="isScheduleEditable" class="w-10 border-b border-gray-200" />
              </tr>
              <tr>
                <th class="px-3 py-2 text-left font-medium text-gray-700">Day</th>
                <th class="px-3 py-2 text-left font-medium text-gray-700">Slot</th>
                <th class="px-3 py-2 text-left font-medium text-gray-700">Task</th>
                <th v-if="isScheduleEditable" class="px-3 py-2 w-10" />
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="(row, idx) in visibleRows" :key="`${idx}-${rowKey(row)}`">
                <td class="px-3 py-2 align-top">
                  <select
                    v-if="isScheduleEditable"
                    v-model="row.work_date"
                    class="w-full min-w-[10rem] rounded border border-gray-300 text-sm"
                    @change="onDayOrSlotChange(row)"
                  >
                    <option
                      v-for="d in dayChoices"
                      :key="d.ymd"
                      :value="d.ymd"
                      :disabled="isDayOptionDisabledForRow(row, d.ymd)"
                      :class="isDayOptionDisabledForRow(row, d.ymd) ? 'text-gray-400 bg-gray-50' : ''"
                    >
                      {{ d.label }}{{ isDayOptionDisabledForRow(row, d.ymd) ? ' (unavailable)' : '' }}
                    </option>
                  </select>
                  <span v-else class="text-gray-900">{{ labelForYmd(row.work_date) }}</span>
                </td>
                <td class="px-3 py-2 align-top">
                  <select
                    v-if="isScheduleEditable"
                    v-model="row.day_part"
                    class="w-full min-w-[7rem] rounded border border-gray-300 text-sm"
                    @change="onDayOrSlotChange(row)"
                  >
                    <option
                      v-for="opt in dayPartOptions"
                      :key="opt.value"
                      :value="opt.value"
                      :disabled="isSlotDisabledForRow(row, opt.value)"
                    >
                      {{ opt.label }}{{ isSlotDisabledForRow(row, opt.value) ? ' (busy)' : '' }}
                    </option>
                  </select>
                  <span v-else class="text-gray-900">{{ dayPartLabel(row.day_part) }}</span>
                </td>
                <td class="px-3 py-2 align-top">
                  <select
                    v-if="isScheduleEditable"
                    v-model.number="row.task_id"
                    class="w-full min-w-[10rem] rounded border border-gray-300 text-sm"
                  >
                    <option v-for="t in allTaskSelectOptions" :key="t.task_id" :value="t.task_id">
                      {{ t.label }}
                    </option>
                  </select>
                  <span v-else class="text-gray-900">{{ taskLabel(row.task_id) }}</span>
                  <p v-if="canEdit && isDraft && allTaskSelectOptions.length === 0" class="text-amber-800 text-xs mt-1">
                    No tasks in this project yet.
                  </p>
                </td>
                <td v-if="isScheduleEditable" class="px-3 py-2 align-top">
                  <button
                    type="button"
                    class="text-red-600 hover:text-red-800 text-xs font-medium"
                    @click="removeRow(row)"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="selectedPlannerWorkerId <= 0" class="text-sm text-gray-500 mt-2">
          Select a worker in the table header to view or edit their rows.
        </div>
        <div v-else-if="visibleRows.length === 0" class="text-sm text-gray-500 mt-2">
          <template v-if="isScheduleEditable">No rows for this worker yet — Add row.</template>
          <template v-else>No rows for this worker in this week.</template>
        </div>

        <div
          v-if="isScheduleEditable && hasAnySlotConflict"
          class="mt-2 text-sm text-amber-800 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2"
        >
          Overlapping slots for this worker — adjust day/slot before save.
        </div>
        <div
          v-if="isScheduleEditable && hasRowsOnPastDays"
          class="mt-2 text-sm text-amber-800 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2"
        >
          Some rows use a day before today — move them to today or a future day before Save or Publish.
        </div>

        <div v-if="isScheduleEditable" class="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            class="px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-45"
            :disabled="selectedPlannerWorkerId <= 0"
            @click="addRow"
          >
            Add row
          </button>
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            :disabled="isSaving || !weekMeta"
            @click="onSaveEntries"
          >
            Save draft
          </button>
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
            :disabled="isSaving || !weekMeta || saveableRowCount === 0"
            @click="onPublish"
          >
            Publish week
          </button>
        </div>

        <p v-if="isViewingPastWeek" class="text-xs text-gray-500 mt-3">
          Past week — read only. Move to this week or later to edit drafts or create new ones.
        </p>
        <p v-else-if="!isDraft && !canEdit" class="text-xs text-gray-500 mt-3">
          This week is published. Pick a worker above to review their lines.
        </p>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import axios from 'axios'
import type { ProjectTeamMember } from '@/core/utils/project-api'
import type { Task, TaskCreateUpdate } from '@/core/types/task'
import { tasksApi } from '@/core/utils/tasks-api'
import {
  fetchProjectScheduleWeek,
  ensureProjectScheduleDraft,
  replaceProjectScheduleEntries,
  publishProjectScheduleWeek,
  fetchUserSchedule,
  type ScheduleWeekMeta,
  type ScheduleWeekEntryRow,
  type ScheduleDayPart,
  type MyScheduleEntry,
} from '@/core/utils/schedule-weeks-api'
import { addDays, startOfWeekMonday, toYmd } from '@/core/utils/week-utils'

const props = defineProps<{
  projectId: number
  canEdit: boolean
  teamMembers: ProjectTeamMember[]
  tasks: Task[]
}>()

const emit = defineEmits<{
  tasksSynced: []
}>()

const weekOffset = ref(0)
const isLoading = ref(false)
const isSaving = ref(false)
const metaError = ref('')
const bannerError = ref('')
const weekMeta = ref<ScheduleWeekMeta | null>(null)
const allDraftRows = ref<ScheduleWeekEntryRow[]>([])
const selectedPlannerWorkerId = ref(0)
const externalBusyEntries = ref<MyScheduleEntry[]>([])

const dayPartOptions: { value: ScheduleDayPart; label: string }[] = [
  { value: 'am', label: 'Morning' },
  { value: 'pm', label: 'Afternoon' },
  { value: 'full', label: 'Full day' },
]

const weekMonday = computed(() => {
  const base = new Date()
  const monday = startOfWeekMonday(base)
  monday.setDate(monday.getDate() + weekOffset.value * 7)
  return monday
})

const weekStartYmd = computed(() => toYmd(weekMonday.value))

const weekEndYmd = computed(() => toYmd(addDays(weekMonday.value, 6)))

/** Local calendar today YYYY-MM-DD — no draft planning on earlier dates */
const todayYmd = computed(() => toYmd(new Date()))

const showPlannerHint = computed(() => selectedPlannerWorkerId.value > 0)

const hasExternalOtherProjectSlots = computed(() =>
  externalBusyEntries.value.some((e) => e.project_id !== props.projectId),
)

const weekRangeLabel = computed(() => {
  const end = addDays(weekMonday.value, 6)
  const a = weekMonday.value.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const b = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  return `${a} – ${b}`
})

const dayChoices = computed(() => {
  const out: { ymd: string; label: string }[] = []
  for (let i = 0; i < 7; i++) {
    const d = addDays(weekMonday.value, i)
    out.push({
      ymd: toYmd(d),
      label: d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
    })
  }
  return out
})

const workerOptions = computed(() =>
  props.teamMembers
    .filter((m) => m.user_id != null && Number(m.user_id) > 0)
    .map((m) => ({
      user_id: Number(m.user_id),
      label: (m.name ?? m.email ?? `User ${m.user_id}`) as string,
    })),
)

const allTaskSelectOptions = computed(() =>
  props.tasks.map((t) => ({
    task_id: Number(t.id),
    label: t.name || `Task ${t.id}`,
  })),
)

const isDraft = computed(() => weekMeta.value?.status === 'draft')

const workerSelectDisabled = computed(() => isDraft.value && !props.canEdit)

/** Navigated before the current ISO week — browse historical schedules read-only */
const isViewingPastWeek = computed(() => weekOffset.value < 0)

/** Editable draft rows: PM role, draft status, and not a past calendar week */
const isScheduleEditable = computed(
  () => props.canEdit && isDraft.value && !isViewingPastWeek.value,
)

const hasRowsOnPastDays = computed(
  () =>
    isScheduleEditable.value &&
    allDraftRows.value.some((r) => r.work_date && r.work_date < todayYmd.value),
)

const visibleRows = computed(() => {
  if (selectedPlannerWorkerId.value <= 0) return []
  return allDraftRows.value.filter((r) => r.user_id === selectedPlannerWorkerId.value)
})

const saveableRowCount = computed(() => allDraftRows.value.filter((r) => isRowSaveable(r)).length)

const hasAnySlotConflict = computed(() =>
  allDraftRows.value.some((r) => r.user_id > 0 && hasWorkerSlotConflict(r)),
)

const weekDayBadges = computed(() => {
  const uid = selectedPlannerWorkerId.value
  if (uid <= 0) return []
  return dayChoices.value.map((d) => {
    const isPastDay = d.ymd < todayYmd.value
    const level = isPastDay ? 'past' : dayAvailabilityLevel(uid, d.ymd)
    let badgeClass = 'border-gray-200 bg-white text-gray-800'
    let sub = ''
    if (isPastDay) {
      badgeClass = 'border-gray-200 bg-gray-100 text-gray-400 line-through decoration-gray-400'
      sub = ' · past'
    } else if (level === 'full') {
      badgeClass = 'border-gray-300 bg-gray-200 text-gray-500'
      sub = ' · full'
    } else if (level === 'partial') {
      badgeClass = 'border-amber-200 bg-amber-50 text-amber-900'
      sub = ' · partly'
    } else {
      sub = ' · free'
    }
    const shortLabel = d.label.split(',')[0] || d.label
    return { ymd: d.ymd, shortLabel, sub, badgeClass }
  })
})

function slotPartsConflict(a: ScheduleDayPart, b: ScheduleDayPart): boolean {
  if (a === b) return true
  if (a === 'full' || b === 'full') return true
  return false
}

function externalEntriesForPlanner(): MyScheduleEntry[] {
  return externalBusyEntries.value.filter((e) => e.project_id !== props.projectId)
}

function isSlotTakenByOthers(
  userId: number,
  workDate: string,
  dayPart: ScheduleDayPart,
  excludeRow: ScheduleWeekEntryRow,
): boolean {
  if (userId <= 0) return false
  const draftHit = allDraftRows.value.some(
    (r) =>
      r !== excludeRow &&
      r.user_id === userId &&
      r.work_date === workDate &&
      slotPartsConflict(r.day_part, dayPart),
  )
  if (draftHit) return true
  if (userId === selectedPlannerWorkerId.value) {
    for (const e of externalEntriesForPlanner()) {
      if (e.work_date !== workDate) continue
      if (slotPartsConflict(e.day_part, dayPart)) return true
    }
  }
  return false
}

function dayAvailabilityLevel(userId: number, ymd: string): 'free' | 'partial' | 'full' {
  if (ymd < todayYmd.value) return 'full'
  const candidates: ScheduleDayPart[] = ['am', 'pm', 'full']
  let anyFree = false
  const sentinel = {} as ScheduleWeekEntryRow
  for (const c of candidates) {
    if (!isSlotTakenByOthers(userId, ymd, c, sentinel)) anyFree = true
  }
  const partsDraft = allDraftRows.value.filter((r) => r.user_id === userId && r.work_date === ymd)
  let extCount = 0
  if (userId === selectedPlannerWorkerId.value) {
    extCount = externalEntriesForPlanner().filter((e) => e.work_date === ymd).length
  }
  const hasAny = partsDraft.length > 0 || extCount > 0
  if (!anyFree) return 'full'
  if (hasAny) return 'partial'
  return 'free'
}

function hasWorkerSlotConflict(row: ScheduleWeekEntryRow): boolean {
  if (row.user_id <= 0 || !row.work_date) return false
  return isSlotTakenByOthers(row.user_id, row.work_date, row.day_part, row)
}

function rowCanAssignAnySlotOnDay(row: ScheduleWeekEntryRow, ymd: string): boolean {
  if (ymd < todayYmd.value) return false
  const uid = row.user_id
  for (const part of ['am', 'pm', 'full'] as ScheduleDayPart[]) {
    if (!isSlotTakenByOthers(uid, ymd, part, row)) return true
  }
  return false
}

function isDayOptionDisabledForRow(row: ScheduleWeekEntryRow, ymd: string): boolean {
  if (ymd === row.work_date) return false
  if (isDraft.value && ymd < todayYmd.value) return true
  return !rowCanAssignAnySlotOnDay(row, ymd)
}

function isSlotDisabledForRow(row: ScheduleWeekEntryRow, part: ScheduleDayPart): boolean {
  return isSlotTakenByOthers(row.user_id, row.work_date, part, row)
}

function userAssignedToTask(userId: number, task: Task): boolean {
  if (userId <= 0) return false
  if (task.task_lead_id != null && uIdsEqual(task.task_lead_id, userId)) return true
  const team = task.team_members ?? []
  if (team.some((id) => uIdsEqual(id, userId))) return true
  const legacy = task.assignees ?? []
  if (legacy.some((id) => uIdsEqual(id, userId))) return true
  return false
}

function uIdsEqual(raw: number | string, userId: number): boolean {
  const n = Number(raw)
  return Number.isFinite(n) && n === userId
}

function taskById(taskId: number): Task | undefined {
  return props.tasks.find((t) => Number(t.id) === taskId)
}

function rowKey(row: ScheduleWeekEntryRow): string {
  return `${row.work_date}|${row.day_part}|${row.user_id}|${row.task_id}|${row.id ?? ''}`
}

function firstFreeSlotOnDay(userId: number, ymd: string, excludeRow: ScheduleWeekEntryRow): ScheduleDayPart | null {
  for (const part of ['am', 'pm', 'full'] as ScheduleDayPart[]) {
    if (!isSlotTakenByOthers(userId, ymd, part, excludeRow)) return part
  }
  return null
}

function onDayOrSlotChange(row: ScheduleWeekEntryRow): void {
  if (isSlotTakenByOthers(row.user_id, row.work_date, row.day_part, row)) {
    const alt = firstFreeSlotOnDay(row.user_id, row.work_date, row)
    if (alt) row.day_part = alt
  }
  syncTaskForRow(row)
}

function syncTaskForRow(row: ScheduleWeekEntryRow): void {
  const ts = allTaskSelectOptions.value
  if (!ts.some((t) => t.task_id === row.task_id)) {
    row.task_id = ts[0]?.task_id ?? 0
  }
}

function reconcileAllRows(): void {
  for (const row of allDraftRows.value) {
    syncTaskForRow(row)
  }
}

function defaultNewRow(): ScheduleWeekEntryRow {
  const uid = selectedPlannerWorkerId.value
  const row: ScheduleWeekEntryRow = {
    user_id: uid,
    task_id: 0,
    work_date: weekStartYmd.value,
    day_part: 'am',
  }
  const planDays = dayChoices.value.filter((d) => d.ymd >= todayYmd.value)
  const daysToTry = planDays.length > 0 ? planDays : dayChoices.value
  for (const d of daysToTry) {
    const slot = firstFreeSlotOnDay(uid, d.ymd, row)
    if (slot) {
      row.work_date = d.ymd
      row.day_part = slot
      break
    }
  }
  syncTaskForRow(row)
  return row
}

function isRowSaveable(row: ScheduleWeekEntryRow): boolean {
  if (row.user_id <= 0 || row.task_id <= 0) return false
  if (taskById(row.task_id) == null) return false
  if (hasWorkerSlotConflict(row)) return false
  if (row.work_date && row.work_date < todayYmd.value) return false
  return true
}

async function syncTaskRosterWithScheduleRows(rows: ScheduleWeekEntryRow[]): Promise<void> {
  const byTask = new Map<number, Set<number>>()
  for (const r of rows) {
    if (r.task_id <= 0 || r.user_id <= 0) continue
    if (!byTask.has(r.task_id)) byTask.set(r.task_id, new Set())
    byTask.get(r.task_id)!.add(r.user_id)
  }

  for (const [taskId, userIds] of byTask) {
    const task = taskById(taskId)
    if (!task) continue

    const missing: number[] = []
    for (const uid of userIds) {
      if (uid <= 0) continue
      if (!userAssignedToTask(uid, task)) missing.push(uid)
    }
    if (missing.length === 0) continue

    const nextTeam = new Set<number>()
    for (const id of task.team_members ?? []) {
      const n = Number(id)
      if (n > 0) nextTeam.add(n)
    }
    for (const id of missing) {
      if (task.task_lead_id != null && uIdsEqual(task.task_lead_id, id)) continue
      nextTeam.add(id)
    }

    const payload: Partial<TaskCreateUpdate> = {
      name: task.name,
      start_planned: task.start_planned,
      end_planned: task.end_planned,
      status: task.status,
      progress_pct: task.progress_pct || 0,
      project_id: task.project_id,
      task_lead_id: task.task_lead_id,
      team_members: [...nextTeam],
      resources: task.resources || [],
      address: task.address,
      notes: task.notes,
      milestone: task.milestone,
      milestone_type: typeof task.milestone === 'string' ? task.milestone : task.milestone_type,
    }
    if (Array.isArray(task.dependencies) && task.dependencies.length > 0) {
      payload.dependencies = task.dependencies as TaskCreateUpdate['dependencies']
    }

    await tasksApi.update(props.projectId, String(task.id), payload)
  }
}

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined
    if (data?.message && typeof data.message === 'string') return data.message
  }
  return fallback
}

function dayPartLabel(part: ScheduleDayPart): string {
  const f = dayPartOptions.find((o) => o.value === part)
  return f?.label ?? part
}

function labelForYmd(ymd: string): string {
  return dayChoices.value.find((d) => d.ymd === ymd)?.label ?? ymd
}

function taskLabel(taskId: number): string {
  const t = taskById(taskId)
  return t?.name ?? `Task ${taskId}`
}

function mapEntries(list: ScheduleWeekEntryRow[]): ScheduleWeekEntryRow[] {
  return list.map((e) => ({
    user_id: e.user_id,
    task_id: e.task_id,
    work_date: e.work_date,
    day_part: e.day_part,
    id: e.id,
  }))
}

function primePlannerWorkerFromRows(): void {
  if (selectedPlannerWorkerId.value > 0) return
  if (allDraftRows.value.length === 0) return
  selectedPlannerWorkerId.value = allDraftRows.value[0].user_id
}

async function loadExternalScheduleForPlanner(): Promise<void> {
  externalBusyEntries.value = []
  const uid = selectedPlannerWorkerId.value
  if (uid <= 0) return
  try {
    externalBusyEntries.value = await fetchUserSchedule(uid, weekStartYmd.value, weekEndYmd.value)
  } catch {
    externalBusyEntries.value = []
  }
}

function addRow(): void {
  if (!isScheduleEditable.value || selectedPlannerWorkerId.value <= 0) return
  allDraftRows.value.push(defaultNewRow())
}

function removeRow(row: ScheduleWeekEntryRow): void {
  if (!isScheduleEditable.value) return
  const i = allDraftRows.value.indexOf(row)
  if (i >= 0) allDraftRows.value.splice(i, 1)
}

async function loadWeek(): Promise<void> {
  metaError.value = ''
  bannerError.value = ''
  isLoading.value = true
  try {
    const { week, entries } = await fetchProjectScheduleWeek(props.projectId, weekStartYmd.value)
    weekMeta.value = week
    allDraftRows.value = mapEntries(entries)
    reconcileAllRows()
    primePlannerWorkerFromRows()
    await loadExternalScheduleForPlanner()
  } catch {
    weekMeta.value = null
    allDraftRows.value = []
    metaError.value = 'Could not load schedule (API unavailable or no access).'
  } finally {
    isLoading.value = false
  }
}

async function onCreateDraft(): Promise<void> {
  if (isViewingPastWeek.value) {
    bannerError.value = 'Drafts cannot be created for past weeks.'
    return
  }
  isSaving.value = true
  bannerError.value = ''
  try {
    const { week, entries } = await ensureProjectScheduleDraft(props.projectId, weekStartYmd.value)
    weekMeta.value = week
    allDraftRows.value = mapEntries(entries)
    reconcileAllRows()
    primePlannerWorkerFromRows()
    await loadExternalScheduleForPlanner()
  } catch {
    bannerError.value = 'Failed to create draft. Check permissions or API.'
  } finally {
    isSaving.value = false
  }
}

async function onSaveEntries(): Promise<void> {
  if (!isScheduleEditable.value || !weekMeta.value || weekMeta.value.status !== 'draft') return
  if (hasAnySlotConflict.value) {
    bannerError.value = 'Resolve overlapping slots before saving.'
    return
  }
  if (hasRowsOnPastDays.value) {
    bannerError.value = 'Move or remove rows dated before today — planning is forward-only.'
    return
  }
  const valid = allDraftRows.value.filter((r) => isRowSaveable(r))
  if (valid.length === 0) {
    bannerError.value = 'No valid rows to save. Pick worker, day, slot, and task.'
    return
  }
  isSaving.value = true
  bannerError.value = ''
  try {
    await syncTaskRosterWithScheduleRows(valid)
    emit('tasksSynced')
    const { week, entries } = await replaceProjectScheduleEntries(
      props.projectId,
      weekMeta.value.id,
      valid,
    )
    if (week) weekMeta.value = week
    allDraftRows.value = mapEntries(entries)
    reconcileAllRows()
  } catch (err) {
    bannerError.value = getApiErrorMessage(
      err,
      'Save failed. If the week is published, create a new draft week on the server.',
    )
  } finally {
    isSaving.value = false
  }
}

async function onPublish(): Promise<void> {
  if (!isScheduleEditable.value || !weekMeta.value || weekMeta.value.status !== 'draft') return
  if (hasAnySlotConflict.value) {
    bannerError.value = 'Resolve overlapping slots before publishing.'
    return
  }
  if (hasRowsOnPastDays.value) {
    bannerError.value = 'Move or remove rows dated before today before publishing.'
    return
  }
  const valid = allDraftRows.value.filter((r) => isRowSaveable(r))
  if (valid.length === 0) {
    bannerError.value = 'Add at least one valid row before publishing.'
    return
  }
  isSaving.value = true
  bannerError.value = ''
  const weekStartSnap = weekMeta.value.week_start
  try {
    await syncTaskRosterWithScheduleRows(valid)
    emit('tasksSynced')
    const { week, entries } = await replaceProjectScheduleEntries(
      props.projectId,
      weekMeta.value.id,
      valid,
    )
    if (week) weekMeta.value = week
    allDraftRows.value = mapEntries(entries)
    reconcileAllRows()
    const published = await publishProjectScheduleWeek(
      props.projectId,
      weekMeta.value.id,
      weekStartSnap,
    )
    if (published) weekMeta.value = published
  } catch (err) {
    bannerError.value = getApiErrorMessage(err, 'Publish failed.')
  } finally {
    isSaving.value = false
  }
}

watch(
  () => props.projectId,
  () => {
    loadWeek()
  },
)

watch(
  () => props.tasks,
  () => {
    reconcileAllRows()
  },
  { deep: true },
)

watch(weekOffset, () => {
  loadWeek()
})

watch([selectedPlannerWorkerId, weekStartYmd], () => {
  void loadExternalScheduleForPlanner()
})

onMounted(() => {
  loadWeek()
})
</script>

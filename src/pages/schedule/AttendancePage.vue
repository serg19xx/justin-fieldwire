<template>
  <div class="min-h-screen bg-gray-100 pb-10">
    <div class="border-b border-gray-200 bg-white">
      <div class="max-w-6xl mx-auto px-4 py-3">
        <h1 class="text-lg font-semibold text-gray-900">Attendance</h1>
        <p class="mt-1 text-sm text-gray-600 max-w-3xl">
          Start day / End day of the field crew against their shift. On-time starts are paid from the scheduled
          start, days without End day close at the scheduled end, overtime waits for your approval. Fix a day,
          accept it as it is, or lock it for payroll.
        </p>
      </div>
    </div>

    <div class="max-w-6xl mx-auto px-4 pt-4 space-y-3">
      <div class="flex flex-wrap items-end gap-2 rounded-xl border border-gray-200 bg-white p-3">
        <button
          v-for="preset in RANGE_PRESETS"
          :key="preset.key"
          type="button"
          class="rounded-lg border px-3 py-1.5 text-sm font-medium"
          :class="activePreset === preset.key ? 'border-orange-400 bg-orange-50 text-orange-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50'"
          @click="applyPreset(preset.key)"
        >
          {{ preset.label }}
        </button>
        <label class="text-xs text-gray-500">
          From
          <input v-model="fromYmd" type="date" class="block rounded border border-gray-300 px-2 py-1 text-sm" @change="onRangeInput" />
        </label>
        <label class="text-xs text-gray-500">
          To
          <input v-model="toYmd" type="date" class="block rounded border border-gray-300 px-2 py-1 text-sm" @change="onRangeInput" />
        </label>
        <label class="ml-auto flex items-center gap-2 text-sm text-gray-700">
          <input v-model="isIssuesOnly" type="checkbox" class="rounded border-gray-300" />
          Only days with issues
        </label>
      </div>

      <div v-if="loadError" class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
        {{ loadError }}
      </div>
      <div v-if="!isLoading && report && !report.attendance_available" class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        Attendance rules are not enabled on the server yet.
      </div>

      <div v-if="isLoading" class="flex justify-center py-12">
        <div class="animate-spin w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>

      <template v-else-if="report">
        <p v-if="groups.length === 0" class="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500">
          {{ isIssuesOnly ? 'No attendance issues in this period.' : 'Nobody was scheduled or clocked in in this period.' }}
        </p>

        <section v-for="group in groups" :key="group.ymd" class="space-y-2">
          <h2 class="pt-2 text-sm font-semibold text-gray-700">{{ formatWorkYmdLabel(group.ymd) }}</h2>

          <article
            v-for="entry in group.entries"
            :key="entryKey(entry)"
            class="rounded-xl border bg-white p-3 shadow-sm"
            :class="entry.issues.length > 0 ? 'border-amber-300' : 'border-gray-200'"
          >
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="font-semibold text-gray-900">{{ entry.worker_name }}</p>
                <p class="text-xs text-gray-600 tabular-nums">
                  <template v-if="entry.shift">
                    Shift {{ entry.shift.start_time }}–{{ entry.shift.end_time }}
                    <span v-if="entry.shift.source === 'tasks'" class="text-gray-400">(from tasks)</span>
                  </template>
                  <template v-else>Not scheduled</template>
                  <template v-if="entry.day?.extended_open"> · Working late until done</template>
                  <template v-else-if="entry.day?.extended_until"> · Working late until {{ entry.day.extended_until }}</template>
                </p>
              </div>
              <span
                v-if="entry.day?.locked"
                class="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
              >
                Locked
              </span>
            </div>

            <ul v-if="entry.sites.length > 0" class="mt-2 space-y-0.5 text-xs text-gray-700">
              <li v-for="site in entry.sites" :key="site.project_id">
                <span class="font-medium">{{ site.project_name || `Project #${site.project_id}` }}</span>
                <span v-if="site.expected_start_time" class="tabular-nums text-gray-500">
                  · {{ site.expected_start_time }}–{{ site.expected_end_time || '—' }}
                </span>
                <span v-if="site.distance_km" class="text-gray-500"> · {{ site.distance_km }} km</span>
                <template v-if="entry.sites.length > 1 && !site.is_first">
                  <span v-if="site.arrived_at" class="text-emerald-700">
                    · arrived {{ formatClock(site.arrived_at) }}
                    <template v-if="site.arrival_distance_m != null">({{ formatDistance(site.arrival_distance_m) }} from site)</template>
                  </span>
                  <span v-else class="text-amber-700"> · arrival not confirmed</span>
                </template>
              </li>
            </ul>

            <ul v-if="entry.issues.length > 0" class="mt-2 flex flex-wrap gap-1.5">
              <li
                v-for="issue in entry.issues"
                :key="issue.code + issue.label"
                class="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900"
              >
                {{ issue.label }}
              </li>
            </ul>

            <div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div v-for="phase in PHASES" :key="phase">
                <p class="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                  Paid {{ phase === 'start' ? 'start' : 'end' }}
                </p>
                <input
                  v-model="draftOf(entry)[phase]"
                  type="time"
                  class="mt-0.5 w-full rounded border border-gray-300 px-1 py-1 text-sm tabular-nums disabled:bg-gray-50"
                  :disabled="!isEditable(entry)"
                />
                <p class="mt-0.5 text-[11px] text-gray-500 tabular-nums">
                  Phone: {{ formatClock(punchOf(entry, phase)) }}
                  <span v-if="sourceOf(entry, phase)" :class="sourceOf(entry, phase) === 'pm' ? 'text-amber-700' : 'text-blue-700'">
                    · {{ sourceOf(entry, phase) === 'pm' ? 'Edited' : 'Auto' }}
                  </span>
                </p>
              </div>
              <div class="col-span-2">
                <p class="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                  Payroll note
                  <span v-if="entry.day?.hours != null" class="normal-case text-gray-700"> · {{ entry.day.hours }} h paid</span>
                </p>
                <textarea
                  v-model="draftOf(entry).note"
                  rows="2"
                  class="mt-0.5 w-full rounded border border-gray-300 px-2 py-1 text-xs disabled:bg-gray-50"
                  :disabled="!isEditable(entry)"
                  placeholder="What happened this day"
                />
              </div>
            </div>

            <div class="mt-2 flex flex-wrap items-center gap-2">
              <template v-if="isEditable(entry)">
                <button type="button" :class="BUTTON_PRIMARY" :disabled="busyKey !== ''" @click="onSave(entry)">Save</button>
                <button
                  v-if="hasIssue(entry, 'overtime')"
                  type="button"
                  :class="BUTTON_SECONDARY"
                  :disabled="busyKey !== ''"
                  title="Pay until the phone End day"
                  @click="onApproveOvertime(entry)"
                >
                  Approve overtime
                </button>
                <button
                  type="button"
                  :class="BUTTON_SECONDARY"
                  :disabled="busyKey !== ''"
                  title="Uses the Paid end time above"
                  @click="onLeftEarly(entry)"
                >
                  Left early at paid end
                </button>
                <button
                  v-if="entry.issues.length > 0"
                  type="button"
                  :class="BUTTON_SECONDARY"
                  :disabled="busyKey !== ''"
                  title="Keep the times as they are and clear the issues"
                  @click="onAccept(entry)"
                >
                  Accept as is
                </button>
              </template>
              <button
                v-if="entry.work_date <= report.today"
                type="button"
                :class="BUTTON_SECONDARY"
                :disabled="busyKey !== ''"
                @click="onToggleLock(entry)"
              >
                {{ entry.day?.locked ? 'Unlock day' : 'Lock day' }}
              </button>
              <span v-if="busyKey === entryKey(entry)" class="text-xs text-gray-500">Saving…</span>
              <span v-if="errorByKey[entryKey(entry)]" class="text-xs text-red-700">{{ errorByKey[entryKey(entry)] }}</span>
            </div>
          </article>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchAttendance, type AttendanceEntry, type AttendanceIssueCode, type AttendanceReport } from '@/core/utils/attendance-api'
import { savePayrollDay, setPayrollDayLocked, type PayrollDayInput, type PayrollTimeSource } from '@/core/utils/payroll-days-api'
import { getApiErrorMessage } from '@/core/utils/api'
import { addDaysToWorkYmd, formatWorkYmdLabel, parseWorkYmd, todayWorkYmd } from '@/core/utils/work-day'

type Phase = 'start' | 'end'
type PresetKey = 'today' | 'yesterday' | 'week'

interface DayDraft {
  start: string
  end: string
  note: string
}

const PHASES: readonly Phase[] = ['start', 'end']
const RANGE_PRESETS: ReadonlyArray<{ key: PresetKey; label: string }> = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'week', label: 'Last 7 days' },
]
const BUTTON_PRIMARY =
  'rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-50'
const BUTTON_SECONDARY =
  'rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50'

const route = useRoute()
const router = useRouter()

const initialDate = parseWorkYmd(route.query.date)
const fromYmd = ref(initialDate ?? todayWorkYmd())
const toYmd = ref(initialDate ?? todayWorkYmd())
const isIssuesOnly = ref(true)
const report = ref<AttendanceReport | null>(null)
const isLoading = ref(false)
const loadError = ref('')
const busyKey = ref('')
const errorByKey = reactive<Record<string, string>>({})
const drafts = reactive<Record<string, DayDraft>>({})

const activePreset = computed<PresetKey | null>(() => {
  const today = todayWorkYmd()
  const yesterday = addDaysToWorkYmd(today, -1)
  if (fromYmd.value === today && toYmd.value === today) return 'today'
  if (fromYmd.value === yesterday && toYmd.value === yesterday) return 'yesterday'
  if (fromYmd.value === addDaysToWorkYmd(today, -6) && toYmd.value === today) return 'week'
  return null
})

const groups = computed(() => {
  const byDate = new Map<string, AttendanceEntry[]>()
  for (const entry of report.value?.entries ?? []) {
    if (isIssuesOnly.value && entry.issues.length === 0) continue
    const list = byDate.get(entry.work_date) ?? []
    list.push(entry)
    byDate.set(entry.work_date, list)
  }
  return [...byDate.entries()].map(([ymd, entries]) => ({ ymd, entries }))
})

function entryKey(entry: AttendanceEntry): string {
  return `${entry.user_id}|${entry.work_date}`
}

function toHm(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatClock(iso: string | null): string {
  return toHm(iso) || '—'
}

function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`
}

function punchOf(entry: AttendanceEntry, phase: Phase): string | null {
  return (phase === 'start' ? entry.day?.work_start_at : entry.day?.work_end_at) ?? null
}

function sourceOf(entry: AttendanceEntry, phase: Phase): PayrollTimeSource | null {
  const day = entry.day
  if (!day) return null
  const adjusted = phase === 'start' ? day.adjusted_start_time : day.adjusted_end_time
  const source = phase === 'start' ? day.start_source : day.end_source
  return adjusted ? source : null
}

function hasIssue(entry: AttendanceEntry, code: AttendanceIssueCode): boolean {
  return entry.issues.some((i) => i.code === code)
}

function isEditable(entry: AttendanceEntry): boolean {
  return !entry.day?.locked
}

function draftFromEntry(entry: AttendanceEntry): DayDraft {
  const day = entry.day
  return {
    start: day?.adjusted_start_time ?? toHm(day?.work_start_at ?? null),
    end: day?.adjusted_end_time ?? toHm(day?.work_end_at ?? null),
    note: day?.payroll_note ?? '',
  }
}

function draftOf(entry: AttendanceEntry): DayDraft {
  return (drafts[entryKey(entry)] ??= draftFromEntry(entry))
}

/** A paid time equal to the phone punch is stored as "no correction". */
function adjustedFor(entry: AttendanceEntry, phase: Phase, value: string): string | null {
  const v = value.trim()
  if (v === '') return null
  return v === toHm(punchOf(entry, phase)) ? null : v
}

function baseInput(entry: AttendanceEntry): PayrollDayInput {
  const draft = draftOf(entry)
  const note = draft.note.trim()
  return {
    adjusted_start_time: adjustedFor(entry, 'start', draft.start),
    adjusted_end_time: adjustedFor(entry, 'end', draft.end),
    payroll_note: note === '' ? null : note,
  }
}

async function runAction(entry: AttendanceEntry, action: () => Promise<unknown>): Promise<void> {
  const key = entryKey(entry)
  busyKey.value = key
  errorByKey[key] = ''
  try {
    await action()
    delete drafts[key]
    await load(false)
  } catch (err) {
    errorByKey[key] = getApiErrorMessage(err, 'Could not save the day.')
  } finally {
    busyKey.value = ''
  }
}

function onSave(entry: AttendanceEntry): void {
  void runAction(entry, () => savePayrollDay(entry.user_id, entry.work_date, baseInput(entry)))
}

function onApproveOvertime(entry: AttendanceEntry): void {
  void runAction(entry, () =>
    savePayrollDay(entry.user_id, entry.work_date, { ...baseInput(entry), adjusted_end_time: null }),
  )
}

function onLeftEarly(entry: AttendanceEntry): void {
  if (draftOf(entry).end.trim() === '') {
    errorByKey[entryKey(entry)] = 'Enter the time the worker left in Paid end first.'
    return
  }
  const input = baseInput(entry)
  void runAction(entry, () =>
    savePayrollDay(entry.user_id, entry.work_date, {
      ...input,
      adjusted_end_time: draftOf(entry).end.trim(),
      early_leave: true,
    }),
  )
}

function onAccept(entry: AttendanceEntry): void {
  void runAction(entry, () => savePayrollDay(entry.user_id, entry.work_date, { ...baseInput(entry), reviewed: true }))
}

function onToggleLock(entry: AttendanceEntry): void {
  void runAction(entry, () => setPayrollDayLocked(entry.user_id, entry.work_date, !entry.day?.locked))
}

function applyPreset(key: PresetKey): void {
  const today = todayWorkYmd()
  fromYmd.value = key === 'today' ? today : key === 'yesterday' ? addDaysToWorkYmd(today, -1) : addDaysToWorkYmd(today, -6)
  toYmd.value = key === 'yesterday' ? fromYmd.value : today
  void load()
}

function onRangeInput(): void {
  if (parseWorkYmd(fromYmd.value) && parseWorkYmd(toYmd.value)) void load()
}

async function load(showSpinner = true): Promise<void> {
  if (fromYmd.value > toYmd.value) {
    loadError.value = 'From must be on or before To.'
    return
  }
  if (showSpinner) isLoading.value = true
  loadError.value = ''
  try {
    const next = await fetchAttendance(fromYmd.value, toYmd.value)
    if (showSpinner) {
      for (const key of Object.keys(drafts)) delete drafts[key]
    }
    for (const entry of next.entries) {
      drafts[entryKey(entry)] ??= draftFromEntry(entry)
    }
    report.value = next
  } catch (err) {
    loadError.value = getApiErrorMessage(err, 'Could not load attendance.')
  } finally {
    isLoading.value = false
  }
}

watch([fromYmd, toYmd], ([from, to]) => {
  const query = from === to ? { date: from } : {}
  void router.replace({ query })
})

onMounted(() => {
  void load()
})
</script>

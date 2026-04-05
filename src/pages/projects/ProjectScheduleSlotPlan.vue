<template>
  <div class="min-h-screen bg-gray-50 px-4 py-6 max-w-3xl mx-auto w-full">
    <nav class="mb-4" aria-label="Back">
      <RouterLink
        :to="{ path: `/projects/${projectId}/detail`, query: { section: 'schedule' } }"
        class="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to schedule
      </RouterLink>
    </nav>

    <div v-if="loadError" class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 mb-4">
      {{ loadError }}
    </div>

    <div v-else-if="isLoading" class="flex justify-center py-16">
      <div class="animate-spin w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full" />
    </div>

    <template v-else-if="targetEntry && weekMeta">
      <header class="mb-6">
        <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Slot assignment</p>
        <h1 class="text-xl font-semibold text-gray-900 mt-1">{{ taskName }}</h1>
        <dl class="mt-3 text-sm text-gray-600 space-y-1">
          <div class="flex flex-wrap gap-x-2">
            <dt class="font-medium text-gray-700">Worker</dt>
            <dd>{{ workerLabel }}</dd>
          </div>
          <div class="flex flex-wrap gap-x-2">
            <dt class="font-medium text-gray-700">Day</dt>
            <dd>{{ dayLabel }}</dd>
          </div>
          <div class="flex flex-wrap gap-x-2">
            <dt class="font-medium text-gray-700">Slot</dt>
            <dd>{{ dayPartLabel(targetEntry.day_part) }}</dd>
          </div>
          <div class="flex flex-wrap gap-x-2">
            <dt class="font-medium text-gray-700">Week</dt>
            <dd>Starts {{ weekMeta.week_start }} · {{ weekMeta.status === 'published' ? 'Published' : 'Draft' }}</dd>
          </div>
        </dl>
      </header>

      <section class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <label for="assignment-note" class="block text-sm font-medium text-gray-800 mb-2">
          Instructions for this slot
        </label>
        <textarea
          id="assignment-note"
          v-model="noteDraft"
          rows="10"
          :disabled="!canEditNote"
          :maxlength="assignmentNoteMaxChars"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-600"
          :class="noteDraft.length > assignmentNoteMaxChars ? 'border-red-400' : ''"
          placeholder="What the worker should do for this day and slot…"
        />
        <p class="text-xs text-gray-500 mt-1">{{ noteDraft.length }} / {{ assignmentNoteMaxChars }}</p>
        <p v-if="!canEditNote" class="text-sm text-amber-800 mt-3 rounded-md bg-amber-50 border border-amber-100 px-3 py-2">
          <template v-if="weekMeta.status === 'published'">This week is published — reopen it as a draft on the schedule to edit text.</template>
          <template v-else-if="isEntryDayPast">This calendar day is before today — move the row to today or later on the schedule to edit here.</template>
          <template v-else>You do not have permission to edit this project schedule.</template>
        </p>
      </section>

      <section
        class="mt-6 rounded-xl border border-dashed border-gray-300 bg-gray-50/80 p-4 text-sm text-gray-600"
        aria-label="Future: documents"
      >
        <span class="font-medium text-gray-800">Documents</span>
        <p class="mt-1 text-xs">Links to drawings and shared folders will be added here in a later step.</p>
      </section>

      <div v-if="saveError" class="mt-4 text-sm text-red-700">{{ saveError }}</div>

      <div class="mt-6 flex flex-wrap gap-2">
        <button
          v-if="canSave"
          type="button"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          :disabled="isSaving || noteDraft.length > assignmentNoteMaxChars"
          @click="onSave"
        >
          Save instructions
        </button>
        <RouterLink
          :to="{ path: `/projects/${projectId}/detail`, query: { section: 'schedule' } }"
          class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </RouterLink>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '@/core/stores/auth'
import {
  fetchProjectScheduleWeek,
  replaceProjectScheduleEntries,
  ASSIGNMENT_NOTE_MAX_CHARS,
  type ScheduleWeekEntryRow,
  type ScheduleWeekMeta,
  type ScheduleDayPart,
} from '@/core/utils/schedule-weeks-api'
import { tasksApi } from '@/core/utils/tasks-api'
import type { Task } from '@/core/types/task'
import { toYmd } from '@/core/utils/week-utils'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const projectId = computed(() => Number(route.params.id))
const entryId = computed(() => Number(route.params.entryId))
const weekStartQuery = computed(() => {
  const w = route.query.week_start
  return typeof w === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(w) ? w : ''
})

const assignmentNoteMaxChars = ASSIGNMENT_NOTE_MAX_CHARS

const isLoading = ref(true)
const loadError = ref('')
const saveError = ref('')
const isSaving = ref(false)

const weekMeta = ref<ScheduleWeekMeta | null>(null)
const allEntries = ref<ScheduleWeekEntryRow[]>([])
const tasks = ref<Task[]>([])

const noteDraft = ref('')

const canEditSchedule = computed(() => {
  const code = authStore.currentUser?.role_code
  return code === 'project_manager' || code === 'admin'
})

const targetEntry = computed(() => {
  const id = entryId.value
  if (!Number.isFinite(id) || id <= 0) return null
  return allEntries.value.find((e) => e.id === id) ?? null
})

const isEntryDayPast = computed(() => {
  const e = targetEntry.value
  if (!e?.work_date) return false
  const today = toYmd(new Date())
  return e.work_date < today
})

const canEditNote = computed(
  () =>
    canEditSchedule.value &&
    weekMeta.value?.status === 'draft' &&
    !isEntryDayPast.value,
)

const canSave = computed(() => canEditNote.value && weekMeta.value != null)

const taskName = computed(() => {
  const e = targetEntry.value
  if (!e) return '—'
  const t = tasks.value.find((x) => Number(x.id) === e.task_id)
  return t?.name?.trim() || `Task #${e.task_id}`
})

const workerLabel = computed(() => {
  const e = targetEntry.value
  if (!e) return '—'
  return `User #${e.user_id}`
})

const dayLabel = computed(() => {
  const y = targetEntry.value?.work_date
  if (!y) return '—'
  try {
    return new Date(`${y}T12:00:00`).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return y
  }
})

function dayPartLabel(part: ScheduleDayPart): string {
  if (part === 'am') return 'Morning'
  if (part === 'pm') return 'Afternoon'
  return 'Full day'
}

function mapLoadedEntries(list: ScheduleWeekEntryRow[]): ScheduleWeekEntryRow[] {
  return list.map((e) => ({
    user_id: e.user_id,
    task_id: e.task_id,
    work_date: e.work_date,
    day_part: e.day_part,
    id: e.id,
    assignment_note: e.assignment_note == null ? '' : String(e.assignment_note),
  }))
}

async function loadPage(): Promise<void> {
  loadError.value = ''
  isLoading.value = true
  const pid = projectId.value
  const wid = entryId.value
  const ws = weekStartQuery.value
  if (!pid || !Number.isFinite(wid) || wid <= 0) {
    loadError.value = 'Invalid project or schedule entry.'
    isLoading.value = false
    return
  }
  if (!ws) {
    loadError.value = 'Missing week_start in the link. Open the assignment from the schedule table again.'
    isLoading.value = false
    return
  }
  try {
    const [weekRes, taskRes] = await Promise.all([
      fetchProjectScheduleWeek(pid, ws),
      tasksApi.getAll(pid, 1, 500),
    ])
    weekMeta.value = weekRes.week
    allEntries.value = mapLoadedEntries(weekRes.entries)
    tasks.value = taskRes.tasks
    const hit = allEntries.value.find((e) => e.id === wid)
    if (!hit) {
      loadError.value = 'This schedule row was not found. It may have been removed — return to the schedule.'
      weekMeta.value = null
    } else {
      noteDraft.value = typeof hit.assignment_note === 'string' ? hit.assignment_note : ''
    }
  } catch (e) {
    loadError.value = getApiErrorMessage(e, 'Could not load schedule or project data.')
    weekMeta.value = null
    allEntries.value = []
  } finally {
    isLoading.value = false
  }
}

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined
    if (data?.message && typeof data.message === 'string') return data.message
  }
  return fallback
}

async function onSave(): Promise<void> {
  if (!canSave.value || !weekMeta.value || !targetEntry.value) return
  const id = entryId.value
  if (noteDraft.value.length > assignmentNoteMaxChars) return
  saveError.value = ''
  isSaving.value = true
  try {
    const next = allEntries.value.map((row) => {
      if (row.id !== id) return { ...row, assignment_note: row.assignment_note ?? '' }
      return { ...row, assignment_note: noteDraft.value }
    })
    const { week, entries } = await replaceProjectScheduleEntries(projectId.value, weekMeta.value.id, next)
    if (week) weekMeta.value = week
    allEntries.value = mapLoadedEntries(entries)
    const hit = allEntries.value.find((e) => e.id === id)
    if (hit) noteDraft.value = typeof hit.assignment_note === 'string' ? hit.assignment_note : ''
    await router.push({ path: `/projects/${projectId.value}/detail`, query: { section: 'schedule' } })
  } catch (e) {
    saveError.value = getApiErrorMessage(e, 'Save failed. Check that the week is still a draft.')
  } finally {
    isSaving.value = false
  }
}

watch(
  () => [route.params.id, route.params.entryId, route.query.week_start] as const,
  () => {
    void loadPage()
  },
)

onMounted(() => {
  void loadPage()
})
</script>

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

        <div class="mt-4 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Assigned worker</h2>
          <p class="mt-1.5 text-base font-semibold text-gray-900">{{ workerInfo.displayName }}</p>
          <p v-if="workerInfo.jobTitle" class="mt-1 text-sm text-gray-600">{{ workerInfo.jobTitle }}</p>
          <p v-if="workerInfo.projectRole" class="mt-1 text-xs text-gray-500">
            <span class="font-medium text-gray-600">Project role:</span>
            {{ formatRoleInProject(workerInfo.projectRole) }}
          </p>
          <p
            v-if="!workerInfo.jobTitle && !workerInfo.projectRole && workerInfo.isFallbackName"
            class="mt-1 text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-md px-2 py-1.5"
          >
            Name and role were not found in the project team list — showing user id only. Check that this person is on the project team.
          </p>
        </div>

        <dl class="mt-4 text-sm text-gray-600 space-y-2">
          <div class="flex flex-wrap gap-x-2 gap-y-0.5">
            <dt class="font-medium text-gray-700 shrink-0">Day</dt>
            <dd>{{ dayLabel }}</dd>
          </div>
          <div class="flex flex-wrap gap-x-2 gap-y-0.5">
            <dt class="font-medium text-gray-700 shrink-0">Slot</dt>
            <dd>{{ dayPartLabel(targetEntry.day_part) }}</dd>
          </div>
          <div class="flex flex-wrap gap-x-2 gap-y-0.5">
            <dt class="font-medium text-gray-700 shrink-0">Schedule week</dt>
            <dd>
              Week starting {{ weekMeta.week_start }}
              <span class="text-gray-400">·</span>
              {{ weekMeta.status === 'published' ? 'Published' : 'Draft' }}
            </dd>
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

      <section class="mt-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm" aria-label="Slot documents">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            class="self-end sm:self-auto px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            :disabled="!canUploadSetupDocuments || isUploadingSetupDocument"
            @click="openUploadDialog"
          >
            <template v-if="isUploadingSetupDocument">Uploading…</template>
            <template v-else>
              <span class="sm:hidden">Upload</span>
              <span class="hidden sm:inline">Upload setup doc</span>
            </template>
          </button>
          <div>
            <h2 class="text-sm font-semibold text-gray-800">Documents</h2>
            <p class="text-xs text-gray-500 mt-1">
              Execution logs / task name / schedule date / task setup|task completed.
            </p>
            <p class="text-xs text-gray-500">Allowed formats: images and PDF.</p>
            <p class="text-xs text-gray-500">Max file size: 20 MB.</p>
          </div>
          <input
            ref="dialogFileInputRef"
            type="file"
            :accept="scheduleSlotAllowedUploadAccept"
            class="hidden"
            @change="onDialogFilePicked"
          />
        </div>

        <div v-if="isDocumentsLoading" class="py-4 text-sm text-gray-500">Loading documents…</div>
        <div v-else class="mt-4 grid gap-4 md:grid-cols-2">
          <div class="rounded-lg border border-gray-200 p-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">Task setup (PM)</p>
            <ul v-if="setupDocuments.length > 0" class="mt-2 space-y-2">
              <li
                v-for="doc in setupDocuments"
                :key="doc.id"
                class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-gray-100 px-2 py-1.5"
              >
                <button
                  type="button"
                  class="text-left min-w-0 overflow-hidden"
                  @click="openOrDownloadSlotDocument('setup', doc)"
                >
                  <p class="text-sm text-gray-900 truncate">
                    {{ getFileIcon(doc.mime_type, doc.file_name).icon }}
                    {{ doc.display_name || doc.original_name || doc.file_name }}
                  </p>
                  <p class="text-[11px] text-gray-500">
                    {{ formatFileSize(doc.file_size) }} · {{ formatUploadedAt(doc.uploaded_at) }}
                  </p>
                </button>
                <div v-if="canUploadSetupDocuments" class="flex flex-col items-end gap-1">
                  <button
                    type="button"
                    class="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
                    :disabled="isDeletingSetupDocument(doc.id)"
                    @click="openEditDialog(doc)"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    class="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                    :disabled="isDeletingSetupDocument(doc.id)"
                    @click="deleteSetupDocument(doc)"
                  >
                    {{ isDeletingSetupDocument(doc.id) ? 'Deleting…' : 'Delete' }}
                  </button>
                </div>
              </li>
            </ul>
            <p v-else class="mt-2 text-xs text-gray-500">No setup documents yet.</p>
          </div>

          <div class="rounded-lg border border-gray-200 p-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">Task completed (workers)</p>
            <ul v-if="completedDocuments.length > 0" class="mt-2 space-y-2">
              <li
                v-for="doc in completedDocuments"
                :key="doc.id"
                class="rounded-md border border-gray-100 px-2 py-1.5"
              >
                <button
                  type="button"
                  class="text-left w-full min-w-0 overflow-hidden"
                  @click="openOrDownloadSlotDocument('completed', doc)"
                >
                  <p class="text-sm text-gray-900 truncate">
                    {{ getFileIcon(doc.mime_type, doc.file_name).icon }}
                    {{ doc.display_name || doc.original_name || doc.file_name }}
                  </p>
                  <p class="text-[11px] text-gray-500">
                    {{ formatFileSize(doc.file_size) }} · {{ formatUploadedAt(doc.uploaded_at) }}
                  </p>
                </button>
              </li>
            </ul>
            <p v-else class="mt-2 text-xs text-gray-500">No worker completion documents yet.</p>
          </div>
        </div>
      </section>

      <div
        v-if="isPreviewModalOpen"
        class="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-3 py-4"
        @click.self="closePreviewModal"
      >
        <div class="relative h-full max-h-[92vh] w-full max-w-5xl rounded-xl bg-white p-3 sm:p-4">
          <div class="mb-3 flex items-center justify-between gap-3 border-b border-gray-200 pb-2">
            <p class="min-w-0 truncate text-sm font-medium text-gray-800">
              {{ previewFileName || 'Preview' }}
            </p>
            <button
              type="button"
              class="shrink-0 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              @click="closePreviewModal"
            >
              Close
            </button>
          </div>
          <div class="h-[calc(92vh-72px)] overflow-hidden">
            <img
              v-if="previewMimeType.startsWith('image/') && previewBlobUrl"
              :src="previewBlobUrl"
              :alt="previewFileName || 'Preview image'"
              class="h-full w-full object-contain"
            />
            <iframe
              v-else-if="isPdfPreview"
              :src="previewBlobUrl"
              title="PDF preview"
              class="h-full w-full rounded-md border border-gray-200"
            />
            <div v-else class="flex h-full items-center justify-center text-sm text-gray-500">
              Preview is not available for this file type.
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="isFileDialogOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
        @click.self="closeFileDialog"
      >
        <div class="w-full max-w-md rounded-xl bg-white p-4 shadow-xl">
          <h3 class="text-base font-semibold text-gray-900">
            {{ fileDialogMode === 'upload' ? 'Upload setup document' : 'Edit document name' }}
          </h3>

          <div class="mt-3">
            <label for="slot-doc-name" class="block text-xs font-medium text-gray-700">
              File name for users (optional)
            </label>
            <input
              id="slot-doc-name"
              v-model.trim="setupDocumentDisplayNameDraft"
              type="text"
              maxlength="160"
              class="mt-1 w-full rounded-md border border-gray-300 px-2 py-2 text-sm text-gray-800"
              placeholder="Leave empty to use original file name"
            />
          </div>

          <template v-if="fileDialogMode === 'upload'">
            <div class="mt-3">
              <button
                type="button"
                class="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                @click="requestDialogFilePick"
              >
                Choose file
              </button>
              <p v-if="selectedUploadFileName" class="mt-2 text-xs text-gray-600 truncate">
                {{ selectedUploadFileName }}
              </p>
            </div>
          </template>

          <template v-else-if="editingDocument">
            <div class="mt-3 rounded-md border border-gray-200 bg-gray-50 p-2 text-xs text-gray-600">
              <p><span class="font-medium text-gray-700">Disk name:</span> {{ editingDocument.file_name }}</p>
              <p><span class="font-medium text-gray-700">Type:</span> {{ editingDocument.mime_type || '—' }}</p>
              <p><span class="font-medium text-gray-700">Size:</span> {{ formatFileSize(editingDocument.file_size) }}</p>
            </div>
          </template>

          <div class="mt-4 flex justify-end gap-2">
            <button
              type="button"
              class="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              :disabled="isFileDialogSubmitting"
              @click="closeFileDialog"
            >
              Cancel
            </button>
            <button
              v-if="fileDialogMode === 'upload'"
              type="button"
              class="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              :disabled="isFileDialogSubmitting || !selectedUploadFile"
              @click="submitUploadFromDialog"
            >
              {{ isFileDialogSubmitting ? 'Uploading…' : 'Upload' }}
            </button>
            <button
              v-else
              type="button"
              class="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              :disabled="isFileDialogSubmitting || !editingDocument"
              @click="saveDocumentNameFromDialog"
            >
              {{ isFileDialogSubmitting ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="documentsSuccess" class="mt-4 text-sm text-emerald-700">{{ documentsSuccess }}</div>
      <div v-if="documentsError" class="mt-4 text-sm text-red-700">{{ documentsError }}</div>
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
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
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
import { projectApi } from '@/core/utils/project-api'
import type { Task } from '@/core/types/task'
import { toYmd } from '@/core/utils/week-utils'
import {
  scheduleSlotDocumentsApi,
  scheduleSlotAllowedUploadAccept,
  type ScheduleSlotDocument,
  type ScheduleSlotDocumentBucket,
  validateScheduleSlotUploadFile,
} from '@/core/utils/schedule-slot-documents-api'
import { formatFileSize, getFileIcon } from '@/core/utils/files-api'
import { isLikelyPdfDocument } from '@/core/utils/pdf-preview-detect'

interface SlotWorkerInfo {
  displayName: string
  jobTitle: string | null
  projectRole: string | null
  /** True when we only have `User #id` and no team row */
  isFallbackName: boolean
}

function formatRoleInProject(raw: string): string {
  const s = raw.trim()
  if (!s) return '—'
  const key = s.toLowerCase().replace(/\s+/g, '_')
  const map: Record<string, string> = {
    task_lead: 'Task lead',
    member: 'Team member',
    team_member: 'Team member',
    invited: 'Invited',
    project_manager: 'Project manager',
    prj_manager: 'Project manager',
    admin: 'Administrator',
  }
  if (map[key]) return map[key]
  return s
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function pickPreferProjectRole(a: string | null, b: string | null): string | null {
  const norm = (s: string | null) => (s || '').toLowerCase().replace(/\s+/g, '_')
  const score = (s: string) => {
    if (!s) return 0
    if (s.includes('lead') || s === 'task_lead') return 3
    if (s === 'member' || s === 'team_member') return 2
    if (s === 'invited') return 1
    return 2
  }
  const na = norm(a)
  const nb = norm(b)
  if (score(nb) > score(na)) return b
  if (score(na) > score(nb)) return a
  return b || a || null
}

/**
 * Builds one display row per user_id from GET /projects/:id/team (handles several API shapes).
 */
function parseTeamMembersByUserId(raw: unknown): Map<number, SlotWorkerInfo> {
  const map = new Map<number, SlotWorkerInfo>()
  const envelope = raw as { data?: { team_members?: unknown[] }; team_members?: unknown[] }
  const list = envelope?.team_members ?? envelope?.data?.team_members ?? []
  if (!Array.isArray(list)) return map

  for (const row of list) {
    const m = row as Record<string, unknown>
    const uid = Number(m.user_id ?? m.id)
    if (!Number.isFinite(uid) || uid <= 0) continue

    const displayName =
      String(m.full_name ?? m.name ?? m.email ?? '')
        .trim()
        .replace(/\s+/g, ' ') || ''
    const jobTitleRaw = m.job_title != null ? String(m.job_title).trim() : ''
    const roleRaw = String(m.project_role ?? m.role_in_project ?? m.role ?? '').trim()

    const next: SlotWorkerInfo = {
      displayName: displayName || `User ${uid}`,
      jobTitle: jobTitleRaw || null,
      projectRole: roleRaw || null,
      isFallbackName: !displayName,
    }

    const prev = map.get(uid)
    if (!prev) {
      map.set(uid, next)
      continue
    }

    const betterName =
      displayName && !displayName.startsWith('User ')
        ? displayName
        : !prev.displayName.startsWith('User ')
          ? prev.displayName
          : displayName || prev.displayName

    map.set(uid, {
      displayName: betterName,
      jobTitle: prev.jobTitle || next.jobTitle || null,
      projectRole: pickPreferProjectRole(prev.projectRole, next.projectRole),
      isFallbackName: betterName.startsWith('User '),
    })
  }
  return map
}

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
const isDocumentsLoading = ref(false)
const documentsError = ref('')
const documentsSuccess = ref('')
const isUploadingSetupDocument = ref(false)
const deletingSetupDocumentIds = ref<number[]>([])
const setupDocumentDisplayNameDraft = ref('')
const isFileDialogOpen = ref(false)
const fileDialogMode = ref<'upload' | 'edit'>('upload')
const selectedUploadFile = ref<File | null>(null)
const editingDocument = ref<ScheduleSlotDocument | null>(null)
const isFileDialogSubmitting = ref(false)
const isPreviewModalOpen = ref(false)
const previewBlobUrl = ref('')
const previewMimeType = ref('')
const previewFileName = ref('')
const isPdfPreview = computed(
  () =>
    Boolean(previewBlobUrl.value) &&
    isLikelyPdfDocument(previewMimeType.value, previewFileName.value || ''),
)
const setupDocuments = ref<ScheduleSlotDocument[]>([])
const completedDocuments = ref<ScheduleSlotDocument[]>([])
const dialogFileInputRef = ref<HTMLInputElement | null>(null)

const weekMeta = ref<ScheduleWeekMeta | null>(null)
const allEntries = ref<ScheduleWeekEntryRow[]>([])
const tasks = ref<Task[]>([])
const teamByUserId = ref<Map<number, SlotWorkerInfo>>(new Map())

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

const workerInfo = computed((): SlotWorkerInfo => {
  const e = targetEntry.value
  if (!e) {
    return {
      displayName: '—',
      jobTitle: null,
      projectRole: null,
      isFallbackName: false,
    }
  }
  const uid = Number(e.user_id)
  const hit = teamByUserId.value.get(uid)
  if (hit) return hit
  return {
    displayName: `User #${uid}`,
    jobTitle: null,
    projectRole: null,
    isFallbackName: true,
  }
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
    const [weekRes, taskRes, teamRes] = await Promise.all([
      fetchProjectScheduleWeek(pid, ws),
      tasksApi.getAll(pid, 1, 500),
      projectApi.getTeamMembers(pid).catch(() => null),
    ])
    weekMeta.value = weekRes.week
    allEntries.value = mapLoadedEntries(weekRes.entries)
    tasks.value = taskRes.tasks
    teamByUserId.value = teamRes != null ? parseTeamMembersByUserId(teamRes) : new Map()
    const hit = allEntries.value.find((e) => e.id === wid)
    if (!hit) {
      loadError.value = 'This schedule row was not found. It may have been removed — return to the schedule.'
      weekMeta.value = null
    } else {
      noteDraft.value = typeof hit.assignment_note === 'string' ? hit.assignment_note : ''
      await loadDocuments(pid, wid)
    }
  } catch (e) {
    loadError.value = getApiErrorMessage(e, 'Could not load schedule or project data.')
    weekMeta.value = null
    allEntries.value = []
    teamByUserId.value = new Map()
    setupDocuments.value = []
    completedDocuments.value = []
  } finally {
    isLoading.value = false
  }
}

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const raw = err.response?.data
    if (typeof raw === 'string' && raw.trim()) return raw
    if (raw == null || typeof raw !== 'object') return fallback
    const data = raw as { message?: string; error?: string; details?: string; errors?: unknown }
    const list = Array.isArray(data.errors) ? data.errors : null
    if (list && list.length > 0) {
      const first = list[0]
      if (typeof first === 'string' && first.trim()) return first
      if (first != null && typeof first === 'object') {
        const msg = (first as { message?: unknown }).message
        if (typeof msg === 'string' && msg.trim()) return msg
      }
    }
    if (typeof data.message === 'string' && data.message.trim()) return data.message
    if (typeof data.error === 'string' && data.error.trim()) return data.error
    if (typeof data.details === 'string' && data.details.trim()) return data.details
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

const canUploadSetupDocuments = computed(() => canEditNote.value && !isSaving.value)
const selectedUploadFileName = computed(() => selectedUploadFile.value?.name || '')

function formatUploadedAt(iso: string): string {
  if (!iso) return '—'
  const ms = Date.parse(iso)
  if (!Number.isFinite(ms)) return iso
  return new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

async function loadDocuments(pid: number, scheduleEntryId: number): Promise<void> {
  isDocumentsLoading.value = true
  documentsError.value = ''
  documentsSuccess.value = ''
  try {
    const data = await scheduleSlotDocumentsApi.fetch(pid, scheduleEntryId)
    setupDocuments.value = data.setup
    completedDocuments.value = data.completed
  } catch (e) {
    setupDocuments.value = []
    completedDocuments.value = []
    documentsError.value = getApiErrorMessage(
      e,
      'Could not load documents for this slot. You can continue editing instructions.',
    )
  } finally {
    isDocumentsLoading.value = false
  }
}

function openUploadDialog(): void {
  if (!canUploadSetupDocuments.value) return
  fileDialogMode.value = 'upload'
  setupDocumentDisplayNameDraft.value = ''
  selectedUploadFile.value = null
  editingDocument.value = null
  documentsError.value = ''
  documentsSuccess.value = ''
  isFileDialogOpen.value = true
}

function openEditDialog(doc: ScheduleSlotDocument): void {
  if (!canUploadSetupDocuments.value) return
  fileDialogMode.value = 'edit'
  editingDocument.value = doc
  selectedUploadFile.value = null
  setupDocumentDisplayNameDraft.value = doc.display_name || doc.original_name || ''
  documentsError.value = ''
  documentsSuccess.value = ''
  isFileDialogOpen.value = true
}

function closeFileDialog(): void {
  if (isFileDialogSubmitting.value) return
  isFileDialogOpen.value = false
  selectedUploadFile.value = null
  editingDocument.value = null
}

function requestDialogFilePick(): void {
  if (isFileDialogSubmitting.value) return
  dialogFileInputRef.value?.click()
}

function onDialogFilePicked(event: Event): void {
  const target = event.target as HTMLInputElement | null
  const file = target?.files?.[0]
  if (!file) return
  const validationError = validateScheduleSlotUploadFile(file)
  if (validationError) {
    documentsError.value = validationError
    if (target) target.value = ''
    return
  }
  documentsError.value = ''
  selectedUploadFile.value = file
  if (target) target.value = ''
}

async function submitUploadFromDialog(): Promise<void> {
  const file = selectedUploadFile.value
  if (!file || !targetEntry.value?.id) return
  documentsSuccess.value = ''
  isFileDialogSubmitting.value = true
  isUploadingSetupDocument.value = true
  documentsError.value = ''
  try {
    const uploaded = await scheduleSlotDocumentsApi.upload(
      projectId.value,
      targetEntry.value.id,
      'setup',
      file,
      setupDocumentDisplayNameDraft.value,
    )
    setupDocuments.value = [uploaded, ...setupDocuments.value]
    documentsSuccess.value = 'Uploaded successfully.'
    isFileDialogOpen.value = false
    selectedUploadFile.value = null
    editingDocument.value = null
  } catch (e) {
    documentsError.value = getApiErrorMessage(e, 'Document upload failed. Please try again.')
  } finally {
    isFileDialogSubmitting.value = false
    isUploadingSetupDocument.value = false
  }
}

async function saveDocumentNameFromDialog(): Promise<void> {
  if (!targetEntry.value?.id || !editingDocument.value) return
  isFileDialogSubmitting.value = true
  documentsError.value = ''
  documentsSuccess.value = ''
  const current = editingDocument.value
  try {
    const updated = await scheduleSlotDocumentsApi.updateDisplayName(
      projectId.value,
      targetEntry.value.id,
      current.id,
      setupDocumentDisplayNameDraft.value,
    )
    setupDocuments.value = setupDocuments.value.map((item) => (item.id === updated.id ? updated : item))
    completedDocuments.value = completedDocuments.value.map((item) => (item.id === updated.id ? updated : item))
    documentsSuccess.value = 'Document name updated successfully.'
    isFileDialogOpen.value = false
    editingDocument.value = null
  } catch (e) {
    documentsError.value = getApiErrorMessage(e, 'Could not update document name.')
  } finally {
    isFileDialogSubmitting.value = false
  }
}

function isPreviewableDocument(doc: ScheduleSlotDocument): boolean {
  const mime = doc.mime_type || ''
  const name = doc.display_name || doc.original_name || doc.file_name || ''
  return mime.startsWith('image/') || isLikelyPdfDocument(mime, name)
}

function triggerFileDownload(blob: Blob, fileName: string): void {
  const href = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = href
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(href)
}

function closePreviewModal(): void {
  isPreviewModalOpen.value = false
  previewMimeType.value = ''
  previewFileName.value = ''
  if (previewBlobUrl.value) {
    window.URL.revokeObjectURL(previewBlobUrl.value)
    previewBlobUrl.value = ''
  }
}

function openPreviewModal(blob: Blob, doc: ScheduleSlotDocument): void {
  if (previewBlobUrl.value) {
    window.URL.revokeObjectURL(previewBlobUrl.value)
  }
  previewBlobUrl.value = window.URL.createObjectURL(blob)
  previewMimeType.value = doc.mime_type || blob.type || ''
  previewFileName.value = doc.display_name || doc.original_name || doc.file_name
  isPreviewModalOpen.value = true
}

async function openOrDownloadSlotDocument(
  bucket: ScheduleSlotDocumentBucket,
  doc: ScheduleSlotDocument,
): Promise<void> {
  if (!targetEntry.value?.id) return
  try {
    const blob = await scheduleSlotDocumentsApi.download(projectId.value, targetEntry.value.id, doc.id)
    if (isPreviewableDocument(doc)) {
      openPreviewModal(blob, doc)
      return
    }
    triggerFileDownload(blob, doc.original_name || doc.file_name)
  } catch (e) {
    documentsError.value = getApiErrorMessage(
      e,
      `Could not open ${bucket === 'setup' ? 'setup' : 'completed'} file.`,
    )
  }
}

function isDeletingSetupDocument(documentId: number): boolean {
  return deletingSetupDocumentIds.value.includes(documentId)
}

async function deleteSetupDocument(doc: ScheduleSlotDocument): Promise<void> {
  if (!targetEntry.value?.id) return
  const isConfirmed = window.confirm(`Delete file "${doc.original_name || doc.file_name}"?`)
  if (!isConfirmed) return

  documentsError.value = ''
  documentsSuccess.value = ''
  deletingSetupDocumentIds.value = [...deletingSetupDocumentIds.value, doc.id]
  try {
    await scheduleSlotDocumentsApi.remove(projectId.value, targetEntry.value.id, doc.id)
    const refreshed = await scheduleSlotDocumentsApi.fetch(projectId.value, targetEntry.value.id)
    setupDocuments.value = refreshed.setup
    completedDocuments.value = refreshed.completed
    const stillExists = refreshed.setup.some((item) => item.id === doc.id)
    if (stillExists) {
      documentsError.value = 'The server returned success, but the file is still present after refresh.'
      return
    }
    documentsSuccess.value = 'Document deleted successfully.'
  } catch (e) {
    documentsError.value = getApiErrorMessage(e, 'Could not delete the document.')
  } finally {
    deletingSetupDocumentIds.value = deletingSetupDocumentIds.value.filter((id) => id !== doc.id)
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

onBeforeUnmount(() => {
  closePreviewModal()
})
</script>

<template>
  <div class="px-4 py-4 max-w-lg mx-auto pb-8">
    <div v-if="isLoading" class="flex justify-center py-12">
      <div class="animate-spin w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full" />
    </div>

    <!-- Schedule slot: four separated sections -->
    <template v-else-if="task && fromSchedule">
      <!-- 1. Assignment date + Schedule -->
      <nav class="mb-5 border-b border-gray-200 pb-3" aria-label="Breadcrumb">
        <div class="flex items-center justify-between gap-3">
          <RouterLink
            to="/tasks/schedule"
            class="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700 shrink-0"
            aria-label="Back to schedule"
          >
            <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Schedule
          </RouterLink>
          <p class="text-sm font-semibold text-gray-900 text-right leading-snug">
            {{ scheduleContextLine || scheduleAssignmentDateLabel }}
          </p>
        </div>
      </nav>

      <!-- 2. Task name + address -->
      <section class="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm" aria-labelledby="slot-task-title">
        <div class="flex items-center gap-2">
          <span v-if="isMilestone(task.milestone)" class="text-amber-600">{{ MILESTONE_ICON }}</span>
          <h1 id="slot-task-title" class="text-xl font-semibold text-gray-900">{{ task.name }}</h1>
        </div>
        <p v-if="task.address?.trim()" class="text-sm text-gray-700 mt-3 flex gap-2 items-start">
          <svg
            class="w-4 h-4 text-gray-400 shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span class="whitespace-pre-wrap break-words">{{ task.address }}</span>
        </p>
        <p v-if="task.notes?.trim()" class="mt-4 border-t border-gray-100 pt-3">
          <span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Task description (project)</span>
          <span class="mt-1 block text-sm text-gray-700 whitespace-pre-wrap break-words">{{ task.notes }}</span>
        </p>
        <p class="mt-3 text-xs text-gray-500">
          Planned on project: {{ formatDateRange(task.start_planned, task.end_planned) }}
        </p>
      </section>

      <!-- 3. PM setup text + setup documents -->
      <section
        class="mb-6 rounded-xl border border-amber-200/90 bg-amber-50/50 p-4 shadow-sm scroll-mt-4"
        aria-labelledby="pm-setup-title"
      >
        <h2 id="pm-setup-title" class="text-sm font-semibold text-amber-950">PM setup</h2>
        <p class="mt-2 text-sm text-gray-900 whitespace-pre-wrap break-words min-h-[1.25rem]">
          {{ scheduleAssignmentNote || '—' }}
        </p>
        <div class="mt-4 border-t border-amber-200/80 pt-4">
          <p class="text-xs font-semibold uppercase tracking-wide text-amber-900 mb-2">Documents (drawings, plans, photos)</p>
          <p v-if="isSlotDocumentsLoading" class="text-xs text-gray-500">Loading…</p>
          <ul v-else-if="setupDocuments.length > 0" class="space-y-2">
            <li v-for="doc in setupDocuments" :key="doc.id" class="rounded-lg border border-amber-100 bg-white px-3 py-2">
              <button type="button" class="w-full text-left min-w-0 overflow-hidden" @click="openOrDownloadDocument(doc)">
                <p class="text-sm text-gray-900 truncate">
                  {{ getFileIcon(doc.mime_type, doc.file_name).icon }}
                  {{ doc.display_name || doc.original_name || doc.file_name }}
                </p>
                <p class="text-[11px] text-gray-500 mt-0.5">
                  {{ formatFileSize(doc.file_size) }} · {{ formatUploadedAt(doc.uploaded_at) }}
                </p>
              </button>
            </li>
          </ul>
          <p v-else class="text-xs text-gray-600">No files attached by PM for this slot yet.</p>
        </div>
      </section>

      <!-- 4. Day status + description + your uploads -->
      <section class="mb-6 rounded-xl border border-orange-200 bg-white p-4 shadow-sm" aria-labelledby="your-work-title">
        <h2 id="your-work-title" class="text-sm font-semibold text-gray-900">Your work today</h2>
        <p class="text-xs text-gray-500 mt-1 mb-4">Status and notes are saved on this device until the server sync is ready.</p>

        <div v-if="showDayWorkPanel" class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Status for this day</label>
            <select
              v-model="slotDayStatus"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              @change="persistSlotDayStatus"
            >
              <option v-for="opt in slotDayStatusOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>

          <TaskDayWorkPanel
            variant="notesOnly"
            :project-id="projectId"
            :task-id="taskId"
            :work-ymd="effectiveDaySliceYmd"
            :day-part="effectiveDaySlicePart"
          />

          <div class="border-t border-gray-100 pt-4">
            <div class="flex items-center justify-between gap-2">
              <p class="text-xs font-semibold uppercase tracking-wide text-gray-700">Site &amp; completion photos / files</p>
              <button
                type="button"
                class="rounded-md bg-orange-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                :disabled="isUploadingCompletedDocument || scheduleEntryId <= 0"
                @click="openCompletedUploadDialog"
              >
                {{ isUploadingCompletedDocument ? 'Uploading…' : 'Upload' }}
              </button>
            </div>
            <p class="mt-1 text-[11px] text-gray-500">
              Images and PDFs. Use Upload to pick a file and set an optional display name (same as PM setup). You can
              still change the name later with Edit name or remove a file with Delete and upload again.
            </p>
            <p v-if="isSlotDocumentsLoading" class="mt-2 text-xs text-gray-500">Loading list…</p>
            <ul v-else-if="completedDocuments.length > 0" class="mt-2 space-y-2">
              <li
                v-for="doc in completedDocuments"
                :key="doc.id"
                class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-gray-100 bg-gray-50 px-2 py-1.5"
              >
                <button type="button" class="text-left min-w-0 overflow-hidden" @click="openOrDownloadDocument(doc)">
                  <p class="text-sm text-gray-900 truncate">
                    {{ getFileIcon(doc.mime_type, doc.file_name).icon }}
                    {{ doc.display_name || doc.original_name || doc.file_name }}
                  </p>
                  <p class="text-[11px] text-gray-500">
                    {{ formatFileSize(doc.file_size) }} · {{ formatUploadedAt(doc.uploaded_at) }}
                  </p>
                </button>
                <div class="flex flex-col items-end gap-1 shrink-0">
                  <button
                    type="button"
                    class="text-xs font-medium text-orange-700 hover:text-orange-800 disabled:opacity-50"
                    :disabled="isDeletingCompletedDocument(doc.id) || scheduleEntryId <= 0"
                    @click="openCompletedDocumentRenameDialog(doc)"
                  >
                    Edit name
                  </button>
                  <button
                    type="button"
                    class="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                    :disabled="isDeletingCompletedDocument(doc.id) || scheduleEntryId <= 0"
                    @click="deleteCompletedDocument(doc)"
                  >
                    {{ isDeletingCompletedDocument(doc.id) ? 'Deleting…' : 'Delete' }}
                  </button>
                </div>
              </li>
            </ul>
            <p v-else class="mt-2 text-xs text-gray-500">No uploads yet.</p>
          </div>
        </div>
        <p
          v-else
          class="text-sm text-amber-950 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2.5"
        >
          Open this task from the weekly schedule with a day (and slot) so you can set status, notes, and uploads for that day.
        </p>
        <p v-if="documentsMessage" class="mt-3 text-xs text-emerald-700">{{ documentsMessage }}</p>
        <p v-if="documentsError" class="mt-2 text-xs text-red-700">{{ documentsError }}</p>
      </section>

      <section
        class="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        aria-labelledby="worker-slot-chat-title"
      >
        <h2 id="worker-slot-chat-title" class="text-sm font-semibold text-gray-900 mb-1">Chat for this slot</h2>
        <p class="text-xs text-gray-500 leading-relaxed mb-3">
          Short thread with your manager for this scheduled day and part.
        </p>
        <RouterLink
          v-if="scheduleSlotChatLocation"
          :to="scheduleSlotChatLocation"
          class="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-lg border border-orange-200 text-sm font-medium text-orange-900 bg-orange-50 hover:bg-orange-100 transition-colors"
        >
          Open slot chat (preview)
        </RouterLink>
        <p v-else-if="isScheduleSlotMetaLoading && scheduleWorkDate" class="text-xs text-gray-500">Loading slot…</p>
        <p v-else-if="slotChatBlockedNoRowId" class="text-xs text-amber-800/90 leading-relaxed">
          Chat is unavailable for this slot until the API returns the real schedule row id for messaging (e.g.
          <code class="text-[10px] bg-amber-50 px-1 rounded">worker_task_schedule_id</code> on GET
          <code class="text-[10px]">/me/schedule</code>), matching
          <code class="text-[10px]">data.entries[].id</code> from the project week — not only the snapshot
          <code class="text-[10px]">id</code>.
        </p>
        <p v-else class="text-xs text-gray-500">Open this task from the weekly schedule so the day and time-of-day slot are set.</p>
      </section>

      <section class="mb-6 rounded-xl border border-gray-200 bg-gray-50/90 p-4" aria-label="Overall task status">
        <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Whole task (project)</h2>
        <p class="text-sm text-gray-700">
          Status for the entire job:
          <span class="font-medium text-gray-900">{{ taskWideStatusLabel }}</span>
        </p>
        <p v-if="task.progress_pct != null" class="text-xs text-gray-500 mt-1">Progress: {{ task.progress_pct }}%</p>
      </section>
    </template>

    <template v-else-if="task && !fromSchedule">
      <nav class="mb-4" aria-label="Breadcrumb">
        <RouterLink
          to="/tasks/schedule"
          class="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700"
          aria-label="Back to schedule"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Schedule
        </RouterLink>
      </nav>

      <header class="mb-5">
        <div class="flex items-center gap-2">
          <span v-if="isMilestone(task.milestone)" class="text-amber-600">{{ MILESTONE_ICON }}</span>
          <h1 class="text-xl font-semibold text-gray-900">{{ task.name }}</h1>
        </div>
        <p class="text-sm text-gray-500 mt-1">
          {{ formatDateRange(task.start_planned, task.end_planned) }}
        </p>
        <p v-if="task.address?.trim()" class="text-sm text-gray-700 mt-2 flex gap-2 items-start">
          <svg
            class="w-4 h-4 text-gray-400 shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span class="whitespace-pre-wrap break-words">{{ task.address }}</span>
        </p>
        <p v-if="task.notes" class="text-sm text-gray-600 mt-2 whitespace-pre-wrap break-words">{{ task.notes }}</p>
      </header>

      <!-- Management & communication (placeholders until messaging API) -->
      <section class="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 class="text-sm font-semibold text-gray-900 mb-1">Management &amp; communication</h2>
        <p class="text-xs text-gray-500 mb-3 leading-relaxed">
          Reach your foreman or project office for questions about this task. In-app messaging with management will
          appear here when your organization enables it.
        </p>
        <RouterLink
          to="/tasks/schedule"
          class="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-800 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          Back to schedule
        </RouterLink>
      </section>

      <!-- Personal notes / markers (device-local until backend sync) -->
      <section class="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 class="text-sm font-semibold text-gray-900 mb-1">Your notes &amp; markers</h2>
        <p class="text-xs text-gray-500 mb-2">
          Reminders for yourself (saved on this device only for now).
        </p>
        <textarea
          v-model="workerNotes"
          rows="4"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          placeholder="Materials to bring, access codes, follow-ups…"
          @blur="persistWorkerNotes"
        />
        <p v-if="notesSavedHint" class="text-xs text-green-700 mt-1.5">{{ notesSavedHint }}</p>
      </section>

      <!-- Task-wide status (edit when not opened from a schedule slot) -->
      <section class="mb-6">
        <h2 class="text-sm font-semibold text-gray-900 mb-2">Status</h2>
        <select
          v-model="selectedStatus"
          :disabled="isSavingStatus"
          class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          @change="saveStatus"
        >
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <p v-if="task.progress_pct != null" class="text-xs text-gray-500 mt-1">
          Progress: {{ task.progress_pct }}%
        </p>
      </section>

      <!-- Device-local photos when not on schedule path (schedule uses slot file upload) -->
      <section>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-gray-900">Photos</h2>
          <label
            class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white text-sm font-medium rounded-lg cursor-pointer hover:bg-orange-700"
          >
            <input
              type="file"
              accept="image/*"
              capture="environment"
              class="sr-only"
              @change="onFileSelected"
            />
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8v8H4V4h16z" />
            </svg>
            Add photo
          </label>
        </div>

        <div v-if="photosGroupedByDate.length === 0" class="bg-gray-50 rounded-xl border border-gray-200 border-dashed p-8 text-center">
          <p class="text-gray-500 text-sm">No photos yet.</p>
          <p class="text-gray-400 text-xs mt-1">Add photos to document progress.</p>
        </div>

        <div v-else class="space-y-6">
          <div v-for="group in photosGroupedByDate" :key="group.date" class="space-y-2">
            <h3 class="text-xs font-medium text-gray-500 uppercase tracking-wide">{{ group.dateLabel }}</h3>
            <div class="grid grid-cols-2 gap-2">
              <div
                v-for="photo in group.photos"
                :key="photo.id"
                class="aspect-square rounded-lg bg-gray-200 overflow-hidden"
              >
                <img
                  :src="photo.url"
                  :alt="photo.comment || 'Task photo'"
                  class="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>

    <div v-else class="text-center py-12 text-gray-500">
      <p>Task not found.</p>
      <div class="flex flex-col sm:flex-row gap-3 justify-center mt-4 text-sm">
        <RouterLink
          to="/tasks/schedule"
          class="inline-flex items-center justify-center gap-1 text-orange-600 font-medium mx-auto"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to schedule
        </RouterLink>
      </div>
    </div>

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
      v-if="isCompletedUploadDialogOpen"
      class="fixed inset-0 z-[56] flex items-center justify-center bg-black/40 px-4"
      @click.self="closeCompletedUploadDialog"
    >
      <div class="w-full max-w-md rounded-xl bg-white p-4 shadow-xl">
        <h3 class="text-base font-semibold text-gray-900">Upload completion file</h3>
        <div class="mt-3">
          <label for="worker-completed-doc-name" class="block text-xs font-medium text-gray-700">
            File name for users (optional)
          </label>
          <input
            id="worker-completed-doc-name"
            v-model.trim="completedUploadDisplayNameDraft"
            type="text"
            maxlength="160"
            class="mt-1 w-full rounded-md border border-gray-300 px-2 py-2 text-sm text-gray-800"
            placeholder="Leave empty to use original file name"
          />
        </div>
        <div class="mt-3">
          <button
            type="button"
            class="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            :disabled="isUploadingCompletedDocument"
            @click="requestCompletedDialogFilePick"
          >
            Choose file
          </button>
          <p v-if="selectedCompletedUploadFileName" class="mt-2 text-xs text-gray-600 truncate">
            {{ selectedCompletedUploadFileName }}
          </p>
        </div>
        <input
          ref="completedDialogFileInputRef"
          type="file"
          :accept="scheduleSlotAllowedUploadAccept"
          class="hidden"
          @change="onCompletedDialogFilePicked"
        />
        <div class="mt-4 flex justify-end gap-2">
          <button
            type="button"
            class="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            :disabled="isUploadingCompletedDocument"
            @click="closeCompletedUploadDialog"
          >
            Cancel
          </button>
          <button
            type="button"
            class="rounded-md bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-700 disabled:opacity-50"
            :disabled="isUploadingCompletedDocument || !selectedCompletedUploadFile"
            @click="submitCompletedUploadFromDialog"
          >
            {{ isUploadingCompletedDocument ? 'Uploading…' : 'Upload' }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="isCompletedDocumentRenameDialogOpen"
      class="fixed inset-0 z-[55] flex items-center justify-center bg-black/40 px-4"
      @click.self="closeCompletedDocumentRenameDialog"
    >
      <div class="w-full max-w-md rounded-xl bg-white p-4 shadow-xl">
        <h3 class="text-base font-semibold text-gray-900">Edit file name</h3>
        <p class="mt-1 text-xs text-gray-500 leading-relaxed">
          Label shown in the list for you and PM. Clearing the field falls back to the original file name.
        </p>
        <label for="completed-doc-display-name" class="mt-3 block text-xs font-medium text-gray-700">
          Display name
        </label>
        <input
          id="completed-doc-display-name"
          v-model.trim="completedEditDisplayNameDraft"
          type="text"
          maxlength="160"
          class="mt-1 w-full rounded-md border border-gray-300 px-2 py-2 text-sm text-gray-800"
          placeholder="Leave empty to use original file name"
        />
        <div
          v-if="editingCompletedDocument"
          class="mt-3 rounded-md border border-gray-200 bg-gray-50 p-2 text-xs text-gray-600 space-y-0.5"
        >
          <p>
            <span class="font-medium text-gray-700">Stored file:</span>
            {{ editingCompletedDocument.file_name }}
          </p>
          <p>
            <span class="font-medium text-gray-700">Original name:</span>
            {{ editingCompletedDocument.original_name || '—' }}
          </p>
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <button
            type="button"
            class="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            :disabled="isSavingCompletedDocumentName"
            @click="closeCompletedDocumentRenameDialog"
          >
            Cancel
          </button>
          <button
            type="button"
            class="rounded-md bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-700 disabled:opacity-50"
            :disabled="isSavingCompletedDocumentName || !editingCompletedDocument"
            @click="saveCompletedDocumentDisplayName"
          >
            {{ isSavingCompletedDocumentName ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import axios from 'axios'
import { useRoute } from 'vue-router'
import type { RouteLocationRaw } from 'vue-router'
import {
  fetchMySchedule,
  resolveScheduleSlotIdForMessages,
  type ScheduleDayPart,
} from '@/core/utils/schedule-weeks-api'
import { useAuthStore } from '@/core/stores/auth'
import { tasksApi } from '@/core/utils/tasks-api'
import { getTaskStatusLabel, MILESTONE_ICON } from '@/core/utils/task-utils'
import {
  isTaskRoleForeman,
  isUserInvolvedInTask,
  resolveSessionUserId,
} from '@/core/utils/task-role-ux'
import { isMilestone } from '@/core/types/task'
import type { Task, TaskStatus } from '@/core/types/task'
import TaskDayWorkPanel from '@/components/task-role/TaskDayWorkPanel.vue'
import {
  scheduleSlotAllowedUploadAccept,
  scheduleSlotDocumentsApi,
  type ScheduleSlotDocument,
  validateScheduleSlotUploadFile,
} from '@/core/utils/schedule-slot-documents-api'
import { formatFileSize, getFileIcon } from '@/core/utils/files-api'
import { isLikelyPdfDocument } from '@/core/utils/pdf-preview-detect'

export interface TaskPhoto {
  id: string
  task_id: string
  url: string
  created_at: string
  comment?: string
}

const route = useRoute()
const authStore = useAuthStore()
const projectId = computed(() => String(route.params.projectId))
const taskId = computed(() => String(route.params.taskId))

/** Schedule context: URL under /tasks/schedule/task/… keeps the Schedule bottom tab active. */
const fromSchedule = computed(() => route.path.startsWith('/tasks/schedule/task/'))

const scheduleWorkDate = computed(() => {
  const w = route.query.workDate
  return typeof w === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(w) ? w : ''
})

const scheduleDayPart = computed((): ScheduleDayPart | '' => {
  const p = route.query.dayPart
  if (p === 'am' || p === 'pm' || p === 'full') return p
  return ''
})

function scheduleDayPartLabel(part: ScheduleDayPart | ''): string {
  if (part === 'am') return 'Morning'
  if (part === 'pm') return 'Afternoon'
  if (part === 'full') return 'All day'
  return ''
}

const scheduleContextLine = computed(() => {
  const d = scheduleWorkDate.value
  if (!d) return ''
  const pretty = new Date(`${d}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const part = scheduleDayPart.value
  const pl = scheduleDayPartLabel(part)
  return pl ? `${pretty} · ${pl}` : pretty
})

/** Fallback when URL has no workDate but we infer a day from the task (same keys as day-work panel). */
const scheduleAssignmentDateLabel = computed(() => {
  const d = scheduleWorkDate.value || effectiveDaySliceYmd.value
  if (!d) return 'Assignment'
  const pretty = new Date(`${d}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const partFromQuery = scheduleDayPart.value
  const part: ScheduleDayPart | '' =
    partFromQuery === 'am' || partFromQuery === 'pm' || partFromQuery === 'full'
      ? partFromQuery
      : effectiveDaySlicePart.value
  const pl = scheduleDayPartLabel(part)
  return pl ? `${pretty} · ${pl}` : pretty
})

/** Date for the day-slice panel (query, else task start date). */
const effectiveDaySliceYmd = computed(() => {
  if (scheduleWorkDate.value) return scheduleWorkDate.value
  const start = task.value?.start_planned
  if (start && /^\d{4}-\d{2}-\d{2}/.test(start)) return start.slice(0, 10)
  return ''
})

const effectiveDaySlicePart = computed((): ScheduleDayPart => {
  const p = scheduleDayPart.value
  if (p === 'am' || p === 'pm' || p === 'full') return p
  return 'full'
})

const showDayWorkPanel = computed(() => fromSchedule.value && effectiveDaySliceYmd.value.length > 0)

/** Real worker_task_schedules id for messages API (from GET /me/schedule explicit FKs only). */
const scheduleEntryId = ref(0)
/** When URL has no dayPart, inferred from /me/schedule so chat links still include a concrete slot part. */
const scheduleSlotDayPartResolved = ref<ScheduleDayPart | ''>('')

const scheduleSlotChatLocation = computed((): RouteLocationRaw | null => {
  if (!fromSchedule.value) return null
  const d = scheduleWorkDate.value
  if (!d) return null
  const pid = projectId.value
  const tid = taskId.value
  if (!pid || !tid) return null
  if (scheduleEntryId.value <= 0) return null
  const part =
    scheduleDayPart.value === 'am' || scheduleDayPart.value === 'pm' || scheduleDayPart.value === 'full'
      ? scheduleDayPart.value
      : scheduleSlotDayPartResolved.value
  if (part !== 'am' && part !== 'pm' && part !== 'full') return null
  const q: Record<string, string> = { workDate: d, dayPart: part, entryId: String(scheduleEntryId.value) }
  return {
    path: `/tasks/schedule/task/${pid}/${tid}/chat`,
    query: q,
  }
})

/** True while refetching GET /me/schedule for the slot panel (avoids flashing “unavailable” during reset). */
const isScheduleSlotMetaLoading = ref(false)

const slotChatBlockedNoRowId = computed(
  () =>
    Boolean(
      fromSchedule.value &&
        scheduleWorkDate.value &&
        projectId.value &&
        taskId.value &&
        !isScheduleSlotMetaLoading.value &&
        scheduleEntryId.value <= 0,
    ),
)

const taskWideStatusLabel = computed(() =>
  task.value ? getTaskStatusLabel(task.value.status as TaskStatus) : '—',
)

const task = ref<Task | null>(null)
/** Loaded from GET /me/schedule when opening task from weekly schedule (published rows). */
const scheduleAssignmentNote = ref('')
const isLoading = ref(true)
const selectedStatus = ref('')
const isSavingStatus = ref(false)

// Photos: local state until backend has task photos API
const photos = ref<TaskPhoto[]>([])

const workerNotes = ref('')
const notesSavedHint = ref('')
const setupDocuments = ref<ScheduleSlotDocument[]>([])
const completedDocuments = ref<ScheduleSlotDocument[]>([])
const isSlotDocumentsLoading = ref(false)
const isCompletedUploadDialogOpen = ref(false)
const completedUploadDisplayNameDraft = ref('')
const selectedCompletedUploadFile = ref<File | null>(null)
const completedDialogFileInputRef = ref<HTMLInputElement | null>(null)
const isUploadingCompletedDocument = ref(false)
const isCompletedDocumentRenameDialogOpen = ref(false)
const editingCompletedDocument = ref<ScheduleSlotDocument | null>(null)
const completedEditDisplayNameDraft = ref('')
const isSavingCompletedDocumentName = ref(false)
const deletingCompletedDocumentIds = ref<number[]>([])
const documentsError = ref('')
const documentsMessage = ref('')
/** Same values and localStorage key pattern as `TaskDayWorkPanel` day status (list chips use these keys). */
const slotDayStatusOptions = [
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'blocked', label: 'Blocked / issue' },
  { value: 'absent', label: 'Not on site / N/A' },
] as const
const slotDayStatus = ref<string>('not_started')
const isPreviewModalOpen = ref(false)
const previewBlobUrl = ref('')
const previewMimeType = ref('')
const previewFileName = ref('')
const isPdfPreview = computed(
  () =>
    Boolean(previewBlobUrl.value) &&
    isLikelyPdfDocument(previewMimeType.value, previewFileName.value || ''),
)

const selectedCompletedUploadFileName = computed(() => selectedCompletedUploadFile.value?.name ?? '')

function workerNotesStorageKey(): string {
  return `fw_worker_task_notes_${projectId.value}_${taskId.value}`
}

function loadWorkerNotes(): void {
  try {
    workerNotes.value = localStorage.getItem(workerNotesStorageKey()) ?? ''
  } catch {
    workerNotes.value = ''
  }
}

function slotDayStatusStorageKey(): string {
  return `fw_task_day_status_${projectId.value}_${taskId.value}_${effectiveDaySliceYmd.value}_${effectiveDaySlicePart.value}`
}

function loadSlotDayStatusFromStorage(): void {
  if (!fromSchedule.value || !task.value) return
  try {
    const raw = localStorage.getItem(slotDayStatusStorageKey())
    if (raw && slotDayStatusOptions.some((o) => o.value === raw)) {
      slotDayStatus.value = raw
    } else {
      slotDayStatus.value = 'not_started'
    }
  } catch {
    slotDayStatus.value = 'not_started'
  }
}

function persistSlotDayStatus(): void {
  try {
    localStorage.setItem(slotDayStatusStorageKey(), slotDayStatus.value)
  } catch {
    /* ignore */
  }
}

function entryWorkYmdFromSchedule(e: { work_date?: string }): string {
  const w = e.work_date
  return typeof w === 'string' && w.length >= 10 ? w.slice(0, 10) : String(w ?? '')
}

async function loadScheduleAssignmentNote(): Promise<void> {
  scheduleAssignmentNote.value = ''
  scheduleEntryId.value = 0
  scheduleSlotDayPartResolved.value = ''
  if (!fromSchedule.value) return
  const d = scheduleWorkDate.value
  if (!d) return
  const pid = Number(projectId.value)
  const tid = Number(taskId.value)
  if (!pid || !Number.isFinite(tid)) return
  isScheduleSlotMetaLoading.value = true
  try {
    const uid = resolveSessionUserId(authStore.currentUser)
    const entries = await fetchMySchedule(d, d)
    const dayMatches = entries.filter((e) => {
      if (e.project_id !== pid || Number(e.task_id) !== tid) return false
      return entryWorkYmdFromSchedule(e) === d
    })
    let part: ScheduleDayPart | null =
      scheduleDayPart.value === 'am' || scheduleDayPart.value === 'pm' || scheduleDayPart.value === 'full'
        ? scheduleDayPart.value
        : null
    if (part == null && dayMatches.length === 1) {
      const dp = String(dayMatches[0].day_part ?? '').toLowerCase()
      if (dp === 'am' || dp === 'pm' || dp === 'full') part = dp
    }
    if (uid != null && part != null) {
      const rid = await resolveScheduleSlotIdForMessages(pid, uid, tid, d, part)
      if (rid > 0) scheduleEntryId.value = rid
      if (
        !(scheduleDayPart.value === 'am' || scheduleDayPart.value === 'pm' || scheduleDayPart.value === 'full')
      ) {
        scheduleSlotDayPartResolved.value = part
      }
    }
    const hit = entries.find((e) => {
      if (e.project_id !== pid || Number(e.task_id) !== tid) return false
      if (entryWorkYmdFromSchedule(e) !== d) return false
      if (part === 'am' || part === 'pm' || part === 'full') return e.day_part === part
      return dayMatches.length === 1 && e === dayMatches[0]
    })
    const note = hit?.assignment_note
    scheduleAssignmentNote.value = typeof note === 'string' ? note.trim() : ''
  } catch {
    scheduleAssignmentNote.value = ''
    scheduleEntryId.value = 0
  } finally {
    isScheduleSlotMetaLoading.value = false
  }
  await loadSlotDocuments()
}

async function loadSlotDocuments(): Promise<void> {
  documentsError.value = ''
  if (!fromSchedule.value || scheduleEntryId.value <= 0) {
    setupDocuments.value = []
    completedDocuments.value = []
    return
  }
  isSlotDocumentsLoading.value = true
  setupDocuments.value = []
  completedDocuments.value = []
  try {
    const data = await scheduleSlotDocumentsApi.fetch(Number(projectId.value), scheduleEntryId.value)
    setupDocuments.value = data.setup
    completedDocuments.value = data.completed
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } }
    documentsError.value = err.response?.data?.message || 'Could not load assignment files.'
  } finally {
    isSlotDocumentsLoading.value = false
  }
}

function persistWorkerNotes(): void {
  try {
    localStorage.setItem(workerNotesStorageKey(), workerNotes.value)
    notesSavedHint.value = 'Saved on this device.'
    window.setTimeout(() => {
      notesSavedHint.value = ''
    }, 2500)
  } catch {
    notesSavedHint.value = 'Could not save (storage full or blocked).'
    window.setTimeout(() => {
      notesSavedHint.value = ''
    }, 3500)
  }
}

const statusOptions = [
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'delayed', label: 'Delayed' },
]

const photosGroupedByDate = computed(() => {
  const list = [...photos.value].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
  const byDate = new Map<string, TaskPhoto[]>()
  for (const p of list) {
    const d = p.created_at.slice(0, 10)
    if (!byDate.has(d)) byDate.set(d, [])
    byDate.get(d)!.push(p)
  }
  return Array.from(byDate.entries()).map(([date, groupPhotos]) => ({
    date,
    dateLabel: new Date(date + 'T12:00:00').toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    photos: groupPhotos,
  }))
})

function formatDateRange(start: string | undefined, end: string | undefined): string {
  const s = start ? new Date(start).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''
  const e = end ? new Date(end).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''
  if (s && e && s !== e) return `${s} – ${e}`
  return s || e || '—'
}

function onFileSelected(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !file.type.startsWith('image/')) return
  if (fromSchedule.value) return

  const url = URL.createObjectURL(file)
  photos.value = [
    ...photos.value,
    {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      task_id: taskId.value,
      url,
      created_at: new Date().toISOString(),
    },
  ]
  input.value = ''
}

function openCompletedUploadDialog(): void {
  if (scheduleEntryId.value <= 0 || isUploadingCompletedDocument.value) return
  documentsError.value = ''
  documentsMessage.value = ''
  completedUploadDisplayNameDraft.value = ''
  selectedCompletedUploadFile.value = null
  isCompletedUploadDialogOpen.value = true
}

function closeCompletedUploadDialog(): void {
  if (isUploadingCompletedDocument.value) return
  isCompletedUploadDialogOpen.value = false
  selectedCompletedUploadFile.value = null
  completedUploadDisplayNameDraft.value = ''
}

function requestCompletedDialogFilePick(): void {
  if (isUploadingCompletedDocument.value) return
  completedDialogFileInputRef.value?.click()
}

function onCompletedDialogFilePicked(event: Event): void {
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
  selectedCompletedUploadFile.value = file
  if (target) target.value = ''
}

async function submitCompletedUploadFromDialog(): Promise<void> {
  const file = selectedCompletedUploadFile.value
  if (!file || scheduleEntryId.value <= 0) return
  documentsError.value = ''
  documentsMessage.value = ''
  isUploadingCompletedDocument.value = true
  try {
    const doc = await scheduleSlotDocumentsApi.upload(
      Number(projectId.value),
      scheduleEntryId.value,
      'completed',
      file,
      completedUploadDisplayNameDraft.value.trim(),
    )
    completedDocuments.value = [doc, ...completedDocuments.value]
    documentsMessage.value = 'File uploaded.'
    isCompletedUploadDialogOpen.value = false
    selectedCompletedUploadFile.value = null
    completedUploadDisplayNameDraft.value = ''
  } catch (e: unknown) {
    documentsError.value = getApiErrorMessage(e, 'Could not upload result file.')
  } finally {
    isUploadingCompletedDocument.value = false
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

async function openOrDownloadDocument(doc: ScheduleSlotDocument): Promise<void> {
  if (scheduleEntryId.value <= 0) return
  try {
    const blob = await scheduleSlotDocumentsApi.download(
      Number(projectId.value),
      scheduleEntryId.value,
      doc.id,
    )
    if (isPreviewableDocument(doc)) {
      openPreviewModal(blob, doc)
      return
    }
    triggerFileDownload(blob, doc.original_name || doc.file_name)
  } catch (e: unknown) {
    documentsError.value = getApiErrorMessage(e, 'Could not open document.')
  }
}

function formatUploadedAt(iso: string): string {
  const ms = Date.parse(iso)
  if (!Number.isFinite(ms)) return iso || '—'
  return new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
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

function isDeletingCompletedDocument(documentId: number): boolean {
  return deletingCompletedDocumentIds.value.includes(documentId)
}

function openCompletedDocumentRenameDialog(doc: ScheduleSlotDocument): void {
  if (scheduleEntryId.value <= 0) return
  documentsError.value = ''
  documentsMessage.value = ''
  editingCompletedDocument.value = doc
  completedEditDisplayNameDraft.value = doc.display_name || doc.original_name || ''
  isCompletedDocumentRenameDialogOpen.value = true
}

function closeCompletedDocumentRenameDialog(): void {
  if (isSavingCompletedDocumentName.value) return
  isCompletedDocumentRenameDialogOpen.value = false
  editingCompletedDocument.value = null
  completedEditDisplayNameDraft.value = ''
}

async function saveCompletedDocumentDisplayName(): Promise<void> {
  const eid = scheduleEntryId.value
  const doc = editingCompletedDocument.value
  if (eid <= 0 || !doc) return
  isSavingCompletedDocumentName.value = true
  documentsError.value = ''
  documentsMessage.value = ''
  try {
    const updated = await scheduleSlotDocumentsApi.updateDisplayName(
      Number(projectId.value),
      eid,
      doc.id,
      completedEditDisplayNameDraft.value,
    )
    completedDocuments.value = completedDocuments.value.map((item) => (item.id === updated.id ? updated : item))
    documentsMessage.value = 'Display name updated.'
    isCompletedDocumentRenameDialogOpen.value = false
    editingCompletedDocument.value = null
    completedEditDisplayNameDraft.value = ''
  } catch (err: unknown) {
    documentsError.value = getApiErrorMessage(err, 'Could not update document name.')
  } finally {
    isSavingCompletedDocumentName.value = false
  }
}

async function deleteCompletedDocument(doc: ScheduleSlotDocument): Promise<void> {
  const eid = scheduleEntryId.value
  if (eid <= 0) return
  const isConfirmed = window.confirm(
    `Delete "${doc.display_name || doc.original_name || doc.file_name}"? You can upload a new file afterward.`,
  )
  if (!isConfirmed) return

  documentsError.value = ''
  documentsMessage.value = ''
  deletingCompletedDocumentIds.value = [...deletingCompletedDocumentIds.value, doc.id]
  try {
    await scheduleSlotDocumentsApi.remove(Number(projectId.value), eid, doc.id)
    const refreshed = await scheduleSlotDocumentsApi.fetch(Number(projectId.value), eid)
    setupDocuments.value = refreshed.setup
    completedDocuments.value = refreshed.completed
    const stillExists = refreshed.completed.some((item) => item.id === doc.id)
    if (stillExists) {
      documentsError.value = 'The server still lists this file after delete. Try again or contact support.'
      return
    }
    documentsMessage.value = 'File deleted. You can upload again with a new name if needed.'
  } catch (err: unknown) {
    documentsError.value = getApiErrorMessage(err, 'Could not delete the document.')
  } finally {
    deletingCompletedDocumentIds.value = deletingCompletedDocumentIds.value.filter((id) => id !== doc.id)
  }
}

async function loadTask() {
  const pid = Number(projectId.value)
  const tid = taskId.value
  if (!pid || !tid) return
  isLoading.value = true
  workerNotes.value = ''
  notesSavedHint.value = ''
  try {
    const loaded = await tasksApi.getById(pid, tid)
    const uid = resolveSessionUserId(authStore.currentUser)
    const foreman = isTaskRoleForeman(authStore.currentUser?.role_code, authStore.currentUser?.role_id)
    const openedFromPublishedSchedule =
      authStore.currentUser?.role_category === 'task' &&
      (fromSchedule.value || route.query.from === 'schedule')
    if (
      !foreman &&
      uid != null &&
      loaded &&
      !isUserInvolvedInTask(loaded, uid) &&
      !openedFromPublishedSchedule
    ) {
      task.value = null
      scheduleAssignmentNote.value = ''
      scheduleEntryId.value = 0
    } else {
      task.value = loaded
      selectedStatus.value = mapStatusFromBackend(task.value?.status)
      loadWorkerNotes()
      if (fromSchedule.value) {
        await loadScheduleAssignmentNote()
        loadSlotDayStatusFromStorage()
      }
    }
  } catch {
    task.value = null
    scheduleAssignmentNote.value = ''
    scheduleEntryId.value = 0
  } finally {
    isLoading.value = false
  }
}

function mapStatusFromBackend(s: string | undefined): string {
  if (!s) return 'planned'
  const n = s.toLowerCase().replace(/-/g, '_').replace(/\s+/g, '_')
  const map: Record<string, string> = {
    planned: 'planned',
    in_progress: 'in_progress',
    done: 'done',
    blocked: 'blocked',
    delayed: 'delayed',
    completed: 'done',
    partially_completed: 'in_progress',
    ready_for_inspection: 'in_progress',
    delayed_due_to_issue: 'delayed',
    scheduled: 'planned',
    scheduled_accepted: 'planned',
  }
  return map[n] ?? 'planned'
}

async function saveStatus() {
  const pid = Number(projectId.value)
  const tid = taskId.value
  if (!pid || !tid || !task.value) return
  isSavingStatus.value = true
  try {
    const updated = await tasksApi.updateStatus(pid, tid, selectedStatus.value)
    task.value = updated
  } catch {
    selectedStatus.value = mapStatusFromBackend(task.value?.status)
  } finally {
    isSavingStatus.value = false
  }
}

onMounted(() => {
  loadTask()
})

onBeforeUnmount(() => {
  closePreviewModal()
  isCompletedDocumentRenameDialogOpen.value = false
  editingCompletedDocument.value = null
  isCompletedUploadDialogOpen.value = false
  selectedCompletedUploadFile.value = null
})

watch([projectId, taskId], () => {
  loadTask()
})

watch(
  () => [route.query.workDate, route.query.dayPart, projectId.value, taskId.value] as const,
  () => {
    if (task.value && fromSchedule.value) {
      void loadScheduleAssignmentNote().then(() => loadSlotDayStatusFromStorage())
    }
  },
)

watch(
  () =>
    [
      effectiveDaySliceYmd.value,
      effectiveDaySlicePart.value,
      projectId.value,
      taskId.value,
    ] as const,
  () => {
    if (fromSchedule.value && task.value) loadSlotDayStatusFromStorage()
  },
)
</script>

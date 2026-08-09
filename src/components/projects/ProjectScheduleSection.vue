<template>
  <div class="p-4 md:p-6 max-w-6xl mx-auto w-full min-w-0">
    <div class="mb-4 space-y-3">
      <div class="flex flex-col gap-2">
        <div
          class="flex flex-wrap gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 w-fit"
          role="tablist"
          aria-label="Schedule period"
        >
          <button
            type="button"
            role="tab"
            class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
            :class="periodMode === 'week' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'"
            :aria-selected="periodMode === 'week'"
            @click="setPeriodMode('week')"
          >
            Week
          </button>
          <button
            type="button"
            role="tab"
            class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
            :class="periodMode === 'month' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'"
            :aria-selected="periodMode === 'month'"
            @click="setPeriodMode('month')"
          >
            Month
          </button>
          <button
            type="button"
            role="tab"
            class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
            :class="periodMode === 'custom' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'"
            :aria-selected="periodMode === 'custom'"
            @click="setPeriodMode('custom')"
          >
            Custom
          </button>
        </div>

        <div v-if="periodMode === 'week'" class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title="Go to the previous calendar week (read-only before this week)"
            :disabled="isFetchingWeek"
            @click="weekOffset--"
          >
            ← Prev week
          </button>
          <span class="text-sm font-medium text-gray-900 min-w-0">{{ weekRangeLabel }}</span>
          <button
            type="button"
            class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isFetchingWeek"
            @click="weekOffset++"
          >
            Next week →
          </button>
        </div>

        <div v-else-if="periodMode === 'month'" class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm disabled:opacity-50"
            :disabled="isFetchingWeek"
            @click="shiftMonth(-1)"
          >
            ← Prev month
          </button>
          <span class="text-sm font-medium text-gray-900 min-w-0">{{ monthRangeLabel }}</span>
          <button
            type="button"
            class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm disabled:opacity-50"
            :disabled="isFetchingWeek"
            @click="shiftMonth(1)"
          >
            Next month →
          </button>
        </div>

        <div v-else class="flex flex-wrap items-end gap-3">
          <label class="flex flex-col gap-1 text-xs font-medium text-gray-700">
            From
            <input
              v-model="customFromYmd"
              type="date"
              class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-gray-900"
              :disabled="isFetchingWeek"
            />
          </label>
          <label class="flex flex-col gap-1 text-xs font-medium text-gray-700">
            To
            <input
              v-model="customToYmd"
              type="date"
              class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-gray-900"
              :disabled="isFetchingWeek"
            />
          </label>
          <p v-if="customRangeError" class="text-xs text-red-700 max-w-xs">{{ customRangeError }}</p>
          <p v-else class="text-xs text-gray-500">{{ periodRangeLabel }}</p>
        </div>

        <p class="text-xs text-gray-500 max-w-xl">
          <template v-if="periodMode === 'week'">
            You can open past weeks to review published history. Planning and drafts are only for this week
            and the future; days before today cannot be chosen in an editable draft.
          </template>
          <template v-else>
            Use Month / Custom to review days and the actual-hours total. To change destinations or reopen a
            published plan, open <strong class="font-medium text-gray-700">Week</strong>.
          </template>
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

    <div v-if="showInitialScheduleSpinner" class="flex flex-col items-center justify-center gap-3 py-16">
      <div class="animate-spin w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full" />
      <span class="text-sm font-medium text-gray-600">{{ scheduleLoadingLabel }}</span>
      <span v-if="periodMode !== 'week'" class="text-xs text-gray-500 max-w-xs text-center">
        Loading every week in this range — this can take a few seconds.
      </span>
    </div>

    <template v-else>
      <div v-if="!showScheduleTable" class="rounded-xl border border-gray-200 bg-white p-6 text-center">
        <template v-if="metaError">
          <p class="text-sm text-gray-600 mb-4">
            Schedule did not load. Fix the issue above, then retry.
          </p>
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            :disabled="isFetchingWeek"
            @click="onReloadWeekFromServer"
          >
            Retry load
          </button>
        </template>
        <template v-else>
          <p class="text-sm text-gray-600 mb-4">
            <template v-if="periodMode === 'week'">
              {{ isViewingPastWeek ? 'No schedule data for this week.' : 'No schedule draft for this week yet.' }}
            </template>
            <template v-else>
              No schedule data for this period yet.
            </template>
          </p>
          <button
            v-if="canEdit && periodMode === 'week' && !isViewingPastWeek"
            type="button"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            :disabled="isSaving || isFetchingWeek"
            @click="onCreateDraft"
          >
            Create draft week
          </button>
          <p v-else-if="canEdit && periodMode === 'week' && isViewingPastWeek" class="text-xs text-gray-500">
            Past weeks cannot be created or edited here.
          </p>
          <p v-else-if="canEdit && periodMode !== 'week'" class="text-xs text-gray-500">
            Switch to Week to create or edit a draft.
          </p>
          <p v-else-if="!canEdit && periodMode === 'week' && !isViewingPastWeek" class="text-xs text-gray-500">
            Only project managers can create the schedule.
          </p>
        </template>
      </div>

      <div v-else class="relative">
        <Transition name="schedule-week-overlay">
          <div
            v-if="showScheduleOverlay"
            class="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-white/75 backdrop-blur-[2px] min-h-[12rem]"
            aria-busy="true"
            aria-live="polite"
          >
            <div class="flex flex-col items-center gap-2 px-4">
              <div
                class="animate-spin w-9 h-9 border-2 border-blue-500 border-t-transparent rounded-full"
              />
              <span class="text-xs font-medium text-gray-600">{{ scheduleLoadingLabel }}</span>
            </div>
          </div>
        </Transition>

        <div
          class="transition-opacity duration-200 ease-out"
          :class="showScheduleOverlay ? 'opacity-50 pointer-events-none' : 'opacity-100'"
        >
        <div class="flex flex-col gap-1.5 mb-3">
          <div class="flex flex-wrap items-center gap-2">
            <template v-if="periodMode === 'week'">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="weekLifecycleBadgeClass"
              >
                {{ weekLifecycleStatusLabel }}
              </span>
              <span class="text-xs text-gray-500">{{ periodRangeLabel }}</span>
            </template>
            <span v-else class="text-xs text-gray-500">{{ periodRangeLabel }}</span>
          </div>
          <p v-if="selectedWorkerScheduleSummary" class="text-xs text-gray-600 max-w-3xl leading-snug">
            {{ selectedWorkerScheduleSummary }}
          </p>
        </div>

        <div
          v-if="canReopenPublishedWeek"
          class="mb-3 flex flex-col sm:flex-row sm:items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5"
        >
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-amber-950">Editing is locked while the week is published</p>
            <p class="text-xs text-amber-900/90 mt-0.5">
              Reopen turns the <strong class="font-medium text-amber-950">whole week</strong> into a draft so you can add rows and publish again. Workers keep seeing the last published version until you publish.
            </p>
          </div>
          <button
            type="button"
            class="shrink-0 px-4 py-2 text-sm font-medium text-amber-950 bg-amber-100 border border-amber-300 rounded-lg hover:bg-amber-200 disabled:opacity-45"
            :disabled="isSaving || isFetchingWeek"
            @click="onReopenPublishedWeekAsDraft"
          >
            Reopen week for editing
          </button>
        </div>

        <div
          v-else-if="showPeriodReadOnlyBanner"
          class="mb-3 flex flex-col sm:flex-row sm:items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5"
        >
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-slate-900">Month and Custom are review-only</p>
            <p class="text-xs text-slate-700 mt-0.5">
              Here you browse days and see the <strong class="font-medium text-slate-900">Actual hours</strong> total.
              Drafts, Reopen, Save, and Publish work only in
              <strong class="font-medium text-slate-900">Week</strong> (one calendar week at a time).
            </p>
          </div>
          <button
            type="button"
            class="shrink-0 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-45"
            :disabled="isFetchingWeek"
            @click="goToWeekForEditing"
          >
            Edit in Week view
          </button>
        </div>

        <div class="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm w-full">
          <table class="w-full table-fixed divide-y divide-gray-200 text-sm">
            <colgroup>
              <col class="w-[14%]" />
              <col class="w-[28%]" />
              <col class="w-[28%]" />
              <col class="w-[30%]" />
            </colgroup>
            <thead class="bg-gray-50">
              <tr>
                <th colspan="4" class="px-3 py-3 text-left align-middle border-b border-gray-200">
                  <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <label class="flex items-center gap-2 min-w-0">
                      <span class="text-xs font-medium text-gray-700 shrink-0">Worker</span>
                      <select
                        v-model.number="selectedPlannerWorkerId"
                        class="min-w-[12rem] max-w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                        :disabled="workerSelectDisabled || isFetchingWeek"
                      >
                        <option :value="0">Select worker…</option>
                        <option v-for="w in workerOptions" :key="w.user_id" :value="w.user_id">
                          {{ w.label }}
                        </option>
                      </select>
                    </label>
                  </div>
                </th>
              </tr>
              <tr>
                <th class="px-3 py-2 text-left font-medium text-gray-700">Day</th>
                <th class="px-3 py-2 text-left font-medium text-gray-700">Destination</th>
                <th class="px-3 py-2 text-left font-medium text-gray-700">Day notes</th>
                <th class="px-2 py-2 text-left font-medium text-gray-700">
                  <div class="grid grid-cols-5 gap-1 w-full text-[9px] uppercase tracking-wide text-gray-500 font-medium">
                    <span>Km</span>
                    <span title="Expected start">Exp start</span>
                    <span title="Expected finish">Exp end</span>
                    <span title="Actual clock-in from phone">Act start</span>
                    <span title="Actual clock-out from phone">Act end</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="slot in weekTemplateView"
                :key="slot.rowKey"
                :class="[
                  slot.row &&
                  isScheduleEditable &&
                  assignmentNoteLength(slot.row) > assignmentNoteMaxChars
                    ? 'bg-red-50/80'
                    : '',
                  isScheduleEditable && isPastPlanDayYmd(slot.ymd) ? 'bg-gray-50/90' : '',
                ]"
              >
                <td class="px-3 py-2 align-top">
                  <div class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span class="text-gray-900 font-medium">{{ slot.dayLabel }}</span>
                    <span
                      v-if="isScheduleEditable && isPastPlanDayYmd(slot.ymd)"
                      class="text-xs font-normal text-gray-400"
                    >
                      Past — read only
                    </span>
                  </div>
                  <button
                    v-if="!slot.row && isScheduleEditable && !isPastPlanDayYmd(slot.ymd)"
                    type="button"
                    class="mt-1 text-sm font-medium text-blue-700 hover:text-blue-900"
                    @click="assignWeekDay(slot.ymd)"
                  >
                    + Set day
                  </button>
                  <span
                    v-else-if="!slot.row"
                    class="mt-1 block text-sm text-gray-400"
                  >
                    —
                  </span>
                </td>
                <td class="px-3 py-2 align-top">
                  <template v-if="slot.row">
                    <div class="flex items-start gap-1">
                      <div class="min-w-0 flex-1">
                        <select
                          v-if="isScheduleEditable && !isPastPlanDayYmd(slot.ymd)"
                          class="w-full rounded border border-gray-300 text-sm bg-white"
                          :value="String(slot.row.project_id)"
                          @change="onRowProjectChange(slot.row, $event)"
                        >
                          <option
                            v-for="p in projectOptions"
                            :key="p.id"
                            :value="String(p.id)"
                          >
                            {{ p.name }}
                          </option>
                        </select>
                        <span v-else class="text-sm text-gray-900">{{ projectNameById(slot.row.project_id) }}</span>
                        <p
                          v-if="projectAddressById(slot.row.project_id)"
                          class="mt-1 text-[11px] text-gray-500 leading-snug line-clamp-2"
                          :title="projectAddressById(slot.row.project_id) || undefined"
                        >
                          {{ projectAddressById(slot.row.project_id) }}
                        </p>
                      </div>
                      <button
                        v-if="isScheduleEditable && !isPastPlanDayYmd(slot.ymd)"
                        type="button"
                        class="inline-flex shrink-0 items-center justify-center p-1.5 rounded-md transition-colors text-gray-600 hover:text-amber-700 hover:bg-amber-50"
                        title="Clear this day"
                        aria-label="Clear this day"
                        @click="clearWeekDayRow(slot.row)"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </template>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="px-3 py-2 align-top">
                  <template v-if="slot.row">
                    <textarea
                      v-if="isScheduleEditable && !isPastPlanDayYmd(slot.ymd)"
                      v-model="slot.row.assignment_note"
                      rows="3"
                      class="w-full rounded border border-gray-300 text-sm px-2 py-1"
                      :maxlength="assignmentNoteMaxChars"
                      placeholder="Expectations for the day…"
                      @input="markProjectDirty(slot.row.project_id)"
                    />
                    <span
                      v-else-if="slot.row.assignment_note"
                      class="text-sm text-gray-800 whitespace-pre-wrap break-words"
                    >
                      {{ slot.row.assignment_note }}
                    </span>
                    <span v-else class="text-gray-400">—</span>
                    <div class="mt-1.5">
                      <RouterLink
                        v-if="slotPlanLocation(slot.row)"
                        :to="slotPlanLocation(slot.row)!"
                        class="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-900"
                        title="Open the full day-notes editor (longer text + optional setup docs)"
                      >
                        <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                          />
                        </svg>
                        Full day notes
                      </RouterLink>
                      <span
                        v-else-if="isScheduleEditable && !isPastPlanDayYmd(slot.ymd)"
                        class="text-[11px] text-gray-400"
                        title="Save the draft first so this day has a server id"
                      >
                        Save draft to open full day notes
                      </span>
                    </div>
                  </template>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="px-2 py-2 align-top">
                  <template v-if="slot.row">
                    <div class="grid grid-cols-5 gap-1 items-center w-full">
                      <div>
                        <input
                          v-if="isScheduleEditable && !isPastPlanDayYmd(slot.ymd)"
                          :value="slot.row.distance_km"
                          type="text"
                          inputmode="numeric"
                          pattern="[0-9]*"
                          class="w-full max-w-[3.25rem] rounded border border-gray-300 text-sm px-1.5 py-1 tabular-nums"
                          :maxlength="distanceKmMaxChars"
                          placeholder="—"
                          title="Trip km when travel applies"
                          @input="onDistanceKmInput(slot.row, $event)"
                        />
                        <span v-else class="block text-sm text-gray-800 tabular-nums">
                          {{ slot.row.distance_km?.trim() || '—' }}
                        </span>
                      </div>
                      <div>
                        <input
                          v-if="isScheduleEditable && !isPastPlanDayYmd(slot.ymd)"
                          type="time"
                          class="w-full min-w-0 rounded border border-gray-300 text-[11px] px-0.5 py-1 tabular-nums"
                          :value="slot.row.expected_start_time || ''"
                          title="Expected start"
                          @input="onExpectedTimeInput(slot.row, 'expected_start_time', $event)"
                        />
                        <span v-else class="block text-sm tabular-nums text-gray-800">
                          {{ slot.row.expected_start_time || '—' }}
                        </span>
                      </div>
                      <div>
                        <input
                          v-if="isScheduleEditable && !isPastPlanDayYmd(slot.ymd)"
                          type="time"
                          class="w-full min-w-0 rounded border border-gray-300 text-[11px] px-0.5 py-1 tabular-nums"
                          :value="slot.row.expected_end_time || ''"
                          title="Expected finish"
                          @input="onExpectedTimeInput(slot.row, 'expected_end_time', $event)"
                        />
                        <span v-else class="block text-sm tabular-nums text-gray-800">
                          {{ slot.row.expected_end_time || '—' }}
                        </span>
                      </div>
                      <span
                        class="text-sm tabular-nums"
                        :class="slot.row.work_start_at ? 'text-gray-800' : 'text-gray-400'"
                        title="Actual clock-in from phone"
                      >
                        {{ formatCheckInTime(slot.row.work_start_at) }}
                      </span>
                      <span
                        class="text-sm tabular-nums"
                        :class="slot.row.work_end_at ? 'text-gray-800' : 'text-gray-400'"
                        title="Actual clock-out from phone"
                      >
                        {{ formatCheckInTime(slot.row.work_end_at) }}
                      </span>
                    </div>
                  </template>
                  <span v-else class="text-gray-400">—</span>
                </td>
              </tr>
            </tbody>
            <tfoot v-if="selectedPlannerWorkerId > 0 && weekTemplateView.length > 0">
              <tr class="bg-gray-50 border-t border-gray-200">
                <td colspan="3" class="px-3 py-3 text-sm text-gray-700">
                  <span class="font-medium text-gray-900">Actual hours</span>
                  <span class="text-gray-500"> (sum of Act end − Act start for days with both punches)</span>
                </td>
                <td class="px-3 py-3 text-right text-sm font-semibold text-gray-900 tabular-nums whitespace-nowrap">
                  {{ formatHoursTotal(periodActualHoursTotal) }}
                  <span class="font-normal text-gray-500 text-xs ml-1">
                    · {{ periodActualDaysCounted }} day{{ periodActualDaysCounted === 1 ? '' : 's' }}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p
          v-if="canEdit && isDraft && selectedPlannerWorkerId > 0 && plannerWorkers.length === 0"
          class="text-amber-800 text-xs mt-2"
        >
          No project team members available for scheduling.
        </p>

        <div v-if="selectedPlannerWorkerId <= 0" class="text-sm text-gray-500 mt-2">
          Select a worker in the table header to see days for this period.
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
          There is still a <strong class="font-medium text-amber-950">slot or note on a calendar day before today</strong>
          — planning is forward-only.
          <strong class="font-medium text-amber-950">Save and Publish stay off</strong> until this is cleared
          (use the button below, then <strong class="font-medium text-amber-950">Save draft</strong> so the server matches).
        </div>
        <div
          v-if="isScheduleEditable && hasRowsOnPastDays"
          class="mt-2 flex flex-col gap-2"
        >
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="px-3 py-2 text-sm font-medium text-amber-900 bg-white border border-amber-300 rounded-lg hover:bg-amber-50 disabled:opacity-45"
              :disabled="isSaving || isFetchingWeek || pastDayRowCount === 0"
              @click="onRemovePastDayRows"
            >
              Clear {{ pastDayRowCount }} past-day assignment(s)
            </button>
            <button
              type="button"
              class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-45"
              :disabled="isSaving || isFetchingWeek"
              @click="onReloadWeekFromServer"
            >
              Reload from server
            </button>
          </div>
          <p class="text-xs text-amber-900/85 max-w-3xl leading-snug">
            <strong class="font-medium text-amber-950">Clear</strong> only updates this page. To remove past assignments on the
            server, click <strong class="font-medium text-amber-950">Save draft</strong> after clearing.
            <strong class="font-medium text-amber-950">Reload</strong> loads the last <em>saved</em> week from the server and
            drops changes you have not saved yet (including a Clear you did not save).
          </p>
        </div>
        <div
          v-if="isScheduleEditable && hasAnyAssignmentNoteTooLong"
          class="mt-2 text-sm text-amber-800 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2"
        >
          Assignment text must be at most {{ assignmentNoteMaxChars }} characters (check highlighted rows).
        </div>
        <div v-if="isScheduleEditable" class="mt-4 flex flex-wrap gap-2 items-center">
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            :disabled="isSaving || isFetchingWeek || !weekMeta || scheduleSaveDraftBlocked"
            :title="saveDraftDisabledTitle"
            @click="onSaveEntries"
          >
            Save draft
          </button>
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
            :disabled="isSaving || isFetchingWeek || !weekMeta || schedulePublishBlocked"
            :title="publishWeekDisabledTitle"
            @click="onPublish"
          >
            Publish week
          </button>
          <button
            v-if="!hasRowsOnPastDays"
            type="button"
            class="px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-45"
            :disabled="isSaving || isFetchingWeek"
            title="Load the last saved week from the server (unsaved edits in this tab are lost)"
            @click="onReloadWeekFromServer"
          >
            Reload from server
          </button>
        </div>
        <p v-if="isScheduleEditable" class="mt-3 text-xs text-gray-600 max-w-3xl leading-relaxed">
          <strong class="text-gray-800">Saving:</strong>
          Nothing is stored on the server until you click <strong class="text-gray-800">Save draft</strong> or
          <strong class="text-gray-800">Publish week</strong>.
          <strong class="text-gray-800">Save draft</strong> writes the whole draft week (you can save with all slots cleared — that removes assignments on the server).
          <strong class="text-gray-800">Publish week</strong> still needs at least one real assignment on this week.
          If past days still have a task or note, clear them first — planning is forward-only.
          <strong class="text-gray-800">Reload from server</strong> replaces this view with the last saved data and
          discards unsaved edits in this tab.
        </p>

        <p
          v-if="isViewingPastWeek && !isDraft && canEdit"
          class="text-xs text-gray-500 mt-3"
        >
          Published history for a past week — read only. Open the current or a future week to plan or reopen a draft.
        </p>
        <p v-else-if="isViewingPastWeek" class="text-xs text-gray-500 mt-3">
          Past week — read only. Move to this week or later to edit drafts or create new ones.
        </p>
        <p v-else-if="!isDraft && !canEdit" class="text-xs text-gray-500 mt-3">
          This week is published. Pick a worker above to review their lines.
        </p>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, RouterLink, type RouteLocationRaw } from 'vue-router'
import axios from 'axios'
import type { ProjectTeamMember } from '@/core/utils/project-api'
import {
  fetchProjectScheduleWeek,
  ensureProjectScheduleDraft,
  replaceProjectScheduleEntries,
  publishProjectScheduleWeek,
  fetchUserSchedule,
  reopenProjectScheduleWeekAsDraft,
  mergeScheduleWeekMetaAfterWrite,
  type ScheduleWeekMeta,
  type ScheduleWeekEntryRow,
  type ScheduleDayPart,
  type MyScheduleEntry,
  ASSIGNMENT_NOTE_MAX_CHARS,
} from '@/core/utils/schedule-weeks-api'
import { addDays, startOfWeekMonday, startOfMonth, endOfMonth, toYmd, weekStartMondayYmdFromIsoDate, eachYmdInRange, mondaysCoveringRange, parseYmdLocal, hoursBetweenTimestamps } from '@/core/utils/week-utils'

/** Stable positive user id for schedule rows (avoids string/number mismatch vs worker select). */
function scheduleUserId(raw: unknown): number {
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : 0
}

function sliceWorkYmd(work: string): string {
  const w = String(work ?? '')
  return w.length >= 10 ? w.slice(0, 10) : w
}

/** Local planner row — `project_id` is UI/save routing only (not sent in entry payload). */
interface PlannerScheduleRow extends ScheduleWeekEntryRow {
  project_id: number
}

interface ScheduleProjectOption {
  id: number
  name: string
  address?: string
}

const props = withDefaults(
  defineProps<{
    /** Projects available in the Projects column dropdown. */
    projects: ScheduleProjectOption[]
    /** Default project for new assignments (+ Assign). */
    defaultProjectId?: number
    canEdit: boolean
    teamMembers: ProjectTeamMember[]
    /** @deprecated Prefer `projects` + `defaultProjectId`. */
    projectId?: number
    /** @deprecated Prefer `projects`. */
    projectName?: string
    /** @deprecated Schedule is independent of tasks; kept optional for callers. */
    tasks?: unknown[]
  }>(),
  { defaultProjectId: 0, projectId: 0, projectName: '' },
)

const route = useRoute()

const projectOptions = computed((): ScheduleProjectOption[] => {
  if (props.projects.length > 0) return props.projects
  const id = props.defaultProjectId > 0 ? props.defaultProjectId : props.projectId
  if (id > 0) {
    const name = (props.projectName || '').trim() || `Project #${id}`
    return [{ id, name }]
  }
  return []
})

const fallbackProjectId = computed(() => {
  if (props.defaultProjectId > 0) return props.defaultProjectId
  if (props.projectId > 0) return props.projectId
  return projectOptions.value[0]?.id ?? 0
})

const managedProjectIdSet = computed(() => new Set(projectOptions.value.map((p) => p.id)))

function projectNameById(projectId: number): string {
  const found = projectOptions.value.find((p) => p.id === projectId)
  if (found) return found.name
  return projectId > 0 ? `Project #${projectId}` : '—'
}

function projectAddressById(projectId: number): string {
  const found = projectOptions.value.find((p) => p.id === projectId)
  const addr = (found?.address || '').trim()
  return addr
}

async function mapPool<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  async function worker(): Promise<void> {
    while (next < items.length) {
      const idx = next++
      results[idx] = await fn(items[idx]!)
    }
  }
  const n = Math.min(Math.max(1, concurrency), Math.max(1, items.length))
  if (items.length === 0) return results
  await Promise.all(Array.from({ length: n }, () => worker()))
  return results
}

/** Align with `?week_start=` when returning from slot assignment (Cancel / Back). */
function weekOffsetFromWeekStartQuery(raw: unknown): number {
  if (typeof raw !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return 0
  const targetMon = weekStartMondayYmdFromIsoDate(raw)
  const nowMon = toYmd(startOfWeekMonday(new Date()))
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  const diff = Math.round(
    (new Date(`${targetMon}T12:00:00`).getTime() - new Date(`${nowMon}T12:00:00`).getTime()) /
      msPerWeek,
  )
  return Number.isFinite(diff) ? diff : 0
}

const weekOffset = ref(weekOffsetFromWeekStartQuery(route.query.week_start))

type SchedulePeriodMode = 'week' | 'month' | 'custom'
const periodMode = ref<SchedulePeriodMode>('week')
const monthCursor = ref(startOfMonth(new Date()))
const todayStr = toYmd(new Date())
const customFromYmd = ref(todayStr)
const customToYmd = ref(todayStr)
/** True after a successful month/custom load (even if there are zero rows). */
const periodDataReady = ref(false)
/** Monotonic token so overlapping loads cannot overwrite a newer result. */
let scheduleLoadGen = 0

const MAX_PERIOD_DAYS = 62
/** True while GET schedule-weeks is in flight */
const isFetchingWeek = ref(false)

function scheduleLoadFailureMessage(statuses: Array<number | undefined>): string {
  if (statuses.some((s) => s === 401)) {
    return 'Could not load schedule (not authorized). Refresh the page or sign in again.'
  }
  if (statuses.some((s) => s === 403)) {
    return 'Could not load schedule (no access to this project).'
  }
  if (statuses.some((s) => s === 404)) {
    return 'Could not load schedule (project not found).'
  }
  return 'Could not load schedule (API unavailable or no access).'
}

function axiosStatus(err: unknown): number | undefined {
  if (axios.isAxiosError(err)) return err.response?.status
  return undefined
}
const isSaving = ref(false)
const metaError = ref('')
const bannerError = ref('')
/** Per-project week meta for the visible calendar week. */
const weekByProjectId = ref<Record<number, ScheduleWeekMeta | null>>({})
/** Aggregate week meta for badges / empty state (prefer a draft). */
const weekMeta = ref<ScheduleWeekMeta | null>(null)
const allDraftRows = ref<PlannerScheduleRow[]>([])
/** Projects whose entry sets must be written on Save / Publish. */
const dirtyProjectIds = ref<Set<number>>(new Set())
const selectedPlannerWorkerId = ref(0)
const externalBusyEntries = ref<MyScheduleEntry[]>([])

function markProjectDirty(projectId: number): void {
  if (projectId <= 0) return
  const next = new Set(dirtyProjectIds.value)
  next.add(projectId)
  dirtyProjectIds.value = next
}

function clearDirtyProjects(): void {
  dirtyProjectIds.value = new Set()
}

function syncPrimaryWeekMeta(): void {
  const metas = Object.values(weekByProjectId.value).filter((w): w is ScheduleWeekMeta => w != null)
  const synced = metas.filter((w) => {
    const raw = String(w.week_start ?? '').trim()
    if (raw.length < 10) return false
    return weekStartMondayYmdFromIsoDate(raw.slice(0, 10)) === weekStartYmd.value
  })
  const pool = synced.length > 0 ? synced : metas
  weekMeta.value = pool.find((w) => w.status === 'draft') ?? pool[0] ?? null
}

function weekMetaForProject(projectId: number): ScheduleWeekMeta | null {
  return weekByProjectId.value[projectId] ?? null
}

const assignmentNoteMaxChars = ASSIGNMENT_NOTE_MAX_CHARS
/** Max digits for PM distance_km input (e.g. 12, 125). */
const distanceKmMaxChars = 3

const weekMonday = computed(() => {
  const base = new Date()
  const monday = startOfWeekMonday(base)
  monday.setDate(monday.getDate() + weekOffset.value * 7)
  return monday
})

const weekStartYmd = computed(() => toYmd(weekMonday.value))

const weekEndYmd = computed(() => toYmd(addDays(weekMonday.value, 6)))

const customRangeError = computed(() => {
  if (periodMode.value !== 'custom') return ''
  const from = customFromYmd.value
  const to = customToYmd.value
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return 'Pick valid From and To dates.'
  }
  if (from > to) return 'From must be on or before To.'
  const days = eachYmdInRange(from, to, MAX_PERIOD_DAYS + 1)
  if (days.length > MAX_PERIOD_DAYS) {
    return `Range is limited to ${MAX_PERIOD_DAYS} days.`
  }
  return ''
})

const viewFromYmd = computed(() => {
  if (periodMode.value === 'week') return weekStartYmd.value
  if (periodMode.value === 'month') return toYmd(startOfMonth(monthCursor.value))
  return customFromYmd.value
})

const viewToYmd = computed(() => {
  if (periodMode.value === 'week') return weekEndYmd.value
  if (periodMode.value === 'month') return toYmd(endOfMonth(monthCursor.value))
  return customToYmd.value
})

const showScheduleTable = computed(() => {
  if (periodMode.value === 'week') return weekMeta.value != null
  return periodDataReady.value
})

const monthRangeLabel = computed(() =>
  monthCursor.value.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
)

const periodRangeLabel = computed(() => {
  if (periodMode.value === 'week') return `Week ${weekStartYmd.value} – ${weekEndYmd.value}`
  if (periodMode.value === 'month') return monthRangeLabel.value
  return `${viewFromYmd.value} – ${viewToYmd.value}`
})

function setPeriodMode(mode: SchedulePeriodMode): void {
  if (periodMode.value === mode) return
  periodMode.value = mode
  if (mode === 'month') {
    monthCursor.value = startOfMonth(new Date())
  }
  if (mode === 'custom') {
    const t = toYmd(new Date())
    customFromYmd.value = t
    customToYmd.value = t
  }
  void loadScheduleForCurrentPeriod()
}

/** From Month/Custom: jump to Week so PM can draft / reopen / publish. */
function goToWeekForEditing(): void {
  weekOffset.value = 0
  setPeriodMode('week')
}

function shiftMonth(delta: number): void {
  const d = new Date(monthCursor.value.getFullYear(), monthCursor.value.getMonth() + delta, 1)
  monthCursor.value = d
}

function formatHoursTotal(n: number): string {
  if (!Number.isFinite(n) || n === 0) return '0 h'
  const s = Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '')
  return `${s} h`
}

/** GET response matches the week the user navigated to (toolbar / template dates). */
const scheduleViewSynced = computed(() => {
  if (weekMeta.value == null) return false
  const w = String(weekMeta.value.week_start ?? '').trim()
  if (w.length < 10 || !/^\d{4}-\d{2}-\d{2}/.test(w.slice(0, 10))) return false
  const metaMon = weekStartMondayYmdFromIsoDate(w.slice(0, 10))
  return metaMon === weekStartYmd.value
})

/** Full-page spinner when there is nothing useful to show yet (first load / empty → loading). */
const showInitialScheduleSpinner = computed(
  () => isFetchingWeek.value && !showScheduleTable.value,
)

/** In-place overlay when switching periods while the previous table is still on screen. */
const showScheduleOverlay = computed(
  () => isFetchingWeek.value && showScheduleTable.value,
)

const scheduleLoadingLabel = computed(() => {
  if (periodMode.value === 'month') return 'Loading month…'
  if (periodMode.value === 'custom') return 'Loading period…'
  return 'Loading week…'
})

/** Local calendar today YYYY-MM-DD — no draft planning on earlier dates */
const todayYmd = computed(() => toYmd(new Date()))

/** Draft planning is forward-only: days before local today cannot be edited (matches day badges). */
function isPastPlanDayYmd(ymd: string): boolean {
  return sliceWorkYmd(ymd) < todayYmd.value
}

/**
 * Empty template rows for Mon–Tue in the current week are still "past" dates but must NOT block save.
 * Only rows with an assignment (task or note) on a past calendar day block publish/save.
 */
function isPastDayRowBlockingSave(r: ScheduleWeekEntryRow): boolean {
  if (!r.work_date) return false
  if (sliceWorkYmd(r.work_date) >= todayYmd.value) return false
  // Any saved/active presence row on a past day blocks forward-only planning
  return scheduleUserId(r.user_id) > 0
}

const weekRangeLabel = computed(() => {
  const end = addDays(weekMonday.value, 6)
  const a = weekMonday.value.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const b = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  return `${a} – ${b}`
})

const dayChoices = computed(() => {
  const ymds =
    periodMode.value === 'week'
      ? eachYmdInRange(weekStartYmd.value, weekEndYmd.value, 7)
      : customRangeError.value
        ? []
        : eachYmdInRange(viewFromYmd.value, viewToYmd.value, MAX_PERIOD_DAYS)
  const out: { ymd: string; label: string }[] = []
  for (const ymd of ymds) {
    const d = parseYmdLocal(ymd)
    out.push({
      ymd,
      label: d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
    })
  }
  return out
})

const workerOptions = computed(() => {
  const byUser = new Map<number, { user_id: number; label: string }>()
  for (const m of props.teamMembers) {
    const uid = Number(m.user_id)
    if (!Number.isFinite(uid) || uid <= 0) continue
    if (byUser.has(uid)) continue
    const label = String(m.name ?? m.email ?? `User ${uid}`).trim() || `User ${uid}`
    byUser.set(uid, { user_id: uid, label })
  }
  return [...byUser.values()].sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }))
})

const plannerWorkers = workerOptions

const selectedPlannerWorkerLabel = computed(() => {
  const sel = scheduleUserId(selectedPlannerWorkerId.value)
  if (sel <= 0) return ''
  const w = workerOptions.value.find((x) => x.user_id === sel)
  return (w?.label ?? '').trim()
})

const isDraft = computed(() =>
  Object.values(weekByProjectId.value).some((w) => w != null && w.status === 'draft'),
)

/** Any slot rows for this calendar week (all workers), from GET / PUT response */
const hasAnyWeekEntries = computed(() => allDraftRows.value.length > 0)

function hasEntriesForWorkerUserId(userId: number): boolean {
  if (userId <= 0) return false
  return allDraftRows.value.some((r) => scheduleUserId(r.user_id) === userId)
}

/** Server lifecycle — draft if any project week is draft; else published if any; else empty */
const weekLifecycleStatusLabel = computed(() => {
  if (periodMode.value !== 'week') return 'Read-only'
  if (!weekMeta.value) return ''
  return isDraft.value ? 'Draft' : 'Published'
})

const weekLifecycleBadgeClass = computed(() => {
  if (periodMode.value !== 'week') return 'bg-slate-100 text-slate-700'
  if (!weekMeta.value) return 'bg-gray-100 text-gray-700'
  return isDraft.value ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
})

/** Clarifies selected worker vs week when the week is published but this worker has no rows */
const selectedWorkerScheduleSummary = computed(() => {
  const sel = scheduleUserId(selectedPlannerWorkerId.value)
  if (sel <= 0) return ''
  if (hasEntriesForWorkerUserId(sel)) return ''
  if (!weekMeta.value || isDraft.value) return ''
  const name = selectedPlannerWorkerLabel.value || 'This worker'
  if (!hasAnyWeekEntries.value) {
    return `${name} has no assignments. This week is published but has no schedule rows yet.`
  }
  return `${name} has no assignments on this published week (other workers may). Reopen the week as a draft to add rows, then use Add row.`
})

const workerSelectDisabled = computed(() => isDraft.value && !props.canEdit)

/** Navigated before the current ISO week — browse historical schedules read-only */
const isViewingPastWeek = computed(() => weekOffset.value < 0)

/** Editable draft rows: PM role, draft status, week mode only, and not a past calendar week */
const isScheduleEditable = computed(
  () =>
    periodMode.value === 'week' &&
    props.canEdit &&
    isDraft.value &&
    !isViewingPastWeek.value,
)

const hasRowsOnPastDays = computed(
  () => isScheduleEditable.value && allDraftRows.value.some(isPastDayRowBlockingSave),
)

/** True when the viewed ISO week still includes today or a future calendar day (Mon..Sun range). */
const weekStillHasPlanableDays = computed(() => weekEndYmd.value >= todayYmd.value)

const pastDayRowCount = computed(() => allDraftRows.value.filter(isPastDayRowBlockingSave).length)

/** Rows that pass validation and can be persisted (at least one task/day/slot assignment). */
const saveableRowCount = computed(() => allDraftRows.value.filter((r) => isRowSaveable(r)).length)

/** Blocks Save draft (past-day violations, conflicts, note length). Empty week is allowed — PUT can clear all slots. */
const scheduleSaveDraftBlocked = computed(
  () =>
    hasRowsOnPastDays.value ||
    hasAnySlotConflict.value ||
    hasAnyAssignmentNoteTooLong.value,
)

/** Publish still requires at least one persisted assignment (product rule). */
const schedulePublishBlocked = computed(
  () => scheduleSaveDraftBlocked.value || saveableRowCount.value === 0,
)

const saveDraftDisabledTitle = computed(() => {
  if (!isScheduleEditable.value || !weekMeta.value) return ''
  if (isFetchingWeek.value) return 'Loading this week from the server…'
  if (isSaving.value) return 'Saving…'
  if (hasRowsOnPastDays.value) {
    return 'Clear past-day slots or notes (button above), then save.'
  }
  if (hasAnySlotConflict.value) return 'Resolve overlapping slots first.'
  if (hasAnyAssignmentNoteTooLong.value) return `Shorten assignment text to ${assignmentNoteMaxChars} characters or less.`
  return ''
})

const publishWeekDisabledTitle = computed(() => {
  if (!isScheduleEditable.value || !weekMeta.value) return ''
  if (isFetchingWeek.value) return 'Loading this week from the server…'
  if (isSaving.value) return 'Saving…'
  if (hasRowsOnPastDays.value) {
    return 'Clear past-day slots or notes before publishing — planning is forward-only.'
  }
  if (hasAnySlotConflict.value) return 'Resolve overlapping slots first.'
  if (hasAnyAssignmentNoteTooLong.value) return `Shorten assignment text to ${assignmentNoteMaxChars} characters or less.`
  if (saveableRowCount.value === 0) {
    return 'Assign at least one day on this week before publishing.'
  }
  return ''
})

interface WeekDaySlotVm {
  ymd: string
  dayLabel: string
  row: PlannerScheduleRow | null
  rowKey: string
}

/** Exactly one row per calendar day (full working day only). */
const weekTemplateView = computed((): WeekDaySlotVm[] => {
  const uid = scheduleUserId(selectedPlannerWorkerId.value)
  if (uid <= 0) return []
  const out: WeekDaySlotVm[] = []
  for (const dc of dayChoices.value) {
    const matches = allDraftRows.value.filter(
      (r) => scheduleUserId(r.user_id) === uid && sliceWorkYmd(r.work_date) === dc.ymd,
    )
    const row = matches.length > 0 ? pickBestDuplicateRow(matches) : null
    out.push({
      ymd: dc.ymd,
      dayLabel: dc.label,
      row,
      rowKey: row
        ? `${dc.ymd}-full-${row.id ?? 'new'}-${scheduleUserId(row.user_id)}`
        : `${dc.ymd}-empty`,
    })
  }
  return out
})

const periodActualHoursTotal = computed(() => {
  let sum = 0
  for (const slot of weekTemplateView.value) {
    const h = hoursBetweenTimestamps(slot.row?.work_start_at, slot.row?.work_end_at)
    if (h != null) sum += h
  }
  return Math.round(sum * 100) / 100
})

const periodActualDaysCounted = computed(() => {
  let n = 0
  for (const slot of weekTemplateView.value) {
    if (hoursBetweenTimestamps(slot.row?.work_start_at, slot.row?.work_end_at) != null) n += 1
  }
  return n
})

const hasAnySlotConflict = computed(() =>
  allDraftRows.value.some((r) => r.user_id > 0 && hasWorkerSlotConflict(r)),
)

function assignmentNoteLength(row: ScheduleWeekEntryRow): number {
  const s = row.assignment_note
  return typeof s === 'string' ? s.length : 0
}

/** Full day-notes editor (ProjectScheduleSlotPlan) — requires a saved entry id. */
function slotPlanLocation(row: PlannerScheduleRow): RouteLocationRaw | null {
  if (row.id == null || row.project_id <= 0) return null
  const workYmd = sliceWorkYmd(row.work_date)
  if (workYmd.length < 10) return null
  const workMon = weekStartMondayYmdFromIsoDate(workYmd)
  const meta = weekMetaForProject(row.project_id)
  const metaRaw = meta != null ? String(meta.week_start ?? '').trim() : ''
  const metaMon =
    metaRaw.length >= 10 ? weekStartMondayYmdFromIsoDate(metaRaw.slice(0, 10)) : ''
  const week_start = metaMon === workMon && metaRaw.length >= 10 ? metaRaw.slice(0, 10) : workMon
  return {
    path: `/projects/${row.project_id}/detail/schedule-slot/${row.id}`,
    query: { week_start },
  }
}

const hasAnyAssignmentNoteTooLong = computed(() =>
  allDraftRows.value.some((r) => assignmentNoteLength(r) > assignmentNoteMaxChars),
)

const canReopenPublishedWeek = computed(
  () =>
    periodMode.value === 'week' &&
    props.canEdit &&
    !isDraft.value &&
    weekMeta.value != null &&
    !isViewingPastWeek.value &&
    scheduleViewSynced.value &&
    weekStillHasPlanableDays.value &&
    hasAnyWeekEntries.value,
)

/** Banner in Month/Custom: explain that Reopen/Save live only in Week. */
const showPeriodReadOnlyBanner = computed(
  () => props.canEdit && periodMode.value !== 'week' && showScheduleTable.value,
)

function slotPartsConflict(a: ScheduleDayPart, b: ScheduleDayPart): boolean {
  if (a === b) return true
  if (a === 'full' || b === 'full') return true
  return false
}

function externalEntriesForPlanner(): MyScheduleEntry[] {
  return externalBusyEntries.value.filter((e) => !managedProjectIdSet.value.has(e.project_id))
}

function isSlotTakenByOthers(
  userId: number,
  workDate: string,
  dayPart: ScheduleDayPart,
  excludeRow: ScheduleWeekEntryRow,
): boolean {
  if (userId <= 0) return false
  const ymd = sliceWorkYmd(workDate)
  const draftHit = allDraftRows.value.some(
    (r) =>
      r !== excludeRow &&
      scheduleUserId(r.user_id) === scheduleUserId(userId) &&
      sliceWorkYmd(r.work_date) === ymd &&
      slotPartsConflict(r.day_part, dayPart),
  )
  if (draftHit) return true
  if (userId === scheduleUserId(selectedPlannerWorkerId.value)) {
    for (const e of externalEntriesForPlanner()) {
      if (sliceWorkYmd(e.work_date) !== ymd) continue
      if (slotPartsConflict(e.day_part, dayPart)) return true
    }
  }
  return false
}

function hasWorkerSlotConflict(row: ScheduleWeekEntryRow): boolean {
  if (row.user_id <= 0 || !row.work_date) return false
  return isSlotTakenByOthers(row.user_id, row.work_date, row.day_part, row)
}

function reconcileAllRows(): void {
  // Normalize legacy morning/afternoon rows to a single full working day.
  collapseAllRowsToFullDay(isScheduleEditable.value)
}

function makeTemplateRowForDay(uid: number, ymd: string): PlannerScheduleRow {
  return {
    user_id: uid,
    task_id: null,
    work_date: ymd,
    day_part: 'full',
    assignment_note: '',
    distance_km: '',
    expected_start_time: '',
    expected_end_time: '',
    project_id: fallbackProjectId.value,
  }
}

function isRowSaveable(row: PlannerScheduleRow): boolean {
  if (row.user_id <= 0) return false
  if (row.project_id <= 0) return false
  if (row.work_date && row.work_date < todayYmd.value) return false
  if (hasWorkerSlotConflict(row)) return false
  return true
}

function pickBestDuplicateRow(list: PlannerScheduleRow[]): PlannerScheduleRow {
  return (
    list.find((r) => r.id != null && isRowSaveable(r)) ??
    list.find((r) => r.id != null) ??
    list.find((r) => r.day_part === 'full') ??
    list[0]!
  )
}

/**
 * Collapse to one full-day row per (worker, day). Removes legacy am/pm companions.
 */
function collapseAllRowsToFullDay(markDirtyOnChange: boolean): void {
  const byKey = new Map<string, PlannerScheduleRow[]>()
  for (const r of allDraftRows.value) {
    const key = `${scheduleUserId(r.user_id)}|${sliceWorkYmd(r.work_date)}`
    const list = byKey.get(key) ?? []
    list.push(r)
    byKey.set(key, list)
  }

  const keepSet = new Set<PlannerScheduleRow>()
  for (const list of byKey.values()) {
    const keep = pickBestDuplicateRow(list)
    if (keep.day_part !== 'full') {
      keep.day_part = 'full'
      if (markDirtyOnChange) markProjectDirty(keep.project_id)
    }
    keepSet.add(keep)
    if (markDirtyOnChange && list.length > 1) {
      for (const r of list) {
        if (r !== keep) markProjectDirty(r.project_id)
      }
    }
  }

  const next = allDraftRows.value.filter((r) => keepSet.has(r))
  if (next.length !== allDraftRows.value.length) {
    allDraftRows.value = next
  }
}

/**
 * Collapse duplicate (worker, day) rows for the selected worker to one full day.
 */
function ensureWeekTemplateRowsForSelectedWorker(): void {
  if (!isScheduleEditable.value) return
  const uid = scheduleUserId(selectedPlannerWorkerId.value)
  if (uid <= 0) return

  const ymds = dayChoices.value.map((d) => d.ymd)
  const weekSet = new Set(ymds)

  allDraftRows.value = allDraftRows.value.filter((r) => {
    if (scheduleUserId(r.user_id) !== uid) return true
    return weekSet.has(sliceWorkYmd(r.work_date))
  })

  collapseAllRowsToFullDay(true)

  for (const r of allDraftRows.value) {
    if (scheduleUserId(r.user_id) !== uid) continue
    const y = sliceWorkYmd(r.work_date)
    if (weekSet.has(y) && r.work_date !== y) r.work_date = y
  }
}

function dayHasAssignableSlot(uid: number, ymd: string): boolean {
  return !allDraftRows.value.some(
    (r) => scheduleUserId(r.user_id) === uid && sliceWorkYmd(r.work_date) === ymd,
  )
}

function assignWeekDay(ymd: string): void {
  if (!isScheduleEditable.value) return
  if (isPastPlanDayYmd(ymd)) return
  const uid = scheduleUserId(selectedPlannerWorkerId.value)
  if (uid <= 0) return
  if (!dayHasAssignableSlot(uid, ymd)) return
  const row = makeTemplateRowForDay(uid, ymd)
  if (isSlotTakenByOthers(uid, ymd, 'full', row)) return
  allDraftRows.value.push(row)
  markProjectDirty(row.project_id)
}

function clearWeekDayRow(row: PlannerScheduleRow): void {
  if (!isScheduleEditable.value) return
  if (row.work_date && sliceWorkYmd(row.work_date) < todayYmd.value) return
  markProjectDirty(row.project_id)
  allDraftRows.value = allDraftRows.value.filter((r) => r !== row)
}

function onRowProjectChange(row: PlannerScheduleRow, event: Event): void {
  const el = event.target as HTMLSelectElement
  const nextId = Number(el.value)
  if (!Number.isFinite(nextId) || nextId <= 0 || nextId === row.project_id) return
  markProjectDirty(row.project_id)
  markProjectDirty(nextId)
  row.project_id = nextId
  row.day_part = 'full'
  // Entry PK belongs to the previous project's week — clear so save inserts into the new project.
  delete row.id
}

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined
    if (data?.message && typeof data.message === 'string') return data.message
  }
  return fallback
}

function onDistanceKmInput(row: PlannerScheduleRow, event: Event): void {
  const el = event.target as HTMLInputElement
  const digits = String(el.value ?? '')
    .replace(/\D/g, '')
    .slice(0, distanceKmMaxChars)
  row.distance_km = digits
  el.value = digits
  markProjectDirty(row.project_id)
}

function onExpectedTimeInput(
  row: PlannerScheduleRow,
  field: 'expected_start_time' | 'expected_end_time',
  event: Event,
): void {
  const el = event.target as HTMLInputElement
  const v = String(el.value ?? '').trim()
  row[field] = v.length > 0 ? v : ''
  markProjectDirty(row.project_id)
}

/** Check-in timestamp as HH:mm (24h). Empty → placeholder. */
function formatCheckInTime(at: string | null | undefined): string {
  if (!at) return 'hh:mm'
  const d = new Date(at)
  if (Number.isNaN(d.getTime())) return 'hh:mm'
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

function mapEntries(list: ScheduleWeekEntryRow[], projectId: number): PlannerScheduleRow[] {
  return list.map((e) => ({
    user_id: scheduleUserId(e.user_id),
    task_id: null,
    work_date: e.work_date,
    day_part: 'full',
    id: e.id,
    assignment_note: e.assignment_note == null ? '' : String(e.assignment_note),
    distance_km: e.distance_km == null ? '' : String(e.distance_km).replace(/\D/g, '').slice(0, 3),
    expected_start_time: e.expected_start_time ? String(e.expected_start_time) : '',
    expected_end_time: e.expected_end_time ? String(e.expected_end_time) : '',
    work_start_lat: e.work_start_lat ?? null,
    work_start_lng: e.work_start_lng ?? null,
    work_start_at: e.work_start_at ?? null,
    work_end_lat: e.work_end_lat ?? null,
    work_end_lng: e.work_end_lng ?? null,
    work_end_at: e.work_end_at ?? null,
    work_start_distance_km: e.work_start_distance_km ?? null,
    work_end_distance_km: e.work_end_distance_km ?? null,
    project_id: projectId,
  }))
}

function primePlannerWorkerFromRows(): void {
  if (scheduleUserId(selectedPlannerWorkerId.value) > 0) return
  if (allDraftRows.value.length === 0) return
  selectedPlannerWorkerId.value = scheduleUserId(allDraftRows.value[0].user_id)
}

async function loadExternalScheduleForPlanner(): Promise<void> {
  externalBusyEntries.value = []
  const uid = scheduleUserId(selectedPlannerWorkerId.value)
  if (uid <= 0) return
  try {
    externalBusyEntries.value = await fetchUserSchedule(uid, viewFromYmd.value, viewToYmd.value)
  } catch {
    externalBusyEntries.value = []
  }
}

async function loadWeek(): Promise<void> {
  const gen = ++scheduleLoadGen
  periodDataReady.value = false
  metaError.value = ''
  bannerError.value = ''
  isFetchingWeek.value = true
  try {
    const options = projectOptions.value
    if (options.length === 0) {
      if (gen !== scheduleLoadGen) return
      weekByProjectId.value = {}
      weekMeta.value = null
      allDraftRows.value = []
      clearDirtyProjects()
      metaError.value = 'No projects available for scheduling.'
      return
    }

    const results = await mapPool(options, 6, async (p) => {
      try {
        const res = await fetchProjectScheduleWeek(p.id, weekStartYmd.value)
        return { projectId: p.id, ...res, ok: true as const, status: 200 as number | undefined }
      } catch (err) {
        return {
          projectId: p.id,
          week: null,
          entries: [] as ScheduleWeekEntryRow[],
          ok: false as const,
          status: axiosStatus(err),
        }
      }
    })
    if (gen !== scheduleLoadGen) return

    const nextMeta: Record<number, ScheduleWeekMeta | null> = {}
    const merged: PlannerScheduleRow[] = []
    let anyOk = false
    const failStatuses: Array<number | undefined> = []
    for (const r of results) {
      anyOk = anyOk || r.ok
      if (!r.ok) failStatuses.push(r.status)
      const week = mergeScheduleWeekMetaAfterWrite(r.week, null, weekStartYmd.value)
      nextMeta[r.projectId] = week
      if (week) merged.push(...mapEntries(r.entries, r.projectId))
    }
    weekByProjectId.value = nextMeta
    syncPrimaryWeekMeta()
    allDraftRows.value = merged
    clearDirtyProjects()
    reconcileAllRows()
    primePlannerWorkerFromRows()
    await nextTick()
    if (gen !== scheduleLoadGen) return
    ensureWeekTemplateRowsForSelectedWorker()
    await loadExternalScheduleForPlanner()
    if (gen !== scheduleLoadGen) return
    if (!anyOk && weekMeta.value == null) {
      metaError.value = scheduleLoadFailureMessage(failStatuses)
    }
  } catch (err) {
    if (gen !== scheduleLoadGen) return
    weekByProjectId.value = {}
    weekMeta.value = null
    allDraftRows.value = []
    clearDirtyProjects()
    metaError.value = scheduleLoadFailureMessage([axiosStatus(err)])
  } finally {
    if (gen === scheduleLoadGen) isFetchingWeek.value = false
  }
}

/** Month / custom: load every ISO week that overlaps the range (read-only). */
async function loadMultiWeekPeriod(): Promise<void> {
  const gen = ++scheduleLoadGen
  // Keep previous month/custom table visible with overlay while reloading.
  // When nothing is ready yet (e.g. Week → Month), the full-page spinner shows instead.
  metaError.value = ''
  bannerError.value = ''
  isFetchingWeek.value = true
  try {
    if (customRangeError.value) {
      if (gen !== scheduleLoadGen) return
      weekByProjectId.value = {}
      weekMeta.value = null
      allDraftRows.value = []
      clearDirtyProjects()
      periodDataReady.value = false
      return
    }
    const options = projectOptions.value
    if (options.length === 0) {
      if (gen !== scheduleLoadGen) return
      weekByProjectId.value = {}
      weekMeta.value = null
      allDraftRows.value = []
      clearDirtyProjects()
      metaError.value = 'No projects available for scheduling.'
      return
    }

    const mondays = mondaysCoveringRange(viewFromYmd.value, viewToYmd.value)
    const jobs: { projectId: number; weekStart: string }[] = []
    for (const mon of mondays) {
      for (const p of options) {
        jobs.push({ projectId: p.id, weekStart: mon })
      }
    }

    const results = await mapPool(jobs, 6, async (job) => {
      try {
        const res = await fetchProjectScheduleWeek(job.projectId, job.weekStart)
        return { ...job, ...res, ok: true as const, status: 200 as number | undefined }
      } catch (err) {
        return {
          ...job,
          week: null,
          entries: [] as ScheduleWeekEntryRow[],
          ok: false as const,
          status: axiosStatus(err),
        }
      }
    })
    if (gen !== scheduleLoadGen) return

    const fromYmd = viewFromYmd.value
    const toYmdBound = viewToYmd.value
    const nextMeta: Record<number, ScheduleWeekMeta | null> = {}
    const merged: PlannerScheduleRow[] = []
    let anyOk = false
    let anyWeek = false
    const failStatuses: Array<number | undefined> = []
    for (const r of results) {
      anyOk = anyOk || r.ok
      if (!r.ok) failStatuses.push(r.status)
      const week = mergeScheduleWeekMetaAfterWrite(r.week, null, r.weekStart)
      if (week) {
        anyWeek = true
        // Keep latest non-null meta per project for badges (period view is read-only).
        nextMeta[r.projectId] = week
        for (const row of mapEntries(r.entries, r.projectId)) {
          const d = sliceWorkYmd(row.work_date)
          if (d >= fromYmd && d <= toYmdBound) merged.push(row)
        }
      } else if (!(r.projectId in nextMeta)) {
        nextMeta[r.projectId] = null
      }
    }
    weekByProjectId.value = nextMeta
    const metas = Object.values(nextMeta).filter((w): w is ScheduleWeekMeta => w != null)
    weekMeta.value = metas.find((w) => w.status === 'draft') ?? metas[0] ?? null
    allDraftRows.value = merged
    clearDirtyProjects()
    reconcileAllRows()
    primePlannerWorkerFromRows()
    await nextTick()
    if (gen !== scheduleLoadGen) return
    periodDataReady.value = true
    await loadExternalScheduleForPlanner()
    if (gen !== scheduleLoadGen) return
    if (!anyOk && !anyWeek) {
      metaError.value = scheduleLoadFailureMessage(failStatuses)
      periodDataReady.value = false
    }
  } catch (err) {
    if (gen !== scheduleLoadGen) return
    weekByProjectId.value = {}
    weekMeta.value = null
    allDraftRows.value = []
    clearDirtyProjects()
    periodDataReady.value = false
    metaError.value = scheduleLoadFailureMessage([axiosStatus(err)])
  } finally {
    if (gen === scheduleLoadGen) isFetchingWeek.value = false
  }
}

async function loadScheduleForCurrentPeriod(): Promise<void> {
  if (periodMode.value === 'week') {
    periodDataReady.value = false
    await loadWeek()
    return
  }
  await loadMultiWeekPeriod()
}

function onRemovePastDayRows(): void {
  if (!isScheduleEditable.value) return
  const n = pastDayRowCount.value
  if (n <= 0) return
  const ok = window.confirm(
    `Clear ${n} assignment(s) on calendar days before today?\n\nThis only updates your draft in the browser. To update the server, click Save draft afterward.`,
  )
  if (!ok) return
  for (const r of allDraftRows.value) {
    if (isPastDayRowBlockingSave(r)) markProjectDirty(r.project_id)
  }
  allDraftRows.value = allDraftRows.value.filter((r) => !isPastDayRowBlockingSave(r))
  bannerError.value = ''
  void nextTick(() => ensureWeekTemplateRowsForSelectedWorker())
}

async function onReloadWeekFromServer(): Promise<void> {
  bannerError.value = ''
  await loadScheduleForCurrentPeriod()
}

async function ensureDraftMetaForProject(projectId: number): Promise<ScheduleWeekMeta> {
  const existing = weekMetaForProject(projectId)
  if (existing?.status === 'draft') return existing
  if (existing?.status === 'published') {
    const { week, entries } = await reopenProjectScheduleWeekAsDraft(
      projectId,
      existing.id,
      existing.week_start,
    )
    const merged = mergeScheduleWeekMetaAfterWrite(week, existing, weekStartYmd.value)
    if (!merged || merged.status !== 'draft') {
      throw new Error(`Could not reopen project #${projectId} as draft`)
    }
    weekByProjectId.value = { ...weekByProjectId.value, [projectId]: merged }
    // Merge server entries for other workers; keep local rows for this project that we are editing.
    const localForProject = allDraftRows.value.filter((r) => r.project_id === projectId)
    const localKeys = new Set(
      localForProject.map(
        (r) => `${scheduleUserId(r.user_id)}|${sliceWorkYmd(r.work_date)}|${r.day_part}`,
      ),
    )
    const fromServer = mapEntries(entries, projectId).filter((r) => {
      const key = `${scheduleUserId(r.user_id)}|${sliceWorkYmd(r.work_date)}|${r.day_part}`
      return !localKeys.has(key)
    })
    allDraftRows.value = [
      ...allDraftRows.value.filter((r) => r.project_id !== projectId),
      ...localForProject,
      ...fromServer,
    ]
    syncPrimaryWeekMeta()
    return merged
  }

  const { week, entries } = await ensureProjectScheduleDraft(projectId, weekStartYmd.value)
  const merged = mergeScheduleWeekMetaAfterWrite(week, null, weekStartYmd.value)
  if (!merged) throw new Error(`Could not create draft for project #${projectId}`)
  weekByProjectId.value = { ...weekByProjectId.value, [projectId]: merged }
  if (entries.length > 0) {
    const existingKeys = new Set(
      allDraftRows.value
        .filter((r) => r.project_id === projectId)
        .map((r) => `${scheduleUserId(r.user_id)}|${sliceWorkYmd(r.work_date)}|${r.day_part}`),
    )
    for (const row of mapEntries(entries, projectId)) {
      const key = `${scheduleUserId(row.user_id)}|${sliceWorkYmd(row.work_date)}|${row.day_part}`
      if (!existingKeys.has(key)) allDraftRows.value.push(row)
    }
  }
  syncPrimaryWeekMeta()
  return merged
}

function projectIdsNeedingPersist(): number[] {
  const ids = new Set<number>([...dirtyProjectIds.value])
  if (ids.size === 0) {
    // Fallback: persist every project that currently has rows (e.g. note-only edits).
    for (const r of allDraftRows.value) {
      if (r.project_id > 0) ids.add(r.project_id)
    }
  }
  return [...ids].filter((id) => id > 0)
}

async function persistDirtyProjectEntries(): Promise<void> {
  const projectIds = projectIdsNeedingPersist()
  for (const projectId of projectIds) {
    const meta = await ensureDraftMetaForProject(projectId)
    const valid = allDraftRows.value.filter((r) => r.project_id === projectId && isRowSaveable(r))
    const { week, entries } = await replaceProjectScheduleEntries(projectId, meta.id, valid)
    const merged = mergeScheduleWeekMetaAfterWrite(week, meta, weekStartYmd.value)
    if (merged) weekByProjectId.value = { ...weekByProjectId.value, [projectId]: merged }
    // Refresh this project's rows from server response; keep other projects intact.
    const others = allDraftRows.value.filter((r) => r.project_id !== projectId)
    allDraftRows.value = [...others, ...mapEntries(entries, projectId)]
  }
  clearDirtyProjects()
  syncPrimaryWeekMeta()
}

async function onReopenPublishedWeekAsDraft(): Promise<void> {
  if (!canReopenPublishedWeek.value) return
  const ok = window.confirm(
    'Reopen this week as a draft for all projects that have a published week? Workers keep seeing the last published version until you publish your changes again.',
  )
  if (!ok) return
  isSaving.value = true
  bannerError.value = ''
  try {
    const published = Object.entries(weekByProjectId.value).filter(
      ([, w]) => w != null && w.status === 'published',
    )
    for (const [pidStr, meta] of published) {
      if (!meta) continue
      const projectId = Number(pidStr)
      const { week, entries } = await reopenProjectScheduleWeekAsDraft(
        projectId,
        meta.id,
        meta.week_start,
      )
      const merged = mergeScheduleWeekMetaAfterWrite(week, meta, weekStartYmd.value)
      weekByProjectId.value = { ...weekByProjectId.value, [projectId]: merged }
      const others = allDraftRows.value.filter((r) => r.project_id !== projectId)
      allDraftRows.value = [...others, ...mapEntries(entries, projectId)]
    }
    clearDirtyProjects()
    syncPrimaryWeekMeta()
    await nextTick()
    ensureWeekTemplateRowsForSelectedWorker()
    await loadExternalScheduleForPlanner()
  } catch (err) {
    bannerError.value = getApiErrorMessage(
      err,
      'Could not reopen week. The server may not implement POST …/reopen-as-draft yet — see docs/SCHEDULE_WEEKS_API.md.',
    )
  } finally {
    isSaving.value = false
  }
}

async function onCreateDraft(): Promise<void> {
  if (isViewingPastWeek.value) {
    bannerError.value = 'Drafts cannot be created for past weeks.'
    return
  }
  const options = projectOptions.value
  if (options.length === 0) {
    bannerError.value = 'No projects available.'
    return
  }
  isSaving.value = true
  bannerError.value = ''
  try {
    // Create drafts only where no week exists yet (skip published — those need Reopen).
    const toCreate = options.filter((p) => weekMetaForProject(p.id) == null)
    const targets = toCreate.length > 0 ? toCreate : options.filter((p) => weekMetaForProject(p.id)?.status !== 'published')
    if (targets.length === 0) {
      bannerError.value = 'All projects already have a published week. Use Reopen as draft.'
      return
    }
    await mapPool(targets, 4, async (p) => {
      const { week, entries } = await ensureProjectScheduleDraft(p.id, weekStartYmd.value)
      const merged = mergeScheduleWeekMetaAfterWrite(week, null, weekStartYmd.value)
      weekByProjectId.value = { ...weekByProjectId.value, [p.id]: merged }
      if (merged && entries.length > 0) {
        const others = allDraftRows.value.filter((r) => r.project_id !== p.id)
        allDraftRows.value = [...others, ...mapEntries(entries, p.id)]
      }
    })
    clearDirtyProjects()
    syncPrimaryWeekMeta()
    reconcileAllRows()
    primePlannerWorkerFromRows()
    await nextTick()
    ensureWeekTemplateRowsForSelectedWorker()
    await loadExternalScheduleForPlanner()
  } catch {
    bannerError.value = 'Failed to create draft. Check permissions or API.'
  } finally {
    isSaving.value = false
  }
}

async function onSaveEntries(): Promise<void> {
  if (!isScheduleEditable.value) return
  if (hasAnySlotConflict.value) {
    bannerError.value = 'Resolve overlapping slots before saving.'
    return
  }
  if (hasRowsOnPastDays.value) {
    bannerError.value =
      'Clear slots/notes on days before today (use “Clear past-day assignments” below) — planning is forward-only.'
    return
  }
  if (hasAnyAssignmentNoteTooLong.value) {
    bannerError.value = `Shorten assignment text to ${assignmentNoteMaxChars} characters or less.`
    return
  }
  isSaving.value = true
  bannerError.value = ''
  try {
    await persistDirtyProjectEntries()
    await nextTick()
    ensureWeekTemplateRowsForSelectedWorker()
  } catch (err) {
    bannerError.value = getApiErrorMessage(
      err,
      'Save failed. If a week is published, reopen it as a draft first.',
    )
  } finally {
    isSaving.value = false
  }
}

async function onPublish(): Promise<void> {
  if (!isScheduleEditable.value) return
  if (hasAnySlotConflict.value) {
    bannerError.value = 'Resolve overlapping slots before publishing.'
    return
  }
  if (hasRowsOnPastDays.value) {
    bannerError.value =
      'Clear slots/notes on days before today before publishing — planning is forward-only.'
    return
  }
  if (hasAnyAssignmentNoteTooLong.value) {
    bannerError.value = `Shorten assignment text to ${assignmentNoteMaxChars} characters or less.`
    return
  }
  const valid = allDraftRows.value.filter((r) => isRowSaveable(r))
  if (valid.length === 0) {
    bannerError.value =
      'Cannot publish an empty week — assign at least one day (any worker) in this draft.'
    return
  }
  isSaving.value = true
  bannerError.value = ''
  try {
    // Ensure every project with saveable rows is dirty so we persist them before publish.
    for (const r of valid) markProjectDirty(r.project_id)
    await persistDirtyProjectEntries()

    const draftMetas = Object.entries(weekByProjectId.value).filter(
      ([, w]) => w != null && w.status === 'draft',
    )
    for (const [pidStr, meta] of draftMetas) {
      if (!meta) continue
      const projectId = Number(pidStr)
      const hasRows = allDraftRows.value.some((r) => r.project_id === projectId && isRowSaveable(r))
      if (!hasRows) continue
      const published = await publishProjectScheduleWeek(projectId, meta.id, meta.week_start)
      if (published) {
        weekByProjectId.value = {
          ...weekByProjectId.value,
          [projectId]: mergeScheduleWeekMetaAfterWrite(published, meta, weekStartYmd.value),
        }
      }
    }
    syncPrimaryWeekMeta()
    await nextTick()
    ensureWeekTemplateRowsForSelectedWorker()
  } catch (err) {
    bannerError.value = getApiErrorMessage(err, 'Publish failed.')
  } finally {
    isSaving.value = false
  }
}

watch(
  () => [fallbackProjectId.value, projectOptions.value.map((p) => p.id).join(',')] as const,
  () => {
    void loadScheduleForCurrentPeriod()
  },
)

watch(weekOffset, () => {
  if (periodMode.value === 'week') void loadScheduleForCurrentPeriod()
})

watch(monthCursor, () => {
  if (periodMode.value === 'month') void loadScheduleForCurrentPeriod()
})

watch([customFromYmd, customToYmd], () => {
  if (periodMode.value === 'custom') void loadScheduleForCurrentPeriod()
})

watch(
  () => route.query.week_start,
  (w) => {
    if (periodMode.value !== 'week') return
    const next = weekOffsetFromWeekStartQuery(w)
    if (next !== weekOffset.value) weekOffset.value = next
    else void loadScheduleForCurrentPeriod()
  },
)

watch([selectedPlannerWorkerId, viewFromYmd, viewToYmd], () => {
  void loadExternalScheduleForPlanner()
})

watch(
  () => [selectedPlannerWorkerId.value, isScheduleEditable.value, weekStartYmd.value, periodMode.value],
  () => {
    void nextTick(() => {
      if (periodMode.value === 'week') ensureWeekTemplateRowsForSelectedWorker()
    })
  },
)

onMounted(() => {
  void loadScheduleForCurrentPeriod()
})
</script>

<style scoped>
.schedule-week-overlay-enter-active,
.schedule-week-overlay-leave-active {
  transition: opacity 0.18s ease;
}
.schedule-week-overlay-enter-from,
.schedule-week-overlay-leave-to {
  opacity: 0;
}
</style>

<template>
  <div>
    <div
      v-if="showBackButton || showSnapshotButton"
      class="flex items-center justify-between mb-4 gap-2"
    >
      <button
        v-if="showBackButton"
        class="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1"
        @click="emit('close')"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to reports
      </button>
      <span v-else></span>
      <button
        v-if="showSnapshotButton"
        class="text-sm px-3 py-1.5 rounded-md bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50"
        :disabled="isOpeningSnapshot"
        @click="openSnapshot"
      >
        {{ isOpeningSnapshot ? 'Opening…' : 'Open snapshot' }}
      </button>
    </div>

    <div v-if="isLoading" class="py-12 text-center text-slate-400">Loading report…</div>

    <div v-else-if="detail" class="space-y-5">
      <!-- Header card -->
      <div class="bg-slate-900 rounded-lg p-5 text-white">
        <div class="text-lg font-semibold">
          {{ isGlobal ? 'Daily summary' : 'Daily operational report' }}
        </div>
        <div class="text-sm text-slate-300 mt-1">
          <template v-if="isGlobal">
            {{ detail.payload.project_count ?? detail.payload.projects?.length ?? 0 }} project(s) ·
            {{ formatDate(detail.report_date) }}
          </template>
          <template v-else>
            {{ detail.payload.project_name }} · {{ formatDate(detail.report_date) }}
          </template>
        </div>
      </div>

      <!-- Summary bars -->
      <div v-if="showSummary" class="bg-white rounded-lg shadow p-5">
        <h2 class="text-sm font-semibold text-slate-900 mb-3">Summary</h2>
        <div class="space-y-2">
          <div v-for="metric in summaryMetrics" :key="metric.label" class="flex items-center gap-3">
            <div class="w-36 shrink-0 text-sm text-slate-600">{{ metric.label }}</div>
            <div class="flex-1 bg-slate-100 rounded h-5 overflow-hidden">
              <div
                class="h-5 rounded transition-all"
                :class="metric.colorClass"
                :style="{ width: barWidth(metric.value) }"
              ></div>
            </div>
            <div class="w-8 text-right text-sm font-semibold text-slate-900">
              {{ metric.value }}
            </div>
          </div>
        </div>
      </div>

      <!-- Global: by-project table -->
      <div v-if="isGlobal && showDetail" class="bg-white rounded-lg shadow p-5 overflow-x-auto">
        <h2 class="text-sm font-semibold text-slate-900 mb-3">By project</h2>
        <div
          v-if="!(detail.payload.projects && detail.payload.projects.length)"
          class="text-sm text-slate-400 italic"
        >
          No activity
        </div>
        <table v-else class="w-full text-sm">
          <thead>
            <tr class="text-left text-xs text-slate-500 border-b border-slate-100">
              <th class="py-2 pr-3 font-medium">Project</th>
              <th class="py-2 px-1 font-medium text-right">Starts</th>
              <th class="py-2 px-1 font-medium text-right">Ends</th>
              <th class="py-2 px-1 font-medium text-right">Submitted</th>
              <th class="py-2 px-1 font-medium text-right">Urgent</th>
              <th class="py-2 px-1 font-medium text-right">Events</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="project in detail.payload.projects"
              :key="project.project_id"
              class="border-b border-slate-50"
            >
              <td class="py-2.5 pr-3 text-slate-900">{{ project.project_name }}</td>
              <td class="py-2.5 px-1 text-right">{{ project.counts.field_work_starts }}</td>
              <td class="py-2.5 px-1 text-right">{{ project.counts.field_work_ends }}</td>
              <td class="py-2.5 px-1 text-right">{{ project.counts.foreman_submitted }}</td>
              <td class="py-2.5 px-1 text-right">{{ project.counts.urgent }}</td>
              <td class="py-2.5 px-1 text-right">{{ project.counts.events_logged }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Project detail sections -->
      <template v-if="!isGlobal && showDetail">
        <!-- Task activity (per-task cards: time, progress, notes, before/after photos) -->
        <div v-if="hasTaskActivities" class="bg-white rounded-lg shadow p-5">
          <h2 class="text-sm font-semibold text-slate-900 mb-3">Task activity</h2>
          <div v-if="taskActivities.length" class="space-y-3">
            <TaskActivityCard
              v-for="activity in taskActivities"
              :key="activity.task_id"
              :activity="activity"
            />
          </div>
          <div v-else class="text-sm text-slate-400 italic">No task activity</div>
        </div>

        <!-- Legacy fallback for snapshots created before the task-activity model -->
        <template v-else>
          <ReportSection
            title="Field work started"
            photo-label="Before work photos"
            :rows="detail.payload.field_work_started ?? []"
          />
          <ReportSection
            title="Field work ended"
            photo-label="After work photos"
            :rows="detail.payload.field_work_ended ?? []"
          />
          <ReportSection title="Foreman submitted" :rows="detail.payload.foreman_submitted ?? []" />
        </template>

        <ReportSection title="Urgent" :rows="detail.payload.urgent ?? []" accent="red" />
        <ReportSection title="Project lifecycle" :rows="detail.payload.lifecycle ?? []" />
      </template>

      <div class="text-xs text-slate-400 text-center pb-4">
        Immutable snapshot · generated {{ formatDateTime(detail.generated_at) }}
      </div>
    </div>

    <div v-else class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
      Failed to load report.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { reportsApi, type ReportDetail } from '@/core/utils/reports-api'
import ReportSection from './ReportSection.vue'
import TaskActivityCard from './TaskActivityCard.vue'

defineOptions({ name: 'ReportDetailView' })

const props = withDefaults(
  defineProps<{
    reportId: number
    showBackButton?: boolean
    showSnapshotButton?: boolean
    /** Show summary bars (default true) */
    showSummary?: boolean
    /** Show detail sections / by-project table (default true) */
    showDetail?: boolean
  }>(),
  {
    showBackButton: true,
    showSnapshotButton: true,
    showSummary: true,
    showDetail: true,
  },
)
const emit = defineEmits<{ close: [] }>()

const detail = ref<ReportDetail | null>(null)
const isLoading = ref(false)
const isOpeningSnapshot = ref(false)

const isGlobal = computed(
  () =>
    detail.value?.scope === 'global' ||
    detail.value?.payload.scope === 'global' ||
    Array.isArray(detail.value?.payload.projects),
)

const taskActivities = computed(() => detail.value?.payload.task_activities ?? [])
const hasTaskActivities = computed(() => Array.isArray(detail.value?.payload.task_activities))

const summaryMetrics = computed(() => {
  const counts = detail.value?.payload.counts
  if (!counts) return []
  return [
    { label: 'Field work starts', value: counts.field_work_starts, colorClass: 'bg-blue-600' },
    { label: 'Field work ends', value: counts.field_work_ends, colorClass: 'bg-teal-600' },
    { label: 'Foreman submitted', value: counts.foreman_submitted, colorClass: 'bg-violet-600' },
    { label: 'Urgent', value: counts.urgent, colorClass: 'bg-red-600' },
    { label: 'Lifecycle changes', value: counts.lifecycle_changes, colorClass: 'bg-amber-600' },
    { label: 'Events logged', value: counts.events_logged, colorClass: 'bg-slate-500' },
  ]
})

const maxMetricValue = computed(() =>
  Math.max(1, ...summaryMetrics.value.map((metric) => metric.value)),
)

function barWidth(value: number): string {
  return `${Math.round((value / maxMetricValue.value) * 100)}%`
}

async function load(): Promise<void> {
  isLoading.value = true
  detail.value = null
  try {
    detail.value = await reportsApi.getById(props.reportId)
  } catch {
    detail.value = null
  } finally {
    isLoading.value = false
  }
}

async function openSnapshot(): Promise<void> {
  isOpeningSnapshot.value = true
  try {
    await reportsApi.openSnapshot(props.reportId)
  } finally {
    isOpeningSnapshot.value = false
  }
}

function formatDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatDateTime(value: string | null): string {
  if (!value) return ''
  const parsed = new Date(value.replace(' ', 'T'))
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

watch(() => props.reportId, load, { immediate: true })
</script>

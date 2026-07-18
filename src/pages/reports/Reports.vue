<template>
  <div class="px-4 py-6 md:px-6 max-w-5xl mx-auto">
    <div class="flex items-center justify-between mb-5">
      <h1 class="text-xl font-semibold text-slate-900">Reports</h1>
      <button
        class="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
        :disabled="isLoadingGlobal || isLoadingProjects"
        @click="loadAll"
      >
        <svg
          class="w-4 h-4"
          :class="{ 'animate-spin': isLoadingGlobal || isLoadingProjects }"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        Refresh
      </button>
    </div>

    <div v-if="hasError" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-5">
      Failed to load reports.
      <button class="underline ml-1" @click="loadAll">Retry</button>
    </div>

    <!-- Type switcher left · period selector right (period format depends on type) -->
    <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div class="flex gap-2 overflow-x-auto">
        <button
          v-for="tab in typeTabs"
          :key="tab.value"
          class="px-3.5 py-1 rounded-full text-sm whitespace-nowrap border transition-colors"
          :class="
            activeType === tab.value
              ? 'bg-slate-800 text-white border-slate-800'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
          "
          @click="activeType = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>
      <select
        v-model="selectedPeriod"
        class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        :disabled="periodOptions.length === 0"
      >
        <option v-if="periodOptions.length === 0" :value="null">
          No {{ activeType }} reports
        </option>
        <option v-for="date in periodOptions" :key="date" :value="date">
          {{ formatReportPeriod(date, activeType) }}
        </option>
      </select>
    </div>

    <!-- Global summary -->
    <section class="mb-8">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h2 class="text-base font-semibold text-slate-800">Global summary</h2>
        <button
          v-if="selectedGlobalReport"
          class="text-sm px-3 py-1.5 rounded-md bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50"
          :disabled="isOpeningGlobalSnapshot"
          @click="openGlobalSnapshot"
        >
          {{ isOpeningGlobalSnapshot ? 'Opening…' : 'Open snapshot' }}
        </button>
      </div>

      <div v-if="isLoadingGlobal" class="py-8 text-center text-slate-400 text-sm">Loading…</div>
      <div
        v-else-if="!selectedGlobalReport"
        class="bg-white rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400"
      >
        {{ globalEmptyText }}
      </div>
      <ReportDetailView
        v-else
        :report-id="selectedGlobalReport.id"
        :show-back-button="false"
        :show-snapshot-button="false"
      />
    </section>

    <!-- Project summary only on global Reports page; task detail lives in Project → Reports -->
    <section v-if="activeType === 'daily'">
      <h2 class="text-base font-semibold text-slate-800 mb-3">Project summary · daily</h2>
      <p class="text-xs text-slate-500 mb-3">
        Task activity and photos are available inside the project Reports section.
      </p>

      <div v-if="isLoadingProjects" class="py-8 text-center text-slate-400 text-sm">Loading…</div>

      <div
        v-else-if="projectOptions.length === 0"
        class="bg-white rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400"
      >
        No project reports for
        {{ selectedPeriod ? formatReportPeriod(selectedPeriod, 'daily') : 'this date' }}.
      </div>

      <template v-else>
        <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
          <select
            v-model="selectedProjectId"
            class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 sm:w-96"
          >
            <option v-for="option in projectOptions" :key="option.id" :value="option.id">
              {{ option.name }}
            </option>
          </select>
          <button
            v-if="selectedProjectReport"
            class="text-sm px-3 py-1.5 rounded-md bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50"
            :disabled="isOpeningProjectSnapshot"
            @click="openProjectSnapshot"
          >
            {{ isOpeningProjectSnapshot ? 'Opening…' : 'Open snapshot' }}
          </button>
        </div>

        <ReportDetailView
          v-if="selectedProjectReport"
          :report-id="selectedProjectReport.id"
          :show-back-button="false"
          :show-snapshot-button="false"
          :show-detail="false"
        />
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { reportsApi, type ReportListItem } from '@/core/utils/reports-api'
import ReportDetailView from './components/ReportDetailView.vue'
import { formatReportPeriod, type ReportPeriodType } from './report-period'

defineOptions({ name: 'ReportsPage' })

const typeTabs = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
] as const

const activeType = ref<ReportPeriodType>('daily')
const globalReports = ref<ReportListItem[]>([])
const projectReports = ref<ReportListItem[]>([])
const isLoadingGlobal = ref(false)
const isLoadingProjects = ref(false)
const hasError = ref(false)

const selectedPeriod = ref<string | null>(null)
const selectedProjectId = ref<number | null>(null)
const isOpeningGlobalSnapshot = ref(false)
const isOpeningProjectSnapshot = ref(false)

/** Past reports of the active type: daily also includes project report dates. */
const periodOptions = computed(() => {
  const dates = new Set<string>()
  for (const report of globalReports.value) dates.add(report.report_date)
  if (activeType.value === 'daily') {
    for (const report of projectReports.value) dates.add(report.report_date)
  }
  return [...dates].sort((a, b) => b.localeCompare(a))
})

const projectOptions = computed(() => {
  const seen = new Map<number, string>()
  for (const report of projectReports.value.filter(
    (item) => item.report_date === selectedPeriod.value,
  )) {
    if (!seen.has(report.project_id)) {
      seen.set(report.project_id, report.project_name || `Project #${report.project_id}`)
    }
  }
  return [...seen.entries()].map(([id, name]) => ({ id, name }))
})

const selectedProjectReport = computed(() =>
  projectReports.value.find(
    (report) =>
      report.project_id === selectedProjectId.value &&
      report.report_date === selectedPeriod.value,
  ),
)

const selectedGlobalReport = computed(() => {
  if (!selectedPeriod.value) return null
  return (
    globalReports.value.find((report) => report.report_date === selectedPeriod.value) ?? null
  )
})

const globalEmptyText = computed(() => {
  if (selectedPeriod.value) {
    return `No global ${activeType.value} summary for ${formatReportPeriod(selectedPeriod.value, activeType.value)}.`
  }
  return `No global ${activeType.value} reports yet.`
})

async function loadGlobal(): Promise<void> {
  isLoadingGlobal.value = true
  try {
    globalReports.value = await reportsApi.list({
      scope: 'global',
      type: activeType.value,
      limit: 100,
    })
  } catch {
    hasError.value = true
    globalReports.value = []
  } finally {
    isLoadingGlobal.value = false
  }
}

async function loadProjects(): Promise<void> {
  isLoadingProjects.value = true
  try {
    projectReports.value = await reportsApi.list({ scope: 'project', type: 'daily', limit: 200 })
  } catch {
    hasError.value = true
    projectReports.value = []
  } finally {
    isLoadingProjects.value = false
  }
}

async function loadAll(): Promise<void> {
  hasError.value = false
  await Promise.all([loadGlobal(), loadProjects()])
}

async function openGlobalSnapshot(): Promise<void> {
  if (!selectedGlobalReport.value) return
  isOpeningGlobalSnapshot.value = true
  try {
    await reportsApi.openSnapshot(selectedGlobalReport.value.id)
  } finally {
    isOpeningGlobalSnapshot.value = false
  }
}

async function openProjectSnapshot(): Promise<void> {
  if (!selectedProjectReport.value) return
  isOpeningProjectSnapshot.value = true
  try {
    await reportsApi.openSnapshot(selectedProjectReport.value.id)
  } finally {
    isOpeningProjectSnapshot.value = false
  }
}

// Default to the latest period of the active type; reset when type changes.
watch(periodOptions, (dates) => {
  if (dates.length === 0) {
    selectedPeriod.value = null
    return
  }
  if (!selectedPeriod.value || !dates.includes(selectedPeriod.value)) {
    selectedPeriod.value = dates[0]
  }
})

watch(projectOptions, (options) => {
  if (options.length === 0) {
    selectedProjectId.value = null
    return
  }
  if (!options.some((option) => option.id === selectedProjectId.value)) {
    selectedProjectId.value = options[0].id
  }
})

watch(activeType, () => {
  selectedPeriod.value = null
  loadGlobal()
})
onMounted(loadAll)
</script>

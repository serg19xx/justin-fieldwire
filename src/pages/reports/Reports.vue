<template>
  <div class="px-4 py-6 md:px-6 max-w-5xl mx-auto">
    <div class="flex items-center justify-between mb-5 gap-3 flex-wrap">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Reports</h1>
        <p class="text-sm text-slate-500 mt-0.5">Saved period summaries — expand over time on request.</p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <PageUserGuideLink href="/USER_GUIDE_REPORTS.html" />
        <button
          class="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
          :disabled="isLoadingGlobal"
          @click="loadGlobal"
        >
          <svg
            class="w-4 h-4"
            :class="{ 'animate-spin': isLoadingGlobal }"
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
    </div>

    <div v-if="hasError" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-5">
      Failed to load reports.
      <button class="underline ml-1" @click="loadGlobal">Retry</button>
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

    <!-- Global summary only — project detail lives in Project → Reports -->
    <section>
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
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { reportsApi, type ReportListItem } from '@/core/utils/reports-api'
import PageUserGuideLink from '@/components/PageUserGuideLink.vue'
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
const isLoadingGlobal = ref(false)
const hasError = ref(false)

const selectedPeriod = ref<string | null>(null)
const isOpeningGlobalSnapshot = ref(false)

/** Past global reports of the active type. */
const periodOptions = computed(() =>
  [...new Set(globalReports.value.map((report) => report.report_date))].sort((a, b) =>
    b.localeCompare(a),
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
  hasError.value = false
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

async function openGlobalSnapshot(): Promise<void> {
  if (!selectedGlobalReport.value) return
  isOpeningGlobalSnapshot.value = true
  try {
    await reportsApi.openSnapshot(selectedGlobalReport.value.id)
  } finally {
    isOpeningGlobalSnapshot.value = false
  }
}

watch(periodOptions, (dates) => {
  if (dates.length === 0) {
    selectedPeriod.value = null
    return
  }
  if (!selectedPeriod.value || !dates.includes(selectedPeriod.value)) {
    selectedPeriod.value = dates[0]
  }
})

watch(activeType, () => {
  selectedPeriod.value = null
  loadGlobal()
})
onMounted(loadGlobal)
</script>

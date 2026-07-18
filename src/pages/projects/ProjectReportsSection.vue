<template>
  <div class="flex-1 overflow-y-auto p-4 md:p-6">
    <div class="max-w-3xl mx-auto">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-slate-900">Reports</h2>
        <button
          class="text-sm text-slate-500 hover:text-slate-700"
          :disabled="isLoading"
          @click="loadReports"
        >
          Refresh
        </button>
      </div>

      <div v-if="hasError" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-4">
        Failed to load reports.
        <button class="underline ml-1" @click="loadReports">Retry</button>
      </div>

      <!-- Type switcher left · period selector right (same layout as global Reports) -->
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

      <div v-if="isLoading" class="py-8 text-center text-slate-400 text-sm">Loading…</div>

      <div
        v-else-if="!selectedReport"
        class="bg-white rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400"
      >
        No {{ activeType }} reports for this project yet.
      </div>

      <template v-else>
        <!-- Project summary -->
        <section class="mb-8">
          <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h3 class="text-base font-semibold text-slate-800">Project summary</h3>
            <button
              class="text-sm px-3 py-1.5 rounded-md bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50"
              :disabled="isOpeningSnapshot"
              @click="openSnapshot"
            >
              {{ isOpeningSnapshot ? 'Opening…' : 'Open snapshot' }}
            </button>
          </div>
          <ReportDetailView
            :report-id="selectedReport.id"
            :show-back-button="false"
            :show-snapshot-button="false"
            :show-detail="false"
          />
        </section>

        <!-- Detail -->
        <section>
          <h3 class="text-base font-semibold text-slate-800 mb-3">
            {{ activeType === 'daily' ? 'Daily detail' : 'Detail' }}
          </h3>
          <ReportDetailView
            :report-id="selectedReport.id"
            :show-back-button="false"
            :show-snapshot-button="false"
            :show-summary="false"
          />
        </section>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { reportsApi, type ReportListItem } from '@/core/utils/reports-api'
import ReportDetailView from '@/pages/reports/components/ReportDetailView.vue'
import { formatReportPeriod, type ReportPeriodType } from '@/pages/reports/report-period'

defineOptions({ name: 'ProjectReportsSection' })

const props = defineProps<{ projectId: number }>()

const typeTabs = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
] as const

const reports = ref<ReportListItem[]>([])
const isLoading = ref(false)
const hasError = ref(false)
const activeType = ref<ReportPeriodType>('daily')
const selectedPeriod = ref<string | null>(null)
const isOpeningSnapshot = ref(false)

/** Past reports of the active type — pick from the list, no way to miss one. */
const periodOptions = computed(() =>
  [...new Set(reports.value.map((report) => report.report_date))].sort((a, b) =>
    b.localeCompare(a),
  ),
)

const selectedReport = computed(
  () => reports.value.find((report) => report.report_date === selectedPeriod.value) ?? null,
)

async function loadReports(): Promise<void> {
  isLoading.value = true
  hasError.value = false
  try {
    reports.value = await reportsApi.listForProject(props.projectId, {
      type: activeType.value,
      limit: 100,
    })
  } catch {
    hasError.value = true
    reports.value = []
  } finally {
    isLoading.value = false
  }
}

async function openSnapshot(): Promise<void> {
  if (!selectedReport.value) return
  isOpeningSnapshot.value = true
  try {
    await reportsApi.openSnapshot(selectedReport.value.id)
  } finally {
    isOpeningSnapshot.value = false
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
  loadReports()
})

watch(
  () => props.projectId,
  () => {
    selectedPeriod.value = null
    loadReports()
  },
)
onMounted(loadReports)
</script>

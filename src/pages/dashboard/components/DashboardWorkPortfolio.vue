<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  aggregateFilteredRows,
  filterPortfolioRows,
  type PortfolioWorkSnapshot,
  type ProjectPortfolioRow,
} from '@/core/utils/dashboard-work-portfolio'
import {
  ASSUMED_HOURS_PER_WORK_DAY,
  WORK_DAYS_PER_MONTH,
} from '@/core/utils/project-work-progress'
import SimpleBarChart from './charts/SimpleBarChart.vue'
import SimpleDonutChart from './charts/SimpleDonutChart.vue'

defineOptions({ name: 'DashboardWorkPortfolio' })

const props = defineProps<{
  snapshot: PortfolioWorkSnapshot | null
  isLoading?: boolean
  error?: string
}>()

const filterSysStatus = ref('all')
const selectedProjectIds = ref<number[]>([])
const showTaskBreakdown = ref(false)
const taskProjectId = ref<number | 0>(0)

const statusOptions = computed(() => {
  const set = new Set<string>()
  for (const p of props.snapshot?.projects ?? []) {
    const s = (p.sysStatus || '').trim()
    if (s) set.add(s)
  }
  return ['all', ...Array.from(set).sort()]
})

const filteredRows = computed((): ProjectPortfolioRow[] => {
  if (!props.snapshot) return []
  return filterPortfolioRows(props.snapshot.projects, {
    projectIds: selectedProjectIds.value.length > 0 ? selectedProjectIds.value : undefined,
    sysStatus: filterSysStatus.value,
  })
})

const filteredTotals = computed(() => aggregateFilteredRows(filteredRows.value))

const donutSlices = computed(() => [
  { label: 'Completed', value: filteredTotals.value.completedTasks, color: '#059669' },
  { label: 'Outstanding', value: filteredTotals.value.outstandingTasks, color: '#d97706' },
])

const percentBars = computed(() =>
  filteredRows.value
    .filter((r) => !r.loadError && r.stats.totalTasks > 0)
    .map((r) => ({
      label: r.projectName,
      value: r.stats.percentComplete,
      color: '#2563eb',
    })),
)

const remainingBars = computed(() =>
  filteredRows.value
    .filter((r) => !r.loadError && r.stats.remainingWorkDays > 0)
    .map((r) => ({
      label: r.projectName,
      value: r.stats.remainingWorkDays,
      color: '#b45309',
    })),
)

const completedDaysBars = computed(() =>
  filteredRows.value
    .filter((r) => !r.loadError && r.stats.completedWorkDays > 0)
    .map((r) => ({
      label: r.projectName,
      value: r.stats.completedWorkDays,
      color: '#059669',
    })),
)

const hasActiveFilters = computed(
  () => selectedProjectIds.value.length > 0 || filterSysStatus.value !== 'all',
)

const taskRows = computed(() => {
  const pid = taskProjectId.value
  const rows =
    pid > 0
      ? filteredRows.value.filter((r) => r.projectId === pid)
      : filteredRows.value
  const out: Array<{
    projectId: number
    projectName: string
    taskId: number
    name: string
    status: string
    progress: number
    workDays: number
  }> = []
  for (const r of rows) {
    for (const t of r.tasks) {
      const days =
        typeof t.duration_days === 'number' && t.duration_days > 0 ? t.duration_days : null
      out.push({
        projectId: r.projectId,
        projectName: r.projectName,
        taskId: t.id,
        name: t.name || `Task #${t.id}`,
        status: String(t.status || ''),
        progress: t.progress_pct ?? 0,
        workDays: days ?? 0,
      })
    }
  }
  return out.slice(0, 200)
})

function toggleProjectFilter(id: number): void {
  const cur = selectedProjectIds.value
  if (cur.includes(id)) {
    selectedProjectIds.value = cur.filter((x) => x !== id)
  } else {
    selectedProjectIds.value = [...cur, id]
  }
}

function clearProjectFilter(): void {
  selectedProjectIds.value = []
}

function clearAllFilters(): void {
  selectedProjectIds.value = []
  filterSysStatus.value = 'all'
}

function formatLoadedAt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
</script>

<template>
  <section class="bg-white rounded-lg border border-slate-200 shadow-sm p-4 md:p-5">
    <div class="mb-4">
      <h2 class="text-sm font-semibold text-slate-900">Live analytics</h2>
      <p class="text-xs text-slate-500 mt-0.5 max-w-2xl">
        Computed when you open this page from Jobsite tasks across accessible projects.
        Filters narrow charts and tables in place — nothing is stored as a dashboard report.
      </p>
      <p v-if="snapshot?.loadedAt" class="text-[11px] text-slate-400 mt-1">
        Calculated {{ formatLoadedAt(snapshot.loadedAt) }}
      </p>
    </div>

    <p v-if="error" class="text-sm text-red-700 mb-3">{{ error }}</p>

    <div v-if="isLoading && !snapshot" class="py-10 text-center text-sm text-slate-400">
      Loading portfolio…
    </div>

    <template v-else-if="snapshot">
      <div class="flex flex-col gap-3 mb-5 pb-4 border-b border-slate-100">
        <div class="flex flex-wrap items-center gap-3">
          <label class="text-xs text-slate-500 flex items-center gap-2">
            Status
            <select
              v-model="filterSysStatus"
              class="text-sm border border-slate-300 rounded-md px-2 py-1.5 bg-white capitalize"
            >
              <option v-for="s in statusOptions" :key="s" :value="s">
                {{ s === 'all' ? 'All' : s }}
              </option>
            </select>
          </label>
          <button
            v-if="selectedProjectIds.length"
            type="button"
            class="text-xs text-blue-700 hover:text-blue-900"
            @click="clearProjectFilter"
          >
            Clear project filter ({{ selectedProjectIds.length }})
          </button>
          <button
            v-if="hasActiveFilters"
            type="button"
            class="text-xs text-slate-600 hover:text-slate-900 underline"
            @click="clearAllFilters"
          >
            Clear all filters
          </button>
        </div>
        <div v-if="snapshot.projects.length" class="flex flex-wrap gap-1.5">
          <button
            type="button"
            class="text-xs px-2 py-1 rounded-md border transition-colors"
            :class="
              selectedProjectIds.length === 0
                ? 'border-blue-300 bg-blue-50 text-blue-900'
                : 'border-slate-200 bg-white text-slate-500'
            "
            @click="clearProjectFilter"
          >
            All projects
          </button>
          <button
            v-for="p in snapshot.projects"
            :key="p.projectId"
            type="button"
            class="text-xs px-2 py-1 rounded-md border transition-colors max-w-[12rem] truncate"
            :class="
              selectedProjectIds.includes(p.projectId)
                ? 'border-blue-300 bg-blue-50 text-blue-900'
                : 'border-slate-200 bg-white text-slate-600'
            "
            :title="p.projectName"
            @click="toggleProjectFilter(p.projectId)"
          >
            {{ p.projectName }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 mb-6">
        <div class="rounded-md border border-slate-100 bg-slate-50/80 p-3">
          <p class="text-xs font-medium text-slate-500">Projects</p>
          <p class="mt-1 text-xl font-bold text-slate-900">{{ filteredRows.length }}</p>
        </div>
        <div class="rounded-md border border-slate-100 bg-slate-50/80 p-3">
          <p class="text-xs font-medium text-slate-500">Tasks</p>
          <p class="mt-1 text-xl font-bold text-slate-900">{{ filteredTotals.totalTasks }}</p>
        </div>
        <div class="rounded-md border border-slate-100 bg-slate-50/80 p-3">
          <p class="text-xs font-medium text-slate-500">Completed</p>
          <p class="mt-1 text-xl font-bold text-emerald-700">{{ filteredTotals.completedTasks }}</p>
        </div>
        <div class="rounded-md border border-slate-100 bg-slate-50/80 p-3">
          <p class="text-xs font-medium text-slate-500">Outstanding</p>
          <p class="mt-1 text-xl font-bold text-amber-800">{{ filteredTotals.outstandingTasks }}</p>
        </div>
        <div class="rounded-md border border-slate-100 bg-slate-50/80 p-3">
          <p class="text-xs font-medium text-slate-500">% complete</p>
          <p class="mt-1 text-xl font-bold text-blue-700">{{ filteredTotals.percentComplete }}%</p>
        </div>
        <div class="rounded-md border border-slate-100 bg-slate-50/80 p-3">
          <p class="text-xs font-medium text-slate-500">Rem. days</p>
          <p class="mt-1 text-xl font-bold text-slate-900">{{ filteredTotals.remainingWorkDays }}</p>
        </div>
        <div class="rounded-md border border-slate-100 bg-slate-50/80 p-3">
          <p class="text-xs font-medium text-slate-500">Earliest done</p>
          <p class="mt-1 text-sm font-bold text-slate-900 leading-snug">
            {{ filteredTotals.earliestCompletionLabel }}
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="rounded-md border border-slate-100 p-3">
          <h3 class="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
            Tasks completed vs outstanding
          </h3>
          <SimpleDonutChart :slices="donutSlices" />
        </div>
        <div class="rounded-md border border-slate-100 p-3">
          <h3 class="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
            % complete by project
          </h3>
          <SimpleBarChart :items="percentBars" percent-scale value-suffix="%" />
        </div>
        <div class="rounded-md border border-slate-100 p-3">
          <h3 class="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
            Remaining work days by project
          </h3>
          <SimpleBarChart :items="remainingBars" value-suffix=" d" />
        </div>
        <div class="rounded-md border border-slate-100 p-3">
          <h3 class="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
            Completed work days by project
          </h3>
          <SimpleBarChart :items="completedDaysBars" value-suffix=" d" />
          <p class="mt-2 text-[11px] text-slate-400">
            Remaining {{ filteredTotals.remainingWorkDays }} work days ≈
            {{ filteredTotals.remainingWorkHours }} h ({{ ASSUMED_HOURS_PER_WORK_DAY }} h/day).
            Earliest uses {{ WORK_DAYS_PER_MONTH }} work days/month.
          </p>
        </div>
      </div>

      <h3 class="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Projects</h3>
      <div class="overflow-x-auto border border-slate-200 rounded-md mb-4">
        <table class="min-w-full text-sm">
          <thead class="bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th class="px-3 py-2 font-medium">Project</th>
              <th class="px-3 py-2 font-medium">Status</th>
              <th class="px-3 py-2 font-medium text-right">Tasks</th>
              <th class="px-3 py-2 font-medium text-right">Done</th>
              <th class="px-3 py-2 font-medium text-right">Open</th>
              <th class="px-3 py-2 font-medium text-right">%</th>
              <th class="px-3 py-2 font-medium text-right">Done days</th>
              <th class="px-3 py-2 font-medium text-right">Rem. days</th>
              <th class="px-3 py-2 font-medium">Earliest</th>
              <th class="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="r in filteredRows"
              :key="r.projectId"
              class="border-t border-slate-100 hover:bg-slate-50/80"
            >
              <td class="px-3 py-2">
                <div class="font-medium text-slate-900">{{ r.projectName }}</div>
                <div v-if="r.address" class="text-xs text-slate-400 truncate max-w-[14rem]">
                  {{ r.address }}
                </div>
                <div v-if="r.loadError" class="text-xs text-red-600">{{ r.loadError }}</div>
              </td>
              <td class="px-3 py-2 text-slate-600 capitalize">{{ r.sysStatus || '—' }}</td>
              <td class="px-3 py-2 text-right tabular-nums">{{ r.stats.totalTasks }}</td>
              <td class="px-3 py-2 text-right tabular-nums text-emerald-700">
                {{ r.stats.completedTasks }}
              </td>
              <td class="px-3 py-2 text-right tabular-nums text-amber-800">
                {{ r.stats.outstandingTasks }}
              </td>
              <td class="px-3 py-2 text-right tabular-nums">{{ r.stats.percentComplete }}%</td>
              <td class="px-3 py-2 text-right tabular-nums">{{ r.stats.completedWorkDays }}</td>
              <td class="px-3 py-2 text-right tabular-nums">{{ r.stats.remainingWorkDays }}</td>
              <td class="px-3 py-2 text-slate-600 text-xs whitespace-nowrap">
                {{ r.stats.earliestCompletionLabel }}
              </td>
              <td class="px-3 py-2 text-right">
                <RouterLink
                  :to="`/projects/${r.projectId}/detail?section=tasks`"
                  class="text-xs text-blue-700 hover:text-blue-900 whitespace-nowrap"
                >
                  Jobsite →
                </RouterLink>
              </td>
            </tr>
            <tr v-if="filteredRows.length === 0">
              <td colspan="10" class="px-3 py-6 text-center text-slate-400">No projects match filters.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex flex-wrap items-center gap-3 mb-2">
        <button
          type="button"
          class="text-xs font-medium text-slate-700 border border-slate-300 rounded-md px-2.5 py-1.5 hover:bg-slate-50"
          @click="showTaskBreakdown = !showTaskBreakdown"
        >
          {{ showTaskBreakdown ? 'Hide task breakdown' : 'Show task breakdown' }}
        </button>
        <label v-if="showTaskBreakdown" class="text-xs text-slate-500 flex items-center gap-2">
          Project
          <select
            v-model.number="taskProjectId"
            class="text-sm border border-slate-300 rounded-md px-2 py-1 bg-white"
          >
            <option :value="0">All filtered</option>
            <option v-for="r in filteredRows" :key="r.projectId" :value="r.projectId">
              {{ r.projectName }}
            </option>
          </select>
        </label>
      </div>

      <div v-if="showTaskBreakdown" class="overflow-x-auto border border-slate-200 rounded-md">
        <table class="min-w-full text-sm">
          <thead class="bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th class="px-3 py-2 font-medium">Project</th>
              <th class="px-3 py-2 font-medium">Task</th>
              <th class="px-3 py-2 font-medium">Status</th>
              <th class="px-3 py-2 font-medium text-right">Progress</th>
              <th class="px-3 py-2 font-medium text-right">Days</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="t in taskRows"
              :key="`${t.projectId}-${t.taskId}`"
              class="border-t border-slate-100"
            >
              <td class="px-3 py-2 text-slate-600 truncate max-w-[10rem]">{{ t.projectName }}</td>
              <td class="px-3 py-2 text-slate-900">{{ t.name }}</td>
              <td class="px-3 py-2 text-slate-600 capitalize">{{ t.status }}</td>
              <td class="px-3 py-2 text-right tabular-nums">{{ t.progress }}%</td>
              <td class="px-3 py-2 text-right tabular-nums">{{ t.workDays || '—' }}</td>
            </tr>
            <tr v-if="taskRows.length === 0">
              <td colspan="5" class="px-3 py-6 text-center text-slate-400">No tasks.</td>
            </tr>
          </tbody>
        </table>
        <p v-if="taskRows.length >= 200" class="text-[11px] text-slate-400 px-3 py-2 border-t">
          Showing first 200 tasks.
        </p>
      </div>
    </template>
  </section>
</template>

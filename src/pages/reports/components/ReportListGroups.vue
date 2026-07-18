<template>
  <div v-if="isLoading" class="py-8 text-center text-slate-400 text-sm">Loading…</div>

  <div
    v-else-if="reports.length === 0"
    class="bg-white rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400"
  >
    {{ emptyText }}
  </div>

  <div v-else class="space-y-5">
    <div v-for="group in groupedReports" :key="group.date">
      <div class="text-sm font-medium text-slate-500 mb-2">{{ formatDate(group.date) }}</div>
      <div class="space-y-2">
        <button
          v-for="report in group.items"
          :key="report.id"
          class="w-full bg-white rounded-lg shadow-sm border border-slate-100 hover:border-slate-300 p-3.5 text-left flex items-center justify-between gap-3 transition-colors"
          @click="emit('select', report.id)"
        >
          <div class="min-w-0">
            <div class="font-medium text-slate-900 truncate text-sm">
              {{ reportLabel(report) }}
            </div>
            <div class="text-xs text-slate-400 mt-0.5">
              Generated {{ formatDateTime(report.generated_at) }}
            </div>
          </div>
          <span
            class="text-xs px-2 py-0.5 rounded-full shrink-0"
            :class="statusClass(report.status)"
          >
            {{ report.status }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ReportListItem } from '@/core/utils/reports-api'

defineOptions({ name: 'ReportListGroups' })

const props = withDefaults(
  defineProps<{
    reports: ReportListItem[]
    isLoading?: boolean
    emptyText?: string
    /** Hide the project name in the card (useful inside a project context) */
    hideProjectName?: boolean
  }>(),
  { isLoading: false, emptyText: 'No reports yet.', hideProjectName: false },
)

const emit = defineEmits<{ select: [id: number] }>()

const groupedReports = computed(() => {
  const groups = new Map<string, ReportListItem[]>()
  for (const report of props.reports) {
    const list = groups.get(report.report_date) ?? []
    list.push(report)
    groups.set(report.report_date, list)
  }
  return [...groups.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, items]) => ({ date, items }))
})

function reportLabel(report: ReportListItem): string {
  if (props.hideProjectName) {
    return report.title || `Report #${report.id}`
  }
  return report.project_name || report.title || `Project #${report.project_id}`
}

function statusClass(status: string): string {
  if (status === 'sent') return 'bg-green-100 text-green-700'
  if (status === 'failed') return 'bg-red-100 text-red-700'
  return 'bg-slate-100 text-slate-600'
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
</script>

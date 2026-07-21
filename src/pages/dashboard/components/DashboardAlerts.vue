<template>
  <section class="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
    <h2 class="text-sm font-semibold text-slate-900 mb-3">Attention needed</h2>
    <div v-if="alerts.length === 0" class="text-sm text-slate-400 italic">Nothing flagged right now</div>
    <ul v-else class="divide-y divide-slate-100">
      <li v-for="(alert, index) in alerts" :key="index" class="py-2.5 flex gap-3">
        <span
          class="mt-0.5 shrink-0 w-2 h-2 rounded-full"
          :class="alert.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'"
        />
        <div class="min-w-0 flex-1">
          <div class="text-sm text-slate-900">{{ alert.message }}</div>
          <div class="text-xs text-slate-500 mt-0.5">
            <template v-if="showProject && alert.project_name">{{ alert.project_name }}</template>
            <template v-if="alert.at">
              <span v-if="showProject && alert.project_name"> · </span>
              {{ formatTime(alert.at) }}
            </template>
          </div>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import type { DashboardAlert } from '@/core/utils/dashboard-api'

defineOptions({ name: 'DashboardAlerts' })

withDefaults(
  defineProps<{
    alerts: DashboardAlert[]
    showProject?: boolean
  }>(),
  { showProject: true },
)

function formatTime(value: string): string {
  if (!value) return ''
  const parsed = new Date(value.replace(' ', 'T'))
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}
</script>

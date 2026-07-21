<template>
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
    <div
      v-for="tile in tiles"
      :key="tile.label"
      class="bg-white rounded-lg border border-slate-200 shadow-sm p-4"
    >
      <p class="text-xs font-medium text-slate-500">{{ tile.label }}</p>
      <p class="mt-1 text-2xl font-bold text-slate-900">{{ tile.value }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DashboardKpis } from '@/core/utils/dashboard-api'

defineOptions({ name: 'DashboardKpiTiles' })

const props = defineProps<{ kpis: DashboardKpis; scope: 'global' | 'project' | 'field' }>()

const tiles = computed(() => {
  const k = props.kpis
  const list = [
    { label: 'Field work started today', value: k.field_work_started_today },
    { label: 'Field work ended today', value: k.field_work_ended_today },
    { label: 'Open field work today', value: k.field_work_open_today },
    { label: 'Submitted today', value: k.foreman_submitted_today },
    { label: 'Urgent (7 days)', value: k.urgent_last_7_days },
    { label: 'Events (24h)', value: k.events_last_24h },
  ]
  if (props.scope === 'global') {
    list.unshift({ label: 'Active projects', value: k.active_projects })
  } else if (props.scope === 'field') {
    list.unshift({ label: 'My projects', value: k.active_projects })
  }
  return list
})
</script>

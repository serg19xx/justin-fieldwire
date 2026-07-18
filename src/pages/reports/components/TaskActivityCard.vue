<template>
  <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="text-sm font-semibold text-slate-900">{{ activity.task_name }}</div>
        <div v-if="metaBits.length" class="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-slate-500">
          <span v-for="(bit, index) in metaBits" :key="index">{{ bit }}</span>
        </div>
      </div>
      <span
        v-if="activity.submitted"
        class="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
      >
        Submitted
      </span>
    </div>

    <div v-if="extras.length" class="mt-2 space-y-1">
      <div v-for="extra in extras" :key="extra.label" class="text-xs text-slate-600">
        <span class="text-slate-400">{{ extra.label }}:</span> {{ extra.value }}
      </div>
    </div>

    <div class="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <PhotoGroup label="Before work" :photos="activity.photos_before" />
      <PhotoGroup label="After work" :photos="activity.photos_after" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ReportTaskActivity } from '@/core/utils/reports-api'
import PhotoGroup from './PhotoGroup.vue'

defineOptions({ name: 'TaskActivityCard' })

const props = defineProps<{ activity: ReportTaskActivity }>()

function formatTime(value: string): string {
  if (!value) return ''
  const parsed = new Date(value.replace(' ', 'T'))
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatWorked(minutes: number | null): string {
  if (minutes == null || minutes < 0) return ''
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`
  if (hours > 0) return `${hours}h`
  return `${mins}m`
}

const metaBits = computed(() => {
  const bits: string[] = []
  const start = formatTime(props.activity.started_at)
  const end = formatTime(props.activity.ended_at)
  if (start || end) {
    const worked = formatWorked(props.activity.worked_minutes)
    bits.push(`${start || '—'} → ${end || '—'}${worked ? ` (${worked})` : ''}`)
  }
  if (props.activity.progress_pct != null) {
    bits.push(`Progress: ${props.activity.progress_pct}%`)
  }
  if (props.activity.status) {
    bits.push(props.activity.status)
  }
  return bits
})

const extras = computed(() =>
  [
    { label: 'Start reason', value: props.activity.start_reason },
    { label: 'End reason', value: props.activity.end_reason },
    { label: 'Notes', value: props.activity.notes },
  ].filter((item) => item.value && item.value.trim() !== ''),
)
</script>

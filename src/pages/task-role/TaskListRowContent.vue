<template>
  <div class="flex items-start justify-between gap-2">
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <span v-if="isMilestone(task.milestone)" class="text-amber-600" aria-hidden="true">{{ MILESTONE_ICON }}</span>
        <span class="font-medium text-gray-900 truncate">{{ task.name }}</span>
      </div>
      <p class="text-xs text-gray-500 mt-0.5">
        {{ formatDateRange(task.start_planned, task.end_planned) }}
      </p>
    </div>
    <div class="flex flex-col items-end gap-1 flex-shrink-0">
      <span :class="statusClass(task.status)">
        {{ getTaskStatusLabel((task.status as TaskStatus)) }}
      </span>
      <span class="text-xs text-gray-400">{{ task.progress_pct ?? 0 }}%</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getTaskStatusLabel, MILESTONE_ICON } from '@/core/utils/task-utils'
import { isMilestone } from '@/core/types/task'
import type { Task, TaskStatus } from '@/core/types/task'

defineProps<{
  task: Task
}>()

function statusClass(status: string | undefined): string {
  const map: Record<string, string> = {
    planned: 'bg-amber-100 text-amber-800',
    scheduled: 'bg-blue-100 text-blue-800',
    scheduled_accepted: 'bg-indigo-100 text-indigo-800',
    in_progress: 'bg-green-100 text-green-800',
    partially_completed: 'bg-teal-100 text-teal-800',
    delayed_due_to_issue: 'bg-orange-100 text-orange-800',
    ready_for_inspection: 'bg-cyan-100 text-cyan-800',
    completed: 'bg-gray-100 text-gray-800',
  }
  return map[status ?? ''] ?? 'bg-gray-100 text-gray-700'
}

function formatDateRange(start: string | undefined, end: string | undefined): string {
  const s = start
    ? new Date(start).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : ''
  const e = end
    ? new Date(end).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : ''
  if (s && e && s !== e) return `${s} – ${e}`
  return s || e || '—'
}
</script>

<template>
  <div class="flex items-start justify-between gap-3">
    <div class="min-w-0 flex-1 space-y-1.5">
      <div class="flex items-center gap-2">
        <span v-if="isMilestone(task.milestone)" class="text-amber-600 shrink-0" aria-hidden="true">{{
          MILESTONE_ICON
        }}</span>
        <span class="font-medium text-gray-900 leading-snug">{{ task.name }}</span>
      </div>
      <p class="text-xs text-gray-500">
        {{ formatDateRange(task.start_planned, task.end_planned) }}
      </p>
      <p v-if="addressLine" class="text-xs text-gray-600 flex gap-1.5 items-start leading-snug">
        <svg
          class="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span class="line-clamp-2 break-words">{{ addressLine }}</span>
      </p>
      <p v-else class="text-xs text-gray-400">No address</p>
      <p class="text-xs text-gray-500">
        {{ workersLabel }}
      </p>
    </div>
    <div class="flex flex-col items-end gap-1 shrink-0">
      <span :class="statusClass(task.status)">
        {{ getTaskStatusLabel(task.status as TaskStatus) }}
      </span>
      <span class="text-xs text-gray-400">{{ task.progress_pct ?? 0 }}%</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getTaskStatusLabel, MILESTONE_ICON } from '@/core/utils/task-utils'
import { isMilestone } from '@/core/types/task'
import type { Task, TaskStatus } from '@/core/types/task'

const props = defineProps<{
  task: Task
}>()

const addressLine = computed(() => (props.task.address || '').trim())

const assignedWorkerCount = computed(() => countAssignedWorkers(props.task))

const workersLabel = computed(() => {
  const n = assignedWorkerCount.value
  if (n === 0) return 'No workers assigned'
  if (n === 1) return '1 worker assigned'
  return `${n} workers assigned`
})

function countAssignedWorkers(task: Task): number {
  const ids = new Set<number>()
  const lead = task.task_lead_id != null ? Number(task.task_lead_id) : NaN
  if (Number.isFinite(lead) && lead > 0) ids.add(lead)
  for (const raw of task.team_members ?? []) {
    const id = Number(raw)
    if (Number.isFinite(id) && id > 0) ids.add(id)
  }
  if (ids.size === 0) {
    for (const raw of task.assignees ?? []) {
      const id = Number(raw)
      if (Number.isFinite(id) && id > 0) ids.add(id)
    }
  }
  return ids.size
}

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

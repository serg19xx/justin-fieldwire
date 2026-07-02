<template>
  <ul class="divide-y divide-gray-100 rounded-lg border border-gray-200 overflow-hidden bg-white">
    <li
      v-for="row in rows"
      :key="row.id"
      class="px-4 py-3"
      :class="highlightCurrent ? 'bg-green-50/80 border-l-4 border-l-green-600' : ''"
    >
      <p class="text-sm font-medium text-gray-900 leading-snug">{{ row.name }}</p>
      <p class="text-xs text-gray-500 mt-1">
        {{ row.statusLabel }}
        · {{ row.progress_pct }}%
        · {{ formatAssignmentDates(row.start_planned, row.end_planned) }}
      </p>
      <p class="text-xs text-gray-400 mt-0.5">
        {{ row.roleOnTask === 'lead' ? 'Task lead' : 'Team member' }}
      </p>
      <p v-if="row.address?.trim()" class="text-xs text-gray-500 mt-1 whitespace-pre-wrap break-words">
        {{ row.address }}
      </p>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { formatAssignmentDates, type WorkerAssignmentTaskRow } from '@/core/utils/worker-assignments'

withDefaults(
  defineProps<{
    rows: WorkerAssignmentTaskRow[]
    highlightCurrent?: boolean
  }>(),
  { highlightCurrent: false },
)
</script>

<template>
  <section class="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
    <h2 class="text-sm font-semibold text-slate-900 mb-3">Recent activity</h2>
    <div v-if="activity.length === 0" class="text-sm text-slate-400 italic">No recent activity</div>
    <ul v-else class="divide-y divide-slate-100">
      <li v-for="(item, index) in activity" :key="index" class="py-2.5 flex gap-3">
        <div class="w-16 shrink-0 text-xs text-slate-400 pt-0.5">
          {{ formatTime(item.at) }}
        </div>
        <div class="min-w-0 flex-1">
          <div class="text-sm text-slate-900">{{ item.title }}</div>
          <div v-if="meta(item)" class="text-xs text-slate-500 mt-0.5">{{ meta(item) }}</div>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import type { DashboardActivityItem } from '@/core/utils/dashboard-api'

defineOptions({ name: 'DashboardActivityFeed' })

const props = withDefaults(
  defineProps<{
    activity: DashboardActivityItem[]
    showProject?: boolean
  }>(),
  { showProject: true },
)

function formatTime(value: string): string {
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

function meta(item: DashboardActivityItem): string {
  const parts: string[] = []
  if (props.showProject && item.project_name) parts.push(item.project_name)
  if (item.comment) parts.push(item.comment)
  return parts.join(' · ')
}
</script>

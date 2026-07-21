<template>
  <section class="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
    <h2 class="text-sm font-semibold text-slate-900 mb-3">Messages</h2>
    <div v-if="messages.length === 0" class="text-sm text-slate-400 italic">
      No messages yet. Important updates from your PM or the system will appear here.
    </div>
    <ul v-else class="divide-y divide-slate-100">
      <li v-for="message in messages" :key="message.id" class="py-2.5">
        <div class="text-sm font-medium text-slate-900">{{ message.title }}</div>
        <div class="text-sm text-slate-600 mt-0.5">{{ message.body }}</div>
        <div class="text-xs text-slate-400 mt-1">{{ formatTime(message.at) }}</div>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import type { DashboardMessage } from '@/core/utils/dashboard-api'

defineOptions({ name: 'DashboardMessages' })

withDefaults(
  defineProps<{
    messages?: DashboardMessage[]
  }>(),
  { messages: () => [] },
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
</script>

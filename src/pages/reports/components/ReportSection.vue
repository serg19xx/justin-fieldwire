<template>
  <div class="bg-white rounded-lg shadow p-5">
    <h2 class="text-sm font-semibold mb-3" :class="accent === 'red' ? 'text-red-700' : 'text-slate-900'">
      {{ title }}
    </h2>

    <div v-if="rows.length === 0">
      <div class="text-sm text-slate-400 italic">No activity</div>
      <div
        v-if="photoLabel"
        class="mt-3 flex min-h-24 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-4 text-center"
      >
        <div>
          <div class="text-xl text-slate-300" aria-hidden="true">📷</div>
          <div class="mt-1 text-xs font-medium text-slate-500">{{ photoLabel }}</div>
          <div class="mt-0.5 text-xs text-slate-400">No photos captured</div>
        </div>
      </div>
    </div>

    <div v-else class="divide-y divide-slate-100">
      <div v-for="(row, index) in rows" :key="index" class="py-2.5 flex gap-3">
        <div class="w-24 shrink-0 text-xs text-slate-400 pt-0.5">
          {{ formatTime(row.at) }}
        </div>
        <div class="min-w-0 flex-1">
          <div class="text-sm text-slate-900">{{ rowTitle(row) }}</div>
          <div v-if="rowMeta(row)" class="text-xs text-slate-500 mt-0.5">
            {{ rowMeta(row) }}
          </div>
          <div v-if="row.photos?.length" class="mt-3">
            <div class="mb-1.5 text-xs text-slate-500">
              {{ row.photos.length }} {{ row.photos.length === 1 ? 'photo' : 'photos' }}
            </div>
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              <a
                v-for="photo in row.photos"
                :key="photo.id"
                :href="photo.data_uri"
                target="_blank"
                rel="noopener"
                class="block aspect-[4/3] overflow-hidden rounded-md border border-slate-200 bg-slate-100"
                :title="photo.original_name"
              >
                <img
                  :src="photo.data_uri"
                  :alt="photo.original_name || `${title} photo`"
                  width="480"
                  height="360"
                  loading="lazy"
                  class="h-full w-full object-cover transition-transform hover:scale-105"
                />
              </a>
            </div>
          </div>
          <div
            v-else-if="photoLabel"
            class="mt-3 flex min-h-24 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-4 text-center"
          >
            <div>
              <div class="text-xl text-slate-300" aria-hidden="true">📷</div>
              <div class="mt-1 text-xs font-medium text-slate-500">{{ photoLabel }}</div>
              <div class="mt-0.5 text-xs text-slate-400">No photos captured</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ReportSectionRow } from '@/core/utils/reports-api'

defineOptions({ name: 'ReportSection' })

withDefaults(
  defineProps<{
    title: string
    rows: ReportSectionRow[]
    accent?: 'default' | 'red'
    photoLabel?: string
  }>(),
  { accent: 'default', photoLabel: undefined },
)

function rowTitle(row: ReportSectionRow): string {
  if (row.task_name) return row.task_name
  if (row.task_id) return `Task #${row.task_id}`
  if (row.from || row.to) return `${row.from ?? ''} → ${row.to ?? ''}`.trim()
  if (row.title) return row.title
  return '—'
}

function rowMeta(row: ReportSectionRow): string {
  const parts: string[] = []
  if (row.reason) parts.push(`reason: ${row.reason}`)
  if (row.comment) parts.push(row.comment)
  return parts.join(' · ')
}

function formatTime(value?: string): string {
  if (!value) return ''
  const parsed = new Date(value.replace(' ', 'T'))
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}
</script>

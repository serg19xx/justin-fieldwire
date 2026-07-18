<template>
  <div>
    <div class="mb-1.5 text-xs font-medium text-slate-500">{{ label }} ({{ photos.length }})</div>

    <div v-if="photos.length" class="grid grid-cols-3 gap-1.5">
      <a
        v-for="photo in photos"
        :key="photo.id"
        :href="photo.data_uri"
        target="_blank"
        rel="noopener"
        class="block aspect-[4/3] overflow-hidden rounded-md border border-slate-200 bg-slate-100"
        :title="photo.original_name"
      >
        <img
          :src="photo.data_uri"
          :alt="photo.original_name || `${label} photo`"
          width="480"
          height="360"
          loading="lazy"
          class="h-full w-full object-cover transition-transform hover:scale-105"
        />
      </a>
    </div>

    <div
      v-else
      class="flex min-h-20 items-center justify-center rounded-md border-2 border-dashed border-slate-200 bg-slate-50 px-3 text-center"
    >
      <div>
        <div class="text-lg text-slate-300" aria-hidden="true">📷</div>
        <div class="mt-0.5 text-xs text-slate-400">No photos captured</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ReportPhotoSnapshot } from '@/core/utils/reports-api'

defineOptions({ name: 'PhotoGroup' })

defineProps<{ label: string; photos: ReportPhotoSnapshot[] }>()
</script>

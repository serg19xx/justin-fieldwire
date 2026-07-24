<script setup lang="ts">
import { computed } from 'vue'

export interface BarItem {
  label: string
  value: number
  color?: string
}

const props = withDefaults(
  defineProps<{
    items: BarItem[]
    maxBars?: number
    valueSuffix?: string
    /** When true, treat values as 0–100 percentages for axis scale */
    percentScale?: boolean
  }>(),
  { maxBars: 12, valueSuffix: '', percentScale: false },
)

const visible = computed(() => {
  const sorted = [...props.items].sort((a, b) => b.value - a.value)
  return sorted.slice(0, props.maxBars)
})

const maxValue = computed(() => {
  if (props.percentScale) return 100
  const m = Math.max(0, ...visible.value.map((i) => i.value))
  return m > 0 ? m : 1
})
</script>

<template>
  <div class="space-y-2">
    <div
      v-for="(item, i) in visible"
      :key="i"
      class="grid grid-cols-[minmax(0,7rem)_1fr_auto] gap-2 items-center text-sm"
    >
      <span class="text-slate-600 truncate" :title="item.label">{{ item.label }}</span>
      <div class="h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          class="h-full rounded-full transition-all"
          :style="{
            width: `${Math.min(100, (item.value / maxValue) * 100)}%`,
            background: item.color || '#2563eb',
          }"
        />
      </div>
      <span class="text-slate-900 font-medium tabular-nums text-right min-w-[3.5rem]">
        {{ item.value }}{{ valueSuffix }}
      </span>
    </div>
    <p v-if="visible.length === 0" class="text-xs text-slate-400">No data</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface DonutSlice {
  label: string
  value: number
  color: string
}

const props = withDefaults(
  defineProps<{
    slices: DonutSlice[]
    size?: number
    thickness?: number
  }>(),
  { size: 160, thickness: 28 },
)

const total = computed(() => props.slices.reduce((s, x) => s + Math.max(0, x.value), 0))

const radius = computed(() => (props.size - props.thickness) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)

const arcs = computed(() => {
  const sum = total.value
  if (sum <= 0) return []
  let offset = 0
  return props.slices
    .filter((s) => s.value > 0)
    .map((s) => {
      const frac = s.value / sum
      const length = frac * circumference.value
      const arc = {
        ...s,
        dasharray: `${length} ${circumference.value - length}`,
        dashoffset: -offset,
        percent: Math.round(frac * 1000) / 10,
      }
      offset += length
      return arc
    })
})
</script>

<template>
  <div class="flex flex-col sm:flex-row items-center gap-4">
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`" class="shrink-0">
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        stroke="#e2e8f0"
        :stroke-width="thickness"
      />
      <g v-if="arcs.length" :transform="`rotate(-90 ${size / 2} ${size / 2})`">
        <circle
          v-for="(a, i) in arcs"
          :key="i"
          :cx="size / 2"
          :cy="size / 2"
          :r="radius"
          fill="none"
          :stroke="a.color"
          :stroke-width="thickness"
          :stroke-dasharray="a.dasharray"
          :stroke-dashoffset="a.dashoffset"
          stroke-linecap="butt"
        />
      </g>
      <text
        :x="size / 2"
        :y="size / 2"
        text-anchor="middle"
        dominant-baseline="central"
        class="fill-slate-800"
        style="font-size: 18px; font-weight: 700"
      >
        {{ total }}
      </text>
    </svg>
    <ul class="space-y-1.5 text-sm w-full min-w-0">
      <li v-for="(a, i) in arcs" :key="i" class="flex items-center justify-between gap-2">
        <span class="flex items-center gap-2 min-w-0">
          <span class="w-2.5 h-2.5 rounded-sm shrink-0" :style="{ background: a.color }" />
          <span class="text-slate-700 truncate">{{ a.label }}</span>
        </span>
        <span class="text-slate-900 font-medium tabular-nums shrink-0">
          {{ a.value }}
          <span class="text-slate-400 font-normal">({{ a.percent }}%)</span>
        </span>
      </li>
      <li v-if="arcs.length === 0" class="text-slate-400 text-xs">No data</li>
    </ul>
  </div>
</template>

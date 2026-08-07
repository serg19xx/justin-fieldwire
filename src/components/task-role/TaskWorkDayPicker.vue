<template>
  <div class="rounded-xl border border-gray-200 bg-white px-2 py-2 shadow-sm">
    <div class="flex items-center gap-1">
      <button
        type="button"
        class="shrink-0 rounded-lg px-2.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40"
        :disabled="disabled"
        aria-label="Previous day"
        @click="emit('update:modelValue', addDaysToWorkYmd(modelValue, -1))"
      >
        ←
      </button>
      <div class="min-w-0 flex-1 text-center">
        <p class="text-sm font-semibold text-gray-900 truncate">{{ label }}</p>
        <button
          v-if="modelValue !== today"
          type="button"
          class="mt-0.5 text-[11px] font-medium text-orange-700 hover:text-orange-800"
          :disabled="disabled"
          @click="emit('update:modelValue', today)"
        >
          Jump to today
        </button>
        <p v-else class="mt-0.5 text-[11px] text-gray-500">Today</p>
      </div>
      <button
        type="button"
        class="shrink-0 rounded-lg px-2.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40"
        :disabled="disabled"
        aria-label="Next day"
        @click="emit('update:modelValue', addDaysToWorkYmd(modelValue, 1))"
      >
        →
      </button>
    </div>
    <label class="mt-2 flex items-center justify-center gap-2 text-[11px] text-gray-500">
      <span class="sr-only">Pick date</span>
      <input
        type="date"
        class="rounded border border-gray-300 px-2 py-1 text-xs text-gray-800"
        :value="modelValue"
        :disabled="disabled"
        @change="onDateInput"
      />
    </label>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  addDaysToWorkYmd,
  formatWorkYmdLabel,
  parseWorkYmd,
  todayWorkYmd,
} from '@/core/utils/work-day'

const props = withDefaults(
  defineProps<{
    modelValue: string
    disabled?: boolean
  }>(),
  { disabled: false },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const today = todayWorkYmd()

const label = computed(() => formatWorkYmdLabel(props.modelValue))

function onDateInput(event: Event): void {
  const el = event.target as HTMLInputElement
  const next = parseWorkYmd(el.value)
  if (next) emit('update:modelValue', next)
}
</script>

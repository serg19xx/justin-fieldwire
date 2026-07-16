<template>
  <div class="operational-hours-editor">
    <div
      class="overflow-x-auto rounded-md border"
      :class="invalidDayKeys.size > 0 ? 'border-red-300' : 'border-gray-200'"
    >
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-600">
          <tr>
            <th class="px-3 py-2 font-medium">Day</th>
            <th class="px-3 py-2 font-medium">Open</th>
            <th class="px-3 py-2 font-medium">Close</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="dayDef in days"
            :key="dayDef.key"
            class="border-t border-gray-100"
            :class="invalidDayKeys.has(dayDef.key) ? 'bg-red-50' : ''"
          >
            <td class="px-3 py-2 text-gray-800">{{ dayDef.label }}</td>
            <td class="px-3 py-1.5">
              <select
                :value="dayValue(dayDef.key).open ?? ''"
                :disabled="disabled"
                :class="[
                  'w-full min-w-[7rem] rounded-md border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-500',
                  invalidDayKeys.has(dayDef.key)
                    ? 'border-red-400 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500',
                ]"
                @change="onTimeChange(dayDef.key, 'open', $event)"
              >
                <option value="">—</option>
                <option v-for="opt in timeOptions" :key="`open-${opt}`" :value="opt">
                  {{ opt }}
                </option>
              </select>
            </td>
            <td class="px-3 py-1.5">
              <select
                :value="dayValue(dayDef.key).close ?? ''"
                :disabled="disabled"
                :class="[
                  'w-full min-w-[7rem] rounded-md border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-500',
                  invalidDayKeys.has(dayDef.key)
                    ? 'border-red-400 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500',
                ]"
                @change="onTimeChange(dayDef.key, 'close', $event)"
              >
                <option value="">—</option>
                <option v-for="opt in timeOptions" :key="`close-${opt}`" :value="opt">
                  {{ opt }}
                </option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="validationError" class="mt-1 text-sm text-red-600">
      {{ validationError }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  OPERATIONAL_HOURS_DAYS,
  OPERATIONAL_HOURS_TIME_OPTIONS,
  createEmptyOperationalHours,
  getInvalidOperationalHoursDays,
  getOperationalHoursValidationError,
  normalizeOperationalHours,
  type OperationalHoursData,
  type OperationalHoursDayKey,
  type OperationalHoursTimeOption,
} from '@/core/utils/operational-hours'

interface Props {
  modelValue?: OperationalHoursData | null
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: OperationalHoursData]
}>()

const days = OPERATIONAL_HOURS_DAYS
const timeOptions = OPERATIONAL_HOURS_TIME_OPTIONS

const data = computed(() =>
  normalizeOperationalHours(props.modelValue ?? createEmptyOperationalHours()),
)

const invalidDayKeys = computed(() => new Set(getInvalidOperationalHoursDays(data.value)))

const validationError = computed(() => getOperationalHoursValidationError(data.value))

function dayValue(day: OperationalHoursDayKey) {
  return data.value.days.find((d) => d.day === day) ?? { day, open: null, close: null }
}

function onTimeChange(
  day: OperationalHoursDayKey,
  field: 'open' | 'close',
  event: Event,
) {
  const target = event.target as HTMLSelectElement
  const value = target.value === '' ? null : (target.value as OperationalHoursTimeOption)
  const next = normalizeOperationalHours({
    days: data.value.days.map((row) =>
      row.day === day ? { ...row, [field]: value } : row,
    ),
  })
  emit('update:modelValue', next)
}
</script>

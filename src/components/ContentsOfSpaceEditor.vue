<template>
  <div class="contents-of-space-editor">
    <div class="overflow-x-auto rounded-md border border-gray-200">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-600">
          <tr>
            <th class="px-3 py-2 font-medium">Space</th>
            <th class="px-3 py-2 text-right font-medium">Quantity</th>
            <th class="px-3 py-2 text-right font-medium">Set Size</th>
            <th class="px-3 py-2 text-right font-medium">Total (sq/ft)</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="entry in catalog" :key="entryKey(entry)">
            <tr v-if="entry.kind === 'separator'" class="border-t border-gray-100">
              <td colspan="4" class="h-2 bg-gray-50/80 p-0"></td>
            </tr>
            <tr v-else-if="entry.kind === 'calc'" class="border-t border-gray-100">
              <td class="px-3 py-2 text-gray-800">{{ entry.label }}</td>
              <td class="px-3 py-1.5 text-right">
                <input
                  :value="quantityDisplay(entry.key)"
                  type="number"
                  min="0"
                  step="1"
                  inputmode="numeric"
                  :disabled="disabled"
                  class="ml-auto w-20 rounded-md border border-gray-300 px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  @input="onQuantityInput(entry.key, $event)"
                  @blur="onQuantityBlur(entry.key)"
                />
              </td>
              <td class="px-3 py-2 text-right tabular-nums text-gray-600">{{ entry.setSize }}</td>
              <td class="px-3 py-2 text-right tabular-nums text-gray-900">
                {{ formatNumber(calcTotal(entry.key)) }}
              </td>
            </tr>
            <tr v-else class="border-t border-gray-100">
              <td class="px-3 py-2 text-gray-800">{{ entry.label }}</td>
              <td colspan="2" class="px-3 py-1.5">
                <select
                  :value="selectDisplay(entry.key)"
                  :disabled="disabled"
                  class="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  @change="onSelectChange(entry.key, $event)"
                >
                  <option value="">— Select —</option>
                  <option v-for="opt in entry.options" :key="opt" :value="String(opt)">
                    {{ formatNumber(opt) }} sq/ft
                  </option>
                </select>
              </td>
              <td class="px-3 py-2 text-right tabular-nums text-gray-900">
                {{ formatNumber(selectTotal(entry.key)) }}
              </td>
            </tr>
          </template>
        </tbody>
        <tfoot>
          <tr class="border-t-2 border-gray-300 bg-gray-50">
            <td colspan="3" class="px-3 py-3 text-sm font-semibold text-gray-900">Total (sq/ft)</td>
            <td class="px-3 py-3 text-right text-sm font-semibold tabular-nums text-gray-900">
              {{ formatNumber(grandTotal) }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  CONTENTS_OF_SPACE_CATALOG,
  createEmptyContentsOfSpace,
  getCalcSetSize,
  getContentsOfSpaceGrandTotal,
  normalizeContentsOfSpace,
  type ContentsOfSpaceCalcKey,
  type ContentsOfSpaceCatalogEntry,
  type ContentsOfSpaceData,
  type ContentsOfSpaceSelectKey,
} from '@/core/utils/contents-of-space'

interface Props {
  modelValue?: ContentsOfSpaceData | null
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: ContentsOfSpaceData]
}>()

const catalog = CONTENTS_OF_SPACE_CATALOG

const data = computed(() =>
  normalizeContentsOfSpace(props.modelValue ?? createEmptyContentsOfSpace()),
)

const grandTotal = computed(() => getContentsOfSpaceGrandTotal(data.value))

function entryKey(entry: ContentsOfSpaceCatalogEntry): string {
  if (entry.kind === 'separator') {
    return entry.id
  }
  return entry.key
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-CA')
}

function findCalcQuantity(key: ContentsOfSpaceCalcKey): number {
  const row = data.value.rows.find((r) => r.kind === 'calc' && r.key === key)
  return row && row.kind === 'calc' ? row.quantity : 0
}

function findSelectValue(key: ContentsOfSpaceSelectKey): number | null {
  const row = data.value.rows.find((r) => r.kind === 'select' && r.key === key)
  return row && row.kind === 'select' ? row.value : null
}

function quantityDisplay(key: ContentsOfSpaceCalcKey): string {
  const q = findCalcQuantity(key)
  return q === 0 ? '' : String(q)
}

function selectDisplay(key: ContentsOfSpaceSelectKey): string {
  const v = findSelectValue(key)
  return v == null ? '' : String(v)
}

function calcTotal(key: ContentsOfSpaceCalcKey): number {
  return findCalcQuantity(key) * getCalcSetSize(key)
}

function selectTotal(key: ContentsOfSpaceSelectKey): number {
  return findSelectValue(key) ?? 0
}

function emitUpdated(next: ContentsOfSpaceData) {
  emit('update:modelValue', next)
}

function onQuantityInput(key: ContentsOfSpaceCalcKey, event: Event) {
  const target = event.target as HTMLInputElement
  const raw = target.value
  const quantity = raw === '' ? 0 : Math.max(0, Math.floor(Number(raw) || 0))
  const next = normalizeContentsOfSpace({
    rows: data.value.rows.map((row) =>
      row.kind === 'calc' && row.key === key ? { ...row, quantity } : row,
    ),
  })
  emitUpdated(next)
}

function onQuantityBlur(key: ContentsOfSpaceCalcKey) {
  // Ensure empty displays as blank but stored value stays 0
  const next = normalizeContentsOfSpace({
    rows: data.value.rows.map((row) =>
      row.kind === 'calc' && row.key === key
        ? { ...row, quantity: Math.max(0, Math.floor(row.quantity || 0)) }
        : row,
    ),
  })
  emitUpdated(next)
}

function onSelectChange(key: ContentsOfSpaceSelectKey, event: Event) {
  const target = event.target as HTMLSelectElement
  const value = target.value === '' ? null : Number(target.value)
  const next = normalizeContentsOfSpace({
    rows: data.value.rows.map((row) =>
      row.kind === 'select' && row.key === key ? { ...row, value } : row,
    ),
  })
  emitUpdated(next)
}
</script>

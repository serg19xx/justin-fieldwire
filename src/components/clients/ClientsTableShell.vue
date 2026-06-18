<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ClientListRow, ClientRegistryEntry, ClientRowActionId, ClientTableColumn } from '@/core/types/client-registry'
import { resolveColumnSortKey, type ClientSortDirection } from '@/core/utils/client-list-sort'
import {
  applyClientRowSelectionClick,
  isAllRowsOnPageSelected,
  isClientRowSelected,
  isSomeRowsOnPageSelected,
  toggleClientRowSelection,
  toggleSelectAllOnPage,
} from '@/core/utils/client-row-selection'
import AppIcon from '@/components/AppIcon.vue'
import ClientRowActions from '@/components/clients/ClientRowActions.vue'

const props = withDefaults(
  defineProps<{
    entry: ClientRegistryEntry
    rows: ClientListRow[]
    page?: number
    pageSize?: number
    loading?: boolean
    error?: string | null
    selectedIds?: number[]
    rowActionsDisabled?: boolean
    sortBy?: string
    sortDir?: ClientSortDirection
  }>(),
  {
    selectedIds: () => [],
    rowActionsDisabled: false,
    sortBy: '',
    sortDir: 'asc',
  },
)

const emit = defineEmits<{
  action: [id: ClientRowActionId, row: ClientListRow]
  'update:selectedIds': [ids: number[]]
  sort: [sortBy: string]
}>()

const anchorIndex = ref<number | null>(null)
const selectAllCheckboxRef = ref<HTMLInputElement | null>(null)

const allOnPageSelected = computed(() => isAllRowsOnPageSelected(props.rows, props.selectedIds))
const someOnPageSelected = computed(() => isSomeRowsOnPageSelected(props.rows, props.selectedIds))
const headerCheckboxIndeterminate = computed(() => someOnPageSelected.value && !allOnPageSelected.value)

watch(
  headerCheckboxIndeterminate,
  (value) => {
    if (selectAllCheckboxRef.value) {
      selectAllCheckboxRef.value.indeterminate = value
    }
  },
  { flush: 'post' },
)

const leadingWidthClass = computed(() => {
  const count = props.entry.leadingActions.length
  if (count >= 4) return 'w-32'
  if (count >= 3) return 'w-28'
  if (count >= 2) return 'w-20'
  return 'w-16'
})

const trailingWidthClass = computed(() => {
  const count = props.entry.trailingActions.length
  if (count >= 5) return 'w-36'
  if (count >= 3) return 'w-28'
  if (count >= 2) return 'w-20'
  return 'w-16'
})

function cellValue(row: ClientListRow, colKey: string): string {
  const v = row[colKey]
  if (v === null || v === undefined || v === '') return '—'
  return String(v)
}

function rowIndexValue(rowIndex: number): number {
  const page = props.page ?? 1
  const size = props.pageSize ?? 10
  return (page - 1) * size + rowIndex + 1
}

function coordinatesText(row: ClientListRow, latKey: string, lngKey: string): string {
  const lat = row[latKey]
  const lng = row[lngKey]
  if (lat != null && lng != null && lat !== '' && lng !== '') {
    return `${lat},${lng}`
  }
  if (latKey === lngKey && typeof lat === 'string' && lat.includes(',')) {
    return lat
  }
  return '—'
}

function mapUrl(row: ClientListRow, latKey: string, lngKey: string): string | null {
  let lat = row[latKey]
  let lng = row[lngKey]
  if (latKey === lngKey && typeof lat === 'string' && lat.includes(',')) {
    const parts = lat.split(',')
    lat = parts[0]?.trim()
    lng = parts[1]?.trim()
  }
  if (lat == null || lng == null || lat === '' || lng === '') return null
  return `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}`
}

function commsLink(row: ClientListRow, col: ClientTableColumn): string | null {
  if (!col.comms) return null

  const field = col.commsKey
  const phone = field
    ? row[field]
    : row.phone ?? row.cell ?? row.cellPhone ?? row.cell_phone ?? row.officePhone
  const email = field && col.comms === 'email' ? row[field] : row.email
  const fax = field && col.comms === 'fax' ? row[field] : row.fax ?? row.faxNumber

  if (col.comms === 'phone' && phone) return `tel:${phone}`
  if (col.comms === 'email' && email) return `mailto:${email}`
  if (col.comms === 'fax' && fax) return `tel:${fax}`
  return null
}

function onAction(id: ClientRowActionId, row: ClientListRow) {
  emit('action', id, row)
}

function rowClass(rowId: number): string {
  if (isClientRowSelected(props.selectedIds, rowId)) {
    return 'bg-blue-100 hover:bg-blue-100 ring-1 ring-inset ring-blue-300'
  }
  return 'hover:bg-gray-50/80'
}

function handleRowClick(row: ClientListRow, rowIndex: number, event: MouseEvent) {
  const next = applyClientRowSelectionClick(props.rows, props.selectedIds, {
    rowId: row.id,
    rowIndex,
    shiftKey: event.shiftKey,
    ctrlKey: event.ctrlKey,
    metaKey: event.metaKey,
    anchorIndex: anchorIndex.value,
  })
  anchorIndex.value = rowIndex
  emit('update:selectedIds', next)
}

function handleCheckboxClick(row: ClientListRow, rowIndex: number, event: MouseEvent) {
  event.stopPropagation()
  if (event.shiftKey) {
    handleRowClick(row, rowIndex, event)
    return
  }
  anchorIndex.value = rowIndex
  emit('update:selectedIds', toggleClientRowSelection(props.selectedIds, row.id))
}

function handleSelectAllOnPage(event: MouseEvent) {
  event.stopPropagation()
  emit('update:selectedIds', toggleSelectAllOnPage(props.rows, props.selectedIds))
  if (props.rows.length > 0) {
    anchorIndex.value = 0
  }
}

function isColumnSorted(col: ClientTableColumn): boolean {
  return resolveColumnSortKey(col) === props.sortBy
}

function handleSortColumn(col: ClientTableColumn) {
  if (!col.sortable) return
  emit('sort', resolveColumnSortKey(col))
}
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-lg shadow-sm w-full min-w-0 max-w-full overflow-hidden">
    <div v-if="error" class="p-4 text-sm text-red-600">{{ error }}</div>
    <div v-else-if="rows.length === 0 && !loading" class="p-8 text-center text-sm text-gray-500">
      No records found.
    </div>
    <div v-else class="relative w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain">
      <div
        v-if="loading"
        class="absolute inset-0 z-10 flex items-center justify-center bg-white/75 text-sm text-gray-500"
      >
        Loading…
      </div>
      <table class="w-max min-w-full text-sm">
        <thead class="bg-slate-700 text-white">
          <tr>
            <th class="w-10 px-2 py-2 shrink-0 text-center">
              <input
                ref="selectAllCheckboxRef"
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                :checked="allOnPageSelected"
                title="Select all on this page"
                @click="handleSelectAllOnPage"
              />
            </th>
            <th
              class="px-2 py-2 shrink-0 text-left text-xs font-semibold uppercase tracking-wide"
              :class="leadingWidthClass"
            >
              <span class="sr-only">Row actions</span>
            </th>
            <th
              v-for="col in entry.columns"
              :key="col.key"
              class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
              :class="col.sortable ? 'cursor-pointer select-none hover:bg-slate-600' : ''"
              :aria-sort="
                col.sortable && isColumnSorted(col)
                  ? sortDir === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : undefined
              "
              @click="handleSortColumn(col)"
            >
              <span class="inline-flex items-center gap-1">
                {{ col.label }}
                <template v-if="col.sortable">
                  <AppIcon
                    v-if="isColumnSorted(col) && sortDir === 'asc'"
                    icon="mdi:arrow-up"
                    :size="14"
                    class="opacity-90"
                  />
                  <AppIcon
                    v-else-if="isColumnSorted(col) && sortDir === 'desc'"
                    icon="mdi:arrow-down"
                    :size="14"
                    class="opacity-90"
                  />
                  <AppIcon
                    v-else
                    icon="mdi:unfold-more-horizontal"
                    :size="14"
                    class="opacity-40"
                  />
                </template>
              </span>
            </th>
            <th
              class="px-2 py-2 shrink-0 text-left text-xs font-semibold uppercase tracking-wide"
              :class="trailingWidthClass"
            >
              <span class="sr-only">Communication actions</span>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr
            v-for="(row, rowIdx) in rows"
            :key="row.id"
            class="cursor-pointer select-none transition-colors"
            :class="rowClass(row.id)"
            @click="handleRowClick(row, rowIdx, $event)"
          >
            <td class="w-10 px-2 py-1.5 align-middle text-center" @click.stop>
              <input
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                :checked="isClientRowSelected(selectedIds, row.id)"
                @click="handleCheckboxClick(row, rowIdx, $event)"
              />
            </td>
            <td class="px-2 py-1.5 align-middle shrink-0" :class="leadingWidthClass" @click.stop>
              <ClientRowActions
                v-if="entry.leadingActions.length > 0"
                :actions="entry.leadingActions"
                :disabled="rowActionsDisabled"
                @action="onAction($event, row)"
              />
            </td>
            <td
              v-for="col in entry.columns"
              :key="col.key"
              class="px-3 py-2 text-gray-800 align-middle truncate max-w-[11rem]"
              :title="
                col.kind === 'coordinates'
                  ? coordinatesText(row, col.latKey ?? 'lat', col.lngKey ?? 'lng')
                  : col.kind === 'rowIndex'
                    ? String(rowIndexValue(rowIdx))
                    : cellValue(row, col.key)
              "
            >
              <template v-if="col.kind === 'rowIndex'">
                {{ rowIndexValue(rowIdx) }}
              </template>
              <template v-else-if="col.kind === 'coordinates'">
                {{ coordinatesText(row, col.latKey ?? 'lat', col.lngKey ?? 'lng') }}
              </template>
              <template v-else-if="col.kind === 'map'">
                <a
                  v-if="mapUrl(row, col.latKey ?? 'lat', col.lngKey ?? 'lng')"
                  :href="mapUrl(row, col.latKey ?? 'lat', col.lngKey ?? 'lng')!"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex text-green-600 hover:text-green-800"
                  title="Open map"
                  @click.stop
                >
                  <AppIcon icon="mdi:map-marker" :size="20" />
                </a>
                <span v-else class="text-gray-300">—</span>
              </template>
              <a
                v-else-if="col.comms && commsLink(row, col)"
                :href="commsLink(row, col)!"
                class="text-blue-600 hover:underline"
                @click.stop
              >
                {{ cellValue(row, col.key) }}
              </a>
              <span v-else>{{ cellValue(row, col.key) }}</span>
            </td>
            <td class="px-2 py-1.5 align-middle shrink-0" :class="trailingWidthClass" @click.stop>
              <ClientRowActions
                v-if="entry.trailingActions.length > 0"
                :actions="entry.trailingActions"
                :disabled="rowActionsDisabled"
                @action="onAction($event, row)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

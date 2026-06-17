<script setup lang="ts">
import { computed } from 'vue'
import type { ClientListRow, ClientRegistryEntry, ClientRowActionId, ClientTableColumn } from '@/core/types/client-registry'
import AppIcon from '@/components/AppIcon.vue'
import ClientRowActions from '@/components/clients/ClientRowActions.vue'

const props = defineProps<{
  entry: ClientRegistryEntry
  rows: ClientListRow[]
  page?: number
  pageSize?: number
  loading?: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  action: [id: ClientRowActionId, row: ClientListRow]
}>()

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
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-lg shadow-sm w-full min-w-0 max-w-full overflow-hidden">
    <div v-if="loading" class="p-8 text-center text-sm text-gray-500">Loading…</div>
    <div v-else-if="error" class="p-4 text-sm text-red-600">{{ error }}</div>
    <div v-else-if="rows.length === 0" class="p-8 text-center text-sm text-gray-500">
      No records found.
    </div>
    <div v-else class="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain">
      <table class="w-max min-w-full text-sm">
        <thead class="bg-slate-700 text-white">
          <tr>
            <th
              class="px-2 py-2 shrink-0 text-left text-xs font-semibold uppercase tracking-wide"
              :class="leadingWidthClass"
            >
              <span class="sr-only">Leading actions</span>
            </th>
            <th
              v-for="col in entry.columns"
              :key="col.key"
              class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
            >
              {{ col.label }}
            </th>
            <th
              class="px-2 py-2 shrink-0 text-left text-xs font-semibold uppercase tracking-wide"
              :class="trailingWidthClass"
            >
              <span class="sr-only">Trailing actions</span>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="(row, rowIdx) in rows" :key="row.id" class="hover:bg-gray-50/80">
            <td class="px-2 py-1.5 align-middle shrink-0" :class="leadingWidthClass">
              <ClientRowActions
                v-if="entry.leadingActions.length > 0"
                :actions="entry.leadingActions"
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
            <td class="px-2 py-1.5 align-middle shrink-0" :class="trailingWidthClass">
              <ClientRowActions
                v-if="entry.trailingActions.length > 0"
                :actions="entry.trailingActions"
                @action="onAction($event, row)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

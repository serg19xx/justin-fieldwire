import type { ClientRegistryKey, ClientTableColumn } from '@/core/types/client-registry'

export type ClientSortDirection = 'asc' | 'desc'

const DEFAULT_SORT: Record<
  ClientRegistryKey,
  { sortBy: string; sortDir: ClientSortDirection }
> = {
  pharma: { sortBy: 'operName', sortDir: 'asc' },
  physician: { sortBy: 'fullName', sortDir: 'asc' },
  pharmacist: { sortBy: 'fullName', sortDir: 'asc' },
  medical_clinic: { sortBy: 'clinicName', sortDir: 'asc' },
}

export function getDefaultClientSort(key: ClientRegistryKey) {
  return DEFAULT_SORT[key]
}

export function resolveColumnSortKey(col: Pick<ClientTableColumn, 'key' | 'sortKey'>): string {
  return col.sortKey ?? col.key
}

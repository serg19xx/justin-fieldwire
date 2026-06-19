import type { ClientListRow, ClientRegistryEntry } from '@/core/types/client-registry'

export interface ClientGeoExportFilters {
  country?: string
  region?: string
  city?: string
}

function slugPart(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48)
}

function buildExportFilename(entry: ClientRegistryEntry, geo?: ClientGeoExportFilters): string {
  const date = new Date().toISOString().slice(0, 10)
  const parts = [entry.key, date]
  if (geo?.country) parts.splice(1, 0, slugPart(geo.country))
  if (geo?.region) parts.splice(parts.length - 1, 0, slugPart(geo.region))
  if (geo?.city) parts.splice(parts.length - 1, 0, slugPart(geo.city))
  return `${parts.filter(Boolean).join('_')}.csv`
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function cellForExport(entry: ClientRegistryEntry, row: ClientListRow, colKey: string): string {
  const col = entry.columns.find((c) => c.key === colKey)
  if (col?.kind === 'rowIndex') {
    return ''
  }
  if (col?.kind === 'coordinates') {
    const latKey = col.latKey ?? 'lat'
    const lngKey = col.lngKey ?? 'lng'
    const lat = row[latKey]
    const lng = row[lngKey]
    if (latKey === lngKey && typeof lat === 'string' && lat.includes(',')) {
      return lat
    }
    if (lat != null && lng != null && lat !== '' && lng !== '') {
      return `${lat},${lng}`
    }
    return ''
  }
  const v = row[colKey]
  return v === null || v === undefined ? '' : String(v)
}

export function exportClientsCsv(
  entry: ClientRegistryEntry,
  rows: ClientListRow[],
  geo?: ClientGeoExportFilters,
): void {
  const exportColumns = entry.columns.filter((c) => c.kind !== 'map' && c.kind !== 'rowIndex')
  const header = exportColumns.map((c) => escapeCsv(c.label)).join(',')
  const lines = rows.map((row) =>
    exportColumns.map((c) => escapeCsv(cellForExport(entry, row, c.key))).join(','),
  )
  const csv = [header, ...lines].join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = buildExportFilename(entry, geo)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

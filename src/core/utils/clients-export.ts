import type { ClientListRow, ClientRegistryEntry } from '@/core/types/client-registry'

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

export function exportClientsCsv(entry: ClientRegistryEntry, rows: ClientListRow[]): void {
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
  link.download = `${entry.key}_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

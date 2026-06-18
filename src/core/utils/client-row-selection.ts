import type { ClientListRow } from '@/core/types/client-registry'

export function isClientRowSelected(selectedIds: number[], id: number): boolean {
  return selectedIds.includes(id)
}

export function isAllRowsOnPageSelected(rows: ClientListRow[], selectedIds: number[]): boolean {
  return rows.length > 0 && rows.every((row) => selectedIds.includes(row.id))
}

export function isSomeRowsOnPageSelected(rows: ClientListRow[], selectedIds: number[]): boolean {
  return rows.some((row) => selectedIds.includes(row.id))
}

function idsInIndexRange(rows: ClientListRow[], fromIndex: number, toIndex: number): number[] {
  const start = Math.min(fromIndex, toIndex)
  const end = Math.max(fromIndex, toIndex)
  const ids: number[] = []
  for (let i = start; i <= end; i += 1) {
    const row = rows[i]
    if (row) ids.push(row.id)
  }
  return ids
}

function mergeIds(selectedIds: number[], ids: number[]): number[] {
  const next = new Set(selectedIds)
  for (const id of ids) next.add(id)
  return [...next]
}

function toggleId(selectedIds: number[], id: number): number[] {
  if (selectedIds.includes(id)) {
    return selectedIds.filter((value) => value !== id)
  }
  return [...selectedIds, id]
}

export function toggleClientRowSelection(selectedIds: number[], id: number): number[] {
  return toggleId(selectedIds, id)
}

export interface ClientRowSelectionClick {
  rowId: number
  rowIndex: number
  shiftKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  anchorIndex: number | null
}

/**
 * Desktop-style row selection:
 * - plain click: single select (toggle off when clicking the only selected row)
 * - Ctrl/Cmd+click: toggle one row in the set (arbitrary gaps)
 * - Shift+click: contiguous range from anchor to current row
 * - Ctrl/Cmd+Shift+click: add range to existing selection
 */
export function applyClientRowSelectionClick(
  rows: ClientListRow[],
  selectedIds: number[],
  click: ClientRowSelectionClick,
): number[] {
  const { rowId, rowIndex, shiftKey, anchorIndex } = click
  const extendSelection = click.ctrlKey || click.metaKey

  if (shiftKey && anchorIndex !== null) {
    const rangeIds = idsInIndexRange(rows, anchorIndex, rowIndex)
    if (extendSelection) {
      return mergeIds(selectedIds, rangeIds)
    }
    return rangeIds
  }

  if (extendSelection) {
    return toggleId(selectedIds, rowId)
  }

  if (selectedIds.length === 1 && selectedIds[0] === rowId) {
    return []
  }

  return [rowId]
}

export function toggleSelectAllOnPage(rows: ClientListRow[], selectedIds: number[]): number[] {
  if (isAllRowsOnPageSelected(rows, selectedIds)) {
    const pageIds = new Set(rows.map((row) => row.id))
    return selectedIds.filter((id) => !pageIds.has(id))
  }
  return mergeIds(
    selectedIds,
    rows.map((row) => row.id),
  )
}

/** Contents of Space calculator catalog and helpers (sq/ft). */

export type ContentsOfSpaceCalcKey =
  | 'waiting_area'
  | 'dedicated_kids_area'
  | 'reception_area'
  | 'additional_waiting_bay'
  | 'nursing_room_office'
  | 'triage_room'
  | 'baby_area_room'
  | 'managers_office'
  | 'exam_rooms'
  | 'procedure_room'
  | 'doctor_lounge_office'
  | 'barrier_free_bathroom'
  | 'additional_patient_bathrooms'
  | 'staff_only_bathrooms'
  | 'storage_rooms'
  | 'staff_room'
  | 'kitchen'
  | 'boardroom'

export type ContentsOfSpaceSelectKey =
  | 'pharmacy'
  | 'specialists_office'
  | 'sports_medicine'
  | 'allied_health_providers'

export type ContentsOfSpaceKey = ContentsOfSpaceCalcKey | ContentsOfSpaceSelectKey

export interface ContentsOfSpaceCalcRowValue {
  key: ContentsOfSpaceCalcKey
  kind: 'calc'
  quantity: number
}

export interface ContentsOfSpaceSelectRowValue {
  key: ContentsOfSpaceSelectKey
  kind: 'select'
  value: number | null
}

export type ContentsOfSpaceRowValue = ContentsOfSpaceCalcRowValue | ContentsOfSpaceSelectRowValue

export interface ContentsOfSpaceData {
  rows: ContentsOfSpaceRowValue[]
}

export interface ContentsOfSpaceCalcDef {
  key: ContentsOfSpaceCalcKey
  label: string
  kind: 'calc'
  setSize: number
}

export interface ContentsOfSpaceSelectDef {
  key: ContentsOfSpaceSelectKey
  label: string
  kind: 'select'
  options: readonly number[]
}

export type ContentsOfSpaceCatalogEntry =
  | ContentsOfSpaceCalcDef
  | ContentsOfSpaceSelectDef
  | { kind: 'separator'; id: string }

const OFFICE_OPTIONS = [300, 400, 500, 600, 700, 800] as const
const LARGE_AREA_OPTIONS = [300, 400, 500, 600, 700, 800, 1000, 1200, 1500] as const

/**
 * Fixed catalog from client spreadsheet.
 * Set Size is constant (not editable). Separators are UI-only.
 * Note: Additional Waiting Bay set size was blank in the sample; using 24 (same as Waiting Area).
 */
export const CONTENTS_OF_SPACE_CATALOG: readonly ContentsOfSpaceCatalogEntry[] = [
  { key: 'waiting_area', label: 'Waiting Area', kind: 'calc', setSize: 24 },
  { key: 'dedicated_kids_area', label: 'Dedicated Kids Area', kind: 'calc', setSize: 50 },
  { key: 'reception_area', label: 'Reception Area', kind: 'calc', setSize: 16 },
  { key: 'additional_waiting_bay', label: 'Additional Waiting Bay', kind: 'calc', setSize: 24 },
  { kind: 'separator', id: 'sep_after_waiting' },
  { key: 'nursing_room_office', label: 'Nursing Room/Office', kind: 'calc', setSize: 80 },
  { key: 'triage_room', label: 'Triage Room', kind: 'calc', setSize: 80 },
  { key: 'baby_area_room', label: 'Baby Area/Room', kind: 'calc', setSize: 60 },
  { kind: 'separator', id: 'sep_after_clinical_support' },
  { key: 'managers_office', label: 'Managers Office', kind: 'calc', setSize: 80 },
  { kind: 'separator', id: 'sep_after_managers' },
  { key: 'exam_rooms', label: 'Exam Rooms', kind: 'calc', setSize: 88 },
  { key: 'procedure_room', label: 'Procedure Room', kind: 'calc', setSize: 168 },
  { kind: 'separator', id: 'sep_after_exam' },
  { key: 'doctor_lounge_office', label: 'Doctor Lounge/Office', kind: 'calc', setSize: 24 },
  { kind: 'separator', id: 'sep_after_doctor' },
  { key: 'barrier_free_bathroom', label: 'Barrier Free Bathroom', kind: 'calc', setSize: 80 },
  {
    key: 'additional_patient_bathrooms',
    label: 'Additional Patient Bathrooms',
    kind: 'calc',
    setSize: 32,
  },
  { key: 'staff_only_bathrooms', label: 'Staff Only Bathroom(s)', kind: 'calc', setSize: 32 },
  { kind: 'separator', id: 'sep_after_bathrooms' },
  { key: 'storage_rooms', label: 'Storage Room(s)', kind: 'calc', setSize: 6 },
  { kind: 'separator', id: 'sep_after_storage' },
  { key: 'staff_room', label: 'Staff Room', kind: 'calc', setSize: 150 },
  { key: 'kitchen', label: 'Kitchen', kind: 'calc', setSize: 100 },
  { key: 'boardroom', label: 'Boardroom', kind: 'calc', setSize: 200 },
  { kind: 'separator', id: 'sep_before_selects' },
  { key: 'pharmacy', label: 'Pharmacy', kind: 'select', options: OFFICE_OPTIONS },
  { key: 'specialists_office', label: 'Specialists Office', kind: 'select', options: OFFICE_OPTIONS },
  {
    key: 'sports_medicine',
    label: 'Sports Medicine',
    kind: 'select',
    options: LARGE_AREA_OPTIONS,
  },
  {
    key: 'allied_health_providers',
    label: 'Allied Health Providers',
    kind: 'select',
    options: LARGE_AREA_OPTIONS,
  },
]

export const CONTENTS_OF_SPACE_CALC_DEFS = CONTENTS_OF_SPACE_CATALOG.filter(
  (entry): entry is ContentsOfSpaceCalcDef => entry.kind === 'calc',
)

export const CONTENTS_OF_SPACE_SELECT_DEFS = CONTENTS_OF_SPACE_CATALOG.filter(
  (entry): entry is ContentsOfSpaceSelectDef => entry.kind === 'select',
)

const CALC_SET_SIZE_BY_KEY = Object.fromEntries(
  CONTENTS_OF_SPACE_CALC_DEFS.map((def) => [def.key, def.setSize]),
) as Record<ContentsOfSpaceCalcKey, number>

const SELECT_OPTIONS_BY_KEY = Object.fromEntries(
  CONTENTS_OF_SPACE_SELECT_DEFS.map((def) => [def.key, new Set(def.options)]),
) as Record<ContentsOfSpaceSelectKey, Set<number>>

export function createEmptyContentsOfSpace(): ContentsOfSpaceData {
  const rows: ContentsOfSpaceRowValue[] = [
    ...CONTENTS_OF_SPACE_CALC_DEFS.map(
      (def): ContentsOfSpaceCalcRowValue => ({
        key: def.key,
        kind: 'calc',
        quantity: 0,
      }),
    ),
    ...CONTENTS_OF_SPACE_SELECT_DEFS.map(
      (def): ContentsOfSpaceSelectRowValue => ({
        key: def.key,
        kind: 'select',
        value: null,
      }),
    ),
  ]
  return { rows }
}

function isCalcKey(key: string): key is ContentsOfSpaceCalcKey {
  return key in CALC_SET_SIZE_BY_KEY
}

function isSelectKey(key: string): key is ContentsOfSpaceSelectKey {
  return key in SELECT_OPTIONS_BY_KEY
}

function normalizeQuantity(raw: unknown): number {
  if (raw === null || raw === undefined || raw === '') {
    return 0
  }
  const n = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(n) || n < 0) {
    return 0
  }
  return Math.floor(n)
}

function normalizeSelectValue(key: ContentsOfSpaceSelectKey, raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') {
    return null
  }
  const n = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(n) || !SELECT_OPTIONS_BY_KEY[key].has(n)) {
    return null
  }
  return n
}

/** Normalize API/form payload into a complete ContentsOfSpaceData (zeros for missing). */
export function normalizeContentsOfSpace(input: unknown): ContentsOfSpaceData {
  const empty = createEmptyContentsOfSpace()
  if (input == null || input === '') {
    return empty
  }

  let rowsInput: unknown[] | null = null
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input) as unknown
      if (parsed && typeof parsed === 'object' && Array.isArray((parsed as ContentsOfSpaceData).rows)) {
        rowsInput = (parsed as ContentsOfSpaceData).rows
      }
    } catch {
      return empty
    }
  } else if (typeof input === 'object' && Array.isArray((input as ContentsOfSpaceData).rows)) {
    rowsInput = (input as ContentsOfSpaceData).rows
  }

  if (!rowsInput) {
    return empty
  }

  const quantityByKey = new Map<ContentsOfSpaceCalcKey, number>()
  const valueByKey = new Map<ContentsOfSpaceSelectKey, number | null>()

  for (const row of rowsInput) {
    if (!row || typeof row !== 'object') {
      continue
    }
    const key = (row as { key?: unknown }).key
    const kind = (row as { kind?: unknown }).kind
    if (typeof key !== 'string') {
      continue
    }
    if (kind === 'calc' && isCalcKey(key)) {
      quantityByKey.set(key, normalizeQuantity((row as { quantity?: unknown }).quantity))
    } else if (kind === 'select' && isSelectKey(key)) {
      valueByKey.set(key, normalizeSelectValue(key, (row as { value?: unknown }).value))
    }
  }

  return {
    rows: empty.rows.map((row) => {
      if (row.kind === 'calc') {
        return {
          ...row,
          quantity: quantityByKey.get(row.key) ?? 0,
        }
      }
      return {
        ...row,
        value: valueByKey.has(row.key) ? (valueByKey.get(row.key) ?? null) : null,
      }
    }),
  }
}

export function getCalcSetSize(key: ContentsOfSpaceCalcKey): number {
  return CALC_SET_SIZE_BY_KEY[key]
}

export function getRowTotal(row: ContentsOfSpaceRowValue): number {
  if (row.kind === 'calc') {
    return normalizeQuantity(row.quantity) * getCalcSetSize(row.key)
  }
  return row.value ?? 0
}

export function getContentsOfSpaceGrandTotal(data: ContentsOfSpaceData): number {
  return data.rows.reduce((sum, row) => sum + getRowTotal(row), 0)
}

/** Payload suitable for API (always complete, zeros / nulls). */
export function serializeContentsOfSpace(data: ContentsOfSpaceData | null | undefined): ContentsOfSpaceData {
  return normalizeContentsOfSpace(data ?? createEmptyContentsOfSpace())
}

/** Half-day or full-day visit slot for field schedule (TZ: field visits). */
export type VisitSlotPart = 'am' | 'pm' | 'full'

export interface VisitSlot {
  project_id: number | null
  note?: string
}

/** Assignments for one calendar day (local date string YYYY-MM-DD). */
export interface FieldDayAssignment {
  am?: VisitSlot | null
  pm?: VisitSlot | null
  full?: VisitSlot | null
}

export type FieldScheduleByDate = Record<string, FieldDayAssignment>

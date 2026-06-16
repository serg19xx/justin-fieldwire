export type CalendarEventScope = 'global' | 'project'

export interface CalendarEvent {
  id: number
  user_id: number
  project_id: number | null
  project_name: string | null
  title: string
  description: string | null
  location: string | null
  start_at: string
  end_at: string | null
  all_day: boolean
  requires_presence: boolean
  scope: CalendarEventScope
  editable: boolean
  created_at: string
  updated_at: string
}

export interface CalendarEventInput {
  title: string
  description?: string | null
  location?: string | null
  start_at: string
  end_at?: string | null
  all_day?: boolean
  requires_presence?: boolean
  /** Skip presence conflict check (user confirmed overlap). */
  force?: boolean
}

export interface CalendarAvailabilityConflict {
  id: number
  title: string
  location: string | null
  start_at: string
  end_at: string | null
  all_day: boolean
  project_id: number | null
  project_name: string | null
  scope: CalendarEventScope
}

export type UserCalendarMode = 'global' | 'project'

export interface CalendarSaveOptions {
  force?: boolean
}

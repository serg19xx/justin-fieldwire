import { api } from './api'
import type {
  CalendarAvailabilityConflict,
  CalendarEvent,
  CalendarEventInput,
} from '@/core/types/calendar-event'
import { isAxiosError } from 'axios'

function extractEvents(body: unknown): CalendarEvent[] {
  const root = body as { data?: { events?: CalendarEvent[] }; events?: CalendarEvent[] }
  const list = root?.data?.events ?? root?.events
  return Array.isArray(list) ? list : []
}

function extractEvent(body: unknown): CalendarEvent | null {
  const root = body as { data?: { event?: CalendarEvent }; event?: CalendarEvent }
  return root?.data?.event ?? root?.event ?? null
}

function extractConflicts(body: unknown): CalendarAvailabilityConflict[] {
  const root = body as { data?: { conflicts?: CalendarAvailabilityConflict[] } }
  const list = root?.data?.conflicts
  return Array.isArray(list) ? list : []
}

function rangeParams(from?: string, to?: string): string {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const q = params.toString()
  return q ? `?${q}` : ''
}

export class CalendarConflictError extends Error {
  conflicts: CalendarAvailabilityConflict[]

  constructor(conflicts: CalendarAvailabilityConflict[]) {
    super('Calendar time conflict')
    this.name = 'CalendarConflictError'
    this.conflicts = conflicts
  }
}

function wrapConflict(error: unknown): never {
  if (isAxiosError(error) && error.response?.status === 409) {
    const conflicts = extractConflicts(error.response.data)
    if (conflicts.length > 0) {
      throw new CalendarConflictError(conflicts)
    }
  }
  throw error
}

export const calendarApi = {
  async listGlobal(from?: string, to?: string): Promise<CalendarEvent[]> {
    const response = await api.get(`/api/v1/calendar/events${rangeParams(from, to)}`)
    return extractEvents(response.data)
  },

  async listForProject(projectId: number, from?: string, to?: string): Promise<CalendarEvent[]> {
    const response = await api.get(
      `/api/v1/projects/${projectId}/calendar/events${rangeParams(from, to)}`,
    )
    return extractEvents(response.data)
  },

  async checkAvailability(
    input: Pick<CalendarEventInput, 'start_at' | 'end_at' | 'all_day' | 'requires_presence'>,
    excludeEventId?: number,
  ): Promise<CalendarAvailabilityConflict[]> {
    const params = new URLSearchParams()
    params.set('start_at', input.start_at)
    if (input.end_at) params.set('end_at', input.end_at)
    if (input.all_day) params.set('all_day', '1')
    params.set('requires_presence', input.requires_presence ? '1' : '0')
    if (excludeEventId) params.set('exclude_event_id', String(excludeEventId))

    const response = await api.get(`/api/v1/calendar/availability?${params.toString()}`)
    return extractConflicts(response.data)
  },

  async createGlobal(data: CalendarEventInput): Promise<CalendarEvent> {
    try {
      const response = await api.post('/api/v1/calendar/events', data)
      const event = extractEvent(response.data)
      if (!event) throw new Error('Invalid create response')
      return event
    } catch (e) {
      wrapConflict(e)
    }
  },

  async createForProject(projectId: number, data: CalendarEventInput): Promise<CalendarEvent> {
    try {
      const response = await api.post(`/api/v1/projects/${projectId}/calendar/events`, data)
      const event = extractEvent(response.data)
      if (!event) throw new Error('Invalid create response')
      return event
    } catch (e) {
      wrapConflict(e)
    }
  },

  async updateGlobal(eventId: number, data: CalendarEventInput): Promise<CalendarEvent> {
    try {
      const response = await api.put(`/api/v1/calendar/events/${eventId}`, data)
      const event = extractEvent(response.data)
      if (!event) throw new Error('Invalid update response')
      return event
    } catch (e) {
      wrapConflict(e)
    }
  },

  async updateForProject(
    projectId: number,
    eventId: number,
    data: CalendarEventInput,
  ): Promise<CalendarEvent> {
    try {
      const response = await api.put(
        `/api/v1/projects/${projectId}/calendar/events/${eventId}`,
        data,
      )
      const event = extractEvent(response.data)
      if (!event) throw new Error('Invalid update response')
      return event
    } catch (e) {
      wrapConflict(e)
    }
  },

  async deleteGlobal(eventId: number): Promise<void> {
    await api.delete(`/api/v1/calendar/events/${eventId}`)
  },

  async deleteForProject(projectId: number, eventId: number): Promise<void> {
    await api.delete(`/api/v1/projects/${projectId}/calendar/events/${eventId}`)
  },
}

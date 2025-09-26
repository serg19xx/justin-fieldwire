// User types constants
export const USER_TYPES = [
  'System Administrator',
  'Architect',
  'Project Manager',
  'General Contractor',
  'Trade Contractor',
  'Client',
] as const

export type UserType = (typeof USER_TYPES)[number]

// User types for filtering (excluding System Administrator)
export const USER_TYPE_OPTIONS = USER_TYPES.filter((type) => type !== 'System Administrator')

// Project priorities
export const PROJECT_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const

export type ProjectPriority = (typeof PROJECT_PRIORITIES)[number]

// Project statuses
export const PROJECT_STATUSES = [
  'draft',
  'planning',
  'active',
  'on-hold',
  'completed',
  'cancelled',
] as const

export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

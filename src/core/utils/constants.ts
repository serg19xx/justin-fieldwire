// User types constants
export const USER_TYPES = [
  'admin',
  'architect',
  'project_manager',
  'general_contractor',
  'contractor',
  'client',
] as const

export type UserType = (typeof USER_TYPES)[number]

// User types for filtering (excluding admin)
export const USER_TYPE_OPTIONS = USER_TYPES.filter((type) => type !== 'admin')

// Project priorities
export const PROJECT_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const

export type ProjectPriority = (typeof PROJECT_PRIORITIES)[number]

// Project statuses
export const PROJECT_STATUSES = [
  'draft',
  'planning',
  'active',
  'completed',
  'cancelled',
] as const

export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

// Project purchase/lease types
export const PROJECT_PURCHASE_LEASE_TYPES = ['Purchase', 'Lease', 'Undecided'] as const

export type ProjectPurchaseLeaseType = (typeof PROJECT_PURCHASE_LEASE_TYPES)[number]

/** Clinic model type options for projects */
export const PROJECT_CLINIC_MODEL_TYPES = [
  'FFS Solo',
  'FHG',
  'FHO',
  'FHT',
  'Urgent Care FFS',
  'Walk In Clinic FFS',
  'Mix Family Practise & Walk In FFS',
  'Mix Family Practise & Walk In FHG',
  'Other',
  'Specialty Clinic',
] as const

export type ProjectClinicModelType = (typeof PROJECT_CLINIC_MODEL_TYPES)[number]

/** Healthcare services options for projects */
export const PROJECT_HEALTHCARE_SERVICES = [
  'Primary Care',
  'Pharmacy',
  'Allied Health',
  'Private Health Services',
  'Dental',
  'Womens Health',
  'Stem Cell',
  'Peptides',
  'PRP',
] as const

export type ProjectHealthcareService = (typeof PROJECT_HEALTHCARE_SERVICES)[number]

/** Long Term Family Medicine team size options */
export const PROJECT_LONG_TERM_FM_TEAM_SIZES = [
  'Solo',
  '1-3',
  '4-6',
  '7-10',
  '11-15',
] as const

export type ProjectLongTermFmTeamSize = (typeof PROJECT_LONG_TERM_FM_TEAM_SIZES)[number]

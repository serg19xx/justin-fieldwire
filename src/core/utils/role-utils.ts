/**
 * Utility functions for role formatting and display
 * 
 * This module provides a unified way to format and display user roles
 * across the entire application, handling different API response formats.
 */

/**
 * Role code to display name mapping based on fw_glob_roles table
 */
const ROLE_CODE_MAP: Record<string, string> = {
  'admin': 'Administrator',
  'project_manager': 'Project Manager',
  'architect': 'Architect',
  'foreman': 'Foreman',
  'worker': 'Worker',
  'doctor': 'Doctor',
  'pharmacist': 'Pharmacist',
  'contractor_access': 'Contractor',
}

/**
 * Labels for assignment rows: `fw_prj_team_members.role_in_project` (and similar).
 * These are NOT the same as `fw_glob_roles.code` — they describe participation on a task/project row
 * (e.g. lead vs brigade member vs guest), not the user's system-wide role.
 */
const PROJECT_ASSIGNMENT_ROLE_LABELS: Record<string, string> = {
  task_lead: 'Task lead',
  member: 'Team member',
  invited: 'Invited',
}

/** Display group names for fw_glob_roles.category, in the order they should be listed. */
export const ROLE_CATEGORY_LABELS: Record<string, string> = {
  global: 'Administration',
  project: 'Project office',
  task: 'Field staff',
  client: 'Client portal',
}

/** Assignment roles offered when adding people to a project team. */
export const TEAM_ASSIGNMENT_ROLE_OPTIONS = [
  { value: 'member', label: PROJECT_ASSIGNMENT_ROLE_LABELS.member },
  { value: 'task_lead', label: PROJECT_ASSIGNMENT_ROLE_LABELS.task_lead },
] as const

export type TeamAssignmentRole = (typeof TEAM_ASSIGNMENT_ROLE_OPTIONS)[number]['value']

/** Global roles (fw_glob_roles.code) that can be added to a project team. */
export const TEAM_ELIGIBLE_ROLE_CODES: readonly string[] = ['foreman', 'worker', 'architect']

export function isTeamEligibleRole(roleCode?: string | null): boolean {
  return TEAM_ELIGIBLE_ROLE_CODES.includes((roleCode || '').toLowerCase())
}

export function getDefaultTeamAssignmentRole(roleCode?: string | null): TeamAssignmentRole {
  return (roleCode || '').toLowerCase() === 'foreman' ? 'task_lead' : 'member'
}

/**
 * Human-readable label for `role_in_project` / `project_role` on team assignment rows.
 */
export function formatProjectAssignmentRole(role: string | undefined | null): string {
  if (!role) return ''
  const key = role.trim().toLowerCase()
  if (PROJECT_ASSIGNMENT_ROLE_LABELS[key]) {
    return PROJECT_ASSIGNMENT_ROLE_LABELS[key]
  }
  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Role id to display name (fw_glob_roles.id -> name) when API returns only role_id
 */
const ROLE_ID_TO_NAME: Record<number, string> = {
  9: 'Administrator',
  10: 'Project Manager',
  11: 'Architect',
  12: 'Foreman',
  13: 'Worker',
  16: 'Doctor',
  17: 'Pharmacist',
}

/**
 * Format role_code to readable name using predefined mapping
 * Falls back to formatted code if mapping not found
 */
export function formatRoleCode(roleCode: string | undefined | null): string {
  if (!roleCode) return 'Worker'
  
  // Use predefined mapping if available
  if (ROLE_CODE_MAP[roleCode]) {
    return ROLE_CODE_MAP[roleCode]
  }
  
  // Fallback: format code to readable name
  return roleCode
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Get display role from various API response formats
 * Priority:
 * 1. role_name (from API / fw_glob_roles.name - preferred for correct display)
 * 2. formatRoleCode(role_code)
 * 3. role.code -> formatRoleCode (from role object)
 * 4. role.name (from role object)
 * 5. role_id -> ROLE_ID_TO_NAME (when API returns only role_id)
 * 6. project_role (role in project context)
 * 7. role as string
 * 8. 'Worker' (default fallback)
 *
 * @param data - Object containing role information from API
 * @returns Formatted role name for display
 */
export function getDisplayRole(data: {
  role_id?: number | null
  role_name?: string | null
  role_code?: string | null
  project_role?: string | null
  role?: string | { name?: string; code?: string } | null
}): string {
  // Priority 1: role_name from API (matches fw_glob_roles.name - e.g. Foreman, Worker)
  if (data.role_name) {
    return data.role_name
  }

  // Priority 2: format role_code to readable name using predefined mapping
  if (data.role_code) {
    return formatRoleCode(data.role_code)
  }
  
  // Priority 3: role.code -> formatRoleCode (from role object)
  if (data.role && typeof data.role === 'object' && data.role.code) {
    return formatRoleCode(data.role.code)
  }
  
  // Priority 4: role.name (from role object)
  if (data.role && typeof data.role === 'object' && data.role.name) {
    return data.role.name
  }

  // Priority 5: role_id fallback when API returns only id (e.g. 12 -> Foreman)
  if (data.role_id != null && ROLE_ID_TO_NAME[data.role_id]) {
    return ROLE_ID_TO_NAME[data.role_id]
  }
  
  // Priority 6: project_role (assignment row: task_lead, member, invited — not fw_glob_roles)
  if (data.project_role) {
    return formatProjectAssignmentRole(data.project_role)
  }
  
  // Priority 7: role as string (if it's already a readable name)
  if (data.role && typeof data.role === 'string') {
    return data.role
  }
  
  // Default fallback
  return 'Worker'
}

/**
 * Get role code from various API response formats
 * Used for filtering and comparisons
 */
export function getRoleCode(data: {
  role_code?: string | null
  role?: string | { code?: string } | null
}): string | null {
  if (data.role_code) {
    return data.role_code
  }
  
  if (data.role && typeof data.role === 'object' && data.role.code) {
    return data.role.code
  }
  
  return null
}

export function isDoctorRole(roleCode?: string | null): boolean {
  return (roleCode || '').toLowerCase() === 'doctor'
}

export function isPharmacistRole(roleCode?: string | null): boolean {
  return (roleCode || '').toLowerCase() === 'pharmacist'
}

export function isClientRole(roleCode?: string | null): boolean {
  const code = (roleCode || '').toLowerCase()
  return code === 'doctor' || code === 'pharmacist'
}



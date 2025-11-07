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
  'contractor': 'Contractor',
  'inspector': 'Inspector',
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
 * 1. formatRoleCode(role_code) - use role_code with predefined mapping (preferred)
 * 2. role.code -> formatRoleCode (from role object)
 * 3. role_name (readable name from API - fallback if role_code not available)
 * 4. role.name (from role object)
 * 5. project_role (role in project context)
 * 6. role as string (if it's already a readable name)
 * 7. 'Worker' (default fallback)
 * 
 * @param data - Object containing role information from API
 * @returns Formatted role name for display
 */
export function getDisplayRole(data: {
  role_name?: string | null
  role_code?: string | null
  project_role?: string | null
  role?: string | { name?: string; code?: string } | null
}): string {
  // Priority 1: format role_code to readable name using predefined mapping (preferred)
  if (data.role_code) {
    return formatRoleCode(data.role_code)
  }
  
  // Priority 2: role.code -> formatRoleCode (from role object)
  if (data.role && typeof data.role === 'object' && data.role.code) {
    return formatRoleCode(data.role.code)
  }
  
  // Priority 3: role_name (direct readable name - fallback if role_code not available)
  if (data.role_name) {
    return data.role_name
  }
  
  // Priority 4: role.name (from role object)
  if (data.role && typeof data.role === 'object' && data.role.name) {
    return data.role.name
  }
  
  // Priority 5: project_role (role in project context)
  if (data.project_role) {
    return data.project_role
  }
  
  // Priority 6: role as string (if it's already a readable name)
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


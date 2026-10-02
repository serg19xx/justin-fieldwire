// Role definitions and permissions

/** Primary key in the global roles table when `code` is `foreman` (e.g. id 12 in fw_roles). */
export const FOREMAN_ROLE_DB_ID = 12

export interface Role {
  code: string
  name: string
  category: 'global' | 'project' | 'task' | 'client'
  permissions: string[]
}

export const ROLES: Record<string, Role> = {
  admin: {
    code: 'admin',
    name: 'Administrator',
    category: 'global',
    permissions: ['*'], // All permissions
  },
  project_manager: {
    code: 'project_manager',
    name: 'Project Manager',
    category: 'project',
    permissions: [
      'projects.create',
      'projects.edit',
      'projects.delete',
      'tasks.create',
      'tasks.edit',
    ],
  },
  architect: {
    code: 'architect',
    name: 'Architect',
    category: 'project',
    permissions: ['projects.view', 'projects.edit', 'tasks.view'],
  },
  foreman: {
    code: 'foreman',
    name: 'Foreman',
    category: 'task',
    permissions: ['tasks.view', 'tasks.update_progress', 'photos.upload'],
  },
  worker: {
    code: 'worker',
    name: 'Worker',
    category: 'task',
    permissions: ['tasks.view'],
  },
  doctor: {
    code: 'doctor',
    name: 'Doctor',
    category: 'client',
    permissions: [
      'projects.view',
      'tasks.view',
      'calendar.view',
      'photos.view',
      'reports.view',
      'plans.view',
    ],
  },
  pharmacist: {
    code: 'pharmacist',
    name: 'Pharmacist',
    category: 'client',
    permissions: [
      'projects.view',
      'marketplace.view',
      'calendar.view',
      'photos.view',
      'reports.view',
      'plans.view',
    ],
  },
}

export function getRolePermissions(roleCode: string): string[] {
  return ROLES[roleCode]?.permissions || []
}

export function hasPermission(userRole: string, permission: string): boolean {
  const permissions = getRolePermissions(userRole)
  return permissions.includes('*') || permissions.includes(permission)
}

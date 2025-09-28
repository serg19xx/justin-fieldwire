// Role definitions and permissions
export interface Role {
  code: string
  name: string
  category: 'global' | 'project' | 'task'
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
    permissions: ['tasks.view', 'tasks.edit', 'photos.upload'],
  },
  worker: {
    code: 'worker',
    name: 'Worker',
    category: 'task',
    permissions: ['tasks.view', 'photos.upload'],
  },
  contractor: {
    code: 'contractor',
    name: 'Contractor',
    category: 'task',
    permissions: ['tasks.view'],
  },
  inspector: {
    code: 'inspector',
    name: 'Inspector',
    category: 'task',
    permissions: ['tasks.view', 'tasks.approve'],
  },
}

export function getRolePermissions(roleCode: string): string[] {
  return ROLES[roleCode]?.permissions || []
}

export function hasPermission(userRole: string, permission: string): boolean {
  const permissions = getRolePermissions(userRole)
  return permissions.includes('*') || permissions.includes(permission)
}

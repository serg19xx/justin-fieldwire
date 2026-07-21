import type { User } from '@/core/stores/auth'

export interface SystemNavItem {
  label: string
  route: string
  /** Route prefixes that mark this item active */
  matchPrefixes: string[]
  roles: Array<'admin' | 'project_manager'>
}

export const SYSTEM_NAV_ITEMS: SystemNavItem[] = [
  {
    label: 'Reports',
    route: '/reports',
    matchPrefixes: ['/reports'],
    roles: ['admin', 'project_manager'],
  },
  {
    label: 'Event log',
    route: '/event-log',
    matchPrefixes: ['/event-log'],
    roles: ['admin', 'project_manager'],
  },
  {
    label: 'Task templates',
    route: '/task-templates',
    matchPrefixes: ['/task-templates'],
    roles: ['admin', 'project_manager'],
  },
  {
    label: 'Admin settings',
    route: '/admin-settings',
    matchPrefixes: ['/admin-settings'],
    roles: ['admin', 'project_manager'],
  },
]

export const SYSTEM_NAV_ROUTE_PREFIXES = SYSTEM_NAV_ITEMS.flatMap((item) => item.matchPrefixes)

export function getSystemNavItemsForUser(user: User | null): SystemNavItem[] {
  const roleCode = (user?.role_code || '').toLowerCase()
  if (roleCode !== 'admin' && roleCode !== 'project_manager') {
    return []
  }
  return SYSTEM_NAV_ITEMS.filter((item) =>
    item.roles.includes(roleCode as 'admin' | 'project_manager'),
  )
}

export function canAccessSystemNav(user: User | null): boolean {
  return getSystemNavItemsForUser(user).length > 0
}

export function isSystemNavRoute(path: string): boolean {
  return SYSTEM_NAV_ROUTE_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  )
}

export function getActiveSystemNavItem(path: string, items: SystemNavItem[]): SystemNavItem | undefined {
  return items.find((item) =>
    item.matchPrefixes.some(
      (prefix) => path === prefix || path.startsWith(`${prefix}/`),
    ),
  )
}

// Menu configuration based on user category and role
import { CATEGORIES } from './categories'

export interface MenuItem {
  label: string
  route: string
  icon?: string
  children?: MenuItem[]
  requiresRole?: string
  requiresPermission?: string
}

export const MENU_CONFIG: Record<string, MenuItem[]> = {
  global: [
    {
      label: 'Dashboard',
      route: '/dashboard',
      icon: 'dashboard',
    },
    {
      label: 'Projects',
      route: '/projects',
      icon: 'folder',
    },
    {
      label: 'Builders',
      route: '/people',
      icon: 'users',
    },
    {
      label: 'Reports',
      route: '/reports',
      icon: 'chart',
    },
  ],
  project: [
    {
      label: 'Dashboard',
      route: '/dashboard',
      icon: 'dashboard',
    },
    {
      label: 'My Projects',
      route: '/projects',
      icon: 'folder',
    },
    {
      label: 'Team',
      route: '/team',
      icon: 'users',
    },
    {
      label: 'Reports',
      route: '/reports',
      icon: 'chart',
    },
  ],
  task: [
    {
      label: 'Dashboard',
      route: '/dashboard',
      icon: 'dashboard',
    },
    {
      label: 'My Tasks',
      route: '/tasks',
      icon: 'checklist',
    },
    {
      label: 'Calendar',
      route: '/calendar',
      icon: 'calendar',
    },
    {
      label: 'Photos',
      route: '/photos',
      icon: 'camera',
    },
  ],
}

export function getMenuForCategory(category: string): MenuItem[] {
  return MENU_CONFIG[category] || []
}

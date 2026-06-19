// Menu configuration based on user category and role
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
      label: 'Clients',
      route: '/clients/pharma',
      icon: 'contacts',
      children: [
        { label: 'Pharmacies', route: '/clients/pharma' },
        { label: 'Physicians & Providers', route: '/clients/physician' },
        { label: 'Pharmacists', route: '/clients/pharmacist' },
        { label: 'Medical clinics', route: '/clients/medical_clinic' },
      ],
    },
    {
      label: 'Reports',
      route: '/reports',
      icon: 'chart',
    },
    {
      label: 'Calendar',
      route: '/calendar',
      icon: 'calendar',
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
      label: 'Clients',
      route: '/clients/pharma',
      icon: 'contacts',
      children: [
        { label: 'Pharmacies', route: '/clients/pharma' },
        { label: 'Physicians & Providers', route: '/clients/physician' },
        { label: 'Pharmacists', route: '/clients/pharmacist' },
        { label: 'Medical clinics', route: '/clients/medical_clinic' },
      ],
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
    {
      label: 'Calendar',
      route: '/calendar',
      icon: 'calendar',
    },
  ],
  task: [
    {
      label: 'Dashboard',
      route: '/dashboard',
      icon: 'dashboard',
    },
    {
      label: 'Schedule',
      route: '/tasks/schedule',
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

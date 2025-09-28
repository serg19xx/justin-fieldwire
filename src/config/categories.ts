// User categories and their characteristics
export interface Category {
  name: string
  layout: string
  defaultRoute: string
  description: string
}

export const CATEGORIES: Record<string, Category> = {
  global: {
    name: 'Global',
    layout: 'GlobalLayout',
    defaultRoute: '/dashboard',
    description: 'System administrators and organization managers',
  },
  project: {
    name: 'Project',
    layout: 'ProjectLayout',
    defaultRoute: '/projects',
    description: 'Project managers and architects',
  },
  task: {
    name: 'Task',
    layout: 'TaskLayout',
    defaultRoute: '/tasks',
    description: 'Workers, foremen, and field staff',
  },
}

export function getCategoryInfo(category: string): Category | null {
  return CATEGORIES[category] || null
}

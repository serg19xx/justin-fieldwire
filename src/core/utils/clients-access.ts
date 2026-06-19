/** Roles allowed to open the global Clients registry (list / CRUD). */
export function canAccessClientsRegistry(roleCode?: string | null): boolean {
  return roleCode === 'admin' || roleCode === 'project_manager'
}

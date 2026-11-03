/**
 * Resolve accountable foreman for field-work audit display.
 * Task override wins when it differs from the project foreman.
 */
export function resolveAccountableForemanId(
  projectForemanId: number | null | undefined,
  taskLeadId: number | null | undefined,
): number | null {
  const projectId = projectForemanId != null && Number(projectForemanId) > 0 ? Number(projectForemanId) : null
  const taskId = taskLeadId != null && Number(taskLeadId) > 0 ? Number(taskLeadId) : null

  if (taskId != null && projectId != null && taskId !== projectId) {
    return taskId
  }
  if (taskId != null) return taskId
  return projectId
}

export function resolveDefaultTaskForemanId(
  project: { project_foreman_id?: number | null } | null | undefined,
): number | null {
  const id = project?.project_foreman_id
  if (id == null) return null
  const n = Number(id)
  return Number.isFinite(n) && n > 0 ? n : null
}

/** Label for a task without a lead: the project manager stays responsible until someone is picked. */
export function formatUnassignedTaskLeadLabel(managerName: string | null | undefined): string {
  const name = (managerName || '').trim()
  return name ? `Unassigned — ${name} (Project Manager)` : 'Unassigned — Project Manager'
}

/** Dropdown label for a selectable person; people already on overlapping tasks stay selectable but marked. */
export function formatPersonOption(person: { name: string; role: string; busyWith?: string[] }): string {
  const base = `${person.name} (${person.role})`
  const busy = person.busyWith ?? []
  if (busy.length === 0) return base
  const extra = busy.length > 1 ? ` +${busy.length - 1}` : ''
  return `${base} — busy: ${busy[0]}${extra}`
}

export function isTaskForemanOverridden(
  projectForemanId: number | null | undefined,
  taskLeadId: number | null | undefined,
): boolean {
  const projectId = projectForemanId != null && Number(projectForemanId) > 0 ? Number(projectForemanId) : null
  const taskId = taskLeadId != null && Number(taskLeadId) > 0 ? Number(taskLeadId) : null
  return projectId != null && taskId != null && taskId !== projectId
}

export function buildFieldWorkInitiatorMeta(
  projectForemanId: number | null | undefined,
  taskLeadId: number | null | undefined,
  initiatedByUserId: number,
) {
  const accountableForemanId = resolveAccountableForemanId(projectForemanId, taskLeadId)
  const onBehalfOfForeman =
    accountableForemanId != null && initiatedByUserId !== accountableForemanId
  return { accountableForemanId, initiatedByUserId, onBehalfOfForeman }
}

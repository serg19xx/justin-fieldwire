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

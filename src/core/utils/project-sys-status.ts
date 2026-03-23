import type { Project } from '@/core/utils/project-api'

/**
 * System lifecycle for a project (DB/API field `sys_status`).
 * Separate from client-facing `status` (sales funnel labels).
 *
 * Short codes:
 * - draft — not started / planning
 * - active — work in progress
 * - closing — wrap-up / handover
 * - suspended — on hold / paused
 * - done — finished (archived in task UI)
 */
export type ProjectSysStatus = 'draft' | 'active' | 'closing' | 'suspended' | 'done'

export const DEFAULT_PROJECT_SYS_STATUS: ProjectSysStatus = 'draft'

export const PROJECT_SYS_STATUS_VALUES: readonly ProjectSysStatus[] = [
  'draft',
  'active',
  'closing',
  'suspended',
  'done',
] as const

/** UI labels (English) */
export const PROJECT_SYS_STATUS_LABELS: Record<ProjectSysStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  closing: 'Closing',
  suspended: 'Suspended',
  done: 'Done',
}

export interface ProjectSysStatusOption {
  value: ProjectSysStatus
  label: string
}

export const PROJECT_SYS_STATUS_OPTIONS: ProjectSysStatusOption[] = PROJECT_SYS_STATUS_VALUES.map(
  (value) => ({ value, label: PROJECT_SYS_STATUS_LABELS[value] }),
)

/**
 * Normalize raw API/DB values: "Draft", "ACTIVE", "closing_out" → canonical code.
 */
export function coerceProjectSysStatus(v: string | null | undefined): ProjectSysStatus | null {
  if (v == null) return null
  const raw = String(v).trim()
  if (!raw) return null
  const normalized = raw.toLowerCase().replace(/\s+/g, '').replace(/_/g, '')

  if ((PROJECT_SYS_STATUS_VALUES as readonly string[]).includes(normalized)) {
    return normalized as ProjectSysStatus
  }

  const aliases: Record<string, ProjectSysStatus> = {
    planned: 'draft',
    inprogress: 'active',
    underway: 'active',
    closingout: 'closing',
  }
  return aliases[normalized] ?? null
}

export function isValidProjectSysStatus(v: string | null | undefined): boolean {
  return coerceProjectSysStatus(v) != null
}

/**
 * Effective lifecycle for permissions, task UI, and PM tables.
 * Client funnel `status` is not used — it is informational only.
 * If `sys_status` is null/empty or unknown, treat as {@link DEFAULT_PROJECT_SYS_STATUS} (draft).
 */
export function resolveProjectSysStatus(project: Pick<Project, 'sys_status'>): ProjectSysStatus {
  const fromStored = coerceProjectSysStatus(project.sys_status)
  if (fromStored != null) return fromStored
  return DEFAULT_PROJECT_SYS_STATUS
}

export function isProjectSysStatusDone(project: Pick<Project, 'sys_status'>): boolean {
  return resolveProjectSysStatus(project) === 'done'
}

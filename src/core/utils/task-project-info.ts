/** Read-only project information pages available to the field foreman. */
export type ProjectInfoSection = 'plans' | 'reports' | 'team'

export interface ProjectInfoSectionMeta {
  section: ProjectInfoSection
  label: string
}

export const PROJECT_INFO_SECTIONS: readonly ProjectInfoSectionMeta[] = [
  { section: 'plans', label: 'Plans' },
  { section: 'reports', label: 'Reports' },
  { section: 'team', label: 'Team' },
]

export function isProjectInfoSection(value: unknown): value is ProjectInfoSection {
  return PROJECT_INFO_SECTIONS.some((s) => s.section === value)
}

/** Default sample values for message template preview (UPPERCASE keys). */
export const DEFAULT_TEMPLATE_SAMPLE_DATA: Record<string, string> = {
  PROJECT_NAME: 'Office Renovation',
  TASK_NAME: 'Install Windows',
  ASSIGNEE_NAME: 'John Smith',
  DUE_DATE: '2026-01-15',
  CREATED_BY: 'Jane Doe',
  COMPLETED_DATE: '2026-01-14',
  COMPLETED_BY: 'John Smith',
  PROJECT_MANAGER: 'Mike Johnson',
  START_DATE: '2026-01-01',
  END_DATE: '2026-03-31',
  DAYS_REMAINING: '3',
  STATUS: 'In Progress',
  EVENT_LABEL: 'Task updated',
  URL: 'https://example.com/projects/1',
  USER_NAME: 'Alex User',
  USER_EMAIL: 'alex@example.com',
  DELETED_BY: 'Admin',
  PUBLISHED_BY: 'Admin',
  REGISTRATION_DATE: '2026-01-10',
}

/**
 * Build sample data for preview: prefer user/template overrides, else defaults.
 */
export function buildTemplateSampleData(
  keys: string[],
  overrides?: Record<string, string> | null,
): Record<string, string> {
  const result: Record<string, string> = {}
  for (const rawKey of keys) {
    const key = rawKey.trim()
    if (!key) continue
    const upper = key.toUpperCase()
    const override = (overrides?.[key] ?? overrides?.[upper] ?? '').trim()
    if (override !== '') {
      result[upper] = override
    } else {
      result[upper] = DEFAULT_TEMPLATE_SAMPLE_DATA[upper] ?? `[${upper}]`
    }
  }
  return result
}

/** Replace {{VAR}} / {{ VAR }} placeholders with sample values. */
export function renderTemplateString(
  text: string,
  sampleData: Record<string, string>,
): string {
  if (!text) return ''
  return text.replace(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g, (_match, key: string) => {
    const upper = String(key).toUpperCase()
    if (Object.prototype.hasOwnProperty.call(sampleData, upper)) {
      return sampleData[upper]
    }
    if (Object.prototype.hasOwnProperty.call(sampleData, key)) {
      return sampleData[key]
    }
    return `{{${key}}}`
  })
}

/** Extract unique variable keys from template body/subject. */
export function extractTemplateVariableKeys(...texts: Array<string | null | undefined>): string[] {
  const keys: string[] = []
  const seen = new Set<string>()
  const regex = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g
  for (const text of texts) {
    if (!text) continue
    let match: RegExpExecArray | null
    const local = new RegExp(regex.source, 'g')
    while ((match = local.exec(text)) !== null) {
      const key = match[1].toUpperCase()
      if (seen.has(key)) continue
      seen.add(key)
      keys.push(key)
    }
  }
  return keys
}

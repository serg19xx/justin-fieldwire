/** PM-set task priority, stored by the API as a lower-case code. */
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low'

interface TaskPriorityMeta {
  label: string
  rank: number
  badgeClass: string
}

export const TASK_PRIORITY_META: Record<TaskPriority, TaskPriorityMeta> = {
  urgent: { label: 'Urgent', rank: 0, badgeClass: 'bg-red-100 text-red-800 border-red-200' },
  high: { label: 'High', rank: 1, badgeClass: 'bg-orange-100 text-orange-800 border-orange-200' },
  medium: { label: 'Medium', rank: 2, badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  low: { label: 'Low', rank: 3, badgeClass: 'bg-gray-100 text-gray-700 border-gray-200' },
}

export const TASK_PRIORITY_OPTIONS = (Object.keys(TASK_PRIORITY_META) as TaskPriority[]).map((value) => ({
  value,
  label: TASK_PRIORITY_META[value].label,
}))

/** Tasks without a priority sort after Low. */
const UNSET_PRIORITY_RANK = Object.keys(TASK_PRIORITY_META).length

export function normalizeTaskPriority(raw: unknown): TaskPriority | null {
  if (typeof raw !== 'string') return null
  const key = raw.trim().toLowerCase()
  return key in TASK_PRIORITY_META ? (key as TaskPriority) : null
}

export function taskPriorityRank(raw: unknown): number {
  const priority = normalizeTaskPriority(raw)
  return priority ? TASK_PRIORITY_META[priority].rank : UNSET_PRIORITY_RANK
}

export function taskPriorityLabel(raw: unknown): string {
  const priority = normalizeTaskPriority(raw)
  return priority ? TASK_PRIORITY_META[priority].label : ''
}

export function taskPriorityBadgeClass(raw: unknown): string {
  const priority = normalizeTaskPriority(raw)
  return priority ? TASK_PRIORITY_META[priority].badgeClass : ''
}

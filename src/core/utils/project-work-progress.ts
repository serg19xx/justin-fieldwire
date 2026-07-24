import type { Task } from '@/core/types/task'
import { isMilestone } from '@/core/types/task'

/** Assumed hours in one planned work day when converting days ↔ hours (no clock hours on tasks yet). */
export const ASSUMED_HOURS_PER_WORK_DAY = 8

/** Customer rule: earliest completion uses a 22 work-day month. */
export const WORK_DAYS_PER_MONTH = 22

export interface ProjectWorkProgressStats {
  totalTasks: number
  completedTasks: number
  outstandingTasks: number
  /** Sum of planned duration (days) across counted tasks */
  totalWorkDays: number
  completedWorkDays: number
  remainingWorkDays: number
  totalWorkHours: number
  completedWorkHours: number
  remainingWorkHours: number
  /** 0–100, based on work days (falls back to task count if no durations) */
  percentComplete: number
  /** null when remaining work is 0 or unknown */
  earliestCompletionDate: string | null
  earliestCompletionLabel: string
  usedDurationFallback: boolean
}

function parseYmd(raw: string | undefined | null): Date | null {
  if (!raw) return null
  const s = String(raw).slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const d = new Date(`${s}T12:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

function inclusiveDaySpan(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime()
  if (!Number.isFinite(ms) || ms < 0) return 0
  return Math.floor(ms / (24 * 60 * 60 * 1000)) + 1
}

/** Planned duration in days for one task (duration_days, else date span, else 1). */
export function taskPlannedWorkDays(task: Task): { days: number; fromDates: boolean } {
  if (typeof task.duration_days === 'number' && Number.isFinite(task.duration_days) && task.duration_days > 0) {
    return { days: task.duration_days, fromDates: false }
  }
  const start = parseYmd(task.start_planned)
  const end = parseYmd(task.end_planned ?? undefined)
  if (start && end) {
    return { days: Math.max(1, inclusiveDaySpan(start, end)), fromDates: true }
  }
  return { days: 1, fromDates: true }
}

function isTaskCompleted(task: Task): boolean {
  const status = String(task.status || '')
    .toLowerCase()
    .replace(/-/g, '_')
  if (status === 'completed' || status === 'done') return true
  return (task.progress_pct ?? 0) >= 100
}

function taskProgressFraction(task: Task): number {
  if (isTaskCompleted(task)) return 1
  const p = Number(task.progress_pct)
  if (!Number.isFinite(p) || p <= 0) return 0
  return Math.min(1, Math.max(0, p / 100))
}

/**
 * Earliest completion: remaining work days at WORK_DAYS_PER_MONTH pace from `from`.
 * Spreads remaining days across calendar months (22 work days ≈ one month).
 */
export function earliestCompletionFromRemainingDays(
  remainingWorkDays: number,
  from: Date = new Date(),
  workDaysPerMonth: number = WORK_DAYS_PER_MONTH,
): Date | null {
  if (!Number.isFinite(remainingWorkDays) || remainingWorkDays <= 0) return null
  const months = remainingWorkDays / workDaysPerMonth
  const whole = Math.floor(months)
  const frac = months - whole
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 12, 0, 0, 0)
  d.setMonth(d.getMonth() + whole)
  // Fractional month → approximate calendar days (~30.44)
  d.setDate(d.getDate() + Math.ceil(frac * 30.44))
  return d
}

function formatYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDisplayDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Project work progress for dashboard (Tasks = source of truth).
 * Milestones are excluded from duration totals (1-day markers, not crew work).
 */
export function computeProjectWorkProgress(tasks: Task[]): ProjectWorkProgressStats {
  const workTasks = tasks.filter((t) => !isMilestone(t.milestone))
  let usedDurationFallback = false
  let totalWorkDays = 0
  let completedWorkDays = 0

  for (const t of workTasks) {
    const { days, fromDates } = taskPlannedWorkDays(t)
    if (fromDates && !(typeof t.duration_days === 'number' && t.duration_days > 0)) {
      usedDurationFallback = true
    }
    totalWorkDays += days
    completedWorkDays += days * taskProgressFraction(t)
  }

  const remainingWorkDays = Math.max(0, totalWorkDays - completedWorkDays)
  const completedTasks = workTasks.filter(isTaskCompleted).length
  const totalTasks = workTasks.length
  const outstandingTasks = Math.max(0, totalTasks - completedTasks)

  let percentComplete = 0
  if (totalWorkDays > 0) {
    percentComplete = Math.round((completedWorkDays / totalWorkDays) * 1000) / 10
  } else if (totalTasks > 0) {
    percentComplete = Math.round((completedTasks / totalTasks) * 1000) / 10
  }

  const earliest =
    remainingWorkDays > 0 ? earliestCompletionFromRemainingDays(remainingWorkDays) : null

  return {
    totalTasks,
    completedTasks,
    outstandingTasks,
    totalWorkDays: round1(totalWorkDays),
    completedWorkDays: round1(completedWorkDays),
    remainingWorkDays: round1(remainingWorkDays),
    totalWorkHours: round1(totalWorkDays * ASSUMED_HOURS_PER_WORK_DAY),
    completedWorkHours: round1(completedWorkDays * ASSUMED_HOURS_PER_WORK_DAY),
    remainingWorkHours: round1(remainingWorkDays * ASSUMED_HOURS_PER_WORK_DAY),
    percentComplete,
    earliestCompletionDate: earliest ? formatYmd(earliest) : null,
    earliestCompletionLabel: earliest
      ? formatDisplayDate(earliest)
      : remainingWorkDays <= 0 && totalTasks > 0
        ? 'Complete (no remaining work)'
        : '—',
    usedDurationFallback,
  }
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

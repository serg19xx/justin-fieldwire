import type { Project } from '@/core/utils/project-api'
import { projectApi } from '@/core/utils/project-api'
import {
  getProjectListQueryFiltersForUser,
  parseProjectsFromListResponse,
} from '@/core/utils/project-list-for-user'
import { tasksApi } from '@/core/utils/tasks-api'
import type { Task } from '@/core/types/task'
import type { User } from '@/core/stores/auth'
import {
  ASSUMED_HOURS_PER_WORK_DAY,
  computeProjectWorkProgress,
  earliestCompletionFromRemainingDays,
  type ProjectWorkProgressStats,
} from '@/core/utils/project-work-progress'

export interface ProjectPortfolioRow {
  projectId: number
  projectName: string
  address: string
  sysStatus: string
  stats: ProjectWorkProgressStats
  tasks: Task[]
  loadError: string | null
}

export interface PortfolioWorkSnapshot {
  loadedAt: string
  projects: ProjectPortfolioRow[]
  totals: ProjectWorkProgressStats
}

const MAX_CONCURRENCY = 4

function projectLabel(p: Project): string {
  return p.prj_name || `Project #${p.id}`
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

async function mapPool<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  async function worker(): Promise<void> {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i]!)
    }
  }
  const n = Math.min(concurrency, Math.max(1, items.length))
  await Promise.all(Array.from({ length: n }, () => worker()))
  return results
}

function emptyTotals(): ProjectWorkProgressStats {
  return computeProjectWorkProgress([])
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

function sumStats(rows: ProjectPortfolioRow[]): ProjectWorkProgressStats {
  const ok = rows.filter((r) => !r.loadError)
  let totalTasks = 0
  let completedTasks = 0
  let outstandingTasks = 0
  let totalWorkDays = 0
  let completedWorkDays = 0
  let remainingWorkDays = 0
  let usedDurationFallback = false

  for (const r of ok) {
    const s = r.stats
    totalTasks += s.totalTasks
    completedTasks += s.completedTasks
    outstandingTasks += s.outstandingTasks
    totalWorkDays += s.totalWorkDays
    completedWorkDays += s.completedWorkDays
    remainingWorkDays += s.remainingWorkDays
    usedDurationFallback = usedDurationFallback || s.usedDurationFallback
  }

  const percentComplete =
    totalWorkDays > 0
      ? round1((completedWorkDays / totalWorkDays) * 100)
      : totalTasks > 0
        ? round1((completedTasks / totalTasks) * 100)
        : 0

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
      : totalTasks > 0 && remainingWorkDays <= 0
        ? 'Complete (no remaining work)'
        : '—',
    usedDurationFallback,
  }
}

/**
 * Live portfolio snapshot: all accessible projects + task work progress.
 * Nothing is persisted — call on each dashboard open / refresh.
 */
export async function loadPortfolioWorkSnapshot(user: User | null): Promise<PortfolioWorkSnapshot> {
  const filters = getProjectListQueryFiltersForUser(user)
  const data = await projectApi.getAll(1, 200, filters)
  const projects = parseProjectsFromListResponse(data)

  const rows = await mapPool(projects, MAX_CONCURRENCY, async (p): Promise<ProjectPortfolioRow> => {
    try {
      const res = await tasksApi.getAll(p.id, 1, 500)
      const tasks = res.tasks || []
      return {
        projectId: p.id,
        projectName: projectLabel(p),
        address: (p.address || '').trim(),
        sysStatus: String(p.sys_status || p.status || ''),
        stats: computeProjectWorkProgress(tasks),
        tasks,
        loadError: null,
      }
    } catch (e) {
      console.error('Portfolio: failed to load tasks for project', p.id, e)
      return {
        projectId: p.id,
        projectName: projectLabel(p),
        address: (p.address || '').trim(),
        sysStatus: String(p.sys_status || p.status || ''),
        stats: emptyTotals(),
        tasks: [],
        loadError: 'Failed to load tasks',
      }
    }
  })

  return {
    loadedAt: new Date().toISOString(),
    projects: rows,
    totals: sumStats(rows),
  }
}

export function filterPortfolioRows(
  rows: ProjectPortfolioRow[],
  opts: { projectIds?: number[]; sysStatus?: string },
): ProjectPortfolioRow[] {
  let out = rows
  if (opts.projectIds && opts.projectIds.length > 0) {
    const set = new Set(opts.projectIds)
    out = out.filter((r) => set.has(r.projectId))
  }
  if (opts.sysStatus && opts.sysStatus !== 'all') {
    const want = opts.sysStatus.toLowerCase()
    out = out.filter((r) => r.sysStatus.toLowerCase() === want)
  }
  return out
}

export function aggregateFilteredRows(rows: ProjectPortfolioRow[]): ProjectWorkProgressStats {
  return sumStats(rows)
}

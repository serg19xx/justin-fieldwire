import type { Task, TaskCreateUpdate } from '@/core/types/task'

export interface DependencyConstraint {
  taskId: string
  predecessorId: string
  type: 'FS' | 'SS' | 'FF' | 'SF'
  lagDays: number
  predecessorName: string
  predecessorEndDate?: string
  predecessorStartDate?: string
}

export interface DependencyValidationResult {
  isValid: boolean
  violatedConstraints: DependencyConstraint[]
  suggestedStartDate?: string
  suggestedEndDate?: string
  reason: string
}

/**
 * Check if a task's dates respect all its dependency constraints
 */
export function checkDependencyConstraints(
  taskData: TaskCreateUpdate,
  allTasks: Task[],
): DependencyValidationResult {
  const result: DependencyValidationResult = {
    isValid: true,
    violatedConstraints: [],
    reason: '',
  }

  // If no dependencies, task is valid
  if (!taskData.dependencies || taskData.dependencies.length === 0) {
    return result
  }

  const taskStartDate = taskData.startPlanned
  const taskEndDate = taskData.endPlanned

  if (!taskStartDate || !taskEndDate) {
    result.isValid = false
    result.reason = 'Task must have both start and end dates to validate dependencies'
    return result
  }

  // Process each dependency
  for (const dep of taskData.dependencies) {
    let predecessorId: string
    let depType: 'FS' | 'SS' | 'FF' | 'SF' = 'FS'
    let lagDays = 0

    // Handle both legacy (number) and new (object) dependency formats
    if (typeof dep === 'number') {
      predecessorId = String(dep)
    } else {
      predecessorId = String(dep.predecessor_id)
      depType = dep.type as 'FS' | 'SS' | 'FF' | 'SF'
      lagDays = dep.lag_days || 0
    }

    // Find predecessor task
    const predecessor = allTasks.find((t) => String(t.id) === predecessorId)
    if (!predecessor) {
      console.warn(`Predecessor task ${predecessorId} not found`)
      continue
    }

    if (!predecessor.start_planned || !predecessor.end_planned) {
      console.warn(`Predecessor task ${predecessorId} missing dates`)
      continue
    }

    // Calculate constraint violation
    const constraint: DependencyConstraint = {
      taskId: String(taskData.id || 'new'),
      predecessorId,
      type: depType,
      lagDays,
      predecessorName: predecessor.name,
      predecessorStartDate: predecessor.start_planned,
      predecessorEndDate: predecessor.end_planned,
    }

    const isViolated = checkSingleDependencyConstraint(
      taskStartDate,
      taskEndDate,
      predecessor.start_planned,
      predecessor.end_planned,
      depType,
      lagDays,
    )

    if (isViolated) {
      result.violatedConstraints.push(constraint)
      result.isValid = false
    }
  }

  // Generate reason and suggestions
  if (!result.isValid) {
    result.reason = generateViolationReason(result.violatedConstraints)
    const suggestions = calculateSuggestedDates(
      result.violatedConstraints,
      taskStartDate,
      taskEndDate,
    )
    result.suggestedStartDate = suggestions.startDate
    result.suggestedEndDate = suggestions.endDate
  }

  return result
}

/**
 * Check a single dependency constraint
 */
function checkSingleDependencyConstraint(
  taskStart: string,
  taskEnd: string,
  predecessorStart: string,
  predecessorEnd: string,
  type: 'FS' | 'SS' | 'FF' | 'SF',
  lagDays: number,
): boolean {
  const taskStartDate = new Date(taskStart + 'T00:00:00')
  const taskEndDate = new Date(taskEnd + 'T00:00:00')
  const predStartDate = new Date(predecessorStart + 'T00:00:00')
  const predEndDate = new Date(predecessorEnd + 'T00:00:00')

  // Add lag days to predecessor dates
  const lagMs = lagDays * 24 * 60 * 60 * 1000
  const predStartWithLag = new Date(predStartDate.getTime() + lagMs)
  const predEndWithLag = new Date(predEndDate.getTime() + lagMs)

  switch (type) {
    case 'FS': // Finish-to-Start: Task starts after predecessor ends + lag
      return taskStartDate < predEndWithLag

    case 'SS': // Start-to-Start: Task starts when predecessor starts + lag
      return taskStartDate < predStartWithLag

    case 'FF': // Finish-to-Finish: Task ends when predecessor ends + lag
      return taskEndDate < predEndWithLag

    case 'SF': // Start-to-Finish: Task ends when predecessor starts + lag
      return taskEndDate < predStartWithLag

    default:
      console.warn(`Unknown dependency type: ${type}`)
      return false
  }
}

/**
 * Generate human-readable reason for dependency violations
 */
function generateViolationReason(violations: DependencyConstraint[]): string {
  if (violations.length === 1) {
    const v = violations[0]
    const lagText = v.lagDays > 0 ? ` (with ${v.lagDays} day${v.lagDays > 1 ? 's' : ''} lag)` : ''

    switch (v.type) {
      case 'FS':
        return `Task must start after "${v.predecessorName}" ends${lagText}`
      case 'SS':
        return `Task must start when "${v.predecessorName}" starts${lagText}`
      case 'FF':
        return `Task must end when "${v.predecessorName}" ends${lagText}`
      case 'SF':
        return `Task must end when "${v.predecessorName}" starts${lagText}`
    }
  } else {
    return `Task violates ${violations.length} dependency constraints`
  }
}

/**
 * Calculate suggested dates that would satisfy all constraints
 */
function calculateSuggestedDates(
  violations: DependencyConstraint[],
  currentStart: string,
  currentEnd: string,
): { startDate: string; endDate: string } {
  let suggestedStart = currentStart
  let suggestedEnd = currentEnd

  for (const violation of violations) {
    const predStart = violation.predecessorStartDate!
    const predEnd = violation.predecessorEndDate!
    const lagMs = violation.lagDays * 24 * 60 * 60 * 1000

    const predStartDate = new Date(predStart + 'T00:00:00')
    const predEndDate = new Date(predEnd + 'T00:00:00')
    const predStartWithLag = new Date(predStartDate.getTime() + lagMs)
    const predEndWithLag = new Date(predEndDate.getTime() + lagMs)

    switch (violation.type) {
      case 'FS':
        // Task must start after predecessor ends + lag
        if (new Date(suggestedStart + 'T00:00:00') < predEndWithLag) {
          suggestedStart = predEndWithLag.toLocaleDateString('en-CA')
        }
        break

      case 'SS':
        // Task must start when predecessor starts + lag
        if (new Date(suggestedStart + 'T00:00:00') < predStartWithLag) {
          suggestedStart = predStartWithLag.toLocaleDateString('en-CA')
        }
        break

      case 'FF':
        // Task must end when predecessor ends + lag
        if (new Date(suggestedEnd + 'T00:00:00') < predEndWithLag) {
          suggestedEnd = predEndWithLag.toLocaleDateString('en-CA')
        }
        break

      case 'SF':
        // Task must end when predecessor starts + lag
        if (new Date(suggestedEnd + 'T00:00:00') < predStartWithLag) {
          suggestedEnd = predStartWithLag.toLocaleDateString('en-CA')
        }
        break
    }
  }

  return { startDate: suggestedStart, endDate: suggestedEnd }
}

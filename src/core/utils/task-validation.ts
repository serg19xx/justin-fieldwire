import type { Task, TaskCreateUpdate } from '@/core/types/task'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface ProjectBounds {
  startDate: string
  endDate: string
}

export interface DependencyValidation {
  predecessorTask: Task
  successorTask: TaskCreateUpdate
  dependencyType: string
  lagDays: number
}

/**
 * Validates task dates against project bounds
 */
export function validateProjectBounds(
  taskData: TaskCreateUpdate,
  projectBounds: ProjectBounds,
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Get start and end dates from either field naming convention
  const startDate = taskData.startPlanned || taskData.start_planned
  const endDate = taskData.endPlanned || taskData.end_planned

  if (!startDate || !endDate) {
    errors.push('Task start and end dates are required')
    return { isValid: false, errors, warnings }
  }

  // Check if project bounds are available
  if (!projectBounds.startDate || !projectBounds.endDate) {
    console.warn('⚠️ Project bounds not available, skipping bounds validation')
    return { isValid: true, errors, warnings }
  }

  const taskStart = new Date(startDate)
  const taskEnd = new Date(endDate)
  const projectStart = new Date(projectBounds.startDate)
  const projectEnd = new Date(projectBounds.endDate)

  console.log('🔍 Project bounds validation:', {
    taskStart: taskStart.toISOString().split('T')[0],
    taskEnd: taskEnd.toISOString().split('T')[0],
    projectStart: projectStart.toISOString().split('T')[0],
    projectEnd: projectEnd.toISOString().split('T')[0],
    taskStartBeforeProject: taskStart < projectStart,
    taskEndAfterProject: taskEnd > projectEnd,
  })

  // Check if task starts before project
  if (taskStart < projectStart) {
    errors.push(
      `Task starts before project begins. Project starts: ${projectBounds.startDate}, Task starts: ${startDate}`,
    )
  }

  // Check if task ends after project (inclusive - task can end on last day of project)
  if (taskEnd > projectEnd) {
    errors.push(
      `Task ends after project ends. Project ends: ${projectBounds.endDate}, Task ends: ${endDate}`,
    )
  }

  // Check if task duration is reasonable (not negative)
  if (taskEnd < taskStart) {
    errors.push('Task end date cannot be before start date')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validates task dependencies and their dates
 */
export function validateDependencies(
  taskData: TaskCreateUpdate,
  existingTasks: Task[],
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!taskData.dependencies || taskData.dependencies.length === 0) {
    return { isValid: true, errors, warnings }
  }

  // Get start and end dates from either field naming convention
  const startDate = taskData.startPlanned || taskData.start_planned
  const endDate = taskData.endPlanned || taskData.end_planned

  if (!startDate || !endDate) {
    errors.push('Task dates are required for dependency validation')
    return { isValid: false, errors, warnings }
  }

  const taskStart = new Date(startDate)
  const taskEnd = new Date(endDate)

  for (const dependency of taskData.dependencies) {
    // Try to find predecessor task by comparing both string and number IDs
    const predecessorTask = existingTasks.find(
      (t) =>
        t.id === String(dependency.predecessor_id) || Number(t.id) === dependency.predecessor_id,
    )

    if (!predecessorTask) {
      errors.push(`Predecessor task with ID ${dependency.predecessor_id} not found`)
      continue
    }

    if (!predecessorTask.start_planned || !predecessorTask.end_planned) {
      errors.push(`Predecessor task "${predecessorTask.name}" has no dates set`)
      continue
    }

    const predecessorStart = new Date(predecessorTask.start_planned)
    const predecessorEnd = new Date(predecessorTask.end_planned)
    const lagDays = dependency.lag_days || 0

    // Validate dependency types
    switch (dependency.type) {
      case 'FS': // Finish-to-Start
        const fsExpectedStart = new Date(predecessorEnd)
        fsExpectedStart.setDate(fsExpectedStart.getDate() + lagDays + 1)

        if (taskStart < fsExpectedStart) {
          errors.push(
            `Task "${taskData.name}" starts too early for FS dependency with "${predecessorTask.name}". ` +
              `Expected start: ${fsExpectedStart.toISOString().split('T')[0]}, actual: ${startDate}`,
          )
        }
        break

      case 'SS': // Start-to-Start
        const ssExpectedStart = new Date(predecessorStart)
        ssExpectedStart.setDate(ssExpectedStart.getDate() + lagDays)

        if (taskStart < ssExpectedStart) {
          errors.push(
            `Task "${taskData.name}" starts too early for SS dependency with "${predecessorTask.name}". ` +
              `Expected start: ${ssExpectedStart.toISOString().split('T')[0]}, actual: ${startDate}`,
          )
        }
        break

      case 'FF': // Finish-to-Finish
        const ffExpectedEnd = new Date(predecessorEnd)
        ffExpectedEnd.setDate(ffExpectedEnd.getDate() + lagDays)

        if (taskEnd < ffExpectedEnd) {
          errors.push(
            `Task "${taskData.name}" ends too early for FF dependency with "${predecessorTask.name}". ` +
              `Expected end: ${ffExpectedEnd.toISOString().split('T')[0]}, actual: ${endDate}`,
          )
        }
        break

      case 'SF': // Start-to-Finish
        const sfExpectedEnd = new Date(predecessorStart)
        sfExpectedEnd.setDate(sfExpectedEnd.getDate() + lagDays)

        if (taskEnd < sfExpectedEnd) {
          errors.push(
            `Task "${taskData.name}" ends too early for SF dependency with "${predecessorTask.name}". ` +
              `Expected end: ${sfExpectedEnd.toISOString().split('T')[0]}, actual: ${endDate}`,
          )
        }
        break

      default:
        warnings.push(`Unknown dependency type: ${dependency.type}`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validates if task dates affect dependent tasks
 */
export function validateDependentTasks(
  taskData: TaskCreateUpdate,
  existingTasks: Task[],
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Get start and end dates from either field naming convention
  const startDate = taskData.startPlanned || taskData.start_planned
  const endDate = taskData.endPlanned || taskData.end_planned

  if (!startDate || !endDate) {
    return { isValid: true, errors, warnings }
  }

  const taskStart = new Date(startDate)
  const taskEnd = new Date(endDate)

  // Find tasks that depend on this task (only if taskData has an id)
  if (!(taskData as TaskCreateUpdate & { id?: string }).id) {
    return { isValid: true, errors, warnings }
  }

  const taskId = (taskData as TaskCreateUpdate & { id: string }).id

  const dependentTasks = existingTasks.filter((task) =>
    task.dependencies?.some(
      (dep) =>
        (typeof dep === 'object' &&
          (dep.predecessor_id === Number(taskId) || String(dep.predecessor_id) === taskId)) ||
        (typeof dep === 'number' && (dep === Number(taskId) || String(dep) === taskId)),
    ),
  )

  for (const dependentTask of dependentTasks) {
    if (!dependentTask.start_planned || !dependentTask.end_planned) {
      continue
    }

    const depStart = new Date(dependentTask.start_planned)
    const depEnd = new Date(dependentTask.end_planned)

    // Find the dependency relationship
    const dependency = dependentTask.dependencies?.find(
      (dep) =>
        (typeof dep === 'object' &&
          (dep.predecessor_id === Number(taskId) || String(dep.predecessor_id) === taskId)) ||
        (typeof dep === 'number' && (dep === Number(taskId) || String(dep) === taskId)),
    )

    if (!dependency) continue

    const lagDays = (typeof dependency === 'object' ? dependency.lag_days : 0) || 0

    if (typeof dependency !== 'object') continue

    switch (dependency.type) {
      case 'FS': // Finish-to-Start
        const fsExpectedStart = new Date(taskEnd)
        fsExpectedStart.setDate(fsExpectedStart.getDate() + lagDays + 1)

        if (depStart < fsExpectedStart) {
          warnings.push(
            `Task "${dependentTask.name}" may need to be rescheduled due to changes in "${taskData.name}". ` +
              `Expected start: ${fsExpectedStart.toISOString().split('T')[0]}, current: ${dependentTask.start_planned}`,
          )
        }
        break

      case 'SS': // Start-to-Start
        const ssExpectedStart = new Date(taskStart)
        ssExpectedStart.setDate(ssExpectedStart.getDate() + lagDays)

        if (depStart < ssExpectedStart) {
          warnings.push(
            `Task "${dependentTask.name}" may need to be rescheduled due to changes in "${taskData.name}". ` +
              `Expected start: ${ssExpectedStart.toISOString().split('T')[0]}, current: ${dependentTask.start_planned}`,
          )
        }
        break

      case 'FF': // Finish-to-Finish
        const ffExpectedEnd = new Date(taskEnd)
        ffExpectedEnd.setDate(ffExpectedEnd.getDate() + lagDays)

        if (depEnd < ffExpectedEnd) {
          warnings.push(
            `Task "${dependentTask.name}" may need to be rescheduled due to changes in "${taskData.name}". ` +
              `Expected end: ${ffExpectedEnd.toISOString().split('T')[0]}, current: ${dependentTask.end_planned}`,
          )
        }
        break

      case 'SF': // Start-to-Finish
        const sfExpectedEnd = new Date(taskStart)
        sfExpectedEnd.setDate(sfExpectedEnd.getDate() + lagDays)

        if (depEnd < sfExpectedEnd) {
          warnings.push(
            `Task "${dependentTask.name}" may need to be rescheduled due to changes in "${taskData.name}". ` +
              `Expected end: ${sfExpectedEnd.toISOString().split('T')[0]}, current: ${dependentTask.end_planned}`,
          )
        }
        break
    }
  }

  return {
    isValid: true, // This is just warnings, not errors
    errors,
    warnings,
  }
}

/**
 * Main validation function that combines all validations
 */
export function validateTask(
  taskData: TaskCreateUpdate,
  projectBounds: ProjectBounds,
  existingTasks: Task[] = [],
): ValidationResult {
  const allErrors: string[] = []
  const allWarnings: string[] = []

  // Validate project bounds
  const boundsValidation = validateProjectBounds(taskData, projectBounds)
  allErrors.push(...boundsValidation.errors)
  allWarnings.push(...boundsValidation.warnings)

  // Validate dependencies
  const dependencyValidation = validateDependencies(taskData, existingTasks)
  allErrors.push(...dependencyValidation.errors)
  allWarnings.push(...dependencyValidation.warnings)

  // Validate dependent tasks (only for updates)
  if ((taskData as TaskCreateUpdate & { id?: string }).id) {
    const dependentValidation = validateDependentTasks(taskData, existingTasks)
    allWarnings.push(...dependentValidation.warnings)
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  }
}

/**
 * Suggests project bounds extension based on task requirements
 */
export function suggestProjectBoundsExtension(
  taskData: TaskCreateUpdate,
  currentBounds: ProjectBounds,
): { needsExtension: boolean; suggestedStart: string; suggestedEnd: string; reason: string } {
  // Get start and end dates from either field naming convention
  const startDate = taskData.startPlanned || taskData.start_planned
  const endDate = taskData.endPlanned || taskData.end_planned

  if (!startDate || !endDate) {
    return { needsExtension: false, suggestedStart: '', suggestedEnd: '', reason: '' }
  }

  // Check if project bounds are available
  if (!currentBounds.startDate || !currentBounds.endDate) {
    return { needsExtension: false, suggestedStart: '', suggestedEnd: '', reason: '' }
  }

  const taskStart = new Date(startDate)
  const taskEnd = new Date(endDate)
  const projectStart = new Date(currentBounds.startDate)
  const projectEnd = new Date(currentBounds.endDate)

  let needsExtension = false
  let suggestedStart = currentBounds.startDate
  let suggestedEnd = currentBounds.endDate
  let reason = ''

  if (taskStart < projectStart) {
    needsExtension = true
    suggestedStart = startDate
    reason = `Task starts before project begins (${startDate} vs ${currentBounds.startDate})`
  }

  if (taskEnd > projectEnd) {
    needsExtension = true
    suggestedEnd = endDate
    if (reason) {
      reason += ` and ends after project ends (${endDate} vs ${currentBounds.endDate})`
    } else {
      reason = `Task ends after project ends (${endDate} vs ${currentBounds.endDate})`
    }
  }

  return {
    needsExtension,
    suggestedStart,
    suggestedEnd,
    reason,
  }
}

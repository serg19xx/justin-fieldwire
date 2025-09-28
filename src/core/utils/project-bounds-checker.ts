import type { TaskCreateUpdate } from '@/core/types/task'
import type { Project } from '@/core/utils/project-api'

export interface BoundsCheckResult {
  isWithinBounds: boolean
  clampedStart: string
  clampedEnd: string
  reason: string
}

/**
 * Simple check if task dates are within project bounds
 */
export function checkProjectBounds(
  taskData: TaskCreateUpdate,
  projectInfo: Project,
): BoundsCheckResult {
  console.log('🔍 checkProjectBounds called with:', {
    startPlanned: taskData.startPlanned,
    endPlanned: taskData.endPlanned,
    milestone: (taskData as TaskCreateUpdate & { milestone?: boolean }).milestone,
  })

  if (!taskData.startPlanned || !taskData.endPlanned) {
    console.log('❌ Missing task dates:', {
      startPlanned: taskData.startPlanned,
      endPlanned: taskData.endPlanned,
    })
    return {
      isWithinBounds: false,
      clampedStart: '',
      clampedEnd: '',
      reason: 'Task dates are required',
    }
  }

  // Parse dates as local dates to avoid timezone issues
  const taskStart = new Date(taskData.startPlanned + 'T00:00:00')
  const taskEnd = new Date(taskData.endPlanned + 'T00:00:00')
  const projectStart = new Date(projectInfo.date_start + 'T00:00:00')
  const projectEnd = new Date(projectInfo.date_end + 'T00:00:00')

  // Check if task is within bounds (inclusive) - compare as date strings
  const projectStartStr = projectInfo.date_start

  // Check if task is within bounds (inclusive)
  const isWithinBounds = taskStart >= projectStart && taskEnd <= projectEnd

  if (isWithinBounds) {
    return {
      isWithinBounds: true,
      clampedStart: taskData.startPlanned,
      clampedEnd: taskData.endPlanned,
      reason: '',
    }
  }

  // Calculate clamped dates (clamp to project bounds)
  let clampedStart = taskData.startPlanned
  let clampedEnd = taskData.endPlanned
  let reason = ''

  if (taskStart < projectStart) {
    // For milestones, move to project start (first day of project)
    const isMilestone = (taskData as TaskCreateUpdate & { milestone?: boolean }).milestone
    console.log('🔍 Task starts before project - isMilestone:', isMilestone)
    if (isMilestone) {
      clampedStart = projectStartStr
      reason += 'Milestone moved to project start. '
      console.log('🔍 Milestone clamped to project start:', clampedStart)
    } else {
      clampedStart = projectStartStr
      reason += 'Task starts before project begins. '
      console.log('🔍 Task clamped to project start:', clampedStart)
    }
  } else if (taskStart.getTime() === projectStart.getTime()) {
    // If task starts exactly on project start, move it to the next day for milestones
    const isMilestone = (taskData as TaskCreateUpdate & { milestone?: boolean }).milestone
    if (isMilestone) {
      const nextDay = new Date(projectStart)
      nextDay.setDate(nextDay.getDate() + 1)
      clampedStart = nextDay.toISOString().split('T')[0]
      reason += 'Milestone moved to first day of project. '
    }
  }

  // Check if we need to clamp the end date
  // Use the original taskEnd (not adjustedTaskEnd) for clamping decision
  if (taskEnd > projectEnd) {
    // Use the project end date directly
    clampedEnd = projectInfo.date_end
    reason += 'Task ends after project ends.'
    console.log(
      '🔍 DEBUG - Clamping end date to:',
      clampedEnd,
      'from taskEnd:',
      taskData.endPlanned,
    )
  }

  // For milestones, ensure end_planned equals start_planned
  const isMilestone = (taskData as TaskCreateUpdate & { milestone?: boolean }).milestone
  if (isMilestone) {
    clampedEnd = clampedStart
    console.log('🔍 DEBUG - Milestone detected, setting end_planned = start_planned:', clampedEnd)

    // Additional check: ensure milestone doesn't go beyond project end
    const milestoneDate = new Date(clampedStart + 'T00:00:00')
    if (milestoneDate > projectEnd) {
      // Move milestone to project end date
      clampedStart = projectInfo.date_end
      clampedEnd = projectInfo.date_end
      reason += 'Milestone moved to project end date. '
      console.log('🔍 DEBUG - Milestone moved to project end:', clampedStart)
    }
  }

  return {
    isWithinBounds: false,
    clampedStart,
    clampedEnd,
    reason: reason.trim(),
  }
}

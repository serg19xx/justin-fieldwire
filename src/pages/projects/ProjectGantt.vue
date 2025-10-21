<template>
  <div class="project-gantt flex-1 flex flex-col">
    <!-- Header -->
    <div class="bg-white rounded-lg shadow p-3 mb-3 flex items-center justify-between">
      <div class="text-sm text-gray-700 font-medium">Gantt Chart</div>
      <div class="flex items-center gap-2 text-xs text-gray-500">
        <span>Range:</span>
        <span class="font-medium">{{ headerRangeLabel }}</span>
      </div>
    </div>

    <!-- Gantt Chart Container -->
    <div class="gantt-main-container">
      <!-- Left Panel: Task List -->
      <div class="gantt-left-panel" ref="leftPanelRef">
        <!-- Task List Header -->
        <div class="gantt-header-row">
          <div class="gantt-task-header">Task</div>
        </div>

        <!-- Task List -->
        <div class="gantt-task-list">
          <div
            v-for="task in mappedTasks"
            :key="task.id"
            class="gantt-task-row"
            :class="{
              'selected': selectedTask?.id === task.id
            }"
            @click="handleTaskListClick(task)"
          >
            <div class="gantt-task-cell">
              <div class="flex items-center justify-between w-full">
                <span class="truncate">{{ task.title }}</span>
                <span class="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {{ task.duration }}d
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel: Gantt Grid -->
      <div class="gantt-right-panel" ref="rightPanelRef">
        <!-- Grid Header -->
        <div class="gantt-header-row gantt-grid-header">
          <div
            v-for="(day, idx) in days"
            :key="idx"
            class="gantt-day-header"
            :class="[
              isMonthBoundary(day) ? 'border-l-4 border-l-gray-400' : 'border-l',
              highlightedDays.has(day.toISOString().split('T')[0])
                ? 'bg-blue-100 text-blue-700 border-blue-300'
                : isWeekend(day)
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : 'text-gray-500',
            ]"
          >
            {{ formatDay(day) }}
          </div>
        </div>

        <!-- Grid Content -->
        <div class="gantt-grid-content" @click="handleGridClick">
          <div
            v-for="task in mappedTasks"
            :key="task.id"
            class="gantt-grid-task-row"
          >
            <!-- Task Bar Row -->
            <div
              v-for="(day, idx) in days"
              :key="idx"
              class="gantt-day-cell"
              :class="[
                isMonthBoundary(day) ? 'border-l-4 border-l-gray-400' : 'border-l',
              ]"
            >
              <!-- Task Bar - only show on the first day of the task -->
              <div
                v-if="isTaskStartDay(day, task)"
                :class="[
                  barColor(task),
                  'cursor-pointer',
                  selectedTask?.id === task.id
                    ? 'ring-2 ring-blue-500 ring-opacity-100 shadow-lg z-20'
                    : '',
                  isDragging && dragStartTask?.id === task.id ? 'opacity-70' : '',
                ]"
                class="task-bar absolute top-1/2 rounded h-6 flex items-center px-1 text-white text-xs font-medium select-none"
                :style="{
                  ...getTaskBarStyle(task, day),
                  transform:
                    isDragging && dragStartTask?.id === task.id
                      ? `translateX(${dragOffset}px) translateY(-50%)`
                      : 'translateY(-50%)',
                }"
                @click.stop="handleTaskClick(task)"
                @mousedown="handleTaskMouseDown(task, $event)"
                :title="
                  task.milestone
                    ? `${task.title} - Click to edit, drag to move`
                    : `${task.title} (${task.duration}d) - Click to edit, drag to move, resize handles to change duration`
                "
              >
                <span class="truncate flex items-center">
                  <span v-if="task.milestone" class="text-sm mr-1">🎯</span>
                  <span v-else class="text-sm mr-1">📋</span>
                  {{ task.title }}
                </span>

                <!-- Resize handles - only show for selected task (not milestones) -->
                <div
                  v-if="selectedTask?.id === task.id && canEdit && !task.milestone"
                  class="resize-handle absolute -left-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-w-resize shadow-md z-10"
                  @mousedown.stop="handleResizeStart(task, $event, 'start')"
                  title="Resize start"
                ></div>
                <div
                  v-if="selectedTask?.id === task.id && canEdit && !task.milestone"
                  class="resize-handle absolute -right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-e-resize shadow-md z-10"
                  @mousedown.stop="handleResizeStart(task, $event, 'end')"
                  title="Resize end"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { Task } from '@/core/types/task'

defineOptions({ name: 'ProjectGantt' })

interface Props {
  projectId?: number
  canEdit?: boolean
  tasks?: Task[]
  projectStartDate?: string
  projectEndDate?: string
  dynamicRange?: boolean // If true, range updates based on task positions
}

const props = withDefaults(defineProps<Props>(), {
  projectId: undefined,
  canEdit: false,
  tasks: () => [],
  projectStartDate: undefined,
  projectEndDate: undefined,
  dynamicRange: false,
})

// const emit = defineEmits<{
//   'task-update': [taskId: number, updates: { start_planned: string; end_planned: string }]
// }>()

interface GanttTask {
  id: number
  title: string
  start: string // YYYY-MM-DD
  end: string // YYYY-MM-DD
  duration: number // duration in days
  status: 'planned' | 'in_progress' | 'completed' | 'blocked' | 'delayed'
  milestone?: boolean
  task_type?: string
}

// Calculate project range based on project dates or task dates as fallback
const projectRange = computed(() => {
  if (!props.tasks || props.tasks.length === 0) return null

  // Use project dates if available, otherwise fall back to task dates
  let startDate: Date = new Date()
  let endDate: Date = new Date()

  if (props.projectStartDate && props.projectEndDate && !props.dynamicRange) {
    // Use project boundaries (static)
    try {
      // Use dates as strings directly, force UTC to avoid timezone issues
      startDate = new Date(props.projectStartDate + 'T00:00:00.000Z')
      endDate = new Date(props.projectEndDate + 'T00:00:00.000Z')

    } catch (error) {
      console.warn('Invalid project dates, falling back to task dates:', error)
      // Fall through to task boundaries
    }
  }

  // Use task boundaries if no project dates or dynamic range is enabled
  if (!props.projectStartDate || !props.projectEndDate || props.dynamicRange) {
    // Fallback to task boundaries
    const starts = props.tasks.map((t) => t.start_planned).filter((s): s is string => !!s)
    const ends = props.tasks
      .map((t) => t.end_planned || t.start_planned)
      .filter(Boolean) as string[]

    if (starts.length === 0) return null

    const minStart = starts.reduce((min, s) => (s < min ? s : min))
    const maxEnd = ends.reduce((max, s) => (s > max ? s : max))

    startDate = toDateUTC(minStart)
    endDate = toDateUTC(maxEnd)
  }

  // Calculate total days (inclusive of both start and end dates)
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

  // Calculate total width in pixels (33px per day + 1px border)
  const totalWidth = totalDays * 33 + (totalDays - 1) * 1


  return {
    startDate,
    endDate,
    totalDays,
    totalWidth,
    startPixel: 0,
    endPixel: totalWidth,
  }
})

// Map days to pixels (currently unused but kept for future use)
// const dayPixelMap = computed(() => {
//   if (!projectRange.value) return new Map()

//   try {
//     const map = new Map()
//     const startDate = projectRange.value.startDate
//     const totalDays = projectRange.value.totalDays

//     for (let i = 0; i < totalDays; i++) {
//       const day = new Date(startDate)
//       day.setDate(day.getDate() + i)
//       const dayStr = formatDate(day)
//       const pixelStart = i * 33 // 33px per day
//       const pixelEnd = pixelStart + 32 // 33px - 1px for border

//       map.set(dayStr, {
//         day,
//         pixelStart,
//         pixelEnd,
//         isWeekend: isWeekend(day),
//         isMonthBoundary: isMonthBoundary(day),
//       })
//     }

//     return map
//   } catch (error) {
//     console.warn('Error calculating day pixel map:', error)
//     return new Map()
//   }
// })

// Convert pixel to day (currently unused but kept for future use)
// function pixelToDay(pixel: number): string | null {
//   if (!projectRange.value) return null

//   const dayIndex = Math.floor(pixel / 33) // 33px per day
//   const startDate = projectRange.value.startDate
//   const targetDay = new Date(startDate)
//   targetDay.setDate(targetDay.getDate() + dayIndex)

//   return formatDate(targetDay)
// }

// Convert day to pixel (currently unused but kept for future use)
// function dayToPixel(dayStr: string): number {
//   if (!projectRange.value) return 0

//   const day = toDateUTC(dayStr)
//   const startDate = projectRange.value.startDate
//   const dayDiff = Math.floor((day.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

//   return dayDiff * 33 // 33px per day
// }

// Interactive state
const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartTask = ref<GanttTask | null>(null)
const selectedTask = ref<GanttTask | null>(null)
const dragOffset = ref(0)
const originalTaskStart = ref<string>('')
const originalTaskEnd = ref<string>('')

// No need for task positions tracking

// Resize state
const isResizing = ref(false)
const resizeType = ref<'start' | 'end' | null>(null)
const resizeStartX = ref(0)
const resizeStartTask = ref<GanttTask | null>(null)
const originalResizeStart = ref<string>('')
const originalResizeEnd = ref<string>('')

// Highlighted days for selected task
const highlightedDays = ref<Set<string>>(new Set())

// Selected task in the list
const selectedTaskInList = ref<GanttTask | null>(null)

const days = computed<Date[]>(() => {
  if (!projectRange.value) return []

  try {
    const arr: Date[] = []
    // Use UTC dates to avoid timezone shifts
    const startDate = new Date(projectRange.value.startDate.getTime())
    const endDate = new Date(projectRange.value.endDate.getTime())

    const cur = new Date(startDate)
    while (cur <= endDate) {
      // Create UTC date to avoid timezone conversion
      const utcDate = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate()))
      arr.push(utcDate)
      cur.setUTCDate(cur.getUTCDate() + 1)
    }
    return arr
  } catch (error) {
    console.warn('Error calculating days:', error)
    return []
  }
})

// Local tasks state for drag operations
const localTasks = ref<Task[]>([])

// Initialize local tasks when props change
watch(() => props.tasks, (newTasks) => {
  if (newTasks) {
    localTasks.value = [...newTasks]
  }
}, { immediate: true })

// Map tasks to gantt format
const mappedTasks = computed<GanttTask[]>(() => {
  const tasksToUse = localTasks.value.length > 0 ? localTasks.value : (props.tasks || [])
  if (tasksToUse.length === 0) return []

  const tasks = tasksToUse
    .filter((t) => !!t.start_planned)
    .map((t) => {
      // Calculate duration from dates if duration_days is not available
      let duration = t.duration_days
      if (!duration && t.start_planned && t.end_planned) {
        const startDate = new Date(t.start_planned)
        const endDate = new Date(t.end_planned)
        const diffTime = endDate.getTime() - startDate.getTime()
        // Use Math.floor + 1 to get inclusive days
        duration = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
      }
      duration = duration || 1 // fallback to 1 day

      // Calculate end date properly
      let endDate = t.end_planned
      if (!endDate && t.start_planned) {
        // If no end date, calculate it from start date + duration
        const startDate = new Date(t.start_planned)
        startDate.setDate(startDate.getDate() + duration - 1) // -1 because start day counts as day 1
        endDate = startDate.toISOString().split('T')[0]
      }


      return {
        id: Number(t.id),
        title: t.name,
        start: t.start_planned,
        end: endDate || t.start_planned,
        duration: duration,
        status: mapStatus(t.status),
        milestone: t.milestone || false,
        task_type: undefined,
      }
    })

  return tasks
})

const headerRangeLabel = computed(() => {
  if (!projectRange.value) return 'No tasks'

  try {
    const start = formatHeader(projectRange.value.startDate)
    const end = formatHeader(projectRange.value.endDate)
    return `${start} – ${end}`
  } catch (error) {
    console.warn('Error calculating header range label:', error)
    return 'Loading...'
  }
})


// Check if this day is the start day of the task
function isTaskStartDay(day: Date, task: GanttTask): boolean {
  const dayStr = formatDate(day)
  const startStr = task.start

  return dayStr === startStr
}

// Check if this day is the first day of a month
function isMonthBoundary(day: Date): boolean {
  return day.getDate() === 1
}

// Check if this day is a weekend (Saturday or Sunday)
function isWeekend(day: Date): boolean {
  const dayOfWeek = day.getDay()
  return dayOfWeek === 0 || dayOfWeek === 6 // Sunday = 0, Saturday = 6
}

// Get task bar style for a specific day
function getTaskBarStyle(task: GanttTask, day: Date): Record<string, string> {
  const dayStr = formatDate(day)
  const startStr = task.start

  // Only show bar on the first day of the task
  if (dayStr !== startStr) {
    return { display: 'none' }
  }

  // Use existing duration field - much simpler!
  const daysDiff = task.duration

  // Calculate width: Ndays * 33px + (Ndays-1)*1px for borders - Ndays px - 2px margin
  const width = daysDiff * 33 + (daysDiff - 1) * 1 - daysDiff - 2
  const minWidth = 29 // minimum width for very short tasks (milestones need more margin)


  const style = {
    width: `${Math.max(width, minWidth)}px`,
    left: '1px',
  }

  return style
}

function barColor(task: GanttTask): string {
  // Use the same colors as the calendar legend
  switch (task.status) {
    case 'completed':
      return 'bg-gray-500 border border-gray-600 shadow-sm' // Done - gray
    case 'in_progress':
      return 'bg-green-500 border border-green-600 shadow-sm' // In Progress - green
    case 'blocked':
      return 'bg-red-500 border border-red-600 shadow-sm' // Blocked - red
    case 'delayed':
      return 'bg-yellow-500 border border-yellow-600 shadow-sm' // Delayed - yellow
    default:
      return 'bg-blue-500 border border-blue-600 shadow-sm' // Planned - blue
  }
}

function mapStatus(status: Task['status'] | string): GanttTask['status'] {
  switch (status) {
    case 'done':
      return 'completed'
    case 'in_progress':
      return 'in_progress'
    case 'blocked':
    case 'delayed':
    case 'planned':
    default:
      return 'planned'
  }
}

function formatDay(d: Date): string {
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`
}

function formatHeader(d: Date): string {
  // Use direct date components to avoid timezone issues
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  const month = months[d.getUTCMonth()]
  const day = d.getUTCDate()
  return `${month} ${day}`
}

function formatDate(d: Date): string {
  const y = d.getUTCFullYear()
  const m = `${d.getUTCMonth() + 1}`.padStart(2, '0')
  const dd = `${d.getUTCDate()}`.padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function toDateUTC(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map((n) => Number(n))
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1))
}

function addDays(date: Date, daysToAdd: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + daysToAdd)
  return d
}

// Interactive handlers
function handleTaskClick(task: GanttTask) {
  // Force cleanup any lingering drag state
  if (isDragging.value) {
    isDragging.value = false
    dragOffset.value = 0
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  selectedTask.value = task
  selectedTaskInList.value = task

  // Highlight days for selected task
  const startDate = new Date(task.start)
  const endDate = new Date(task.end)
  updateHighlightedDays(startDate, endDate)

  // Auto-scroll to center the task bar
  scrollToTask(task)

  // Emit event to parent component
  // You can add emit here if needed
}

// Update highlighted days for selected task
function updateHighlightedDays(startDate: Date, endDate: Date) {
  if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    console.warn('Invalid dates in updateHighlightedDays:', { startDate, endDate })
    return
  }

  highlightedDays.value.clear()


  // Add all days from start to end (inclusive)
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]
    highlightedDays.value.add(dateStr)
    currentDate.setDate(currentDate.getDate() + 1)
  }

}

// Clear highlighted days
function clearHighlightedDays() {
  highlightedDays.value.clear()
}

// Handle click on grid
function handleGridClick(event: MouseEvent) {
  // Only clear selection if clicking on the grid background, not on task bars or task labels
  const target = event.target as HTMLElement
  if (target.classList.contains('border-b') && target.classList.contains('border-l')) {
    selectedTask.value = null
    selectedTaskInList.value = null
    clearHighlightedDays()
  }
}

// Handle click on task in list
function handleTaskListClick(task: GanttTask) {
  selectedTask.value = task
  selectedTaskInList.value = task

  // Highlight days for selected task
  const startDate = new Date(task.start)
  const endDate = new Date(task.end)
  updateHighlightedDays(startDate, endDate)

  // Auto-scroll to center the task bar
  scrollToTask(task)
}

// Auto-scroll to center the task bar in the viewport
function scrollToTask(task: GanttTask) {
  if (!projectRange.value) return

  // Calculate the task's position in the timeline
  const taskStartDate = new Date(task.start)
  const projectStartDate = projectRange.value.startDate
  const daysFromStart = Math.ceil(
    (taskStartDate.getTime() - projectStartDate.getTime()) / (1000 * 60 * 60 * 24),
  )

  // Calculate the center position of the task bar
  const taskCenterPosition = daysFromStart * 33 + (task.duration * 33) / 2 // 33px per day

  // Get the scrollable container
  const scrollContainer = document.querySelector('.overflow-x-auto')
  if (!scrollContainer) return

  // Calculate the center of the viewport
  const viewportWidth = scrollContainer.clientWidth
  const centerPosition = taskCenterPosition - viewportWidth / 2

  // Scroll to center the task
  scrollContainer.scrollTo({
    left: Math.max(0, centerPosition),
    behavior: 'smooth',
  })

}

function handleTaskMouseDown(task: GanttTask, event: MouseEvent) {

  // Force cleanup any existing drag state
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  isDragging.value = false
  dragOffset.value = 0

  isDragging.value = true
  dragStartX.value = event.clientX
  dragStartTask.value = task
  dragOffset.value = 0

  // Save original dates
  originalTaskStart.value = task.start
  originalTaskEnd.value = task.end

  // Prevent text selection during drag
  event.preventDefault()

  // Add global mouse event listeners
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

function handleMouseMove(event: MouseEvent) {
  if (!isDragging.value || !dragStartTask.value) {
    // Force cleanup if somehow still receiving events
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    // Force reset dragOffset to stop any visual following
    dragOffset.value = 0
    return
  }

  const deltaX = event.clientX - dragStartX.value
  dragOffset.value = deltaX

}

function handleMouseUp() {

  if (!isDragging.value || !dragStartTask.value) {
    // Clean up if not dragging
    cleanupDrag()
    return
  }

  // Process drag if there was movement
  if (Math.abs(dragOffset.value) > 5) { // Only process if moved more than 5px
    const task = dragStartTask.value
    const originalStart = new Date(originalTaskStart.value)
    const originalEnd = new Date(originalTaskEnd.value)

    // Calculate new position
    const dayIndex = Math.floor(dragOffset.value / 33) // 33px per day
    const newStart = new Date(originalStart)
    newStart.setDate(newStart.getDate() + dayIndex)

    const newEnd = new Date(originalEnd)
    newEnd.setDate(newEnd.getDate() + dayIndex)

    // Check project boundaries
    if (projectRange.value) {
      const projectStart = new Date(projectRange.value.startDate)
      const projectEnd = new Date(projectRange.value.endDate)

      // If task start is before project start, adjust to project start
      if (newStart < projectStart) {
        const daysDiff = Math.ceil((projectStart.getTime() - newStart.getTime()) / (1000 * 60 * 60 * 24))
        newStart.setTime(projectStart.getTime())
        newEnd.setDate(newEnd.getDate() + daysDiff)
      }

      // If task end is after project end, adjust to project end
      if (newEnd > projectEnd) {
        const daysDiff = Math.ceil((newEnd.getTime() - projectEnd.getTime()) / (1000 * 60 * 60 * 24))
        newEnd.setTime(projectEnd.getTime())
        newStart.setDate(newStart.getDate() - daysDiff)
      }

      // Final check: ensure task start is not before project start
      if (newStart < projectStart) {
        newStart.setTime(projectStart.getTime())
      }
    }


    // Update the task in local state
    const taskIndex = localTasks.value.findIndex((t) => Number(t.id) === task.id)
    if (taskIndex !== -1) {
      localTasks.value[taskIndex] = {
        ...localTasks.value[taskIndex],
        start_planned: newStart.toISOString().split('T')[0],
        end_planned: newEnd.toISOString().split('T')[0],
      }

      // Update highlighted days
      updateHighlightedDays(newStart, newEnd)
    }
  }

  // Always cleanup after processing
  cleanupDrag()
}

function cleanupDrag() {
  isDragging.value = false
  dragStartX.value = 0
  dragStartTask.value = null
  dragOffset.value = 0
  originalTaskStart.value = ''
  originalTaskEnd.value = ''

  // Remove event listeners
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}


// Resize handlers
function handleResizeStart(task: GanttTask, event: MouseEvent, type: 'start' | 'end') {
  isResizing.value = true
  resizeType.value = type
  resizeStartX.value = event.clientX
  resizeStartTask.value = task

  // Save original dates
  originalResizeStart.value = task.start
  originalResizeEnd.value = task.end

  // Prevent text selection during resize
  event.preventDefault()
  event.stopPropagation()

  // Add global mouse event listeners
  document.addEventListener('mousemove', handleResizeMove)
  document.addEventListener('mouseup', handleResizeEnd)
}

function handleResizeMove(event: MouseEvent) {
  if (!isResizing.value || !resizeStartTask.value || !resizeType.value) return

  const deltaX = event.clientX - resizeStartX.value
  const cellWidth = 33 // Same as in getTaskBarStyle
  const daysMoved = Math.round(deltaX / cellWidth)

  if (daysMoved !== 0) {
    const taskIndex = localTasks.value.findIndex((t) => Number(t.id) === resizeStartTask.value!.id)
    if (taskIndex !== -1) {
      // Use original dates from when resize started
      const originalStart = new Date(originalResizeStart.value)
      const originalEnd = new Date(originalResizeEnd.value)

      let newStart = new Date(originalStart)
      let newEnd = new Date(originalEnd)

      if (resizeType.value === 'start') {
        // Resize start - move start date by the exact number of days moved
        newStart = addDays(originalStart, daysMoved)

        // Keep end date fixed
        newEnd = new Date(originalEnd)

        // Check project boundaries
        if (projectRange.value) {
          const projectStart = new Date(projectRange.value.startDate)
          if (newStart < projectStart) {
            newStart = new Date(projectStart)
          }
        }

        // Ensure start is not after end (minimum 1 day duration)
        if (newStart >= newEnd) {
          newStart = addDays(newEnd, -1)
        }
      } else if (resizeType.value === 'end') {
        // Resize end - move end date by the exact number of days moved
        newEnd = addDays(originalEnd, daysMoved)

        // Keep start date fixed
        newStart = new Date(originalStart)

        // Check project boundaries
        if (projectRange.value) {
          const projectEnd = new Date(projectRange.value.endDate)
          if (newEnd > projectEnd) {
            newEnd = new Date(projectEnd)
          }
        }

        // Ensure end is not before start (minimum 1 day duration)
        if (newEnd <= newStart) {
          newEnd = addDays(newStart, 1)
        }
      }

      // Update the task in local state
      localTasks.value[taskIndex] = {
        ...localTasks.value[taskIndex],
        start_planned: newStart.toISOString().split('T')[0],
        end_planned: newEnd.toISOString().split('T')[0],
      }

      // Update highlighted days for the resized task
      if (newStart && newEnd && !isNaN(newStart.getTime()) && !isNaN(newEnd.getTime())) {
        updateHighlightedDays(newStart, newEnd)
      }
    }
  }
}

function handleResizeEnd() {
  if (!isResizing.value || !resizeStartTask.value) return

  // Reset resize state
  isResizing.value = false
  resizeType.value = null
  resizeStartX.value = 0
  resizeStartTask.value = null
  originalResizeStart.value = ''
  originalResizeEnd.value = ''

  // Remove global event listeners
  document.removeEventListener('mousemove', handleResizeMove)
  document.removeEventListener('mouseup', handleResizeEnd)
}

// Scroll synchronization between left and right panels
const leftPanelRef = ref<HTMLElement>()
const rightPanelRef = ref<HTMLElement>()

const syncScroll = (source: HTMLElement, target: HTMLElement) => {
  target.scrollTop = source.scrollTop
}

const handleLeftPanelScroll = (event: Event) => {
  const target = event.target as HTMLElement
  if (rightPanelRef.value) {
    syncScroll(target, rightPanelRef.value)
  }
}

const handleRightPanelScroll = (event: Event) => {
  const target = event.target as HTMLElement
  if (leftPanelRef.value) {
    syncScroll(target, leftPanelRef.value)
  }
}

// Add scroll event listeners when component mounts
onMounted(() => {
  if (leftPanelRef.value) {
    leftPanelRef.value.addEventListener('scroll', handleLeftPanelScroll)
  }
  if (rightPanelRef.value) {
    rightPanelRef.value.addEventListener('scroll', handleRightPanelScroll)
  }
})

onUnmounted(() => {
  if (leftPanelRef.value) {
    leftPanelRef.value.removeEventListener('scroll', handleLeftPanelScroll)
  }
  if (rightPanelRef.value) {
    rightPanelRef.value.removeEventListener('scroll', handleRightPanelScroll)
  }
})
</script>

<style scoped>
.project-gantt {
  gap: 0.75rem;
}

/* Gantt Main Container */
.gantt-main-container {
  display: grid;
  grid-template-columns: 240px 1fr;
  width: 100%;
  height: calc(100vh - 350px); /* Full height minus header, margins and bottom padding */
  min-height: 400px; /* Minimum height */
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
  position: relative;
}

/* Left Panel: Task List */
.gantt-left-panel {
  background: white;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Right Panel: Gantt Grid */
.gantt-right-panel {
  display: flex;
  flex-direction: column;
  overflow-x: auto;
  overflow-y: auto; /* Enable vertical scroll for both panels */
  min-width: 0;
}

/* Header Row */
.gantt-header-row {
  height: 32px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  font-size: 10px;
  font-weight: 500;
  color: #6b7280;
}

.gantt-task-header {
  padding: 0 12px;
  width: 100%;
}

.gantt-grid-header {
  min-width: max-content;
  flex-shrink: 0;
}

.gantt-day-header {
  width: 33px;
  min-width: 33px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-left: 1px solid #e5e7eb;
  font-size: 10px;
}

/* Task List */
.gantt-task-list {
  flex: 1;
  overflow-y: hidden; /* Disable individual scroll */
  overflow-x: hidden;
}

/* Task Rows */
.gantt-task-row {
  height: 32px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  transition: background-color 0.2s;
}

.gantt-task-row:hover {
  background-color: #f9fafb;
}

.gantt-task-row.selected {
  background-color: #dbeafe;
  color: #1e40af;
}

.gantt-task-cell {
  padding: 0 12px;
  width: 100%;
  display: flex;
  align-items: center;
}

/* Grid Content */
.gantt-grid-content {
  flex: 1;
  overflow-y: hidden; /* Disable individual scroll */
  overflow-x: hidden;
  min-width: max-content;
}

.gantt-day-cell {
  width: 33px;
  min-width: 33px;
  height: 32px;
  border-left: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  position: relative;
}

/* Grid Task Rows */
.gantt-grid-task-row {
  height: 32px;
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  min-width: max-content;
}

/* Responsive Design */
@media (max-width: 768px) {
  .gantt-main-container {
    grid-template-columns: 200px 1fr;
    height: calc(100vh - 300px); /* Adjusted for mobile with bottom padding */
  }

  .gantt-day-header {
    width: 28px;
    min-width: 28px;
    font-size: 9px;
  }

  .gantt-day-cell {
    width: 28px;
    min-width: 28px;
  }
}

@media (max-width: 480px) {
  .gantt-main-container {
    grid-template-columns: 180px 1fr;
    height: calc(100vh - 250px); /* Adjusted for small mobile with bottom padding */
  }

  .gantt-day-header {
    width: 25px;
    min-width: 25px;
    font-size: 8px;
  }

  .gantt-day-cell {
    width: 25px;
    min-width: 25px;
  }
}

/* Interactive task bar styles - NO EFFECTS */

/* Selected task highlighting */
.selected-task {
  position: relative;
}

.selected-task::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #3b82f6, #1d4ed8);
  border-radius: 6px;
  z-index: -1;
  opacity: 0.3;
}

/* Resize handles */

/* Task bars - hide grid lines inside and add shadow */
.task-bar {
  position: relative;
  z-index: 5;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Hide grid lines inside task bars */
.task-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: inherit;
  border-radius: inherit;
  z-index: 1;
}

/* Ensure text is above the background */
.task-bar span {
  position: relative;
  z-index: 2;
}
</style>

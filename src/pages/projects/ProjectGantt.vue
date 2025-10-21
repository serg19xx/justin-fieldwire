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

    <!-- Gantt Chart -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <div class="overflow-x-auto">
        <div
          class="min-w-full"
          :style="{ minWidth: `${240 + (days.value?.length || 0) * 33}px` }"
          @click="handleGridClick"
        >
          <!-- Header Row -->
          <div class="grid" :style="gridTemplateColumns">
            <div
              class="sticky left-0 bg-white z-10 border-b h-8 flex items-center px-3 text-xs font-medium text-gray-600"
            >
              Task
            </div>
            <div
              v-for="(day, idx) in days"
              :key="idx"
              :class="[
                'border-b h-8 flex items-center justify-center text-[10px] transition-colors duration-200',
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

          <!-- Debug Info -->
          <div v-if="mappedTasks.length === 0" class="p-4 text-center text-gray-500">
            No tasks found
          </div>

          <!-- Task Rows -->
          <div
            v-for="task in mappedTasks"
            :key="task.id"
            class="grid items-stretch"
            :style="gridTemplateColumns"
          >
            <!-- Task Label -->
            <div
              :class="[
                'sticky left-0 z-10 border-b h-8 flex items-center px-3 text-sm cursor-pointer transition-colors',
                selectedTaskInList?.id === task.id
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : 'bg-white text-gray-800 hover:bg-gray-50',
              ]"
              @click="handleTaskListClick(task)"
              :title="task.title"
            >
              <div class="truncate flex items-center justify-between w-full">
                <span class="truncate">{{ task.title }}</span>
                <span class="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {{ task.duration }}d
                </span>
              </div>
            </div>

            <!-- Day Cells -->
            <div
              v-for="(day, idx) in days"
              :key="idx"
              :class="[
                'border-b h-8 relative',
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
import { ref, computed } from 'vue'
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

// No emits needed - updating props directly

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
  let startDate: Date
  let endDate: Date

  if (props.projectStartDate && props.projectEndDate && !props.dynamicRange) {
    // Use project boundaries (static)
    try {
      // Use dates as strings directly, force UTC to avoid timezone issues
      startDate = new Date(props.projectStartDate + 'T00:00:00.000Z')
      endDate = new Date(props.projectEndDate + 'T00:00:00.000Z')

      console.log('🔍 Date creation debug:', {
        projectStartDate: props.projectStartDate,
        projectEndDate: props.projectEndDate,
        startDateCreated: startDate,
        endDateCreated: endDate,
        startDateISO: startDate.toISOString(),
        endDateISO: endDate.toISOString(),
        startDateUTC: startDate.getUTCDate(),
        endDateUTC: endDate.getUTCDate(),
        startDateLocal: startDate.getDate(),
        endDateLocal: endDate.getDate(),
        startDateString: startDate.toISOString().split('T')[0],
        endDateString: endDate.toISOString().split('T')[0],
      })

      console.log('📅 Using project boundaries:', {
        projectStartDate: props.projectStartDate,
        projectEndDate: props.projectEndDate,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        startDateFull: startDate.toISOString(),
        endDateFull: endDate.toISOString(),
        timeDiff: endDate.getTime() - startDate.getTime(),
        daysDiff: (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        totalDays: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
        startDateUTC:
          startDate.getUTCFullYear() +
          '-' +
          String(startDate.getUTCMonth() + 1).padStart(2, '0') +
          '-' +
          String(startDate.getUTCDate()).padStart(2, '0'),
        endDateUTC:
          endDate.getUTCFullYear() +
          '-' +
          String(endDate.getUTCMonth() + 1).padStart(2, '0') +
          '-' +
          String(endDate.getUTCDate()).padStart(2, '0'),
      })
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

  console.log('📊 Project range calculated:', {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    totalDays,
    totalWidth,
  })

  return {
    startDate,
    endDate,
    totalDays,
    totalWidth,
    startPixel: 0,
    endPixel: totalWidth,
  }
})

// Map days to pixels
const dayPixelMap = computed(() => {
  if (!projectRange.value) return new Map()

  try {
    const map = new Map()
    const startDate = projectRange.value.startDate
    const totalDays = projectRange.value.totalDays

    for (let i = 0; i < totalDays; i++) {
      const day = new Date(startDate)
      day.setDate(day.getDate() + i)
      const dayStr = formatDate(day)
      const pixelStart = i * 33 // 33px per day
      const pixelEnd = pixelStart + 32 // 33px - 1px for border

      map.set(dayStr, {
        day,
        pixelStart,
        pixelEnd,
        isWeekend: isWeekend(day),
        isMonthBoundary: isMonthBoundary(day),
      })
    }

    return map
  } catch (error) {
    console.warn('Error calculating day pixel map:', error)
    return new Map()
  }
})

// Convert pixel to day
function pixelToDay(pixel: number): string | null {
  if (!projectRange.value) return null

  const dayIndex = Math.floor(pixel / 33) // 33px per day
  const startDate = projectRange.value.startDate
  const targetDay = new Date(startDate)
  targetDay.setDate(targetDay.getDate() + dayIndex)

  return formatDate(targetDay)
}

// Convert day to pixel
function dayToPixel(dayStr: string): number {
  if (!projectRange.value) return 0

  const day = toDateUTC(dayStr)
  const startDate = projectRange.value.startDate
  const dayDiff = Math.floor((day.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

  return dayDiff * 33 // 33px per day
}

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

// Map tasks to gantt format
const mappedTasks = computed<GanttTask[]>(() => {
  if (!props.tasks || props.tasks.length === 0) return []

  const tasks = props.tasks
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

      console.log('📊 Task duration:', {
        title: t.name,
        duration_days: t.duration_days,
        start: t.start_planned,
        end: t.end_planned,
        calculated_duration: duration,
        hasEndPlanned: !!t.end_planned,
        endDateCalculated: endDate,
      })

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
    console.log('📅 Header range label:', { start, end, projectRange: projectRange.value })
    return `${start} – ${end}`
  } catch (error) {
    console.warn('Error calculating header range label:', error)
    return 'Loading...'
  }
})

const gridTemplateColumns = computed(() => {
  if (!days.value || days.value.length === 0) {
    return {
      display: 'grid',
      gridTemplateColumns: '240px',
    }
  }

  return {
    display: 'grid',
    gridTemplateColumns: `240px repeat(${days.value.length}, 33px)`,
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

  // Only log during initial render, not during dragging
  if (!isDragging.value) {
    console.log('📏 Bar width calculation:', {
      task: task.title,
      duration: daysDiff,
      calculatedWidth: width,
      finalWidth: Math.max(width, minWidth),
    })
  }

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
  console.log('🎯 Task clicked:', task.title)

  // Force cleanup any lingering drag state
  if (isDragging.value) {
    console.log('🧹 Force cleaning up drag state on task click')
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

  console.log('📅 Highlighting dates:', {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0],
    startDateObj: startDate,
    endDateObj: endDate,
  })

  // Add all days from start to end (inclusive)
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]
    highlightedDays.value.add(dateStr)
    currentDate.setDate(currentDate.getDate() + 1)
  }

  console.log('📅 Highlighted days:', Array.from(highlightedDays.value))
}

// Clear highlighted days
function clearHighlightedDays() {
  highlightedDays.value.clear()
  console.log('📅 Cleared highlighted days')
}

// Handle click on grid
function handleGridClick(event: MouseEvent) {
  // Only clear selection if clicking on the grid background, not on task bars or task labels
  const target = event.target as HTMLElement
  if (target.classList.contains('border-b') && target.classList.contains('border-l')) {
    selectedTask.value = null
    selectedTaskInList.value = null
    clearHighlightedDays()
    console.log('📅 Cleared selection - clicked on grid')
  }
}

// Handle click on task in list
function handleTaskListClick(task: GanttTask) {
  console.log('📋 Task in list clicked:', task.title)
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

  console.log('📜 Scrolling to task:', {
    title: task.title,
    taskCenterPosition,
    viewportWidth,
    scrollTo: centerPosition,
  })
}

function handleTaskMouseDown(task: GanttTask, event: MouseEvent) {
  console.log('🖱️ Task mouse down:', task.title)

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

  console.log(
    '🔄 Dragging task:',
    dragStartTask.value.title,
    'deltaX:',
    deltaX,
    'dragOffset:',
    dragOffset.value,
  )
}

function handleMouseUp() {
  console.log(
    '🖱️ Mouse up event triggered, isDragging:',
    isDragging.value,
    'dragStartTask:',
    dragStartTask.value?.title,
  )

  // Only process if we were actually dragging
  if (!dragStartTask.value) return

  console.log('🖱️ Task drag ended:', dragStartTask.value.title)

  // Calculate new position BEFORE resetting dragOffset
  if (dragOffset.value !== 0 && projectRange.value) {
    const task = dragStartTask.value
    const originalStart = new Date(originalTaskStart.value)
    const originalEnd = new Date(originalTaskEnd.value)

    // Get the exact pixel position of the original task from dayPixelMap
    const originalDayInfo = dayPixelMap.value.get(originalTaskStart.value)
    if (!originalDayInfo) {
      console.error('❌ Original task day not found in pixel map:', originalTaskStart.value)
      return
    }

    const originalStartPixel = originalDayInfo.pixelStart

    // Calculate the new pixel position after drag
    const newStartPixel = originalStartPixel + dragOffset.value

    console.log('📍 Original task position:', {
      originalTaskStart: originalTaskStart.value,
      originalStartPixel,
      dragOffset: dragOffset.value,
      newStartPixel,
    })

    // Calculate which day this pixel position corresponds to
    const dayIndex = Math.floor(newStartPixel / 33)
    const startDate = projectRange.value.startDate
    const targetDay = new Date(startDate)
    targetDay.setDate(targetDay.getDate() + dayIndex)
    const newStartDateStr = formatDate(targetDay)

    // Get the day info from the map
    const dayPixelInfo = dayPixelMap.value.get(newStartDateStr)
    if (!dayPixelInfo) {
      console.error('❌ Target day not found in pixel map:', newStartDateStr)
      return
    }

    const targetDayInfo = { dayStr: newStartDateStr, dayInfo: dayPixelInfo }

    console.log('🔍 Pixel calculation debug:', {
      originalTaskStart: originalTaskStart.value,
      originalStartPixel,
      dragOffset: dragOffset.value,
      newStartPixel,
      newStartDateStr,
      dayIndex,
      targetPixelStart: dayPixelInfo.pixelStart,
    })

    console.log('🎯 Target day pixel info:', {
      day: newStartDateStr,
      pixelStart: dayPixelInfo.pixelStart,
      pixelEnd: dayPixelInfo.pixelEnd,
    })

    // Use the exact start date from the target day
    const newStart = new Date(newStartDateStr)

    // Calculate duration in days
    const durationDays =
      Math.ceil((originalEnd.getTime() - originalStart.getTime()) / (1000 * 60 * 60 * 24)) + 1

    // Calculate new end date
    const newEnd = new Date(newStart)
    newEnd.setDate(newEnd.getDate() + durationDays - 1)

    console.log('🔢 Precise drag calculation:', {
      originalStart: originalTaskStart.value,
      originalEnd: originalTaskEnd.value,
      originalStartPixel,
      dragOffset: dragOffset.value,
      newStartPixel,
      newStartDateStr,
      durationDays,
      newStart: newStart.toISOString().split('T')[0],
      newEnd: newEnd.toISOString().split('T')[0],
    })

    console.log('📅 Updating task dates:', {
      task: task.title,
      originalStart: originalTaskStart.value,
      originalEnd: originalTaskEnd.value,
      newStart: newStart.toISOString().split('T')[0],
      newEnd: newEnd.toISOString().split('T')[0],
      dragOffset: dragOffset.value,
    })

    // Update the task in the tasks array
    const taskIndex = props.tasks?.findIndex((t) => Number(t.id) === task.id)
    if (taskIndex !== undefined && taskIndex >= 0 && props.tasks) {
      props.tasks[taskIndex] = {
        ...props.tasks[taskIndex],
        start_planned: newStart.toISOString().split('T')[0],
        end_planned: newEnd.toISOString().split('T')[0],
      }
      console.log('✅ Task updated successfully')

      // Update highlighted days for the moved task
      if (newStart && newEnd && !isNaN(newStart.getTime()) && !isNaN(newEnd.getTime())) {
        updateHighlightedDays(newStart, newEnd)
      } else {
        console.warn('Invalid dates for highlighting:', { newStart, newEnd })
      }

      // Reset drag offset immediately after updating data
      dragOffset.value = 0
    }
  }

  // Force cleanup regardless of state
  isDragging.value = false
  dragStartX.value = 0
  dragStartTask.value = null
  dragOffset.value = 0
  originalTaskStart.value = ''
  originalTaskEnd.value = ''

  // Remove global event listeners immediately
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)

  // Additional aggressive cleanup
  setTimeout(() => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    // Force reset all drag-related state
    isDragging.value = false
    dragOffset.value = 0
  }, 50)

  // Calculate final position using pixel mapping
  const currentDragOffset = dragOffset.value
  const originalPixel = dayToPixel(originalTaskStart.value)
  const newPixel = originalPixel + currentDragOffset
  const newDayStr = pixelToDay(newPixel)

  if (dragStartTask.value && newDayStr && newDayStr !== originalTaskStart.value) {
    const newStart = newDayStr
    const newEnd = dragStartTask.value.milestone
      ? newStart
      : addDays(
          new Date(originalTaskEnd.value),
          Math.floor(
            (new Date(newStart).getTime() - new Date(originalTaskStart.value).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        )
          .toISOString()
          .split('T')[0]

    // Update the task directly in props.tasks
    const taskIndex = props.tasks?.findIndex((t) => Number(t.id) === dragStartTask.value!.id)
    if (taskIndex !== -1 && props.tasks) {
      props.tasks[taskIndex] = {
        ...props.tasks[taskIndex],
        start_planned: newStart,
        end_planned: newEnd,
      }
      console.log('✅ Task moved to new position:', {
        originalPixel,
        newPixel,
        originalDay: originalTaskStart.value,
        newDay: newStart,
        task: dragStartTask.value.title,
      })
    }
  }
}

// Resize handlers
function handleResizeStart(task: GanttTask, event: MouseEvent, type: 'start' | 'end') {
  console.log('🔧 Resize started:', task.title, type)
  isResizing.value = true
  resizeType.value = type
  resizeStartX.value = event.clientX
  resizeStartTask.value = task

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
    console.log(
      '🔧 Resizing task:',
      resizeStartTask.value.title,
      resizeType.value,
      'by',
      daysMoved,
      'days',
    )

    const taskIndex = mappedTasks.value.findIndex((t) => t.id === resizeStartTask.value!.id)
    if (taskIndex !== -1) {
      const task = mappedTasks.value[taskIndex]
      let newStart = new Date(task.start)
      let newEnd = new Date(task.end)

      if (resizeType.value === 'start') {
        // Resize start - move start date
        newStart = addDays(newStart, daysMoved)
        // Ensure end date is not before start date
        if (newEnd < newStart) {
          newEnd = addDays(newStart, 1) // Minimum 1 day duration
        }
      } else if (resizeType.value === 'end') {
        // Resize end - move end date
        newEnd = addDays(newEnd, daysMoved)
        // Ensure end date is not before start date
        if (newEnd < newStart) {
          newEnd = addDays(newStart, 1) // Minimum 1 day duration
        }
      }

      // Update the task in the array
      mappedTasks.value[taskIndex] = {
        ...task,
        start: newStart.toISOString().split('T')[0],
        end: newEnd.toISOString().split('T')[0],
        duration: Math.ceil((newEnd.getTime() - newStart.getTime()) / (1000 * 60 * 60 * 24)) + 1,
      }

      console.log('📅 Task resized:', {
        title: task.title,
        type: resizeType.value,
        oldStart: task.start,
        oldEnd: task.end,
        newStart: mappedTasks.value[taskIndex].start,
        newEnd: mappedTasks.value[taskIndex].end,
        newDuration: mappedTasks.value[taskIndex].duration,
      })
    }
  }
}

function handleResizeEnd() {
  if (!isResizing.value || !resizeStartTask.value) return

  console.log('🔧 Resize ended:', resizeStartTask.value.title)

  // Reset resize state
  isResizing.value = false
  resizeType.value = null
  resizeStartX.value = 0
  resizeStartTask.value = null

  // Remove global event listeners
  document.removeEventListener('mousemove', handleResizeMove)
  document.removeEventListener('mouseup', handleResizeEnd)
}
</script>

<style scoped>
.project-gantt {
  gap: 0.75rem;
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

<template>
  <div class="project-gantt flex-1 flex flex-col">
    <!-- Header -->
    <div class="bg-white rounded-lg shadow p-3 mb-3 flex items-center justify-between">
      <div class="text-sm text-gray-700 font-medium">Gantt Chart</div>
      <div class="flex items-center gap-4">
        <!-- Dependencies Toggle -->
        <button
          @click="showDependencies = !showDependencies"
          class="flex items-center gap-2 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          :class="{ 'bg-green-100 text-green-700': showDependencies }"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
          </svg>
          {{ showDependencies ? 'Hide Dependencies' : 'Show Dependencies' }}
        </button>
        <!-- Clear Dependencies -->
        <button
          @click="clearAllDependencies"
          class="flex items-center gap-2 px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
          Clear All Dependencies
        </button>
        <!-- Sort Toggle -->
        <button
          @click="toggleSortByStartDate"
          class="flex items-center gap-2 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          :class="{ 'bg-blue-100 text-blue-700': sortByStartDate }"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
          </svg>
          {{ sortByStartDate ? 'Sort by Start Date' : 'Manual Order' }}
        </button>

        <!-- Range Info -->
      <div class="flex items-center gap-2 text-xs text-gray-500">
        <span>Range:</span>
        <span class="font-medium">{{ headerRangeLabel }}</span>
      </div>
    </div>

            </div>

    <!-- Gantt Chart Container -->
    <div class="gantt-main-container" :key="componentKey">
      <!-- Left Panel: Task List -->
      <div class="gantt-left-panel" ref="leftPanelRef" @click="handleLeftPanelClick">
        <!-- Task List Header -->
        <div class="gantt-header-row">
          <div class="gantt-task-header">
            <div class="flex items-center gap-2">
              <span>Task</span>
              <span v-if="!sortByStartDate" class="text-xs text-gray-400">
                (drag to reorder)
              </span>
            </div>
          </div>
          </div>

        <!-- Task List -->
        <div class="gantt-task-list">
          <div
            v-for="task in mappedTasks"
            :key="task.id"
            class="gantt-task-row"
            :class="{
              'selected': selectedTask?.id === task.id,
              'dragging': draggedTask?.id === task.id,
              'drag-over': dragOverTask?.id === task.id
            }"
            :draggable="!sortByStartDate"
            @click="console.log('🎯 List item clicked:', task.title); handleTaskListClick(task)"
            @contextmenu="handleTaskListContextMenu(task, $event)"
            @dragstart="handleTaskListDragStart(task, $event)"
            @dragover="handleTaskListDragOver(task, $event)"
            @dragleave="handleTaskListDragLeave"
            @drop="handleTaskListDrop(task, $event)"
          >
            <div class="gantt-task-cell">
              <div class="flex items-center justify-between w-full">
                <div class="flex items-center gap-2 flex-1 min-w-0">
                  <!-- Drag Handle -->
                  <div
                    v-if="!sortByStartDate"
                    class="drag-handle flex-shrink-0 cursor-move text-gray-600 hover:text-gray-800 transition-colors"
                    title="Drag to reorder"
                  >
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 6h2v2H8V6zm0 4h2v2H8v-2zm0 4h2v2H8v-2zm6-8h2v2h-2V6zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2z"/>
                    </svg>
                  </div>

                  <!-- Task Number -->
                  <span class="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0 font-mono">
                    {{ mappedTasks.findIndex(t => t.id === task.id) + 1 }}
                  </span>

                  <!-- Task Title -->
                <span class="truncate">{{ task.title }}</span>
                </div>

                <!-- Duration Badge -->
                <span class="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded flex-shrink-0">
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
            :key="`${day.toISOString().split('T')[0]}-${selectedTask?.id || 'none'}-${idx}`"
            class="gantt-day-header"
            :class="getDayHeaderClasses(day)"
            :style="isMonthBoundary(day) ? 'font-size:12px;color:green;' : ''"
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
                  transform: isDragging && dragStartTask?.id === task.id
                    ? `translateY(-50%) translateX(${dragOffset}px)`
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
                  <span v-if="task.milestone" class="text-sm mr-1">{{ getMilestoneTypeIcon(task.milestone_type) }}</span>
                  <span v-else class="text-sm mr-1">📝</span>
                  {{ task.title }}
                  <!-- Dependency indicators -->
                  <span v-if="task.dependencies && task.dependencies.length > 0" class="ml-1 text-xs bg-white bg-opacity-20 px-1 rounded">
                    📋{{ task.dependencies.length }}
                  </span>
                </span>

                <!-- Resize handles - only show for selected task (not milestones) -->
                <div
                  v-if="selectedTask?.id === task.id && canEdit && !task.milestone"
                  class="resize-handle absolute -left-1 top-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-w-resize shadow-md z-10"
                  style="transform: translateY(-50%)"
                  @mousedown.stop="handleResizeStart(task, $event, 'start')"
                  title="Resize start"
                ></div>
                <div
                  v-if="selectedTask?.id === task.id && canEdit && !task.milestone"
                  class="resize-handle absolute -right-1 top-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-e-resize shadow-md z-10"
                  style="transform: translateY(-50%)"
                  @mousedown.stop="handleResizeStart(task, $event, 'end')"
                  title="Resize end"
                ></div>
              </div>
            </div>
          </div>

          <!-- Dependency Arrows SVG Layer -->
          <svg
            v-if="showDependencies"
            class="dependency-arrows absolute inset-0 pointer-events-none z-10"
            :width="projectRange ? (projectRange.totalDays * 33) : 0"
            :height="mappedTasks.length * 32"
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#6b7280"
                />
              </marker>
            </defs>
            <!-- All dependency lines removed -->
          </svg>
        </div>
      </div>
    </div>

    <!-- Task Dialog -->
    <TaskDialog
      :is-open="taskDialog.isOpen"
      :mode="taskDialog.mode"
      :task="taskDialog.task"
      :project-id="projectId || 0"
      :available-tasks="props.tasks || []"
      :initial-date="taskDialog.initialDate"
      @close="closeTaskDialog"
      @save="(taskData: Partial<Task>) => handleTaskSave(taskData as TaskCreateUpdate)"
      @delete="handleTaskDelete"
      @duplicate="handleTaskDuplicate"
    />

    <!-- Task View Dialog -->
    <TaskViewDialog
      :is-open="taskViewDialog.isOpen"
      :task="taskViewDialog.task"
      :available-tasks="props.tasks || []"
      :can-edit="canEdit"
      @close="closeTaskViewDialog"
    />

    <!-- Milestone Dialog -->
    <MilestoneDialog
      :is-open="milestoneDialog.isOpen"
      :mode="milestoneDialog.mode"
      :task="milestoneDialog.task"
      :project-id="projectId || 0"
      :available-tasks="props.tasks || []"
      :initial-date="milestoneDialog.initialDate"
      @close="closeMilestoneDialog"
      @save="(taskData: Partial<Task>) => handleTaskSave(taskData as TaskCreateUpdate)"
      @delete="handleTaskDelete"
      @duplicate="handleTaskDuplicate"
    />

    <!-- Context Menu -->
    <div
      v-if="contextMenu.isOpen"
      class="fixed z-50 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[160px]"
      :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }"
      @click.stop
    >
      <button
        @click="handleContextMenuView"
        class="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
        </svg>
        View Details
      </button>
      <button
        v-if="canEdit"
        @click="handleContextMenuEdit"
        class="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
        </svg>
        Edit Task
      </button>
      <button
        v-if="canEdit"
        @click="handleContextMenuDelete"
        class="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
        Delete Task
      </button>
    </div>

    <!-- Backdrop to close context menu -->
    <div
      v-if="contextMenu.isOpen"
      class="fixed inset-0 z-40"
      @click="closeContextMenu"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import type { Task, TaskCreateUpdate, MilestoneType } from '@/core/types/task'
import { tasksApi } from '@/core/utils/tasks-api'
import { getMilestoneTypeIcon } from '@/core/utils/task-utils'
import TaskDialog from './TaskDialog.vue'
import TaskViewDialog from './TaskViewDialog.vue'
import MilestoneDialog from './MilestoneDialog.vue'

defineOptions({ name: 'ProjectGantt' })

interface Props {
  projectId?: number
  canEdit?: boolean
  tasks?: Task[]
  projectStartDate?: string
  projectEndDate?: string
  dynamicRange?: boolean // If true, range updates based on task positions
  selectedTaskFromParent?: Task | null // Task selected in parent component
}

const props = withDefaults(defineProps<Props>(), {
  projectId: undefined,
  canEdit: false,
  tasks: () => [],
  projectStartDate: undefined,
  projectEndDate: undefined,
  dynamicRange: false,
  selectedTaskFromParent: null,
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
  milestone_type?: MilestoneType
  task_type?: string
  dependencies?: Array<{
    predecessor_id: number
    type: 'FS' | 'SS' | 'FF' | 'SF'
    lag_days: number
  }>
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

// Force update trigger
// const forceUpdate = ref(0) // Removed unused variable

// Force component re-render
const componentKey = ref(0)
const forceRerender = () => {
  componentKey.value++
}

// Highlighted days logic moved to getDayHeaderClasses function

// Selected task in the list
const selectedTaskInList = ref<GanttTask | null>(null)

// Show/hide dependencies toggle
const showDependencies = ref(true)

// Sort toggle - default to task_order
const sortByStartDate = ref(false)

// Drag-drop reordering
const isReordering = ref(false)
const draggedTask = ref<GanttTask | null>(null)
const dragOverTask = ref<GanttTask | null>(null)

// Modal dialog states
const taskDialog = ref({
  isOpen: false,
  mode: 'create' as 'create' | 'edit' | 'view',
  task: null as Task | null,
  initialDate: undefined as string | undefined,
})

const taskViewDialog = ref({
  isOpen: false,
  task: null as Task | null,
})

const milestoneDialog = ref({
  isOpen: false,
  mode: 'create' as 'create' | 'edit' | 'view',
  task: null as Task | null,
  initialDate: undefined as string | undefined,
})

// Context menu state
const contextMenu = ref({
  isOpen: false,
  x: 0,
  y: 0,
  task: null as GanttTask | null,
})

// Emit to parent component to reload tasks with sorting
const emit = defineEmits<{
  'sort-changed': [sortBy: 'start_date' | 'task_order']
  'task-order-updated': [taskOrderData: { projectId: number; order: number[] }]
  'task-created': [task: Task]
  'task-updated': [task: Task]
  'task-deleted': [taskId: string]
  'task-selected': [task: Task | null]
}>()

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

  // Sort by task_order if available, otherwise by start date
  const sortedTasks = [...tasksToUse].sort((a, b) => {
    if (sortByStartDate.value) {
      // Sort by start date
      const aStart = a.start_planned ? new Date(a.start_planned) : new Date()
      const bStart = b.start_planned ? new Date(b.start_planned) : new Date()
      return aStart.getTime() - bStart.getTime()
    } else {
      // Sort by task_order (from backend)
      const aOrder = a.task_order || 0
      const bOrder = b.task_order || 0
      return aOrder - bOrder
    }
  })

  const tasks = sortedTasks
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
        milestone_type: t.milestone_type,
        task_type: undefined,
        dependencies: Array.isArray(t.dependencies) && t.dependencies.length > 0 && typeof t.dependencies[0] === 'object'
          ? t.dependencies as Array<{ predecessor_id: number; type: 'FS' | 'SS' | 'FF' | 'SF'; lag_days: number }>
          : [],
      }
    })

  return tasks
})

// Flag to prevent circular updates
const isInternalUpdate = ref(false)

// Watch for selected task changes from parent component
watch(() => props.selectedTaskFromParent, (newSelectedTask) => {
  if (isInternalUpdate.value) {
    console.log('🎯 Skipping circular update')
    return
  }

  if (newSelectedTask) {
    console.log('🎯 Auto-selecting task in Gantt from parent:', newSelectedTask.name)
    const ganttTask = mappedTasks.value.find(t => Number(t.id) === Number(newSelectedTask.id))
    if (ganttTask) {
      // Select the task
      selectedTask.value = ganttTask
      selectedTaskInList.value = ganttTask

      // Update highlighted days
      // Highlighted days now calculated in getDayHeaderClasses

      // Force component re-render to update day headers
      nextTick(() => {
        forceRerender()
      })

      // No auto-scroll when task is selected from parent
    }
  } else {
    // Clear selection if parent task is null
    console.log('🎯 Clearing task selection in Gantt - parent task is null')
    selectedTask.value = null
    selectedTaskInList.value = null
    // Highlighted days now calculated in getDayHeaderClasses

    // Don't emit null to parent - this would clear selection in other views
    // Only emit null when user explicitly deselects (clicks empty area)
    console.log('🎯 Not emitting task-selected null to avoid clearing other views')
  }
}, { immediate: true })

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
  // const dayStr = formatDate(day) // Removed unused variable
  const startStr = task.start
  const dayStr = formatDate(day)

  return dayStr === startStr
}

// Check if this day is the first day of a month
function isMonthBoundary(day: Date): boolean {
  return day.getUTCDate() === 1
}

// Check if this day is a weekend (Saturday or Sunday)
function isWeekend(day: Date): boolean {
  const dayOfWeek = day.getUTCDay()
  return dayOfWeek === 0 || dayOfWeek === 6 // Sunday = 0, Saturday = 6
}

// Get task bar style for a specific day
function getTaskBarStyle(task: GanttTask, day: Date): Record<string, string> {
  // const dayStr = formatDate(day) // Removed unused variable
  const startStr = task.start
  const dayStr = formatDate(day)

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

// Dependency arrow calculation functions
// function getTaskPosition(task: GanttTask): { row: number; startX: number; endX: number; centerY: number } { // Removed unused function
//   const taskIndex = mappedTasks.value.findIndex(t => t.id === task.id)
//   if (taskIndex === -1) return { row: 0, startX: 0, endX: 0, centerY: 0 }

//   const row = taskIndex
//   const startDate = new Date(task.start)
//   const endDate = new Date(task.end)

//   // Calculate X positions based on project range
//   if (!projectRange.value) return { row, startX: 0, endX: 0, centerY: 0 }

//   const projectStart = new Date(projectRange.value.startDate)
//   const startDays = Math.floor((startDate.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24))
//   const endDays = Math.floor((endDate.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24))

//   const startX = startDays * 33 + 16 // 16px for half cell width
//   const endX = (endDays + 1) * 33 - 16 // 16px for half cell width
//   const centerY = row * 32 + 16 // 32px row height, 16px for center

//   return { row, startX, endX, centerY }
// }

// function getDependencyArrows(): Array<{
//   from: { x: number; y: number }
//   to: { x: number; y: number }
//   type: string
//   lagDays: number
// }> {
//   const arrows: Array<{
//     from: { x: number; y: number }
//     to: { x: number; y: number }
//     type: string
//     lagDays: number
//   }> = []

//   mappedTasks.value.forEach(task => {
//     if (!task.dependencies || task.dependencies.length === 0) return

//     const taskPos = getTaskPosition(task)
//     if (!taskPos) return

//     task.dependencies.forEach(dep => {
//       const predecessor = mappedTasks.value.find(t => t.id === dep.predecessor_id)
//       if (!predecessor) return

//       const predPos = getTaskPosition(predecessor)
//       if (!predPos) return

//       let fromX: number, fromY: number, toX: number, toY: number

//       switch (dep.type) {
//         case 'FS': // Finish-to-Start
//           fromX = predPos.endX
//           fromY = predPos.centerY
//           toX = taskPos.startX
//           toY = taskPos.centerY
//           break
//         case 'SS': // Start-to-Start
//           fromX = predPos.startX
//           fromY = predPos.centerY
//           toX = taskPos.startX
//           toY = taskPos.centerY
//           break
//         case 'FF': // Finish-to-Finish
//           fromX = predPos.endX
//           fromY = predPos.centerY
//           toX = taskPos.endX
//           toY = taskPos.centerY
//           break
//         case 'SF': // Start-to-Finish
//           fromX = predPos.startX
//           fromY = predPos.centerY
//           toX = taskPos.endX
//           toY = taskPos.centerY
//           break
//         default:
//           return
//       }

//       arrows.push({
//         from: { x: fromX, y: fromY },
//         to: { x: toX, y: toY },
//         type: dep.type,
//         lagDays: dep.lag_days
//       })
//     })
//   })

//   return arrows
// }

// Dependency validation functions
function validateDependencies(task: GanttTask, newStart: Date, newEnd: Date): { valid: boolean; conflicts: string[] } {
  const conflicts: string[] = []

  if (!task.dependencies || task.dependencies.length === 0) {
    return { valid: true, conflicts: [] }
  }

  task.dependencies.forEach(dep => {
    const predecessor = mappedTasks.value.find(t => t.id === dep.predecessor_id)
    if (!predecessor) return

    const predStart = new Date(predecessor.start)
    const predEnd = new Date(predecessor.end)

    switch (dep.type) {
      case 'FS': // Finish-to-Start: Task cannot start before predecessor finishes + lag
        const minStartDate = new Date(predEnd)
        minStartDate.setDate(minStartDate.getDate() + dep.lag_days)
        if (newStart < minStartDate) {
          conflicts.push(`${task.title} cannot start before ${predecessor.title} finishes + ${dep.lag_days} days`)
        }
        break

      case 'SS': // Start-to-Start: Task cannot start before predecessor starts + lag
        const minSSStartDate = new Date(predStart)
        minSSStartDate.setDate(minSSStartDate.getDate() + dep.lag_days)
        if (newStart < minSSStartDate) {
          conflicts.push(`${task.title} cannot start before ${predecessor.title} starts + ${dep.lag_days} days`)
        }
        break

      case 'FF': // Finish-to-Finish: Task cannot finish before predecessor finishes + lag
        const minFFEndDate = new Date(predEnd)
        minFFEndDate.setDate(minFFEndDate.getDate() + dep.lag_days)
        if (newEnd < minFFEndDate) {
          conflicts.push(`${task.title} cannot finish before ${predecessor.title} finishes + ${dep.lag_days} days`)
        }
        break

      case 'SF': // Start-to-Finish: Task cannot finish before predecessor starts + lag
        const minSFEndDate = new Date(predStart)
        minSFEndDate.setDate(minSFEndDate.getDate() + dep.lag_days)
        if (newEnd < minSFEndDate) {
          conflicts.push(`${task.title} cannot finish before ${predecessor.title} starts + ${dep.lag_days} days`)
        }
        break
    }
  })

  return { valid: conflicts.length === 0, conflicts }
}

function findDependentTasks(taskId: number): GanttTask[] {
  return mappedTasks.value.filter(task =>
    task.dependencies && task.dependencies.some(dep => dep.predecessor_id === taskId)
  )
}

function cascadeMoveDependentTasks(movedTaskId: number, newStart: Date, newEnd: Date) {
  const dependentTasks = findDependentTasks(movedTaskId)

  dependentTasks.forEach(dependentTask => {
    const dep = dependentTask.dependencies?.find(d => d.predecessor_id === movedTaskId)
    if (!dep) return

    const originalStart = new Date(dependentTask.start)
    const originalEnd = new Date(dependentTask.end)
    const duration = originalEnd.getTime() - originalStart.getTime()

    let newDependentStart: Date
    let newDependentEnd: Date

    switch (dep.type) {
      case 'FS': // Finish-to-Start: Dependent starts after predecessor finishes + lag
        newDependentStart = new Date(newEnd)
        newDependentStart.setDate(newDependentStart.getDate() + dep.lag_days)
        newDependentEnd = new Date(newDependentStart.getTime() + duration)
        break

      case 'SS': // Start-to-Start: Dependent starts when predecessor starts + lag
        newDependentStart = new Date(newStart)
        newDependentStart.setDate(newDependentStart.getDate() + dep.lag_days)
        newDependentEnd = new Date(newDependentStart.getTime() + duration)
        break

      case 'FF': // Finish-to-Finish: Dependent finishes when predecessor finishes + lag
        newDependentEnd = new Date(newEnd)
        newDependentEnd.setDate(newDependentEnd.getDate() + dep.lag_days)
        newDependentStart = new Date(newDependentEnd.getTime() - duration)
        break

      case 'SF': // Start-to-Finish: Dependent finishes when predecessor starts + lag
        newDependentEnd = new Date(newStart)
        newDependentEnd.setDate(newDependentEnd.getDate() + dep.lag_days)
        newDependentStart = new Date(newDependentEnd.getTime() - duration)
        break

      default:
        return
    }

    // Update the dependent task in local state
    const taskIndex = localTasks.value.findIndex(t => Number(t.id) === dependentTask.id)
    if (taskIndex !== -1) {
      localTasks.value[taskIndex] = {
        ...localTasks.value[taskIndex],
        start_planned: newDependentStart.toISOString().split('T')[0],
        end_planned: newDependentEnd.toISOString().split('T')[0],
      }

      console.log(`🔄 Cascaded move: ${dependentTask.title} to ${newDependentStart.toISOString().split('T')[0]} - ${newDependentEnd.toISOString().split('T')[0]}`)

      // Recursively cascade to tasks that depend on this one
      cascadeMoveDependentTasks(dependentTask.id, newDependentStart, newDependentEnd)
    }
  })
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
  console.log('🎯 handleTaskClick called (FROM GRID - NO SCROLL):', task.title)
  console.log('🎯 Current scroll position before:', rightPanelRef.value?.scrollLeft)

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
  // Highlighted days are now computed automatically

  // NO SCROLL when clicking on task bar - preserve current scroll position
  console.log('🎯 Current scroll position after:', rightPanelRef.value?.scrollLeft)

  // Emit selected task to parent component
  const fullTask = props.tasks?.find(t => Number(t.id) === Number(task.id))
  if (fullTask) {
    isInternalUpdate.value = true
    emit('task-selected', fullTask)
    nextTick(() => {
      isInternalUpdate.value = false
    })
  }
}

// Modal dialog functions

function openTaskDialog(mode: 'create' | 'edit' | 'view', taskId?: string | number | null, initialDate?: string) {
  if (taskId) {
    const task = props.tasks?.find(t => String(t.id) === String(taskId))
    if (task) {
      taskDialog.value = {
        isOpen: true,
        mode,
        task,
        initialDate: undefined,
      }
    }
  } else {
    taskDialog.value = {
      isOpen: true,
      mode,
      task: null,
      initialDate,
    }
  }
}

function openTaskViewDialog(task: GanttTask) {
  const fullTask = props.tasks?.find(t => Number(t.id) === Number(task.id))
  if (fullTask) {
    taskViewDialog.value = {
      isOpen: true,
      task: fullTask,
    }
  }
}

function closeTaskDialog() {
  taskDialog.value.isOpen = false
  taskDialog.value.task = null
}

function closeTaskViewDialog() {
  taskViewDialog.value.isOpen = false
  taskViewDialog.value.task = null
}

function closeMilestoneDialog() {
  milestoneDialog.value.isOpen = false
  milestoneDialog.value.task = null
}

// Task management handlers
async function handleTaskSave(taskData: TaskCreateUpdate) {
  try {
    console.log('💾 Saving task in Gantt:', taskData)
    console.log('💾 Dialog mode:', taskDialog.value.mode)
    console.log('💾 Dialog task:', taskDialog.value.task)

    if (taskDialog.value.mode === 'edit' && taskDialog.value.task) {
      // Update existing task
      console.log('💾 Updating existing task:', taskDialog.value.task.id)
      const updatedTask = await tasksApi.update(props.projectId || 0, String(taskDialog.value.task.id), taskData)
      console.log('✅ Task updated successfully:', updatedTask)
      emit('task-updated', updatedTask)
    } else {
      // Create new task
      console.log('💾 Creating new task')
      const newTask = await tasksApi.create(props.projectId || 0, taskData)
      console.log('✅ Task created successfully:', newTask)
      emit('task-created', newTask)
    }

    console.log('💾 Closing dialog after successful save')
    closeTaskDialog()
  } catch (error) {
    console.error('❌ Error saving task:', error)
    console.error('❌ Error details:', error)
    // Don't close dialog on error so user can retry
  }
}

async function handleTaskDelete(taskId: string) {
  try {
    await tasksApi.delete(props.projectId || 0, taskId)
    emit('task-deleted', taskId)
    closeTaskDialog()
  } catch (error) {
    console.error('Error deleting task:', error)
  }
}

async function handleTaskDuplicate(task: Task) {
  try {
    const duplicateData: TaskCreateUpdate = {
      name: `${task.name} (Copy)`,
      start_planned: task.start_planned,
      end_planned: task.end_planned,
      duration_days: task.duration_days,
      milestone: task.milestone,
      milestone_type: task.milestone_type,
      status: task.status,
      progress_pct: task.progress_pct,
      notes: task.notes,
      task_lead_id: task.task_lead_id,
      team_members: task.team_members,
      resources: task.resources,
      dependencies: Array.isArray(task.dependencies) && task.dependencies.length > 0 && typeof task.dependencies[0] === 'object'
        ? task.dependencies as Array<{ predecessor_id: number; type: string; lag_days: number }>
        : undefined,
    }
    const newTask = await tasksApi.create(props.projectId || 0, duplicateData)
    emit('task-created', newTask)
    closeTaskDialog()
  } catch (error) {
    console.error('Error duplicating task:', error)
  }
}

// Context menu functions
function handleTaskListContextMenu(task: GanttTask, event: MouseEvent) {
  event.preventDefault()
  contextMenu.value = {
    isOpen: true,
    x: event.clientX,
    y: event.clientY,
    task,
  }
}

function closeContextMenu() {
  contextMenu.value.isOpen = false
  contextMenu.value.task = null
}

function handleContextMenuEdit() {
  if (contextMenu.value.task) {
    openTaskDialog('edit', String(contextMenu.value.task.id))
  }
  closeContextMenu()
}

function handleContextMenuView() {
  if (contextMenu.value.task) {
    openTaskViewDialog(contextMenu.value.task)
  }
  closeContextMenu()
}

function handleContextMenuDelete() {
  if (contextMenu.value.task) {
    const fullTask = props.tasks?.find(t => Number(t.id) === Number(contextMenu.value.task?.id))
    if (fullTask) {
      handleTaskDelete(String(fullTask.id))
    }
  }
  closeContextMenu()
}


// Clear highlighted days function removed - now calculated inline

// Check if task is locked due to dependencies
// function isTaskLocked(task: GanttTask): boolean { // Removed unused function
//   const currentTask = localTasks.value.find(t => t.id === task.id)
//   if (!currentTask || !currentTask.dependencies || currentTask.dependencies.length === 0) {
//     return false
//   }

//   // Check if any predecessor is locked/started
//   return currentTask.dependencies.some(dep => {
//     const predecessor = localTasks.value.find(t => t.id === dep.predecessor_id)
//     if (!predecessor) return false

//     // Check if predecessor has started (current date >= start date)
//     const today = new Date()
//     const predStart = new Date(predecessor.start_planned + 'T00:00:00.000Z')
//     return today >= predStart
//   })
// }

// Clear all dependencies from all tasks
async function clearAllDependencies() {
  console.log('🧹 Clearing all dependencies...')

  for (const task of localTasks.value) {
    if (task.dependencies && task.dependencies.length > 0) {
      console.log(`🧹 Clearing dependencies for task: ${task.name}`)

      // Update local state
      const taskIndex = localTasks.value.findIndex(t => t.id === task.id)
      if (taskIndex !== -1) {
        localTasks.value[taskIndex].dependencies = []

        // Update backend (you'll need to implement this API call)
        try {
          // await tasksApi.updateDependencies(props.projectId || 0, task.id, [])
          console.log(`✅ Cleared dependencies for task: ${task.name}`)
        } catch (error) {
          console.error(`❌ Failed to clear dependencies for task: ${task.name}`, error)
        }
      }
    }
  }

  console.log('✅ All dependencies cleared!')
}

// Get CSS classes for day header
function getDayHeaderClasses(day: Date) {
  // const dayStr = day.toISOString().split('T')[0] // Removed unused variable
  // Simple check: if we have a selected task, check if this day is within its range
  let isHighlighted = false
  let isDragHighlighted = false

  if (selectedTask.value) {
    const currentTask = localTasks.value.find(t => Number(t.id) === Number(selectedTask.value?.id))
    if (currentTask) {
      const startDate = new Date(currentTask.start_planned + 'T00:00:00.000Z')
      const endDate = new Date(currentTask.end_planned + 'T00:00:00.000Z')
      const dayDate = new Date(day) // Use the original day object directly

      isHighlighted = dayDate >= startDate && dayDate <= endDate

      // Debug logging removed - highlighting works correctly
    }
  }

  // Check if we're dragging and highlight the new position
  if (isDragging.value && dragStartTask.value && Math.abs(dragOffset.value) > 5) {
    const dayIndex = Math.floor(dragOffset.value / 33) // 33px per day
    const originalStart = new Date(originalTaskStart.value)
    const originalEnd = new Date(originalTaskEnd.value)
    const newStart = new Date(originalStart)
    const newEnd = new Date(originalEnd)
    newStart.setDate(newStart.getDate() + dayIndex)
    newEnd.setDate(newEnd.getDate() + dayIndex)

    const dayDate = new Date(day)
    isDragHighlighted = dayDate >= newStart && dayDate <= newEnd
  }

  // Debug logging removed

  const classes = []

  // Month boundary - using bold font for first day of month
  if (isMonthBoundary(day)) {
    classes.push('font-bold') // Bold font for first day of month
  }
  classes.push('border-l') // Simple border for all days

  // Drag highlighted days (preview of new position)
  if (isDragHighlighted) {
    if (isWeekend(day)) {
      classes.push('bg-green-100', 'text-red-600') // Drag preview weekend: green background, red text
    } else {
      classes.push('bg-green-100', 'text-green-700') // Drag preview weekday: green background, green text
    }
  }
  // Regular highlighted days
  else if (isHighlighted) {
    if (isWeekend(day)) {
      classes.push('bg-blue-100', 'text-red-600') // Highlighted weekend: blue background, red text
    } else {
      classes.push('bg-blue-100', 'text-blue-700') // Highlighted weekday: blue background, blue text
    }
  } else {
    if (isWeekend(day)) {
      classes.push('bg-red-50', 'text-red-600', 'border-red-200') // Regular weekend: red background, red text
    } else {
      classes.push('text-gray-500') // Regular weekday: gray text
    }
  }

  return classes
}

// Handle click on grid
function handleGridClick(event: MouseEvent) {
  // Only clear selection if clicking on the grid background, not on task bars or task labels
  const target = event.target as HTMLElement

  // Check if clicking on empty grid cell (day cell) or grid background
  const isGridCell = target.classList.contains('gantt-day-cell') ||
                     target.classList.contains('border-b') && target.classList.contains('border-l')

  // Also check if clicking on the grid container itself
  const isGridContainer = target.classList.contains('gantt-grid-content')

  if (isGridCell || isGridContainer) {
    console.log('🎯 Clearing selection - clicked on empty grid area')
    selectedTask.value = null
    selectedTaskInList.value = null
    // clearHighlightedDays() - function removed, highlighting now calculated inline

    // Emit null to parent component to hide action buttons
    emit('task-selected', null)
  }
}

// Handle click on left panel (task list area)
function handleLeftPanelClick(event: MouseEvent) {
  // Only clear selection if clicking on empty area, not on task items
  const target = event.target as HTMLElement

  // Check if clicking on empty area (not on task items)
  const isTaskItem = target.closest('.gantt-task-row')
  const isTaskHeader = target.closest('.gantt-header-row')

  if (!isTaskItem && !isTaskHeader) {
    console.log('🎯 Clearing selection - clicked on empty left panel area')
    selectedTask.value = null
    selectedTaskInList.value = null
    // clearHighlightedDays() - function removed, highlighting now calculated inline

    // Emit null to parent component to hide action buttons
    emit('task-selected', null)
  }
}

// Handle keyboard events
function handleKeyDown(event: KeyboardEvent) {
  // Clear selection on Escape key
  if (event.key === 'Escape') {
    console.log('🎯 Clearing selection - Escape key pressed')
    selectedTask.value = null
    selectedTaskInList.value = null
    // clearHighlightedDays() - function removed, highlighting now calculated inline

    // Emit null to parent component to hide action buttons
    emit('task-selected', null)
  }
}

// Handle click on task in list
function handleTaskListClick(task: GanttTask) {
  console.log('🎯 handleTaskListClick called (FROM LIST - WITH SCROLL):', task.title, 'Event triggered!')
  selectedTask.value = task
  selectedTaskInList.value = task

  // Highlight days for selected task
  // Highlighted days are now computed automatically

  // Smart auto-scroll: only if task is not visible
  scrollToTask(task)

  // Emit selected task to parent component
  const fullTask = props.tasks?.find(t => Number(t.id) === Number(task.id))
  if (fullTask) {
    isInternalUpdate.value = true
    emit('task-selected', fullTask)
    nextTick(() => {
      isInternalUpdate.value = false
    })
  }
}

// Test dependency line removed

// Auto-scroll to center the task bar in the viewport
function scrollToTask(task: GanttTask) {
  if (!projectRange.value) return

  // Calculate the task's position in the timeline
  const taskStartDate = new Date(task.start)
  const projectStartDate = projectRange.value.startDate
  const daysFromStart = Math.ceil(
    (taskStartDate.getTime() - projectStartDate.getTime()) / (1000 * 60 * 60 * 24),
  )

  // Calculate the start position of the task bar
  const taskStartPosition = daysFromStart * 33 // 33px per day
  const taskEndPosition = taskStartPosition + (task.duration * 33)
  const taskCenterPosition = taskStartPosition + (task.duration * 33) / 2

  // Get the scrollable container (right panel with Gantt grid)
  const scrollContainer = rightPanelRef.value
  if (!scrollContainer) return

  // Check if task is already visible in viewport
  const currentScrollLeft = scrollContainer.scrollLeft
  const viewportWidth = scrollContainer.clientWidth
  const viewportStart = currentScrollLeft
  const viewportEnd = currentScrollLeft + viewportWidth

  // Check if task is within visible area
  const isTaskVisible = taskStartPosition >= viewportStart && taskEndPosition <= viewportEnd

  if (isTaskVisible) {
    console.log('🎯 Task is already visible, no scrolling needed:', task.title)
    return
  }

  // Calculate scroll position based on task location
  const maxScrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth
  let finalScrollLeft = 0

  // If task is at the beginning of project, scroll to start
  if (taskStartPosition < viewportWidth / 2) {
    finalScrollLeft = 0
  }
  // If task is at the end of project, scroll to end
  else if (taskEndPosition > scrollContainer.scrollWidth - viewportWidth / 2) {
    finalScrollLeft = maxScrollLeft
  }
  // Otherwise, center the task
  else {
    const centerPosition = taskCenterPosition - viewportWidth / 2
    finalScrollLeft = Math.max(0, Math.min(centerPosition, maxScrollLeft))
  }

  console.log('🎯 Scrolling to task:', {
    taskName: task.title,
    taskStartPosition,
    taskEndPosition,
    taskCenterPosition,
    viewportWidth,
    finalScrollLeft,
    maxScrollLeft,
    isTaskVisible
  })

  // Scroll to center the task
  console.log('🎯 About to scroll:', {
    scrollContainer: scrollContainer,
    currentScrollLeft: scrollContainer.scrollLeft,
    finalScrollLeft,
    scrollWidth: scrollContainer.scrollWidth,
    clientWidth: scrollContainer.clientWidth
  })

  // Try both methods
  scrollContainer.scrollLeft = finalScrollLeft
  scrollContainer.scrollTo({
    left: finalScrollLeft,
    behavior: 'smooth',
  })

  console.log('🎯 After scroll:', {
    newScrollLeft: scrollContainer.scrollLeft
  })

}

function handleTaskMouseDown(task: GanttTask, event: MouseEvent) {
  console.log('🎯 handleTaskMouseDown called:', task.title)

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

  console.log('🎯 Drag started:', { isDragging: isDragging.value, task: task.title })
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

  console.log('🎯 Mouse move:', { deltaX, dragOffset: dragOffset.value })
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

    // Check if task has dependencies that restrict movement
    const currentTask = localTasks.value.find(t => Number(t.id) === Number(task.id))
    if (currentTask && currentTask.dependencies && currentTask.dependencies.length > 0) {
      // Check if any predecessor is locked/started
      const hasLockedPredecessors = currentTask.dependencies.some(dep => {
        // Check if dep is an object with predecessor_id or just a number
        const predecessorId = typeof dep === 'object' ? dep.predecessor_id : dep
        const predecessor = localTasks.value.find(t => Number(t.id) === Number(predecessorId))
        if (!predecessor) return false

        // Check if predecessor has started (current date >= start date)
        const today = new Date()
        const predStart = new Date(predecessor.start_planned + 'T00:00:00.000Z')
        return today >= predStart
      })

      if (hasLockedPredecessors) {
        console.warn('⚠️ Cannot move task - predecessor has started and is locked')
        // Reset to original position
        cleanupDrag()
        return
      }

      // Validate dependency constraints
      const validation = validateDependencies(task, newStart, newEnd)
      if (!validation.valid) {
        console.warn('⚠️ Cannot move task - violates dependency constraints:', validation.conflicts)
        // Reset to original position
        cleanupDrag()
        return
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

      // Update selectedTask if it's the same task
      if (selectedTask.value && selectedTask.value.id === task.id) {
        selectedTask.value = {
          ...selectedTask.value,
          start: newStart.toISOString().split('T')[0],
          end: newEnd.toISOString().split('T')[0],
        }
        selectedTaskInList.value = selectedTask.value

        // Update highlighted days
        // Highlighted days now calculated in getDayHeaderClasses
      }

      // Cascade move dependent tasks
      cascadeMoveDependentTasks(task.id, newStart, newEnd)

      // Save changes to API
      saveTaskChanges(String(task.id), newStart.toISOString().split('T')[0], newEnd.toISOString().split('T')[0])
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

      // Highlighted days are now computed automatically
      if (newStart && newEnd && !isNaN(newStart.getTime()) && !isNaN(newEnd.getTime())) {
        // Highlighted days are now computed automatically

        // Save changes to API
        saveTaskChanges(String(resizeStartTask.value.id), newStart.toISOString().split('T')[0], newEnd.toISOString().split('T')[0])
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

// Toggle sort by start date
const toggleSortByStartDate = () => {
  sortByStartDate.value = !sortByStartDate.value
  console.log('🔄 Sort by start date:', sortByStartDate.value ? 'enabled' : 'disabled')

  // Emit to parent to reload tasks with new sorting
  emit('sort-changed', sortByStartDate.value ? 'start_date' : 'task_order')
}

// Create task order structure for backend
const createTaskOrderStructure = () => {
  // Use the current order from mappedTasks (which is already sorted by task_order or start_date)
  const order = mappedTasks.value.map(task => task.id)

  return {
    projectId: props.projectId || 0,
    order: order
  }
}

// Drag-drop reordering functions
const handleTaskListDragStart = (task: GanttTask, event: DragEvent) => {
  if (sortByStartDate.value) return // Don't allow reordering when sorted by date

  isReordering.value = true
  draggedTask.value = task
  event.dataTransfer!.effectAllowed = 'move'
  event.dataTransfer!.setData('text/plain', task.id.toString())

  console.log('🔄 Started dragging task:', task.title)
}

const handleTaskListDragOver = (task: GanttTask, event: DragEvent) => {
  if (!isReordering.value || !draggedTask.value) return

  event.preventDefault()
  event.dataTransfer!.dropEffect = 'move'
  dragOverTask.value = task
}

const handleTaskListDragLeave = () => {
  dragOverTask.value = null
}

const handleTaskListDrop = (task: GanttTask, event: DragEvent) => {
  if (!isReordering.value || !draggedTask.value || draggedTask.value.id === task.id) {
    isReordering.value = false
    draggedTask.value = null
    dragOverTask.value = null
    return
  }

  event.preventDefault()

  console.log('🔄 Dropping task:', draggedTask.value.title, 'onto:', task.title)

  // Calculate new order
  const draggedIndex = mappedTasks.value.findIndex(t => t.id === draggedTask.value!.id)
  const targetIndex = mappedTasks.value.findIndex(t => t.id === task.id)

  if (draggedIndex === -1 || targetIndex === -1) return

  // Simple reordering: move dragged task to target position in local tasks
  const newLocalTasks = [...localTasks.value]
  const draggedTaskItem = newLocalTasks.find(t => Number(t.id) === draggedTask.value!.id)
  const targetTaskItem = newLocalTasks.find(t => Number(t.id) === task.id)

  if (draggedTaskItem && targetTaskItem) {
    // Remove dragged task from its current position
    const draggedLocalIndex = newLocalTasks.findIndex(t => Number(t.id) === draggedTask.value!.id)
    newLocalTasks.splice(draggedLocalIndex, 1)

    // Find new position for target task
    const targetLocalIndex = newLocalTasks.findIndex(t => Number(t.id) === task.id)

    // Insert dragged task at target position
    newLocalTasks.splice(targetLocalIndex, 0, draggedTaskItem)

    // Update local tasks
    localTasks.value = newLocalTasks

    // Update task_order values in local tasks to match new order
    newLocalTasks.forEach((task, index) => {
      task.task_order = index + 1
    })

    console.log('✅ Tasks reordered locally')

    // Create and emit task order structure for backend
    const taskOrderData = createTaskOrderStructure()
    console.log('📤 Task order structure:', taskOrderData)
    emit('task-order-updated', taskOrderData)
  }

  // Reset state
  isReordering.value = false
  draggedTask.value = null
  dragOverTask.value = null
}

// Save task changes to API
const saveTaskChanges = async (taskId: string, newStart: string, newEnd: string) => {
  if (!props.projectId) {
    console.warn('No project ID available for saving task changes')
    return
  }

  try {
    const updatePayload = {
      start_planned: newStart,
      end_planned: newEnd,
    }

    console.log('💾 Saving task changes:', { taskId, updatePayload })

    const updatedTask = await tasksApi.update(props.projectId, taskId, updatePayload)
    console.log('✅ Task saved successfully:', updatedTask)

    // Update local tasks with the response from API
    const taskIndex = localTasks.value.findIndex(t => t.id === taskId)
    if (taskIndex !== -1) {
      localTasks.value[taskIndex] = {
        ...localTasks.value[taskIndex],
        start_planned: newStart,
        end_planned: newEnd,
      }
    }

  } catch (error) {
    console.error('❌ Failed to save task changes:', error)
    // TODO: Show user-friendly error message
  }
}

// Add scroll event listeners when component mounts
onMounted(() => {
  // DISABLED: Scroll synchronization causes unwanted scroll resets
  // if (leftPanelRef.value) {
  //   leftPanelRef.value.addEventListener('scroll', handleLeftPanelScroll)
  // }
  // if (rightPanelRef.value) {
  //   rightPanelRef.value.addEventListener('scroll', handleRightPanelScroll)
  // }

  // Add keyboard event listener for Escape key
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  if (leftPanelRef.value) {
    leftPanelRef.value.removeEventListener('scroll', handleLeftPanelScroll)
  }
  if (rightPanelRef.value) {
    rightPanelRef.value.removeEventListener('scroll', handleRightPanelScroll)
  }

  // Remove keyboard event listener
  document.removeEventListener('keydown', handleKeyDown)
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

/* Month boundary styles */
.gantt-day-header.border-l-4 {
  border-left: 4px solid #6b7280 !important;
  background-color: #f9fafb;
  font-weight: 600;
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

/* Drag-drop styles */
.gantt-task-row.dragging {
  opacity: 0.5;
  background-color: #f3f4f6;
}

.gantt-task-row.drag-over {
  background-color: #dbeafe;
  border-top: 2px solid #3b82f6;
}

.gantt-task-row[draggable="true"] {
  cursor: move;
}

.gantt-task-row[draggable="true"]:hover {
  background-color: #f9fafb;
}

/* Drag Handle Styles */
.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  opacity: 0.8;
  transition: opacity 0.2s, color 0.2s;
  border-radius: 4px;
  padding: 2px;
}

.drag-handle:hover {
  opacity: 1;
  background-color: #f3f4f6;
}

.gantt-task-row:hover .drag-handle {
  opacity: 0.9;
  background-color: #f9fafb;
}

.gantt-task-row.dragging .drag-handle {
  opacity: 1;
  color: #3b82f6;
  background-color: #dbeafe;
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

/* Locked task styles */
.task-bar.locked {
  opacity: 0.6;
  cursor: not-allowed;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.1) 2px,
    rgba(0, 0, 0, 0.1) 4px
  );
}

.task-bar.locked:hover {
  opacity: 0.7;
}

/* Dependency Arrows */
.dependency-arrows {
  pointer-events: none;
  z-index: 5;
}

.dependency-arrows line {
  stroke: #6b7280;
  stroke-width: 2;
  fill: none;
}

.dependency-arrows line:hover {
  stroke: #374151;
  stroke-width: 3;
}

.dependency-arrows text {
  font-size: 10px;
  fill: #6b7280;
  font-weight: 500;
}
</style>

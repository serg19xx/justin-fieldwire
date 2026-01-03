<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import FullCalendar from '@fullcalendar/vue3' // cspell:ignore fullcalendar
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import type { Task, TaskStatus, TaskCreateUpdate, TaskFilter } from '@/core/types/task'
import { taskToCalendarTask, getTaskColor, processEndDateForDisplay } from '@/core/utils/task-utils'
import { useAuthStore } from '@/core/stores/auth'
import { tasksApi } from '@/core/utils/tasks-api'
import { projectApi, type Project, type ProjectTeamMember } from '@/core/utils/project-api'
import { checkProjectBounds } from '@/core/utils/project-bounds-checker'
import { checkDependencyConstraints } from '@/core/utils/dependency-validator'
import TaskDialog from '@/pages/projects/TaskDialog.vue'
import TaskViewDialog from '@/pages/projects/TaskViewDialog.vue'
import ProjectGantt from '@/pages/projects/ProjectGantt.vue'
// ProjectGanttNew removed - was too buggy
import TaskEditPanel from '@/pages/projects/TaskEditPanel.vue'
import MilestoneDialog from '@/pages/projects/MilestoneDialog.vue'
import SimpleBoundsDialog from '@/pages/projects/SimpleBoundsDialog.vue'
import DependencyValidationDialog from '@/pages/projects/DependencyValidationDialog.vue'
import TaskTemplateDialog from '@/components/task-templates/TaskTemplateDialog.vue'
import TaskFilterDialog from '@/components/tasks/TaskFilterDialog.vue'
import TaskListSidebar from '@/components/tasks/TaskListSidebar.vue'
import { useTaskFilters } from '@/composables/useTaskFilters'

// Props
interface Props {
  projectId: number
  canEdit?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canEdit: false,
})

// Debug props
console.log('🔧 ProjectCalendar props:', { canEdit: props.canEdit, projectId: props.projectId })

// Emits
const emit = defineEmits<{
  eventClick: [event: unknown]
  dateClick: [info: unknown]
  eventDrop: [info: unknown]
  eventResize: [info: unknown]
  taskUpdate: [task: Task]
  taskDuplicate: [task: Task]
  openProjectSettings: []
  editPanelOpen: [isOpen: boolean, task?: Task | null, mode?: 'create' | 'edit']
}>()

// Auth store for user role checking
const authStore = useAuthStore()

// State for dependency indicators toggle
const showDependencyIndicators = ref(true)

// Computed property to determine if user can see dependency indicators
const canSeeDependencyIndicators = computed(() => {
  // Show indicators for managers, supervisors, and admins
  const userRole = authStore.currentUser?.role_code
  const showForRoles = ['admin', 'project_manager', 'supervisor']

  // Also check if user has project management permissions
  const hasProjectManagementPermissions =
    authStore.checkPermission('manage_projects') || authStore.checkPermission('manage_tasks')

  return showForRoles.includes(userRole || '') || hasProjectManagementPermissions
})

// Computed property to determine if dependency indicators should be shown
const shouldShowDependencyIndicators = computed(() => {
  return canSeeDependencyIndicators.value && showDependencyIndicators.value
})

// State
const tasks = ref<Task[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const viewMode = ref<'ical' | 'gantt' | 'list'>('ical')
const currentCalendarView = ref<'month' | 'week' | 'day'>('month')

// Gantt version: 'old' | 'new'
// ganttVersion removed - using only working Gantt
const isDragging = ref(false)
const isResizing = ref(false)
const projectInfo = ref<Project | null>(null)

// Selected task for details view
const selectedTask = ref<Task | null>(null)

// Search state
const searchResults = ref<Task[]>([])
const currentSearchIndex = ref(0)
const isSearchActive = ref(false)

// Worker filter state (kept for backward compatibility)
const selectedWorkerId = ref<number | null>(null)
const allProjectWorkers = ref<Array<{ id: number; name: string; role: string }>>([])

// Enhanced task filtering using composable
const { filterState, filteredTasks: enhancedFilteredTasks, clearFilters, activeFiltersCount } = useTaskFilters(tasks)

// Sync worker filter with new filter state (backward compatibility)
watch(selectedWorkerId, (newValue) => {
  if (filterState.value.workerId !== newValue) {
    filterState.value.workerId = newValue
  }
}, { immediate: true })

watch(() => filterState.value.workerId, (newValue) => {
  if (selectedWorkerId.value !== newValue) {
    selectedWorkerId.value = newValue
  }
})

// Handle filter state updates from TaskFilterPanel
function updateFilterState(newState: typeof filterState.value) {
  filterState.value = { ...newState }
}

function searchTasks(query: string) {
  console.log('🔍 Search function called with query:', query)
  console.log('📋 Available tasks:', tasks.value.length)

  if (!query || !query.trim()) {
    console.log('⚠️ Empty search query - clearing search')
    clearSearch()
    return
  }

  const searchTerm = query.trim().toLowerCase()
  console.log('🔍 Searching for:', searchTerm)

  // Find tasks that match the search query
  const matchingTasks = tasks.value.filter((task) => {
    const nameMatch = task.name.toLowerCase().includes(searchTerm)
    const notesMatch = task.notes?.toLowerCase().includes(searchTerm) || false
    const wbsMatch = task.wbs_path?.toLowerCase().includes(searchTerm) || false

    return nameMatch || notesMatch || wbsMatch
  })

  console.log('🎯 Found matching tasks:', matchingTasks.length)

  // Update search state
  searchResults.value = matchingTasks
  currentSearchIndex.value = 0
  isSearchActive.value = true

  if (matchingTasks.length === 0) {
    console.log('❌ No tasks found')
    // Clear any previous selection
    selectedTask.value = null
    return
  }

  // Navigate to first result
  navigateToSearchResult(0)
}

function navigateToSearchResult(index: number) {
  if (!searchResults.value.length || index < 0 || index >= searchResults.value.length) {
    return
  }

  const task = searchResults.value[index]
  currentSearchIndex.value = index

  console.log(
    `🎯 Navigating to search result ${index + 1}/${searchResults.value.length}:`,
    task.name,
  )

  // Select the task
  selectedTask.value = task
  restoreTaskSelection(task.id)

  // Navigate to the task date and scroll to it
  const calendar = calendarRef.value?.getApi()
  if (calendar) {
    const event = calendar.getEventById(String(task.id))
    if (event) {
      console.log('📅 Navigating to task:', task.name, 'at date:', event.start)

      // Navigate to the date first
      calendar.gotoDate(event.start)

      // Then scroll to the time (for time-based views)
      setTimeout(() => {
        calendar.scrollToTime(event.start)
      }, 100)
    } else {
      console.warn('⚠️ Could not find calendar event for task:', task.id)
    }
  }
}

function nextSearchResult() {
  if (searchResults.value.length === 0) return

  const nextIndex = (currentSearchIndex.value + 1) % searchResults.value.length
  navigateToSearchResult(nextIndex)
}

function previousSearchResult() {
  if (searchResults.value.length === 0) return

  const prevIndex =
    currentSearchIndex.value === 0 ? searchResults.value.length - 1 : currentSearchIndex.value - 1
  navigateToSearchResult(prevIndex)
}

// Project bounds dialog state
const simpleBoundsDialog = ref({
  isOpen: false,
  taskStart: '',
  taskEnd: '',
  projectStart: '',
  projectEnd: '',
  adjustedStart: '',
  adjustedEnd: '',
  reason: '',
  onCancel: null as (() => void) | null,
  onAdjust: null as (() => Promise<void>) | null,
})

// Dependency validation dialog state
const dependencyDialog = ref({
  isOpen: false,
  taskStart: '',
  taskEnd: '',
  violatedConstraints: [] as Array<{
    taskId: string
    predecessorId: string
    type: 'FS' | 'SS' | 'FF' | 'SF'
    lagDays: number
    predecessorName: string
    predecessorEndDate?: string
    predecessorStartDate?: string
  }>,
  suggestedStart: '',
  suggestedEnd: '',
  reason: '',
  onCancel: null as (() => void) | null,
  onAdjust: null as (() => Promise<void>) | null,
})

// Double-click detection for dates and events
const lastDateClick = ref<{ date: string; time: number } | null>(null)
const lastEventClick = ref<{ eventId: string; time: number } | null>(null)

// Task dialog state
const taskDialog = ref({
  isOpen: false,
  mode: 'create' as 'create' | 'edit' | 'view',
  task: null as Task | null,
  initialDate: undefined as string | undefined,
})

// Task view dialog state (read-only)
const taskViewDialog = ref({
  isOpen: false,
  task: null as Task | null,
})

// Task edit panel state (full-screen edit)
const taskEditPanel = ref({
  isOpen: false,
  mode: 'create' as 'create' | 'edit',
  task: null as Task | null,
})

// Milestone dialog state
const milestoneDialog = ref({
  isOpen: false,
  mode: 'create' as 'create' | 'edit' | 'view',
  task: null as Task | null,
  initialDate: undefined as string | undefined,
})

// Task template dialog state
const templateDialog = ref({
  isOpen: false,
})

// Task filter dialog state
const filterDialog = ref({
  isOpen: false,
})

// Tooltip state
const tooltipState = ref<{
  type: 'task' | 'milestone' | 'info' | 'templates' | null
  visible: boolean
  x: number
  y: number
}>({
  type: null,
  visible: false,
  x: 0,
  y: 0,
})

const addTaskButtonRef = ref<HTMLElement | null>(null)
const addMilestoneButtonRef = ref<HTMLElement | null>(null)
const infoButtonRef = ref<HTMLElement | null>(null)
const fromTemplatesButtonRef = ref<HTMLElement | null>(null)

function updateTooltipPosition(type: 'task' | 'milestone' | 'info' | 'templates', event: MouseEvent) {
  const button = event.currentTarget as HTMLElement
  const rect = button.getBoundingClientRect()

  if (type === 'milestone') {
    // For milestone, store right position for right-aligned tooltip
    tooltipState.value = {
      type,
      visible: true,
      x: window.innerWidth - rect.right, // Distance from right edge
      y: rect.top,
    }
  } else if (type === 'info') {
    tooltipState.value = {
      type,
      visible: true,
      x: rect.left + rect.width / 2, // Center of button
      y: rect.top,
    }
  } else if (type === 'templates') {
    tooltipState.value = {
      type,
      visible: true,
      x: rect.left, // Left edge of button
      y: rect.top,
    }
  } else {
    tooltipState.value = {
      type,
      visible: true,
      x: rect.left, // Left edge of button
      y: rect.top,
    }
  }
}

function hideTooltip(type: 'task' | 'milestone' | 'info' | 'templates') {
  if (tooltipState.value.type === type) {
    tooltipState.value.visible = false
  }
}

// Available tasks for dependencies (exclude current task)
const availableTasksForDependencies = computed(() => {
  if (taskDialog.value.task) {
    return tasks.value.filter((t) => String(t.id) !== String(taskDialog.value.task?.id))
  }
  return tasks.value
})

// Use enhanced filtered tasks from composable
const filteredTasks = enhancedFilteredTasks

// Get current date for testing
const today = new Date()
const currentMonth = today.getMonth() + 1
const currentYear = today.getFullYear()

// Calendar events - static for now with current month dates
const calendarEvents = ref<unknown[]>([])

// Initialize with empty events
// initializeEvents() - will be populated by API or mock data

// Apply project bounds styling to calendar days
function applyProjectBoundsStyling() {
  if (!projectInfo.value || !calendarRef.value) return

  const projectStart = new Date(projectInfo.value.date_start + 'T00:00:00')
  const projectEnd = new Date(projectInfo.value.date_end + 'T00:00:00')

  console.log('🎨 Applying project bounds styling:', {
    projectStart: projectInfo.value.date_start,
    projectEnd: projectInfo.value.date_end,
    projectStartObj: projectStart,
    projectEndObj: projectEnd,
  })

  // Get all day elements
  const dayElements = document.querySelectorAll('.fc-daygrid-day')
  let outsideBoundsCount = 0

  console.log('🔍 Found day elements:', dayElements.length)

  if (dayElements.length === 0) {
    console.log('⚠️ No day elements found, retrying in 500ms...')
    setTimeout(() => {
      applyProjectBoundsStyling()
    }, 500)
    return
  }

  dayElements.forEach((dayElement) => {
    const dayDate = dayElement.getAttribute('data-date')
    if (!dayDate) return

    const currentDate = new Date(dayDate + 'T00:00:00')
    const isOutside = currentDate < projectStart || currentDate > projectEnd

    console.log('🔍 Day check:', {
      dayDate,
      currentDate: currentDate.toISOString().split('T')[0],
      projectStart: projectStart.toISOString().split('T')[0],
      projectEnd: projectEnd.toISOString().split('T')[0],
      isOutside,
    })

    // Check if date is outside project bounds
    if (isOutside) {
      dayElement.classList.add('fc-day-outside-project-bounds')
      outsideBoundsCount++
    } else {
      dayElement.classList.remove('fc-day-outside-project-bounds')
    }
  })

  console.log('🎨 Styling applied:', {
    totalDays: dayElements.length,
    outsideBoundsCount,
    projectStart: projectInfo.value.date_start,
    projectEnd: projectInfo.value.date_end,
  })
}

// Calendar options - with editing capabilities
const calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay',
  },
  eventDisplay: 'block', // Ensure events display properly
  displayEventTime: true, // Show time for timed events (will be controlled per view)
  height: 'auto',
  weekends: true,
  editable: props.canEdit,
  droppable: false,
  selectable: true,
  dayMaxEvents: true,
  eventResizableFromStart: props.canEdit,
  eventResizableFromEnd: props.canEdit,
  eventMouseEnter: (info: unknown) => {
    // Show dependency tooltip on hover
    const eventInfo = info as { event: { extendedProps: { dependencies: unknown[] } } }
    const dependencies = eventInfo.event.extendedProps.dependencies
    if (dependencies && dependencies.length > 0) {
      // Add custom tooltip logic here if needed
      console.log('🔍 Task has dependencies:', dependencies)
    }
  },
  events: (_info: unknown, successCallback: (events: any[]) => void) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    // Use filteredTasks instead of calendarEvents
    const tasksWithDates = filteredTasks.value.filter((task) => task.start_planned)
    // Determine view type from current calendar view
    const viewType: 'month' | 'week' | 'day' = currentCalendarView.value
    const events = tasksWithDates.map((task) => taskToCalendarTask(task, shouldShowDependencyIndicators.value, viewType))
    console.log('📅 FullCalendar requesting events, returning:', events.length, 'filtered tasks for view:', viewType)
    successCallback(events)
  },
  datesSet: (info: unknown) => {
    // Track current calendar view
    const viewInfo = info as { view: { type: string } }
    if (viewInfo?.view?.type) {
      const viewType = viewInfo.view.type
      let viewChanged = false
      if (viewType === 'dayGridMonth') {
        if (currentCalendarView.value !== 'month') {
          currentCalendarView.value = 'month'
          viewChanged = true
        }
        calendarOptions.value.displayEventTime = false
      } else if (viewType === 'timeGridWeek') {
        if (currentCalendarView.value !== 'week') {
          currentCalendarView.value = 'week'
          viewChanged = true
        }
        calendarOptions.value.displayEventTime = false // All tasks are all-day, no time display
      } else if (viewType === 'timeGridDay') {
        if (currentCalendarView.value !== 'day') {
          currentCalendarView.value = 'day'
          viewChanged = true
        }
        calendarOptions.value.displayEventTime = false // All tasks are all-day, no time display
      }
      console.log('📅 Calendar view changed to:', currentCalendarView.value)

      // Refresh events when view changes to update time display
      if (viewChanged && calendarRef.value) {
        const calendarApi = calendarRef.value.getApi()
        calendarApi.refetchEvents()
      }
    }
    // Apply project bounds styling when calendar dates change
    setTimeout(() => {
      applyProjectBoundsStyling()
    }, 100)
  },
  eventDragStart: (info: unknown) => {
    console.log('📅 Event drag started:', (info as { event: { title: string } }).event.title)
    isDragging.value = true
  },
  eventDrop: async (info: unknown) => {
    console.log('🎯 FullCalendar eventDrop triggered:', info)
    const eventInfo = info as { event: { title: string; start: Date } }
    console.log('📅 Event dropped:', eventInfo.event.title, 'to', eventInfo.event.start)
    await handleEventDrop(info)
  },
  eventResizeStart: (info: unknown) => {
    console.log('📅 Event resize started:', (info as { event: { title: string } }).event.title)
    isResizing.value = true
  },
  eventResize: async (info: unknown) => {
    const eventInfo = info as { event: { title: string; end: Date } }
    console.log('📅 Event resized:', eventInfo.event.title, 'to', eventInfo.event.end)

    await handleEventResize(info)
  },
  eventClick: (info: unknown) => {
    // Handle both single and double clicks
    if (!isDragging.value && !isResizing.value) {
      const now = Date.now()
      const eventInfo = info as { event: { id: string; title: string } }
      const eventId = eventInfo.event.id

      // Check if this is a double-click (within 500ms of last click on same event)
      if (
        lastEventClick.value &&
        lastEventClick.value.eventId === eventId &&
        now - lastEventClick.value.time < 500
      ) {
        console.log('📅 Event double-clicked detected:', eventInfo.event.title)
        console.log('🔧 Time between clicks:', now - lastEventClick.value.time, 'ms')
        console.log('🔧 Event ID:', eventId, 'Type:', typeof eventId)
        // Check if it's a milestone or regular task
        const task = tasks.value.find((t) => String(t.id) === String(eventId))
        if (task && task.milestone) {
          // Open milestone dialog for milestones
          const mode = props.canEdit ? 'edit' : 'view'
          openMilestoneDialog(mode, eventId)
        } else {
          // Open TaskViewDialog for regular tasks (always read-only on double-click)
          openTaskViewDialog(eventId)
        }
        lastEventClick.value = null // Reset
      } else {
        console.log('📅 Event single-clicked (selection only):', eventInfo.event.title)
        console.log('🔧 Storing click time:', now, 'for event:', eventId)
        lastEventClick.value = { eventId, time: now }

        // Select the task for the Delete button
        console.log('🔍 Looking for task with ID:', eventId, 'in tasks:', tasks.value.length)
        const task = tasks.value.find((t) => String(t.id) === String(eventId))
        console.log('🔍 Found task:', task)

        if (task) {
          console.log('✅ Task found, setting selectedTask to:', task.name)

          // Clear previous selection
          const calendar = calendarRef.value?.getApi()
          console.log('🔍 Calendar API available:', !!calendar)

          if (calendar) {
            // Remove selection from all events
            const allEvents = calendar.getEvents()
            console.log('🔍 Found', allEvents.length, 'events in calendar')
            allEvents.forEach((event: { removeClass?: (className: string) => void }) => {
              if (event.removeClass) {
                event.removeClass('fc-event-selected')
              }
            })

            // Also remove selection class from all DOM elements
            const selectedElements = document.querySelectorAll('.fc-event-selected')
            selectedElements.forEach((element) => {
              element.classList.remove('fc-event-selected')
            })

            // Add selection to clicked event using FullCalendar API
            const calendarEvent = calendar.getEventById(eventId)
            console.log('🔍 Calendar event found:', !!calendarEvent)
            if (calendarEvent) {
              console.log('🔍 Calendar event details:', {
                id: calendarEvent.id,
                title: calendarEvent.title,
                start: calendarEvent.start,
                end: calendarEvent.end
              })
            }
            if (calendarEvent) {
              // Try multiple approaches to add selection class
              let selectionAdded = false

              // Approach 1: Use FullCalendar API if available
              if (calendarEvent.addClass) {
                calendarEvent.addClass('fc-event-selected')
                selectionAdded = true
                console.log('✅ Added selection class via FullCalendar API:', eventId)
              }

              // Approach 2: Find and manipulate DOM element directly
              if (!selectionAdded) {
                // Try different selectors that FullCalendar might use
                const selectors = [
                  `[data-event-id="${eventId}"]`,
                  `.fc-event[data-event-id="${eventId}"]`,
                  `.fc-event[data-id="${eventId}"]`,
                  `[data-id="${eventId}"]`,
                  `.fc-event:has([data-event-id="${eventId}"])`,
                  `.fc-event:has([data-id="${eventId}"])`,
                ]

                for (const selector of selectors) {
                  const eventElement = document.querySelector(selector)
                  if (eventElement) {
                    eventElement.classList.add('fc-event-selected')
                    selectionAdded = true
                    console.log(
                      '✅ Added selection class via DOM manipulation with selector:',
                      selector,
                      eventId,
                    )
                    break
                  }
                }
              }

              // Approach 3: Use CSS class selector (most reliable)
              if (!selectionAdded) {
                const classSelector = `.task-${eventId}`
                const eventElement = document.querySelector(classSelector)
                if (eventElement) {
                  eventElement.classList.add('fc-event-selected')
                  selectionAdded = true
                  console.log('✅ Added selection class via CSS class selector:', classSelector, eventId)
                }
              }

              if (!selectionAdded) {
                console.log('⚠️ Could not add selection class to event:', eventId)
                console.log('🔍 Available event data:', {
                  id: eventId,
                  title: calendarEvent.title,
                  start: calendarEvent.start,
                  end: calendarEvent.end,
                })
              }
            } else {
              console.log('⚠️ Could not find calendar event with ID:', eventId)
            }
          }

          selectedTask.value = task
          console.log('📋 Task selected for Delete button:', task.name)
          console.log('📋 selectedTask.value is now:', selectedTask.value)

          // Alternative approach: Use CSS custom property to track selection
          document.documentElement.style.setProperty('--selected-task-id', eventId)
          console.log('🎨 Set CSS custom property for selected task:', eventId)
        } else {
          console.log('❌ Task not found with ID:', eventId)
        }
      }
    }
  },
  dateClick: (info: unknown) => {
    console.log('🖱️ Date clicked:', info)
    console.log('🔧 DateClick conditions:', {
      isDragging: isDragging.value,
      isResizing: isResizing.value,
      canEdit: props.canEdit,
      projectInfo: projectInfo.value,
    })

    // Only handle clicks when not dragging or resizing
    if (!isDragging.value && !isResizing.value && props.canEdit) {
      const now = Date.now()
      const dateInfo = info as { dateStr: string }
      const dateStr = dateInfo.dateStr

      // Check if date is within project bounds
      console.log('🔍 Checking project bounds for date:', dateStr)
      console.log('📋 Project info available:', !!projectInfo.value)

      if (projectInfo.value) {
        const clickedDate = new Date(dateStr)
        const projectStart = new Date(projectInfo.value.date_start)
        const projectEnd = new Date(projectInfo.value.date_end)

        console.log('🔍 Date validation:', {
          clickedDate: dateStr,
          projectStart: projectInfo.value.date_start,
          projectEnd: projectInfo.value.date_end,
          clickedDateObj: clickedDate,
          projectStartObj: projectStart,
          projectEndObj: projectEnd,
          isBeforeStart: clickedDate < projectStart,
          isAfterEnd: clickedDate > projectEnd,
        })

        if (clickedDate < projectStart || clickedDate > projectEnd) {
          console.log('⚠️ Cannot create task outside project bounds:', dateStr)
          alert(
            `Cannot create task on ${dateStr}. This date is outside the project bounds (${projectInfo.value.date_start} - ${projectInfo.value.date_end}).`,
          )
          return
        }
      }

      // Check if this is a double-click (within 300ms of last click on same date)
      if (
        lastDateClick.value &&
        lastDateClick.value.date === dateStr &&
        now - lastDateClick.value.time < 300
      ) {
        console.log('📅 Date double-clicked:', dateStr)
        console.log('🔧 Opening dialog with initialDate:', dateStr)
        openTaskDialog('create', null, dateStr) // Pass clicked date as initial date
        lastDateClick.value = null // Reset
      } else {
        console.log('📅 Date single-clicked (selection only):', dateStr)
        lastDateClick.value = { date: dateStr, time: now }

        // Clear task selection when clicking on empty date
        const calendar = calendarRef.value?.getApi()
        if (calendar) {
          // Remove selection from all events
          const allEvents = calendar.getEvents()
          allEvents.forEach((event: { removeClass?: (className: string) => void }) => {
            if (event.removeClass) {
              event.removeClass('fc-event-selected')
            }
          })

          // Also remove selection class from all DOM elements
          const selectedElements = document.querySelectorAll('.fc-event-selected')
          selectedElements.forEach((element) => {
            element.classList.remove('fc-event-selected')
          })
        }

        selectedTask.value = null
        document.documentElement.style.removeProperty('--selected-task-id')
        console.log('📋 Task selection cleared')
      }
    }
  },
})

// Calendar ref
const calendarRef = ref()

// Function to update calendar events
function updateCalendarEvents(events: unknown[]) {
  calendarEvents.value = events
  console.log('📅 Updating calendar with events:', events.length)
  console.log('📅 Calendar events data:', events)

  // Force calendar to refresh
  nextTick(() => {
    if (calendarRef.value) {
      const calendarApi = calendarRef.value.getApi()
      calendarApi.refetchEvents()
      console.log('✅ Calendar events refreshed')
    } else {
      console.log('⚠️ Calendar ref not available yet')
    }
  })
}

// Function to restore task selection after DOM updates
function restoreTaskSelection(taskId: string | number) {
  console.log('🔄 Restoring task selection for ID:', taskId)
  console.log('🔄 Current viewMode:', viewMode.value)
  console.log('🔄 Calendar ref exists:', !!calendarRef.value)

  // Check if this task is already selected to avoid double selection
  const currentSelectedId = document.documentElement.style.getPropertyValue('--selected-task-id')
  if (currentSelectedId === String(taskId)) {
    console.log('🔄 Task already selected, skipping restoration')
    return
  }

  // Add a small delay to ensure DOM is fully updated
  setTimeout(() => {
    // Clear any existing selection first
    const selectedElements = document.querySelectorAll('.fc-event-selected')
    console.log('🔄 Found existing selected elements:', selectedElements.length)
    selectedElements.forEach((element) => {
      element.classList.remove('fc-event-selected')
    })

    // Try to find and select the task element with more specific selectors first
    const selectors = [
      `.fc-event.task-${taskId}`, // Most specific: CSS class with fc-event
      `.task-${taskId}`, // CSS class selector
      `[data-event-id="${taskId}"]`, // data-event-id attribute
      `.fc-event[data-event-id="${taskId}"]`, // fc-event with data-event-id
      `[data-id="${taskId}"]`, // data-id attribute
      `.fc-event[data-id="${taskId}"]`, // fc-event with data-id
    ]

    console.log('🔄 Trying selectors (ordered by specificity):', selectors)
    let selectionRestored = false
    for (const selector of selectors) {
      try {
        const eventElement = document.querySelector(selector)
        console.log('🔄 Selector:', selector, 'Found element:', !!eventElement)
        if (eventElement) {
          // Double-check that this is the right element by verifying the task ID
          const elementTaskId = eventElement.getAttribute('data-event-id') ||
                               eventElement.getAttribute('data-id') ||
                               eventElement.className.match(/task-(\d+)/)?.[1]

          if (elementTaskId === String(taskId)) {
            eventElement.classList.add('fc-event-selected')
            selectionRestored = true
            console.log('✅ Task selection restored with selector:', selector, 'Task ID verified:', elementTaskId)
            break
          } else {
            console.log('🔄 Found element but wrong task ID:', elementTaskId, 'Expected:', taskId)
          }
        }
      } catch (error) {
        console.log('🔄 Selector error:', selector, error)
      }
    }

    // Don't search by name to avoid selecting wrong tasks with similar names

    if (!selectionRestored) {
      console.log('⚠️ Could not restore task selection for ID:', taskId)
      console.log('⚠️ All available events:', document.querySelectorAll('.fc-event').length)

      // Detailed debugging of all events
      const allEvents = document.querySelectorAll('.fc-event')
      console.log('🔍 Detailed event analysis:')
      allEvents.forEach((event, index) => {
        const eventId = event.getAttribute('data-event-id') || event.getAttribute('data-id')
        const className = event.className
        const title = event.textContent?.trim()
        const taskIdMatch = className.match(/task-(\d+)/)

        console.log(`🔍 Event ${index}:`, {
          title: title,
          'data-event-id': event.getAttribute('data-event-id'),
          'data-id': event.getAttribute('data-id'),
          class: className,
          taskIdFromClass: taskIdMatch?.[1],
          isTarget: eventId === String(taskId) || taskIdMatch?.[1] === String(taskId),
          allAttributes: Array.from(event.attributes).map(attr => `${attr.name}="${attr.value}"`)
        })
      })

      console.log('⚠️ Available event IDs:', Array.from(document.querySelectorAll('.fc-event')).map(el => el.getAttribute('data-event-id') || el.getAttribute('data-id')))
      console.log('⚠️ Available event classes:', Array.from(document.querySelectorAll('.fc-event')).map(el => el.className))
    }

    // Also set CSS custom property
    document.documentElement.style.setProperty('--selected-task-id', String(taskId))
  }, 50) // Small delay to ensure DOM is ready
}

// Load tasks from API
async function loadTasks() {
  if (!props.projectId) {
    console.log('⚠️ No projectId provided for task loading')
    return
  }

  try {
    console.log('📋 Loading tasks for project:', props.projectId)
    loading.value = true
    error.value = null

    const response = await tasksApi.getAll(props.projectId)
    console.log('✅ Tasks loaded from API:', response)

    // Update tasks array
    tasks.value = response.tasks || []
    console.log('📋 Tasks array updated:', tasks.value.length, 'tasks')

    // Filter out tasks without start_planned date (they can't be displayed in calendar)
    const tasksWithDates = tasks.value.filter((task) => {
      if (!task.start_planned) {
        console.warn('⚠️ Task missing start_planned date, skipping calendar display:', {
          id: task.id,
          name: task.name,
          start_planned: task.start_planned,
          end_planned: task.end_planned,
        })
        return false
      }
      return true
    })
    console.log('📋 Tasks with dates:', tasksWithDates.length, 'out of', tasks.value.length)

    // Convert tasks to calendar events
    // Use current view type to properly render tasks for week/day views
    const viewType: 'month' | 'week' | 'day' = currentCalendarView.value
    const events = tasksWithDates.map((task) => {
      const calendarEvent = taskToCalendarTask(task, shouldShowDependencyIndicators.value, viewType)
      console.log('📅 Task converted to calendar event:', {
        taskId: task.id,
        taskName: task.name,
        viewType,
        start: calendarEvent.start,
        end: calendarEvent.end,
        hasStart: !!calendarEvent.start,
        hasEnd: !!calendarEvent.end,
      })
      return calendarEvent
    })
    console.log('📅 Converted to calendar events:', events.length, 'events')

    // Update calendar events
    updateCalendarEvents(events)

    // Load all project workers for filtering
    await loadAllProjectWorkers()

    // Apply project bounds styling after tasks are loaded
    setTimeout(() => {
      applyProjectBoundsStyling()

      // Restore selection if a task was previously selected
      if (selectedTask.value) {
        const calendar = calendarRef.value?.getApi()
        if (calendar) {
          const event = calendar.getEventById(String(selectedTask.value.id))
          if (event) {
            if (event.addClass) {
              event.addClass('fc-event-selected')
              console.log('📋 Task selection restored after reload:', selectedTask.value.name)
            } else {
              // Alternative approach: manipulate the DOM element directly
              const eventElement =
                document.querySelector(`[data-event-id="${selectedTask.value.id}"]`) ||
                document.querySelector(`.fc-event[data-event-id="${selectedTask.value.id}"]`)
              if (eventElement) {
                eventElement.classList.add('fc-event-selected')
                console.log(
                  '📋 Task selection restored via DOM manipulation:',
                  selectedTask.value.name,
                )
              }
            }
          }
        }
      }
    }, 100)
  } catch (err) {
    console.error('❌ Error loading tasks:', err)
    error.value = 'Failed to load tasks'
    tasks.value = []
  } finally {
    loading.value = false
  }
}

// Load project information
async function loadProjectInfo() {
  if (!props.projectId) {
    console.log('⚠️ No projectId provided for project info loading')
    return
  }

  try {
    console.log('📋 Loading project info for calendar bounds:', props.projectId)
    const response = await projectApi.getById(props.projectId)
    console.log('📋 Raw API response:', response)
    projectInfo.value = (response as any).project || response // eslint-disable-line @typescript-eslint/no-explicit-any
    console.log('✅ Project info loaded for calendar:', {
      projectId: props.projectId,
      projectInfo: projectInfo.value,
      dateStart: projectInfo.value?.date_start,
      dateEnd: projectInfo.value?.date_end,
      hasDateStart: 'date_start' in (projectInfo.value || {}),
      hasDateEnd: 'date_end' in (projectInfo.value || {}),
    })

    // Apply styling after project info is loaded
    setTimeout(() => {
      applyProjectBoundsStyling()
    }, 200)
  } catch (error) {
    console.error('❌ Error loading project info:', error)
    console.log('⚠️ Project info not available, calendar bounds validation disabled')
  }
}

// ===== ФУНКЦИИ ПРОВЕРКИ ГРАНИЦ ПРОЕКТА =====

// Функция проверки начала задачи на выход за границы проекта
function checkStartBounds(startDate: string): boolean {
  if (!projectInfo.value) {
    console.log('⚠️ No project info available for start bounds check')
    return true // Если нет информации о проекте, считаем что все в порядке
  }

  const projectStart = projectInfo.value.date_start
  const isWithinBounds = startDate >= projectStart

  console.log('🔍 Start bounds check:', {
    startDate,
    projectStart,
    isWithinBounds,
  })

  return isWithinBounds
}

// Функция проверки конца задачи на выход за границы проекта
function checkEndBounds(endDate: string): boolean {
  if (!projectInfo.value) {
    console.log('⚠️ No project info available for end bounds check')
    return true // Если нет информации о проекте, считаем что все в порядке
  }

  const projectEnd = projectInfo.value.date_end
  const isWithinBounds = endDate <= projectEnd

  console.log('🔍 End bounds check:', {
    endDate,
    projectEnd,
    isWithinBounds,
  })

  return isWithinBounds
}

// ===== ОТДЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ОБРАБОТКИ DROP =====

// Функция 1: Обработка начала задачи
function handleStartDrop(
  position: 'inside' | 'boundary' | 'outside',
  newDate: string,
  taskId: string,
) {
  console.log('🎯 handleStartDrop:', { position, newDate, taskId })

  // Проверяем границы начала задачи
  const isStartWithinBounds = checkStartBounds(newDate)

  if (isStartWithinBounds) {
    // Внутри границ - обновляем начало и сохраняем длительность
    const existingTask = tasks.value.find((task) => task.id.toString() === taskId)
    if (existingTask) {
      const originalStart = new Date(existingTask.start_planned + 'T00:00:00')
      const originalEnd = new Date(existingTask.end_planned + 'T00:00:00')
      const duration = originalEnd.getTime() - originalStart.getTime()

      const newStartObj = new Date(newDate + 'T00:00:00')
      const newEndObj = new Date(newStartObj.getTime() + duration)
      const newEndDate = newEndObj.toLocaleDateString('en-CA')

      return { startDate: newDate, endDate: newEndDate }
    }
    return { startDate: newDate, endDate: null }
  } else {
    // За пределами - показываем диалог
    return { showDialog: true, type: 'start' }
  }
}

// Функция 2: Обработка конца задачи (с исключительной обработкой)
function handleEndDrop(
  position: 'inside' | 'boundary' | 'outside',
  newDate: string,
  taskId: string,
) {
  console.log('🎯 handleEndDrop:', { position, newDate, taskId })

  // Используем дату как есть (без корректировки)
  const adjustedDate = newDate

  // Проверяем границы конца задачи
  const isEndWithinBounds = checkEndBounds(adjustedDate)

  if (isEndWithinBounds) {
    // Внутри границ - обновляем с корректировкой
    return { startDate: null, endDate: adjustedDate }
  } else {
    // За пределами - показываем диалог
    return { showDialog: true, type: 'end' }
  }
}

// Функция 3: Обработка всей задачи
function handleFullTaskDrop(
  position: 'inside' | 'boundary' | 'outside',
  newStart: string,
  newEnd: string,
  taskId: string,
) {
  console.log('🎯 handleFullTaskDrop:', { position, newStart, newEnd, taskId })

  // Проверяем границы начала и конца задачи
  const isStartWithinBounds = checkStartBounds(newStart)
  const isEndWithinBounds = checkEndBounds(newEnd)

  if (isStartWithinBounds && isEndWithinBounds) {
    // Внутри границ - обновляем обе даты как есть (без корректировок)
    return { startDate: newStart, endDate: newEnd }
  } else {
    // За пределами - показываем диалог
    return { showDialog: true, type: 'full' }
  }
}

// ===== ОСНОВНАЯ ФУНКЦИЯ DROP =====

// Handle event drop (task moved)
async function handleEventDrop(info: unknown) {
  console.log('🚀 handleEventDrop called with:', info)
  const eventInfo = info as { event: { id: string; start: Date; end?: Date } }
  const taskId = eventInfo.event.id
  const newStart = eventInfo.event.start.toISOString()
  const newEnd = eventInfo.event.end?.toISOString()

  try {
    // Find the existing task first
    const existingTask = tasks.value.find((task) => task.id.toString() === taskId)
    if (!existingTask) {
      console.error('❌ Task not found for drag:', taskId)
      return
    }

    console.log('📅 Task moved:', taskId, 'to', newStart, '-', newEnd)
    console.log('🔍 Task type:', existingTask.milestone ? 'MILESTONE' : 'TASK')

    // Определяем тип drop и позицию
    const newStartDate = eventInfo.event.start.toLocaleDateString('en-CA')
    const newEndDate = existingTask.milestone
      ? newStartDate
      : eventInfo.event.end
        ? (() => {
            // Убираем день, который FullCalendar добавил для отображения
            const endDateObj = new Date(eventInfo.event.end)
            endDateObj.setDate(endDateObj.getDate() - 1)
            return endDateObj.toLocaleDateString('en-CA')
          })()
        : newStartDate

    // Определяем позицию относительно границ проекта
    const projectStart = projectInfo.value?.date_start || ''
    const projectEnd = projectInfo.value?.date_end || ''

    let position: 'inside' | 'boundary' | 'outside' = 'inside'
    if (newStartDate < projectStart || newEndDate > projectEnd) {
      position = 'outside'
    } else if (newStartDate === projectStart || newEndDate === projectEnd) {
      position = 'boundary'
    }

    console.log('🔍 Bounds check for', existingTask.milestone ? 'MILESTONE' : 'TASK', ':', {
      newStartDate,
      newEndDate,
      projectStart,
      projectEnd,
      position,
    })

    // Определяем тип drop
    const originalStart = existingTask.start_planned
    const originalEnd = existingTask.end_planned

    let dropType: 'start' | 'end' | 'full' = 'full'

    // Проверяем, что изменилось
    const startChanged = newStartDate !== originalStart
    const endChanged = newEndDate !== originalEnd

    console.log('🔍 Change detection:', {
      originalStart,
      originalEnd,
      newStartDate,
      newEndDate,
      startChanged,
      endChanged,
    })

    // Если изменилось только начало - это перетаскивание начала
    if (startChanged && !endChanged) {
      dropType = 'start'
    }
    // Если изменился только конец - это перетаскивание конца
    else if (!startChanged && endChanged) {
      dropType = 'end'
    }
    // Если изменились оба - это перетаскивание всей задачи
    else if (startChanged && endChanged) {
      dropType = 'full'
    }
    // Если ничего не изменилось - это странно, но считаем полным
    else {
      dropType = 'full'
    }

    console.log('🎯 Drop type detected:', dropType, {
      originalStart,
      originalEnd,
      newStartDate,
      newEndDate,
      startChanged,
      endChanged,
    })

    let result
    if (dropType === 'start') {
      result = handleStartDrop(position, newStartDate, taskId)
    } else if (dropType === 'end') {
      result = handleEndDrop(position, newEndDate, taskId)
    } else {
      result = handleFullTaskDrop(position, newStartDate, newEndDate, taskId)
    }

    if (result.showDialog) {
      // Показываем диалог валидации границ
      console.log('📋 Showing dialog for:', result.type)

      // Create task data for validation
      const taskData = {
        ...existingTask,
        startPlanned: newStartDate,
        endPlanned: existingTask.milestone ? newStartDate : newEndDate, // For milestones, end = start
        project_id: props.projectId,
      }

      // First check project bounds
      const boundsCheck = checkProjectBounds(taskData as TaskCreateUpdate, projectInfo.value!)
      if (!boundsCheck.isWithinBounds) {
        // Show simple bounds dialog
        simpleBoundsDialog.value = {
          isOpen: true,
          taskStart: taskData.startPlanned,
          taskEnd: taskData.endPlanned,
          projectStart: projectInfo.value!.date_start,
          projectEnd: projectInfo.value!.date_end,
          adjustedStart: boundsCheck.clampedStart,
          adjustedEnd: boundsCheck.clampedEnd,
          reason: boundsCheck.reason,
          onCancel: () => {
            console.log('❌ User chose to cancel - reverting event')
            console.log('🔍 Reverting milestone to original position:', {
              originalStart: existingTask.start_planned,
              originalEnd: existingTask.end_planned,
              isMilestone: existingTask.milestone,
            })
            try {
              // Try using FullCalendar's built-in revert function first
              const eventInfo = info as { revert: () => void }
              if (eventInfo.revert) {
                console.log('🔄 Using FullCalendar revert function')
                eventInfo.revert()
                console.log('✅ Event reverted using FullCalendar revert')
                return
              }

              // Fallback to manual revert
              const manualEventInfo = info as {
                event: { setStart: (date: Date) => void; setEnd: (date: Date) => void }
              }
              const originalStartDate = new Date(existingTask.start_planned + 'T00:00:00')
              console.log('🔍 Setting start to:', originalStartDate)
              manualEventInfo.event.setStart(originalStartDate)

              // For milestones, end should equal start
              if (existingTask.milestone) {
                const endDate = new Date(existingTask.start_planned + 'T00:00:00')
                endDate.setDate(endDate.getDate() + 1) // FullCalendar uses exclusive end dates
                console.log('🔍 Setting milestone end to:', endDate)
                manualEventInfo.event.setEnd(endDate)
              } else if (existingTask.end_planned) {
                // FullCalendar uses exclusive end dates, so we need to add 1 day
                const endDate = new Date(existingTask.end_planned + 'T00:00:00')
                endDate.setDate(endDate.getDate() + 1)
                console.log('🔍 Setting task end to:', endDate)
                manualEventInfo.event.setEnd(endDate)
              }
              console.log('✅ Event reverted manually')

              // Force calendar to re-render the event
              if (calendarRef.value) {
                console.log('🔄 Forcing calendar re-render')
                calendarRef.value.refetchEvents()
              }
            } catch (error) {
              console.error('Error reverting event:', error)
            }
          },
          onAdjust: async () => {
            console.log('✅ User chose to adjust dates to project bounds (DRAG)')
            console.log('🔍 Original taskData:', taskData)
            console.log('🔍 Bounds check result:', boundsCheck)
            console.log('🔍 Task ID:', taskId)
            console.log(
              '🔍 Is milestone:',
              (taskData as TaskCreateUpdate & { milestone?: boolean }).milestone,
            )
            const adjustedTaskData = {
              ...taskData,
              startPlanned: boundsCheck.clampedStart,
              endPlanned: boundsCheck.clampedEnd,
            }
            console.log('🔍 Adjusted taskData:', adjustedTaskData)

            try {
              const updatePayload: Record<string, unknown> = {
                startPlanned: adjustedTaskData.startPlanned,
                endPlanned: adjustedTaskData.endPlanned,
              }

              await tasksApi.update(props.projectId, taskId, updatePayload)
              console.log('✅ Task adjusted and saved')

              // Force calendar to re-render to show the updated position
              if (calendarRef.value) {
                console.log('🔄 Forcing calendar re-render after adjust')
                const calendarApi = calendarRef.value.getApi()

                // Force complete calendar refresh
                console.log('🔄 Refreshing entire calendar')
                calendarApi.refetchEvents()

                // Also try to update the specific event
                setTimeout(() => {
                  const event = calendarApi.getEventById(taskId)
                  if (event) {
                    console.log('🔍 Updating event after refresh:', taskId)
                    console.log(
                      '🔍 New position:',
                      adjustedTaskData.startPlanned,
                      adjustedTaskData.endPlanned,
                    )

                    // Set new start date
                    const newStartDate = new Date(adjustedTaskData.startPlanned + 'T00:00:00')
                    event.setStart(newStartDate)

                    // Set new end date (for milestones, end = start)
                    if (adjustedTaskData.endPlanned) {
                      const endDate = new Date(adjustedTaskData.endPlanned + 'T00:00:00')
                      endDate.setDate(endDate.getDate() + 1) // FullCalendar uses exclusive end dates
                      event.setEnd(endDate)
                    }

                    console.log('✅ Event position updated in calendar')
                  }
                }, 100)
              }

              // Update local task data
              const taskIndex = tasks.value.findIndex((t) => t.id.toString() === taskId)
              if (taskIndex > -1) {
                tasks.value[taskIndex] = {
                  ...tasks.value[taskIndex],
                  start_planned: adjustedTaskData.startPlanned,
                  end_planned: adjustedTaskData.endPlanned,
                }
                console.log('📝 Task updated locally:', tasks.value[taskIndex])

                // Force calendar to update with new data
                const events = tasks.value.map((task) =>
                  taskToCalendarTask(task, shouldShowDependencyIndicators.value),
                )
                updateCalendarEvents(events)
                console.log('🔄 Calendar events updated with new task data')
              }

              // Update calendar display
              const eventInfo = info as {
                event: { setStart: (date: Date) => void; setEnd: (date: Date) => void }
              }
              eventInfo.event.setStart(new Date(adjustedTaskData.startPlanned + 'T00:00:00'))
              if (adjustedTaskData.endPlanned) {
                const endDate = new Date(adjustedTaskData.endPlanned + 'T00:00:00')
                endDate.setDate(endDate.getDate() + 1)
                eventInfo.event.setEnd(endDate)
              }

              emit('taskUpdate', adjustedTaskData as Task)

              // Restore selection after adjust
              setTimeout(() => {
                if (selectedTask.value) {
                  restoreTaskSelection(selectedTask.value.id)
                }
              }, 200)
            } catch (error) {
              console.error('❌ Error adjusting task:', error)
            }
          },
        }
        return
      }

      // Then check dependency constraints
      const dependencyCheck = checkDependencyConstraints(taskData as TaskCreateUpdate, tasks.value)
      if (!dependencyCheck.isValid) {
        // Show dependency validation dialog
        dependencyDialog.value = {
          isOpen: true,
          taskStart: taskData.startPlanned,
          taskEnd: taskData.endPlanned,
          violatedConstraints: dependencyCheck.violatedConstraints,
          suggestedStart: dependencyCheck.suggestedStartDate || '',
          suggestedEnd: dependencyCheck.suggestedEndDate || '',
          reason: dependencyCheck.reason,
          onCancel: () => {
            console.log('❌ User chose to cancel - reverting event')
            try {
              const eventInfo = info as {
                event: { setStart: (date: Date) => void; setEnd: (date: Date) => void }
              }
              eventInfo.event.setStart(new Date(existingTask.start_planned + 'T00:00:00'))
              // For milestones, end should equal start
              if (existingTask.milestone) {
                const endDate = new Date(existingTask.start_planned + 'T00:00:00')
                endDate.setDate(endDate.getDate() + 1) // FullCalendar uses exclusive end dates
                eventInfo.event.setEnd(endDate)
              } else if (existingTask.end_planned) {
                // FullCalendar uses exclusive end dates, so we need to add 1 day
                const endDate = new Date(existingTask.end_planned + 'T00:00:00')
                endDate.setDate(endDate.getDate() + 1)
                eventInfo.event.setEnd(endDate)
              }
            } catch (error) {
              console.error('Error reverting event:', error)
            }
          },
          onAdjust: async () => {
            console.log('✅ User chose to adjust dates to respect dependencies (DRAG)')
            if (!dependencyCheck.suggestedStartDate || !dependencyCheck.suggestedEndDate) {
              console.error('❌ No suggested dates available')
              return
            }

            const adjustedTaskData = {
              ...taskData,
              startPlanned: dependencyCheck.suggestedStartDate,
              endPlanned: dependencyCheck.suggestedEndDate,
            }

            try {
              const updatePayload: Record<string, unknown> = {
                startPlanned: adjustedTaskData.startPlanned,
                endPlanned: adjustedTaskData.endPlanned,
              }

              await tasksApi.update(props.projectId, taskId, updatePayload)
              console.log('✅ Task adjusted to respect dependencies and saved')

              // Update local task data
              const taskIndex = tasks.value.findIndex((t) => t.id.toString() === taskId)
              if (taskIndex > -1) {
                tasks.value[taskIndex] = {
                  ...tasks.value[taskIndex],
                  start_planned: adjustedTaskData.startPlanned,
                  end_planned: adjustedTaskData.endPlanned,
                }
              }

              // Update calendar display
              const eventInfo = info as {
                event: { setStart: (date: Date) => void; setEnd: (date: Date) => void }
              }
              eventInfo.event.setStart(new Date(adjustedTaskData.startPlanned + 'T00:00:00'))
              if (adjustedTaskData.endPlanned) {
                const endDate = new Date(adjustedTaskData.endPlanned + 'T00:00:00')
                endDate.setDate(endDate.getDate() + 1)
                eventInfo.event.setEnd(endDate)
              }

              emit('taskUpdate', adjustedTaskData as Task)

              // Restore selection after adjust
              setTimeout(() => {
                if (selectedTask.value) {
                  restoreTaskSelection(selectedTask.value.id)
                }
              }, 200)
            } catch (error) {
              console.error('❌ Error adjusting task:', error)
            }
          },
        }
        return
      }
    } else {
      // Обновляем задачу
      console.log('📅 Updating task:', { startDate: result.startDate, endDate: result.endDate })

      // Create task data with updated dates but keeping all other fields
      const finalStartDate = result.startDate || newStartDate
      const finalEndDate = existingTask.milestone ? finalStartDate : result.endDate || newEndDate

      const taskData = {
        ...existingTask,
        startPlanned: finalStartDate,
        endPlanned: finalEndDate,
        start_planned: finalStartDate,
        end_planned: finalEndDate,
        project_id: props.projectId,
      }

      // Update task via API
      const updatePayload: Record<string, unknown> = {
        startPlanned: taskData.startPlanned,
        endPlanned: taskData.endPlanned,
      }

      console.log('🖱️ Drag & Drop: Updating task via PUT /api/v1/projects/{project_id}/tasks/{task_id}', {
        projectId: props.projectId,
        taskId,
        payload: updatePayload,
        start_planned: taskData.startPlanned,
        end_planned: taskData.endPlanned,
      })

      try {
        const updatedTask = await tasksApi.update(props.projectId, taskId, updatePayload)
        console.log('✅ Drag & Drop: Task dates updated successfully:', updatedTask)

        // Update local task data without reloading from API
        const taskIndex = tasks.value.findIndex((t) => t.id.toString() === taskId)
        if (taskIndex !== -1) {
          tasks.value[taskIndex] = { ...tasks.value[taskIndex], ...taskData }
        }

        // Update calendar events
        const events = tasks.value.map((task) =>
          taskToCalendarTask(task, shouldShowDependencyIndicators.value),
        )
        updateCalendarEvents(events)

        // Reapply project bounds styling after task drag
        setTimeout(() => {
          applyProjectBoundsStyling()

          // Restore selection if a task was previously selected
          if (selectedTask.value) {
            restoreTaskSelection(selectedTask.value.id)
          }
        }, 100)
      } catch (apiError) {
        console.error('❌ API update failed for drag, keeping local changes:', apiError)
      }

      emit('taskUpdate', {
        id: taskId,
        start_planned: taskData.startPlanned,
        end_planned: taskData.endPlanned,
      } as Task)
      console.log('✅ Task moved successfully')
      return
    }
  } catch (error: unknown) {
    console.error('❌ Error updating task:', error)
    // Revert the change
    if (
      info &&
      typeof info === 'object' &&
      'revert' in info &&
      typeof (info as Record<string, unknown>).revert === 'function'
    ) {
      ;((info as Record<string, unknown>).revert as () => void)()
    }
  } finally {
    // Reset dragging flag
    isDragging.value = false
  }
}

// Handle event resize (task duration changed)
async function handleEventResize(info: unknown) {
  console.log('🔄 handleEventResize called')
  const eventInfo = info as { event: { id: string; start: Date; end?: Date } }
  const taskId = eventInfo.event.id
  const newStart = eventInfo.event.start.toISOString()
  const newEnd = eventInfo.event.end?.toISOString()

  console.log('📅 Task resized:', taskId, 'from', newStart, 'to', newEnd)
  console.log('📅 Resize info details:', {
    'event.start': eventInfo.event.start,
    'event.end': eventInfo.event.end,
    'event.start.toISOString()': eventInfo.event.start?.toISOString(),
    'event.end.toISOString()': eventInfo.event.end?.toISOString(),
    'event.start date string': eventInfo.event.start?.toLocaleDateString('en-CA'),
    'event.end date string': eventInfo.event.end?.toLocaleDateString('en-CA'),
  })

  try {
    // Find the existing task first
    const existingTask = tasks.value.find((task) => task.id.toString() === taskId)
    if (!existingTask) {
      console.error('❌ Task not found for resize:', taskId)
      return
    }

    // Milestones should not be resizable - this should not happen due to durationEditable: false
    if (existingTask.milestone) {
      console.warn('⚠️ Attempted to resize milestone - this should not happen')
      return
    }

    // Определяем тип resize
    const newStartDate = eventInfo.event.start.toLocaleDateString('en-CA')
    const rawEndDate = eventInfo.event.end
      ? eventInfo.event.end.toLocaleDateString('en-CA')
      : newStartDate
    // FullCalendar uses exclusive end dates, so we need to subtract 1 day
    const newEndDate = eventInfo.event.end
      ? (() => {
          const endDate = new Date(eventInfo.event.end)
          endDate.setDate(endDate.getDate() - 1)
          return endDate.toLocaleDateString('en-CA')
        })()
      : newStartDate

    const originalStart = existingTask.start_planned
    const originalEnd = existingTask.end_planned

    // Проверяем, что изменилось
    const startChanged = newStartDate !== originalStart
    const endChanged = newEndDate !== originalEnd

    console.log('🔍 Resize change detection:', {
      originalStart,
      originalEnd,
      newStartDate,
      newEndDate,
      startChanged,
      endChanged,
    })

    // Определяем тип resize по тому, какая граница была перетащена
    // В FullCalendar resize начала может изменять и начало, и конец
    // Но мы должны обрабатывать это как изменение только начала
    let resizeType: 'start' | 'end' | 'both' = 'both'

    if (startChanged && !endChanged) {
      resizeType = 'start'
    } else if (!startChanged && endChanged) {
      resizeType = 'end'
    } else if (startChanged && endChanged) {
      // Если изменились оба, определяем по тому, какая граница была перетащена
      // Для этого нужно проверить, какая граница изменилась больше
      const startDiff = Math.abs(
        new Date(newStartDate + 'T00:00:00').getTime() -
          new Date(originalStart + 'T00:00:00').getTime(),
      )
      const endDiff = Math.abs(
        new Date(newEndDate + 'T00:00:00').getTime() -
          new Date(originalEnd + 'T00:00:00').getTime(),
      )

      console.log('🔍 Resize direction detection:', {
        startDiff,
        endDiff,
        startChangedMore: startDiff > endDiff,
      })

      // Если начало изменилось больше - это resize начала
      // Если конец изменился больше - это resize конца
      if (startDiff > endDiff) {
        resizeType = 'start'
      } else {
        resizeType = 'end'
      }
    }

    console.log('🎯 Resize type detected:', resizeType)

    // Обрабатываем разные типы resize
    const finalStartDate = newStartDate
    let finalEndDate = newEndDate

    if (resizeType === 'start') {
      // Изменение начала - оставляем конец как был
      finalEndDate = originalEnd || newEndDate

      console.log('🔧 Start resize - keeping original end:', {
        newStart: newStartDate,
        originalEnd: originalEnd,
        finalEnd: finalEndDate,
      })
    } else if (resizeType === 'end') {
      // Изменение конца - используем дату как есть (без исключительной обработки)
      finalEndDate = newEndDate

      console.log('🔧 End resize - using date as is:', {
        originalEnd: originalEnd,
        newEnd: newEndDate,
        finalEnd: finalEndDate,
        rawEndDate: rawEndDate,
      })
    }

    // Проверяем границы после resize
    const isStartWithinBounds = checkStartBounds(finalStartDate)
    const isEndWithinBounds = checkEndBounds(finalEndDate)

    console.log('🔍 Resize bounds check:', {
      isStartWithinBounds,
      isEndWithinBounds,
      finalStartDate,
      finalEndDate,
      rawEndDate,
      resizeType,
      projectEnd: projectInfo.value?.date_end,
    })
    // Для 'both' используем даты как есть

    console.log('📅 Final resize dates:', {
      finalStartDate,
      finalEndDate,
      resizeType,
    })

    // Create task data with updated dates but keeping all other fields
    const taskData = {
      ...existingTask,
      startPlanned: finalStartDate,
      endPlanned: finalEndDate,
      project_id: props.projectId,
    }

    // Check task dates against project bounds
    if (projectInfo.value) {
      // First check project bounds
      const boundsCheck = checkProjectBounds(taskData as TaskCreateUpdate, projectInfo.value)

      if (!boundsCheck.isWithinBounds) {
        console.log('❌ Task resize outside project bounds:', boundsCheck)

        // Show simple bounds dialog
        simpleBoundsDialog.value = {
          isOpen: true,
          taskStart: taskData.startPlanned,
          taskEnd: taskData.endPlanned,
          projectStart: projectInfo.value.date_start,
          projectEnd: projectInfo.value.date_end,
          adjustedStart: boundsCheck.clampedStart,
          adjustedEnd: boundsCheck.clampedEnd,
          reason: boundsCheck.reason,
          onCancel: () => {
            console.log('❌ User chose to cancel - reverting event')
            try {
              const eventInfo = info as {
                event: { setStart: (date: Date) => void; setEnd: (date: Date) => void }
              }
              eventInfo.event.setStart(new Date(existingTask.start_planned + 'T00:00:00'))
              // For milestones, end should equal start
              if (existingTask.milestone) {
                const endDate = new Date(existingTask.start_planned + 'T00:00:00')
                endDate.setDate(endDate.getDate() + 1) // FullCalendar uses exclusive end dates
                eventInfo.event.setEnd(endDate)
              } else if (existingTask.end_planned) {
                // FullCalendar uses exclusive end dates, so we need to add 1 day
                const endDate = new Date(existingTask.end_planned + 'T00:00:00')
                endDate.setDate(endDate.getDate() + 1)
                eventInfo.event.setEnd(endDate)
              }
            } catch (error) {
              console.error('Error reverting event:', error)
            }
          },
          onAdjust: async () => {
            console.log('✅ User chose to adjust dates to project bounds (RESIZE)')
            console.log('📅 Original taskData:', taskData)
            console.log('📅 Clamped dates:', boundsCheck.clampedStart, boundsCheck.clampedEnd)
            console.log(
              '📅 Project bounds:',
              projectInfo.value?.date_start,
              'to',
              projectInfo.value?.date_end,
            )
            console.log('🎯 Resize type for adjust:', resizeType)

            let adjustedStart = boundsCheck.clampedStart
            let adjustedEnd = boundsCheck.clampedEnd

            if (resizeType === 'start') {
              // Для resize начала - фиксируем конец, корректируем только начало
              adjustedStart = boundsCheck.clampedStart
              adjustedEnd = existingTask.end_planned || boundsCheck.clampedEnd // Оставляем оригинальный конец

              console.log('🔧 Start resize adjust - keeping original end:', {
                adjustedStart,
                originalEnd: existingTask.end_planned,
                adjustedEnd,
              })
            } else if (resizeType === 'end') {
              // Для resize конца - фиксируем начало, корректируем только конец
              adjustedStart = existingTask.start_planned // Оставляем оригинальное начало

              // Для правой границы используем дату конца проекта напрямую
              // boundsCheck.clampedEnd содержит projectInfo.date_end
              adjustedEnd = projectInfo.value?.date_end || boundsCheck.clampedEnd

              console.log('🔧 End resize adjust - keeping original start:', {
                originalStart: existingTask.start_planned,
                adjustedStart,
                adjustedEnd,
                boundsCheckClampedEnd: boundsCheck.clampedEnd,
                projectEnd: projectInfo.value?.date_end,
              })
            } else {
              // Для 'both' - используем clamped даты как есть
              console.log('🔧 Both resize adjust - using clamped dates:', {
                adjustedStart,
                adjustedEnd,
              })
            }

            console.log('🔍 Before adjust - taskData:', {
              startPlanned: taskData.startPlanned,
              endPlanned: taskData.endPlanned,
              start_planned: taskData.start_planned,
              end_planned: taskData.end_planned,
            })

            taskData.startPlanned = adjustedStart
            taskData.endPlanned = adjustedEnd
            // Also update the snake_case field for consistency
            taskData.start_planned = adjustedStart
            taskData.end_planned = adjustedEnd

            console.log('🔍 After adjust - taskData:', {
              startPlanned: taskData.startPlanned,
              endPlanned: taskData.endPlanned,
              start_planned: taskData.start_planned,
              end_planned: taskData.end_planned,
            })
            console.log('📅 Updated taskData:', taskData)

            // Force update the event in FullCalendar
            try {
              const eventInfo = info as {
                event: {
                  setStart: (date: Date) => void
                  setEnd: (date: Date) => void
                  setProp: (prop: string, value: string) => void
                  title: string
                }
              }
              eventInfo.event.setStart(new Date(adjustedStart + 'T00:00:00'))

              // Используем универсальную функцию для обработки даты окончания
              const fullCalendarEndDate = new Date(
                processEndDateForDisplay(adjustedEnd) + 'T00:00:00',
              )

              eventInfo.event.setEnd(fullCalendarEndDate)
              console.log('📅 Event dates updated in FullCalendar:', adjustedStart, adjustedEnd)
              console.log(
                '📅 FullCalendar end date set to:',
                fullCalendarEndDate.toLocaleDateString('en-CA'),
              )

              // Force calendar to refresh the event display
              eventInfo.event.setProp('title', eventInfo.event.title)
            } catch (error) {
              console.error('Error updating event dates:', error)
            }

            // Update task via API
            const updatePayload: Record<string, unknown> = {
              startPlanned: taskData.startPlanned,
              endPlanned: taskData.endPlanned,
            }

            console.log('📤 Updating task via API after adjust:', updatePayload)

            try {
              const updatedTask = await tasksApi.update(props.projectId, taskId, updatePayload)
              console.log('✅ Task updated via API after adjust:', updatedTask)

              // Reload tasks from API to get fresh data
              await loadTasks()
              console.log('✅ Tasks reloaded after adjust')
            } catch (error) {
              console.error('❌ Error updating task via API after adjust:', error)
            }

            // Continue with the update
          },
        }
        isDragging.value = false
        return // Stop here - dialog will handle the update
      }

      // Then check dependency constraints
      const dependencyCheck = checkDependencyConstraints(taskData as TaskCreateUpdate, tasks.value)
      if (!dependencyCheck.isValid) {
        // Show dependency validation dialog
        dependencyDialog.value = {
          isOpen: true,
          taskStart: taskData.startPlanned,
          taskEnd: taskData.endPlanned,
          violatedConstraints: dependencyCheck.violatedConstraints,
          suggestedStart: dependencyCheck.suggestedStartDate || '',
          suggestedEnd: dependencyCheck.suggestedEndDate || '',
          reason: dependencyCheck.reason,
          onCancel: () => {
            console.log('❌ User chose to cancel - reverting event')
            try {
              const eventInfo = info as {
                event: { setStart: (date: Date) => void; setEnd: (date: Date) => void }
              }
              eventInfo.event.setStart(new Date(existingTask.start_planned + 'T00:00:00'))
              // For milestones, end should equal start
              if (existingTask.milestone) {
                const endDate = new Date(existingTask.start_planned + 'T00:00:00')
                endDate.setDate(endDate.getDate() + 1) // FullCalendar uses exclusive end dates
                eventInfo.event.setEnd(endDate)
              } else if (existingTask.end_planned) {
                // FullCalendar uses exclusive end dates, so we need to add 1 day
                const endDate = new Date(existingTask.end_planned + 'T00:00:00')
                endDate.setDate(endDate.getDate() + 1)
                eventInfo.event.setEnd(endDate)
              }
            } catch (error) {
              console.error('Error reverting event:', error)
            }
          },
          onAdjust: async () => {
            console.log('✅ User chose to adjust dates to respect dependencies (RESIZE)')
            if (!dependencyCheck.suggestedStartDate || !dependencyCheck.suggestedEndDate) {
              console.error('❌ No suggested dates available')
              return
            }

            const adjustedTaskData = {
              ...taskData,
              startPlanned: dependencyCheck.suggestedStartDate,
              endPlanned: dependencyCheck.suggestedEndDate,
            }

            try {
              const updatePayload: Record<string, unknown> = {
                startPlanned: adjustedTaskData.startPlanned,
                endPlanned: adjustedTaskData.endPlanned,
              }

              await tasksApi.update(props.projectId, taskId, updatePayload)
              console.log('✅ Task adjusted to respect dependencies and saved')

              // Update local task data
              const taskIndex = tasks.value.findIndex((t) => t.id.toString() === taskId)
              if (taskIndex > -1) {
                tasks.value[taskIndex] = {
                  ...tasks.value[taskIndex],
                  start_planned: adjustedTaskData.startPlanned,
                  end_planned: adjustedTaskData.endPlanned,
                }
              }

              // Update calendar display
              const eventInfo = info as {
                event: { setStart: (date: Date) => void; setEnd: (date: Date) => void }
              }
              eventInfo.event.setStart(new Date(adjustedTaskData.startPlanned + 'T00:00:00'))
              if (adjustedTaskData.endPlanned) {
                const endDate = new Date(adjustedTaskData.endPlanned + 'T00:00:00')
                endDate.setDate(endDate.getDate() + 1)
                eventInfo.event.setEnd(endDate)
              }

              emit('taskUpdate', adjustedTaskData as Task)

              // Restore selection after adjust
              setTimeout(() => {
                if (selectedTask.value) {
                  restoreTaskSelection(selectedTask.value.id)
                }
              }, 200)
            } catch (error) {
              console.error('❌ Error adjusting task:', error)
            }
          },
        }
        isDragging.value = false
        return // Stop here - dialog will handle the update
      }
    }

    console.log('🔄 Reached API update section - taskData:', {
      startPlanned: taskData.startPlanned,
      endPlanned: taskData.endPlanned,
      start_planned: taskData.start_planned,
      end_planned: taskData.end_planned,
    })

    const updatePayload: Record<string, unknown> = {
      startPlanned: taskData.startPlanned,
      endPlanned: taskData.endPlanned,
      // Duration will be calculated automatically by frontend
    }

    console.log('🔄 Resize: Updating task via PUT /api/v1/projects/{project_id}/tasks/{task_id}', {
      projectId: props.projectId,
      taskId,
      payload: updatePayload,
      start_planned: taskData.startPlanned,
      end_planned: taskData.endPlanned,
    })

    try {
      const updatedTask = await tasksApi.update(props.projectId, taskId, updatePayload)
      console.log('✅ Resize: Task dates updated successfully:', updatedTask)

      // Reload tasks from API to get fresh data
      await loadTasks()

      // Reapply project bounds styling after task resize
      setTimeout(() => {
        applyProjectBoundsStyling()

        // Restore selection if a task was previously selected
        if (selectedTask.value) {
          restoreTaskSelection(selectedTask.value.id)
        }
      }, 100)
    } catch (apiError) {
      console.error('❌ API update failed for resize, keeping local changes:', apiError)
      // Don't revert - keep the visual change even if API fails
    }

    emit('taskUpdate', { id: taskId, start_planned: newStartDate, end_planned: newEndDate } as Task)
    console.log('✅ Task resized successfully')
  } catch (error) {
    console.error('❌ Error updating task:', error)
    // Revert the change
    if (
      info &&
      typeof info === 'object' &&
      'revert' in info &&
      typeof (info as Record<string, unknown>).revert === 'function'
    ) {
      ;((info as Record<string, unknown>).revert as () => void)()
    }
  } finally {
    // Reset resizing flag
    isResizing.value = false
  }
}

// Handle simple bounds dialog events
function handleSimpleBoundsCancel() {
  console.log('🚪 Simple bounds dialog - Cancel')
  if (simpleBoundsDialog.value.onCancel) {
    simpleBoundsDialog.value.onCancel()
  }
  simpleBoundsDialog.value.isOpen = false
}

async function handleSimpleBoundsAdjust() {
  console.log('🚪 Simple bounds dialog - Adjust')
  console.log('🚪 Dialog state before adjust:', simpleBoundsDialog.value)
  if (simpleBoundsDialog.value.onAdjust) {
    try {
      await simpleBoundsDialog.value.onAdjust()
      console.log('✅ Adjust function completed successfully')
    } catch (error) {
      console.error('❌ Error in adjust function:', error)
    }
  }
  simpleBoundsDialog.value.isOpen = false
  console.log('🚪 Dialog closed after adjust')
}

// Handle dependency validation dialog events
function handleDependencyCancel() {
  console.log('🚪 Dependency dialog - Cancel')
  if (dependencyDialog.value.onCancel) {
    dependencyDialog.value.onCancel()
  }
  dependencyDialog.value.isOpen = false
}

function handleDependencyAdjust() {
  console.log('🚪 Dependency dialog - Adjust')
  if (dependencyDialog.value.onAdjust) {
    dependencyDialog.value.onAdjust()
  }
  dependencyDialog.value.isOpen = false
}

// Watch for projectId changes
watch(
  () => props.projectId,
  () => {
    if (props.projectId) {
      loadTasks()
    }
  },
)

// Watch for calendar events changes
watch(
  calendarEvents,
  () => {
    console.log('📅 Calendar events changed, refreshing calendar')
    if (calendarRef.value) {
      const calendarApi = calendarRef.value.getApi()
      calendarApi.refetchEvents()
    }
  },
  { deep: true },
)

// Watch filteredTasks to update calendar events
watch(filteredTasks, () => {
  if (viewMode.value === 'ical' && calendarRef.value) {
    const calendarApi = calendarRef.value.getApi()
    calendarApi.refetchEvents()
  }
}, { deep: true })

// Watch for dependency indicators toggle changes
watch(shouldShowDependencyIndicators, () => {
  console.log('🔄 Dependency indicators toggle changed, updating calendar events')
  if (viewMode.value === 'ical' && calendarRef.value) {
    const calendarApi = calendarRef.value.getApi()
    calendarApi.refetchEvents()
  }
})

// Watch for selected task changes to restore selection in calendar
watch(selectedTask, (newSelectedTask) => {
  console.log('🎯 selectedTask changed:', newSelectedTask?.name || 'null', 'viewMode:', viewMode.value)
  if (newSelectedTask && viewMode.value === 'ical') {
    console.log('🎯 Restoring task selection in calendar:', newSelectedTask.name)
    // Use nextTick with delay to ensure calendar is fully rendered
    nextTick(() => {
      setTimeout(() => {
        console.log('🎯 Attempting to restore task selection for ID:', newSelectedTask.id)
        restoreTaskSelection(newSelectedTask.id)
      }, 100) // Reduced delay to prevent double selection
    })
  } else if (!newSelectedTask && viewMode.value === 'ical') {
    console.log('🎯 Clearing task selection in calendar')
    // Clear selection in calendar
    const calendar = calendarRef.value?.getApi()
    if (calendar) {
      // Remove selection from all events using DOM manipulation
      const selectedElements = document.querySelectorAll('.fc-event-selected')
      selectedElements.forEach((element) => {
        element.classList.remove('fc-event-selected')
      })
      document.documentElement.style.removeProperty('--selected-task-id')
    }
  }
}, { immediate: true })

// Watch for view mode changes to restore selection when switching to calendar
watch(viewMode, (newMode, oldMode) => {
  console.log('🔄 viewMode changed from:', oldMode, 'to:', newMode, 'selectedTask:', selectedTask.value?.name || 'null')

  if (newMode === 'ical') {
    console.log('🔄 Switched to calendar view')

    // Only restore if we have a selected task and it's not already selected in calendar
    if (selectedTask.value) {
      const currentSelectedId = document.documentElement.style.getPropertyValue('--selected-task-id')
      if (currentSelectedId !== String(selectedTask.value.id)) {
        console.log('🔄 Restoring task selection after view change:', selectedTask.value.name)
        nextTick(() => {
          setTimeout(() => {
            restoreTaskSelection(selectedTask.value!.id)
          }, 150) // Slightly longer delay for view changes
        })
      } else {
        console.log('🔄 Task already selected in calendar, no need to restore')
      }
    } else {
      console.log('🔄 No selected task to restore in calendar')
    }
  }
})

// Task list functions
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getStatusLabel(status: TaskStatus): string {
  switch (status) {
    case 'planned':
      return 'Planned'
    case 'scheduled':
      return 'Scheduled'
    case 'scheduled_accepted':
      return 'Scheduled Accepted'
    case 'in_progress':
      return 'In Progress'
    case 'partially_completed':
      return 'Partially Completed'
    case 'delayed_due_to_issue':
      return 'Delayed Due To Issue'
    case 'ready_for_inspection':
      return 'Ready For Inspection'
    case 'completed':
      return 'Completed'
    default:
      return 'Unknown'
  }
}

function getStatusClass(status: TaskStatus): string {
  switch (status) {
    case 'planned':
      return 'text-yellow-600'
    case 'scheduled':
      return 'text-indigo-600'
    case 'scheduled_accepted':
      return 'text-purple-600'
    case 'in_progress':
      return 'text-blue-600'
    case 'partially_completed':
      return 'text-teal-600'
    case 'delayed_due_to_issue':
      return 'text-orange-600'
    case 'ready_for_inspection':
      return 'text-cyan-600'
    case 'completed':
      return 'text-green-600'
    default:
      return 'text-gray-600'
  }
}

function editTask(task: Task) {
  console.log('✏️ Edit task:', task.name)
  if (task.milestone) {
    openMilestoneDialog('edit', task.id)
  } else {
    // Open TaskEditPanel instead of TaskDialog
    taskEditPanel.value = {
      isOpen: true,
      mode: 'edit',
      task,
    }
    // Notify parent that edit panel is open
    emit('editPanelOpen', true, task, 'edit')
  }
}

async function duplicateTask(task: Task) {
  console.log('📋 Duplicate task called with:', task.name)
  console.log('📋 Task object:', task)

  try {
    // Create a simplified copy of the task
    const duplicatedTask = {
      name: `${task.name} (Copy)`,
      start_planned: task.start_planned,
      end_planned: task.end_planned,
      status: 'planned' as const,
      milestone: task.milestone,
      task_lead_id: task.task_lead_id, // Add required field
      dependencies:
        Array.isArray(task.dependencies) &&
        task.dependencies.length > 0 &&
        typeof task.dependencies[0] === 'object'
          ? (task.dependencies as { predecessor_id: number; type: string; lag_days: number }[])
          : undefined,
    }

    console.log('📋 Creating duplicated task:', duplicatedTask)

    // Create the duplicated task via API
    const newTask = await tasksApi.create(props.projectId, duplicatedTask)
    console.log('✅ Task duplicated successfully:', newTask)

    // Reload tasks to show the new duplicated task
    await loadTasks()

    // Select the new duplicated task
    selectedTask.value = newTask
    console.log('📋 Selected duplicated task:', newTask.name)
  } catch (error) {
    console.error('❌ Error duplicating task:', error)
    alert('Failed to duplicate task. Please try again.')
  }
}

async function deleteTask(task: Task) {
  console.log('🗑️ Delete task:', task.name)

  if (!confirm(`Are you sure you want to delete "${task.name}"? This action cannot be undone.`)) {
    return
  }

  try {
    await tasksApi.delete(props.projectId, task.id)
    console.log('✅ Task deleted successfully')

    // Reload tasks
    await loadTasks()

    // Clear selection if deleted task was selected
    if (selectedTask.value?.id === task.id) {
      const calendar = calendarRef.value?.getApi()
      if (calendar) {
        // Remove selection from all events
        const allEvents = calendar.getEvents()
        allEvents.forEach((event: { removeClass?: (className: string) => void }) => {
          if (event.removeClass) {
            event.removeClass('fc-event-selected')
          }
        })

        // Also remove selection class from all DOM elements
        const selectedElements = document.querySelectorAll('.fc-event-selected')
        selectedElements.forEach((element) => {
          element.classList.remove('fc-event-selected')
        })
      }

      selectedTask.value = null
      document.documentElement.style.removeProperty('--selected-task-id')
      console.log('📋 Task selection cleared after deletion')
    }
  } catch (error) {
    console.error('❌ Error deleting task:', error)
    alert('Failed to delete task. Please try again.')
  }
}

// Task list detail functions
function selectTaskForDetails(task: Task) {
  selectedTask.value = task
  console.log('📋 Selected task for details:', task.name)
}

// Update selected task after edit
function updateSelectedTask(updatedTask: unknown) {
  if (selectedTask.value && (updatedTask as Task).id === selectedTask.value.id) {
    selectedTask.value = updatedTask as Task
    console.log('📝 Updated selected task details:', (updatedTask as Task).name)
  }
}

function getTaskDuration(task: Task): number {
  if (task.start_planned && task.end_planned) {
    const startDate = new Date(task.start_planned)
    const endDate = new Date(task.end_planned)
    const diffTime = endDate.getTime() - startDate.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }
  return 1
}

function getTaskDependencies(
  task: Task,
): Array<{ id: string; name: string; type: string; lag_days: number }> {
  if (!task.dependencies || task.dependencies.length === 0) return []

  return task.dependencies
    .map((dep) => {
      if (typeof dep === 'number') {
        // Legacy format
        const depTask = tasks.value.find((t) => String(t.id) === String(dep))
        return depTask
          ? {
              id: String(dep),
              name: depTask.name,
              type: 'FS',
              lag_days: 0,
            }
          : null
      } else {
        // New format
        const depTask = tasks.value.find((t) => String(t.id) === String(dep.predecessor_id))
        return depTask
          ? {
              id: String(dep.predecessor_id),
              name: depTask.name,
              type: dep.type,
              lag_days: dep.lag_days,
            }
          : null
      }
    })
    .filter((dep) => dep !== null) as Array<{
    id: string
    name: string
    type: string
    lag_days: number
  }>
}

function getTaskTeamInfo(task: Task): Array<{ id: number; name: string; role: string }> {
  const team: Array<{ id: number; name: string; role: string }> = []

  // Add task lead
  if (task.task_lead_id) {
    const leadPerson = availablePeople.value.find((p) => p.id === task.task_lead_id)
    if (leadPerson) {
      team.push({ ...leadPerson, role: `${leadPerson.role} (Lead)` })
    }
  }

  // Add team members
  if (task.team_members) {
    task.team_members.forEach((memberId) => {
      const member = availablePeople.value.find((p) => p.id === memberId)
      if (member) {
        team.push(member)
      }
    })
  }

  return team
}

// Available people data - loaded from API
const availablePeople = ref<Array<{ id: number; name: string; role: string }>>([])

// Load project team members from API
async function loadAvailablePeople() {
  if (!props.projectId) {
    console.warn('⚠️ No project ID provided, cannot load team members')
    availablePeople.value = []
    return
  }

  try {
    console.log('👥 Loading project team members for calendar display, project:', props.projectId)
    const response = await projectApi.getTeamMembers(props.projectId)
    console.log('🔍 Full API response:', response)

    // Map the API response structure to our expected format
    const apiTeamMembers = response.data?.team_members || response.team_members || []
    availablePeople.value = apiTeamMembers.map((member: ProjectTeamMember & { team_member_id?: number; full_name?: string; first_name?: string; last_name?: string; role_name?: string; project_role?: string; role?: string }) => ({
      id: member.id || member.user_id || member.team_member_id || 0,
      name: member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.name || 'Unknown',
      role: member.role_name || member.project_role || member.role_in_project || member.role || 'Worker',
    }))

    console.log('✅ Available people loaded for calendar:', availablePeople.value.length)
  } catch (error) {
    console.error('❌ Error loading project team members:', error)
    availablePeople.value = []
  }
}

// Load all project workers including task leads for filtering
async function loadAllProjectWorkers() {
  if (!props.projectId) {
    allProjectWorkers.value = []
    return
  }

  try {
    console.log('👥 Loading all project workers for filtering, project:', props.projectId)

    // Get team members from project
    const teamResponse = await projectApi.getTeamMembers(props.projectId)
    const apiTeamMembers = teamResponse.data?.team_members || teamResponse.team_members || []

    // Create a map to store unique workers
    const workersMap = new Map<number, { id: number; name: string; role: string }>()

    // Add team members
    apiTeamMembers.forEach((member: ProjectTeamMember & { full_name?: string; first_name?: string; last_name?: string; role_name?: string; project_role?: string; role?: string }) => {
      const id = member.id || member.user_id || 0
      if (id && !workersMap.has(id)) {
        workersMap.set(id, {
          id,
          name: member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.name || 'Unknown',
          role: member.role_name || member.project_role || member.role_in_project || member.role || 'Worker',
        })
      }
    })

    // Add task leads from all tasks
    tasks.value.forEach((task) => {
      if (task.task_lead_id && !workersMap.has(task.task_lead_id)) {
        // Try to find the worker in team members
        const teamMember = apiTeamMembers.find((m: ProjectTeamMember) =>
          (m.id || m.user_id) === task.task_lead_id
        )

        if (teamMember) {
          const teamMemberWithExtras = teamMember as ProjectTeamMember & { full_name?: string; first_name?: string; last_name?: string; role_name?: string; project_role?: string }
          workersMap.set(task.task_lead_id, {
            id: task.task_lead_id,
            name: teamMemberWithExtras.full_name || `${teamMemberWithExtras.first_name || ''} ${teamMemberWithExtras.last_name || ''}`.trim() || teamMember.name || 'Unknown',
            role: teamMemberWithExtras.role_name || teamMemberWithExtras.project_role || teamMember.role_in_project || 'Task Lead',
          })
        } else {
          // Add with placeholder name if not found
          workersMap.set(task.task_lead_id, {
            id: task.task_lead_id,
            name: `Worker #${task.task_lead_id}`,
            role: 'Task Lead',
          })
        }
      }

      // Add team members from tasks
      if (task.team_members && Array.isArray(task.team_members)) {
        task.team_members.forEach((workerId: number) => {
          if (workerId && !workersMap.has(workerId)) {
            const teamMember = apiTeamMembers.find((m: ProjectTeamMember) =>
              (m.id || m.user_id) === workerId
            )

            if (teamMember) {
              const teamMemberWithExtras = teamMember as ProjectTeamMember & { full_name?: string; first_name?: string; last_name?: string; role_name?: string; project_role?: string }
              workersMap.set(workerId, {
                id: workerId,
                name: teamMemberWithExtras.full_name || `${teamMemberWithExtras.first_name || ''} ${teamMemberWithExtras.last_name || ''}`.trim() || teamMember.name || 'Unknown',
                role: teamMemberWithExtras.role_name || teamMemberWithExtras.project_role || teamMember.role_in_project || 'Team Member',
              })
            } else {
              workersMap.set(workerId, {
                id: workerId,
                name: `Worker #${workerId}`,
                role: 'Team Member',
              })
            }
          }
        })
      }
    })

    allProjectWorkers.value = Array.from(workersMap.values()).sort((a, b) => a.name.localeCompare(b.name))
    console.log('✅ All project workers loaded for filtering:', allProjectWorkers.value.length)
  } catch (error) {
    console.error('❌ Error loading all project workers:', error)
    allProjectWorkers.value = []
  }
}

// Task dialog functions
function openTaskDialog(
  mode: 'create' | 'edit' | 'view',
  taskId?: string | null,
  initialDate?: string,
) {
  console.log('🔧 Opening task dialog:', mode, taskId, 'initialDate:', initialDate)

  if (taskId) {
    console.log('🔍 Looking for task with ID:', taskId, 'type:', typeof taskId)
    console.log(
      '🔍 Available task IDs:',
      tasks.value.map((t) => ({ id: t.id, type: typeof t.id })),
    )
    // Try both strict and loose comparison
    const task = tasks.value.find(
      (t) => t.id === taskId || t.id == taskId || String(t.id) === String(taskId),
    )
    if (task) {
      console.log('🔧 Found task for edit/view:', task.name)
      taskDialog.value = {
        isOpen: true,
        mode,
        task,
        initialDate: undefined, // No initial date for edit/view
      }
    } else {
      console.log('❌ Task not found:', taskId)
      console.log('❌ Available tasks:', tasks.value)
    }
  } else {
    // Create mode
    console.log('🔧 Setting dialog to create mode with initialDate:', initialDate)
    taskDialog.value = {
      isOpen: true,
      mode: 'create',
      task: null,
      initialDate: initialDate, // Pass initial date for create mode
    }
    console.log('🔧 TaskDialog state set:', taskDialog.value)
  }

  console.log('🔧 Dialog state after update:', taskDialog.value)
}

// Milestone dialog functions
function openMilestoneDialog(
  mode: 'create' | 'edit' | 'view',
  taskId?: string | null,
  initialDate?: string,
) {
  console.log('🔧 Opening milestone dialog:', mode, taskId, 'initialDate:', initialDate)

  if (taskId) {
    console.log('🔍 Looking for milestone with ID:', taskId, 'type:', typeof taskId)
    console.log(
      '🔍 Available task IDs:',
      tasks.value.map((t) => ({ id: t.id, type: typeof t.id })),
    )
    // Try both strict and loose comparison
    const task = tasks.value.find(
      (t) => t.id === taskId || t.id == taskId || String(t.id) === String(taskId),
    )
    if (task) {
      console.log('🔧 Found milestone for edit/view:', task.name)
      milestoneDialog.value = {
        isOpen: true,
        mode,
        task,
        initialDate: undefined, // No initial date for edit/view
      }
    } else {
      console.log('❌ Milestone not found:', taskId)
      console.log('❌ Available tasks:', tasks.value)
    }
  } else {
    // Create mode
    console.log('🔧 Setting milestone dialog to create mode with initialDate:', initialDate)
    milestoneDialog.value = {
      isOpen: true,
      mode: 'create',
      task: null,
      initialDate: initialDate, // Pass initial date for create mode
    }
    console.log('🔧 MilestoneDialog state set:', milestoneDialog.value)
  }

  console.log('🔧 Milestone dialog state after update:', milestoneDialog.value)
}

function closeTaskDialog() {
  console.log('🔒 Closing task dialog')
  taskDialog.value.isOpen = false
  taskDialog.value.task = null
  taskDialog.value.initialDate = undefined
  console.log('✅ Task dialog closed successfully')
}

// Template dialog functions
function openTemplateDialog() {
  console.log('📋 Opening template dialog')
  templateDialog.value.isOpen = true
}

function closeTemplateDialog() {
  console.log('🔒 Closing template dialog')
  templateDialog.value.isOpen = false
}

async function handleTasksCreatedFromTemplates(tasks: unknown[]) {
  console.log('✅ Tasks created from templates:', tasks.length)
  // Reload tasks to show newly created ones
  await loadTasks()
  closeTemplateDialog()
}

// TaskViewDialog functions
function openTaskViewDialog(taskId: string) {
  console.log('🔧 Opening task view dialog for task:', taskId)
  const task = tasks.value.find((t) => String(t.id) === String(taskId))
  if (task) {
    console.log('🔧 Found task for view:', task.name)
    taskViewDialog.value = {
      isOpen: true,
      task,
    }
  } else {
    console.log('❌ Task not found:', taskId)
  }
}

function closeTaskViewDialog() {
  taskViewDialog.value.isOpen = false
  taskViewDialog.value.task = null
}

// TaskEditPanel functions
function closeTaskEditPanel() {
  taskEditPanel.value.isOpen = false
  taskEditPanel.value.task = null
  // Notify parent that edit panel is closed
  emit('editPanelOpen', false, null, undefined)
}

async function handleTaskEditPanelSave(taskData: (Partial<TaskCreateUpdate> | Partial<Task>) & { id?: string }) {
  console.log('='.repeat(80))
  console.log('📥 ProjectCalendar: handleTaskEditPanelSave called')
  console.log('📋 Edit panel mode:', taskEditPanel.value.mode)
  console.log('📋 Task ID in data:', taskData.id)
  console.log('📋 Task from panel:', taskEditPanel.value.task?.id)
  console.log('📋 Full taskData received:', JSON.stringify(taskData, null, 2))
  console.log('='.repeat(80))

  try {
    // Determine if this is create or update
    const isUpdate = !!(taskData.id || (taskEditPanel.value.mode === 'edit' && taskEditPanel.value.task?.id))
    const taskId = taskData.id || taskEditPanel.value.task?.id

    if (isUpdate && taskId) {
      // Update existing task
      console.log('✏️ Updating existing task:', taskId)
      const updatedData = {
        ...taskData,
        id: taskId,
      }
      // Temporarily set taskDialog mode to 'edit' for handleTaskSave
      const previousMode = taskDialog.value.mode
      taskDialog.value.mode = 'edit'
      await handleTaskSave(updatedData)
      taskDialog.value.mode = previousMode
    } else {
      // Create new task
      console.log('➕ Creating new task')
      taskDialog.value.mode = 'create'
      await handleTaskSave(taskData as TaskCreateUpdate)
    }

    // Only close panel on success
    closeTaskEditPanel()
  } catch (error) {
    console.error('❌ Error saving task from edit panel:', error)
    // Error message is already shown by handleTaskSave
    // Don't close panel on error so user can retry
  }
}

async function handleTaskEditPanelDelete(taskId: string) {
  console.log('🗑️ Deleting task from edit panel:', taskId)
  await handleTaskDelete(taskId)
  closeTaskEditPanel()
}

async function handleTaskEditPanelDuplicate(task: Task) {
  console.log('📋 Duplicating task from edit panel:', task.name)
  await handleTaskDuplicate(task)
  closeTaskEditPanel()
}

function closeMilestoneDialog() {
  milestoneDialog.value.isOpen = false
  milestoneDialog.value.task = null
  milestoneDialog.value.initialDate = undefined
}

function handleProjectUpdated(updatedProject: Project) {
  console.log('📅 Project updated in calendar:', updatedProject)

  // Update local project info
  projectInfo.value = updatedProject

  // Force calendar to refresh and reapply styling
  setTimeout(() => {
    if (calendarRef.value) {
      const calendarApi = calendarRef.value.getApi()
      calendarApi.refetchEvents()
      console.log('🔄 Calendar refreshed after project update')

      // Apply styling after calendar refresh
      setTimeout(() => {
        applyProjectBoundsStyling()
        console.log('🎨 Project bounds styling reapplied after update')
      }, 200)
    }
  }, 100)
}

function handleTaskUpdate(updatedTask: Task) {
  console.log('📅 Task updated from Gantt, emitting to parent:', updatedTask)

  // Emit to parent component to update the original data
  emit('taskUpdate', updatedTask)
}

// New Gantt event handlers
// New Gantt event handlers removed - using only working Gantt

// Handle sort change from Gantt chart
async function handleSortChanged(sortBy: 'start_date' | 'task_order') {
  console.log('🔄 Sort changed in Gantt:', sortBy)

  try {
    // Reload tasks with new sorting
    const filters: TaskFilter = {
      sortBy: sortBy,
      sortOrder: 'asc'
    }

    const response = await tasksApi.getAll(props.projectId, undefined, undefined, filters)
    tasks.value = response.tasks || []

    console.log('✅ Tasks reloaded with new sorting:', tasks.value.length, 'tasks')
  } catch (error) {
    console.error('❌ Failed to reload tasks with new sorting:', error)
  }
}

// Handle task order update from Gantt chart
async function handleTaskOrderUpdated(taskOrderData: { projectId: number; order: number[] }) {
  console.log('📤 Task order updated:', taskOrderData)

  try {
    // Send to backend API
    await tasksApi.reorderTasks(taskOrderData.projectId, taskOrderData.order)
    console.log('✅ Task order saved to backend successfully')
  } catch (error) {
    console.error('❌ Failed to save task order to backend:', error)
    // TODO: Show user notification about the error
  }
}

// Handle task selection from Gantt chart
function handleTaskSelected(task: Task | null) {
  console.log('🎯 Task selected in Gantt:', task?.name || 'none')
  selectedTask.value = task
}


function handleOpenProjectSettings() {
  console.log('⚙️ Opening project settings from task dialog')
  // Emit event to parent component to open project settings
  emit('openProjectSettings')
}

async function handleTaskSave(taskData: (Partial<TaskCreateUpdate> | Partial<Task>) & { id?: string }) {
  console.log('='.repeat(80))
  console.log('📥 ProjectCalendar: handleTaskSave called')
  console.log('📋 Dialog mode:', taskDialog.value.mode)
  console.log('📋 Task data ID:', taskData.id)
  console.log('📋 Full taskData:', JSON.stringify(taskData, null, 2))
  console.log('='.repeat(80))

  // Determine if this is create or update based on taskData.id
  const isUpdate = !!taskData.id
  const dialogMode = taskDialog.value.mode || (isUpdate ? 'edit' : 'create')

  try {
    if (dialogMode === 'create' && !isUpdate) {
      // Create new task via API
      console.log('➕ Creating new task via API')

      // Build create payload - use camelCase for TaskCreateUpdate interface
      console.log('📋 Full taskData for create:', JSON.stringify(taskData, null, 2))

      const createPayload: Record<string, unknown> = {}

      // Required fields
      createPayload.name = taskData.name || ''
      createPayload.startPlanned = taskData.start_planned || ''
      createPayload.endPlanned = taskData.end_planned || taskData.start_planned || ''
      createPayload.status = taskData.status || 'planned'
      createPayload.progressPct = taskData.progress_pct || 0

      // Optional fields
      if (taskData.wbs_path) createPayload.wbsPath = taskData.wbs_path
      if (taskData.duration_days) createPayload.durationDays = taskData.duration_days
      if (taskData.notes) createPayload.notes = taskData.notes

      // Handle milestone - convert to milestone_type for TaskCreateUpdate
      if (taskData.milestone_type !== undefined && taskData.milestone_type !== null) {
        createPayload.milestone_type = taskData.milestone_type
        console.log('🎯 Setting milestone_type for create:', taskData.milestone_type)
      } else if (taskData.milestone !== undefined && taskData.milestone !== null && taskData.milestone !== false && taskData.milestone !== 0) {
        if (typeof taskData.milestone === 'string') {
          createPayload.milestone_type = taskData.milestone
          console.log('🎯 Setting milestone_type from milestone (string):', taskData.milestone)
        } else if (taskData.milestone === true) {
          createPayload.milestone_type = 'other'
          console.log('🎯 Setting milestone_type to "other" (boolean true)')
        }
      } else {
        console.log('🎯 No milestone data, not setting milestone_type')
      }

      // Team and resources - only include if they have values
      if (taskData.task_lead_id !== undefined && taskData.task_lead_id !== null && taskData.task_lead_id !== 0 && typeof taskData.task_lead_id === 'number') {
        const leadId = Number(taskData.task_lead_id)
        if (!isNaN(leadId) && leadId > 0) {
          createPayload.task_lead_id = leadId
          console.log('👤 Setting task_lead_id for create:', createPayload.task_lead_id)
        } else {
          console.log('👤 task_lead_id is not a valid positive number, skipping:', taskData.task_lead_id)
        }
      } else {
        console.log('👤 task_lead_id is undefined/null/0/empty, not including in create payload')
      }

      if (taskData.team_members && taskData.team_members.length > 0) {
        createPayload.team_members = taskData.team_members
        console.log('👥 Setting team_members for create:', taskData.team_members)
      }

      if (taskData.resources && taskData.resources.length > 0) {
        createPayload.resources = taskData.resources
      }

      if (taskData.dependencies && taskData.dependencies.length > 0) {
        // Convert dependencies from Task format (number[] or objects) to TaskCreateUpdate format (objects only)
        if (Array.isArray(taskData.dependencies)) {
          const deps = taskData.dependencies
          if (deps.length > 0 && typeof deps[0] === 'number') {
            // Convert number[] to dependency objects
            createPayload.dependencies = (deps as number[]).map(id => ({
              predecessor_id: id,
              type: 'FS',
              lag_days: 0
            }))
          } else {
            // Already in correct format
            createPayload.dependencies = deps as Array<{ predecessor_id: number; type: string; lag_days: number }>
          }
        }
      }

      // Handle invited_people for milestones - always set [] for milestones, never null
      const isMilestone = createPayload.milestone_type || taskData.milestone || taskData.milestone_type
      if (isMilestone) {
        // For milestones, always set invited_people (empty array if none, never null)
        // invited_people exists only in TaskCreateUpdate, not in Task
        if ('invited_people' in taskData && taskData.invited_people !== undefined && Array.isArray(taskData.invited_people) && taskData.invited_people.length > 0) {
          createPayload.invited_people = taskData.invited_people
          console.log('👥 Setting invited_people for milestone create:', taskData.invited_people)
        } else {
          // Empty array for milestone with no invited people (ALWAYS set, never null for milestones)
          createPayload.invited_people = []
          console.log('👥 No invited people, setting empty array [] for milestone create (never null)')
        }
      } else {
        // For regular tasks, explicitly set to null
        createPayload.invited_people = null
        console.log('👥 Regular task, setting invited_people to null')
      }

      console.log('📤 Sending create payload:', createPayload)
      console.log('📤 Payload JSON:', JSON.stringify(createPayload, null, 2))

      const newTask = await tasksApi.create(
        props.projectId,
        createPayload as unknown as TaskCreateUpdate,
      )
      console.log('✅ Task created via API:', newTask)

      // Reload tasks from API to get fresh data
      await loadTasks()

      // Reapply project bounds styling after task creation
      setTimeout(() => {
        applyProjectBoundsStyling()
      }, 100)

      // Close milestone dialog if it was open
      if (milestoneDialog.value.isOpen && milestoneDialog.value.mode === 'create') {
        closeMilestoneDialog()
      } else {
        closeTaskDialog()
      }
    } else {
      // Update existing task via API
      console.log('✏️ Updating task via API:', taskData.id)
      console.log('📋 Full taskData received:', JSON.stringify(taskData, null, 2))

      // Build update payload - use snake_case for API
      const updatePayload: Record<string, unknown> = {}

      // Required/important fields
      if (taskData.name !== undefined) updatePayload.name = taskData.name
      if (taskData.start_planned !== undefined) updatePayload.start_planned = taskData.start_planned
      if (taskData.end_planned !== undefined) updatePayload.end_planned = taskData.end_planned
      if (taskData.status !== undefined) updatePayload.status = taskData.status
      if (taskData.progress_pct !== undefined) updatePayload.progress_pct = taskData.progress_pct

      // Optional fields - only include if they exist
      if (taskData.wbs_path !== undefined) updatePayload.wbs_path = taskData.wbs_path
      if (taskData.duration_days !== undefined) updatePayload.duration_days = taskData.duration_days
      if (taskData.notes !== undefined) updatePayload.notes = taskData.notes

      // Handle milestone - API expects 'milestone' field (not milestone_type)
      if (taskData.milestone_type !== undefined && taskData.milestone_type !== null) {
        updatePayload.milestone = taskData.milestone_type
        console.log('🎯 Setting milestone from milestone_type:', taskData.milestone_type)
      } else if (taskData.milestone !== undefined && taskData.milestone !== null && taskData.milestone !== false && taskData.milestone !== 0) {
        if (typeof taskData.milestone === 'string') {
          updatePayload.milestone = taskData.milestone
          console.log('🎯 Setting milestone from milestone (string):', taskData.milestone)
        } else if (taskData.milestone === true) {
          updatePayload.milestone = 'other'
          console.log('🎯 Setting milestone to "other" (boolean true)')
        } else {
          updatePayload.milestone = null
          console.log('🎯 Setting milestone to null')
        }
      } else {
        updatePayload.milestone = null
        console.log('🎯 No milestone data, setting to null')
      }

      // Team and resources
      if (taskData.task_lead_id !== undefined && taskData.task_lead_id !== null && taskData.task_lead_id !== 0 && typeof taskData.task_lead_id === 'number') {
        const leadId = Number(taskData.task_lead_id)
        if (!isNaN(leadId) && leadId > 0) {
          updatePayload.task_lead_id = leadId
          console.log('👤 Setting task_lead_id for update:', updatePayload.task_lead_id)
        } else {
          console.log('👤 task_lead_id is not a valid positive number, skipping:', taskData.task_lead_id)
        }
      } else if (taskData.task_lead_id === null) {
        // Explicitly set to null if it's explicitly null (to clear the field)
        updatePayload.task_lead_id = null
        console.log('👤 Setting task_lead_id to null to clear the field')
      } else {
        console.log('👤 task_lead_id is undefined/0/empty, not including in update payload')
      }

      if (taskData.team_members !== undefined) {
        updatePayload.team_members = taskData.team_members || []
        console.log('👥 Setting team_members:', taskData.team_members)
      }

      if (taskData.resources !== undefined) {
        updatePayload.resources = taskData.resources || []
      }

      if (taskData.dependencies !== undefined) {
        // Convert dependencies from Task format (number[] or objects) to TaskCreateUpdate format (objects only)
        if (Array.isArray(taskData.dependencies) && taskData.dependencies.length > 0) {
          const deps = taskData.dependencies
          if (typeof deps[0] === 'number') {
            // Convert number[] to dependency objects
            updatePayload.dependencies = (deps as number[]).map(id => ({
              predecessor_id: id,
              type: 'FS',
              lag_days: 0
            }))
          } else {
            // Already in correct format
            updatePayload.dependencies = deps as Array<{ predecessor_id: number; type: string; lag_days: number }>
          }
        } else {
          updatePayload.dependencies = []
        }
      }

      // Handle invited_people for milestones - always set [] for milestones, never null
      if (updatePayload.milestone || taskData.milestone || taskData.milestone_type) {
        // For milestones, always set invited_people (empty array if none)
        // invited_people exists only in TaskCreateUpdate, not in Task
        if ('invited_people' in taskData && taskData.invited_people !== undefined && Array.isArray(taskData.invited_people)) {
          updatePayload.invited_people = taskData.invited_people
          console.log('👥 Setting invited_people for milestone update:', taskData.invited_people)
        } else {
          // Empty array for milestone with no invited people (never null for milestones)
          updatePayload.invited_people = []
          console.log('👥 No invited people, setting empty array for milestone update')
        }
      }

      console.log('📤 Sending update payload:', updatePayload)

      const updatedTask = await tasksApi.update(
        props.projectId,
        taskData.id!,
        updatePayload as unknown as Partial<TaskCreateUpdate>,
      )
      console.log('✅ Task updated via API:', updatedTask)

      // Reload tasks from API to get fresh data
      await loadTasks()

      // Reapply project bounds styling after task update
      setTimeout(() => {
        applyProjectBoundsStyling()
      }, 100)

      // Close milestone dialog if it was open
      if (milestoneDialog.value.isOpen && milestoneDialog.value.mode === 'edit') {
        closeMilestoneDialog()
      } else {
        closeTaskDialog()
      }
    }
  } catch (error) {
    console.error('❌ Error saving task:', error)

    // Extract error message from server response
    let errorMessage = 'Failed to save task. Please try again.'
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string; error_code?: number } } }
      if (axiosError.response?.data?.message) {
        errorMessage = axiosError.response.data.message
      }
    }

    alert(`❌ ${errorMessage}`)
    // Don't close dialog on error so user can retry
  }
}

async function handleTaskDelete(taskId: string) {
  console.log('🗑️ Deleting task from dialog:', taskId)

  try {
    await tasksApi.delete(props.projectId, taskId)
    console.log('✅ Task deleted successfully')

    // Reload tasks
    await loadTasks()

    // Clear selection if deleted task was selected
    if (selectedTask.value?.id === taskId) {
      selectedTask.value = null
    }

    // Close dialog
    closeTaskDialog()
  } catch (error) {
    console.error('❌ Error deleting task:', error)
    alert('Failed to delete task. Please try again.')
  }
}

async function handleTaskDuplicate(task: Task) {
  console.log('📋 Duplicating task from dialog:', task.name)
  console.log('📋 Task data for duplication:', task)

  try {
    const duplicateData: TaskCreateUpdate = {
      name: `${task.name} (Copy)`,
      project_id: task.project_id,
      start_planned: task.start_planned,
      end_planned: task.end_planned,
      status: 'planned',
      progress_pct: 0,
      milestone: task.milestone,
      notes: task.notes,
      wbs_path: task.wbs_path,
      task_lead_id: task.task_lead_id, // Добавляем обязательное поле
      dependencies:
        Array.isArray(task.dependencies) &&
        task.dependencies.length > 0 &&
        typeof task.dependencies[0] === 'object'
          ? (task.dependencies as { predecessor_id: number; type: string; lag_days: number }[])
          : undefined,
    }

    await tasksApi.create(props.projectId, duplicateData)
    console.log('✅ Task duplicated successfully')

    // Reload tasks
    await loadTasks()

    // Close dialog
    closeTaskDialog()
  } catch (error) {
    console.error('❌ Error duplicating task:', error)
    alert('Failed to duplicate task. Please try again.')
  }
}

// Calendar mounted handler
function onCalendarMounted() {
  console.log('🎯 FullCalendar mounted, calendar ref available')
  console.log('📅 Calendar should display events:', calendarEvents.value.length)
  console.log('🔧 Can edit events:', props.canEdit)

  // Force calendar to refresh events
  if (calendarRef.value) {
    const calendarApi = calendarRef.value.getApi()
    console.log('📅 Calendar API available:', !!calendarApi)

    // Initialize current view type
    const currentView = calendarApi.view.type
    if (currentView === 'dayGridMonth') {
      currentCalendarView.value = 'month'
      calendarOptions.value.displayEventTime = false
    } else if (currentView === 'timeGridWeek') {
      currentCalendarView.value = 'week'
      calendarOptions.value.displayEventTime = false // All tasks are all-day, no time display
    } else if (currentView === 'timeGridDay') {
      currentCalendarView.value = 'day'
      calendarOptions.value.displayEventTime = false // All tasks are all-day, no time display
    }
    console.log('📅 Initial calendar view:', currentCalendarView.value)

    // Check calendar options
    console.log('🔧 Calendar editable:', calendarApi.getOption('editable'))
    console.log('🔧 Calendar resizable:', calendarApi.getOption('eventResizableFromStart'))

    // Check current events
    const currentEvents = calendarApi.getEvents()
    console.log('📅 Current events in calendar:', currentEvents.length)

    calendarApi.refetchEvents()
    console.log('🔄 Forced calendar refresh')

    // Check events after refresh
    setTimeout(() => {
      const eventsAfterRefresh = calendarApi.getEvents()
      console.log('📅 Events after refresh:', eventsAfterRefresh.length)
    }, 100)
  }
}

// Load tasks on mount
onMounted(() => {
  console.log('🎯 ProjectCalendar mounted, projectId:', props.projectId)
  console.log('📅 Current month/year:', currentMonth, currentYear)
  console.log('🔧 ProjectCalendar canEdit:', props.canEdit)

  // Load project info, tasks, and team members from API
  loadProjectInfo()
  loadTasks()
  loadAvailablePeople()
})

// Clear search function
function clearSearch() {
  console.log('🧹 Clearing search results')

  // Clear search state
  searchResults.value = []
  currentSearchIndex.value = 0
  isSearchActive.value = false

  // Clear any search highlighting
  const calendar = calendarRef.value?.getApi()
  if (calendar) {
    const allEvents = calendar.getEvents()
    allEvents.forEach((event: { removeClass?: (className: string) => void }) => {
      if (event.removeClass) {
        event.removeClass('fc-event-selected')
      }
    })
  }

  // Clear selection
  selectedTask.value = null
  document.documentElement.style.removeProperty('--selected-task-id')
}

// Expose functions for parent component
defineExpose({
  openTaskDialog,
  openMilestoneDialog,
  loadTasks,
  searchTasks,
  clearSearch,
  nextSearchResult,
  previousSearchResult,
  searchResults,
  currentSearchIndex,
  isSearchActive,
  closeTaskEditPanel,
  handleTaskEditPanelDelete,
  handleTaskEditPanelDuplicate,
  duplicateTask,
  updateSelectedTask,
})
</script>

<template>
  <div class="relative flex-1 flex flex-col h-full overflow-x-clip max-w-full">
    <!-- Legend Section -->
    <div class="px-4 py-1 bg-transparent text-xs text-gray-600 mb-2">
      <div class="flex items-start justify-center space-x-6 flex-wrap">
        <!-- Status Legend -->
        <div
          class="flex items-start space-x-2 text-xs border border-gray-300 rounded-md px-3 py-1 bg-gray-50"
        >
          <span class="text-xs font-medium text-gray-700 pt-0.5">Tasks:</span>
          <div class="flex gap-x-3 gap-y-0.5">
            <!-- Left column -->
            <div class="flex flex-col gap-y-0.5">
              <div class="flex items-center space-x-1">
                <div class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: #3B82F6"></div>
                <span class="text-gray-600 text-xs">Planned</span>
              </div>
              <div class="flex items-center space-x-1">
                <div class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: #6366F1"></div>
                <span class="text-gray-600 text-xs">Scheduled</span>
              </div>
              <div class="flex items-center space-x-1">
                <div class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: #8B5CF6"></div>
                <span class="text-gray-600 text-xs">Scheduled Accepted</span>
              </div>
              <div class="flex items-center space-x-1">
                <div class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: #10B981"></div>
                <span class="text-gray-600 text-xs">In Progress</span>
              </div>
            </div>
            <!-- Right column -->
            <div class="flex flex-col gap-y-0.5">
              <div class="flex items-center space-x-1">
                <div class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: #14B8A6"></div>
                <span class="text-gray-600 text-xs">Partially Completed</span>
              </div>
              <div class="flex items-center space-x-1">
                <div class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: #F59E0B"></div>
                <span class="text-gray-600 text-xs">Delayed Due To Issue</span>
              </div>
              <div class="flex items-center space-x-1">
                <div class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: #06B6D4"></div>
                <span class="text-gray-600 text-xs">Ready For Inspection</span>
              </div>
              <div class="flex items-center space-x-1">
                <div class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: #6B7280"></div>
                <span class="text-gray-600 text-xs">Completed</span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center space-x-6">
          <!-- Dependencies Group -->
          <div
            v-if="shouldShowDependencyIndicators"
            class="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-md border border-blue-200"
          >
            <span class="text-xs font-medium text-blue-700">Dependencies:</span>
            <div class="flex items-center gap-2 text-xs">
              <div class="flex items-center space-x-1">
                <span class="text-xs">🔗</span>
                <span class="text-gray-600">FS</span>
              </div>
              <div class="flex items-center space-x-1">
                <span class="text-xs">⚡</span>
                <span class="text-gray-600">SS</span>
              </div>
              <div class="flex items-center space-x-1">
                <span class="text-xs">🏁</span>
                <span class="text-gray-600">FF</span>
              </div>
              <div class="flex items-center space-x-1">
                <span class="text-xs">🔄</span>
                <span class="text-gray-600">SF</span>
              </div>
              <div class="flex items-center space-x-1">
                <span class="text-xs">⏱️</span>
                <span class="text-gray-600">Lag</span>
              </div>
              <div class="flex items-center space-x-1">
                <span class="text-xs">📋</span>
                <span class="text-gray-600">Deps</span>
              </div>
            </div>
          </div>

          <!-- Milestones Group -->
          <div
            v-if="shouldShowDependencyIndicators"
            class="flex items-center space-x-2 bg-purple-50 px-3 py-1 rounded-md border border-purple-200"
          >
            <span class="text-xs font-medium text-purple-700">Milestones:</span>
            <div class="flex items-center gap-2 text-xs">
              <div class="flex items-center space-x-1">
                <span class="text-xs">🔍</span>
                <span class="text-gray-600">Inspection</span>
              </div>
              <div class="flex items-center space-x-1">
                <span class="text-xs">🏗️</span>
                <span class="text-gray-600">Visit</span>
              </div>
              <div class="flex items-center space-x-1">
                <span class="text-xs">👥</span>
                <span class="text-gray-600">Meeting</span>
              </div>
              <div class="flex items-center space-x-1">
                <span class="text-xs">📋</span>
                <span class="text-gray-600">Review</span>
              </div>
              <div class="flex items-center space-x-1">
                <span class="text-xs">📦</span>
                <span class="text-gray-600">Delivery</span>
              </div>
              <div class="flex items-center space-x-1">
                <span class="text-xs">✅</span>
                <span class="text-gray-600">Approval</span>
              </div>
              <div class="flex items-center space-x-1">
                <span class="text-xs">🎯</span>
                <span class="text-gray-600">Other</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg overflow-x-clip max-w-full">
      <!-- Tasks Info -->
      <div v-if="error" class="bg-red-50 border-b border-red-200 px-4 py-2">
        <div class="flex items-center">
          <svg
            class="h-4 w-4 text-red-400 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span class="text-sm text-red-700">{{ error }}</span>
        </div>
      </div>


      <!-- Task Count -->
      <div class="p-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <!-- Add Task/Milestone Buttons -->
            <div v-if="canEdit" class="flex items-center space-x-2">
              <div class="relative group">
                <button
                  ref="addTaskButtonRef"
                  @mouseenter="updateTooltipPosition('task', $event)"
                  @mouseleave="hideTooltip('task')"
                  @click="openTaskDialog('create', undefined, undefined)"
                  class="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  ➕ Add Task
                </button>
              </div>
              <div class="relative group">
                <button
                  ref="addMilestoneButtonRef"
                  @mouseenter="updateTooltipPosition('milestone', $event)"
                  @mouseleave="hideTooltip('milestone')"
                  @click="openMilestoneDialog('create', undefined, undefined)"
                  class="px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-md hover:bg-purple-700 transition-colors"
                >
                  🎯 Add Milestone
                </button>
              </div>
              <!-- Info button with help text -->
              <div class="relative group">
                <button
                  ref="infoButtonRef"
                  @mouseenter="updateTooltipPosition('info', $event)"
                  @mouseleave="hideTooltip('info')"
                  type="button"
                  class="px-2 py-1.5 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </button>
              </div>
              <div class="relative group">
                <button
                  ref="fromTemplatesButtonRef"
                  @mouseenter="updateTooltipPosition('templates', $event)"
                  @mouseleave="hideTooltip('templates')"
                  @click="openTemplateDialog"
                  class="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 transition-colors"
                >
                  📋 From Templates
                </button>
              </div>
              <button
                v-if="selectedTask"
                @click="editTask(selectedTask)"
                class="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
                title="Edit selected task"
              >
                ✏️ Edit
              </button>
              <button
                v-if="selectedTask"
                @click="deleteTask(selectedTask)"
                class="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition-colors"
                title="Delete selected task"
              >
                🗑️ Delete
              </button>
              <button
                v-if="selectedTask"
                @click="duplicateTask(selectedTask)"
                class="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 transition-colors"
                title="Duplicate selected task"
              >
                📝 Duplicate
              </button>

              <!-- Search Navigation -->
              <div
                v-if="isSearchActive && searchResults.length > 1"
                class="flex items-center space-x-1 ml-2"
              >
                <button
                  @click="previousSearchResult"
                  class="px-2 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
                  title="Previous search result"
                >
                  ⬅️
                </button>
                <span class="px-2 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-md">
                  {{ currentSearchIndex + 1 }}/{{ searchResults.length }}
                </span>
                <button
                  @click="nextSearchResult"
                  class="px-2 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
                  title="Next search result"
                >
                  ➡️
                </button>
              </div>
            </div>

            <span v-if="loading" class="text-sm text-gray-500">Loading tasks...</span>
            <span v-else-if="error" class="text-sm text-red-500">{{ error }}</span>
            <span v-else class="text-sm text-gray-500">
              {{ filteredTasks.length }} tasks
              <span v-if="selectedWorkerId" class="ml-2 text-blue-600">
                (filtered by worker)
              </span>
              <span v-if="selectedTask" class="ml-2 text-blue-600">
                | Selected: {{ selectedTask.name }}
                <span v-if="isSearchActive && searchResults.length > 1" class="ml-2 text-green-600">
                  ({{ currentSearchIndex + 1 }}/{{ searchResults.length }})
                </span>
              </span>
            </span>
          </div>

          <div class="flex items-center space-x-4">
            <!-- Filter Button -->
            <button
              @click="filterDialog.isOpen = true"
              :class="[
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-2',
                activeFiltersCount > 0
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300',
              ]"
              :title="activeFiltersCount > 0 ? `${activeFiltersCount} filter(s) active` : 'Filter tasks'"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Filter
              <span
                v-if="activeFiltersCount > 0"
                class="ml-1 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full"
              >
                {{ activeFiltersCount }}
              </span>
            </button>

            <!-- View Mode Toggle -->
            <div class="flex bg-gray-100 rounded-lg p-1">
              <button
                @click="viewMode = 'ical'"
                :class="[
                  'px-3 py-1.5 text-xs font-medium rounded transition-colors',
                  viewMode === 'ical'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800',
                ]"
                title="Calendar view (iCal format)"
              >
                📅 Calendar
              </button>
              <button
                @click="viewMode = 'list'"
                :class="[
                  'px-3 py-1.5 text-xs font-medium rounded transition-colors',
                  viewMode === 'list'
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800',
                ]"
                title="Task list view"
              >
                📝 List
              </button>
              <button
                @click="viewMode = 'gantt'"
                :class="[
                  'px-3 py-1.5 text-xs font-medium rounded transition-colors',
                  viewMode === 'gantt'
                    ? 'bg-white text-green-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800',
                ]"
                title="Gantt chart view"
              >
                📊 Gantt
              </button>

       <!-- Gantt Version Toggle removed - using only the working Gantt -->
            </div>
          </div>
        </div>

        <!-- Calendar View -->
        <div v-if="viewMode === 'ical'" class="flex h-[calc(100vh-300px)] min-h-[600px] overflow-x-clip max-w-full">
        <!-- Task List Sidebar -->
        <div class="w-80 flex-shrink-0 flex flex-col border-r border-gray-200 sticky left-0 z-20 bg-white">
          <TaskListSidebar
            :filtered-tasks="filteredTasks"
            :selected-task-id="selectedTask?.id"
            :active-filters-count="activeFiltersCount"
            @task-selected="selectTaskForDetails"
          />
        </div>
        <!-- Calendar -->
        <div class="flex-1 p-4 bg-white overflow-auto min-w-0 max-w-full">
          <FullCalendar
            ref="calendarRef"
            :options="calendarOptions"
            class="min-h-[600px]"
            @mounted="onCalendarMounted"
          />
        </div>
        </div>

        <!-- Task List View -->
        <div v-else-if="viewMode === 'list'" class="flex h-[calc(100vh-300px)] min-h-[600px] overflow-x-clip max-w-full">
        <!-- Task List Sidebar -->
        <div class="w-80 flex-shrink-0 flex flex-col border-r border-gray-200 sticky left-0 z-20 bg-white">
          <TaskListSidebar
            :filtered-tasks="filteredTasks"
            :selected-task-id="selectedTask?.id"
            :active-filters-count="activeFiltersCount"
            @task-selected="selectTaskForDetails"
          />
        </div>
        <!-- Task Detail View -->
        <div class="flex-1 p-4 overflow-auto bg-gray-50 min-w-0 max-w-full">
          <div v-if="filteredTasks.length === 0" class="text-center text-gray-500 py-8">
            <div class="text-4xl mb-4">📋</div>
            <h3 class="text-lg font-medium mb-2">No Tasks</h3>
            <p class="text-sm text-gray-400">Try adjusting your filters</p>
          </div>
          <div v-else-if="!selectedTask" class="text-center text-gray-500 py-8">
            <div class="text-4xl mb-4">👈</div>
            <h3 class="text-lg font-medium mb-2">Select a task to view details</h3>
            <p class="text-sm text-gray-400">Choose a task from the list on the left</p>
          </div>
          <div v-else class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <!-- Task Header -->
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center space-x-3">
                  <div
                    class="w-4 h-4 rounded-full"
                    :style="{ backgroundColor: getTaskColor(selectedTask.status) }"
                  ></div>
                  <!-- Task/Milestone Icon -->
                  <span v-if="selectedTask.milestone" class="text-xl">🎯</span>
                  <span v-else class="text-xl">📝</span>
                  <h3 class="text-xl font-semibold text-gray-900">{{ selectedTask.name }}</h3>
                </div>
                <div class="flex items-center space-x-2">
                  <button
                    v-if="props.canEdit"
                    @click="editTask(selectedTask)"
                    class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    v-if="props.canEdit"
                    @click="deleteTask(selectedTask)"
                    class="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <!-- Task Basic Details -->
              <div class="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <span class="font-medium text-gray-700">WBS Path:</span>
                  <div class="text-gray-600">{{ selectedTask.wbs_path || 'N/A' }}</div>
                </div>
                <div>
                  <span class="font-medium text-gray-700">Status:</span>
                  <div :class="getStatusClass(selectedTask.status)">
                    {{ getStatusLabel(selectedTask.status) }}
                  </div>
                </div>
                <div>
                  <span class="font-medium text-gray-700">Start Date:</span>
                  <div class="text-gray-600">{{ formatDate(selectedTask.start_planned) }}</div>
                </div>
                <div v-if="selectedTask.end_planned">
                  <span class="font-medium text-gray-700">End Date:</span>
                  <div class="text-gray-600">{{ formatDate(selectedTask.end_planned) }}</div>
                </div>
                <div>
                  <span class="font-medium text-gray-700">Duration:</span>
                  <div class="text-gray-600">{{ getTaskDuration(selectedTask) }} days</div>
                </div>
                <div>
                  <span class="font-medium text-gray-700">Progress:</span>
                  <div class="text-gray-600">{{ selectedTask.progress_pct }}%</div>
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="mb-6">
                <div class="flex items-center justify-between text-sm text-gray-700 mb-2">
                  <span class="font-medium">Progress</span>
                  <span>{{ selectedTask.progress_pct }}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-3">
                  <div
                    class="h-3 rounded-full transition-all"
                    :style="{
                      width: `${selectedTask.progress_pct}%`,
                      backgroundColor: getTaskColor(selectedTask.status),
                    }"
                  ></div>
                </div>
              </div>

              <!-- Dependencies Section -->
              <div v-if="getTaskDependencies(selectedTask).length > 0" class="mb-6">
                <h4 class="text-sm font-medium text-gray-700 mb-2">🔗 Dependencies</h4>
                <div class="space-y-2">
                  <div
                    v-for="dep in getTaskDependencies(selectedTask)"
                    :key="dep.id"
                    class="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                  >
                    <span class="text-gray-900">{{ dep.name }}</span>
                    <span class="text-gray-500"
                      >{{ dep.type }} {{ dep.lag_days > 0 ? `+${dep.lag_days}d` : '' }}</span
                    >
                  </div>
                </div>
              </div>

              <!-- Resources Section -->
              <div v-if="selectedTask.resources && selectedTask.resources.length > 0" class="mb-6">
                <h4 class="text-sm font-medium text-gray-700 mb-2">🚛 Resources</h4>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="resource in selectedTask.resources"
                    :key="resource"
                    class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                  >
                    {{ resource }}
                  </span>
                </div>
              </div>

              <!-- Team Members Section -->
              <div v-if="getTaskTeamInfo(selectedTask).length > 0" class="mb-6">
                <h4 class="text-sm font-medium text-gray-700 mb-2">👥 Team</h4>
                <div class="space-y-2">
                  <div
                    v-for="member in getTaskTeamInfo(selectedTask)"
                    :key="member.id"
                    class="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                  >
                    <span class="text-gray-900">{{ member.name }}</span>
                    <span class="text-gray-500">{{ member.role }}</span>
                  </div>
                </div>
              </div>

              <!-- Notes Section -->
              <div v-if="selectedTask.notes" class="mb-4">
                <h4 class="text-sm font-medium text-gray-700 mb-2">📝 Notes</h4>
                <div class="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  {{ selectedTask.notes }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Gantt View -->
        <div v-else-if="viewMode === 'gantt'" class="p-4 overflow-hidden" style="max-width: 100%; width: 100%;">
         <!-- Gantt Chart -->
         <ProjectGantt
           :project-id="projectId"
           :can-edit="props.canEdit"
           :tasks="filteredTasks"
           :project-start-date="projectInfo?.date_start || ''"
           :project-end-date="projectInfo?.date_end || ''"
           :dynamic-range="false"
           :selected-task-from-parent="selectedTask"
           @task-update="handleTaskUpdate"
           @sort-changed="handleSortChanged"
           @task-order-updated="handleTaskOrderUpdated"
           @task-selected="handleTaskSelected"
         />
        </div>
      </div>

      <!-- Task Dialog -->
      <TaskDialog
        :is-open="taskDialog.isOpen"
        :mode="taskDialog.mode"
        :task="taskDialog.task"
        :project-id="projectId"
        :available-tasks="availableTasksForDependencies"
        :initial-date="taskDialog.initialDate"
        :project-info="projectInfo"
        @close="closeTaskDialog"
        @save="handleTaskSave"
        @delete="handleTaskDelete"
        @duplicate="handleTaskDuplicate"
        @project-updated="handleProjectUpdated"
        @open-project-settings="handleOpenProjectSettings"
      />

      <!-- Task View Dialog (Read-Only) -->
      <TaskViewDialog
        :is-open="taskViewDialog.isOpen"
        :task="taskViewDialog.task"
        :available-tasks="tasks"
        :can-edit="canEdit"
        @close="closeTaskViewDialog"
      />

      <!-- Task Edit Panel (Full-Screen) -->
      <TaskEditPanel
        :is-open="taskEditPanel.isOpen"
        :mode="taskEditPanel.mode"
        :task="taskEditPanel.task"
        :project-id="projectId"
        :available-tasks="tasks"
        :can-manage-project="canEdit"
        @close="closeTaskEditPanel"
        @save="handleTaskEditPanelSave"
        @delete="handleTaskEditPanelDelete"
        @duplicate="handleTaskEditPanelDuplicate"
      />

      <!-- Milestone Dialog -->
      <MilestoneDialog
        :is-open="milestoneDialog.isOpen"
        :mode="milestoneDialog.mode"
        :task="milestoneDialog.task"
        :project-id="projectId"
        :initial-date="milestoneDialog.initialDate"
        :project-info="projectInfo"
        @close="closeMilestoneDialog"
        @save="handleTaskSave"
        @delete="handleTaskDelete"
        @project-updated="handleProjectUpdated"
        @open-project-settings="handleOpenProjectSettings"
      />

      <!-- Simple Bounds Dialog -->
      <SimpleBoundsDialog
        v-if="simpleBoundsDialog.isOpen"
        :is-open="simpleBoundsDialog.isOpen"
        :task-start="simpleBoundsDialog.taskStart"
        :task-end="simpleBoundsDialog.taskEnd"
        :project-start="simpleBoundsDialog.projectStart"
        :project-end="simpleBoundsDialog.projectEnd"
        :adjusted-start="simpleBoundsDialog.adjustedStart"
        :adjusted-end="simpleBoundsDialog.adjustedEnd"
        :reason="simpleBoundsDialog.reason"
        @cancel="handleSimpleBoundsCancel"
        @adjust="handleSimpleBoundsAdjust"
      />

      <!-- Dependency Validation Dialog -->
      <DependencyValidationDialog
        v-if="dependencyDialog.isOpen"
        :is-open="dependencyDialog.isOpen"
        :task-start="dependencyDialog.taskStart"
        :task-end="dependencyDialog.taskEnd"
        :violated-constraints="dependencyDialog.violatedConstraints"
        :suggested-start="dependencyDialog.suggestedStart"
        :suggested-end="dependencyDialog.suggestedEnd"
        :reason="dependencyDialog.reason"
        @cancel="handleDependencyCancel"
        @adjust="handleDependencyAdjust"
      />

      <!-- Task Template Dialog -->
      <TaskTemplateDialog
        :is-open="templateDialog.isOpen"
        :project-id="projectId"
        :project-start-date="projectInfo?.date_start"
        :available-people="availablePeople"
        @close="closeTemplateDialog"
        @tasks-created="handleTasksCreatedFromTemplates"
      />

      <!-- Task Filter Dialog -->
      <TaskFilterDialog
        :is-open="filterDialog.isOpen"
        :filter-state="filterState"
        :available-workers="allProjectWorkers"
        :clear-filters="clearFilters"
        :active-filters-count="activeFiltersCount"
        @close="filterDialog.isOpen = false"
        @update:filter-state="updateFilterState"
        @apply-filters="filterDialog.isOpen = false"
      />
    </div>
  </div>

  <!-- Tooltips using Teleport to render at document root -->
  <Teleport to="body">
    <!-- Task tooltip -->
    <div
      v-if="tooltipState.visible && tooltipState.type === 'task'"
      class="hidden sm:block fixed w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl pointer-events-none transition-opacity"
      :style="{
        left: `${tooltipState.x}px`,
        top: `${tooltipState.y - 10}px`,
        transform: 'translateY(-100%)',
        zIndex: 99999,
      }"
    >
      <div class="font-semibold mb-2 text-sm">➕ Add Task</div>
      <div class="text-gray-300 mb-2">Create a work item with duration, resources, and dependencies.</div>
      <div class="text-gray-400 text-xs border-t border-gray-700 pt-2 mt-2">
        <div class="font-medium mb-1">Use for:</div>
        <div>• Regular construction work (pouring concrete, framing)</div>
        <div>• Activities that take time and resources</div>
        <div>• Tasks with dependencies on other tasks</div>
      </div>
      <div class="absolute top-full left-4 border-4 border-transparent border-t-gray-900"></div>
    </div>

    <!-- Milestone tooltip -->
    <div
      v-if="tooltipState.visible && tooltipState.type === 'milestone'"
      class="hidden sm:block fixed w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl pointer-events-none transition-opacity"
      :style="{
        right: `${tooltipState.x}px`,
        top: `${tooltipState.y - 10}px`,
        transform: 'translateY(-100%)',
        zIndex: 99999,
      }"
    >
      <div class="font-semibold mb-2 text-sm">🎯 Add Milestone</div>
      <div class="text-gray-300 mb-2">Create a key event or checkpoint that marks an important project moment.</div>
      <div class="text-gray-400 text-xs border-t border-gray-700 pt-2 mt-2">
        <div class="font-medium mb-1">Use for:</div>
        <div>• Inspections, meetings, reviews</div>
        <div>• Deliveries, approvals</div>
        <div>• Events with invited people</div>
      </div>
      <div class="absolute top-full right-4 border-4 border-transparent border-t-gray-900"></div>
    </div>

    <!-- Info tooltip -->
    <div
      v-if="tooltipState.visible && tooltipState.type === 'info'"
      class="hidden sm:block fixed w-80 p-4 bg-blue-50 border border-blue-200 text-gray-800 text-xs rounded-lg shadow-xl pointer-events-none transition-opacity"
      :style="{
        left: `${tooltipState.x}px`,
        top: `${tooltipState.y - 10}px`,
        transform: 'translate(-50%, -100%)',
        zIndex: 99999,
      }"
    >
      <div class="font-semibold mb-3 text-sm text-blue-900">What's the difference?</div>
      <div class="space-y-3">
        <div>
          <div class="font-medium text-blue-800 mb-1">➕ Task</div>
          <div class="text-gray-700">Work item with duration, resources, and dependencies. Example: "Pour concrete foundation" (5 days, requires excavator and concrete mixer).</div>
        </div>
        <div>
          <div class="font-medium text-purple-800 mb-1">🎯 Milestone</div>
          <div class="text-gray-700">Key event or checkpoint. Example: "Foundation inspection" (single day, inspector invited).</div>
        </div>
      </div>
      <div class="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-blue-200"></div>
    </div>

    <!-- From Templates tooltip -->
    <div
      v-if="tooltipState.visible && tooltipState.type === 'templates'"
      class="hidden sm:block fixed w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl pointer-events-none transition-opacity"
      :style="{
        left: `${tooltipState.x}px`,
        top: `${tooltipState.y - 10}px`,
        transform: 'translateY(-100%)',
        zIndex: 99999,
      }"
    >
      <div class="font-semibold mb-2 text-sm">📋 From Templates</div>
      <div class="text-gray-300 mb-2">Create multiple tasks at once using pre-defined templates.</div>
      <div class="text-gray-400 text-xs border-t border-gray-700 pt-2 mt-2">
        <div class="font-medium mb-1">Use for:</div>
        <div>• Creating multiple similar tasks quickly</div>
        <div>• Using standard task sequences</div>
        <div>• Batch task creation with templates</div>
      </div>
      <div class="absolute top-full left-4 border-4 border-transparent border-t-gray-900"></div>
    </div>
  </Teleport>
</template>

<style scoped>
/* Calendar header title - make it dark and visible */
:deep(.fc-toolbar-title) {
  color: #111827 !important; /* text-gray-900 */
  font-weight: 600 !important;
  font-size: 1.25rem !important;
}

:deep(.fc-header-toolbar) {
  color: #111827 !important;
}

:deep(.fc-toolbar-title h2) {
  color: #111827 !important; /* text-gray-900 */
  font-weight: 600 !important;
}

/* Project bounds styling - Enhanced visibility */
:deep(.fc-daygrid-day.fc-day-outside-project-bounds) {
  background: linear-gradient(135deg, #f1f3f4 0%, #e8eaed 100%) !important;
  opacity: 0.7 !important;
  pointer-events: none !important;
  cursor: not-allowed !important;
  position: relative !important;
  border: 1px solid #dadce0 !important;
}

/* Add diagonal stripes pattern for better visibility */
:deep(.fc-daygrid-day.fc-day-outside-project-bounds::before) {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.05) 2px,
    rgba(0, 0, 0, 0.05) 4px
  );
  pointer-events: none;
  z-index: 1;
}

:deep(.fc-daygrid-day.fc-day-outside-project-bounds .fc-daygrid-day-number) {
  color: #5f6368 !important;
  font-weight: 500 !important;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8) !important;
  position: relative !important;
  z-index: 2 !important;
}

:deep(.fc-daygrid-day.fc-day-outside-project-bounds .fc-daygrid-day-events) {
  opacity: 0.2 !important;
  filter: grayscale(100%) !important;
}

/* Disable interaction for dates outside project bounds */
:deep(.fc-daygrid-day.fc-day-outside-project-bounds:hover) {
  background: linear-gradient(135deg, #e8eaed 0%, #dadce0 100%) !important;
  transform: none !important;
}

/* Add a subtle border to make it more distinct */
:deep(.fc-daygrid-day.fc-day-outside-project-bounds) {
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1) !important;
}

/* Make the day number more visible with a subtle background */
:deep(.fc-daygrid-day.fc-day-outside-project-bounds .fc-daygrid-day-number) {
  background: rgba(255, 255, 255, 0.6) !important;
  border-radius: 50% !important;
  width: 24px !important;
  height: 24px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin: 2px !important;
}

/* Add a small "blocked" icon in the corner */
:deep(.fc-daygrid-day.fc-day-outside-project-bounds::after) {
  content: '🚫';
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 10px;
  opacity: 0.6;
  z-index: 3;
  pointer-events: none;
}

/* Alternative: Use a CSS icon instead of emoji for better compatibility */
:deep(.fc-daygrid-day.fc-day-outside-project-bounds .fc-daygrid-day-number::after) {
  content: '';
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  background: #dc2626;
  border-radius: 50%;
  border: 1px solid white;
  z-index: 3;
}

/* Resize handles - make them small red circles */
:deep(.fc-event-resizer) {
  width: 12px !important;
  height: 12px !important;
  background-color: #dc2626 !important;
  border: 2px solid #ffffff !important;
  border-radius: 50% !important;
  opacity: 0.8 !important;
  transition: all 0.2s ease !important;
}

:deep(.fc-event-resizer:hover) {
  background-color: #b91c1c !important;
  opacity: 1 !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
}

/* Position resize handles */
:deep(.fc-event-resizer-start) {
  left: -6px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
}

:deep(.fc-event-resizer-end) {
  right: -6px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
}

/* Make events resizable */
:deep(.fc-event) {
  cursor: move !important;
  position: relative !important;
}

:deep(.fc-event:hover) {
  opacity: 0.9 !important;
}

/* Make sure events are resizable */
:deep(.fc-event.fc-event-resizable) {
  border: 2px solid transparent !important;
}

/* Selected task highlighting */
:deep(.fc-event.fc-event-selected) {
  border: 3px solid #3b82f6 !important;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3) !important;
  background-color: #dbeafe !important;
  z-index: 10 !important;
  z-index: 1000 !important;
}

/* Alternative selection using CSS custom property */
:deep(.fc-event[data-event-id]) {
  transition: all 0.2s ease !important;
}

:deep(.fc-event[data-event-id]:hover) {
  border: 2px solid #3b82f6 !important;
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.3) !important;
}

:deep(.fc-event.fc-event-resizable:hover) {
  border: 2px solid #007bff !important;
}

/* Prevent events from disappearing during drag */
:deep(.fc-event.fc-event-dragging) {
  opacity: 0.8 !important;
  z-index: 1000 !important;
}

/* Ensure events stay visible */
:deep(.fc-event) {
  display: block !important;
  visibility: visible !important;
}

/* Prevent horizontal overflow - restrict all calendar elements */
:deep(.fc) {
  max-width: 100% !important;
  overflow-x: clip !important;
}

:deep(.fc-view-harness) {
  max-width: 100% !important;
  overflow-x: clip !important;
}

:deep(.fc-scroller) {
  max-width: 100% !important;
  overflow-x: clip !important;
}

:deep(.fc-scroller-liquid-absolute) {
  max-width: 100% !important;
}

:deep(.fc-daygrid-body) {
  max-width: 100% !important;
}

:deep(.fc-col-header) {
  max-width: 100% !important;
}

/* Ensure sidebar stays in place */
.task-list-sidebar-container {
  position: sticky;
  left: 0;
  z-index: 20;
  background: white;
}
</style>

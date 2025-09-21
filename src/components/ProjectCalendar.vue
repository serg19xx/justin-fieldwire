<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import FullCalendar from '@fullcalendar/vue3' // cspell:ignore fullcalendar
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import type { Task, TaskStatus, TaskCreateUpdate } from '@/types/task'
import { taskToCalendarTask, getTaskColor, processEndDateForDisplay } from '@/utils/task-utils'
import { useAuthStore } from '@/stores/auth'
import { tasksApi } from '@/utils/tasks-api'
import { projectsApi, type Project } from '@/utils/contacts-api'
import { checkProjectBounds } from '@/utils/project-bounds-checker'
import { checkDependencyConstraints } from '@/utils/dependency-validator'
import TaskDialog from './TaskDialog.vue'
import MilestoneDialog from './MilestoneDialog.vue'
import SimpleBoundsDialog from './SimpleBoundsDialog.vue'
import DependencyValidationDialog from './DependencyValidationDialog.vue'

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
  openProjectSettings: []
}>()

// Auth store for user role checking
const authStore = useAuthStore()

// State for dependency indicators toggle
const showDependencyIndicators = ref(true)

// Computed property to determine if user can see dependency indicators
const canSeeDependencyIndicators = computed(() => {
  // Show indicators for managers, supervisors, and admins
  const userRole = authStore.currentUser?.role
  const showForRoles = ['admin', 'manager', 'supervisor']

  // Also check if user has project management permissions
  const hasProjectManagementPermissions = authStore.checkPermission('manage_projects') ||
                                        authStore.checkPermission('manage_tasks')

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
const isDragging = ref(false)
const isResizing = ref(false)
const projectInfo = ref<Project | null>(null)

// Selected task for details view
const selectedTask = ref<Task | null>(null)

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
  onAdjust: null as (() => Promise<void>) | null
})

// Dependency validation dialog state
const dependencyDialog = ref({
  isOpen: false,
  taskStart: '',
  taskEnd: '',
  violatedConstraints: [] as Array<{taskId: string; predecessorId: string; type: 'FS' | 'SS' | 'FF' | 'SF'; lagDays: number; predecessorName: string; predecessorEndDate?: string; predecessorStartDate?: string}>,
  suggestedStart: '',
  suggestedEnd: '',
  reason: '',
  onCancel: null as (() => void) | null,
  onAdjust: null as (() => Promise<void>) | null
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

// Milestone dialog state
const milestoneDialog = ref({
  isOpen: false,
  mode: 'create' as 'create' | 'edit' | 'view',
  task: null as Task | null,
  initialDate: undefined as string | undefined,
})

// Available tasks for dependencies (exclude current task)
const availableTasksForDependencies = computed(() => {
  if (taskDialog.value.task) {
    return tasks.value.filter(t => String(t.id) !== String(taskDialog.value.task?.id))
  }
  return tasks.value
})

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
    projectEndObj: projectEnd
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
      isOutside
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
    projectEnd: projectInfo.value.date_end
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
  displayEventTime: false, // Don't show time for all-day events
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
    console.log('📅 FullCalendar requesting events, returning:', calendarEvents.value.length)
    console.log('📅 Events data:', calendarEvents.value)
    successCallback(JSON.parse(JSON.stringify(calendarEvents.value)))
  },
  datesSet: () => {
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
      if (lastEventClick.value &&
          lastEventClick.value.eventId === eventId &&
          now - lastEventClick.value.time < 500) {
        console.log('📅 Event double-clicked detected:', eventInfo.event.title)
        console.log('🔧 Time between clicks:', now - lastEventClick.value.time, 'ms')
        const mode = props.canEdit ? 'edit' : 'view'
        console.log('🔧 Opening dialog for double-click in mode:', mode, 'canEdit:', props.canEdit)
        console.log('🔧 Event ID:', eventId, 'Type:', typeof eventId)
        // Check if it's a milestone or regular task
        const task = tasks.value.find(t => String(t.id) === String(eventId))
        if (task && task.milestone) {
          openMilestoneDialog(mode, eventId)
        } else {
          openTaskDialog(mode, eventId)
        }
        lastEventClick.value = null // Reset
      } else {
        console.log('📅 Event single-clicked (selection only):', eventInfo.event.title)
        console.log('🔧 Storing click time:', now, 'for event:', eventId)
        lastEventClick.value = { eventId, time: now }

        // Select the task for the Delete button
        console.log('🔍 Looking for task with ID:', eventId, 'in tasks:', tasks.value.length)
        const task = tasks.value.find(t => String(t.id) === String(eventId))
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
            selectedElements.forEach(element => {
              element.classList.remove('fc-event-selected')
            })

            // Add selection to clicked event using FullCalendar API
            const calendarEvent = calendar.getEventById(eventId)
            console.log('🔍 Calendar event found:', !!calendarEvent)
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
                  `.fc-event:has([data-id="${eventId}"])`
                ]

                for (const selector of selectors) {
                  const eventElement = document.querySelector(selector)
                  if (eventElement) {
                    eventElement.classList.add('fc-event-selected')
                    selectionAdded = true
                    console.log('✅ Added selection class via DOM manipulation with selector:', selector, eventId)
                    break
                  }
                }
              }

              // Approach 3: Use event title to find element
              if (!selectionAdded) {
                const eventTitle = calendarEvent.title || task.name
                const allEvents = document.querySelectorAll('.fc-event')
                for (const eventEl of allEvents) {
                  if (eventEl.textContent?.includes(eventTitle)) {
                    eventEl.classList.add('fc-event-selected')
                    selectionAdded = true
                    console.log('✅ Added selection class via title matching:', eventTitle, eventId)
                    break
                  }
                }
              }

              if (!selectionAdded) {
                console.log('⚠️ Could not add selection class to event:', eventId)
                console.log('🔍 Available event data:', {
                  id: eventId,
                  title: calendarEvent.title,
                  start: calendarEvent.start,
                  end: calendarEvent.end
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
      projectInfo: projectInfo.value
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
          isAfterEnd: clickedDate > projectEnd
        })


        if (clickedDate < projectStart || clickedDate > projectEnd) {
          console.log('⚠️ Cannot create task outside project bounds:', dateStr)
          alert(`Cannot create task on ${dateStr}. This date is outside the project bounds (${projectInfo.value.date_start} - ${projectInfo.value.date_end}).`)
          return
        }
      }

      // Check if this is a double-click (within 300ms of last click on same date)
      if (lastDateClick.value &&
          lastDateClick.value.date === dateStr &&
          now - lastDateClick.value.time < 300) {
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
          selectedElements.forEach(element => {
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

  // Clear any existing selection first
  const selectedElements = document.querySelectorAll('.fc-event-selected')
  selectedElements.forEach(element => {
    element.classList.remove('fc-event-selected')
  })

  // Try to find and select the task element
  const selectors = [
    `[data-event-id="${taskId}"]`,
    `.fc-event[data-event-id="${taskId}"]`,
    `.fc-event[data-id="${taskId}"]`,
    `[data-id="${taskId}"]`
  ]

  let selectionRestored = false
  for (const selector of selectors) {
    const eventElement = document.querySelector(selector)
    if (eventElement) {
      eventElement.classList.add('fc-event-selected')
      selectionRestored = true
      console.log('✅ Task selection restored with selector:', selector)
      break
    }
  }

  // If not found by ID, try to find by task name
  if (!selectionRestored && selectedTask.value) {
    const taskName = selectedTask.value.name
    const allEvents = document.querySelectorAll('.fc-event')
    for (const eventEl of allEvents) {
      if (eventEl.textContent?.includes(taskName)) {
        eventEl.classList.add('fc-event-selected')
        selectionRestored = true
        console.log('✅ Task selection restored by name:', taskName)
        break
      }
    }
  }

  if (!selectionRestored) {
    console.log('⚠️ Could not restore task selection for ID:', taskId)
  }

  // Also set CSS custom property
  document.documentElement.style.setProperty('--selected-task-id', String(taskId))
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

    // Convert tasks to calendar events
    const events = tasks.value.map(task => taskToCalendarTask(task, shouldShowDependencyIndicators.value))
    console.log('📅 Converted to calendar events:', events.length, 'events')

    // Update calendar events
    updateCalendarEvents(events)

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
              const eventElement = document.querySelector(`[data-event-id="${selectedTask.value.id}"]`) ||
                                 document.querySelector(`.fc-event[data-event-id="${selectedTask.value.id}"]`)
              if (eventElement) {
                eventElement.classList.add('fc-event-selected')
                console.log('📋 Task selection restored via DOM manipulation:', selectedTask.value.name)
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
    const response = await projectsApi.getById(props.projectId)
    console.log('📋 Raw API response:', response)
    projectInfo.value = (response as any).project || response // eslint-disable-line @typescript-eslint/no-explicit-any
    console.log('✅ Project info loaded for calendar:', {
      projectId: props.projectId,
      projectInfo: projectInfo.value,
      dateStart: projectInfo.value?.date_start,
      dateEnd: projectInfo.value?.date_end,
      hasDateStart: 'date_start' in (projectInfo.value || {}),
      hasDateEnd: 'date_end' in (projectInfo.value || {})
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
    isWithinBounds
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
    isWithinBounds
  })

  return isWithinBounds
}

// ===== ОТДЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ОБРАБОТКИ DROP =====

// Функция 1: Обработка начала задачи
function handleStartDrop(position: 'inside' | 'boundary' | 'outside', newDate: string, taskId: string) {
  console.log('🎯 handleStartDrop:', { position, newDate, taskId })

  // Проверяем границы начала задачи
  const isStartWithinBounds = checkStartBounds(newDate)

  if (isStartWithinBounds) {
    // Внутри границ - обновляем начало и сохраняем длительность
    const existingTask = tasks.value.find(task => task.id.toString() === taskId)
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
function handleEndDrop(position: 'inside' | 'boundary' | 'outside', newDate: string, taskId: string) {
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
function handleFullTaskDrop(position: 'inside' | 'boundary' | 'outside', newStart: string, newEnd: string, taskId: string) {
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
    const existingTask = tasks.value.find(task => task.id.toString() === taskId)
    if (!existingTask) {
      console.error('❌ Task not found for drag:', taskId)
      return
    }

    console.log('📅 Task moved:', taskId, 'to', newStart, '-', newEnd)
    console.log('🔍 Task type:', existingTask.milestone ? 'MILESTONE' : 'TASK')

    // Определяем тип drop и позицию
    const newStartDate = eventInfo.event.start.toLocaleDateString('en-CA')
    const newEndDate = existingTask.milestone ? newStartDate : (eventInfo.event.end ? (() => {
      // Убираем день, который FullCalendar добавил для отображения
      const endDateObj = new Date(eventInfo.event.end)
      endDateObj.setDate(endDateObj.getDate() - 1)
      return endDateObj.toLocaleDateString('en-CA')
    })() : newStartDate)

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
      position
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
      endChanged
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
      endChanged
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
        project_id: props.projectId
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
              isMilestone: existingTask.milestone
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
              const manualEventInfo = info as { event: { setStart: (date: Date) => void; setEnd: (date: Date) => void } }
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
            console.log('🔍 Is milestone:', (taskData as TaskCreateUpdate & { milestone?: boolean }).milestone)
            const adjustedTaskData = {
              ...taskData,
              startPlanned: boundsCheck.clampedStart,
              endPlanned: boundsCheck.clampedEnd
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
                    console.log('🔍 New position:', adjustedTaskData.startPlanned, adjustedTaskData.endPlanned)

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
              const taskIndex = tasks.value.findIndex(t => t.id.toString() === taskId)
              if (taskIndex > -1) {
                tasks.value[taskIndex] = {
                  ...tasks.value[taskIndex],
                  start_planned: adjustedTaskData.startPlanned,
                  end_planned: adjustedTaskData.endPlanned
                }
                console.log('📝 Task updated locally:', tasks.value[taskIndex])

                // Force calendar to update with new data
                const events = tasks.value.map(task => taskToCalendarTask(task, shouldShowDependencyIndicators.value))
                updateCalendarEvents(events)
                console.log('🔄 Calendar events updated with new task data')
              }

              // Update calendar display
              const eventInfo = info as { event: { setStart: (date: Date) => void; setEnd: (date: Date) => void } }
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
          }
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
              const eventInfo = info as { event: { setStart: (date: Date) => void; setEnd: (date: Date) => void } }
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
              endPlanned: dependencyCheck.suggestedEndDate
            }

            try {
              const updatePayload: Record<string, unknown> = {
                startPlanned: adjustedTaskData.startPlanned,
                endPlanned: adjustedTaskData.endPlanned,
              }

              await tasksApi.update(props.projectId, taskId, updatePayload)
              console.log('✅ Task adjusted to respect dependencies and saved')

              // Update local task data
              const taskIndex = tasks.value.findIndex(t => t.id.toString() === taskId)
              if (taskIndex > -1) {
                tasks.value[taskIndex] = {
                  ...tasks.value[taskIndex],
                  start_planned: adjustedTaskData.startPlanned,
                  end_planned: adjustedTaskData.endPlanned
                }
              }

              // Update calendar display
              const eventInfo = info as { event: { setStart: (date: Date) => void; setEnd: (date: Date) => void } }
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
          }
        }
        return
      }
    } else {
      // Обновляем задачу
      console.log('📅 Updating task:', { startDate: result.startDate, endDate: result.endDate })

      // Create task data with updated dates but keeping all other fields
      const finalStartDate = result.startDate || newStartDate
      const finalEndDate = existingTask.milestone ? finalStartDate : (result.endDate || newEndDate)

      const taskData = {
        ...existingTask,
        startPlanned: finalStartDate,
        endPlanned: finalEndDate,
        start_planned: finalStartDate,
        end_planned: finalEndDate,
        project_id: props.projectId
      }

      // Update task via API
      const updatePayload: Record<string, unknown> = {
        startPlanned: taskData.startPlanned,
        endPlanned: taskData.endPlanned,
      }

      console.log('📤 Updating task dates via API after drag:', updatePayload)

      try {
        const updatedTask = await tasksApi.update(props.projectId, taskId, updatePayload)
        console.log('✅ Task dates updated via API after drag:', updatedTask)

        // Update local task data without reloading from API
        const taskIndex = tasks.value.findIndex(t => t.id.toString() === taskId)
        if (taskIndex !== -1) {
          tasks.value[taskIndex] = { ...tasks.value[taskIndex], ...taskData }
        }

        // Update calendar events
        const events = tasks.value.map(task => taskToCalendarTask(task, shouldShowDependencyIndicators.value))
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

      emit('taskUpdate', { id: taskId, start_planned: taskData.startPlanned, end_planned: taskData.endPlanned } as Task)
      console.log('✅ Task moved successfully')
      return
    }

  } catch (error: unknown) {
    console.error('❌ Error updating task:', error)
    // Revert the change
    if (info && typeof info === 'object' && 'revert' in info && typeof (info as Record<string, unknown>).revert === 'function') {
      ((info as Record<string, unknown>).revert as () => void)()
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
    'event.end date string': eventInfo.event.end?.toLocaleDateString('en-CA')
  })

  try {
    // Find the existing task first
    const existingTask = tasks.value.find(task => task.id.toString() === taskId)
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
    const rawEndDate = eventInfo.event.end ? eventInfo.event.end.toLocaleDateString('en-CA') : newStartDate
    // FullCalendar uses exclusive end dates, so we need to subtract 1 day
    const newEndDate = eventInfo.event.end ? (() => {
      const endDate = new Date(eventInfo.event.end)
      endDate.setDate(endDate.getDate() - 1)
      return endDate.toLocaleDateString('en-CA')
    })() : newStartDate

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
      endChanged
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
      const startDiff = Math.abs(new Date(newStartDate + 'T00:00:00').getTime() - new Date(originalStart + 'T00:00:00').getTime())
      const endDiff = Math.abs(new Date(newEndDate + 'T00:00:00').getTime() - new Date(originalEnd + 'T00:00:00').getTime())

      console.log('🔍 Resize direction detection:', {
        startDiff,
        endDiff,
        startChangedMore: startDiff > endDiff
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
        finalEnd: finalEndDate
      })
    } else if (resizeType === 'end') {
      // Изменение конца - используем дату как есть (без исключительной обработки)
      finalEndDate = newEndDate

      console.log('🔧 End resize - using date as is:', {
        originalEnd: originalEnd,
        newEnd: newEndDate,
        finalEnd: finalEndDate,
        rawEndDate: rawEndDate
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
      projectEnd: projectInfo.value?.date_end
    })
    // Для 'both' используем даты как есть

    console.log('📅 Final resize dates:', {
      finalStartDate,
      finalEndDate,
      resizeType
    })

    // Create task data with updated dates but keeping all other fields
    const taskData = {
      ...existingTask,
      startPlanned: finalStartDate,
      endPlanned: finalEndDate,
      project_id: props.projectId
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
              const eventInfo = info as { event: { setStart: (date: Date) => void; setEnd: (date: Date) => void } }
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
            console.log('📅 Project bounds:', projectInfo.value?.date_start, 'to', projectInfo.value?.date_end)
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
                adjustedEnd
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
                projectEnd: projectInfo.value?.date_end
              })
            } else {
              // Для 'both' - используем clamped даты как есть
              console.log('🔧 Both resize adjust - using clamped dates:', {
                adjustedStart,
                adjustedEnd
              })
            }

            console.log('🔍 Before adjust - taskData:', {
              startPlanned: taskData.startPlanned,
              endPlanned: taskData.endPlanned,
              start_planned: taskData.start_planned,
              end_planned: taskData.end_planned
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
              end_planned: taskData.end_planned
            })
            console.log('📅 Updated taskData:', taskData)

            // Force update the event in FullCalendar
            try {
              const eventInfo = info as { event: { setStart: (date: Date) => void; setEnd: (date: Date) => void; setProp: (prop: string, value: string) => void; title: string } }
              eventInfo.event.setStart(new Date(adjustedStart + 'T00:00:00'))

              // Используем универсальную функцию для обработки даты окончания
              const fullCalendarEndDate = new Date(processEndDateForDisplay(adjustedEnd) + 'T00:00:00')

              eventInfo.event.setEnd(fullCalendarEndDate)
              console.log('📅 Event dates updated in FullCalendar:', adjustedStart, adjustedEnd)
              console.log('📅 FullCalendar end date set to:', fullCalendarEndDate.toLocaleDateString('en-CA'))

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
          }
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
              const eventInfo = info as { event: { setStart: (date: Date) => void; setEnd: (date: Date) => void } }
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
              endPlanned: dependencyCheck.suggestedEndDate
            }

            try {
              const updatePayload: Record<string, unknown> = {
                startPlanned: adjustedTaskData.startPlanned,
                endPlanned: adjustedTaskData.endPlanned,
              }

              await tasksApi.update(props.projectId, taskId, updatePayload)
              console.log('✅ Task adjusted to respect dependencies and saved')

              // Update local task data
              const taskIndex = tasks.value.findIndex(t => t.id.toString() === taskId)
              if (taskIndex > -1) {
                tasks.value[taskIndex] = {
                  ...tasks.value[taskIndex],
                  start_planned: adjustedTaskData.startPlanned,
                  end_planned: adjustedTaskData.endPlanned
                }
              }

              // Update calendar display
              const eventInfo = info as { event: { setStart: (date: Date) => void; setEnd: (date: Date) => void } }
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
          }
        }
        isDragging.value = false
        return // Stop here - dialog will handle the update
      }
    }

    console.log('🔄 Reached API update section - taskData:', {
      startPlanned: taskData.startPlanned,
      endPlanned: taskData.endPlanned,
      start_planned: taskData.start_planned,
      end_planned: taskData.end_planned
    })

    const updatePayload: Record<string, unknown> = {
      startPlanned: taskData.startPlanned,
      endPlanned: taskData.endPlanned,
      // Duration will be calculated automatically by frontend
    }

    console.log('📤 Updating task size via API:', updatePayload)
    console.log('📤 TaskData before API call:', {
      startPlanned: taskData.startPlanned,
      endPlanned: taskData.endPlanned,
      start_planned: taskData.start_planned,
      end_planned: taskData.end_planned
    })

    try {
      const updatedTask = await tasksApi.update(props.projectId, taskId, updatePayload)
      console.log('✅ Task size updated via API:', updatedTask)

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
    if (info && typeof info === 'object' && 'revert' in info && typeof (info as Record<string, unknown>).revert === 'function') {
      ((info as Record<string, unknown>).revert as () => void)()
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

// Watch for dependency indicators toggle changes
watch(shouldShowDependencyIndicators, () => {
  console.log('🔄 Dependency indicators toggle changed, updating calendar events')
  // Update calendar events with new indicator settings
  const events = tasks.value.map(task => taskToCalendarTask(task, shouldShowDependencyIndicators.value))
  updateCalendarEvents(events)
})


// Task list functions
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function getStatusLabel(status: TaskStatus): string {
  switch (status) {
    case 'planned': return 'Planned'
    case 'in_progress': return 'In Progress'
    case 'done': return 'Done'
    case 'blocked': return 'Blocked'
    case 'delayed': return 'Delayed'
    default: return 'Unknown'
  }
}

function getStatusClass(status: TaskStatus): string {
  switch (status) {
    case 'planned': return 'text-blue-600'
    case 'in_progress': return 'text-green-600'
    case 'done': return 'text-gray-600'
    case 'blocked': return 'text-red-600'
    case 'delayed': return 'text-yellow-600'
    default: return 'text-gray-600'
  }
}

function editTask(task: Task) {
  console.log('✏️ Edit task:', task.name)
  if (task.milestone) {
    openMilestoneDialog('edit', task.id)
  } else {
    openTaskDialog('edit', task.id)
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
        selectedElements.forEach(element => {
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

function getTaskDuration(task: Task): number {
  if (task.start_planned && task.end_planned) {
    const startDate = new Date(task.start_planned)
    const endDate = new Date(task.end_planned)
    const diffTime = endDate.getTime() - startDate.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }
  return 1
}

function getTaskDependencies(task: Task): Array<{id: string, name: string, type: string, lag_days: number}> {
  if (!task.dependencies || task.dependencies.length === 0) return []

  return task.dependencies
    .map(dep => {
      if (typeof dep === 'number') {
        // Legacy format
        const depTask = tasks.value.find(t => String(t.id) === String(dep))
        return depTask ? {
          id: String(dep),
          name: depTask.name,
          type: 'FS',
          lag_days: 0
        } : null
      } else {
        // New format
        const depTask = tasks.value.find(t => String(t.id) === String(dep.predecessor_id))
        return depTask ? {
          id: String(dep.predecessor_id),
          name: depTask.name,
          type: dep.type,
          lag_days: dep.lag_days
        } : null
      }
    })
    .filter(dep => dep !== null) as Array<{id: string, name: string, type: string, lag_days: number}>
}

function getTaskTeamInfo(task: Task): Array<{id: number, name: string, role: string}> {
  const team: Array<{id: number, name: string, role: string}> = []

  // Add task lead
  if (task.task_lead_id) {
    const leadPerson = availablePeople.find(p => p.id === task.task_lead_id)
    if (leadPerson) {
      team.push({ ...leadPerson, role: `${leadPerson.role} (Lead)` })
    }
  }

  // Add team members
  if (task.team_members) {
    task.team_members.forEach(memberId => {
      const member = availablePeople.find(p => p.id === memberId)
      if (member) {
        team.push(member)
      }
    })
  }

  return team
}

// Mock people data for display
const availablePeople = [
  { id: 47, name: 'Mike Davis', role: 'Project Manager' },
  { id: 23, name: 'John Smith', role: 'Foreman' },
  { id: 15, name: 'Sarah Johnson', role: 'Electrician' },
  { id: 8, name: 'Safety Team', role: 'Inspector' },
  { id: 52, name: 'Unknown User', role: 'Worker' }, // Add missing user
]

// Task dialog functions
function openTaskDialog(mode: 'create' | 'edit' | 'view', taskId?: string | null, initialDate?: string) {
  console.log('🔧 Opening task dialog:', mode, taskId, 'initialDate:', initialDate)

  if (taskId) {
    console.log('🔍 Looking for task with ID:', taskId, 'type:', typeof taskId)
    console.log('🔍 Available task IDs:', tasks.value.map(t => ({ id: t.id, type: typeof t.id })))
    // Try both strict and loose comparison
    const task = tasks.value.find(t => t.id === taskId || t.id == taskId || String(t.id) === String(taskId))
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
function openMilestoneDialog(mode: 'create' | 'edit' | 'view', taskId?: string | null, initialDate?: string) {
  console.log('🔧 Opening milestone dialog:', mode, taskId, 'initialDate:', initialDate)

  if (taskId) {
    console.log('🔍 Looking for milestone with ID:', taskId, 'type:', typeof taskId)
    console.log('🔍 Available task IDs:', tasks.value.map(t => ({ id: t.id, type: typeof t.id })))
    // Try both strict and loose comparison
    const task = tasks.value.find(t => t.id === taskId || t.id == taskId || String(t.id) === String(taskId))
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
  taskDialog.value.isOpen = false
  taskDialog.value.task = null
  taskDialog.value.initialDate = undefined
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

function handleOpenProjectSettings() {
  console.log('⚙️ Opening project settings from task dialog')
  // Emit event to parent component to open project settings
  emit('openProjectSettings')
}

async function handleTaskSave(taskData: Partial<Task>) {
  console.log('💾 Saving task:', taskData)

  try {
    if (taskDialog.value.mode === 'create') {
      // Create new task via API
      console.log('➕ Creating new task via API')

      // Create minimal payload with only required fields first
      const createPayload: Record<string, unknown> = {
        wbsPath: taskData.wbs_path || '',
        name: taskData.name || '',
        startPlanned: taskData.start_planned || '',
        endPlanned: taskData.end_planned || taskData.start_planned || '',
        milestone: taskData.milestone || false,
        status: taskData.status || 'planned',
        progressPct: taskData.progress_pct || 0,
      }

      // Add optional fields only if they have values
      if (taskData.notes) {
        createPayload.notes = taskData.notes
      }

      // Add task lead if assigned
      if (taskData.task_lead_id) {
        createPayload.task_lead_id = taskData.task_lead_id
      }

      // Add team members if any
      if (taskData.team_members && taskData.team_members.length > 0) {
        createPayload.team_members = taskData.team_members
      }

      if (taskData.resources && taskData.resources.length > 0) {
        createPayload.resources = taskData.resources
      }

      if (taskData.dependencies && taskData.dependencies.length > 0) {
        createPayload.dependencies = taskData.dependencies
      }

      console.log('📤 Sending create payload:', createPayload)
      console.log('📤 Payload JSON:', JSON.stringify(createPayload, null, 2))

      try {
        const newTask = await tasksApi.create(props.projectId, createPayload as unknown as TaskCreateUpdate)
        console.log('✅ Task created via API:', newTask)

        // Reload tasks from API to get fresh data
        await loadTasks()

        // Reapply project bounds styling after task creation
        setTimeout(() => {
          applyProjectBoundsStyling()
        }, 100)
      } catch (apiError) {
        console.error('❌ API creation failed, adding locally:', apiError)

        // Fallback: add to local array if API fails
        const newTask: Task = {
          ...taskData,
          id: `temp-${Date.now()}`,
          project_id: props.projectId,
          assignees: taskData.assignees || [],
          resources: taskData.resources || [],
          dependencies: taskData.dependencies || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Task

        tasks.value.push(newTask)
        console.log('✅ Task created locally as fallback')

        // Update calendar
        const events = tasks.value.map(task => taskToCalendarTask(task, shouldShowDependencyIndicators.value))
        updateCalendarEvents(events)
      }
    } else {
      // Update existing task via API
      console.log('✏️ Updating task via API:', taskData.id)

      const updatePayload = {
        wbs_path: taskData.wbs_path,
        name: taskData.name,
        start_planned: taskData.start_planned,
        end_planned: taskData.end_planned,
        duration_days: taskData.duration_days,
        milestone: taskData.milestone,
        status: taskData.status,
        progress_pct: taskData.progress_pct,
        notes: taskData.notes,
        task_lead_id: taskData.task_lead_id,
        team_members: taskData.team_members || [],
        resources: taskData.resources || [],
        dependencies: taskData.dependencies || [],
      }

      console.log('📤 Sending update payload:', updatePayload)

      try {
        const updatedTask = await tasksApi.update(props.projectId, taskData.id!, updatePayload as unknown as Partial<TaskCreateUpdate>)
        console.log('✅ Task updated via API:', updatedTask)

        // Reload tasks from API to get fresh data
        await loadTasks()

        // Reapply project bounds styling after task update
        setTimeout(() => {
          applyProjectBoundsStyling()
        }, 100)
      } catch (apiError) {
        console.error('❌ API update failed, updating locally:', apiError)

        // Fallback: update local array if API fails
        const taskIndex = tasks.value.findIndex(t => t.id === taskData.id)
        if (taskIndex !== -1) {
          tasks.value[taskIndex] = { ...tasks.value[taskIndex], ...taskData }
          console.log('✅ Task updated locally as fallback')

          // Update calendar
          const events = tasks.value.map(task => taskToCalendarTask(task, shouldShowDependencyIndicators.value))
          updateCalendarEvents(events)
        }
      }
    }

    closeTaskDialog()
  } catch (error) {
    console.error('❌ Error saving task:', error)
    alert('Error saving task. Please try again.')
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


// Calendar mounted handler
function onCalendarMounted() {
  console.log('🎯 FullCalendar mounted, calendar ref available')
  console.log('📅 Calendar should display events:', calendarEvents.value.length)
  console.log('🔧 Can edit events:', props.canEdit)

  // Force calendar to refresh events
  if (calendarRef.value) {
    const calendarApi = calendarRef.value.getApi()
    console.log('📅 Calendar API available:', !!calendarApi)

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

  // Load project info and tasks from API
  loadProjectInfo()
  loadTasks()
})


// Expose functions for parent component
defineExpose({
  openTaskDialog,
  openMilestoneDialog,
  loadTasks,
})
</script>

<template>
  <!-- Legend Section -->
  <div class="px-4 py-2 bg-transparent text-xs text-gray-600">
    <div class="flex items-center justify-end space-x-6">
      <!-- Status Legend -->
      <div class="flex items-center space-x-3 text-xs border border-gray-300 rounded-md px-3 py-1">
        <div class="flex items-center space-x-1">
          <div class="w-3 h-3 rounded-full" style="background-color: #3B82F6"></div>
          <span class="text-gray-600">Planned</span>
        </div>
        <div class="flex items-center space-x-1">
          <div class="w-3 h-3 rounded-full" style="background-color: #10B981"></div>
          <span class="text-gray-600">In Progress</span>
        </div>
        <div class="flex items-center space-x-1">
          <div class="w-3 h-3 rounded-full" style="background-color: #6B7280"></div>
          <span class="text-gray-600">Done</span>
        </div>
        <div class="flex items-center space-x-1">
          <div class="w-3 h-3 rounded-full" style="background-color: #EF4444"></div>
          <span class="text-gray-600">Blocked</span>
        </div>
        <div class="flex items-center space-x-1">
          <div class="w-3 h-3 rounded-full" style="background-color: #F59E0B"></div>
          <span class="text-gray-600">Delayed</span>
        </div>
      </div>

      <div class="flex items-center space-x-6">
        <!-- Dependencies Group -->
        <div v-if="shouldShowDependencyIndicators" class="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-md border border-blue-200">
          <span class="text-xs font-medium text-blue-700">Dependencies:</span>
          <div class="flex items-center gap-2 text-xs">
            <div class="flex items-center space-x-1">
              <span class="text-sm">🔗</span>
              <span class="text-gray-600">FS</span>
            </div>
            <div class="flex items-center space-x-1">
              <span class="text-sm">⚡</span>
              <span class="text-gray-600">SS</span>
            </div>
            <div class="flex items-center space-x-1">
              <span class="text-sm">🎯</span>
              <span class="text-gray-600">FF</span>
            </div>
            <div class="flex items-center space-x-1">
              <span class="text-sm">🔄</span>
              <span class="text-gray-600">SF</span>
            </div>
            <div class="flex items-center space-x-1">
              <span class="text-sm">⏱️</span>
              <span class="text-gray-600">Lag</span>
            </div>
            <div class="flex items-center space-x-1">
              <span class="text-sm">📋</span>
              <span class="text-gray-600">Deps</span>
            </div>
          </div>
        </div>

        <!-- Milestones Group -->
        <div v-if="shouldShowDependencyIndicators" class="flex items-center space-x-2 bg-purple-50 px-3 py-1 rounded-md border border-purple-200">
          <span class="text-xs font-medium text-purple-700">Milestones:</span>
          <div class="flex items-center gap-2 text-xs">
            <div class="flex items-center space-x-1">
              <span class="text-sm">🔍</span>
              <span class="text-gray-600">Inspection</span>
            </div>
            <div class="flex items-center space-x-1">
              <span class="text-sm">🏗️</span>
              <span class="text-gray-600">Visit</span>
            </div>
            <div class="flex items-center space-x-1">
              <span class="text-sm">👥</span>
              <span class="text-gray-600">Meeting</span>
            </div>
            <div class="flex items-center space-x-1">
              <span class="text-sm">📋</span>
              <span class="text-gray-600">Review</span>
            </div>
            <div class="flex items-center space-x-1">
              <span class="text-sm">📦</span>
              <span class="text-gray-600">Delivery</span>
            </div>
            <div class="flex items-center space-x-1">
              <span class="text-sm">✅</span>
              <span class="text-gray-600">Approval</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="bg-white rounded-lg">
    <!-- Tasks Info -->
    <div v-if="error" class="bg-red-50 border-b border-red-200 px-4 py-2">
      <div class="flex items-center">
        <svg class="h-4 w-4 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span class="text-sm text-red-700">{{ error }}</span>
      </div>
    </div>
    <div v-else-if="tasks.length === 0" class="bg-gray-50 border-b border-gray-200 px-4 py-2">
      <div class="flex items-center">
        <svg class="h-4 w-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012-2"></path>
        </svg>
        <span class="text-sm text-gray-700">No tasks found for this project.</span>
      </div>
    </div>

    <!-- Task Count -->
    <div class="p-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <!-- Add Task/Milestone Buttons -->
          <div v-if="canEdit" class="flex items-center space-x-2">
            <button
              @click="openTaskDialog('create', undefined, undefined)"
              class="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
              title="Add new task"
            >
              ➕ Add Task
            </button>
            <button
              @click="openMilestoneDialog('create', undefined, undefined)"
              class="px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-md hover:bg-purple-700 transition-colors"
              title="Add new milestone"
            >
              🎯 Add Milestone
            </button>
            <button
              v-if="selectedTask"
              @click="deleteTask(selectedTask)"
              class="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition-colors"
              title="Delete selected task"
            >
              🗑️ Delete
            </button>
          </div>

          <span v-if="loading" class="text-sm text-gray-500">Loading tasks...</span>
          <span v-else-if="error" class="text-sm text-red-500">{{ error }}</span>
          <span v-else class="text-sm text-gray-500">
            {{ tasks.length }} tasks
            <span v-if="selectedTask" class="ml-2 text-blue-600">| Selected: {{ selectedTask.name }}</span>
          </span>
        </div>

        <div class="flex items-center space-x-4">
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
              📋 List
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
          </div>
        </div>
      </div>
    </div>

    <!-- Calendar View -->
    <div v-if="viewMode === 'ical'" class="p-4 bg-white">
      <FullCalendar
        ref="calendarRef"
        :options="calendarOptions"
        class="min-h-[600px]"
        @mounted="onCalendarMounted"
      />
    </div>

    <!-- Task List View -->
    <div v-else-if="viewMode === 'list'" class="p-4">
      <div v-if="tasks.length === 0" class="text-center text-gray-500 py-8">
        <div class="text-4xl mb-4">📋</div>
        <h3 class="text-lg font-medium mb-2">No Tasks</h3>
        <p class="text-sm">No tasks found for this project</p>
      </div>
      <div v-else class="flex gap-6">
        <!-- Left: Task List (50%) -->
        <div class="w-1/2 space-y-3">
          <h3 class="text-lg font-medium text-gray-900 mb-3">Tasks</h3>
          <div
            v-for="task in tasks"
            :key="task.id"
            @click="selectTaskForDetails(task)"
            :class="[
              'bg-white border border-gray-200 rounded-lg p-3 cursor-pointer transition-all relative',
              selectedTask?.id === task.id
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'hover:shadow-md hover:border-gray-300'
            ]"
          >
            <!-- Actions (Top Right) -->
            <div class="absolute top-2 right-2 flex items-center space-x-1">
              <button
                v-if="props.canEdit"
                @click.stop="editTask(task)"
                class="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                title="Edit task"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
              </button>
              <button
                v-if="props.canEdit"
                @click.stop="deleteTask(task)"
                class="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete task"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>

            <!-- Task Header -->
            <div class="flex items-center space-x-3 mb-3 pr-16">
              <div
                class="w-3 h-3 rounded-full"
                :style="{ backgroundColor: getTaskColor(task.status) }"
              ></div>
              <!-- Task/Milestone Icon -->
              <span v-if="task.milestone" class="text-lg">🎯</span>
              <span v-else class="text-lg">📋</span>
              <h4 class="font-medium text-gray-900 flex-1">{{ task.name }}</h4>
            </div>

            <!-- Essential Info Only -->
            <div class="space-y-2 text-sm text-gray-600">
              <div class="flex items-center justify-between">
                <span><span class="font-medium">WBS:</span> {{ task.wbs_path || 'N/A' }}</span>
                <span :class="getStatusClass(task.status)">{{ getStatusLabel(task.status) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span><span class="font-medium">Start:</span> {{ formatDate(task.start_planned) }}</span>
                <span v-if="task.end_planned"><span class="font-medium">End:</span> {{ formatDate(task.end_planned) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Task Details (50%) -->
        <div class="w-1/2">
          <div v-if="!selectedTask" class="text-center text-gray-500 py-8">
            <div class="text-4xl mb-4">👈</div>
            <h3 class="text-lg font-medium mb-2">Select a Task</h3>
            <p class="text-sm">Click on a task from the left to view details</p>
          </div>
          <div v-else class="bg-white border border-gray-200 rounded-lg p-6">
            <!-- Task Header -->
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center space-x-3">
                <div
                  class="w-4 h-4 rounded-full"
                  :style="{ backgroundColor: getTaskColor(selectedTask.status) }"
                ></div>
                <!-- Task/Milestone Icon -->
                <span v-if="selectedTask.milestone" class="text-xl">🎯</span>
                <span v-else class="text-xl">📋</span>
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
                <div :class="getStatusClass(selectedTask.status)">{{ getStatusLabel(selectedTask.status) }}</div>
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
                    backgroundColor: getTaskColor(selectedTask.status)
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
                  <span class="text-gray-500">{{ dep.type }} {{ dep.lag_days > 0 ? `+${dep.lag_days}d` : '' }}</span>
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
    </div>

    <!-- Gantt Chart View -->
    <div v-else-if="viewMode === 'gantt'" class="p-6">
      <div class="text-center text-gray-500">
        <div class="text-4xl mb-4">📊</div>
        <h3 class="text-lg font-medium mb-2">Gantt Chart View</h3>
        <p class="text-sm">Gantt chart visualization will be implemented here</p>
        <div class="mt-4 text-xs text-gray-400">
          Tasks: {{ tasks.length }} tasks available
        </div>
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
      @project-updated="handleProjectUpdated"
      @open-project-settings="handleOpenProjectSettings"
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

  </div>
</template>

<style scoped>
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
  transform: scale(1.1) !important;
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
  border: 3px solid #dc2626 !important;
  box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.3) !important;
  transform: scale(1.02) !important;
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
</style>

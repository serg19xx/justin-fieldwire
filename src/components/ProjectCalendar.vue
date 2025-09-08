<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, toRaw } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import type { Task } from '@/types/task'
import { taskToCalendarTask } from '@/utils/task-utils'
import { tasksApi } from '@/utils/tasks-api'

// Props
interface Props {
  projectId: number
  canEdit?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canEdit: false,
})

// Emits
const emit = defineEmits<{
  eventClick: [event: any]
  dateClick: [info: any]
  eventDrop: [info: any]
  eventResize: [info: any]
  taskUpdate: [task: Task]
}>()

// State
const tasks = ref<Task[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const viewMode = ref<'ical' | 'gantt'>('ical')
const isDragging = ref(false)
const isResizing = ref(false)

// Get current date for testing
const today = new Date()
const currentMonth = today.getMonth() + 1
const currentYear = today.getFullYear()

// Calendar events - static for now with current month dates
const calendarEvents = ref<any[]>([])

// Initialize events
const initializeEvents = () => {
  calendarEvents.value = [
    {
      id: 'static-test',
      title: 'Static Test Event',
      start: '2025-09-15T08:00:00',
      end: '2025-09-17T17:00:00',
      allDay: false,
      color: '#FF0000',
    },
    {
      id: 'static-test-2',
      title: 'Another Static Event',
      start: '2025-09-20T09:00:00',
      end: '2025-09-22T17:00:00',
      allDay: false,
      color: '#00FF00',
    },
    {
      id: 'mock-1',
      title: 'Foundation Work',
      start: '2025-09-10T08:00:00',
      end: '2025-09-15T17:00:00',
      color: '#10B981',
      extendedProps: {
        wbsPath: ['Фундамент', 'Опалубка'],
        status: 'in_progress',
        assignees: ['john-smith'],
        milestone: false,
        progressPct: 60,
        description: 'Фундамент > Опалубка - Foundation Work',
      },
    },
    {
      id: 'mock-2',
      title: 'Framing',
      start: '2025-09-20T08:00:00',
      end: '2025-09-25T17:00:00',
      color: '#3B82F6',
      extendedProps: {
        wbsPath: ['Каркас', 'Стены'],
        status: 'planned',
        assignees: ['mike-wilson'],
        milestone: false,
        description: 'Каркас > Стены - Framing',
      },
    },
    {
      id: 'mock-3',
      title: 'Electrical Installation',
      start: '2025-09-05T08:00:00',
      end: '2025-09-08T17:00:00',
      color: '#3B82F6',
      extendedProps: {
        wbsPath: ['Электрика', 'Проводка'],
        status: 'planned',
        assignees: ['sarah-johnson'],
        milestone: false,
        description: 'Электрика > Проводка - Electrical Installation',
      },
    },
    {
      id: 'mock-4',
      title: 'Safety Inspection',
      start: '2025-09-12T10:00:00',
      end: '2025-09-12T12:00:00',
      color: '#3B82F6',
      extendedProps: {
        wbsPath: ['Контроль', 'Безопасность'],
        status: 'planned',
        assignees: ['safety-team'],
        milestone: true,
        description: 'Контроль > Безопасность - Safety Inspection',
      },
    },
  ]
}

// Initialize events on mount
initializeEvents()

// Calendar options - with editing capabilities
const calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
  },
  height: 'auto',
  weekends: true,
  editable: props.canEdit,
  droppable: false,
  selectable: false,
  dayMaxEvents: true,
  eventResizableFromStart: props.canEdit,
  eventResizableFromEnd: props.canEdit,
  events: [
    {
      id: 'static-test',
      title: 'Static Test Event',
      start: '2025-09-15',
      end: '2025-09-16',
      allDay: true,
      color: '#FF0000',
    },
    {
      id: 'static-test-2',
      title: 'Another Static Event',
      start: '2025-09-20',
      end: '2025-09-21',
      allDay: true,
      color: '#00FF00',
    },
    {
      id: 'mock-1',
      title: 'Foundation Work',
      start: '2025-09-10',
      end: '2025-09-12',
      allDay: true,
      color: '#10B981',
      extendedProps: {
        wbsPath: ['Фундамент', 'Опалубка'],
        status: 'in_progress',
        assignees: ['john-smith'],
        milestone: false,
        progressPct: 60,
        description: 'Фундамент > Опалубка - Foundation Work',
      },
    },
    {
      id: 'mock-2',
      title: 'Framing',
      start: '2025-09-22',
      end: '2025-09-24',
      allDay: true,
      color: '#3B82F6',
      extendedProps: {
        wbsPath: ['Каркас', 'Стены'],
        status: 'planned',
        assignees: ['mike-wilson'],
        milestone: false,
        description: 'Каркас > Стены - Framing',
      },
    },
    {
      id: 'mock-3',
      title: 'Electrical Installation',
      start: '2025-09-05',
      end: '2025-09-07',
      allDay: true,
      color: '#3B82F6',
      extendedProps: {
        wbsPath: ['Электрика', 'Проводка'],
        status: 'planned',
        assignees: ['sarah-johnson'],
        milestone: false,
        description: 'Электрика > Проводка - Electrical Installation',
      },
    },
    {
      id: 'mock-4',
      title: 'Safety Inspection',
      start: '2025-09-12',
      allDay: true,
      color: '#3B82F6',
      extendedProps: {
        wbsPath: ['Контроль', 'Безопасность'],
        status: 'planned',
        assignees: ['safety-team'],
        milestone: true,
        description: 'Контроль > Безопасность - Safety Inspection',
      },
    },
  ],
  eventDragStart: (info: any) => {
    console.log('📅 Event drag started:', info.event.title)
    isDragging.value = true
  },
  eventDrop: (info: any) => {
    console.log('📅 Event dropped:', info.event.title, 'to', info.event.start)
    isDragging.value = false
  },
  eventResizeStart: (info: any) => {
    console.log('📅 Event resize started:', info.event.title)
    isResizing.value = true
  },
  eventResize: (info: any) => {
    console.log('📅 Event resized:', info.event.title, 'to', info.event.end)
    isResizing.value = false
  },
  eventClick: (info: any) => {
    // Only handle single clicks, not drag or resize operations
    if (!isDragging.value && !isResizing.value) {
      console.log('📅 Event clicked:', info.event.title)
      emit('eventClick', info.event)
    }
  },
  eventDoubleClick: (info: any) => {
    console.log('📅 Event double-clicked:', info.event.title)
    // Handle double-click on event (e.g., edit event)
    alert(`Double-clicked on: ${info.event.title}`)
  },
  dateClick: (info: any) => {
    // Only handle clicks when not dragging or resizing
    if (!isDragging.value && !isResizing.value) {
      console.log('📅 Date clicked:', info.dateStr)
      if (props.canEdit) {
        emit('dateClick', info)
        // Handle single click on date (e.g., create new event)
        alert(`Clicked on date: ${info.dateStr}`)
      }
    }
  },
})

// Calendar ref
const calendarRef = ref()

// Function to update calendar events
function updateCalendarEvents(events: any[]) {
  calendarEvents.value = events
  console.log('📅 Updating calendar with events:', events.length)

  nextTick(() => {
    if (calendarRef.value) {
      const calendarApi = calendarRef.value.getApi()
      calendarApi.removeAllEvents()
      calendarApi.addEventSource(events)
      console.log('✅ Calendar events updated successfully')
    } else {
      console.log('⚠️ Calendar ref not available yet, retrying...')
      // Retry after a short delay
      setTimeout(() => {
        if (calendarRef.value) {
          const calendarApi = calendarRef.value.getApi()
          calendarApi.removeAllEvents()
          calendarApi.addEventSource(events)
          console.log('✅ Calendar events updated on retry')
        }
      }, 100)
    }
  })
}

// Load tasks from API
async function loadTasks() {
  if (!props.projectId) {
    console.log('⚠️ No projectId provided, skipping task load')
    return
  }

  console.log('🚀 Loading tasks for project:', props.projectId)
  loading.value = true
  error.value = null

  try {
    console.log('📡 Calling tasksApi.getAll...')
    const response = await tasksApi.getAll(props.projectId, 1, 100)
    console.log('✅ API response received:', response)

    tasks.value = response.tasks
    console.log('📋 Tasks loaded:', tasks.value.length)

    // Convert tasks to calendar events
    const events = tasks.value.map(taskToCalendarTask)
    updateCalendarEvents(events)
  } catch (err) {
    console.error('❌ Error loading tasks from API:', err)
    console.log('🔄 Falling back to mock data...')

    // Fallback to mock data
    loadMockTasks()
    error.value = null // Clear error since we have mock data

    // Show a friendly message that we're in demo mode
    console.log('🎭 Demo mode activated - using mock task data')
  } finally {
    loading.value = false
  }
}

// Fallback mock tasks
function loadMockTasks() {
  console.log('🎭 Loading mock tasks...')

  const mockTasks: Task[] = [
    {
      id: 'mock-1',
      wbsPath: ['Фундамент', 'Опалубка'],
      name: 'Foundation Work',
      startPlanned: '2025-01-15T00:00:00',
      endPlanned: '2025-01-20T00:00:00',
      durationDays: 5,
      status: 'in_progress',
      assignees: ['john-smith'],
      milestone: false,
      actual: { progressPct: 60 },
    },
    {
      id: 'mock-2',
      wbsPath: ['Каркас', 'Стены'],
      name: 'Framing',
      startPlanned: '2025-01-22T00:00:00',
      endPlanned: '2025-02-05T00:00:00',
      durationDays: 14,
      status: 'planned',
      assignees: ['mike-wilson'],
      milestone: false,
    },
    {
      id: 'mock-3',
      wbsPath: ['Электрика', 'Проводка'],
      name: 'Electrical Installation',
      startPlanned: '2025-02-10T00:00:00',
      endPlanned: '2025-02-15T00:00:00',
      durationDays: 5,
      status: 'planned',
      assignees: ['sarah-johnson'],
      milestone: false,
    },
    {
      id: 'mock-4',
      wbsPath: ['Контроль', 'Безопасность'],
      name: 'Safety Inspection',
      startPlanned: '2025-02-12T10:00:00',
      endPlanned: '2025-02-12T12:00:00',
      status: 'planned',
      assignees: ['safety-team'],
      milestone: true,
    },
  ]

  tasks.value = mockTasks
  console.log('📋 Mock tasks loaded:', tasks.value.length)

  const events = tasks.value.map(taskToCalendarTask)
  console.log('📅 Mock calendar events created:', events.length)
  console.log('📅 Calendar events data:', events)

  updateCalendarEvents(events)
}

// Handle event drop (task moved)
async function handleEventDrop(info: any) {
  const taskId = info.event.id
  const newStart = info.event.start.toISOString()
  const newEnd = info.event.end?.toISOString()

  console.log('📅 Task moved:', taskId, 'to', newStart, '-', newEnd)

  try {
    // Update local calendar events to match the new position
    const eventIndex = calendarEvents.value.findIndex((e) => e.id === taskId)
    if (eventIndex !== -1) {
      calendarEvents.value[eventIndex].start = newStart
      if (newEnd) {
        calendarEvents.value[eventIndex].end = newEnd
      }
      console.log('📅 Updated local event:', calendarEvents.value[eventIndex])
    }

    // In the future, this will call the API
    // const updatedTask = await tasksApi.update(props.projectId, taskId, {
    //   startPlanned: newStart,
    //   endPlanned: newEnd,
    // })

    emit('taskUpdate', { id: taskId, startPlanned: newStart, endPlanned: newEnd })
    console.log('✅ Task moved successfully')
  } catch (error) {
    console.error('❌ Error updating task:', error)
    // Revert the change
    info.revert()
  } finally {
    // Reset dragging flag
    isDragging.value = false
  }
}

// Handle event resize (task duration changed)
async function handleEventResize(info: any) {
  const taskId = info.event.id
  const newStart = info.event.start.toISOString()
  const newEnd = info.event.end?.toISOString()

  console.log('📅 Task resized:', taskId, 'from', newStart, 'to', newEnd)

  try {
    // Update local calendar events to match the new size
    const eventIndex = calendarEvents.value.findIndex((e) => e.id === taskId)
    if (eventIndex !== -1) {
      calendarEvents.value[eventIndex].start = newStart
      if (newEnd) {
        calendarEvents.value[eventIndex].end = newEnd
      }
      console.log('📅 Updated local event size:', calendarEvents.value[eventIndex])
    }

    // In the future, this will call the API
    // const updatedTask = await tasksApi.update(props.projectId, taskId, {
    //   startPlanned: newStart,
    //   endPlanned: newEnd,
    // })

    emit('taskUpdate', { id: taskId, startPlanned: newStart, endPlanned: newEnd })
    console.log('✅ Task resized successfully')
  } catch (error) {
    console.error('❌ Error updating task:', error)
    // Revert the change
    info.revert()
  } finally {
    // Reset resizing flag
    isResizing.value = false
  }
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

// View mode functions
function switchToCalendar() {
  viewMode.value = 'ical'
}

function switchToGantt() {
  viewMode.value = 'gantt'
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
  console.log('📅 Static events loaded:', calendarEvents.value.length)
  console.log('📅 Events data:', calendarEvents.value)
})
</script>

<template>
  <div class="bg-white rounded-lg shadow">
    <!-- Demo Mode Banner -->
    <div class="bg-blue-50 border-b border-blue-200 px-4 py-2">
      <div class="flex items-center">
        <svg
          class="h-4 w-4 text-blue-400 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <span class="text-sm text-blue-700">
          Demo Mode: Showing sample tasks. Backend API not yet implemented.
        </span>
      </div>
    </div>

    <!-- Calendar Header with Export Buttons -->
    <div class="p-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <span v-if="loading" class="text-sm text-gray-500">Loading tasks...</span>
          <span v-else-if="error" class="text-sm text-red-500">{{ error }}</span>
          <span v-else class="text-sm text-gray-500">
            {{ calendarEvents.length }} events
            <span class="text-blue-500 ml-1"> (Demo Mode) </span>
          </span>
        </div>

        <div class="flex items-center space-x-2">
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
    <div v-if="viewMode === 'ical'" class="p-4">
      <FullCalendar
        ref="calendarRef"
        :options="calendarOptions"
        class="min-h-[600px]"
        @mounted="onCalendarMounted"
      />
    </div>

    <!-- Gantt Chart View -->
    <div v-else-if="viewMode === 'gantt'" class="p-6">
      <div class="text-center text-gray-500">
        <div class="text-4xl mb-4">📊</div>
        <h3 class="text-lg font-medium mb-2">Gantt Chart View</h3>
        <p class="text-sm">Gantt chart visualization will be implemented here</p>
        <div class="mt-4 text-xs text-gray-400">
          Tasks: {{ calendarEvents.length }} events available
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Make resize handles more visible */
:deep(.fc-event-resizer) {
  background-color: #ff0000 !important;
  border: 2px solid #fff !important;
  border-radius: 50% !important;
  width: 12px !important;
  height: 12px !important;
  opacity: 1 !important;
  z-index: 1000 !important;
}

:deep(.fc-event-resizer:hover) {
  background-color: #cc0000 !important;
  transform: scale(1.2) !important;
}

/* Make events more resizable */
:deep(.fc-event) {
  cursor: move !important;
  position: relative !important;
}

:deep(.fc-event:hover) {
  opacity: 0.9 !important;
}

/* Force resize handles to be visible */
:deep(.fc-event-resizer-start) {
  left: -6px !important;
  top: -6px !important;
}

:deep(.fc-event-resizer-end) {
  right: -6px !important;
  bottom: -6px !important;
}

/* Make sure events are resizable */
:deep(.fc-event.fc-event-resizable) {
  border: 2px solid transparent !important;
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

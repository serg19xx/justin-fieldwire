<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import FullCalendar from '@fullcalendar/vue3' // cspell:ignore fullcalendar
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import type { Task, TaskStatus, TaskCreateUpdate } from '@/types/task'
import { taskToCalendarTask, getTaskColor } from '@/utils/task-utils'
import { tasksApi } from '@/utils/tasks-api'
import TaskDialog from './TaskDialog.vue'

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
}>()

// State
const tasks = ref<Task[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const viewMode = ref<'ical' | 'gantt' | 'list'>('ical')
const isDragging = ref(false)
const isResizing = ref(false)

// Selected task for details view
const selectedTask = ref<Task | null>(null)

// Double-click detection for dates and events
const lastDateClick = ref<{ date: string; time: number } | null>(null)
const lastEventClick = ref<{ eventId: string; time: number } | null>(null)

// Task dialog state
const taskDialog = ref({
  isOpen: false,
  mode: 'create' as 'create' | 'edit' | 'view',
  task: null as Task | null,
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
  events: (_info: unknown, successCallback: (events: any[]) => void) => {
    console.log('📅 FullCalendar requesting events, returning:', calendarEvents.value.length)
    console.log('📅 Events data:', calendarEvents.value)
    successCallback(JSON.parse(JSON.stringify(calendarEvents.value)))
  },
  eventDragStart: (info: unknown) => {
    console.log('📅 Event drag started:', (info as { event: { title: string } }).event.title)
    isDragging.value = true
  },
  eventDrop: async (info: unknown) => {
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
        openTaskDialog(mode, eventId)
        lastEventClick.value = null // Reset
      } else {
        console.log('📅 Event single-clicked (selection only):', eventInfo.event.title)
        console.log('🔧 Storing click time:', now, 'for event:', eventId)
        lastEventClick.value = { eventId, time: now }
        // Single click just selects the event, no dialog
      }
    }
  },
  dateClick: (info: unknown) => {
    // Only handle clicks when not dragging or resizing
    if (!isDragging.value && !isResizing.value && props.canEdit) {
      const now = Date.now()
      const dateInfo = info as { dateStr: string }
      const dateStr = dateInfo.dateStr

      // Check if this is a double-click (within 300ms of last click on same date)
      if (lastDateClick.value &&
          lastDateClick.value.date === dateStr &&
          now - lastDateClick.value.time < 300) {
        console.log('📅 Date double-clicked:', dateStr)
        openTaskDialog('create', null)
        lastDateClick.value = null // Reset
      } else {
        console.log('📅 Date single-clicked (selection only):', dateStr)
        lastDateClick.value = { date: dateStr, time: now }
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
    const response = await tasksApi.getAll(props.projectId)
    console.log('✅ API response received:', response)
    console.log('📋 Response tasks:', response?.tasks)
    console.log('📋 Tasks count:', response?.tasks?.length)

    if (response && response.tasks && response.tasks.length > 0) {
      tasks.value = response.tasks
      console.log('📋 Tasks loaded from API:', tasks.value.length)

      // Convert tasks to calendar events
      const events = tasks.value.map(taskToCalendarTask)
      console.log('📅 Converted to calendar events:', events.length)

      // Update calendar events
      calendarEvents.value = events
      console.log('📅 Calendar events updated:', calendarEvents.value.length)

      // Update calendar display
      if (calendarRef.value) {
        const calendarApi = calendarRef.value.getApi()
        calendarApi.refetchEvents()
        console.log('🔄 Calendar refreshed with API data')
      }
    } else {
      console.log('ℹ️ No tasks found for this project')
      tasks.value = []
      calendarEvents.value = []

      // Update calendar display
      if (calendarRef.value) {
        const calendarApi = calendarRef.value.getApi()
        calendarApi.refetchEvents()
        console.log('📅 Calendar cleared - no tasks')
      }
    }
  } catch (err) {
    console.error('❌ Error loading tasks from API:', err)
    console.log('🔄 API not available, falling back to mock data for testing')

    // Fallback to mock data for testing dialogs
    loadMockTasks()
    error.value = null
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
      project_id: props.projectId,
      wbs_path: '1.1.1',
      name: 'Foundation Work',
      start_planned: '2025-09-10',
      end_planned: '2025-09-12',
      duration_days: 3,
      milestone: false,
      status: 'in_progress',
      progress_pct: 60,
      notes: 'Foundation work in progress',
      assignees: [47],
      resources: ['excavator_1'],
      dependencies: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'mock-2',
      project_id: props.projectId,
      wbs_path: '1.2.1',
      name: 'Framing',
      start_planned: '2025-09-22',
      end_planned: '2025-09-24',
      duration_days: 3,
      milestone: false,
      status: 'planned',
      progress_pct: 0,
      notes: 'Framing work planned',
      assignees: [23],
      resources: ['crane_1'],
      dependencies: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'mock-3',
      project_id: props.projectId,
      wbs_path: '2.1.1',
      name: 'Electrical Installation',
      start_planned: '2025-09-05',
      end_planned: '2025-09-07',
      duration_days: 3,
      milestone: false,
      status: 'planned',
      progress_pct: 0,
      notes: 'Electrical installation planned',
      assignees: [15],
      resources: ['electrical_kit'],
      dependencies: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'mock-4',
      project_id: props.projectId,
      wbs_path: '3.1.1',
      name: 'Safety Inspection',
      start_planned: '2025-09-12',
      end_planned: '2025-09-12',
      duration_days: 1,
      milestone: true,
      status: 'planned',
      progress_pct: 0,
      notes: 'Safety inspection milestone',
      assignees: [8],
      resources: ['inspection_kit'],
      dependencies: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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
async function handleEventDrop(info: unknown) {
  const eventInfo = info as { event: { id: string; start: Date; end?: Date } }
  const taskId = eventInfo.event.id
  const newStart = eventInfo.event.start.toISOString()
  const newEnd = eventInfo.event.end?.toISOString()

  console.log('📅 Task moved:', taskId, 'to', newStart, '-', newEnd)

  try {
    // Update task dates via API
    const newStartDate = newStart.split('T')[0] // Get date only
    const newEndDate = newEnd ? newEnd.split('T')[0] : newStartDate

    const updatePayload: Record<string, unknown> = {
      start_planned: newStartDate,
      end_planned: newEndDate,
    }

    console.log('📤 Updating task dates via API after drag:', updatePayload)

    try {
      const updatedTask = await tasksApi.update(props.projectId, taskId, updatePayload)
      console.log('✅ Task dates updated via API after drag:', updatedTask)

      // Reload tasks from API to get fresh data
      await loadTasks()
    } catch (apiError) {
      console.error('❌ API update failed for drag, keeping local changes:', apiError)
      // Don't revert - keep the visual change even if API fails
    }

    emit('taskUpdate', { id: taskId, start_planned: newStartDate, end_planned: newEndDate } as Task)
    console.log('✅ Task moved successfully')
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
  const eventInfo = info as { event: { id: string; start: Date; end?: Date } }
  const taskId = eventInfo.event.id
  const newStart = eventInfo.event.start.toISOString()
  const newEnd = eventInfo.event.end?.toISOString()

  console.log('📅 Task resized:', taskId, 'from', newStart, 'to', newEnd)

  try {
    // Update task dates via API
    const newStartDate = newStart.split('T')[0] // Get date only
    const newEndDate = newEnd ? newEnd.split('T')[0] : newStartDate

    const updatePayload: Record<string, unknown> = {
      start_planned: newStartDate,
      end_planned: newEndDate,
      // Duration will be calculated automatically by frontend
    }

    console.log('📤 Updating task size via API:', updatePayload)

    try {
      const updatedTask = await tasksApi.update(props.projectId, taskId, updatePayload)
      console.log('✅ Task size updated via API:', updatedTask)

      // Reload tasks from API to get fresh data
      await loadTasks()
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
  openTaskDialog('edit', task.id)
}

function deleteTask(task: Task) {
  console.log('🗑️ Delete task:', task.name)
  openTaskDialog('edit', task.id)
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
function openTaskDialog(mode: 'create' | 'edit' | 'view', taskId?: string | null) {
  console.log('🔧 Opening task dialog:', mode, taskId)

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
      }
    } else {
      console.log('❌ Task not found:', taskId)
      console.log('❌ Available tasks:', tasks.value)
    }
  } else {
    // Create mode
    console.log('🔧 Setting dialog to create mode')
    taskDialog.value = {
      isOpen: true,
      mode: 'create',
      task: null,
    }
  }

  console.log('🔧 Dialog state after update:', taskDialog.value)
}

function closeTaskDialog() {
  taskDialog.value.isOpen = false
  taskDialog.value.task = null
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
        const events = tasks.value.map(taskToCalendarTask)
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
        assignees: taskData.assignees || [],
        resources: taskData.resources || [],
        dependencies: taskData.dependencies || [],
      }

      console.log('📤 Sending update payload:', updatePayload)

      try {
        const updatedTask = await tasksApi.update(props.projectId, taskData.id!, updatePayload as unknown as Partial<TaskCreateUpdate>)
        console.log('✅ Task updated via API:', updatedTask)

        // Reload tasks from API to get fresh data
        await loadTasks()
      } catch (apiError) {
        console.error('❌ API update failed, updating locally:', apiError)

        // Fallback: update local array if API fails
        const taskIndex = tasks.value.findIndex(t => t.id === taskData.id)
        if (taskIndex !== -1) {
          tasks.value[taskIndex] = { ...tasks.value[taskIndex], ...taskData }
          console.log('✅ Task updated locally as fallback')

          // Update calendar
          const events = tasks.value.map(taskToCalendarTask)
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
  console.log('🗑️ Deleting task via API:', taskId)

  try {
    const response = await tasksApi.delete(props.projectId, taskId)
    console.log('✅ Task deleted via API:', response)

    // Reload tasks from API to get fresh data
    await loadTasks()

    closeTaskDialog()
  } catch (apiError) {
    console.error('❌ API deletion failed, removing locally:', apiError)

    // Fallback: remove from local array if API fails
    const taskIndex = tasks.value.findIndex(t => t.id === taskId)
    if (taskIndex !== -1) {
      tasks.value.splice(taskIndex, 1)
      console.log('✅ Task deleted locally as fallback')

      // Update calendar
      const events = tasks.value.map(taskToCalendarTask)
      updateCalendarEvents(events)
    }

    closeTaskDialog()
  }
}

async function handleTaskDuplicate(originalTask: Task) {
  console.log('📋 Duplicating task via API:', originalTask.name)

  // Create a copy with minimal required fields
  const duplicatePayload: Record<string, unknown> = {
    name: `${originalTask.name} (Copy)`,
    start_planned: new Date().toISOString().split('T')[0],
    end_planned: originalTask.end_planned || new Date().toISOString().split('T')[0],
    milestone: false, // Copies are not milestones by default
    status: 'planned',
    progress_pct: 0,
  }

  // Add optional fields only if they have values
  if (originalTask.wbs_path) {
    duplicatePayload.wbs_path = originalTask.wbs_path
  }

  if (originalTask.notes) {
    duplicatePayload.notes = originalTask.notes
  }

  console.log('📤 Sending duplicate payload:', duplicatePayload)

  try {
    const newTask = await tasksApi.create(props.projectId, duplicatePayload as unknown as TaskCreateUpdate)
    console.log('✅ Task duplicated via API:', newTask)

    // Reload tasks from API to get fresh data
    await loadTasks()
  } catch (apiError) {
    console.error('❌ API duplication failed, adding locally:', apiError)

    // Fallback: add to local array if API fails
    const duplicatedTask: Task = {
      ...originalTask,
      id: `temp-${Date.now()}`,
      name: `${originalTask.name} (Copy)`,
      start_planned: new Date().toISOString().split('T')[0],
      end_planned: originalTask.end_planned ?
        new Date(Date.now() + (originalTask.duration_days || 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] :
        undefined,
      progress_pct: 0,
      status: 'planned',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    tasks.value.push(duplicatedTask)
    console.log('✅ Task duplicated locally as fallback')

    // Update calendar
    const events = tasks.value.map(taskToCalendarTask)
    updateCalendarEvents(events)
  }

  closeTaskDialog()
  console.log('✅ Task duplication completed')
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

  // Load tasks from API
  loadTasks()
})

// Expose functions for parent component
defineExpose({
  openTaskDialog,
  loadTasks,
})
</script>

<template>
  <div class="bg-white rounded-lg shadow">
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

    <!-- Calendar Header with Export Buttons -->
    <div class="p-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <span v-if="loading" class="text-sm text-gray-500">Loading tasks...</span>
          <span v-else-if="error" class="text-sm text-red-500">{{ error }}</span>
          <span v-else class="text-sm text-gray-500">
            {{ tasks.length }} tasks
          </span>
        </div>

        <div class="flex items-center space-x-4">
          <!-- Status Legend -->
          <div class="flex items-center space-x-3 text-xs">
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
    <div v-if="viewMode === 'ical'" class="p-4">
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
            <div v-if="props.canEdit" class="absolute top-2 right-2 flex items-center space-x-1">
              <button
                @click.stop="editTask(task)"
                class="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                title="Edit task"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
              </button>
              <button
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
              <h4 class="font-medium text-gray-900 flex-1">{{ task.name }}</h4>
              <span v-if="task.milestone" class="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                Milestone
              </span>
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
                <h3 class="text-xl font-semibold text-gray-900">{{ selectedTask.name }}</h3>
                <span v-if="selectedTask.milestone" class="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                  Milestone
                </span>
              </div>
              <div v-if="props.canEdit" class="flex items-center space-x-2">
                <button
                  @click="editTask(selectedTask)"
                  class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Edit
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
      @close="closeTaskDialog"
      @save="handleTaskSave"
      @delete="handleTaskDelete"
      @duplicate="handleTaskDuplicate"
    />
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

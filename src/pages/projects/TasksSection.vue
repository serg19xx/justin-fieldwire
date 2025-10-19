<template>
  <div class="tasks-section flex-1 flex flex-col">
    <!-- Calendar Component -->
    <ProjectCalendar
      v-if="project && (project as any).id"
      ref="calendarRef"
      :project-id="(project as any).id"
      :can-edit="canEdit"
      @event-click="handleEventClick"
      @date-click="handleDateClick"
      @event-drop="handleEventDrop"
      @event-resize="handleEventResize"
      @task-update="handleTaskUpdate"
      @task-duplicate="handleTaskDuplicate"
      @editPanelOpen="handleEditPanelOpen"
    />
    <!-- Loading state for tasks -->
    <div v-else class="flex items-center justify-center h-64">
      <div class="text-center">
        <svg
          class="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <p class="text-gray-600">Loading tasks...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ProjectCalendar from './ProjectCalendar.vue'

defineOptions({
  name: 'TasksSection',
})

// Props
interface Props {
  project?: unknown
  canEdit?: boolean
}

defineProps<Props>()

// Refs
const calendarRef = ref()

// Expose ref to parent
defineExpose({ calendarRef })

// Emits
const emit = defineEmits<{
  eventClick: [event: unknown]
  dateClick: [date: unknown]
  eventDrop: [event: unknown]
  eventResize: [event: unknown]
  taskUpdate: [task: unknown]
  taskDuplicate: [task: unknown]
  editPanelOpen: [task: unknown]
}>()

// Methods
const handleEventClick = (event: unknown) => {
  emit('eventClick', event)
}

const handleDateClick = (date: unknown) => {
  emit('dateClick', date)
}

const handleEventDrop = (event: unknown) => {
  emit('eventDrop', event)
}

const handleEventResize = (event: unknown) => {
  emit('eventResize', event)
}

const handleTaskUpdate = (task: unknown) => {
  emit('taskUpdate', task)
}

const handleTaskDuplicate = (task: unknown) => {
  emit('taskDuplicate', task)
}

const handleEditPanelOpen = (task: unknown) => {
  emit('editPanelOpen', task)
}
</script>

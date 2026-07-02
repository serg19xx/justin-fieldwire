<template>
  <div class="flex flex-col h-full bg-white border-r border-gray-200">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200 bg-gray-50">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-sm font-semibold text-gray-900">Tasks</h3>
        <span class="text-xs text-gray-500">({{ filteredTasks.length }})</span>
      </div>
      <p v-if="activeFiltersCount > 0" class="text-xs text-blue-600">
        {{ activeFiltersCount }} filter{{ activeFiltersCount !== 1 ? 's' : '' }} active
      </p>
    </div>

    <!-- Task List -->
    <div ref="listContainerRef" class="flex-1 overflow-y-auto" @scroll="handleListScroll">
      <div v-if="filteredTasks.length === 0" class="p-4 text-center text-gray-500">
        <div class="text-2xl mb-2">📋</div>
        <p class="text-xs">No tasks found</p>
        <p v-if="activeFiltersCount > 0" class="text-xs mt-1 text-gray-400">
          Try adjusting filters
        </p>
      </div>
      <div v-else class="divide-y divide-gray-100">
        <button
          v-for="task in filteredTasks"
          :key="task.id"
          :data-task-id="task.id"
          @click="selectTask(task)"
          :class="[
            'w-full text-left p-3 transition-all relative border-l-4',
            isSelected(task.id)
              ? 'bg-blue-50 border-l-blue-500 font-medium'
              : 'bg-white border-l-transparent hover:bg-gray-50',
          ]"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <!-- Task Name -->
              <div class="mb-1">
                <span class="text-sm font-medium text-gray-900 truncate block">{{ task.name }}</span>
              </div>

              <!-- Dates -->
              <div class="text-xs text-gray-500">
                <div v-if="task.start_planned">
                  <span>{{ formatDate(task.start_planned) }}</span>
                  <span v-if="task.end_planned"> - {{ formatDate(task.end_planned) }}</span>
                </div>
                <div v-else class="text-gray-400">No dates</div>
              </div>

              <!-- Type icon, status & progress -->
              <div class="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span
                  class="text-base leading-none flex-shrink-0"
                  :title="isMilestone(task.milestone) ? getMilestoneSubtype(task) || 'Milestone' : 'Task'"
                >
                  {{ getTaskTypeIcon(task) }}
                </span>
                <span
                  :class="[
                    'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                    getTaskStatusClass(task.status),
                  ]"
                >
                  {{ getTaskStatusLabel(task.status) }}
                </span>
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                  {{ task.progress_pct ?? 0 }}%
                </span>
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { isMilestone, type MilestoneType, type Task } from '@/core/types/task'
import {
  getMilestoneTypeIcon,
  getMilestoneTypeLabel,
  getTaskStatusClass,
  getTaskStatusLabel,
} from '@/core/utils/task-utils'

interface Props {
  filteredTasks: Task[]
  selectedTaskId?: string | number | null
  activeFiltersCount: number
  initialScrollTop?: number
}

const props = withDefaults(defineProps<Props>(), {
  initialScrollTop: 0,
})

const emit = defineEmits<{
  'task-selected': [task: Task]
  'scroll-position': [scrollTop: number]
}>()

const listContainerRef = ref<HTMLElement | null>(null)
const savedScrollTop = ref(props.initialScrollTop)

function emitScrollPosition() {
  const scrollTop = listContainerRef.value?.scrollTop ?? savedScrollTop.value
  savedScrollTop.value = scrollTop
  emit('scroll-position', scrollTop)
}

function handleListScroll() {
  emitScrollPosition()
}

function restoreScrollPosition() {
  const container = listContainerRef.value
  if (!container) return
  const top = props.initialScrollTop ?? savedScrollTop.value
  container.scrollTop = top
  savedScrollTop.value = top
}

function scrollSelectedIntoView(behavior: ScrollBehavior = 'auto') {
  const container = listContainerRef.value
  const selectedId = normalizedSelectedId.value
  if (!container || !selectedId) return

  const selectedEl = container.querySelector<HTMLElement>(`[data-task-id="${selectedId}"]`)
  selectedEl?.scrollIntoView({ block: 'nearest', behavior })
}

watch(
  () => props.filteredTasks,
  async () => {
    await nextTick()
    restoreScrollPosition()
    scrollSelectedIntoView()
  },
  { flush: 'post' },
)

watch(
  () => props.initialScrollTop,
  async () => {
    savedScrollTop.value = props.initialScrollTop
    await nextTick()
    restoreScrollPosition()
  },
)

watch(
  () => props.selectedTaskId,
  async () => {
    await nextTick()
    scrollSelectedIntoView('auto')
  },
)

onMounted(async () => {
  await nextTick()
  restoreScrollPosition()
  scrollSelectedIntoView('auto')
})

onBeforeUnmount(() => {
  emitScrollPosition()
})

defineExpose({
  scrollSelectedIntoView,
  preserveScrollTop: emitScrollPosition,
})

// Normalize selectedTaskId to string for consistent comparison
const normalizedSelectedId = computed(() => {
  return props.selectedTaskId ? String(props.selectedTaskId) : null
})

function selectTask(task: Task) {
  emit('task-selected', task)
}

function isSelected(taskId: string | number | undefined): boolean {
  if (!normalizedSelectedId.value || !taskId) return false
  // Compare normalized strings
  return normalizedSelectedId.value === String(taskId)
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getMilestoneSubtype(task: Task): string | null {
  if (!isMilestone(task.milestone)) return null
  const milestoneType =
    typeof task.milestone === 'string'
      ? task.milestone
      : task.milestone_type
  return getMilestoneTypeLabel(milestoneType as MilestoneType)
}

function getTaskTypeIcon(task: Task): string {
  if (!isMilestone(task.milestone)) return '📝'
  const milestoneType =
    typeof task.milestone === 'string'
      ? task.milestone
      : task.milestone_type
  return getMilestoneTypeIcon(milestoneType as MilestoneType)
}
</script>

<style scoped>
/* Ensure selected task has consistent blue border */
button.border-l-blue-500 {
  border-left-color: #3b82f6 !important;
  border-left-width: 4px !important;
  background-color: #eff6ff !important;
}

/* Ensure non-selected tasks have transparent border */
button.border-l-transparent {
  border-left-color: transparent !important;
  border-left-width: 4px !important;
}
</style>


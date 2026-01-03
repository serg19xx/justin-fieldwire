import { ref, computed, type Ref } from 'vue'
import type { Task, TaskFilter, TaskStatus } from '@/core/types/task'
import { isMilestone } from '@/core/types/task'

export interface TaskFilterState {
  search: string
  workerId: number | null
  statuses: TaskStatus[]
  startDate: string | null
  endDate: string | null
  taskType: 'task' | 'milestone' | 'all'
  category: string | null
}

export function useTaskFilters(tasks: Ref<Task[]>) {
  // Filter state
  const filterState = ref<TaskFilterState>({
    search: '',
    workerId: null,
    statuses: [],
    startDate: null,
    endDate: null,
    taskType: 'all',
    category: null,
  })

  // Computed filtered tasks
  const filteredTasks = computed(() => {
    let result = [...tasks.value]

    // Search filter
    if (filterState.value.search.trim()) {
      const query = filterState.value.search.toLowerCase()
      result = result.filter(
        (task) =>
          task.name.toLowerCase().includes(query) ||
          task.notes?.toLowerCase().includes(query) ||
          task.wbs_path?.toLowerCase().includes(query),
      )
    }

    // Worker filter
    if (filterState.value.workerId !== null) {
      result = result.filter((task) => {
        // Check if worker is task lead
        if (task.task_lead_id === filterState.value.workerId) {
          return true
        }
        // Check if worker is in team members
        if (task.team_members && Array.isArray(task.team_members)) {
          return task.team_members.includes(filterState.value.workerId!)
        }
        return false
      })
    }

    // Status filter
    if (filterState.value.statuses.length > 0) {
      result = result.filter((task) => filterState.value.statuses.includes(task.status))
    }

    // Start date filter
    if (filterState.value.startDate) {
      const startDate = new Date(filterState.value.startDate)
      result = result.filter((task) => {
        if (!task.start_planned) return false
        const taskStart = new Date(task.start_planned)
        return taskStart >= startDate
      })
    }

    // End date filter
    if (filterState.value.endDate) {
      const endDate = new Date(filterState.value.endDate)
      result = result.filter((task) => {
        if (!task.end_planned) return false
        const taskEnd = new Date(task.end_planned)
        return taskEnd <= endDate
      })
    }

    // Task type filter
    if (filterState.value.taskType !== 'all') {
      if (filterState.value.taskType === 'milestone') {
        result = result.filter((task) => isMilestone(task.milestone))
      } else {
        result = result.filter((task) => !isMilestone(task.milestone))
      }
    }

    // Category filter
    if (filterState.value.category) {
      // Note: Tasks don't have category field directly, might need to add it
      // For now, this is a placeholder
      // result = result.filter((task) => task.category === filterState.value.category)
    }

    return result
  })

  // Clear all filters
  function clearFilters() {
    filterState.value = {
      search: '',
      workerId: null,
      statuses: [],
      startDate: null,
      endDate: null,
      taskType: 'all',
      category: null,
    }
  }

  // Get filter summary
  const activeFiltersCount = computed(() => {
    let count = 0
    if (filterState.value.search) count++
    if (filterState.value.workerId !== null) count++
    if (filterState.value.statuses.length > 0) count++
    if (filterState.value.startDate) count++
    if (filterState.value.endDate) count++
    if (filterState.value.taskType !== 'all') count++
    if (filterState.value.category) count++
    return count
  })

  // Convert to API filter format
  function toApiFilter(): TaskFilter {
    const filter: TaskFilter = {}

    if (filterState.value.statuses.length > 0) {
      filter.status = filterState.value.statuses
    }

    if (filterState.value.startDate && filterState.value.endDate) {
      filter.dateRange = {
        start: filterState.value.startDate,
        end: filterState.value.endDate,
      }
    } else if (filterState.value.startDate) {
      filter.startDate = filterState.value.startDate
    } else if (filterState.value.endDate) {
      filter.endDate = filterState.value.endDate
    }

    if (filterState.value.search) {
      filter.search = filterState.value.search
    }

    return filter
  }

  return {
    filterState,
    filteredTasks,
    clearFilters,
    activeFiltersCount,
    toApiFilter,
  }
}


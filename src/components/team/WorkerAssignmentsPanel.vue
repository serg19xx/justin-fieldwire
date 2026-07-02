<template>
  <div class="flex flex-col" role="region" aria-labelledby="worker-tasks-title">
    <header class="flex-shrink-0 border-b border-gray-200 bg-gray-50 px-4 py-4 sm:px-6">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 mb-3"
        @click="emit('close')"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to team list
      </button>
      <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">Worker schedule (view only)</p>
      <h2 id="worker-tasks-title" class="text-lg font-semibold text-gray-900 truncate">
        {{ userName || 'Worker' }}
      </h2>
      <p v-if="scopeHint" class="text-sm text-gray-500 mt-1">{{ scopeHint }}</p>
      <p v-if="summaryLine" class="text-sm text-gray-600 mt-1">{{ summaryLine }}</p>
    </header>

    <div class="px-4 py-4 sm:px-6">
      <div v-if="isLoading" class="py-12 text-center">
        <div class="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
        <p class="text-sm text-gray-500 mt-3">Loading tasks…</p>
      </div>

      <div v-else-if="loadError" class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        {{ loadError }}
      </div>

      <div v-else-if="projectViews.length === 0" class="py-10 text-center text-sm text-gray-500">
        No task assignments for this worker.
      </div>

      <!-- Single project: tabs only -->
      <template v-else-if="scopedProjectId && projectViews[0]">
        <ProjectTasksPanel
          :view="projectViews[0]"
          :active-tab="activeTab"
          @update:active-tab="activeTab = $event"
        />
      </template>

      <!-- Global: accordion per project -->
      <div v-else class="space-y-3">
        <div
          v-for="view in projectViews"
          :key="view.projectId"
          class="rounded-xl border border-gray-200 overflow-hidden"
        >
          <button
            type="button"
            class="w-full flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left transition-colors"
            @click="toggleProject(view.projectId)"
          >
            <div class="min-w-0">
              <p class="font-medium text-gray-900 truncate">{{ view.projectName }}</p>
              <p v-if="view.projectAddress" class="text-xs text-gray-500 truncate mt-0.5">
                {{ view.projectAddress }}
              </p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-xs text-gray-500">{{ pmProjectTasksTotal(view) }} tasks</span>
              <svg
                class="h-5 w-5 text-gray-400 transition-transform"
                :class="{ 'rotate-180': isProjectExpanded(view.projectId) }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          <div v-if="isProjectExpanded(view.projectId)" class="border-t border-gray-200 px-4 py-4 bg-white">
            <ProjectTasksPanel
              :view="view"
              :active-tab="accordionTabByProject[view.projectId] ?? 'current'"
              @update:active-tab="accordionTabByProject[view.projectId] = $event"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import ProjectTasksPanel from '@/components/team/ProjectTasksPanel.vue'
import {
  buildPmProjectTasksView,
  loadProjectTasksForAssignPicker,
  loadWorkerAssignmentGroups,
  pmProjectTasksTotal,
  pmTabCount,
  type AssignmentProjectHint,
  type PmWorkerProjectTasksView,
  type PmWorkerTasksTab,
} from '@/core/utils/worker-assignments'
import type { Task } from '@/core/types/task'

const props = withDefaults(
  defineProps<{
    userId: number | null
    userName?: string
    projectId?: number | null
    projectName?: string
    project?: AssignmentProjectHint | null
    projectTasks?: Task[]
  }>(),
  {
    userName: '',
    projectId: null,
    projectName: '',
    project: null,
    projectTasks: () => [],
  },
)

const emit = defineEmits<{
  close: []
}>()

const isLoading = ref(false)
const loadError = ref('')
const projectViews = ref<PmWorkerProjectTasksView[]>([])
const activeTab = ref<PmWorkerTasksTab>('current')
const expandedProjectIds = ref<Set<number>>(new Set())
const accordionTabByProject = reactive<Record<number, PmWorkerTasksTab>>({})

const scopedProjectId = computed(() =>
  props.projectId != null && props.projectId > 0 ? props.projectId : null,
)

const scopeHint = computed(() => {
  if (scopedProjectId.value && props.projectName) {
    return `Project: ${props.projectName}`
  }
  if (scopedProjectId.value) {
    return `Project #${scopedProjectId.value}`
  }
  return 'All assigned projects'
})

const summaryLine = computed(() => {
  if (isLoading.value || projectViews.value.length === 0) return ''
  const total = projectViews.value.reduce((sum, v) => sum + pmProjectTasksTotal(v), 0)
  if (scopedProjectId.value) {
    return total === 1 ? '1 assigned task' : `${total} assigned tasks`
  }
  const pc = projectViews.value.length
  return `${total} tasks across ${pc} project${pc === 1 ? '' : 's'}`
})

function isProjectExpanded(projectId: number): boolean {
  return expandedProjectIds.value.has(projectId)
}

function toggleProject(projectId: number): void {
  const next = new Set(expandedProjectIds.value)
  if (next.has(projectId)) {
    next.delete(projectId)
  } else {
    next.add(projectId)
    if (!accordionTabByProject[projectId]) {
      accordionTabByProject[projectId] = 'current'
    }
  }
  expandedProjectIds.value = next
}

async function loadPanelData(): Promise<void> {
  const uid = props.userId
  if (uid == null) return

  isLoading.value = true
  loadError.value = ''

  try {
    let projectTasksCache: Task[] = []
    if (scopedProjectId.value) {
      projectTasksCache = props.projectTasks.length
        ? [...props.projectTasks]
        : await loadProjectTasksForAssignPicker(scopedProjectId.value)
    }

    const groups = await loadWorkerAssignmentGroups(uid, {
      projectId: scopedProjectId.value ?? undefined,
      project: props.project ?? undefined,
      projectTasks: scopedProjectId.value ? projectTasksCache : undefined,
    })

    projectViews.value = groups.map((g) => buildPmProjectTasksView(g))

    if (projectViews.value.length > 0) {
      const first = projectViews.value[0]
      if (pmTabCount(first, 'current') > 0) activeTab.value = 'current'
      else if (pmTabCount(first, 'planned') > 0) activeTab.value = 'planned'
      else activeTab.value = 'archive'
    }

    if (!scopedProjectId.value && projectViews.value.length > 0) {
      expandedProjectIds.value = new Set([projectViews.value[0].projectId])
      accordionTabByProject[projectViews.value[0].projectId] = 'current'
    }
  } catch {
    loadError.value = 'Could not load tasks.'
    projectViews.value = []
  } finally {
    isLoading.value = false
  }
}

watch(
  () => [props.userId, props.projectId, props.projectTasks] as const,
  ([userId]) => {
    if (userId != null) {
      activeTab.value = 'current'
      void loadPanelData()
    } else {
      projectViews.value = []
      loadError.value = ''
      expandedProjectIds.value = new Set()
    }
  },
  { immediate: true, deep: true },
)
</script>

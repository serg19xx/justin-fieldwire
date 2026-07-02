<template>
  <div>
    <nav class="flex gap-1 border-b border-gray-200 mb-4" aria-label="Task schedule tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
        :class="
          activeTab === tab.id
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
        "
        @click="emit('update:activeTab', tab.id)"
      >
        {{ tab.label }}
        <span v-if="tab.count > 0" class="ml-1 text-xs opacity-75">({{ tab.count }})</span>
      </button>
    </nav>

    <div v-if="activeTab === 'planned'">
      <p class="text-xs text-gray-500 mb-3">
        Tasks in planning or scheduling — PM view only. Updates as assignments change during planning.
      </p>
      <TaskRowList v-if="view.planned.length" :rows="view.planned" />
      <p v-else class="py-8 text-center text-sm text-gray-500">No planned task assignments.</p>
    </div>

    <div v-else-if="activeTab === 'current'">
      <template v-if="view.currentPrimary || view.currentUpcoming.length">
        <section v-if="view.currentPrimary" class="mb-4">
          <h4 class="text-xs font-semibold uppercase tracking-wide text-green-700 mb-2">Current</h4>
          <TaskRowList :rows="[view.currentPrimary]" highlight-current />
        </section>
        <section v-if="view.currentUpcoming.length">
          <h4
            v-if="view.currentPrimary"
            class="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2"
          >
            Upcoming
          </h4>
          <TaskRowList :rows="view.currentUpcoming" />
        </section>
      </template>
      <p v-else class="py-8 text-center text-sm text-gray-500">No active or upcoming tasks.</p>
    </div>

    <div v-else-if="activeTab === 'archive'">
      <TaskRowList v-if="view.archive.length" :rows="view.archive" />
      <p v-else class="py-8 text-center text-sm text-gray-500">No archived tasks.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TaskRowList from '@/components/team/WorkerTaskRowList.vue'
import { pmTabCount, type PmWorkerProjectTasksView, type PmWorkerTasksTab } from '@/core/utils/worker-assignments'

const props = defineProps<{
  view: PmWorkerProjectTasksView
  activeTab: PmWorkerTasksTab
}>()

const emit = defineEmits<{
  'update:activeTab': [tab: PmWorkerTasksTab]
}>()

const tabs = computed(() => [
  { id: 'planned' as const, label: 'Planned', count: pmTabCount(props.view, 'planned') },
  { id: 'current' as const, label: 'Current', count: pmTabCount(props.view, 'current') },
  { id: 'archive' as const, label: 'Archive', count: pmTabCount(props.view, 'archive') },
])
</script>

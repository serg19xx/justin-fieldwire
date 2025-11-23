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
        <!-- Test Dependency Line -->
        <button
          @click="() => createTestDependencyLine('FS')"
          class="flex items-center gap-2 px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
          </svg>
          FS Test
        </button>
        <button
          @click="() => createTestDependencyLine('SS')"
          class="flex items-center gap-2 px-3 py-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-md transition-colors"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
          </svg>
          SS Test
        </button>
        <button
          @click="() => createTestDependencyLine('FF')"
          class="flex items-center gap-2 px-3 py-1 text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-md transition-colors"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
          </svg>
          FF Test
        </button>
        <button
          @click="() => createTestDependencyLine('SF')"
          class="flex items-center gap-2 px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
          </svg>
          SF Test
        </button>

        <!-- Lag controls -->
        <div v-if="testDependencyLine.visible" class="flex items-center gap-2 px-3 py-1 text-xs bg-gray-100 rounded-md">
          <span class="text-gray-600">Lag:</span>
          <button
            @click="updateConstraintLag(`constraint-${testDependencyLine.fromTaskId}-${testDependencyLine.toTaskId}-${testDependencyLine.type}`, getConstraintLag(`constraint-${testDependencyLine.fromTaskId}-${testDependencyLine.toTaskId}-${testDependencyLine.type}`) - 1)"
            class="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
          >
            -1d
          </button>
          <span class="px-2 py-1 bg-white border rounded min-w-[3rem] text-center">
            {{ getConstraintLag(`constraint-${testDependencyLine.fromTaskId}-${testDependencyLine.toTaskId}-${testDependencyLine.type}`) }}d
          </span>
          <button
            @click="updateConstraintLag(`constraint-${testDependencyLine.fromTaskId}-${testDependencyLine.toTaskId}-${testDependencyLine.type}`, getConstraintLag(`constraint-${testDependencyLine.fromTaskId}-${testDependencyLine.toTaskId}-${testDependencyLine.type}`) + 1)"
            class="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
          >
            +1d
          </button>
        </div>

        <!-- Constraint violation notifications -->
        <div v-if="constraintViolations.length > 0" class="fixed top-4 right-4 z-50 space-y-2">
          <div
            v-for="violation in constraintViolations"
            :key="violation.id"
            class="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-md shadow-lg max-w-sm"
          >
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">Constraint Violation</h3>
                <div class="mt-1 text-sm text-red-700">
                  {{ violation.message }}
                </div>
                <div v-if="violation.suggestedStart" class="mt-1 text-xs text-red-600">
                  💡 Suggested start: {{ violation.suggestedStart }}
                </div>
                <div v-if="violation.suggestedEnd" class="mt-1 text-xs text-red-600">
                  💡 Suggested end: {{ violation.suggestedEnd }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          @click="loadRealDependencies"
          class="flex items-center gap-2 px-3 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          Load Real
        </button>
        <!-- Clear Test Line -->
        <button
          @click="clearTestDependencyLine"
          class="flex items-center gap-2 px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
          Clear Line
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
                  <span class="text-xs text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0 font-mono">
                    {{ mappedTasks.findIndex(t => t.id === task.id) + 1 }}
                  </span>

                  <!-- Task Title -->
                <span class="truncate">{{ task.title }}</span>
                </div>

                <!-- Duration Badge -->
                <span class="ml-2 text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded flex-shrink-0">
                  {{ task.duration }}d
                </span>
              </div>
            </div>
          </div>
              </div>
            </div>

      <!-- Right Panel: Gantt Grid -->
      <div class="gantt-right-panel" ref="rightPanelRef" @scroll="handleDependencyLineScroll">
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
                  testDependencyLine.visible && testDependencyLine.from.taskId === task.id ? 'ring-2 ring-green-600 bg-green-200 border-2 border-green-600' : '',
                  testDependencyLine.visible && testDependencyLine.to.taskId === task.id ? 'ring-2 ring-orange-600 bg-orange-200 border-2 border-orange-600' : '',
                ]"
                class="task-bar absolute top-1/2 rounded h-6 flex items-center px-1 text-white text-xs font-medium select-none"
                :data-task-id="task.id"
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
                  <!-- Dependency line labels -->
                  <span v-if="testDependencyLine.visible && testDependencyLine.from.taskId === task.id" class="ml-1 text-xs bg-green-600 text-white px-1 rounded font-bold">
                    FROM
                  </span>
                  <span v-if="testDependencyLine.visible && testDependencyLine.to.taskId === task.id" class="ml-1 text-xs bg-orange-600 text-white px-1 rounded font-bold">
                    TO
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
            class="dependency-arrows absolute inset-0 pointer-events-none"
            style="z-index: 1;"
            :width="projectRange ? (projectRange.totalDays * 33) : 0"
            :height="mappedTasks.length * 32"
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="6"
                markerHeight="4"
                refX="5"
                refY="2"
                orient="auto"
              >
                <polygon
                  points="0 0, 6 2, 0 4"
                  fill="#dc2626"
                  opacity="0.8"
                />
              </marker>
            </defs>
            <!-- Test dependency line with broken path -->
            <path
              v-if="testDependencyLine.visible && testDependencyLine.path"
              :d="testDependencyLine.path"
              :stroke="dependencyTypes[testDependencyLine.type]?.color || '#dc2626'"
              stroke-width="2"
              fill="none"
              marker-end="url(#arrowhead)"
              class="test-dependency-line"
              :stroke-dasharray="getStrokeDashArray(testDependencyLine.type)"
              opacity="0.9"
              @click="console.log('🎯 SVG path clicked')"
            />

            <!-- Real dependencies from API - DISABLED for now -->
            <!-- <path
              v-for="dependency in realDependencies.filter(dep => dep.visible && dep.path)"
              :key="dependency.id"
              :d="dependency.path"
              stroke="#3b82f6"
              stroke-width="2"
              fill="none"
              marker-end="url(#arrowhead)"
              class="real-dependency-line"
              @click="console.log('🎯 Real dependency clicked:', dependency.id)"
            /> -->

            <!-- Dependency type label - positioned over the line with background -->
            <g v-if="testDependencyLine.visible">
              <!-- Calculate line center position, lowered a bit more -->
              <rect
                :x="(testDependencyLine.from.x + testDependencyLine.to.x) / 2 - 8"
                :y="(testDependencyLine.from.y + testDependencyLine.to.y) / 2 + 1"
                width="16"
                height="8"
                fill="white"
                stroke="white"
                stroke-width="1"
                rx="2"
              />
              <!-- Text label -->
              <text
                :x="(testDependencyLine.from.x + testDependencyLine.to.x) / 2"
                :y="(testDependencyLine.from.y + testDependencyLine.to.y) / 2 + 8"
                :fill="dependencyTypes[testDependencyLine.type]?.color || '#dc2626'"
                class="text-xs font-bold"
                text-anchor="middle"
                font-size="10"
                font-weight="bold"
              >
                {{ dependencyTypes[testDependencyLine.type]?.label || 'FS' }}
              </text>
            </g>
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
import { projectApi, type ProjectTeamMember } from '@/core/utils/project-api'
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
  status: 'planned' | 'scheduled' | 'scheduled_accepted' | 'in_progress' | 'partially_completed' | 'delayed_due_to_issue' | 'ready_for_inspection' | 'completed'
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
  // Use tasks from props (already filtered by parent component)
  const tasksToUse = localTasks.value.length > 0 ? localTasks.value : (props.tasks || [])
  if (!tasksToUse || tasksToUse.length === 0) return null

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
    const starts = tasksToUse.map((t) => t.start_planned).filter((s): s is string => !!s)
    const ends = tasksToUse
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

// Note: Worker filtering is handled by parent component (ProjectCalendar)
// Tasks are already filtered when passed via props.tasks

// Initialize local tasks when props change
// Note: Worker filtering is handled by parent component (ProjectCalendar)
watch(() => props.tasks, (newTasks) => {
  if (newTasks) {
    localTasks.value = [...newTasks]
  }
}, { immediate: true })

// Map tasks to gantt format
const mappedTasks = computed<GanttTask[]>(() => {
  // Use tasks from props (already filtered by parent component)
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


      // Convert milestone to boolean - milestone can be MilestoneType | null | 0 | false
      const isMilestone = typeof t.milestone === 'string' || (typeof t.milestone === 'boolean' && t.milestone) || (typeof t.milestone === 'number' && t.milestone > 0)

      return {
        id: Number(t.id),
        title: t.name,
        start: t.start_planned,
        end: endDate || t.start_planned,
        duration: duration,
        status: mapStatus(t.status),
        milestone: isMilestone ? true : undefined,
        milestone_type: typeof t.milestone === 'string' ? t.milestone : t.milestone_type,
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
    case 'planned':
      return 'bg-yellow-500 border border-yellow-600 shadow-sm' // Planned - yellow
    case 'scheduled':
      return 'bg-indigo-500 border border-indigo-600 shadow-sm' // Scheduled - indigo
    case 'scheduled_accepted':
      return 'bg-purple-500 border border-purple-600 shadow-sm' // Scheduled Accepted - purple
    case 'in_progress':
      return 'bg-blue-500 border border-blue-600 shadow-sm' // In Progress - blue
    case 'partially_completed':
      return 'bg-teal-500 border border-teal-600 shadow-sm' // Partially Completed - teal
    case 'delayed_due_to_issue':
      return 'bg-orange-500 border border-orange-600 shadow-sm' // Delayed Due To Issue - orange
    case 'ready_for_inspection':
      return 'bg-cyan-500 border border-cyan-600 shadow-sm' // Ready For Inspection - cyan
    case 'completed':
      return 'bg-green-500 border border-green-600 shadow-sm' // Completed - green
    default:
      return 'bg-blue-500 border border-blue-600 shadow-sm' // Default - blue
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

// Function to find dependent tasks (DISABLED)
// function findDependentTasks(taskId: number): GanttTask[] {
//   return mappedTasks.value.filter(task =>
//     task.dependencies && task.dependencies.some(dep => dep.predecessor_id === taskId)
//   )
// }

// Function to cascade move dependent tasks (DISABLED)
// function cascadeMoveDependentTasks(movedTaskId: number, newStart: Date, newEnd: Date) {
//   const dependentTasks = findDependentTasks(movedTaskId)

//   dependentTasks.forEach(dependentTask => {
//     const dep = dependentTask.dependencies?.find(d => d.predecessor_id === movedTaskId)
//     if (!dep) return

//     const originalStart = new Date(dependentTask.start)
//     const originalEnd = new Date(dependentTask.end)
//     const duration = originalEnd.getTime() - originalStart.getTime()

//     let newDependentStart: Date
//     let newDependentEnd: Date

//     switch (dep.type) {
//       case 'FS': // Finish-to-Start: Dependent starts after predecessor finishes + lag
//         newDependentStart = new Date(newEnd)
//         newDependentStart.setDate(newDependentStart.getDate() + dep.lag_days)
//         newDependentEnd = new Date(newDependentStart.getTime() + duration)
//         break

//       case 'SS': // Start-to-Start: Dependent starts when predecessor starts + lag
//         newDependentStart = new Date(newStart)
//         newDependentStart.setDate(newDependentStart.getDate() + dep.lag_days)
//         newDependentEnd = new Date(newDependentStart.getTime() + duration)
//         break

//       case 'FF': // Finish-to-Finish: Dependent finishes when predecessor finishes + lag
//         newDependentEnd = new Date(newEnd)
//         newDependentEnd.setDate(newDependentEnd.getDate() + dep.lag_days)
//         newDependentStart = new Date(newDependentEnd.getTime() - duration)
//         break

//       case 'SF': // Start-to-Finish: Dependent finishes when predecessor starts + lag
//         newDependentEnd = new Date(newStart)
//         newDependentEnd.setDate(newDependentEnd.getDate() + dep.lag_days)
//         newDependentStart = new Date(newDependentEnd.getTime() - duration)
//         break

//       default:
//         return
//     }

//     // Update the dependent task in local state
//     const taskIndex = localTasks.value.findIndex(t => Number(t.id) === dependentTask.id)
//     if (taskIndex !== -1) {
//       localTasks.value[taskIndex] = {
//         ...localTasks.value[taskIndex],
//         start_planned: newDependentStart.toISOString().split('T')[0],
//         end_planned: newDependentEnd.toISOString().split('T')[0],
//       }

//       console.log(`🔄 Cascaded move: ${dependentTask.title} to ${newDependentStart.toISOString().split('T')[0]} - ${newDependentEnd.toISOString().split('T')[0]}`)

//       // Recursively cascade to tasks that depend on this one (DISABLED)
//       // cascadeMoveDependentTasks(dependentTask.id, newDependentStart, newDependentEnd)
//     }
//   })
// }

function mapStatus(status: Task['status'] | string): GanttTask['status'] {
  switch (status) {
    case 'planned':
    case 'scheduled':
    case 'scheduled_accepted':
    case 'in_progress':
    case 'partially_completed':
    case 'delayed_due_to_issue':
    case 'ready_for_inspection':
    case 'completed':
      return status as GanttTask['status']
    // Legacy status mapping for backward compatibility
    case 'done':
      return 'completed'
    case 'blocked':
      return 'delayed_due_to_issue'
    case 'delayed':
      return 'delayed_due_to_issue'
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

// Test dependency line for broken path
const testDependencyLine = ref({
  from: { x: 0, y: 0, taskId: 1 },  // Will be calculated from first task
  to: { x: 0, y: 0, taskId: 2 },    // Will be calculated from second task
  fromTaskId: 1,  // ID of predecessor task
  toTaskId: 2,    // ID of successor task
  visible: false,
  path: '',        // SVG path for the line
  type: 'FS' as 'FS' | 'SS' | 'FF' | 'SF'  // Dependency type
})

// Real dependencies from API
const realDependencies = ref<Array<{
  id: string
  fromTaskId: number
  toTaskId: number
  type: 'FS' | 'SS' | 'FF' | 'SF'
  from: { x: number; y: number; taskId: number }
  to: { x: number; y: number; taskId: number }
  path: string
  visible: boolean
}>>([])

// Global SVG offset for dependency lines
const svgOffset = ref(0)

// Dependency types - simplified: always end → start, but with different visual styles
const dependencyTypes = {
  'FS': { // Finish-to-Start: end of predecessor → start of successor
    fromPoint: 'end',
    toPoint: 'start',
    style: 'solid',
    color: '#3b82f6', // Blue
    label: 'FS'
  },
  'SS': { // Start-to-Start: end of predecessor → start of successor (simplified)
    fromPoint: 'end',
    toPoint: 'start',
    style: 'dashed',
    color: '#8b5cf6', // Purple
    label: 'SS'
  },
  'FF': { // Finish-to-Finish: end of predecessor → start of successor (simplified)
    fromPoint: 'end',
    toPoint: 'start',
    style: 'double',
    color: '#f59e0b', // Orange
    label: 'FF'
  },
  'SF': { // Start-to-Finish: end of predecessor → start of successor (simplified)
    fromPoint: 'end',
    toPoint: 'start',
    style: 'wavy',
    color: '#ef4444', // Red
    label: 'SF'
  }
}

// Function to get stroke dash array based on dependency type
function getStrokeDashArray(dependencyType: 'FS' | 'SS' | 'FF' | 'SF'): string {
  const depConfig = dependencyTypes[dependencyType]
  if (!depConfig) return 'none'

  switch (depConfig.style) {
    case 'solid':
      return 'none'
    case 'dashed':
      return '5,3'
    case 'double':
      return '2,2,8,2'
    case 'wavy':
      return '1,1'
    default:
      return 'none'
  }
}

// Constraint system for dependencies with lag support
const constraints = ref<Array<{
  id: string
  fromTaskId: number
  toTaskId: number
  type: 'FS' | 'SS' | 'FF' | 'SF'
  lagDays: number // Lag in days (can be negative for lead time)
  active: boolean
}>>([])

// Constraint violation notifications
const constraintViolations = ref<Array<{
  id: string
  message: string
  suggestedStart?: string
  suggestedEnd?: string
  timestamp: number
}>>([])

// Function to check if a task movement violates constraints
function checkTaskConstraints(taskId: number, newStart: string, newEnd: string): {
  canMove: boolean
  violations: Array<{
    constraintId: string
    message: string
    suggestedStart?: string
    suggestedEnd?: string
  }>
} {
  const violations: Array<{
    constraintId: string
    message: string
    suggestedStart?: string
    suggestedEnd?: string
  }> = []

  // Find constraints involving this task
  const relevantConstraints = constraints.value.filter(c =>
    c.active && (c.fromTaskId === taskId || c.toTaskId === taskId)
  )

  for (const constraint of relevantConstraints) {
    const fromTask = mappedTasks.value.find(t => t.id === constraint.fromTaskId)
    const toTask = mappedTasks.value.find(t => t.id === constraint.toTaskId)

    if (!fromTask || !toTask) continue

    // Check constraint based on type with lag consideration
    switch (constraint.type) {
      case 'FS': // Finish-to-Start: successor cannot start before predecessor finishes + lag
        if (constraint.toTaskId === taskId) {
          // Calculate the earliest start date considering lag
          const predecessorEndDate = new Date(fromTask.end)
          const lagDate = addDays(predecessorEndDate, constraint.lagDays)
          // FS: successor starts the day AFTER predecessor finishes + lag
          const earliestStart = addDays(lagDate, 1).toISOString().split('T')[0]

          if (newStart < earliestStart) {
            violations.push({
              constraintId: constraint.id,
              message: `Task cannot start before predecessor finishes + ${constraint.lagDays} days (${earliestStart})`,
              suggestedStart: earliestStart
            })
          }
        }
        break

      case 'SS': // Start-to-Start: successor cannot start before predecessor starts + lag
        if (constraint.toTaskId === taskId) {
          const predecessorStartDate = new Date(fromTask.start)
          const lagDate = addDays(predecessorStartDate, constraint.lagDays)
          const earliestStart = lagDate.toISOString().split('T')[0]

          console.log(`🔒 SS constraint check: task ${taskId} wants to start ${newStart}, earliest allowed: ${earliestStart}`)
          console.log(`🔒 Predecessor starts: ${fromTask.start}, lag: ${constraint.lagDays} days`)

          if (newStart < earliestStart) {
            console.log(`🔒 SS constraint VIOLATED! Cannot start before ${earliestStart}`)
            violations.push({
              constraintId: constraint.id,
              message: `Task cannot start before predecessor starts + ${constraint.lagDays} days (${earliestStart})`,
              suggestedStart: earliestStart
            })
          } else {
            console.log(`🔒 SS constraint OK - can start on or after ${earliestStart}`)
          }
        }
        break

      case 'FF': // Finish-to-Finish: successor cannot finish before predecessor finishes + lag
        if (constraint.toTaskId === taskId) {
          const predecessorEndDate = new Date(fromTask.end)
          const lagDate = addDays(predecessorEndDate, constraint.lagDays)
          const earliestEnd = lagDate.toISOString().split('T')[0]

          if (newEnd < earliestEnd) {
            violations.push({
              constraintId: constraint.id,
              message: `Task cannot finish before predecessor finishes + ${constraint.lagDays} days (${earliestEnd})`,
              suggestedEnd: earliestEnd
            })
          }
        }
        break

      case 'SF': // Start-to-Finish: successor cannot finish before predecessor starts + lag
        if (constraint.toTaskId === taskId) {
          const predecessorStartDate = new Date(fromTask.start)
          const lagDate = addDays(predecessorStartDate, constraint.lagDays)
          const earliestEnd = lagDate.toISOString().split('T')[0]

          console.log(`🔒 SF constraint check: task ${taskId} wants to end ${newEnd}, earliest allowed: ${earliestEnd}`)
          console.log(`🔒 Predecessor starts: ${fromTask.start}, lag: ${constraint.lagDays} days`)

          if (newEnd < earliestEnd) {
            console.log(`🔒 SF constraint VIOLATED! Cannot finish before ${earliestEnd}`)
            violations.push({
              constraintId: constraint.id,
              message: `Task cannot finish before predecessor starts + ${constraint.lagDays} days (${earliestEnd})`,
              suggestedEnd: earliestEnd
            })
          } else {
            console.log(`🔒 SF constraint OK - can finish on or after ${earliestEnd}`)
          }
        }
        break
    }
  }

  return {
    canMove: violations.length === 0,
    violations
  }
}

// Function to update constraint lag
function updateConstraintLag(constraintId: string, lagDays: number) {
  const constraint = constraints.value.find(c => c.id === constraintId)
  if (constraint) {
    constraint.lagDays = lagDays
    console.log(`🔒 Updated constraint ${constraintId} lag to ${lagDays} days`)

    // Trigger cascade update when lag changes
    const fromTask = mappedTasks.value.find(t => t.id === constraint.fromTaskId)
    if (fromTask) {
      console.log(`🔄 Triggering cascade update due to lag change`)
      performCascadeUpdates(constraint.fromTaskId, fromTask.start, fromTask.end)
    }
  }
}

// Function to get constraint lag
function getConstraintLag(constraintId: string): number {
  const constraint = constraints.value.find(c => c.id === constraintId)
  return constraint?.lagDays || 0
}

// Function to perform cascade updates when a task moves
function performCascadeUpdates(movedTaskId: number, newStart: string, newEnd: string, saveToApi: boolean = true) {
  console.log(`🔄 Performing cascade updates for task ${movedTaskId}`)

  // Find all constraints where this task is a predecessor
  const affectedConstraints = constraints.value.filter(c =>
    c.active && c.fromTaskId === movedTaskId
  )

  console.log(`🔄 Found ${affectedConstraints.length} affected constraints`)

  for (const constraint of affectedConstraints) {
    const successorTask = mappedTasks.value.find(t => t.id === constraint.toTaskId)
    if (!successorTask) continue

    console.log(`🔄 Updating successor task: ${successorTask.title} (${constraint.type})`)

    // Calculate new dates for successor based on constraint type
    let newSuccessorStart = successorTask.start
    let newSuccessorEnd = successorTask.end

    const predecessorStartDate = new Date(newStart)
    const predecessorEndDate = new Date(newEnd)
    const lagDate = addDays(predecessorStartDate, constraint.lagDays)
    const lagEndDate = addDays(predecessorEndDate, constraint.lagDays)

    switch (constraint.type) {
      case 'FS': // Finish-to-Start: successor starts after predecessor finishes + lag
        // FS: successor starts the day AFTER predecessor finishes + lag
        newSuccessorStart = addDays(lagEndDate, 1).toISOString().split('T')[0]
        // Keep duration, adjust end date
        const duration = Math.ceil((new Date(successorTask.end).getTime() - new Date(successorTask.start).getTime()) / (1000 * 60 * 60 * 24)) + 1
        newSuccessorEnd = addDays(lagEndDate, duration).toISOString().split('T')[0]
        break

      case 'SS': // Start-to-Start: successor starts when predecessor starts + lag
        // SS: successor starts when predecessor starts + lag (not when predecessor ends)
        console.log(`🔄 SS calculation: predecessor starts ${newStart}, lag ${constraint.lagDays} days`)
        console.log(`🔄 lagDate: ${lagDate.toISOString().split('T')[0]}`)
        newSuccessorStart = lagDate.toISOString().split('T')[0]
        // Keep duration, adjust end date
        const ssDuration = Math.ceil((new Date(successorTask.end).getTime() - new Date(successorTask.start).getTime()) / (1000 * 60 * 60 * 24)) + 1
        newSuccessorEnd = addDays(lagDate, ssDuration - 1).toISOString().split('T')[0]
        console.log(`🔄 SS result: ${newSuccessorStart} - ${newSuccessorEnd}`)
        break

      case 'FF': // Finish-to-Finish: successor finishes when predecessor finishes + lag
        newSuccessorEnd = lagEndDate.toISOString().split('T')[0]
        // Keep duration, adjust start date
        const ffDuration = Math.ceil((new Date(successorTask.end).getTime() - new Date(successorTask.start).getTime()) / (1000 * 60 * 60 * 24)) + 1
        newSuccessorStart = addDays(lagEndDate, -(ffDuration - 1)).toISOString().split('T')[0]
        break

      case 'SF': // Start-to-Finish: successor finishes when predecessor starts + lag
        // SF: successor finishes when predecessor starts + lag
        console.log(`🔄 SF calculation: predecessor starts ${newStart}, lag ${constraint.lagDays} days`)
        console.log(`🔄 lagDate: ${lagDate.toISOString().split('T')[0]}`)
        newSuccessorEnd = lagDate.toISOString().split('T')[0]
        // Keep duration, adjust start date
        const sfDuration = Math.ceil((new Date(successorTask.end).getTime() - new Date(successorTask.start).getTime()) / (1000 * 60 * 60 * 24)) + 1
        newSuccessorStart = addDays(lagDate, -(sfDuration - 1)).toISOString().split('T')[0]
        console.log(`🔄 SF result: ${newSuccessorStart} - ${newSuccessorEnd}`)
        break
    }

    console.log(`🔄 Cascade update: ${successorTask.title} ${successorTask.start}-${successorTask.end} → ${newSuccessorStart}-${newSuccessorEnd}`)

    // Update the successor task in local state
    const taskIndex = localTasks.value.findIndex(t => Number(t.id) === constraint.toTaskId)
    if (taskIndex !== -1) {
      localTasks.value[taskIndex] = {
        ...localTasks.value[taskIndex],
        start_planned: newSuccessorStart,
        end_planned: newSuccessorEnd,
      }

      // Save changes to API only if requested
      if (saveToApi) {
        console.log('🔄 Cascade update: Saving dependent task via PUT /api/v1/projects/{project_id}/tasks/{task_id}', {
          projectId: props.projectId,
          taskId: String(constraint.toTaskId),
          start_planned: newSuccessorStart,
          end_planned: newSuccessorEnd,
        })
        saveTaskChanges(String(constraint.toTaskId), newSuccessorStart, newSuccessorEnd)
        console.log(`✅ Cascade update: Updated successor task: ${successorTask.title} (saved to API)`)
      } else {
        console.log(`✅ Updated successor task: ${successorTask.title} (local only)`)
      }
    }
  }

  console.log(`🔄 Cascade updates completed for task ${movedTaskId}`)
}

// Function to update SVG offset
function updateSvgOffset() {
  const svgElement = document.querySelector('.dependency-arrows') as HTMLElement
  const gridContainer = document.querySelector('.gantt-right-panel') as HTMLElement
  if (svgElement && gridContainer) {
    const svgRect = svgElement.getBoundingClientRect()
    const gridRect = gridContainer.getBoundingClientRect()
    svgOffset.value = svgRect.left - gridRect.left
    console.log('🔄 SVG offset updated:', svgOffset.value)
  }
}

// Function to get connection point for a task based on dependency type
function getTaskConnectionPoint(task: GanttTask, point: 'start' | 'end'): { x: number; y: number } | null {
  if (point === 'start') {
    return getTaskBarPosition(task)
  } else {
    return getTaskBarEndPosition(task)
  }
}

// Function to create simplified dependency line path - always end → start
function getBrokenLinePath(from: { x: number; y: number }, to: { x: number; y: number }): string {
  // Simplified logic: always end → start
  const cellWidth = 33 // Width of one day cell
  const halfCell = cellWidth / 2 // Half cell offset

  // Start from end of source task (right edge)
  const startX = from.x

  // Go right by half cell, then down
  const rightX = from.x + halfCell

  // Always end at start of target task (left edge)
  const endX = to.x

  // Create proper Gantt path: from task end → right half cell → down → to task start
  const path = `M ${startX} ${from.y} H ${rightX} V ${to.y} H ${endX}`

  console.log('🎯 Simplified dependency path:', {
    from: { x: from.x, y: from.y },
    to: { x: to.x, y: to.y },
    startX,
    rightX,
    endX,
    path
  })

  return path
}

// Function to get task bar position - USE DOM COORDINATES
function getTaskBarPosition(task: GanttTask): { x: number; y: number } | null {
  // Use the SAME calculation as getTaskBarStyle!
  const startDate = new Date(task.start + 'T00:00:00.000Z')
  const projectStart = projectRange.value?.startDate || new Date()

  const daysFromStart = Math.floor((startDate.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24))

  // Use the SAME left position as in getTaskBarStyle: left: '1px' + daysFromStart * 33
  const x = 1 + daysFromStart * 33

  // Use REAL DOM coordinates for Y position
  const taskBar = document.querySelector(`[data-task-id="${task.id}"]`) as HTMLElement
  if (!taskBar) return null

  const rect = taskBar.getBoundingClientRect()
  const gridContainer = document.querySelector('.gantt-right-panel') as HTMLElement
  if (!gridContainer) return null

  const gridRect = gridContainer.getBoundingClientRect()
  const y = rect.top - gridRect.top + rect.height / 2

  return { x, y }
}

// Function to get task bar end position - CALCULATED COORDINATES
function getTaskBarEndPosition(task: GanttTask): { x: number; y: number } | null {
  // Use the SAME calculation as getTaskBarStyle!
  const startDate = new Date(task.start + 'T00:00:00.000Z')
  const projectStart = projectRange.value?.startDate || new Date()

  const daysFromStart = Math.floor((startDate.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24))
  const daysDiff = task.duration

  // Use the SAME width calculation as in getTaskBarStyle
  const width = daysDiff * 33 + (daysDiff - 1) * 1 - daysDiff - 2
  const minWidth = 29
  const actualWidth = Math.max(width, minWidth)

  // Right edge = left edge + width
  const x = 1 + daysFromStart * 33 + actualWidth

  // Use REAL DOM coordinates for Y position
  const taskBar = document.querySelector(`[data-task-id="${task.id}"]`) as HTMLElement
  if (!taskBar) return null

  const rect = taskBar.getBoundingClientRect()
  const gridContainer = document.querySelector('.gantt-right-panel') as HTMLElement
  if (!gridContainer) return null

  const gridRect = gridContainer.getBoundingClientRect()
  const y = rect.top - gridRect.top + rect.height / 2

  return { x, y }
}

// Function to create dependency line between two tasks with specific type
function createDependencyLine(fromTaskId: number, toTaskId: number, dependencyType: 'FS' | 'SS' | 'FF' | 'SF' = 'FS') {
  const fromTask = mappedTasks.value.find(t => t.id === fromTaskId)
  const toTask = mappedTasks.value.find(t => t.id === toTaskId)

  if (!fromTask || !toTask) {
    console.log('❌ Tasks not found for dependency line')
    return
  }

  // Get dependency type configuration
  const depConfig = dependencyTypes[dependencyType]
  if (!depConfig) {
    console.log('❌ Unknown dependency type:', dependencyType)
    return
  }

  // Get connection points based on dependency type
  const fromPos = getTaskConnectionPoint(fromTask, depConfig.fromPoint as 'start' | 'end')
  const toPos = getTaskConnectionPoint(toTask, depConfig.toPoint as 'start' | 'end')

  if (!fromPos || !toPos) {
    console.log('❌ Could not calculate task positions')
    return
  }

  // Update SVG offset before creating line
  updateSvgOffset()

  // Get current scroll position
  const scrollLeft = rightPanelRef.value?.scrollLeft || 0

  // Update test dependency line with global SVG offset correction and scroll
  testDependencyLine.value = {
    from: {
      x: fromPos.x - svgOffset.value - scrollLeft,
      y: fromPos.y,
      taskId: fromTaskId
    },
    to: {
      x: toPos.x - svgOffset.value - scrollLeft,
      y: toPos.y,
      taskId: toTaskId
    },
    fromTaskId: fromTaskId,
    toTaskId: toTaskId,
    visible: true,
    path: '', // Will be set below
    type: dependencyType // Store the dependency type
  }

  console.log(`🎯 Created ${dependencyType} dependency:`, fromTask.title, '→', toTask.title)
  console.log('Connection points:', depConfig.fromPoint, '→', depConfig.toPoint)

  // Update the path with simplified line and scroll offset
  const path = getBrokenLinePath(
    { x: fromPos.x - svgOffset.value - scrollLeft, y: fromPos.y },
    { x: toPos.x - svgOffset.value - scrollLeft, y: toPos.y }
  )

  // Store the path for rendering
  testDependencyLine.value.path = path

  // Check if dependency already exists between these tasks
  const existingDependency = constraints.value.find(c =>
    (c.fromTaskId === fromTaskId && c.toTaskId === toTaskId) ||
    (c.fromTaskId === toTaskId && c.toTaskId === fromTaskId)
  )

  if (existingDependency) {
    console.warn(`⚠️ Dependency already exists between tasks ${fromTaskId} and ${toTaskId}`)
    console.warn(`⚠️ Existing: ${existingDependency.type} from ${existingDependency.fromTaskId} to ${existingDependency.toTaskId}`)
    console.warn(`⚠️ Cannot create ${dependencyType} from ${fromTaskId} to ${toTaskId}`)

    // Show user notification
    constraintViolations.value.push({
      id: `duplicate-${Date.now()}`,
      message: `Dependency already exists between these tasks (${existingDependency.type})`,
      timestamp: Date.now()
    })

    // Auto-clear notification after 3 seconds
    setTimeout(() => {
      constraintViolations.value = constraintViolations.value.filter(v => v.id !== `duplicate-${Date.now()}`)
    }, 3000)

    return
  }

  // Create constraint for this dependency with default lag
  const constraintId = `constraint-${fromTaskId}-${toTaskId}-${dependencyType}`
  const existingConstraint = constraints.value.find(c => c.id === constraintId)

  if (!existingConstraint) {
    constraints.value.push({
      id: constraintId,
      fromTaskId: fromTaskId,
      toTaskId: toTaskId,
      type: dependencyType,
      lagDays: 0, // Default no lag
      active: true
    })
    console.log(`🔒 Created constraint: ${dependencyType} from task ${fromTaskId} to task ${toTaskId} with 0 days lag`)

    // Auto-sync dependent task position according to constraint
    console.log(`🔄 Auto-syncing dependent task position according to ${dependencyType} constraint`)
    performCascadeUpdates(fromTaskId, fromTask.start, fromTask.end, false) // Don't save to API during dependency creation
  }

  console.log('🎯 Final dependency line data:', {
    visible: testDependencyLine.value.visible,
    path: testDependencyLine.value.path,
    from: testDependencyLine.value.from,
    to: testDependencyLine.value.to,
    dependencyType
  })

  console.log('=== FROM Task Info ===')
  console.log('Name:', fromTask.title)
  console.log('Task days range:', fromTask.start, '-', fromTask.end)
  console.log('Task X coordinates:', fromPos.x, '-', fromPos.x)
  console.log('Line <path> FROM:', fromPos)

  console.log('=== TO Task Info ===')
  console.log('Name:', toTask.title)
  console.log('Task days range:', toTask.start, '-', toTask.end)
  console.log('Task X coordinates:', toPos.x, '-', toPos.x)
  console.log('Line <path> TO:', toPos)

  console.log('=== SVG INFO ===')
  const svgElementDebug = document.querySelector('.dependency-arrows') as HTMLElement
  if (svgElementDebug) {
    const svgRect = svgElementDebug.getBoundingClientRect()
    const gridContainer = document.querySelector('.gantt-right-panel') as HTMLElement
    if (gridContainer) {
      const gridRect = gridContainer.getBoundingClientRect()
      console.log('SVG position:', svgRect.left - gridRect.left, svgRect.top - gridRect.top)
      console.log('SVG size:', svgRect.width, 'x', svgRect.height)
    }
  }

  console.log('=== CORRECTED COORDINATES ===')
  console.log('SVG offset:', svgOffset.value)
  console.log('FROM corrected:', fromPos.x - svgOffset.value, fromPos.y)
  console.log('TO corrected:', toPos.x - svgOffset.value, toPos.y)

  console.log('=== LINE PATH ===')
  console.log('Line created:', fromTask.title, '→', toTask.title, 'at', fromPos, '→', toPos)
}

// Function to create test dependency line between first two tasks
function createTestDependencyLine(dependencyType: 'FS' | 'SS' | 'FF' | 'SF' = 'FS') {
  if (mappedTasks.value.length < 2) {
    console.log('❌ Need at least 2 tasks to create dependency line')
    return
  }

  const firstTask = mappedTasks.value[0]
  const secondTask = mappedTasks.value[1]

  console.log('🎯 Creating test dependency line between:', firstTask.title, '→', secondTask.title)
  console.log('🎯 First task dates:', firstTask.start, 'to', firstTask.end)
  console.log('🎯 Second task dates:', secondTask.start, 'to', secondTask.end)
  console.log('🎯 Project range:', {
    start: projectRange.value?.startDate.toISOString(),
    end: projectRange.value?.endDate.toISOString(),
    totalDays: projectRange.value?.totalDays
  })

  // Determine which task is earlier (predecessor) and which is later (successor)
  const firstTaskStart = new Date(firstTask.start)
  const secondTaskStart = new Date(secondTask.start)

  let predecessorTask, successorTask
  if (firstTaskStart <= secondTaskStart) {
    predecessorTask = firstTask
    successorTask = secondTask
  } else {
    predecessorTask = secondTask
    successorTask = firstTask
  }

  console.log('🎯 Predecessor (earlier):', predecessorTask.title, '→ Successor (later):', successorTask.title)

  // Create dependency line: predecessor → successor
  createDependencyLine(predecessorTask.id, successorTask.id, dependencyType)
}

// Function to clear test dependency line
function clearTestDependencyLine() {
  testDependencyLine.value.visible = false
  console.log('🧹 Cleared test dependency line')
}

// Function to load real dependencies from API data
function loadRealDependencies() {
  console.log('🔄 Loading real dependencies from tasks...')

  // Clear existing dependencies
  realDependencies.value = []

  // Find all tasks with dependencies
  mappedTasks.value.forEach(task => {
    if (task.dependencies && Array.isArray(task.dependencies) && task.dependencies.length > 0) {
      console.log(`🔗 Task "${task.title}" has dependencies:`, task.dependencies)

      task.dependencies.forEach((dep: number | { predecessor_id: number; type: string; lag_days: number }) => {
        // Handle both old format (just IDs) and new format (objects)
        let predecessorId: number
        let dependencyType: 'FS' | 'SS' | 'FF' | 'SF' = 'FS'
        // let lagDays = 0 // Not used yet

        if (typeof dep === 'number') {
          // Old format: just predecessor ID
          predecessorId = dep
        } else if (typeof dep === 'object' && dep.predecessor_id) {
          // New format: object with predecessor_id, type, lag_days
          predecessorId = dep.predecessor_id
          dependencyType = (dep.type as 'FS' | 'SS' | 'FF' | 'SF') || 'FS'
          // lagDays = dep.lag_days || 0 // Not used yet
        } else {
          console.warn('⚠️ Unknown dependency format:', dep)
          return
        }

        // Find predecessor task
        const predecessorTask = mappedTasks.value.find(t => t.id === predecessorId)
        if (!predecessorTask) {
          console.warn(`⚠️ Predecessor task ${predecessorId} not found for dependency`)
          return
        }

        // Create dependency line
        const dependencyId = `${predecessorId}-${task.id}-${dependencyType}`
        const dependency = {
          id: dependencyId,
          fromTaskId: predecessorId,
          toTaskId: task.id,
          type: dependencyType,
          from: { x: 0, y: 0, taskId: predecessorId },
          to: { x: 0, y: 0, taskId: task.id },
          path: '',
          visible: true
        }

        // Calculate positions
        updateRealDependencyPositions(dependency)

        realDependencies.value.push(dependency)
        console.log(`✅ Created dependency: ${predecessorTask.title} → ${task.title} (${dependencyType})`)
      })
    }
  })

  console.log(`🎯 Loaded ${realDependencies.value.length} real dependencies`)
}

// Function to update real dependencies on scroll
function updateRealDependenciesOnScroll() {
  const scrollLeft = rightPanelRef.value?.scrollLeft || 0

  realDependencies.value.forEach(dependency => {
    const fromTask = mappedTasks.value.find(t => t.id === dependency.fromTaskId)
    const toTask = mappedTasks.value.find(t => t.id === dependency.toTaskId)

    if (!fromTask || !toTask) return

    // Get dependency type configuration
    const depConfig = dependencyTypes[dependency.type as keyof typeof dependencyTypes]
    if (!depConfig) return

    // Get correct connection points based on dependency type
    const fromPos = getTaskConnectionPoint(fromTask, depConfig.fromPoint as 'start' | 'end')
    const toPos = getTaskConnectionPoint(toTask, depConfig.toPoint as 'start' | 'end')

    if (!fromPos || !toPos) return

    // Update SVG offset
    updateSvgOffset()

    // Update positions with scroll offset
    dependency.from = {
      x: fromPos.x - svgOffset.value - scrollLeft,
      y: fromPos.y,
      taskId: dependency.fromTaskId
    }
    dependency.to = {
      x: toPos.x - svgOffset.value - scrollLeft,
      y: toPos.y,
      taskId: dependency.toTaskId
    }

    // Recalculate path with scroll offset
    dependency.path = getBrokenLinePath(
      { x: fromPos.x - svgOffset.value - scrollLeft, y: fromPos.y },
      { x: toPos.x - svgOffset.value - scrollLeft, y: toPos.y }
    )
  })

  console.log('🔄 Updated real dependencies on scroll:', {
    scrollLeft,
    count: realDependencies.value.length
  })
}

// Function to update positions for real dependencies
function updateRealDependencyPositions(dependency: {
  id: string
  fromTaskId: number
  toTaskId: number
  type: 'FS' | 'SS' | 'FF' | 'SF'
  from: { x: number; y: number; taskId: number }
  to: { x: number; y: number; taskId: number }
  path: string
  visible: boolean
}) {
  const fromTask = mappedTasks.value.find(t => t.id === dependency.fromTaskId)
  const toTask = mappedTasks.value.find(t => t.id === dependency.toTaskId)

  if (!fromTask || !toTask) return

  // Get dependency type configuration
  const depConfig = dependencyTypes[dependency.type as keyof typeof dependencyTypes]
  if (!depConfig) return

  // Get connection points based on dependency type
  const fromPos = getTaskConnectionPoint(fromTask, depConfig.fromPoint as 'start' | 'end')
  const toPos = getTaskConnectionPoint(toTask, depConfig.toPoint as 'start' | 'end')

  if (!fromPos || !toPos) return

  // Update SVG offset
  updateSvgOffset()

  // Update positions
  dependency.from = {
    x: fromPos.x - svgOffset.value,
    y: fromPos.y,
    taskId: dependency.fromTaskId
  }
  dependency.to = {
    x: toPos.x - svgOffset.value,
    y: toPos.y,
    taskId: dependency.toTaskId
  }

  // Update path
  dependency.path = getBrokenLinePath(
    { x: fromPos.x - svgOffset.value, y: fromPos.y },
    { x: toPos.x - svgOffset.value, y: toPos.y }
  )
}

// Function to update dependency line positions (cascade update)
function updateDependencyLinePositions() {
  if (!testDependencyLine.value.visible) return

  const fromTask = mappedTasks.value.find(t => t.id === testDependencyLine.value.fromTaskId)
  const toTask = mappedTasks.value.find(t => t.id === testDependencyLine.value.toTaskId)

  if (!fromTask || !toTask) return

  // Update SVG offset before updating positions
  updateSvgOffset()

  // Get current scroll position
  const scrollLeft = rightPanelRef.value?.scrollLeft || 0

  // Use the stored dependency type from the line
  const dependencyType = testDependencyLine.value.type

  // Get dependency type configuration
  const depConfig = dependencyTypes[dependencyType]
  if (!depConfig) return

  // Get current positions from DOM (real-time coordinates) using the SAME connection points
  const fromPos = getTaskConnectionPoint(fromTask, depConfig.fromPoint as 'start' | 'end')
  const toPos = getTaskConnectionPoint(toTask, depConfig.toPoint as 'start' | 'end')

  if (!fromPos || !toPos) return

  // Update line positions with global SVG offset correction and scroll
  testDependencyLine.value.from = {
    x: fromPos.x - svgOffset.value - scrollLeft,
    y: fromPos.y,
    taskId: fromTask.id
  }
  testDependencyLine.value.to = {
    x: toPos.x - svgOffset.value - scrollLeft,
    y: toPos.y,
    taskId: toTask.id
  }

  // Update the path with new positions using simplified logic and scroll
  const path = getBrokenLinePath(
    { x: fromPos.x - svgOffset.value - scrollLeft, y: fromPos.y },
    { x: toPos.x - svgOffset.value - scrollLeft, y: toPos.y }
  )

  testDependencyLine.value.path = path

  console.log('🔄 Line updated with new path:', {
    fromPos,
    toPos,
    svgOffset: svgOffset.value,
    scrollLeft,
    path,
    dependencyType,
    fromPoint: depConfig.fromPoint,
    toPoint: depConfig.toPoint
  })
}

// Watch for changes that should update dependency lines
watch([mappedTasks], () => {
  if (testDependencyLine.value.visible) {
    console.log('🔄 Tasks changed, updating line')
    updateDependencyLinePositions()
  }

  // Load real dependencies when tasks change
  loadRealDependencies()
}, { deep: true })

// Debounced resize handler
let resizeTimeout: number | null = null

// Watch for window resize to update dependency lines
window.addEventListener('resize', () => {
  // Clear previous timeout
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }

  // Debounce resize events
  resizeTimeout = setTimeout(() => {
    // Update SVG offset first
    updateSvgOffset()

    if (testDependencyLine.value.visible) {
      console.log('🔄 Window resized, updating dependency line')
      updateDependencyLinePositions()
    }

    // Update real dependencies on window resize
    if (realDependencies.value.length > 0) {
      console.log('🔄 Window resized, updating real dependencies')
      realDependencies.value.forEach(dependency => {
        updateRealDependencyPositions(dependency)
      })
    }
  }, 100) // 100ms debounce
})

// Scroll synchronization between left and right panels
const leftPanelRef = ref<HTMLElement>()
const rightPanelRef = ref<HTMLElement>()

// Watch for scroll events to update dependency lines
watch(() => rightPanelRef.value?.scrollLeft, () => {
  if (testDependencyLine.value.visible) {
    console.log('🔄 Panel scrolled, updating dependency line')
    updateDependencyLinePositions()
  }

  // Update real dependencies on scroll
  if (realDependencies.value.length > 0) {
    console.log('🔄 Panel scrolled, updating real dependencies')
    updateRealDependenciesOnScroll()
  }
})

// Handle scroll events to update dependency line positions
function handleDependencyLineScroll() {
  if (testDependencyLine.value.visible) {
    // Get current scroll position
    const scrollLeft = rightPanelRef.value?.scrollLeft || 0
    console.log('🔄 Scrolling dependency line, scrollLeft:', scrollLeft)

    // Update line positions with scroll offset
    updateDependencyLineWithScroll(scrollLeft)
  }
}

// Function to update dependency line with scroll offset
function updateDependencyLineWithScroll(scrollLeft: number) {
  if (!testDependencyLine.value.visible) return

  const fromTask = mappedTasks.value.find(t => t.id === testDependencyLine.value.fromTaskId)
  const toTask = mappedTasks.value.find(t => t.id === testDependencyLine.value.toTaskId)

  if (!fromTask || !toTask) return

  // Use the stored dependency type to get correct connection points
  const dependencyType = testDependencyLine.value.type
  const depConfig = dependencyTypes[dependencyType]
  if (!depConfig) return

  // Get correct connection points based on dependency type
  const fromPos = getTaskConnectionPoint(fromTask, depConfig.fromPoint as 'start' | 'end')
  const toPos = getTaskConnectionPoint(toTask, depConfig.toPoint as 'start' | 'end')

  if (!fromPos || !toPos) return

  // Update SVG offset
  updateSvgOffset()

  // Apply scroll offset to X coordinates
  testDependencyLine.value = {
    from: {
      x: fromPos.x - svgOffset.value - scrollLeft,
      y: fromPos.y,
      taskId: testDependencyLine.value.fromTaskId
    },
    to: {
      x: toPos.x - svgOffset.value - scrollLeft,
      y: toPos.y,
      taskId: testDependencyLine.value.toTaskId
    },
    fromTaskId: testDependencyLine.value.fromTaskId,
    toTaskId: testDependencyLine.value.toTaskId,
    visible: true,
    path: '', // Will be recalculated
    type: testDependencyLine.value.type
  }

  // Recalculate path with scroll offset
  const path = getBrokenLinePath(
    { x: fromPos.x - svgOffset.value - scrollLeft, y: fromPos.y },
    { x: toPos.x - svgOffset.value - scrollLeft, y: toPos.y }
  )

  testDependencyLine.value.path = path

  console.log('🔄 Updated line with scroll offset:', {
    fromX: fromPos.x,
    toX: toPos.x,
    scrollLeft,
    svgOffset: svgOffset.value,
    dependencyType,
    fromPoint: depConfig.fromPoint,
    toPoint: depConfig.toPoint
  })
}

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
  console.log(`🖱️ handleMouseUp called: isDragging=${isDragging.value}, dragStartTask=${dragStartTask.value?.title}, dragOffset=${dragOffset.value}`)

  if (!isDragging.value || !dragStartTask.value) {
    console.log(`🖱️ Not dragging or no task - cleaning up`)
    // Clean up if not dragging
    cleanupDrag()
    return
  }

  // Process drag if there was movement
  console.log(`🖱️ Checking movement: |${dragOffset.value}| > 5 = ${Math.abs(dragOffset.value) > 5}`)
  if (Math.abs(dragOffset.value) > 5) { // Only process if moved more than 5px
    console.log(`🖱️ Processing drag for task: ${dragStartTask.value.title}`)
    const task = dragStartTask.value
    const originalStart = new Date(originalTaskStart.value)
    const originalEnd = new Date(originalTaskEnd.value)

    // Calculate new position
    const dayIndex = Math.floor(dragOffset.value / 33) // 33px per day
    console.log(`🖱️ Calculated dayIndex: ${dayIndex} from dragOffset: ${dragOffset.value}`)

    const newStart = new Date(originalStart)
    newStart.setDate(newStart.getDate() + dayIndex)

    const newEnd = new Date(originalEnd)
    newEnd.setDate(newEnd.getDate() + dayIndex)

    console.log(`🖱️ Original dates: ${originalStart.toISOString().split('T')[0]} - ${originalEnd.toISOString().split('T')[0]}`)
    console.log(`🖱️ New dates: ${newStart.toISOString().split('T')[0]} - ${newEnd.toISOString().split('T')[0]}`)

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

    console.log(`🖱️ After boundary checks: ${newStart.toISOString().split('T')[0]} - ${newEnd.toISOString().split('T')[0]}`)

    // Check constraints before allowing movement
    console.log(`🔒 Checking constraints for task ${task.id} (${task.title})`)
    console.log(`🔒 Proposed dates: ${newStart.toISOString().split('T')[0]} - ${newEnd.toISOString().split('T')[0]}`)
    console.log(`🔒 Active constraints: ${constraints.value.filter(c => c.active).length}`)

    const constraintCheck = checkTaskConstraints(
      task.id,
      newStart.toISOString().split('T')[0],
      newEnd.toISOString().split('T')[0]
    )

    if (!constraintCheck.canMove) {
      console.warn('🔒 Cannot move task - violates constraints:', constraintCheck.violations)

      // Add constraint violations to notifications
      constraintCheck.violations.forEach(violation => {
        constraintViolations.value.push({
          id: `violation-${Date.now()}-${Math.random()}`,
          message: violation.message,
          suggestedStart: violation.suggestedStart,
          suggestedEnd: violation.suggestedEnd,
          timestamp: Date.now()
        })
      })

      // Auto-clear violations after 5 seconds
      setTimeout(() => {
        constraintViolations.value = []
      }, 5000)

      // Reset to original position
      cleanupDrag()
      return
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

      // Update dependency line if it's connected to this task (cascade update)
      if (testDependencyLine.value.visible &&
          (testDependencyLine.value.fromTaskId === task.id || testDependencyLine.value.toTaskId === task.id)) {
        console.log('🔄 Updating dependency line after task move')
        updateDependencyLinePositions()
      }

      // Save changes to API
      saveTaskChanges(String(task.id), newStart.toISOString().split('T')[0], newEnd.toISOString().split('T')[0])

      // Perform cascade updates for dependent tasks
      performCascadeUpdates(task.id, newStart.toISOString().split('T')[0], newEnd.toISOString().split('T')[0])
    } else {
      console.log(`🔒 Constraint violated - not performing cascade updates`)
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

        // Update dependency line if it's connected to this task (cascade update)
        if (testDependencyLine.value.visible &&
            (testDependencyLine.value.fromTaskId === resizeStartTask.value.id || testDependencyLine.value.toTaskId === resizeStartTask.value.id)) {
          console.log('🔄 Updating dependency line after task resize')
          updateDependencyLinePositions()
        }
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

// Scroll synchronization between left and right panels (refs declared above)

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

    // Update dependency line if it's connected to reordered tasks
    if (testDependencyLine.value.visible &&
        (testDependencyLine.value.fromTaskId === draggedTask.value.id || testDependencyLine.value.toTaskId === draggedTask.value.id)) {
      console.log('🔄 Updating dependency line after task reorder')
      updateDependencyLinePositions()
    }

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

    console.log('🖱️ Drag & Drop: Saving task changes via PUT /api/v1/projects/{project_id}/tasks/{task_id}', {
      projectId: props.projectId,
      taskId,
      payload: updatePayload,
      start_planned: newStart,
      end_planned: newEnd,
    })

    const updatedTask = await tasksApi.update(props.projectId, taskId, updatePayload)
    console.log('✅ Drag & Drop: Task saved successfully:', updatedTask)

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
  position: relative;
  z-index: 20; /* Above everything */
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
  position: relative;
  z-index: 15; /* Above dependency arrows */
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
  color: #374151; /* Dark gray text */
}

.gantt-task-cell span {
  color: #374151; /* Dark gray text for task titles */
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
  z-index: 10; /* Above dependency arrows */
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
  z-index: 1; /* Under task list */
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

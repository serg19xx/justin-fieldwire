<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
    @click.self="!isCreating && closeDialog()"
  >
    <div
      class="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
        <div>
          <h2 class="text-lg sm:text-xl font-semibold text-gray-900">Create Tasks from Templates</h2>
          <p class="text-sm text-gray-500 mt-1">
            {{ selectedTemplates.length }} template{{ selectedTemplates.length !== 1 ? 's' : '' }} selected
          </p>
        </div>
        <button
          @click="closeDialog"
          :disabled="isCreating"
          class="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-6">
        <!-- Configuration Section -->
        <div class="mb-6 space-y-4">
          <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Configuration</h3>

          <!-- Project Start Date -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Project Start Date <span class="text-red-500">*</span>
            </label>
            <input
              v-model="projectStartDate"
              type="date"
              required
              :class="[
                'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900',
                !projectStartDate
                  ? 'border-red-500 focus:ring-red-500 bg-red-50'
                  : 'border-gray-300 focus:ring-blue-500'
              ]"
            />
            <p v-if="!projectStartDate" class="mt-1 text-xs text-red-600 flex items-center gap-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              This field is required
            </p>
            <p v-else class="mt-1 text-xs text-gray-500">
              All task dates will be calculated relative to this date
            </p>
          </div>

          <p
            v-if="autoFilledCount > 0"
            class="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900"
          >
            {{ autoFilledCount }} template{{ autoFilledCount !== 1 ? 's' : '' }} had no schedule in the
            library — all start on the project date (1 day each). Adjust on the calendar anytime.
          </p>

          <!-- Default Foreman -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Default Foreman / Brigadier <span class="text-gray-400">(optional)</span>
            </label>
            <select
              v-model="defaultTaskLeadId"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              :class="{ 'text-gray-500': !defaultTaskLeadId }"
            >
              <option :value="null" class="text-gray-500">None (assign later)</option>
              <option
                v-for="person in availablePeople"
                :key="person.id"
                :value="person.id"
                class="text-gray-900"
              >
                {{ person.name }} ({{ person.role }})
              </option>
            </select>
            <p class="mt-1 text-xs text-gray-500">
              This foreman will be assigned to all created tasks (can be changed individually below)
            </p>
          </div>
        </div>

        <!-- Tasks Preview -->
        <div>
          <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Tasks Preview ({{ selectedTemplates.length }})
          </h3>

          <div class="space-y-3">
            <div
              v-for="(selectedTemplate, index) in taskConfigs"
              :key="selectedTemplate.template.id"
              class="p-4 border border-gray-200 rounded-lg transition-colors hover:border-gray-300"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="text-sm font-medium text-gray-500">#{{ index + 1 }}</span>
                    <h4 class="font-medium text-gray-900">{{ selectedTemplate.template.name }}</h4>
                    <span
                      v-if="selectedTemplate.template.category"
                      class="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                    >
                      {{ selectedTemplate.template.category }}
                    </span>
                    <span
                      v-if="selectedTemplate.template.milestone"
                      class="px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded font-medium"
                    >
                      Milestone
                    </span>
                  </div>

                  <!-- Task Details -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <!-- Start Date Override -->
                    <div>
                      <label class="block text-xs font-medium text-gray-600 mb-1">Start Date Offset</label>
                      <div class="flex items-center gap-2">
                        <input
                          v-model.number="selectedTemplate.start_offset_days"
                          type="number"
                          min="0"
                          class="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        />
                        <span class="text-xs text-gray-500 whitespace-nowrap">days</span>
                      </div>
                      <p v-if="calculatedStartDate(selectedTemplate)" class="text-xs text-gray-500 mt-1">
                        → {{ formatDate(calculatedStartDate(selectedTemplate)!) }}
                      </p>
                    </div>

                    <!-- Duration Override -->
                    <div>
                      <label class="block text-xs font-medium text-gray-600 mb-1">Duration</label>
                      <div class="flex items-center gap-2">
                        <input
                          v-model.number="selectedTemplate.duration_days"
                          type="number"
                          min="1"
                          class="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        />
                        <span class="text-xs text-gray-500 whitespace-nowrap">days</span>
                      </div>
                      <p v-if="calculatedEndDate(selectedTemplate)" class="text-xs text-gray-500 mt-1">
                        → {{ formatDate(calculatedEndDate(selectedTemplate)!) }}
                      </p>
                    </div>

                    <!-- Foreman Override -->
                    <div class="md:col-span-2">
                      <label class="block text-xs font-medium text-gray-600 mb-1">
                        Foreman / Brigadier
                      </label>
                      <select
                        v-model="selectedTemplate.task_lead_id"
                        class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        :class="{ 'text-gray-500': !selectedTemplate.task_lead_id }"
                      >
                        <option :value="null" class="text-gray-500">
                          {{ defaultTaskLeadId ? 'Use default' : 'None' }}
                        </option>
                        <option
                          v-for="person in availablePeople"
                          :key="person.id"
                          :value="person.id"
                          class="text-gray-900"
                        >
                          {{ person.name }} ({{ person.role }})
                        </option>
                      </select>
                    </div>
                  </div>

                  <!-- Notes -->
                  <div v-if="selectedTemplate.template.notes" class="mt-2">
                    <p class="text-xs text-gray-500 italic">{{ selectedTemplate.template.notes }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Creating overlay -->
      <div
        v-if="isCreating"
        class="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-[1px]"
      >
        <div class="mx-4 w-full max-w-sm rounded-lg border border-gray-200 bg-white px-6 py-5 shadow-lg text-center">
          <div
            class="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-[3px] border-blue-200 border-t-blue-600"
            role="status"
            aria-label="Creating tasks"
          />
          <p class="text-sm font-semibold text-gray-900">Creating tasks…</p>
          <p class="mt-1 text-sm text-gray-600">
            {{ createProgressCurrent }} / {{ createProgressTotal }}
          </p>
          <div class="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              class="h-full rounded-full bg-blue-600 transition-all duration-300"
              :style="{ width: `${createProgressPercent}%` }"
            />
          </div>
          <p class="mt-2 text-xs text-gray-500">Please keep this window open</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="border-t border-gray-200 flex-shrink-0 bg-gray-50">
        <!-- Validation Errors Section -->
        <div v-if="validationErrors.length > 0" class="px-4 sm:px-6 pt-4 pb-2 border-b border-red-200 bg-red-50">
          <div class="flex items-center gap-2 mb-2">
            <svg class="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span class="text-sm font-semibold text-red-800">
              {{ validationErrors.length }} error{{ validationErrors.length !== 1 ? 's' : '' }} to fix:
            </span>
          </div>
          <ul class="list-disc list-inside space-y-1 text-sm text-red-700 ml-7">
            <li v-for="(error, index) in validationErrors" :key="index">
              {{ error }}
            </li>
          </ul>
        </div>

        <!-- Footer Actions -->
        <div class="flex items-center justify-between p-4 sm:p-6">
          <div class="text-sm text-gray-600">
            <span v-if="isCreating" class="text-blue-700">
              Creating {{ createProgressCurrent }} / {{ createProgressTotal }}…
            </span>
            <span v-else-if="validationErrors.length > 0" class="text-red-600">
              Please fix the errors above
            </span>
            <span v-else class="text-green-600">Ready to create {{ selectedTemplates.length }} tasks</span>
          </div>
          <div class="flex gap-3">
            <button
              @click="closeDialog"
              :disabled="isCreating"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              @click="handleCreateTasks"
              :disabled="isCreating || validationErrors.length > 0 || !projectStartDate"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              <span
                v-if="isCreating"
                class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              />
              <span v-if="isCreating">Creating {{ createProgressCurrent }} / {{ createProgressTotal }}</span>
              <span v-else>Create {{ selectedTemplates.length }} Tasks</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { tasksApi } from '@/core/utils/tasks-api'
import { templateToTaskData } from '@/core/utils/task-templates-api'
import { isMilestone, type SelectedTemplate, type TaskTemplate } from '@/core/types/task'

interface Props {
  isOpen: boolean
  projectId: number
  selectedTemplates: TaskTemplate[]
  projectStartDate?: string
  availablePeople?: Array<{ id: number; name: string; role: string }>
}

interface Emits {
  (e: 'close'): void
  (e: 'tasks-created', tasks: unknown[]): void
}

const props = withDefaults(defineProps<Props>(), {
  projectStartDate: '',
  availablePeople: () => [],
})

const emit = defineEmits<Emits>()

const projectStartDate = ref(props.projectStartDate || getTodayIsoDate())
const defaultTaskLeadId = ref<number | null>(null)
const taskConfigs = ref<SelectedTemplate[]>([])
const isCreating = ref(false)
const createProgressCurrent = ref(0)
const createProgressTotal = ref(0)

const createProgressPercent = computed(() => {
  if (createProgressTotal.value === 0) return 0
  return Math.round((createProgressCurrent.value / createProgressTotal.value) * 100)
})

function getTodayIsoDate(): string {
  return new Date().toISOString().split('T')[0]
}

function resolveDurationDays(config: SelectedTemplate): number {
  if (isMilestone(config.template.milestone)) return 1
  const value = config.duration_days ?? config.template.duration_days
  return value && value > 0 ? value : 1
}

function templateNeedsAutoSchedule(template: TaskTemplate): boolean {
  return (
    (template.start_offset_days === null || template.start_offset_days === undefined) &&
    (template.duration_days === null || template.duration_days === undefined)
  )
}

function applyAutoScheduleDefaults(configs: SelectedTemplate[]): SelectedTemplate[] {
  return configs.map((item) => {
    const template = item.template
    const hasTemplateOffset =
      template.start_offset_days !== null && template.start_offset_days !== undefined
    const hasConfigOffset =
      item.start_offset_days !== null && item.start_offset_days !== undefined

    const offset = hasConfigOffset
      ? item.start_offset_days!
      : hasTemplateOffset
        ? template.start_offset_days!
        : 0

    const duration = resolveDurationDays({
      ...item,
      start_offset_days: offset,
      duration_days: item.duration_days ?? template.duration_days ?? null,
    })

    return {
      ...item,
      start_offset_days: offset,
      duration_days: duration,
    }
  })
}

function initializeTaskConfigs() {
  const baseConfigs = props.selectedTemplates.map((template) => ({
    template,
    selected: true,
    start_offset_days: template.start_offset_days ?? null,
    duration_days: template.duration_days ?? null,
    task_lead_id: null,
  }))

  taskConfigs.value = applyAutoScheduleDefaults(baseConfigs)
}

const autoFilledCount = computed(
  () => taskConfigs.value.filter((config) => templateNeedsAutoSchedule(config.template)).length,
)

// Watch for changes in selected templates
watch(
  () => props.selectedTemplates,
  () => {
    initializeTaskConfigs()
  },
  { immediate: true },
)

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      projectStartDate.value = props.projectStartDate || getTodayIsoDate()
      createProgressCurrent.value = 0
      createProgressTotal.value = 0
      initializeTaskConfigs()
    }
  },
)

// Watch for project start date changes
watch(
  () => props.projectStartDate,
  (newDate) => {
    if (newDate) {
      projectStartDate.value = newDate
    }
  },
  { immediate: true },
)

const validationErrors = computed(() => {
  if (!projectStartDate.value) {
    return ['Project start date is required']
  }
  return []
})

function calculatedStartDate(config: SelectedTemplate): string | null {
  if (!projectStartDate.value) return null
  const offset = config.start_offset_days
  if (offset === null || offset === undefined) return projectStartDate.value

  const date = new Date(projectStartDate.value)
  date.setDate(date.getDate() + offset)
  return date.toISOString().split('T')[0]
}

function calculatedEndDate(config: SelectedTemplate): string | null {
  const startDate = calculatedStartDate(config)
  if (!startDate) return null

  const duration = resolveDurationDays(config)
  const date = new Date(startDate)
  date.setDate(date.getDate() + duration - 1)
  return date.toISOString().split('T')[0]
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Create tasks
async function handleCreateTasks() {
  if (validationErrors.value.length > 0 || !projectStartDate.value) {
    return
  }

  isCreating.value = true
  createProgressCurrent.value = 0
  createProgressTotal.value = taskConfigs.value.length

  try {
    const createdTasks = []

    for (const [index, config] of taskConfigs.value.entries()) {
      const taskData = templateToTaskData(config.template, props.projectId, projectStartDate.value, {
        start_offset_days: config.start_offset_days,
        duration_days: config.duration_days,
        task_lead_id: config.task_lead_id ?? defaultTaskLeadId.value ?? undefined,
      })

      const task = await tasksApi.create(props.projectId, taskData)
      createdTasks.push(task)
      createProgressCurrent.value = index + 1
    }

    emit('tasks-created', createdTasks)
    closeDialog()
  } catch (error) {
    console.error('Error creating tasks:', error)
    alert('Failed to create some tasks. Please check the console for details.')
  } finally {
    isCreating.value = false
  }
}

function closeDialog() {
  if (isCreating.value) return
  emit('close')
}

onMounted(() => {
  initializeTaskConfigs()
})
</script>

<style scoped>
/* Additional styles if needed */
</style>


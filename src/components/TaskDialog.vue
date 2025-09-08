<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click="closeDialog"
  >
    <div
      class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      @click.stop
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 class="text-xl font-semibold text-gray-900">
          {{
            mode === 'create' ? 'Create New Task' : mode === 'edit' ? 'Edit Task' : 'Task Details'
          }}
        </h2>
        <button @click="closeDialog" class="text-gray-400 hover:text-gray-600 transition-colors">
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
      <div class="p-6">
        <form @submit.prevent="handleSubmit">
          <!-- Task Name -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2"> Task Name * </label>
            <input
              v-model="form.name"
              :disabled="mode === 'view'"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              placeholder="Enter task name"
            />
          </div>

          <!-- WBS Path and Project Lead Row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                WBS Path <span class="text-gray-400">(optional)</span>
              </label>
              <input
                v-model="form.wbs_path"
                :disabled="mode === 'view'"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                placeholder="e.g., 1.1.1"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Project Lead <span class="text-red-400">*</span>
              </label>
              <select
                v-model="form.project_lead"
                :disabled="mode === 'view'"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              >
                <option value="">Select responsible person</option>
                <option v-for="person in availablePeople" :key="person.id" :value="person.id">
                  {{ person.name }} ({{ person.role }})
                </option>
              </select>
            </div>
          </div>

          <!-- Dates Row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"> Start Date * </label>
              <input
                v-model="form.start_planned"
                :disabled="mode === 'view'"
                type="date"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"> End Date </label>
              <input
                v-model="form.end_planned"
                :disabled="mode === 'view'"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>
          </div>

          <!-- Duration and Progress Row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Duration (Days) <span class="text-gray-400">(auto-calculated)</span>
              </label>
              <input
                :value="computedDuration"
                disabled
                type="number"
                class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"> Progress (%) </label>
              <input
                v-model.number="form.progress_pct"
                :disabled="mode === 'view'"
                type="number"
                min="0"
                max="100"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>
          </div>

          <!-- Status and Milestone Row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"> Status </label>
              <select
                v-model="form.status"
                :disabled="mode === 'view'"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              >
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
                <option value="blocked">Blocked</option>
                <option value="delayed">Delayed</option>
              </select>
            </div>
            <div class="flex items-end">
              <label class="flex items-center space-x-2">
                <input
                  v-model="form.milestone"
                  :disabled="mode === 'view'"
                  type="checkbox"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                />
                <span class="text-sm font-medium text-gray-700">Milestone</span>
              </label>
            </div>
          </div>

          <!-- Dependencies -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Dependencies
              <span class="text-gray-400">(tasks that must finish before this task)</span>
            </label>
            <div class="space-y-2">
              <div
                v-for="(dep, index) in form.dependencies"
                :key="index"
                class="flex items-center space-x-2 p-2 bg-gray-50 rounded-md"
              >
                <select
                  v-model="dep.taskId"
                  :disabled="mode === 'view'"
                  class="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Select predecessor task</option>
                  <option v-for="task in availableTasks || []" :key="task.id" :value="task.id">
                    {{ task.name }} ({{ task.wbs_path || 'No WBS' }})
                  </option>
                </select>
                <select
                  v-model="dep.type"
                  :disabled="mode === 'view'"
                  class="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="FS">Finish-to-Start</option>
                  <option value="SS">Start-to-Start</option>
                  <option value="FF">Finish-to-Finish</option>
                  <option value="SF">Start-to-Finish</option>
                </select>
                <input
                  v-model.number="dep.lagDays"
                  :disabled="mode === 'view'"
                  type="number"
                  min="0"
                  placeholder="Lag"
                  class="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
                <span class="text-xs text-gray-500">days</span>
                <button
                  v-if="mode !== 'view'"
                  @click="removeDependency(index)"
                  type="button"
                  class="p-1 text-red-500 hover:text-red-700"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                </button>
              </div>
              <button
                v-if="mode !== 'view'"
                @click="addDependency"
                type="button"
                class="w-full px-3 py-2 border border-dashed border-gray-300 text-gray-600 rounded-md hover:border-gray-400 hover:text-gray-800 transition-colors text-sm"
              >
                + Add Dependency
              </button>
            </div>
          </div>

          <!-- Resources -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Resources <span class="text-gray-400">(equipment, materials)</span>
            </label>
            <div class="space-y-2">
              <div
                v-for="(resource, index) in form.resources"
                :key="index"
                class="flex items-center space-x-2"
              >
                <input
                  v-model="form.resources[index]"
                  :disabled="mode === 'view'"
                  type="text"
                  placeholder="e.g., excavator_1, concrete_mixer, crane_2"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 text-sm"
                />
                <button
                  v-if="mode !== 'view'"
                  @click="removeResource(index)"
                  type="button"
                  class="p-2 text-red-500 hover:text-red-700"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                </button>
              </div>
              <button
                v-if="mode !== 'view'"
                @click="addResource"
                type="button"
                class="w-full px-3 py-2 border border-dashed border-gray-300 text-gray-600 rounded-md hover:border-gray-400 hover:text-gray-800 transition-colors text-sm"
              >
                + Add Resource
              </button>
            </div>
          </div>

          <!-- Team Members (Working Team) -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Team Members <span class="text-gray-400">(people working on this task)</span>
            </label>
            <div class="space-y-2">
              <div
                v-for="(member, index) in form.team_members"
                :key="index"
                class="flex items-center space-x-2"
              >
                <select
                  v-model="form.team_members[index]"
                  :disabled="mode === 'view'"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 text-sm"
                >
                  <option value="">Select team member</option>
                  <option v-for="person in availablePeople" :key="person.id" :value="person.id">
                    {{ person.name }} ({{ person.role }})
                  </option>
                </select>
                <button
                  v-if="mode !== 'view'"
                  @click="removeTeamMember(index)"
                  type="button"
                  class="p-2 text-red-500 hover:text-red-700"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                </button>
              </div>
              <button
                v-if="mode !== 'view'"
                @click="addTeamMember"
                type="button"
                class="w-full px-3 py-2 border border-dashed border-gray-300 text-gray-600 rounded-md hover:border-gray-400 hover:text-gray-800 transition-colors text-sm"
              >
                + Add Team Member
              </button>
            </div>
          </div>

          <!-- Notes -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2"> Notes </label>
            <textarea
              v-model="form.notes"
              :disabled="mode === 'view'"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              placeholder="Task description and notes"
            ></textarea>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <button
                v-if="mode === 'edit'"
                @click="handleDuplicate"
                type="button"
                class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                📋 Duplicate
              </button>
              <button
                v-if="mode === 'edit'"
                @click="handleDelete"
                type="button"
                class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
              >
                🗑️ Delete
              </button>
            </div>

            <div class="flex items-center space-x-2">
              <button
                @click="closeDialog"
                type="button"
                class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                v-if="mode !== 'view'"
                type="submit"
                :disabled="!form.name || !form.start_planned"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {{ mode === 'create' ? 'Create Task' : 'Save Changes' }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Task, TaskStatus } from '@/types/task'

// Props
interface Props {
  isOpen: boolean
  mode: 'create' | 'edit' | 'view'
  task?: Task | null
  projectId: number
  availableTasks?: Task[]
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  mode: 'create',
  task: null,
})

// Emits
const emit = defineEmits<{
  close: []
  save: [task: Partial<Task>]
  delete: [taskId: string]
  duplicate: [task: Task]
}>()

// Form data
const form = ref({
  name: '',
  wbs_path: '',
  start_planned: '',
  end_planned: '',
  duration_days: 1,
  milestone: false,
  status: 'planned' as TaskStatus,
  progress_pct: 0,
  notes: '',
  dependencies: [] as Array<{ taskId: string; type: string; lagDays: number }>,
  resources: [] as string[],
  project_lead: null as number | null,
  team_members: [] as number[],
})

// Available data for dropdowns
const availablePeople = ref<Array<{ id: number; name: string; role: string }>>([
  { id: 47, name: 'Mike Davis', role: 'Project Manager' },
  { id: 23, name: 'John Smith', role: 'Foreman' },
  { id: 15, name: 'Sarah Johnson', role: 'Electrician' },
  { id: 8, name: 'Safety Team', role: 'Inspector' },
  { id: 52, name: 'Unknown User', role: 'Worker' }, // Add missing user
])

// Computed duration
const computedDuration = computed(() => {
  if (form.value.start_planned && form.value.end_planned) {
    const startDate = new Date(form.value.start_planned)
    const endDate = new Date(form.value.end_planned)
    const diffTime = endDate.getTime() - startDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays > 0 ? diffDays : 1
  }
  return form.value.duration_days || 1
})

// Reset form when dialog opens/closes or task changes
watch(
  [() => props.isOpen, () => props.task, () => props.mode],
  () => {
    if (props.isOpen) {
      resetForm()
    }
  },
  { immediate: true },
)

// Duration is now computed automatically from dates

function resetForm() {
  if (props.task && (props.mode === 'edit' || props.mode === 'view')) {
    // Populate form with existing task data
    console.log('🔧 Loading task data:', props.task)
    console.log('🔧 Task lead ID:', props.task.task_lead_id)
    console.log('🔧 Legacy assignees:', props.task.assignees)
    console.log(
      '🔧 Available people:',
      availablePeople.value.map((p) => ({ id: p.id, name: p.name })),
    )

    // Add missing users to the list if they don't exist
    const leadId =
      props.task.task_lead_id ||
      (props.task.assignees && props.task.assignees.length > 0 ? props.task.assignees[0] : null)

    console.log('🔧 Calculated lead ID:', leadId, 'type:', typeof leadId)

    if (leadId) {
      const existingPerson = availablePeople.value.find(
        (p) => p.id === leadId || String(p.id) === String(leadId),
      )
      console.log('🔧 Found existing person:', existingPerson)

      if (!existingPerson) {
        console.log('🔧 Adding missing user to list:', leadId)
        availablePeople.value.push({ id: Number(leadId), name: `User ${leadId}`, role: 'Worker' })
        console.log(
          '🔧 Updated people list:',
          availablePeople.value.map((p) => ({ id: p.id, name: p.name })),
        )
      }
    }

    form.value = {
      name: props.task.name,
      wbs_path: props.task.wbs_path || '',
      start_planned: props.task.start_planned,
      end_planned: props.task.end_planned || '',
      duration_days: props.task.duration_days || 1,
      milestone: props.task.milestone,
      status: props.task.status,
      progress_pct: props.task.progress_pct,
      notes: props.task.notes || '',
      dependencies: (props.task.dependencies || []).map((dep) => {
        if (typeof dep === 'number') {
          // Old format - just ID
          return {
            taskId: String(dep),
            type: 'FS',
            lagDays: 0,
          }
        } else {
          // New format - full dependency object
          return {
            taskId: String(dep.predecessor_id),
            type: dep.type,
            lagDays: dep.lag_days || 0,
          }
        }
      }),
      resources: [...(props.task.resources || [])],
      project_lead:
        props.task.task_lead_id ||
        (props.task.assignees && props.task.assignees.length > 0 ? props.task.assignees[0] : null),
      team_members: [...(props.task.team_members || props.task.assignees?.slice(1) || [])],
    }
  } else {
    // Reset to default values for create mode
    form.value = {
      name: '',
      wbs_path: '',
      start_planned: new Date().toISOString().split('T')[0], // Today's date
      end_planned: '',
      duration_days: 1,
      milestone: false,
      status: 'planned',
      progress_pct: 0,
      notes: '',
      dependencies: [],
      resources: [],
      project_lead: null,
      team_members: [],
    }
  }
}

// Dependency management
function addDependency() {
  form.value.dependencies.push({
    taskId: '',
    type: 'FS',
    lagDays: 0,
  })
}

function removeDependency(index: number) {
  form.value.dependencies.splice(index, 1)
}

// Resource management
function addResource() {
  form.value.resources.push('')
}

function removeResource(index: number) {
  form.value.resources.splice(index, 1)
}

// Team member management
function addTeamMember() {
  form.value.team_members.push(0)
}

function removeTeamMember(index: number) {
  form.value.team_members.splice(index, 1)
}

function closeDialog() {
  emit('close')
}

function handleSubmit() {
  console.log('💾 Submitting task form:', form.value)

  const taskData: Partial<Task> = {
    ...form.value,
    project_id: props.projectId,
    // Convert empty strings to null/undefined
    end_planned: form.value.end_planned || undefined,
    wbs_path: form.value.wbs_path || undefined,
    notes: form.value.notes || undefined,
    // Duration is calculated on frontend only, not stored in DB
    // Process dependencies - convert to full dependency objects
    dependencies: form.value.dependencies
      .filter((dep) => dep.taskId)
      .map((dep) => ({
        predecessor_id: Number(dep.taskId),
        type: dep.type,
        lag_days: dep.lagDays || 0,
      })),
    // Clean up resources - remove empty strings
    resources: form.value.resources.filter((r) => r.trim()),
    // Send task lead and team members separately
    task_lead_id: form.value.project_lead,
    team_members: form.value.team_members.filter((a) => a > 0),
  }

  if (props.mode === 'edit' && props.task) {
    taskData.id = props.task.id
  }

  emit('save', taskData)
}

function handleDelete() {
  if (props.task && confirm(`Delete task "${props.task.name}"?`)) {
    console.log('🗑️ Deleting task:', props.task.id)
    emit('delete', props.task.id)
  }
}

function handleDuplicate() {
  if (props.task) {
    console.log('📋 Duplicating task:', props.task.name)
    emit('duplicate', props.task)
  }
}
</script>

<template>
  <div v-if="isOpen" class="absolute inset-0 bg-white z-50 flex flex-col">
    <!-- Header - Simplified (controls moved to ProjectDetailPrj header) -->
    <div class="border-b border-gray-200 bg-gray-50" style="height: 1px"></div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-6">
      <div class="max-w-5xl mx-auto">
        <!-- Basic Information Section -->
        <section class="mb-8">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Basic Information</h3>
          </div>
          <form @submit.prevent="handleBasicInfoSave">
            <div class="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
              <!-- Task Name -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2"> Task Name * </label>
                <input
                  v-model="form.name"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter task name"
                />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- WBS Path -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    WBS Path <span class="text-gray-400">(optional)</span>
                  </label>
                  <input
                    v-model="form.wbs_path"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 1.1.1"
                  />
                </div>

                <!-- Project Lead -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Project Lead <span class="text-gray-400">(optional)</span>
                  </label>
                  <select
                    v-model="form.project_lead"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option :value="null">Select project lead</option>
                    <option v-for="person in availablePeople" :key="person.id" :value="person.id">
                      {{ person.name }} ({{ person.role }})
                    </option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <!-- Start Date -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2"> Start Date * </label>
                  <input
                    v-model="form.start_planned"
                    type="date"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <!-- End Date -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2"> End Date * </label>
                  <input
                    v-model="form.end_planned"
                    type="date"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <!-- Duration -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Duration (days)
                  </label>
                  <input
                    v-model.number="form.duration_days"
                    type="number"
                    min="1"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Status -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    v-model="form.status"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="planned">Planned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <!-- Progress -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Progress ({{ form.progress_pct }}%)
                  </label>
                  <input
                    v-model.number="form.progress_pct"
                    type="range"
                    min="0"
                    max="100"
                    class="w-full"
                  />
                </div>
              </div>

              <!-- Milestone -->
              <div class="flex items-center">
                <input
                  v-model="form.milestone"
                  type="checkbox"
                  id="milestone"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label for="milestone" class="ml-2 block text-sm text-gray-900">
                  This is a milestone
                </label>
              </div>

              <!-- Notes -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Notes <span class="text-gray-400">(optional)</span>
                </label>
                <textarea
                  v-model="form.notes"
                  rows="4"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add any additional notes or description..."
                ></textarea>
              </div>

              <!-- Save Button for Basic Info -->
              <div class="flex justify-end pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  {{ mode === 'create' ? 'Create Task' : 'Save Changes' }}
                </button>
              </div>
            </div>
          </form>
        </section>

        <!-- Tab Bar Section -->
        <section class="mb-8">
          <!-- Tab Navigation -->
          <div class="border-b border-gray-200 mb-6">
            <nav class="flex -mb-px space-x-8">
              <button
                @click="activeTab = 'dependencies'"
                :class="[
                  'pb-4 px-1 border-b-2 font-medium text-sm transition-colors',
                  activeTab === 'dependencies'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                ]"
              >
                <div class="flex items-center space-x-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    ></path>
                  </svg>
                  <span>Dependencies</span>
                  <span
                    v-if="form.dependencies.length > 0"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {{ form.dependencies.length }}
                  </span>
                </div>
              </button>

              <button
                @click="activeTab = 'resources'"
                :class="[
                  'pb-4 px-1 border-b-2 font-medium text-sm transition-colors',
                  activeTab === 'resources'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                ]"
              >
                <div class="flex items-center space-x-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    ></path>
                  </svg>
                  <span>Resources</span>
                  <span
                    v-if="form.resources.length > 0"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  >
                    {{ form.resources.length }}
                  </span>
                </div>
              </button>

              <button
                @click="activeTab = 'team'"
                :class="[
                  'pb-4 px-1 border-b-2 font-medium text-sm transition-colors',
                  activeTab === 'team'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                ]"
              >
                <div class="flex items-center space-x-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    ></path>
                  </svg>
                  <span>Team Members</span>
                  <span
                    v-if="form.team_members.length > 0"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                  >
                    {{ form.team_members.length }}
                  </span>
                </div>
              </button>
            </nav>
          </div>

          <!-- Tab Content -->
          <div class="bg-white rounded-lg border border-gray-200">
            <!-- Dependencies Tab -->
            <div v-if="activeTab === 'dependencies'" class="p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-base font-medium text-gray-900">Task Dependencies</h3>
                <button
                  @click="openDependencyDialog"
                  class="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  + Add Dependency
                </button>
              </div>
              <div v-if="form.dependencies.length === 0" class="text-center py-12 text-gray-500">
                <svg
                  class="mx-auto h-12 w-12 text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  ></path>
                </svg>
                <p>No dependencies added yet.</p>
                <p class="text-sm mt-1">Click "Add Dependency" to create one.</p>
              </div>
              <div v-else class="space-y-3">
                <div
                  v-for="(dep, index) in form.dependencies"
                  :key="index"
                  class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <div class="flex-1">
                    <div class="flex items-center space-x-3">
                      <svg
                        class="w-5 h-5 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        ></path>
                      </svg>
                      <div>
                        <p class="text-sm font-medium text-gray-900">
                          {{ getDependencyTaskName(dep.taskId) }}
                        </p>
                        <p class="text-xs text-gray-500">
                          {{ formatDependencyType(dep.type) }}
                          <span v-if="dep.lagDays"> · Lag: {{ dep.lagDays }} days</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    @click="removeDependency(index)"
                    class="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Remove dependency"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      ></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Resources Tab -->
            <div v-else-if="activeTab === 'resources'" class="p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-base font-medium text-gray-900">Assigned Resources</h3>
                <button
                  @click="openResourceDialog"
                  class="px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  + Add Resource
                </button>
              </div>
              <div v-if="form.resources.length === 0" class="text-center py-12 text-gray-500">
                <svg
                  class="mx-auto h-12 w-12 text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  ></path>
                </svg>
                <p>No resources assigned yet.</p>
                <p class="text-sm mt-1">Click "Add Resource" to assign one.</p>
              </div>
              <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  v-for="(resource, index) in form.resources"
                  :key="index"
                  class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-green-300 transition-colors"
                >
                  <div class="flex items-center space-x-3">
                    <svg
                      class="w-5 h-5 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      ></path>
                    </svg>
                    <span class="text-sm font-medium text-gray-900">{{ resource }}</span>
                  </div>
                  <button
                    @click="removeResource(index)"
                    class="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Remove resource"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Team Members Tab -->
            <div v-else-if="activeTab === 'team'" class="p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-base font-medium text-gray-900">Assigned Team Members</h3>
                <button
                  @click="openTeamMemberDialog"
                  class="px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  + Add Team Member
                </button>
              </div>
              <div v-if="form.team_members.length === 0" class="text-center py-12 text-gray-500">
                <svg
                  class="mx-auto h-12 w-12 text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  ></path>
                </svg>
                <p>No team members assigned yet.</p>
                <p class="text-sm mt-1">Click "Add Team Member" to assign one.</p>
              </div>
              <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  v-for="(memberId, index) in form.team_members"
                  :key="index"
                  class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors"
                >
                  <div class="flex items-center space-x-3">
                    <div
                      class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center"
                    >
                      <span class="text-sm font-medium text-purple-600">
                        {{ getTeamMemberInitials(memberId) }}
                      </span>
                    </div>
                    <div>
                      <p class="text-sm font-medium text-gray-900">
                        {{ getTeamMemberName(memberId) }}
                      </p>
                      <p class="text-xs text-gray-500">{{ getTeamMemberRole(memberId) }}</p>
                    </div>
                  </div>
                  <button
                    @click="removeTeamMember(index)"
                    class="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Remove team member"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- Dependency Dialog -->
    <DependencyDialog
      v-if="showDependencyDialog"
      :is-open="showDependencyDialog"
      :available-tasks="availableTasks"
      :current-task-id="task?.id ? String(task.id) : ''"
      :existing-dependencies="form.dependencies"
      @close="showDependencyDialog = false"
      @add="addDependency"
    />

    <!-- Resource Dialog -->
    <ResourceSelectorDialog
      v-if="showResourceDialog"
      :is-open="showResourceDialog"
      @close="showResourceDialog = false"
      @add="addResource"
    />

    <!-- Team Member Dialog -->
    <TeamMemberDialog
      v-if="showTeamMemberDialog"
      :is-open="showTeamMemberDialog"
      :available-people="availablePeople"
      @close="showTeamMemberDialog = false"
      @add="addTeamMember"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Task, TaskStatus } from '@/core/types/task'
import DependencyDialog from './DependencyDialog.vue'
import ResourceSelectorDialog from './ResourceSelectorDialog.vue'
import TeamMemberDialog from './TeamMemberDialog.vue'

// Props
interface Props {
  isOpen: boolean
  mode: 'create' | 'edit'
  task?: Task | null
  projectId: number
  availableTasks?: Task[]
  canManageProject?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  mode: 'create',
  task: null,
  availableTasks: () => [],
  canManageProject: true,
})

// Emits
const emit = defineEmits<{
  close: []
  save: [task: Partial<Task>]
  delete: [taskId: string]
  duplicate: [task: Task]
}>()

// State
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

const showDependencyDialog = ref(false)
const showResourceDialog = ref(false)
const showTeamMemberDialog = ref(false)

// Active tab for secondary sections
const activeTab = ref<'dependencies' | 'resources' | 'team'>('dependencies')

// Available data
const availablePeople = ref<Array<{ id: number; name: string; role: string }>>([
  { id: 1, name: 'John Doe', role: 'Project Manager' },
  { id: 2, name: 'Jane Smith', role: 'Engineer' },
  { id: 3, name: 'Bob Johnson', role: 'Foreman' },
])

// Watch for task changes
watch(
  () => [props.isOpen, props.task],
  ([isOpen]) => {
    if (isOpen && props.mode === 'create') {
      // Reset form for create mode
      form.value = {
        name: '',
        wbs_path: '',
        start_planned: '',
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
    } else if (isOpen && props.task) {
      // Initialize form with task data for edit mode
      form.value = {
        name: props.task.name || '',
        wbs_path: props.task.wbs_path || '',
        start_planned: props.task.start_planned || '',
        end_planned: props.task.end_planned || '',
        duration_days: props.task.duration_days || 1,
        milestone: props.task.milestone || false,
        status: props.task.status || 'planned',
        progress_pct: props.task.progress_pct || 0,
        notes: props.task.notes || '',
        dependencies: (props.task.dependencies || []).map((dep) => {
          if (typeof dep === 'object') {
            return {
              taskId: String(dep.predecessor_id),
              type: dep.type,
              lagDays: dep.lag_days || 0,
            }
          }
          return {
            taskId: String(dep),
            type: 'FS',
            lagDays: 0,
          }
        }),
        resources: props.task.resources || [],
        project_lead: props.task.task_lead_id || null,
        team_members: props.task.team_members || [],
      }
    }
  },
)

// Methods

function handleBasicInfoSave() {
  // Transform dependencies to match Task type
  const taskData: Partial<Task> = {
    ...form.value,
    dependencies: form.value.dependencies.map((dep) => ({
      predecessor_id: Number(dep.taskId),
      type: dep.type,
      lag_days: dep.lagDays,
    })),
  }
  emit('save', taskData)
}


// Dependencies methods
function openDependencyDialog() {
  showDependencyDialog.value = true
}

function addDependency(dep: { taskId: string; type: string; lagDays: number }) {
  form.value.dependencies.push(dep)
  showDependencyDialog.value = false
}

function removeDependency(index: number) {
  form.value.dependencies.splice(index, 1)
}

function getDependencyTaskName(taskId: string): string {
  const task = props.availableTasks?.find((t) => String(t.id) === String(taskId))
  return task?.name || `Task #${taskId}`
}

function formatDependencyType(type: string): string {
  const types: Record<string, string> = {
    FS: 'Finish-to-Start',
    SS: 'Start-to-Start',
    FF: 'Finish-to-Finish',
    SF: 'Start-to-Finish',
  }
  return types[type] || type
}

// Resources methods
function openResourceDialog() {
  showResourceDialog.value = true
}

function addResource(resource: string) {
  form.value.resources.push(resource)
  showResourceDialog.value = false
}

function removeResource(index: number) {
  form.value.resources.splice(index, 1)
}

// Team members methods
function openTeamMemberDialog() {
  showTeamMemberDialog.value = true
}

function addTeamMember(memberId: number) {
  if (!form.value.team_members.includes(memberId)) {
    form.value.team_members.push(memberId)
  }
  showTeamMemberDialog.value = false
}

function removeTeamMember(index: number) {
  form.value.team_members.splice(index, 1)
}

function getTeamMemberName(memberId: number): string {
  const person = availablePeople.value.find((p) => p.id === memberId)
  return person?.name || `Member #${memberId}`
}

function getTeamMemberRole(memberId: number): string {
  const person = availablePeople.value.find((p) => p.id === memberId)
  return person?.role || 'Unknown'
}

function getTeamMemberInitials(memberId: number): string {
  const name = getTeamMemberName(memberId)
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
</script>

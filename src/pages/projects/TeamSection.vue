<template>
  <div class="team-section flex-1 flex flex-col space-y-4">
    <!-- Controls: Grouping, Search, Filters -->
    <div class="bg-white rounded-lg shadow p-4">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <!-- Grouping selector -->
        <div class="flex items-center space-x-4">
          <label class="text-sm font-medium text-gray-700">Group by:</label>
          <div class="flex items-center space-x-2">
            <label class="flex items-center">
              <input
                type="radio"
                v-model="groupingMode"
                value="worker"
                class="mr-2 text-blue-600 focus:ring-blue-500"
              />
              <span class="text-sm text-gray-700">Worker</span>
            </label>
            <label class="flex items-center ml-4">
              <input
                type="radio"
                v-model="groupingMode"
                value="task"
                class="mr-2 text-blue-600 focus:ring-blue-500"
              />
              <span class="text-sm text-gray-700">Task</span>
            </label>
          </div>
        </div>

        <!-- Search and filters -->
        <div class="flex-1 max-w-md">
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by name, task, role..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
            <svg
              class="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loadingTeam" class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center justify-center">
        <svg class="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
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
        <span class="ml-2 text-gray-600">Loading team data...</span>
      </div>
    </div>

    <!-- Grouped by Worker -->
    <div v-else-if="!loadingTeam && groupingMode === 'worker'" class="space-y-4">
      <div
        v-for="worker in filteredWorkersGrouped"
        :key="worker.user_id"
        class="bg-white rounded-lg shadow overflow-hidden"
      >
        <!-- Worker Header -->
        <div class="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div class="flex-shrink-0 h-12 w-12">
                <div
                  v-if="worker.avatar_url || worker.full_img_url"
                  class="h-12 w-12 rounded-full overflow-hidden"
                >
                  <img
                    :src="worker.avatar_url || worker.full_img_url"
                    :alt="worker.name || 'User'"
                    class="h-12 w-12 object-cover"
                    @error="handleImageError"
                  />
                </div>
                <div
                  v-else
                  class="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center"
                >
                  <span class="text-lg font-medium text-gray-700">
                    {{ getInitials(worker.name || 'Unknown') }}
                  </span>
                </div>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">{{ worker.name || 'Unknown User' }}</h3>
                <p class="text-sm text-gray-500">{{ worker.email || 'No email' }}</p>
                <p class="text-xs text-gray-400">{{ worker.job_title || 'No job title' }}</p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-sm text-gray-600">
                {{ worker.tasks.length }} task{{ worker.tasks.length !== 1 ? 's' : '' }}
              </span>
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="{
                  'bg-blue-100 text-blue-800': worker.role === 'task_lead',
                  'bg-green-100 text-green-800': worker.role === 'Team Member',
                  'bg-gray-100 text-gray-800': !['task_lead', 'Team Member'].includes(worker.role),
                }"
              >
                {{ worker.role || 'Team Member' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Worker Tasks -->
        <div class="p-6">
          <div v-if="worker.tasks.length === 0" class="text-center py-8 text-gray-500">
            <p>No tasks assigned</p>
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="task in worker.tasks"
              :key="task.id"
              class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
            >
              <div class="flex-1">
                <h4 class="font-medium text-gray-900">{{ task.name }}</h4>
                <div class="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                  <span>
                    <span class="font-medium">Start:</span>
                    {{ task.start_planned ? new Date(task.start_planned).toLocaleDateString() : '—' }}
                  </span>
                  <span>
                    <span class="font-medium">End:</span>
                    {{ task.end_planned ? new Date(task.end_planned).toLocaleDateString() : '—' }}
                  </span>
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="{
                      'bg-blue-100 text-blue-800': task.status === 'in_progress',
                      'bg-green-100 text-green-800': task.status === 'done',
                      'bg-yellow-100 text-yellow-800': task.status === 'planned',
                      'bg-red-100 text-red-800': task.status === 'blocked' || task.status === 'delayed',
                      'bg-gray-100 text-gray-800': !['in_progress', 'done', 'planned', 'blocked', 'delayed'].includes(task.status),
                    }"
                  >
                    {{ formatTaskStatus(task.status) }}
                  </span>
                </div>
              </div>
              <div v-if="canEdit" class="flex items-center space-x-2">
                <button
                  @click="removeWorkerFromTask(worker.user_id, task.id)"
                  class="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Remove from task"
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
      </div>
    </div>

    <!-- Grouped by Task -->
    <div v-else-if="!loadingTeam && groupingMode === 'task'" class="space-y-4">
      <div
        v-for="task in filteredTasksGrouped"
        :key="task.id"
        class="bg-white rounded-lg shadow overflow-hidden"
      >
        <!-- Task Header -->
        <div class="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-900">{{ task.name }}</h3>
              <div class="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                <span>
                  <span class="font-medium">Start:</span>
                  {{ task.start_planned ? new Date(task.start_planned).toLocaleDateString() : '—' }}
                </span>
                <span>
                  <span class="font-medium">End:</span>
                  {{ task.end_planned ? new Date(task.end_planned).toLocaleDateString() : '—' }}
                </span>
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="{
                    'bg-blue-100 text-blue-800': task.status === 'in_progress',
                    'bg-green-100 text-green-800': task.status === 'done',
                    'bg-yellow-100 text-yellow-800': task.status === 'planned',
                    'bg-red-100 text-red-800': task.status === 'blocked' || task.status === 'delayed',
                    'bg-gray-100 text-gray-800': !['in_progress', 'done', 'planned', 'blocked', 'delayed'].includes(task.status),
                  }"
                >
                  {{ formatTaskStatus(task.status) }}
                </span>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-sm text-gray-600">
                {{ task.workers.length }} worker{{ task.workers.length !== 1 ? 's' : '' }}
              </span>
              <button
                v-if="canEdit"
                @click="openAddWorkerDialog(task)"
                class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                + Add Worker
              </button>
            </div>
          </div>
        </div>

        <!-- Task Workers -->
        <div class="p-6">
          <div v-if="task.workers.length === 0" class="text-center py-8 text-gray-500">
            <p>No workers assigned</p>
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="worker in task.workers"
              :key="worker.user_id"
              class="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
            >
              <div class="flex-shrink-0 h-10 w-10">
                <div
                  v-if="worker.avatar_url || worker.full_img_url"
                  class="h-10 w-10 rounded-full overflow-hidden"
                >
                  <img
                    :src="worker.avatar_url || worker.full_img_url"
                    :alt="worker.name || 'User'"
                    class="h-10 w-10 object-cover"
                    @error="handleImageError"
                  />
                </div>
                <div
                  v-else
                  class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center"
                >
                  <span class="text-sm font-medium text-gray-700">
                    {{ getInitials(worker.name || 'Unknown') }}
                  </span>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ worker.name || 'Unknown' }}</p>
                <p class="text-xs text-gray-500 truncate">
                  {{ worker.role || 'Worker' }}
                  <span v-if="worker.isInvited" class="ml-1 text-blue-600">(Invited)</span>
                </p>
                <p class="text-xs text-gray-400 truncate">{{ worker.specialization || '' }}</p>
              </div>
              <div v-if="canEdit && !worker.isInvited" class="flex-shrink-0">
                <button
                  @click="removeWorkerFromTask(worker.user_id!, task.id)"
                  class="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Remove from task"
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
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!loadingTeam && teamMembers.length === 0 && tasks.length === 0" class="bg-white rounded-lg shadow p-6 text-center">
      <svg
        class="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        ></path>
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">No team data</h3>
      <p class="mt-1 text-sm text-gray-500">
        Get started by adding team members and tasks to this project.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Task } from '@/core/types/task'
import type { ProjectTeamMember } from '@/core/utils/project-api'
import { hrResourcesApi } from '@/core/utils/hr-api'
import type { WorkerUser } from '@/core/utils/hr-api'
import { projectApi } from '@/core/utils/project-api'

defineOptions({
  name: 'TeamSection',
})

// Props
interface Props {
  teamMembers: ProjectTeamMember[]
  tasks: Task[]
  loadingTeam: boolean
  canEdit: boolean
  projectId: number
}

const props = withDefaults(defineProps<Props>(), {
  teamMembers: () => [],
  tasks: () => [],
  loadingTeam: false,
  canEdit: false,
  projectId: 0,
})

// State
const groupingMode = ref<'worker' | 'task'>('worker')
const searchQuery = ref('')
const taskLeadCache = ref<Map<number, { name: string; avatar_url?: string; full_img_url?: string; role?: string }>>(new Map())
const taskInvitedPeopleCache = ref<Map<string, ProjectTeamMember[]>>(new Map()) // key: taskId

// Emits
const emit = defineEmits<{
  removeWorkerFromTask: [workerId: number, taskId: string]
  addWorkerToTask: [taskId: string]
  memberDetails: [member: ProjectTeamMember]
  removeTeamMember: [member: ProjectTeamMember]
  addTeamMember: []
}>()

// Grouped by Worker
const workersGrouped = computed(() => {
  const workerMap = new Map<number, {
    user_id: number
    name: string
    email: string
    job_title: string
    role: string
    avatar_url?: string
    full_img_url?: string
    specialization?: string
    tasks: Array<{
      id: string
      name: string
      start_planned: string
      end_planned?: string
      status: string
    }>
  }>()

  // Initialize workers from teamMembers
  props.teamMembers.forEach((member) => {
    if (member.user_id !== null && member.user_id !== undefined) {
      if (!workerMap.has(member.user_id)) {
        workerMap.set(member.user_id, {
          user_id: member.user_id,
        name: member.name || 'Unknown',
        email: member.email || '',
        job_title: member.job_title || '',
        role: member.role_in_project || 'Team Member',
        avatar_url: undefined,
        full_img_url: undefined,
        specialization: member.user_type || '',
        tasks: [],
      })
      }
    }
  })

  // Add tasks to workers
  props.tasks.forEach((task) => {
    // Check if worker is task lead
    if (task.task_lead_id) {
      const worker = workerMap.get(task.task_lead_id)
      if (worker) {
        worker.tasks.push({
          id: task.id,
          name: task.name,
          start_planned: task.start_planned,
          end_planned: task.end_planned,
          status: task.status,
        })
      }
    }

    // Check if worker is in team_members
    if (task.team_members && Array.isArray(task.team_members)) {
      task.team_members.forEach((workerId: number) => {
        const worker = workerMap.get(workerId)
        if (worker) {
          // Avoid duplicates if worker is both lead and member
          if (!worker.tasks.find(t => t.id === task.id)) {
            worker.tasks.push({
              id: task.id,
              name: task.name,
              start_planned: task.start_planned,
              end_planned: task.end_planned,
              status: task.status,
            })
          }
        }
      })
    }
  })

  return Array.from(workerMap.values())
})

// Load task lead data if not in team
async function loadTaskLeadData(taskLeadId: number) {
  if (taskLeadCache.value.has(taskLeadId)) {
    return
  }

  try {
    // Try to find in team members first
    const leadMember = props.teamMembers.find(m => m.user_id === taskLeadId)
    if (leadMember) {
      taskLeadCache.value.set(taskLeadId, {
        name: leadMember.name || 'Unknown',
        avatar_url: undefined,
        full_img_url: undefined,
        role: leadMember.role_in_project || 'Task Lead',
      })
      return
    }

    // If not in team, try to load from system users
    const response = await hrResourcesApi.getAllWorkerUsers(1, 1000, {
      status: '1',
    })

    if ('workers' in response && Array.isArray(response.workers)) {
      const worker = response.workers.find((w: WorkerUser) => w.id === taskLeadId)
      if (worker) {
        taskLeadCache.value.set(taskLeadId, {
          name: `${worker.first_name || ''} ${worker.last_name || ''}`.trim() || worker.name || 'Unknown',
          avatar_url: worker.avatar_url || undefined,
          full_img_url: worker.full_img_url || undefined,
          role: worker.role_name || worker.role_code || 'Task Lead',
        })
      }
    }
  } catch (error) {
    console.error('Error loading task lead data:', error)
  }
}

// Grouped by Task
const tasksGrouped = computed(() => {
  return props.tasks.map((task) => {
    const workers: Array<{
      user_id?: number
      name: string
      role: string
      specialization?: string
      avatar_url?: string
      full_img_url?: string
      isInvited?: boolean
    }> = []

    // Add task lead
    if (task.task_lead_id) {
      const leadMember = props.teamMembers.find(m => m.user_id === task.task_lead_id)
      if (leadMember) {
        workers.push({
          user_id: leadMember.user_id || undefined,
          name: leadMember.name || 'Unknown',
          role: 'Task Lead',
          specialization: leadMember.user_type || '',
          avatar_url: leadMember.avatar_url || undefined,
          full_img_url: leadMember.full_img_url || undefined,
        })
      } else {
        // Try to get from cache
        const cached = taskLeadCache.value.get(task.task_lead_id)
        if (cached) {
          workers.push({
            user_id: task.task_lead_id,
            name: cached.name,
            role: cached.role || 'Task Lead',
            avatar_url: cached.avatar_url,
            full_img_url: cached.full_img_url,
          })
        } else {
          // Load asynchronously
          loadTaskLeadData(task.task_lead_id)
          workers.push({
            user_id: task.task_lead_id,
            name: `User #${task.task_lead_id}`,
            role: 'Task Lead',
          })
        }
      }
    }

    // Add team members
    if (task.team_members && Array.isArray(task.team_members)) {
      task.team_members.forEach((workerId: number) => {
        // Avoid duplicate if worker is also task lead
        if (workerId !== task.task_lead_id) {
          const member = props.teamMembers.find(m => m.user_id === workerId)
          if (member) {
            workers.push({
              user_id: member.user_id || undefined,
              name: member.name || 'Unknown',
              role: member.role_in_project || 'Team Member',
              specialization: member.user_type || '',
              avatar_url: member.avatar_url || undefined,
              full_img_url: member.full_img_url || undefined,
            })
          }
        }
      })
    }

    // Add invited people (for milestones) - loaded from API
    const invited = taskInvitedPeopleCache.value.get(task.id)
    if (invited && Array.isArray(invited)) {
      invited.forEach((invitedMember: ProjectTeamMember) => {
        const name = invitedMember.invited_people?.name || invitedMember.name || 'Unknown'
        workers.push({
          user_id: invitedMember.user_id || undefined,
          name: name,
          role: 'Invited',
          specialization: invitedMember.invited_people?.company || '',
          avatar_url: invitedMember.invited_people?.avatar || undefined,
          isInvited: true,
        })
      })
    }

    return {
      id: task.id,
      name: task.name,
      start_planned: task.start_planned,
      end_planned: task.end_planned,
      status: task.status,
      workers,
    }
  })
})

// Filtered data
const filteredWorkersGrouped = computed(() => {
  if (!searchQuery.value.trim()) {
    return workersGrouped.value
  }

  const query = searchQuery.value.toLowerCase()
  return workersGrouped.value.filter((worker) => {
    const matchesName = worker.name.toLowerCase().includes(query)
    const matchesEmail = worker.email.toLowerCase().includes(query)
    const matchesRole = worker.role.toLowerCase().includes(query)
    const matchesTask = worker.tasks.some(task => task.name.toLowerCase().includes(query))
    return matchesName || matchesEmail || matchesRole || matchesTask
  })
})

const filteredTasksGrouped = computed(() => {
  if (!searchQuery.value.trim()) {
    return tasksGrouped.value
  }

  const query = searchQuery.value.toLowerCase()
  return tasksGrouped.value.filter((task) => {
    const matchesTaskName = task.name.toLowerCase().includes(query)
    const matchesWorker = task.workers.some(worker =>
      worker.name.toLowerCase().includes(query) ||
      worker.role.toLowerCase().includes(query)
    )
    return matchesTaskName || matchesWorker
  })
})

// Methods
function formatTaskStatus(status: string): string {
  const statusMap: Record<string, string> = {
    planned: 'Planned',
    in_progress: 'In Progress',
    done: 'Done',
    blocked: 'Blocked',
    delayed: 'Delayed',
  }
  return statusMap[status] || status
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
  const parent = img.parentElement
  if (parent) {
    parent.innerHTML = `
      <div class="h-${img.classList.contains('h-12') ? '12' : '10'} w-${img.classList.contains('w-12') ? '12' : '10'} rounded-full bg-gray-300 flex items-center justify-center">
        <span class="text-${img.classList.contains('h-12') ? 'lg' : 'sm'} font-medium text-gray-700">
          ${(img.alt || 'U').split(' ').map((n: string) => n[0]).join('')}
        </span>
      </div>
    `
  }
}

function removeWorkerFromTask(workerId: number, taskId: string) {
  emit('removeWorkerFromTask', workerId, taskId)
}

function openAddWorkerDialog(task: { id: string }) {
  emit('addWorkerToTask', task.id)
}

// Load invited people for milestone tasks
async function loadInvitedPeopleForTask(taskId: string) {
  if (taskInvitedPeopleCache.value.has(taskId)) {
    return
  }

  try {
    const response = await projectApi.getTaskTeamMembers(props.projectId, Number(taskId))
    const members = response.data?.team_members || response.team_members || []
    // Filter only invited people
    const invited = members.filter((m: ProjectTeamMember) =>
      m.role_in_project === 'invited' || m.role_in_project === 'Invited'
    )
    taskInvitedPeopleCache.value.set(taskId, invited)
    console.log(`✅ Loaded ${invited.length} invited people for task ${taskId}`)
  } catch (error) {
    console.error(`❌ Error loading invited people for task ${taskId}:`, error)
    taskInvitedPeopleCache.value.set(taskId, [])
  }
}

// Load task leads and invited people on mount
onMounted(async () => {
  const taskLeadIds = new Set<number>()
  const milestoneTaskIds: string[] = []

  props.tasks.forEach((task) => {
    if (task.task_lead_id) {
      taskLeadIds.add(task.task_lead_id)
    }
    // Check if milestone and load invited people
    if (task.milestone && task.id) {
      milestoneTaskIds.push(task.id)
    }
  })

  // Load all task leads and invited people in parallel
  await Promise.all([
    ...Array.from(taskLeadIds).map(id => loadTaskLeadData(id)),
    ...milestoneTaskIds.map(id => loadInvitedPeopleForTask(id))
  ])
})
</script>

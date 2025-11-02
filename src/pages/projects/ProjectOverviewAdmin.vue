<template>
  <div class="px-4 md:px-6">
    <div class="bg-white shadow rounded-lg p-4 mb-4">
      <h1 class="text-lg font-semibold text-gray-900">Project Overview</h1>
      <p class="text-sm text-gray-500">Read-only dashboard for administrators</p>
    </div>

    <!-- Project Summary -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div class="bg-white shadow rounded-lg p-4">
        <h2 class="text-base font-medium text-gray-900 mb-2">Summary</h2>
        <div class="space-y-2 text-sm text-gray-700">
          <div><span class="text-gray-500">Name:</span> {{ project?.prj_name }}</div>
          <div><span class="text-gray-500">Address:</span> {{ project?.address }}</div>
          <div><span class="text-gray-500">Status:</span> {{ getStatusDisplay(project?.status || '') }}</div>
          <div><span class="text-gray-500">Priority:</span> {{ project?.priority }}</div>
          <div><span class="text-gray-500">Dates:</span> {{ formatDate(project?.date_start) }} - {{ formatDate(project?.date_end) }}</div>
          <div><span class="text-gray-500">Manager:</span> {{ project?.manager_name || 'Unassigned' }}</div>
          <div><span class="text-gray-500">Created by:</span> {{ project?.created_by_name || 'Unknown' }}</div>
        </div>
      </div>

      <div class="bg-white shadow rounded-lg p-4">
        <h2 class="text-base font-medium text-gray-900 mb-2">Analytics</h2>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div class="p-3 rounded bg-gray-50">
            <div class="text-gray-500">Total Tasks</div>
            <div class="text-xl font-semibold">{{ taskStats.total }}</div>
          </div>
          <div class="p-3 rounded bg-gray-50">
            <div class="text-gray-500">Completed</div>
            <div class="text-xl font-semibold">{{ taskStats.completed }}</div>
          </div>
          <div class="p-3 rounded bg-gray-50">
            <div class="text-gray-500">In Progress</div>
            <div class="text-xl font-semibold">{{ taskStats.inProgress }}</div>
          </div>
          <div class="p-3 rounded bg-gray-50">
            <div class="text-gray-500">Pending</div>
            <div class="text-xl font-semibold">{{ taskStats.pending }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Simple Gantt-like list -->
    <div class="bg-white shadow rounded-lg p-4">
      <h2 class="text-base font-medium text-gray-900 mb-3">Timeline (read-only)</h2>
      <div v-if="tasks.length === 0" class="text-sm text-gray-500">No tasks found</div>
      <div v-else class="space-y-2">
        <div
          v-for="t in tasks"
          :key="t.id"
          class="flex items-center gap-3"
        >
          <div class="w-40 text-sm text-gray-700 truncate">{{ t.title }}</div>
          <div class="flex-1 h-2 bg-gray-100 rounded">
            <div
              class="h-2 rounded"
              :class="barColor(t.status)"
              :style="{ width: barWidth(t) }"
            />
          </div>
          <div class="w-28 text-xs text-gray-500 text-right">{{ t.status }}</div>
        </div>
      </div>
    </div>

    <!-- Activity / History and Communication -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      <div class="bg-white shadow rounded-lg p-4">
        <h2 class="text-base font-medium text-gray-900 mb-3">Activity History</h2>
        <ul class="divide-y divide-gray-100 text-sm">
          <li v-for="(event, idx) in activity" :key="idx" class="py-2 flex items-start gap-2">
            <span class="mt-1 h-2 w-2 rounded-full" :class="event.dot" />
            <div>
              <div class="text-gray-800">{{ event.title }}</div>
              <div class="text-gray-500 text-xs">{{ event.when }}</div>
            </div>
          </li>
        </ul>
      </div>

      <div class="bg-white shadow rounded-lg p-4">
        <h2 class="text-base font-medium text-gray-900 mb-3">Communication</h2>
        <div class="text-sm text-gray-700 mb-3">
          Contact Project Manager to request updates or clarifications.
        </div>
        <div class="flex items-center gap-3">
          <button disabled class="px-3 py-1.5 bg-gray-200 text-gray-600 rounded cursor-not-allowed h-7 flex items-center">Message PM</button>
          <button disabled class="px-3 py-1.5 bg-gray-200 text-gray-600 rounded cursor-not-allowed h-7 flex items-center">Schedule Call</button>
        </div>
        <p class="text-xs text-gray-500 mt-2">Actions are placeholders for now.</p>
      </div>
    </div>
  </div>

</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { projectApi, type Project as ApiProject } from '@/core/utils/project-api'
import { tasksApi } from '@/core/utils/tasks-api'
import type { Task } from '@/core/types/task'

const route = useRoute()

const project = ref<ApiProject | null>(null)
const tasks = ref<Array<{ id: number; title: string; status: string }>>([])
const activity = ref<Array<{ title: string; when: string; dot: string }>>([
  { title: 'Project created', when: '2 months ago', dot: 'bg-gray-400' },
  { title: 'Kick-off meeting held', when: '7 weeks ago', dot: 'bg-blue-400' },
  { title: 'Foundation completed', when: '3 weeks ago', dot: 'bg-green-400' },
  { title: 'Inspection requested', when: '1 week ago', dot: 'bg-yellow-400' },
])

const taskStats = computed(() => {
  const total = tasks.value.length
  const completed = tasks.value.filter((t) => t.status === 'completed').length
  const inProgress = tasks.value.filter((t) => t.status === 'in-progress').length
  const pending = tasks.value.filter((t) => t.status === 'pending').length
  return { total, completed, inProgress, pending }
})

function getStatusDisplay(status: string) {
  switch (status) {
    case 'active':
      return 'Active'
    case 'completed':
      return 'Completed'
    case 'pending':
      return 'Pending'
    case 'on-hold':
      return 'On Hold'
    default:
      return status
  }
}

function formatDate(dateString?: string) {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function barColor(status: string) {
  if (status === 'completed') return 'bg-green-500'
  if (status === 'in-progress') return 'bg-blue-500'
  return 'bg-gray-400'
}

function barWidth(t: { status: string }) {
  if (t.status === 'completed') return '100%'
  if (t.status === 'in-progress') return '60%'
  return '25%'
}

onMounted(async () => {
  const id = Number(route.params.id)
  try {
    // Load project
    project.value = await projectApi.getById(id)
  } catch {
    project.value = null
  }
  try {
    // Load first page of tasks for simple read-only analytics
    const resp = await tasksApi.getAll(id, 1, 100)
    const list = resp.tasks || []
    tasks.value = list.map((x: Task) => ({ id: Number(x.id), title: x.name, status: x.status }))
  } catch {
    tasks.value = []
  }

  // Fallback demo data for empty state
  if (!project.value) {
    project.value = {
      id,
      prj_name: 'Sample Project',
      address: '123 Demo Street',
      priority: 'Medium',
      date_start: new Date().toISOString().slice(0, 10),
      date_end: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 0,
      created_by_name: 'System',
    } as unknown as ApiProject
  }

  if (tasks.value.length === 0) {
    tasks.value = [
      { id: 1, title: 'Kick-off', status: 'completed' },
      { id: 2, title: 'Design', status: 'in-progress' },
      { id: 3, title: 'Permits', status: 'pending' },
      { id: 4, title: 'Foundation', status: 'pending' },
      { id: 5, title: 'Framing', status: 'pending' },
    ]
  }
})
</script>



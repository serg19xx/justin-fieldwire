<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
    @click="closeDialog"
  >
    <div
      class="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
      @click.stop
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
        <div class="flex items-center space-x-3">
          <span v-if="task?.milestone" class="text-2xl">🎯</span>
          <span v-else class="text-2xl">📋</span>
          <h2 class="text-lg sm:text-xl font-semibold text-gray-900">
            {{ task?.name || 'Task Details' }}
          </h2>
        </div>
        <div class="flex items-center space-x-2">
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
      </div>

      <!-- Content -->
      <div class="p-4 sm:p-6">
        <!-- Status Badge -->
        <div class="mb-6">
          <span
            :class="[
              'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
              getStatusClass(task?.status),
            ]"
          >
            {{ formatStatus(task?.status) }}
          </span>
          <span
            v-if="task?.milestone"
            class="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800"
          >
            Milestone
          </span>
        </div>

        <!-- Basic Information -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <!-- WBS Path -->
          <div v-if="task?.wbs_path">
            <label class="block text-sm font-medium text-gray-700 mb-1">WBS Path</label>
            <p class="text-gray-900">{{ task.wbs_path }}</p>
          </div>

          <!-- Duration -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Duration</label>
            <p class="text-gray-900">{{ task?.duration_days || 0 }} days</p>
          </div>

          <!-- Start Date -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <p class="text-gray-900">{{ formatDate(task?.start_planned) }}</p>
          </div>

          <!-- End Date -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <p class="text-gray-900">{{ formatDate(task?.end_planned) }}</p>
          </div>

          <!-- Progress -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Progress</label>
            <div class="flex items-center space-x-3">
              <div class="flex-1 bg-gray-200 rounded-full h-3">
                <div
                  class="bg-blue-600 h-3 rounded-full transition-all"
                  :style="{ width: `${task?.progress_pct || 0}%` }"
                ></div>
              </div>
              <span class="text-sm font-medium text-gray-700">{{ task?.progress_pct || 0 }}%</span>
            </div>
          </div>

          <!-- Project Lead -->
          <div v-if="projectLead">
            <label class="block text-sm font-medium text-gray-700 mb-1">Project Lead</label>
            <p class="text-gray-900">{{ projectLead.name }}</p>
          </div>
        </div>

        <!-- Notes -->
        <div v-if="task?.notes" class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">Notes</label>
          <div class="bg-gray-50 rounded-md p-4 text-gray-900 whitespace-pre-wrap">
            {{ task.notes }}
          </div>
        </div>

        <!-- Statistics Section -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <!-- Dependencies Count -->
          <div class="bg-blue-50 rounded-lg p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-blue-600 font-medium">Dependencies</p>
                <p class="text-2xl font-bold text-blue-900">{{ dependenciesCount }}</p>
              </div>
              <svg
                class="w-8 h-8 text-blue-400"
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
            </div>
          </div>

          <!-- Resources Count -->
          <div class="bg-green-50 rounded-lg p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-green-600 font-medium">Resources</p>
                <p class="text-2xl font-bold text-green-900">{{ resourcesCount }}</p>
              </div>
              <svg
                class="w-8 h-8 text-green-400"
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
            </div>
          </div>

          <!-- Team Members Count -->
          <div class="bg-purple-50 rounded-lg p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-purple-600 font-medium">Team Members</p>
                <p class="text-2xl font-bold text-purple-900">{{ teamMembersCount }}</p>
              </div>
              <svg
                class="w-8 h-8 text-purple-400"
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
            </div>
          </div>
        </div>

        <!-- Dependencies List (if any) -->
        <div v-if="task?.dependencies && task.dependencies.length > 0" class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-3">Task Dependencies</label>
          <div class="bg-gray-50 rounded-md p-4 space-y-2">
            <div
              v-for="(dep, index) in task.dependencies"
              :key="index"
              class="flex items-center justify-between py-2 px-3 bg-white rounded border border-gray-200"
            >
              <div class="flex items-center space-x-3">
                <span class="text-sm font-medium text-gray-900">
                  {{ getDependencyTaskName(dep) }}
                </span>
                <span v-if="typeof dep === 'object' && dep.type" class="text-xs text-gray-500">
                  {{ formatDependencyType(dep.type) }}
                </span>
              </div>
              <span v-if="typeof dep === 'object' && dep.lag_days" class="text-xs text-gray-600">
                Lag: {{ dep.lag_days }} days
              </span>
            </div>
          </div>
        </div>

        <!-- Team Members List (if any) -->
        <div v-if="task?.team_members && task.team_members.length > 0" class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-3">Assigned Team Members</label>
          <div class="bg-gray-50 rounded-md p-4 space-y-2">
            <div
              v-for="memberId in task.team_members"
              :key="rosterKey(memberId)"
              class="flex items-center gap-3 py-2 px-3 bg-white rounded border border-gray-200"
            >
              <div class="relative w-9 h-9 shrink-0">
                <img
                  v-if="getMemberAvatarUrl(memberId) && !avatarFailed[rosterKey(memberId)]"
                  :src="getMemberAvatarUrl(memberId)!"
                  :alt="getTeamMemberName(memberId)"
                  class="w-9 h-9 rounded-full object-cover border border-gray-100"
                  @error="markAvatarFailed(memberId)"
                />
                <div
                  v-else
                  class="w-9 h-9 rounded-full flex items-center justify-center bg-blue-100 text-sm font-medium text-blue-600"
                >
                  {{ getTeamMemberInitials(memberId) }}
                </div>
              </div>
              <div class="min-w-0 flex-1 space-y-0.5">
                <p class="text-sm font-medium text-gray-900 truncate">
                  {{ getTeamMemberName(memberId) }}
                </p>
                <p v-if="getTeamMemberSubtitle(memberId)" class="text-xs text-gray-500 truncate">
                  {{ getTeamMemberSubtitle(memberId) }}
                </p>
                <p v-if="getMemberContactEmail(memberId)" class="text-xs text-gray-600 truncate">
                  <span class="text-gray-400">Email</span>
                  <a
                    :href="`mailto:${getMemberContactEmail(memberId)}`"
                    class="ml-1 text-blue-600 hover:underline"
                    @click.stop
                  >
                    {{ getMemberContactEmail(memberId) }}
                  </a>
                </p>
                <p v-if="getMemberContactPhone(memberId)" class="text-xs text-gray-600 truncate">
                  <span class="text-gray-400">Mobile</span>
                  <a
                    :href="phoneTelHref(getMemberContactPhone(memberId))"
                    class="ml-1 text-blue-600 hover:underline"
                    @click.stop
                  >
                    {{ getMemberContactPhone(memberId) }}
                  </a>
                </p>
              </div>
            </div>
            <p v-if="rosterLoading" class="text-xs text-gray-500 px-3">Loading team details…</p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div
        class="flex items-center justify-end space-x-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50"
      >
        <button
          @click="closeDialog"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Task } from '@/core/types/task'
import { projectApi, type ProjectTeamMember } from '@/core/utils/project-api'
import { mapApiProjectTeamRowsToRoster } from '@/core/utils/map-api-project-team-response'
import { getDisplayRole } from '@/core/utils/role-utils'

// Props
interface Props {
  isOpen: boolean
  task: Task | null
  availableTasks?: Task[]
  /** Optional roster from parent; dialog also fetches by project when opened */
  projectTeamMembers?: ProjectTeamMember[]
  canEdit?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  task: null,
  availableTasks: () => [],
  projectTeamMembers: () => [],
  canEdit: true,
})

// Emits
const emit = defineEmits<{
  close: []
}>()

const fetchedRoster = ref<ProjectTeamMember[]>([])
const rosterLoading = ref(false)

/** Per-assignee avatar load failure */
const avatarFailed = ref<Record<number, boolean>>({})

/** Parent prop + API fetch, deduped by membership row id */
const rosterList = computed(() => {
  const map = new Map<number, ProjectTeamMember>()
  for (const m of props.projectTeamMembers || []) {
    map.set(m.id, m)
  }
  for (const m of fetchedRoster.value) {
    if (!map.has(m.id)) map.set(m.id, m)
  }
  return Array.from(map.values())
})

watch(
  () => props.isOpen,
  (open) => {
    if (!open) {
      fetchedRoster.value = []
      avatarFailed.value = {}
      rosterLoading.value = false
    }
  },
)

watch(
  () => [props.isOpen, props.task?.project_id] as const,
  async ([open, projectId]) => {
    if (!open || !projectId) return
    rosterLoading.value = true
    try {
      const response = await projectApi.getTeamMembers(projectId)
      fetchedRoster.value = mapApiProjectTeamRowsToRoster(response)
    } catch (e) {
      console.warn('TaskViewDialog: failed to load project team', e)
      fetchedRoster.value = []
    } finally {
      rosterLoading.value = false
    }
  },
  { flush: 'post' },
)

// Computed
const dependenciesCount = computed(() => {
  return props.task?.dependencies?.length || 0
})

const resourcesCount = computed(() => {
  return props.task?.resources?.length || 0
})

const teamMembersCount = computed(() => {
  return props.task?.team_members?.length || 0
})

const projectLead = computed<{ id: number; name: string } | null>(() => {
  // TODO: Fetch project lead from task data or API
  return null
})

function rosterKey(memberId: unknown): number {
  const n = Number(memberId)
  return Number.isFinite(n) ? n : 0
}

// Methods
function closeDialog() {
  emit('close')
}

function formatDate(date: string | undefined): string {
  if (!date) return 'Not set'
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return date
  }
}

function formatStatus(status: string | undefined): string {
  if (!status) return 'Unknown'
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getStatusClass(status: string | undefined): string {
  const statusClasses: Record<string, string> = {
    planned: 'bg-yellow-100 text-yellow-800',
    scheduled: 'bg-indigo-100 text-indigo-800',
    scheduled_accepted: 'bg-purple-100 text-purple-800',
    in_progress: 'bg-blue-100 text-blue-800',
    partially_completed: 'bg-teal-100 text-teal-800',
    delayed_due_to_issue: 'bg-orange-100 text-orange-800',
    ready_for_inspection: 'bg-cyan-100 text-cyan-800',
    completed: 'bg-green-100 text-green-800',
  }
  return statusClasses[status || 'planned'] || 'bg-gray-100 text-gray-800'
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

function getDependencyTaskName(
  dep: number | { predecessor_id: number; type: string; lag_days: number },
): string {
  // Handle both number[] and object[] formats
  const taskId = typeof dep === 'number' ? dep : dep.predecessor_id
  const task = props.availableTasks?.find((t) => String(t.id) === String(taskId))
  return task?.name || `Task #${taskId}`
}

function resolveProjectTeamMember(memberId: unknown): ProjectTeamMember | undefined {
  const idNum = rosterKey(memberId)
  if (idNum <= 0) return undefined
  const list = rosterList.value
  return (
    list.find((m) => m.id === idNum) ||
    list.find((m) => m.user_id != null && m.user_id === idNum) ||
    list.find((m) => String(m.id) === String(memberId)) ||
    list.find((m) => m.user_id != null && String(m.user_id) === String(memberId))
  )
}

function getTeamMemberName(memberId: unknown): string {
  const m = resolveProjectTeamMember(memberId)
  if (m?.name?.trim()) return m.name.trim()
  if (m?.invited_people?.name?.trim()) return m.invited_people.name.trim()
  if (m?.email) return m.email
  const n = rosterKey(memberId)
  return n > 0 ? `Member #${n}` : 'Unknown'
}

function getTeamMemberSubtitle(memberId: unknown): string {
  const m = resolveProjectTeamMember(memberId)
  if (!m) return ''

  const roleLabel = getDisplayRole({
    role_name: m.user_type || null,
    project_role: m.role_in_project || null,
  })
  const job = m.job_title?.trim()

  if (job && roleLabel && job.toLowerCase() !== roleLabel.toLowerCase()) {
    return `${roleLabel} · ${job}`
  }
  return job || roleLabel || ''
}

function getMemberContactEmail(memberId: unknown): string {
  const m = resolveProjectTeamMember(memberId)
  return (m?.email || m?.invited_people?.email || '').trim()
}

function getMemberContactPhone(memberId: unknown): string {
  const m = resolveProjectTeamMember(memberId)
  return (m?.phone || m?.invited_people?.phone || '').trim()
}

function phoneTelHref(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '')
  if (!cleaned) return '#'
  return `tel:${cleaned}`
}

function getMemberAvatarUrl(memberId: unknown): string | null {
  const m = resolveProjectTeamMember(memberId)
  const fromInvited = m?.invited_people?.avatar?.trim()
  if (fromInvited) return fromInvited
  const full = m?.full_img_url?.trim()
  if (full) return full
  const av = m?.avatar_url?.trim()
  if (av) return av
  return null
}

function markAvatarFailed(memberId: unknown) {
  const k = rosterKey(memberId)
  if (k <= 0) return
  avatarFailed.value = { ...avatarFailed.value, [k]: true }
}

function getTeamMemberInitials(memberId: unknown): string {
  const m = resolveProjectTeamMember(memberId)
  const source = m?.name?.trim() || m?.invited_people?.name?.trim()
  if (source) {
    const parts = source.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
    }
    return source.slice(0, 2).toUpperCase()
  }
  const n = rosterKey(memberId)
  const idStr = String(Math.abs(n))
  return idStr.length <= 2 ? idStr : idStr.slice(-2)
}
</script>

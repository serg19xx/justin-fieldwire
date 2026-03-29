<template>
  <div class="px-4 py-4 max-w-lg mx-auto">
    <section class="mb-6">
      <h1 class="text-xl font-semibold text-gray-900">
        {{ greeting }}, {{ userName }}
      </h1>
      <p class="text-sm text-gray-500 mt-0.5">
        {{ displayRole }}
      </p>
    </section>

    <!-- Overview stats (foreman — full project / crew picture) -->
    <section class="mb-6">
      <h2 class="text-base font-semibold text-gray-900 mb-3">Overview</h2>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-3">
          <div class="p-2 bg-blue-100 rounded-lg flex-shrink-0">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <div class="min-w-0">
            <p class="text-xs font-medium text-gray-600">Active projects</p>
            <p class="text-xl font-bold text-gray-900">{{ activeProjectsCount }}</p>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-3">
          <div class="p-2 bg-green-100 rounded-lg flex-shrink-0">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <div class="min-w-0">
            <p class="text-xs font-medium text-gray-600">Open tasks</p>
            <p class="text-xl font-bold text-gray-900">
              <span v-if="isLoadingMetrics">…</span>
              <span v-else>{{ openTasksTotal }}</span>
            </p>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-3">
          <div class="p-2 bg-purple-100 rounded-lg flex-shrink-0">
            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div class="min-w-0">
            <p class="text-xs font-medium text-gray-600">Team (unique)</p>
            <p class="text-xl font-bold text-gray-900">
              <span v-if="isLoadingMetrics">…</span>
              <span v-else>{{ teamMembersUnique }}</span>
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Recent projects with progress -->
    <section class="mb-6">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-base font-semibold text-gray-900">Recent projects</h2>
        <RouterLink to="/tasks" class="text-sm font-medium text-orange-600 hover:text-orange-700">View all</RouterLink>
      </div>

      <div v-if="isLoading" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
        <div class="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto" />
        <p class="text-sm text-gray-500 mt-3">Loading…</p>
      </div>

      <div v-else-if="projects.length === 0" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
        <p class="text-gray-500 text-sm">No projects yet.</p>
      </div>

      <div v-else class="space-y-3">
        <RouterLink
          v-for="project in recentProjects"
          :key="project.id"
          :to="`/tasks/project/${project.id}`"
          class="block bg-white rounded-xl shadow-sm border border-gray-200 p-4 active:bg-gray-50"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0 flex-1">
              <h3 class="font-medium text-gray-900 truncate">{{ project.prj_name }}</h3>
              <p class="text-xs text-gray-500 mt-0.5">Progress: {{ progressLabel(project.id) }}</p>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <div class="w-20 sm:w-24 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  class="h-2 rounded-full transition-all"
                  :class="progressBarClass(project.id)"
                  :style="{ width: `${progressPct(project.id)}%` }"
                />
              </div>
              <span class="text-xs text-gray-600 w-9 text-right">{{ progressPct(project.id) }}%</span>
            </div>
          </div>
        </RouterLink>
      </div>
    </section>

    <section>
      <h2 class="text-base font-semibold text-gray-900 mb-3">Quick actions</h2>
      <div class="grid grid-cols-2 gap-3">
        <RouterLink
          to="/tasks"
          class="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-gray-200 active:bg-orange-50"
        >
          <span class="text-2xl mb-1" aria-hidden="true">📋</span>
          <span class="text-sm font-medium text-gray-900">All projects</span>
        </RouterLink>
        <RouterLink
          to="/reports"
          class="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-gray-200 active:bg-orange-50"
        >
          <span class="text-2xl mb-1" aria-hidden="true">📊</span>
          <span class="text-sm font-medium text-gray-900">Reports</span>
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/core/stores/auth'
import { getDisplayRole } from '@/core/utils/role-utils'
import type { Project } from '@/core/utils/project-api'
import { projectApi } from '@/core/utils/project-api'
import { fetchProjectsForTaskScope } from '@/core/utils/project-list-for-user'
import { mapApiProjectTeamRowsToRoster } from '@/core/utils/map-api-project-team-response'
import { tasksApi } from '@/core/utils/tasks-api'
import type { TaskStats } from '@/core/types/task'

const authStore = useAuthStore()

const MAX_PROJECTS_FOR_AGGREGATES = 15
const MAX_PROJECTS_FOR_TEAM = 8
const RECENT_PROJECT_LIMIT = 5

const displayRole = computed(() => {
  const u = authStore.currentUser
  if (!u) return ''
  return (
    getDisplayRole({
      role_id: u.role_id,
      role_code: u.role_code,
      role_name: u.role_name,
    }) || u.job_title || ''
  )
})

const userName = computed(() => {
  const u = authStore.currentUser
  return u?.name || u?.first_name || 'User'
})

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
})

const projects = ref<Project[]>([])
const isLoading = ref(true)
const isLoadingMetrics = ref(true)
const openTasksTotal = ref(0)
const teamMembersUnique = ref(0)
/** Task stats avg progress (0–100) per project id */
const progressByProjectId = ref<Map<number, number>>(new Map())

const activeProjectsCount = computed(() => projects.value.length)

const recentProjects = computed(() => projects.value.slice(0, RECENT_PROJECT_LIMIT))

function readNumericField(obj: unknown, ...keys: string[]): number {
  if (!obj || typeof obj !== 'object') return 0
  const r = obj as Record<string, unknown>
  for (const k of keys) {
    const n = Number(r[k])
    if (Number.isFinite(n)) return n
  }
  return 0
}

function coerceAvgProgress(stats: TaskStats | null | undefined): number | null {
  if (!stats) return null
  const v = readNumericField(stats, 'avgProgress', 'avg_progress')
  if (!Number.isFinite(v)) return null
  return Math.min(100, Math.max(0, Math.round(v)))
}

function progressPct(projectId: number): number {
  return progressByProjectId.value.get(projectId) ?? 0
}

function progressLabel(projectId: number): string {
  const p = progressPct(projectId)
  return `${p}%`
}

function progressBarClass(projectId: number): string {
  const p = progressPct(projectId)
  if (p >= 70) return 'bg-green-500'
  if (p >= 40) return 'bg-yellow-500'
  return 'bg-gray-400'
}

async function loadAggregates(slice: Project[]) {
  isLoadingMetrics.value = true
  openTasksTotal.value = 0
  teamMembersUnique.value = 0
  progressByProjectId.value = new Map()

  if (slice.length === 0) {
    isLoadingMetrics.value = false
    return
  }

  try {
    const statsResults = await Promise.all(
      slice.map((p) => tasksApi.getStats(p.id).catch(() => null)),
    )

    let openSum = 0
    const nextProgress = new Map<number, number>()
    slice.forEach((p, i) => {
      const s = statsResults[i]
      if (s) {
        const total = readNumericField(s, 'total', 'Total')
        const done = readNumericField(s, 'completed', 'Completed', 'done', 'Done')
        openSum += Math.max(0, total - done)
        const ap = coerceAvgProgress(s)
        if (ap != null) nextProgress.set(p.id, ap)
      }
    })
    openTasksTotal.value = openSum
    progressByProjectId.value = nextProgress

    const teamSlice = slice.slice(0, MAX_PROJECTS_FOR_TEAM)
    const teamResponses = await Promise.all(
      teamSlice.map((p) => projectApi.getTeamMembers(p.id).catch(() => null)),
    )
    const seen = new Set<number>()
    for (const tr of teamResponses) {
      if (!tr) continue
      const roster = mapApiProjectTeamRowsToRoster(tr)
      for (const m of roster) {
        if (m.user_id != null && m.user_id > 0) seen.add(m.user_id)
      }
    }
    teamMembersUnique.value = seen.size
  } catch {
    openTasksTotal.value = 0
    teamMembersUnique.value = 0
  } finally {
    isLoadingMetrics.value = false
  }
}

onMounted(async () => {
  isLoading.value = true
  try {
    projects.value = await fetchProjectsForTaskScope(authStore.currentUser, { page: 1, limit: 50 })
    await loadAggregates(projects.value.slice(0, MAX_PROJECTS_FOR_AGGREGATES))
  } catch {
    projects.value = []
    await loadAggregates([])
  } finally {
    isLoading.value = false
  }
})
</script>

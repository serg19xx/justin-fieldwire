<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/core/stores/auth'
import type { Task } from '@/core/types/task'
import { isMilestone } from '@/core/types/task'
import { projectApi, type Project, type ProjectTeamMember } from '@/core/utils/project-api'
import {
  getProjectListQueryFiltersForUser,
  parseProjectsFromListResponse,
} from '@/core/utils/project-list-for-user'
import { mapApiProjectTeamRowsToRoster } from '@/core/utils/map-api-project-team-response'
import { tasksApi } from '@/core/utils/tasks-api'
import { addDays, startOfWeekMonday, toYmd } from '@/core/utils/week-utils'

interface PlanCellItem {
  taskId: string
  projectId: number
  projectName: string
  taskName: string
  place: string
  timeLabel: string
}

const authStore = useAuthStore()

const projects = ref<Project[]>([])
const teamMembers = ref<ProjectTeamMember[]>([])
const isLoadingProjects = ref(true)
const isLoadingTeams = ref(false)
const isLoadingTasks = ref(false)
const loadError = ref('')
const tasksError = ref('')

/** Monday of the visible week */
const weekMonday = ref(startOfWeekMonday(new Date()))

const weekStartYmd = computed(() => toYmd(weekMonday.value))
const weekEndYmd = computed(() => toYmd(addDays(weekMonday.value, 6)))

const weekDays = computed(() => {
  const days: { ymd: string; label: string; short: string }[] = []
  for (let i = 0; i < 7; i++) {
    const d = addDays(weekMonday.value, i)
    const ymd = toYmd(d)
    days.push({
      ymd,
      label: d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
      short: d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
    })
  }
  return days
})

const weekRangeLabel = computed(() => {
  const a = weekMonday.value.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const b = addDays(weekMonday.value, 6).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return `${a} – ${b}`
})

const projectNameById = computed(() => {
  const map = new Map<number, string>()
  for (const p of projects.value) {
    map.set(p.id, (p.prj_name || '').trim() || `Project #${p.id}`)
  }
  return map
})

const projectAddressById = computed(() => {
  const map = new Map<number, string>()
  for (const p of projects.value) {
    const addr = typeof p.address === 'string' ? p.address.trim() : ''
    if (addr) map.set(p.id, addr)
  }
  return map
})

/** userId → ymd → cells */
const cellsByUserDay = ref<Map<number, Map<string, PlanCellItem[]>>>(new Map())

const sortedWorkers = computed(() => {
  return [...teamMembers.value]
    .filter((m) => m.user_id != null && Number(m.user_id) > 0)
    .sort((a, b) => {
      const na = (a.name || a.email || `User #${a.user_id}`).toLowerCase()
      const nb = (b.name || b.email || `User #${b.user_id}`).toLowerCase()
      return na.localeCompare(nb)
    })
})

function workerLabel(m: ProjectTeamMember): string {
  const name = (m.name || '').trim()
  if (name) return name
  const email = (m.email || '').trim()
  if (email) return email
  return `User #${m.user_id}`
}

function sliceYmd(raw: string | undefined | null): string {
  if (!raw) return ''
  const s = String(raw).trim()
  return s.length >= 10 ? s.slice(0, 10) : s
}

function formatTimeHm(raw: string | undefined): string {
  if (!raw) return ''
  const t = String(raw).trim()
  if (/^\d{2}:\d{2}/.test(t)) return t.slice(0, 5)
  return ''
}

function taskPeopleIds(task: Task): number[] {
  const ids = new Set<number>()
  if (task.task_lead_id != null && Number(task.task_lead_id) > 0) {
    ids.add(Number(task.task_lead_id))
  }
  for (const id of task.team_members ?? []) {
    if (Number(id) > 0) ids.add(Number(id))
  }
  for (const id of task.assignees ?? []) {
    if (Number(id) > 0) ids.add(Number(id))
  }
  return [...ids]
}

function taskOverlapsDay(task: Task, ymd: string): boolean {
  const start = sliceYmd(task.start_planned)
  if (!start) return false
  const end = sliceYmd(task.end_planned) || start
  return start <= ymd && ymd <= end
}

function buildCellItem(task: Task): PlanCellItem {
  const projectId = Number(task.project_id)
  const projectName = projectNameById.value.get(projectId) || `Project #${projectId}`
  const place =
    (task.address || '').trim() || projectAddressById.value.get(projectId) || ''
  const st = formatTimeHm(task.start_time)
  const et = formatTimeHm(task.end_time)
  let timeLabel = ''
  if (st && et) timeLabel = `${st}–${et}`
  else if (st) timeLabel = st
  else if (et) timeLabel = `until ${et}`

  return {
    taskId: String(task.id),
    projectId,
    projectName,
    taskName: (task.name || '').trim() || `Task #${task.id}`,
    place,
    timeLabel,
  }
}

async function mapPool<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  async function worker(): Promise<void> {
    while (next < items.length) {
      const idx = next++
      results[idx] = await fn(items[idx]!)
    }
  }
  const n = Math.min(Math.max(1, concurrency), Math.max(1, items.length))
  await Promise.all(Array.from({ length: n }, () => worker()))
  return results
}

async function loadProjectsList(): Promise<void> {
  isLoadingProjects.value = true
  loadError.value = ''
  try {
    const filters = getProjectListQueryFiltersForUser(authStore.currentUser)
    const data = await projectApi.getAll(1, 200, filters)
    projects.value = parseProjectsFromListResponse(data)
  } catch (e) {
    console.error('Failed to load projects for work plan', e)
    loadError.value = 'Failed to load projects.'
    projects.value = []
  } finally {
    isLoadingProjects.value = false
  }
}

async function loadUnionTeamMembers(): Promise<void> {
  if (projects.value.length === 0) {
    teamMembers.value = []
    return
  }
  isLoadingTeams.value = true
  try {
    const rosters = await mapPool(projects.value, 6, async (p) => {
      const teamRes = await projectApi.getTeamMembers(p.id).catch(() => null)
      return mapApiProjectTeamRowsToRoster(teamRes)
    })
    const byUser = new Map<number, ProjectTeamMember>()
    for (const mapped of rosters) {
      for (const m of mapped) {
        const uid = Number(m.user_id)
        if (!Number.isFinite(uid) || uid <= 0) continue
        if (!byUser.has(uid)) byUser.set(uid, m)
      }
    }
    teamMembers.value = [...byUser.values()]
  } catch (e) {
    console.error('Failed to load teams for work plan', e)
    teamMembers.value = []
  } finally {
    isLoadingTeams.value = false
  }
}

async function loadWeekTasks(): Promise<void> {
  if (projects.value.length === 0) {
    cellsByUserDay.value = new Map()
    return
  }
  isLoadingTasks.value = true
  tasksError.value = ''
  try {
    const from = weekStartYmd.value
    const to = weekEndYmd.value
    const batches = await mapPool(projects.value, 4, async (p) => {
      try {
        const res = await tasksApi.getAll(p.id, undefined, undefined, {
          dateRange: { start: from, end: to },
          taskType: 'all',
        })
        return res.tasks
      } catch (e) {
        console.error('Failed to load tasks for project', p.id, e)
        return [] as Task[]
      }
    })

    const next = new Map<number, Map<string, PlanCellItem[]>>()
    const ymds = weekDays.value.map((d) => d.ymd)

    for (const tasks of batches) {
      for (const task of tasks) {
        if (isMilestone(task.milestone)) continue
        const people = taskPeopleIds(task)
        if (people.length === 0) continue
        const item = buildCellItem(task)
        for (const ymd of ymds) {
          if (!taskOverlapsDay(task, ymd)) continue
          for (const uid of people) {
            let byDay = next.get(uid)
            if (!byDay) {
              byDay = new Map()
              next.set(uid, byDay)
            }
            const list = byDay.get(ymd) ?? []
            if (!list.some((c) => c.taskId === item.taskId && c.projectId === item.projectId)) {
              list.push(item)
            }
            byDay.set(ymd, list)
          }
        }
      }
    }

    cellsByUserDay.value = next
  } catch (e) {
    console.error('Failed to build work plan sheet', e)
    tasksError.value = 'Failed to load tasks for this week.'
    cellsByUserDay.value = new Map()
  } finally {
    isLoadingTasks.value = false
  }
}

function cellItems(userId: number | null | undefined, ymd: string): PlanCellItem[] {
  if (userId == null || userId <= 0) return []
  return cellsByUserDay.value.get(userId)?.get(ymd) ?? []
}

function taskDetailTo(item: PlanCellItem): string {
  return `/tasks/projects/${item.projectId}/tasks/${item.taskId}`
}

function shiftWeek(delta: number): void {
  weekMonday.value = startOfWeekMonday(addDays(weekMonday.value, delta * 7))
}

function goThisWeek(): void {
  weekMonday.value = startOfWeekMonday(new Date())
}

onMounted(async () => {
  await loadProjectsList()
  await loadUnionTeamMembers()
  await loadWeekTasks()
})

watch(weekStartYmd, () => {
  void loadWeekTasks()
})
</script>

<template>
  <div class="min-h-screen bg-gray-100 pb-10">
    <div class="border-b border-gray-200 bg-white">
      <div class="max-w-6xl mx-auto px-4 py-3">
        <div class="flex flex-wrap items-center gap-2">
          <h1 class="text-lg font-semibold text-gray-900">Work plan (from tasks)</h1>
          <span
            class="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-700"
          >
            Read-only
          </span>
        </div>
        <p class="mt-1 text-sm text-gray-600 max-w-3xl">
          Read-only view of projects and tasks. Places, people, and planned times come from tasks.
          Do not treat this as a second place to edit the plan — one source of truth is the task
          data.
        </p>
        <p class="mt-2 text-sm">
          <RouterLink to="/schedule" class="font-medium text-blue-700 hover:text-blue-800 underline-offset-2 hover:underline">
            Open interactive Schedule
          </RouterLink>
          <span class="text-gray-500">
            — day timesheet by project and place (editable). Separate from task field work.
          </span>
        </p>
      </div>
    </div>

    <div class="max-w-6xl mx-auto px-4 pt-4 space-y-3">
      <div
        v-if="loadError"
        class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
      >
        {{ loadError }}
      </div>
      <div
        v-if="tasksError"
        class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
      >
        {{ tasksError }}
      </div>

      <div
        class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm"
      >
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
            @click="shiftWeek(-1)"
          >
            Prev
          </button>
          <button
            type="button"
            class="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
            @click="goThisWeek"
          >
            This week
          </button>
          <button
            type="button"
            class="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
            @click="shiftWeek(1)"
          >
            Next
          </button>
        </div>
        <div class="text-sm text-gray-700">
          <span class="font-medium text-gray-900">{{ weekRangeLabel }}</span>
          <span class="text-gray-500"> · week starts {{ weekStartYmd }}</span>
        </div>
      </div>

      <div
        v-if="isLoadingProjects || isLoadingTeams"
        class="flex justify-center py-16"
      >
        <div class="animate-spin w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>

      <div
        v-else-if="projects.length === 0"
        class="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500"
      >
        No projects available.
      </div>

      <div
        v-else-if="sortedWorkers.length === 0"
        class="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500"
      >
        No team members found across your projects.
      </div>

      <div v-else class="relative">
        <div
          v-if="isLoadingTasks"
          class="absolute inset-0 z-10 flex items-start justify-center rounded-xl bg-white/60 pt-24"
        >
          <div class="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>

        <div class="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table class="min-w-[56rem] w-full border-collapse text-left text-xs">
            <thead>
              <tr class="border-b border-gray-200 bg-gray-50">
                <th
                  class="sticky left-0 z-[1] min-w-[8.5rem] bg-gray-50 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500"
                >
                  Person
                </th>
                <th
                  v-for="day in weekDays"
                  :key="day.ymd"
                  class="min-w-[9.5rem] border-l border-gray-100 px-2 py-2.5 font-semibold text-gray-800"
                >
                  <span class="hidden sm:inline">{{ day.label }}</span>
                  <span class="sm:hidden">{{ day.short }}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="worker in sortedWorkers"
                :key="worker.user_id ?? worker.id"
                class="border-b border-gray-100 align-top last:border-b-0"
              >
                <th
                  class="sticky left-0 z-[1] bg-white px-3 py-2.5 text-sm font-medium text-gray-900 shadow-[1px_0_0_0_rgba(0,0,0,0.06)]"
                >
                  {{ workerLabel(worker) }}
                </th>
                <td
                  v-for="day in weekDays"
                  :key="`${worker.user_id}-${day.ymd}`"
                  class="border-l border-gray-50 px-1.5 py-1.5"
                >
                  <template v-if="cellItems(worker.user_id, day.ymd).length">
                    <ul class="space-y-1">
                      <li
                        v-for="item in cellItems(worker.user_id, day.ymd)"
                        :key="`${item.projectId}-${item.taskId}`"
                        class="rounded-md border border-orange-100 bg-orange-50/70 px-1.5 py-1"
                      >
                        <RouterLink
                          :to="taskDetailTo(item)"
                          class="block font-medium text-orange-950 hover:underline"
                        >
                          {{ item.taskName }}
                        </RouterLink>
                        <p class="text-[10px] text-gray-700 truncate">{{ item.projectName }}</p>
                        <p v-if="item.place" class="text-[10px] text-gray-500 truncate">
                          {{ item.place }}
                        </p>
                        <p v-if="item.timeLabel" class="text-[10px] font-medium text-gray-600">
                          {{ item.timeLabel }}
                        </p>
                      </li>
                    </ul>
                  </template>
                  <span v-else class="block px-1 py-2 text-gray-300">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

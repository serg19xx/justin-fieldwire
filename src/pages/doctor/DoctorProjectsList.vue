<template>
  <div class="px-4 py-6 md:px-8 max-w-7xl mx-auto">
    <!-- Header Banner -->
    <div class="bg-gradient-to-r from-teal-700 to-teal-900 rounded-xl p-6 text-white mb-6 shadow-md">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span class="inline-block text-xs uppercase tracking-wider font-semibold bg-teal-800/80 px-2.5 py-1 rounded text-teal-200 mb-2 border border-teal-600/50">
            Doctor Client Portal
          </span>
          <h1 class="text-2xl md:text-3xl font-bold tracking-tight">
            My Construction Projects
          </h1>
          <p class="text-teal-100 text-sm mt-1 max-w-2xl">
            Track your medical clinic project progress step by step, review architectural drawings, documents, scheduled milestones, and site photos.
          </p>
        </div>
        <div class="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 text-center shrink-0">
          <p class="text-xs uppercase tracking-wider text-teal-200 font-medium">Assigned Projects</p>
          <p class="text-2xl font-bold text-white mt-0.5">{{ filteredProjects.length }}</p>
        </div>
      </div>
    </div>

    <!-- Search & Filters Toolbar -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="flex-1 relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search projects by name, address, or stage..."
            class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
          />
          <span class="absolute left-3 top-2.5 text-gray-400 text-sm font-bold">Q</span>
        </div>
        <div class="sm:w-56">
          <select
            v-model="stageFilter"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white text-gray-700"
          >
            <option value="">All Stages</option>
            <option value="Initial Contact Lead">Initial Contact Lead</option>
            <option value="Waiting On Direction">Waiting On Direction</option>
            <option value="Actively Looking For A Location">Actively Looking For A Location</option>
            <option value="Securing Location">Securing Location</option>
            <option value="Project Secured">Project Secured</option>
            <option value="Construction">Construction</option>
            <option value="Completed Project">Completed Project</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="py-16 text-center">
      <div class="inline-block animate-spin rounded-full h-9 w-9 border-b-2 border-teal-600 mb-3"></div>
      <p class="text-sm text-gray-600">Loading your projects...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="errorMessage" class="bg-red-50 border border-red-200 rounded-lg p-5 text-center my-6">
      <p class="text-sm font-medium text-red-800">{{ errorMessage }}</p>
      <button
        type="button"
        @click="loadProjects"
        class="mt-3 px-4 py-1.5 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700"
      >
        Retry
      </button>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="filteredProjects.length === 0"
      class="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center my-6"
    >
      <div class="w-14 h-14 bg-teal-50 text-teal-700 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
        Rx
      </div>
      <h3 class="text-base font-semibold text-gray-900 mb-1">
        No projects found
      </h3>
      <p class="text-sm text-gray-500 max-w-md mx-auto">
        {{
          searchQuery || stageFilter
            ? 'No projects match your search filters. Try clearing the filters.'
            : 'You are currently not listed as the primary physician on any active project. Once your Project Manager attaches your profile, your projects will appear here.'
        }}
      </p>
      <button
        v-if="searchQuery || stageFilter"
        type="button"
        @click="clearFilters"
        class="mt-4 px-3.5 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 rounded-md hover:bg-teal-100"
      >
        Clear filters
      </button>
    </div>

    <!-- Projects Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="project in filteredProjects"
        :key="project.id"
        class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
      >
        <!-- Card Top Bar -->
        <div class="p-5 flex-1 flex flex-col">
          <div class="flex items-start justify-between gap-3 mb-2">
            <span
              class="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
              :class="getStageBadgeClass(project.status)"
            >
              {{ project.status || 'Draft' }}
            </span>
            <span
              v-if="project.priority"
              class="text-[11px] font-medium text-gray-500 uppercase tracking-wide"
            >
              {{ project.priority }}
            </span>
          </div>

          <h2 class="text-lg font-bold text-gray-900 line-clamp-1 mb-1">
            {{ project.prj_name }}
          </h2>

          <p v-if="project.address" class="text-xs text-gray-600 line-clamp-1 mb-3">
            {{ project.address }}
          </p>

          <p v-if="project.description" class="text-xs text-gray-500 line-clamp-2 mb-4">
            {{ project.description }}
          </p>

          <!-- Spec Badges -->
          <div class="mt-auto pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div>
              <span class="text-gray-400 block text-[10px] uppercase">Clinic Model</span>
              <span class="font-medium text-gray-800 truncate block">
                {{ project.clinic_model_type || 'Standard' }}
              </span>
            </div>
            <div>
              <span class="text-gray-400 block text-[10px] uppercase">Size</span>
              <span class="font-medium text-gray-800 truncate block">
                {{ project.area ? `${project.area} sq ft` : 'Unspecified' }}
              </span>
            </div>
            <div>
              <span class="text-gray-400 block text-[10px] uppercase">Start Date</span>
              <span class="font-medium text-gray-800 truncate block">
                {{ formatDate(project.date_start) }}
              </span>
            </div>
            <div>
              <span class="text-gray-400 block text-[10px] uppercase">Target Completion</span>
              <span class="font-medium text-gray-800 truncate block">
                {{ formatDate(project.date_end) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Card Footer Action -->
        <div class="bg-gray-50 px-5 py-3 border-t border-gray-100 flex items-center justify-between">
          <span class="text-xs font-medium text-teal-800">View Only Access</span>
          <RouterLink
            :to="`/doctor/projects/${project.id}`"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-md text-xs font-semibold transition-colors"
          >
            <span>Follow Project</span>
            <span aria-hidden="true">→</span>
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/core/stores/auth'
import { projectApi, type Project } from '@/core/utils/project-api'
import { parseProjectsFromListResponse, filterProjectsForDoctorUser } from '@/core/utils/project-list-for-user'

const authStore = useAuthStore()

const isLoading = ref(true)
const errorMessage = ref('')
const allProjects = ref<Project[]>([])
const searchQuery = ref('')
const stageFilter = ref('')

async function loadProjects(): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const raw = await projectApi.getAll(1, 200)
    const list = parseProjectsFromListResponse(raw)
    const user = authStore.currentUser
    if (user) {
      allProjects.value = filterProjectsForDoctorUser(list, user)
    } else {
      allProjects.value = []
    }
  } catch (err: unknown) {
    console.error('Failed to load doctor projects:', err)
    errorMessage.value = 'Failed to load projects. Please refresh or check your connection.'
  } finally {
    isLoading.value = false
  }
}

const filteredProjects = computed(() => {
  let list = allProjects.value

  if (stageFilter.value) {
    list = list.filter((p) => p.status === stageFilter.value)
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter((p) => {
      const name = (p.prj_name || '').toLowerCase()
      const addr = (p.address || '').toLowerCase()
      const desc = (p.description || '').toLowerCase()
      const status = (p.status || '').toLowerCase()
      return name.includes(q) || addr.includes(q) || desc.includes(q) || status.includes(q)
    })
  }

  return list
})

function clearFilters(): void {
  searchQuery.value = ''
  stageFilter.value = ''
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return 'TBD'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function getStageBadgeClass(status?: string | null): string {
  const s = (status || '').toLowerCase()
  if (s.includes('completed')) return 'bg-emerald-100 text-emerald-800'
  if (s.includes('construction')) return 'bg-blue-100 text-blue-800'
  if (s.includes('secured')) return 'bg-indigo-100 text-indigo-800'
  if (s.includes('securing') || s.includes('looking')) return 'bg-amber-100 text-amber-800'
  return 'bg-gray-100 text-gray-700'
}

onMounted(() => {
  void loadProjects()
})
</script>

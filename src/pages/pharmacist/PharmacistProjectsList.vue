<template>
  <div class="px-4 py-6 md:px-8 max-w-7xl mx-auto">
    <!-- Header Banner -->
    <div class="bg-gradient-to-r from-emerald-700 to-teal-800 rounded-xl p-6 text-white mb-6 shadow-md">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span class="inline-block text-xs uppercase tracking-wider font-semibold bg-emerald-900/80 px-2.5 py-1 rounded text-emerald-200 mb-2 border border-emerald-600/50">
            Pharmacist Portal • Secondary Client
          </span>
          <h1 class="text-2xl md:text-3xl font-bold tracking-tight">
            My Associated Projects
          </h1>
          <p class="text-teal-100 text-sm mt-1 max-w-2xl">
            Projects where you are attached as an additional client / pharmacy partner. Access drawings, pharmacy resources, calendar milestones, site photos, and analytics.
          </p>
        </div>
        <div class="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 text-center shrink-0">
          <p class="text-xs uppercase tracking-wider text-emerald-200 font-medium">Assigned Projects</p>
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
            placeholder="Search projects by name or stage..."
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
      <p class="text-sm text-gray-600">Loading your associated projects...</p>
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
        No associated projects
      </h3>
      <p class="text-sm text-gray-500 max-w-md mx-auto">
        {{
          searchQuery || stageFilter
            ? 'No projects match your search filters.'
            : 'You are currently not attached as an additional client on any active projects. You can browse location opportunities in the Marketplace tab.'
        }}
      </p>
      <div class="mt-4 flex items-center justify-center gap-3">
        <RouterLink
          to="/pharmacist/marketplace"
          class="px-4 py-2 bg-teal-700 text-white rounded-md text-xs font-semibold hover:bg-teal-800"
        >
          Go to Marketplace
        </RouterLink>
      </div>
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
            <span class="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Secondary Client
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

          <div class="mt-auto pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div>
              <span class="text-gray-400 block text-[10px] uppercase">Clinic Model</span>
              <span class="font-medium text-gray-800 truncate block">
                {{ project.clinic_model_type || 'Standard' }}
              </span>
            </div>
            <div>
              <span class="text-gray-400 block text-[10px] uppercase">Space Size</span>
              <span class="font-medium text-gray-800 truncate block">
                {{ project.area ? `${project.area} sq ft` : 'Unspecified' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Footer Action -->
        <div class="bg-gray-50 px-5 py-3 border-t border-gray-100 flex items-center justify-between">
          <span class="text-xs font-medium text-gray-600">View Drawings & Calendar</span>
          <RouterLink
            :to="`/pharmacist/projects/${project.id}`"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-md text-xs font-semibold transition-colors"
          >
            <span>Open Project</span>
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
import { parseProjectsFromListResponse, filterProjectsForPharmacistSecondaryUser } from '@/core/utils/project-list-for-user'

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
      allProjects.value = filterProjectsForPharmacistSecondaryUser(list, user)
    } else {
      allProjects.value = []
    }
  } catch (err) {
    console.error('Failed to load pharmacist secondary projects:', err)
    errorMessage.value = 'Failed to load projects. Please refresh.'
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
      const desc = (p.description || '').toLowerCase()
      return name.includes(q) || desc.includes(q)
    })
  }

  return list
})

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

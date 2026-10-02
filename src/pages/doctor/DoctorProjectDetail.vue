<template>
  <div class="min-h-screen bg-gray-100 flex flex-col">
    <!-- Top Bar -->
    <header class="bg-white border-b border-gray-200 px-4 py-3 sticky top-12 z-30 shadow-xs">
      <div class="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="flex items-center gap-3">
          <RouterLink
            to="/doctor/projects"
            class="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 px-2.5 py-1.5 rounded-md hover:bg-teal-100 transition-colors"
          >
            <span>←</span>
            <span>Back to My Projects</span>
          </RouterLink>

          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-base sm:text-lg font-bold text-gray-900 truncate max-w-md">
                {{ project?.prj_name || 'Loading Project...' }}
              </h1>
              <span
                v-if="project?.status"
                class="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full"
                :class="getStageBadgeClass(project?.status)"
              >
                {{ project.status }}
              </span>
            </div>
            <p v-if="project?.address" class="text-xs text-gray-500 truncate max-w-lg mt-0.5">
              {{ project.address }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <span class="inline-flex items-center gap-1 text-[11px] font-medium text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full">
            <span class="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
            Doctor View (Read-Only)
          </span>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="max-w-7xl mx-auto mt-3 overflow-x-auto">
        <nav class="flex space-x-1 sm:space-x-2 border-b border-gray-100 pb-0" aria-label="Tabs">
          <button
            v-for="tab in doctorTabs"
            :key="tab.id"
            type="button"
            @click="activeTab = tab.id"
            class="px-3 py-2 text-xs sm:text-sm font-medium rounded-t-md border-b-2 -mb-px transition-colors whitespace-nowrap"
            :class="
              activeTab === tab.id
                ? 'border-teal-600 text-teal-700 bg-teal-50/50 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            "
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>
    </header>

    <!-- Main Tab Content Area -->
    <main class="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
      <!-- Loading State -->
      <div v-if="isLoading" class="py-20 text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mb-3"></div>
        <p class="text-sm text-gray-600">Loading project details...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="errorMessage" class="bg-red-50 border border-red-200 rounded-lg p-6 text-center my-8">
        <p class="text-sm font-medium text-red-800 mb-3">{{ errorMessage }}</p>
        <RouterLink
          to="/doctor/projects"
          class="inline-block px-4 py-2 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700"
        >
          Return to My Projects
        </RouterLink>
      </div>

      <!-- Tab 1: Project Overview (Profile) -->
      <div v-else-if="activeTab === 'overview'" class="space-y-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 class="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            Project Overview & Schedule
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="bg-gray-50 p-3.5 rounded-lg border border-gray-100">
              <span class="text-[11px] font-semibold uppercase text-gray-400 block">Stage</span>
              <span class="text-sm font-bold text-gray-900 mt-0.5 block">
                {{ project?.status || 'Draft' }}
              </span>
            </div>
            <div class="bg-gray-50 p-3.5 rounded-lg border border-gray-100">
              <span class="text-[11px] font-semibold uppercase text-gray-400 block">Space Size</span>
              <span class="text-sm font-bold text-gray-900 mt-0.5 block">
                {{ project?.area ? `${project.area} sq ft` : 'Not specified' }}
              </span>
            </div>
            <div class="bg-gray-50 p-3.5 rounded-lg border border-gray-100">
              <span class="text-[11px] font-semibold uppercase text-gray-400 block">Start Date</span>
              <span class="text-sm font-bold text-gray-900 mt-0.5 block">
                {{ formatDate(project?.date_start) }}
              </span>
            </div>
            <div class="bg-gray-50 p-3.5 rounded-lg border border-gray-100">
              <span class="text-[11px] font-semibold uppercase text-gray-400 block">Target Completion</span>
              <span class="text-sm font-bold text-gray-900 mt-0.5 block">
                {{ formatDate(project?.date_end) }}
              </span>
            </div>
          </div>

          <div v-if="project?.description" class="mb-6">
            <h3 class="text-xs font-semibold uppercase text-gray-500 mb-1.5">Project Description</h3>
            <p class="text-sm text-gray-700 bg-gray-50 p-3.5 rounded-lg border border-gray-100 leading-relaxed">
              {{ project.description }}
            </p>
          </div>

          <!-- Medical Clinic Specifications -->
          <h3 class="text-xs font-semibold uppercase text-gray-500 mb-3 pt-2">
            Clinic Specifications
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div class="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <span class="text-gray-400 block mb-0.5">Clinic Model</span>
              <span class="font-semibold text-gray-800">{{ project?.clinic_model_type || 'Standard Practice' }}</span>
            </div>
            <div class="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <span class="text-gray-400 block mb-0.5">Purchase or Lease</span>
              <span class="font-semibold text-gray-800">{{ project?.purchase_or_lease || 'Undecided' }}</span>
            </div>
            <div class="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <span class="text-gray-400 block mb-0.5">Total Doctors</span>
              <span class="font-semibold text-gray-800">{{ project?.total_doctors || '1' }}</span>
            </div>
            <div class="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <span class="text-gray-400 block mb-0.5">Team Size Model</span>
              <span class="font-semibold text-gray-800">{{ project?.long_term_fm_team_size || 'N/A' }}</span>
            </div>
            <div class="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <span class="text-gray-400 block mb-0.5">Patient Daily Volume</span>
              <span class="font-semibold text-gray-800">{{ project?.daily_patient_volumes || 'N/A' }}</span>
            </div>
            <div class="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <span class="text-gray-400 block mb-0.5">Clinical Hours On Site</span>
              <span class="font-semibold text-gray-800">{{ project?.est_clinical_hours_mds_on_site || 'N/A' }}</span>
            </div>
          </div>

          <!-- Inclusions & Services -->
          <div v-if="project?.healthcare_services?.length" class="mt-5">
            <h4 class="text-xs font-semibold text-gray-500 uppercase mb-2">Healthcare Services</h4>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="svc in project.healthcare_services"
                :key="svc"
                class="inline-block px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-md text-xs font-medium"
              >
                {{ svc }}
              </span>
            </div>
          </div>

          <div v-if="project?.project_inclusions?.length" class="mt-4">
            <h4 class="text-xs font-semibold text-gray-500 uppercase mb-2">Project Inclusions</h4>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="inc in project.project_inclusions"
                :key="inc"
                class="inline-block px-2.5 py-1 bg-gray-100 text-gray-800 border border-gray-200 rounded-md text-xs"
              >
                {{ inc }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 2: Plans (Documents, Drawings, Resources MD) -->
      <div v-else-if="activeTab === 'plans'">
        <div class="mb-3 px-1">
          <p class="text-xs text-gray-500">
            Available folders: Documents, Drawings, Resources MD (view & download only)
          </p>
        </div>
        <PlansSection
          v-if="project?.id"
          :project="project"
          :allowed-folder-names="['Documents', 'Drawings', 'Resources MD']"
          :read-only="true"
        />
      </div>

      <!-- Tab 3: Tasks (Jobsite Milestones & Tasks) -->
      <div v-else-if="activeTab === 'tasks'">
        <TasksSection
          v-if="project?.id"
          :project-id="project.id"
          :project="project"
          :can-edit="false"
        />
      </div>

      <!-- Tab 4: Calendar -->
      <div v-else-if="activeTab === 'calendar'">
        <ProjectUserCalendarSection
          v-if="project?.id"
          :project-id="project.id"
          :project-address="project.address"
        />
      </div>

      <!-- Tab 5: Photos -->
      <div v-else-if="activeTab === 'photos'">
        <PhotosSection
          v-if="project?.id"
          :project="project"
          :can-edit="false"
        />
      </div>

      <!-- Tab 6: Reports -->
      <div v-else-if="activeTab === 'reports'">
        <ProjectReportsSection
          v-if="project?.id"
          :project-id="project.id"
        />
      </div>

      <!-- Tab 7: Settings (Read-Only) -->
      <div v-else-if="activeTab === 'settings'">
        <SettingsSection
          v-if="project?.id"
          :project="(project as any)"
          :can-edit="false"
        />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { projectApi, type Project } from '@/core/utils/project-api'
import PlansSection from '@/pages/projects/PlansSection.vue'
import TasksSection from '@/pages/projects/TasksSection.vue'
import PhotosSection from '@/pages/projects/PhotosSection.vue'
import SettingsSection from '@/pages/projects/SettingsSection.vue'
import ProjectUserCalendarSection from '@/components/projects/ProjectUserCalendarSection.vue'
import ProjectReportsSection from '@/pages/projects/ProjectReportsSection.vue'

const route = useRoute()

const isLoading = ref(true)
const errorMessage = ref('')
const project = ref<Project | null>(null)
const activeTab = ref<'overview' | 'plans' | 'tasks' | 'calendar' | 'photos' | 'reports' | 'settings'>('overview')

// Doctor View tabs as defined in Accounts-Doctor.pdf (NO Team tab!)
const doctorTabs = [
  { id: 'overview' as const, label: 'Profile' },
  { id: 'plans' as const, label: 'Plans & Drawings' },
  { id: 'tasks' as const, label: 'Tasks' },
  { id: 'calendar' as const, label: 'Calendar' },
  { id: 'photos' as const, label: 'Photos' },
  { id: 'reports' as const, label: 'Reports' },
  { id: 'settings' as const, label: 'Settings' },
]

async function loadProject(): Promise<void> {
  const projectId = Number(route.params.id)
  if (!projectId || isNaN(projectId)) {
    errorMessage.value = 'Invalid project ID provided.'
    isLoading.value = false
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const data = await projectApi.getById(projectId)
    project.value = data
  } catch (err: unknown) {
    console.error('Failed to load project for doctor:', err)
    errorMessage.value = 'Unable to load project details or access is restricted.'
  } finally {
    isLoading.value = false
  }
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
  void loadProject()
})
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex flex-col">
    <!-- Top Bar -->
    <header class="bg-white border-b border-gray-200 px-4 py-3 sticky top-12 z-30 shadow-xs">
      <div class="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="flex items-center gap-3">
          <RouterLink
            to="/pharmacist/projects"
            class="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 px-2.5 py-1.5 rounded-md hover:bg-teal-100 transition-colors"
          >
            <span>←</span>
            <span>Back to Associated Projects</span>
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
          <span class="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Secondary Client (Pharmacy Access)
          </span>
        </div>
      </div>

      <!-- Navigation Tabs (Only the 5 sections allowed in Accounts-Pharmacy.pdf) -->
      <div class="max-w-7xl mx-auto mt-3 overflow-x-auto">
        <nav class="flex space-x-1 sm:space-x-2 border-b border-gray-100 pb-0" aria-label="Tabs">
          <button
            v-for="tab in pharmaTabs"
            :key="tab.id"
            type="button"
            @click="activeTab = tab.id"
            class="px-3 py-2 text-xs sm:text-sm font-medium rounded-t-md border-b-2 -mb-px transition-colors whitespace-nowrap"
            :class="
              activeTab === tab.id
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            "
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>
    </header>

    <!-- Main Content Area -->
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
          to="/pharmacist/projects"
          class="inline-block px-4 py-2 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700"
        >
          Return to Projects
        </RouterLink>
      </div>

      <!-- Tab 1: Live Analytics -->
      <div v-else-if="activeTab === 'analytics'" class="space-y-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
            <div>
              <h2 class="text-base font-bold text-gray-900">Live Project Analytics</h2>
              <p class="text-xs text-gray-500 mt-0.5">Real-time clinic setup parameters, space allocations, and readiness metrics</p>
            </div>
            <span class="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              Live Data
            </span>
          </div>

          <!-- Key Metrics -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <span class="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block">Stage</span>
              <span class="text-base font-bold text-gray-900 mt-1 block">{{ project?.status || 'Active' }}</span>
            </div>
            <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <span class="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block">Total Space Area</span>
              <span class="text-base font-bold text-gray-900 mt-1 block">{{ project?.area ? `${project.area} sq ft` : 'Standard' }}</span>
            </div>
            <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <span class="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block">Doctors On Site</span>
              <span class="text-base font-bold text-gray-900 mt-1 block">{{ project?.total_doctors || '1' }}</span>
            </div>
            <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <span class="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block">Daily Patients (Est.)</span>
              <span class="text-base font-bold text-gray-900 mt-1 block">{{ project?.daily_patient_volumes || 'N/A' }}</span>
            </div>
          </div>

          <!-- Space Contents & Clinical Breakdown -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div class="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
              <h3 class="font-bold text-gray-900 text-xs uppercase tracking-wider">Clinical Model Parameters</h3>
              <div class="divide-y divide-gray-200/60">
                <div class="py-2 flex justify-between">
                  <span class="text-gray-500">Clinic Model:</span>
                  <span class="font-semibold text-gray-800">{{ project?.clinic_model_type || 'Standard' }}</span>
                </div>
                <div class="py-2 flex justify-between">
                  <span class="text-gray-500">Tenure:</span>
                  <span class="font-semibold text-gray-800">{{ project?.purchase_or_lease || 'Lease' }}</span>
                </div>
                <div class="py-2 flex justify-between">
                  <span class="text-gray-500">Clinical Hours On Site:</span>
                  <span class="font-semibold text-gray-800">{{ project?.est_clinical_hours_mds_on_site || 'N/A' }}</span>
                </div>
                <div class="py-2 flex justify-between">
                  <span class="text-gray-500">Family Medicine Team Size:</span>
                  <span class="font-semibold text-gray-800">{{ project?.long_term_fm_team_size || 'N/A' }}</span>
                </div>
              </div>
            </div>

            <div class="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
              <h3 class="font-bold text-gray-900 text-xs uppercase tracking-wider">Timeline Milestones</h3>
              <div class="divide-y divide-gray-200/60">
                <div class="py-2 flex justify-between">
                  <span class="text-gray-500">Project Start Date:</span>
                  <span class="font-semibold text-gray-800">{{ formatDate(project?.date_start) }}</span>
                </div>
                <div class="py-2 flex justify-between">
                  <span class="text-gray-500">Target Completion:</span>
                  <span class="font-semibold text-gray-800">{{ formatDate(project?.date_end) }}</span>
                </div>
                <div class="py-2 flex justify-between">
                  <span class="text-gray-500">Priority Level:</span>
                  <span class="font-semibold text-gray-800 uppercase">{{ project?.priority || 'Normal' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 2: Plans (Drawings, Resources > Pharmacy) -->
      <div v-else-if="activeTab === 'plans'">
        <div class="mb-3 px-1">
          <p class="text-xs text-gray-500">
            Available folders: Drawings, Resources > Pharmacy (read & download only)
          </p>
        </div>
        <PlansSection
          v-if="project?.id"
          :project="project"
          :allowed-folder-names="['Drawings', 'Pharmacy', 'Resources']"
          :read-only="true"
        />
      </div>

      <!-- Tab 3: Calendar -->
      <div v-else-if="activeTab === 'calendar'">
        <ProjectUserCalendarSection
          v-if="project?.id"
          :project-id="project.id"
          :project-address="project.address"
        />
      </div>

      <!-- Tab 4: Photos -->
      <div v-else-if="activeTab === 'photos'">
        <PhotosSection
          v-if="project?.id"
          :project="project"
          :can-edit="false"
        />
      </div>

      <!-- Tab 5: Reports -->
      <div v-else-if="activeTab === 'reports'">
        <ProjectReportsSection
          v-if="project?.id"
          :project-id="project.id"
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
import PhotosSection from '@/pages/projects/PhotosSection.vue'
import ProjectUserCalendarSection from '@/components/projects/ProjectUserCalendarSection.vue'
import ProjectReportsSection from '@/pages/projects/ProjectReportsSection.vue'

const route = useRoute()

const isLoading = ref(true)
const errorMessage = ref('')
const project = ref<Project | null>(null)
const activeTab = ref<'analytics' | 'plans' | 'calendar' | 'photos' | 'reports'>('analytics')

// Access 2 tabs as defined in Accounts-Pharmacy.pdf (Tasks, Settings, Team are HIDDEN!)
const pharmaTabs = [
  { id: 'analytics' as const, label: 'Live Analytics' },
  { id: 'plans' as const, label: 'Drawings & Resources' },
  { id: 'calendar' as const, label: 'Calendar' },
  { id: 'photos' as const, label: 'Photos' },
  { id: 'reports' as const, label: 'Reports' },
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
  } catch (err) {
    console.error('Failed to load project for pharmacist secondary client:', err)
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

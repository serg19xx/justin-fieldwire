<template>
  <div class="px-4 py-6 md:px-8 max-w-7xl mx-auto">
    <!-- Header Banner -->
    <div class="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-xl p-6 text-white mb-6 shadow-md">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span class="inline-block text-xs uppercase tracking-wider font-semibold bg-emerald-950/70 px-2.5 py-1 rounded text-emerald-200 mb-2 border border-emerald-600/40">
            Pharmacy Opportunities
          </span>
          <h1 class="text-2xl md:text-3xl font-bold tracking-tight">
            Clinic Location Marketplace
          </h1>
          <p class="text-teal-100 text-sm mt-1 max-w-2xl">
            Explore active clinic projects looking for or securing a location. Express interest, sign digital confidentiality agreements, and review lease options.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <div class="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2.5 text-center">
            <p class="text-[10px] uppercase tracking-wider text-teal-200 font-semibold">Available</p>
            <p class="text-xl font-bold text-white">{{ availableProjectsCount }}</p>
          </div>
          <div class="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2.5 text-center">
            <p class="text-[10px] uppercase tracking-wider text-emerald-300 font-semibold">Pursuing</p>
            <p class="text-xl font-bold text-emerald-300">{{ pursuingCount }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters & Search -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="flex-1 relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search opportunities by name, clinic model, interest areas..."
            class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
          />
          <span class="absolute left-3 top-2.5 text-gray-400 text-sm font-bold">Q</span>
        </div>
        <div class="sm:w-48">
          <select
            v-model="interestFilter"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white text-gray-700"
          >
            <option value="all">All Opportunities</option>
            <option value="pursuing">Projects I Want to Pursue</option>
            <option value="not_interested">Not Interested</option>
            <option value="undecided">Undecided</option>
          </select>
        </div>
        <div class="sm:w-56">
          <select
            v-model="statusFilter"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white text-gray-700"
          >
            <option value="">All Marketplace Statuses</option>
            <option value="Actively Looking For A Location">Actively Looking For A Location</option>
            <option value="Securing Location">Securing Location</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="py-20 text-center">
      <div class="inline-block animate-spin rounded-full h-9 w-9 border-b-2 border-teal-600 mb-3"></div>
      <p class="text-sm text-gray-600">Loading marketplace opportunities...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="errorMessage" class="bg-red-50 border border-red-200 rounded-lg p-5 text-center my-6">
      <p class="text-sm font-medium text-red-800">{{ errorMessage }}</p>
      <button
        type="button"
        @click="loadData"
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
        No matching clinic opportunities
      </h3>
      <p class="text-sm text-gray-500 max-w-md mx-auto">
        {{
          searchQuery || statusFilter || interestFilter !== 'all'
            ? 'No projects match your current filters. Try resetting the filters.'
            : 'There are currently no projects in "Actively Looking For A Location" or "Securing Location" status.'
        }}
      </p>
      <button
        v-if="searchQuery || statusFilter || interestFilter !== 'all'"
        type="button"
        @click="resetFilters"
        class="mt-4 px-3.5 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 rounded-md hover:bg-teal-100"
      >
        Reset filters
      </button>
    </div>

    <!-- Marketplace Projects Grid -->
    <div v-else class="space-y-6">
      <article
        v-for="project in filteredProjects"
        :key="project.id"
        class="bg-white rounded-xl shadow-sm border overflow-hidden transition-all"
        :class="[
          getInterest(project.id)?.decision === 'pursue'
            ? 'border-teal-400 ring-1 ring-teal-300/60'
            : getInterest(project.id)?.decision === 'not_interested'
            ? 'border-gray-200 opacity-75'
            : 'border-gray-200 hover:shadow-md',
        ]"
      >
        <!-- Project Card Header -->
        <div class="p-5 sm:p-6 border-b border-gray-100">
          <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                  :class="getStageBadgeClass(project.status)"
                >
                  Stage: {{ project.status }}
                </span>
                <span
                  v-if="project.purchase_or_lease"
                  class="text-[11px] font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded"
                >
                  {{ project.purchase_or_lease }}
                </span>
                <span
                  v-if="project.clinic_model_type"
                  class="text-[11px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100"
                >
                  {{ project.clinic_model_type }}
                </span>
              </div>

              <h2 class="text-xl font-bold text-gray-900 pt-1">
                {{ project.prj_name }}
              </h2>

              <!-- Location / Address Disclosure (Step 3: Unlocked only after NDA) -->
              <div class="pt-1 flex items-center gap-2">
                <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Location:</span>
                <span
                  v-if="getInterest(project.id)?.ndaSigned && project.address"
                  class="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                >
                  {{ project.address }}
                </span>
                <span
                  v-else
                  class="text-xs font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80 inline-flex items-center gap-1.5"
                >
                  <span>Address Hidden (Confidential)</span>
                  <span class="text-[10px] text-amber-600">• Step 1 NDA Required to Unlock</span>
                </span>
              </div>
            </div>

            <!-- Decision Toggle: "Project I want to Pursue" vs "Not Interested" -->
            <div class="shrink-0 flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg border border-gray-200">
              <button
                type="button"
                @click="handleDecision(project.id, 'pursue')"
                class="px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
                :class="
                  getInterest(project.id)?.decision === 'pursue'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200'
                "
              >
                Project I Want to Pursue
              </button>
              <button
                type="button"
                @click="handleDecision(project.id, 'not_interested')"
                class="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                :class="
                  getInterest(project.id)?.decision === 'not_interested'
                    ? 'bg-gray-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                "
              >
                Not Interested
              </button>
            </div>
          </div>
        </div>

        <!-- 4-Step Progress Flow (Visible when Pursue is selected) -->
        <div
          v-if="getInterest(project.id)?.decision === 'pursue'"
          class="bg-teal-50/70 border-b border-teal-100 px-5 sm:px-6 py-4"
        >
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-xs font-bold uppercase tracking-wider text-teal-900">
              Pursuit Progression Workflow
            </h3>
            <span class="text-xs font-medium text-teal-800">
              {{ getStepSummary(project.id) }}
            </span>
          </div>

          <!-- Step Indicators -->
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <!-- Step 1: Sign Digital NDA -->
            <div
              class="p-3 rounded-lg border flex flex-col justify-between"
              :class="
                getInterest(project.id)?.ndaSigned
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-white border-teal-300 text-teal-900 ring-1 ring-teal-400'
              "
            >
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="font-bold text-[11px] uppercase">Step 1: Sign NDA</span>
                  <span v-if="getInterest(project.id)?.ndaSigned" class="text-emerald-700 font-bold text-xs">✓ Done</span>
                </div>
                <p class="text-[11px] text-gray-600">
                  NDA, Non-Solicitation & Project Fees Contract
                </p>
              </div>
              <button
                v-if="!getInterest(project.id)?.ndaSigned"
                type="button"
                @click="openNdaModal(project)"
                class="mt-2.5 w-full py-1.5 px-2 bg-teal-700 hover:bg-teal-800 text-white rounded text-[11px] font-semibold text-center"
              >
                Sign NDA Digitally
              </button>
              <div v-else class="mt-2 text-[10px] text-emerald-700">
                Signed on {{ formatDate(getInterest(project.id)?.ndaSignedAt) }}
              </div>
            </div>

            <!-- Step 2: Stored in Plans & Downloadable -->
            <div
              class="p-3 rounded-lg border flex flex-col justify-between"
              :class="
                getInterest(project.id)?.ndaSigned
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-gray-50 border-gray-200 text-gray-400'
              "
            >
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="font-bold text-[11px] uppercase">Step 2: NDA Stored</span>
                  <span v-if="getInterest(project.id)?.ndaSigned" class="text-emerald-700 font-bold text-xs">✓ Ready</span>
                </div>
                <p class="text-[11px]" :class="getInterest(project.id)?.ndaSigned ? 'text-gray-600' : 'text-gray-400'">
                  Stored in Plans & available for download
                </p>
              </div>
              <button
                v-if="getInterest(project.id)?.ndaSigned"
                type="button"
                @click="downloadNdaCertificate(project)"
                class="mt-2.5 w-full py-1 px-2 border border-emerald-600 text-emerald-800 hover:bg-emerald-100 rounded text-[11px] font-medium"
              >
                Download NDA Certificate
              </button>
            </div>

            <!-- Step 3: Address Revealed -->
            <div
              class="p-3 rounded-lg border flex flex-col justify-between"
              :class="
                getInterest(project.id)?.ndaSigned
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-gray-50 border-gray-200 text-gray-400'
              "
            >
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="font-bold text-[11px] uppercase">Step 3: Site Address</span>
                  <span v-if="getInterest(project.id)?.ndaSigned" class="text-emerald-700 font-bold text-xs">✓ Unlocked</span>
                </div>
                <p class="text-[11px]" :class="getInterest(project.id)?.ndaSigned ? 'text-gray-700 font-medium' : 'text-gray-400'">
                  {{ getInterest(project.id)?.ndaSigned ? project.address || 'Address Confirmed' : 'Unlocked after Step 1' }}
                </p>
              </div>
            </div>

            <!-- Step 4: Digital Sign Lease -->
            <div
              class="p-3 rounded-lg border flex flex-col justify-between"
              :class="
                getInterest(project.id)?.leaseSigned
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : getInterest(project.id)?.ndaSigned
                  ? 'bg-white border-blue-300 text-blue-900 ring-1 ring-blue-400'
                  : 'bg-gray-50 border-gray-200 text-gray-400'
              "
            >
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="font-bold text-[11px] uppercase">Step 4: Short Lease</span>
                  <span v-if="getInterest(project.id)?.leaseSigned" class="text-emerald-700 font-bold text-xs">✓ Signed</span>
                </div>
                <p class="text-[11px]" :class="getInterest(project.id)?.ndaSigned ? 'text-gray-600' : 'text-gray-400'">
                  Standard lease agreement review & signing
                </p>
              </div>
              <button
                v-if="getInterest(project.id)?.ndaSigned && !getInterest(project.id)?.leaseSigned"
                type="button"
                @click="openLeaseModal(project)"
                class="mt-2.5 w-full py-1.5 px-2 bg-blue-700 hover:bg-blue-800 text-white rounded text-[11px] font-semibold text-center"
              >
                Sign Lease Digitally
              </button>
              <div v-else-if="getInterest(project.id)?.leaseSigned" class="mt-2 text-[10px] text-emerald-700">
                Executed on {{ formatDate(getInterest(project.id)?.leaseSignedAt) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Project Specifications & White-Listed Data -->
        <div class="p-5 sm:p-6 space-y-4">
          <!-- Description -->
          <div v-if="project.description">
            <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Project Description</h4>
            <p class="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3.5 rounded-lg border border-gray-100">
              {{ project.description }}
            </p>
          </div>

          <!-- White-Listed Specs Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
            <div class="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <span class="text-gray-400 block mb-0.5">Total Doctors</span>
              <span class="font-bold text-gray-800 text-sm">{{ project.total_doctors || '1' }}</span>
            </div>
            <div class="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <span class="text-gray-400 block mb-0.5">Project Size</span>
              <span class="font-bold text-gray-800 text-sm">{{ project.area ? `${project.area} sq ft` : 'Flexible' }}</span>
            </div>
            <div class="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <span class="text-gray-400 block mb-0.5">Daily Patient Volumes</span>
              <span class="font-semibold text-gray-800">{{ project.daily_patient_volumes || 'N/A' }}</span>
            </div>
            <div class="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <span class="text-gray-400 block mb-0.5">Est. Clinical Hours</span>
              <span class="font-semibold text-gray-800">{{ project.est_clinical_hours_mds_on_site || 'N/A' }}</span>
            </div>
            <div class="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <span class="text-gray-400 block mb-0.5">Team Size Model</span>
              <span class="font-semibold text-gray-800">{{ project.long_term_fm_team_size || 'N/A' }}</span>
            </div>
            <div class="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <span class="text-gray-400 block mb-0.5">Locations of Interest</span>
              <span class="font-semibold text-gray-800">{{ formatArrayOrString(project.locations_of_interest) || 'Metropolitan' }}</span>
            </div>
            <div class="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <span class="text-gray-400 block mb-0.5">Monthly Budget (Year 1)</span>
              <span class="font-semibold text-gray-800">{{ project.monthly_budget_first_year || 'Contact PM' }}</span>
            </div>
            <div class="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <span class="text-gray-400 block mb-0.5">Estimated Total</span>
              <span class="font-semibold text-gray-800">{{ project.estimated_total ? `$${Number(project.estimated_total).toLocaleString()}` : 'Under Review' }}</span>
            </div>
          </div>

          <!-- Additional White-Listed Details (HR Vision, Marketing Strategy, Notes) -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
            <div v-if="project.hr_vision" class="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <span class="text-gray-400 block uppercase font-semibold text-[10px] mb-1">HR Vision</span>
              <p class="text-gray-700">{{ project.hr_vision }}</p>
            </div>
            <div v-if="project.marketing_strategy" class="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <span class="text-gray-400 block uppercase font-semibold text-[10px] mb-1">Marketing Strategy</span>
              <p class="text-gray-700">{{ project.marketing_strategy }}</p>
            </div>
          </div>

          <!-- Healthcare Services & Project Inclusions -->
          <div v-if="project.healthcare_services?.length" class="pt-1">
            <span class="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">
              Healthcare Services
            </span>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="svc in project.healthcare_services"
                :key="svc"
                class="inline-block px-2.5 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-md text-xs font-medium"
              >
                {{ svc }}
              </span>
            </div>
          </div>

          <div v-if="project.project_inclusions?.length" class="pt-1">
            <span class="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">
              Project Inclusions
            </span>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="inc in project.project_inclusions"
                :key="inc"
                class="inline-block px-2.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-md text-xs"
              >
                {{ inc }}
              </span>
            </div>
          </div>
        </div>
      </article>
    </div>

    <!-- Step 1 NDA Modal -->
    <NdaSigningModal
      :open="isNdaModalOpen"
      :project="activeSigningProject"
      :signer-name="currentPharmacistName"
      :signer-email="authStore.currentUser?.email"
      :signer-phone="authStore.currentUser?.phone"
      @close="isNdaModalOpen = false"
      @signed="handleNdaSigned"
    />

    <!-- Step 4 Lease Modal -->
    <LeaseSigningModal
      :open="isLeaseModalOpen"
      :project="activeSigningProject"
      :project-address="activeSigningProject?.address"
      :signer-name="currentPharmacistName"
      @close="isLeaseModalOpen = false"
      @signed="handleLeaseSigned"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/core/stores/auth'
import { projectApi, type Project } from '@/core/utils/project-api'
import { parseProjectsFromListResponse, filterProjectsForMarketplace } from '@/core/utils/project-list-for-user'
import {
  pharmacistMarketplaceApi,
  type PharmacistProjectInterest,
} from '@/core/utils/pharmacist-marketplace-api'
import NdaSigningModal from '@/components/pharmacist/NdaSigningModal.vue'
import LeaseSigningModal from '@/components/pharmacist/LeaseSigningModal.vue'

const authStore = useAuthStore()

const isLoading = ref(true)
const errorMessage = ref('')
const allMarketplaceProjects = ref<Project[]>([])
const interestsMap = ref<Record<number, PharmacistProjectInterest>>({})

const searchQuery = ref('')
const statusFilter = ref('')
const interestFilter = ref<'all' | 'pursuing' | 'not_interested' | 'undecided'>('all')

const isNdaModalOpen = ref(false)
const isLeaseModalOpen = ref(false)
const activeSigningProject = ref<Project | null>(null)

const currentPharmacistId = computed(() => {
  return Number(authStore.currentUser?.pharmacist_id || authStore.currentUser?.id || 0)
})

const currentPharmacistName = computed(() => {
  return authStore.currentUser?.name || authStore.currentUser?.first_name || 'Pharmacist'
})

async function loadData(): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const raw = await projectApi.getAll(1, 200)
    const list = parseProjectsFromListResponse(raw)
    allMarketplaceProjects.value = filterProjectsForMarketplace(list)

    if (currentPharmacistId.value) {
      interestsMap.value = await pharmacistMarketplaceApi.getInterests(currentPharmacistId.value)
    }
  } catch (err) {
    console.error('Failed to load marketplace data:', err)
    errorMessage.value = 'Failed to load projects. Please check your network connection.'
  } finally {
    isLoading.value = false
  }
}

function getInterest(projectId: number): PharmacistProjectInterest | undefined {
  return interestsMap.value[projectId]
}

const availableProjectsCount = computed(() => allMarketplaceProjects.value.length)

const pursuingCount = computed(() => {
  return Object.values(interestsMap.value).filter((i) => i.decision === 'pursue').length
})

const filteredProjects = computed(() => {
  let list = allMarketplaceProjects.value

  if (statusFilter.value) {
    list = list.filter((p) => (p.status || '').toLowerCase() === statusFilter.value.toLowerCase())
  }

  if (interestFilter.value !== 'all') {
    list = list.filter((p) => {
      const decision = getInterest(p.id)?.decision
      if (interestFilter.value === 'pursuing') return decision === 'pursue'
      if (interestFilter.value === 'not_interested') return decision === 'not_interested'
      if (interestFilter.value === 'undecided') return !decision
      return true
    })
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter((p) => {
      const name = (p.prj_name || '').toLowerCase()
      const desc = (p.description || '').toLowerCase()
      const model = (p.clinic_model_type || '').toLowerCase()
      return name.includes(q) || desc.includes(q) || model.includes(q)
    })
  }

  return list
})

async function handleDecision(projectId: number, decision: 'pursue' | 'not_interested'): Promise<void> {
  const updated = await pharmacistMarketplaceApi.setDecision(
    projectId,
    currentPharmacistId.value,
    decision,
  )
  interestsMap.value = {
    ...interestsMap.value,
    [projectId]: updated,
  }

  // If pursuing and NDA not yet signed, prompt Step 1
  if (decision === 'pursue' && !updated.ndaSigned) {
    const proj = allMarketplaceProjects.value.find((p) => p.id === projectId)
    if (proj) {
      openNdaModal(proj)
    }
  }
}

function openNdaModal(project: Project): void {
  activeSigningProject.value = project
  isNdaModalOpen.value = true
}

function openLeaseModal(project: Project): void {
  activeSigningProject.value = project
  isLeaseModalOpen.value = true
}

async function handleNdaSigned(signature: { signerName: string }): Promise<void> {
  if (!activeSigningProject.value) return
  const projectId = activeSigningProject.value.id

  const updated = await pharmacistMarketplaceApi.signNda(
    projectId,
    currentPharmacistId.value,
    signature.signerName,
  )

  interestsMap.value = {
    ...interestsMap.value,
    [projectId]: updated,
  }

  isNdaModalOpen.value = false
}

async function handleLeaseSigned(data: { signerName: string; modifications: string }): Promise<void> {
  if (!activeSigningProject.value) return
  const projectId = activeSigningProject.value.id

  const updated = await pharmacistMarketplaceApi.signLease(
    projectId,
    currentPharmacistId.value,
    data.signerName,
    data.modifications,
  )

  interestsMap.value = {
    ...interestsMap.value,
    [projectId]: updated,
  }

  isLeaseModalOpen.value = false
}

function downloadNdaCertificate(project: Project): void {
  const interest = getInterest(project.id)
  const content = `DIGITAL NON-DISCLOSURE & PROJECT FEES CERTIFICATE
------------------------------------------------------------
Project: ${project.prj_name}
Signer: ${interest?.ndaSignerName || currentPharmacistName.value}
Document ID: ${interest?.ndaDocumentId || 'NDA-VERIFIED'}
Date Signed: ${interest?.ndaSignedAt || new Date().toISOString()}
Status: FULLY EXECUTED & STORED IN PROJECT PLANS
------------------------------------------------------------
Terms: Non-Disclosure, Non-Solicitation, Non-Compete, & Project Fees.
Site Address Disclosed: ${project.address || 'Confidential Site'}
`
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Signed_NDA_${project.id}_${interest?.ndaDocumentId || 'Executed'}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function getStepSummary(projectId: number): string {
  const item = getInterest(projectId)
  if (item?.leaseSigned) return 'Step 4 Completed (Lease Signed)'
  if (item?.ndaSigned) return 'Step 3 of 4: Address Unlocked • Pending Lease'
  return 'Step 1 of 4: NDA Signature Required'
}

function resetFilters(): void {
  searchQuery.value = ''
  statusFilter.value = ''
  interestFilter.value = 'all'
}

function formatArrayOrString(val: unknown): string {
  if (Array.isArray(val)) return val.join(', ')
  if (typeof val === 'string') return val
  return ''
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
  if (s.includes('securing')) return 'bg-amber-100 text-amber-800'
  if (s.includes('actively')) return 'bg-teal-100 text-teal-800'
  return 'bg-gray-100 text-gray-700'
}

onMounted(() => {
  void loadData()
})
</script>

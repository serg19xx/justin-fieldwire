<template>
  <div class="settings-section flex-1 flex flex-col">
    <!-- Settings Form -->
    <div class="bg-white rounded-lg shadow p-6">
      <div class="sticky top-0 z-10 -mx-6 -mt-6 mb-6 border-b border-gray-200 bg-white px-6">
        <div class="flex overflow-x-auto" role="tablist" aria-label="Project settings sections">
          <button
            v-for="section in formSections"
            :key="section.id"
            type="button"
            role="tab"
            :title="section.title"
            :aria-label="section.title"
            :aria-selected="activeSection === section.id"
            :class="[
              'shrink-0 border-b-2 px-3 py-3 text-sm font-medium',
              activeSection === section.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700',
            ]"
            @click="activeSection = section.id"
          >
            {{ section.label }}
          </button>
        </div>
      </div>
      <form @submit.prevent="handleSubmit" class="flex flex-col gap-4">
        <!-- 1. Project Name -->
          <div v-show="activeSection === 'general'" class="order-1">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Project Name <span class="text-red-500">*</span>
          </label>
          <input
            v-model="settingsForm.name"
            type="text"
            :disabled="!canEdit"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="Enter project name"
            required
          />
        </div>

          <!-- 2. Project Address -->
          <div v-show="activeSection === 'space'" class="order-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
              Project Address <span class="text-red-500">*</span>
          </label>
          <textarea
            v-model="settingsForm.address"
            :disabled="!canEdit"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="Enter project address"
            required
          ></textarea>
        </div>

        <!-- 2b. Locations of interest -->
          <div v-show="activeSection === 'general'" class="order-3">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Locations of interest <span class="text-gray-400 font-normal">(optional)</span>
          </label>
          <div class="flex flex-wrap items-center gap-2 mb-2">
            <span
              v-for="code in settingsForm.locations_of_interest"
              :key="code"
              class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-800"
            >
              {{ formatFsaLabel(code) }}
              <button
                v-if="canEdit"
                type="button"
                class="ml-1 text-gray-500 hover:text-red-600"
                @click="removeLocationOfInterest(code)"
              >
                ×
              </button>
            </span>
            <button
              v-if="canEdit"
              type="button"
              @click="showLocationsSelector = true"
              class="px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              + Add
            </button>
          </div>
          <p v-if="canEdit" class="text-xs text-gray-500">Canadian postal code prefixes (FSA).</p>
        </div>

          <!-- 3. Client -->
          <div v-show="activeSection === 'general'" class="order-2">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Client <span class="text-red-500">*</span>
          </label>
          <div class="flex items-center space-x-2">
            <input
              :value="clientDisplayName"
              type="text"
              readonly
              :disabled="!canEdit"
              class="flex-1 px-3 py-2 border rounded-md bg-gray-50 text-gray-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              :class="[
                canEdit ? 'cursor-pointer' : '',
                clientValidationError ? 'border-red-500' : 'border-gray-300'
              ]"
              placeholder="Click to select primary client"
              @click="canEdit && (showClientSelector = true)"
            />
            <button
              v-if="canEdit"
              type="button"
              @click="showClientSelector = true"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Select
            </button>
            <button
              v-if="canEdit && settingsForm.client_id"
              type="button"
              @click="clearClient"
              class="px-4 py-2 border border-red-300 rounded-md text-red-700 hover:bg-red-50 transition-colors text-sm font-medium"
            >
              Clear
            </button>
          </div>
          <p v-if="clientValidationError" class="mt-1 text-sm text-red-600">
            {{ clientValidationError }}
          </p>
        </div>

        <!-- 4. Secondary Client -->
          <div v-show="activeSection === 'space'" class="order-5">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Secondary Client <span class="text-gray-400 font-normal">(optional)</span>
          </label>
          <div class="flex flex-wrap items-center gap-2 mb-2">
            <span
              v-for="(item, idx) in settingsForm.additional_clients"
              :key="`${item.client_table}:${item.client_id}`"
              class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-800"
            >
              {{ item.client_name || `Client #${item.client_id}` }}
              <span v-if="item.client_type" class="text-gray-500">({{ item.client_type }})</span>
              <button
                v-if="canEdit"
                type="button"
                class="ml-1 text-gray-500 hover:text-red-600"
                @click="removeAdditionalClient(idx)"
              >
                ×
              </button>
            </span>
            <button
              v-if="canEdit"
              type="button"
              @click="showAdditionalClientsSelector = true"
              class="px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              + Add
            </button>
          </div>
          <p v-if="canEdit" class="text-xs text-gray-500">
            Related parties for this project. Primary client is used for reporting.
          </p>
        </div>

        <!-- 5. Client stage -->
          <div v-show="activeSection === 'general'" class="order-5">
            <label class="block text-sm font-medium text-gray-700 mb-2"> Stage </label>
          <select
            v-model="settingsForm.status"
            :disabled="!canEdit"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          >
            <option value="Initial Contact Lead">Initial Contact Lead</option>
            <option value="Dead Lead">Dead Lead</option>
            <option value="Waiting On Direction">Waiting On Direction</option>
            <option value="Actively Looking For A Location">Actively Looking For A Location</option>
            <option value="Securing Location">Securing Location</option>
            <option value="Project Secured">Project Secured</option>
            <option value="Construction">Construction</option>
            <option value="Completed Project">Completed Project</option>
          </select>
          <p v-if="canEdit" class="mt-1 text-xs text-gray-500">For sales tracking only.</p>
        </div>

        <!-- 6. Lifecycle -->
          <div v-show="activeSection === 'general'" class="order-6">
            <label class="block text-sm font-medium text-gray-700 mb-2"> Client Lifecycle </label>
          <select
            v-model="settingsForm.sys_status"
            :disabled="!canEdit"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          >
            <option v-for="opt in projectSysStatusOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <!-- 7. Purchase or Lease -->
          <div v-show="activeSection === 'general'" class="order-7">
          <label class="block text-sm font-medium text-gray-700 mb-2"> Purchase or Lease </label>
          <select
            v-model="settingsForm.purchase_or_lease"
            :disabled="!canEdit"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          >
            <option value="">— Select purchase or lease —</option>
            <option value="Purchase">Purchase</option>
            <option value="Lease">Lease</option>
            <option value="Undecided">Undecided</option>
          </select>
        </div>

        <!-- 8. Project Size -->
          <div v-show="activeSection === 'space'" class="order-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">Project Size</label>
          <input
            v-model.number="settingsForm.area"
            type="number"
            min="0"
            step="1"
            :disabled="!canEdit"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="e.g. square feet"
          />
        </div>

        <!-- 9. Level -->
          <div v-show="activeSection === 'general'" class="order-8">
          <label class="block text-sm font-medium text-gray-700 mb-2"> Level </label>
          <select
            v-model="settingsForm.level"
            :disabled="!canEdit"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          >
            <option value="">— Select level —</option>
            <option value="Basics">Basics</option>
            <option value="Full Service">Full Service</option>
            <option value="Medical Nice">Medical Nice</option>
            <option value="High End">High End</option>
            <option value="Extravagant">Extravagant</option>
          </select>
        </div>

        <!-- 10. Clinic Model Type -->
          <div v-show="activeSection === 'healthcare'" class="order-1">
          <label class="block text-sm font-medium text-gray-700 mb-2"> Clinic Model Type </label>
          <select
            v-model="settingsForm.clinic_model_type"
            :disabled="!canEdit"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          >
            <option value="">— Select clinic model type —</option>
            <option
              v-for="clinicModelType in projectClinicModelTypes"
              :key="clinicModelType"
              :value="clinicModelType"
            >
              {{ clinicModelType }}
            </option>
          </select>
        </div>

        <!-- 11. Healthcare Services -->
          <div v-show="activeSection === 'healthcare'" class="order-4">
          <label class="block text-sm font-medium text-gray-700 mb-2"> Healthcare Services </label>
          <select
            v-model="settingsForm.healthcare_services"
            :disabled="!canEdit"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          >
            <option value="">— Select healthcare services —</option>
            <option
              v-for="healthcareService in projectHealthcareServices"
              :key="healthcareService"
              :value="healthcareService"
            >
              {{ healthcareService }}
            </option>
          </select>
        </div>

        <!-- 12. Long Term Family Medicine Team Size -->
          <div v-show="activeSection === 'healthcare'" class="order-5">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Long Term Family Medicine Team Size
          </label>
          <select
            v-model="settingsForm.long_term_fm_team_size"
            :disabled="!canEdit"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          >
            <option value="">— Select team size —</option>
            <option
              v-for="teamSize in projectLongTermFmTeamSizes"
              :key="teamSize"
              :value="teamSize"
            >
              {{ teamSize }}
            </option>
          </select>
        </div>

        <!-- 13. Monthly Budget in First Year -->
          <div v-show="activeSection === 'marketing'" class="order-2">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Monthly Budget in First Year
            <span class="text-gray-400 font-normal">($)</span>
          </label>
          <input
            v-model="settingsForm.monthly_budget_first_year"
            type="text"
            maxlength="100"
            :disabled="!canEdit"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="e.g. 15000"
          />
        </div>

        <!-- 14. Est. Clinical Hours Between MD's On Site -->
          <div v-show="activeSection === 'healthcare'" class="order-3">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Est. Clinical Hours Between MD&rsquo;s On Site
          </label>
          <input
            v-model="settingsForm.est_clinical_hours_mds_on_site"
            type="text"
            maxlength="100"
            :disabled="!canEdit"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="e.g. 20"
          />
        </div>

        <!-- 15. HR Vision -->
          <div v-show="activeSection === 'healthcare'" class="order-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            HR Vision <span class="text-gray-400 font-normal">(optional)</span>
          </label>
          <div class="flex flex-wrap items-center gap-2 mb-2">
            <span
              v-for="specialty in settingsForm.hr_vision"
              :key="specialty"
              class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-800"
            >
              {{ specialty }}
              <button
                v-if="canEdit"
                type="button"
                class="ml-1 text-gray-500 hover:text-red-600"
                @click="removeHrVisionSpecialty(specialty)"
              >
                ×
              </button>
            </span>
            <button
              v-if="canEdit"
              type="button"
              @click="showHrVisionSelector = true"
              class="px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              + Add
            </button>
          </div>
        </div>

        <!-- 16. My Account (project manager) -->
          <div v-show="activeSection === 'general'" v-if="canAssignManager" class="order-9">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            My Account <span class="text-red-500">*</span>
          </label>
          <select
            v-model="settingsForm.prj_manager"
            :disabled="!canEdit"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          >
            <option :value="null">Select user</option>
            <option v-for="manager in availableManagers" :key="manager.id" :value="manager.id">
              {{ manager.name }} ({{ manager.email }})
            </option>
          </select>
          <p v-if="managerValidationError" class="mt-1 text-sm text-red-600">
            {{ managerValidationError }}
          </p>
        </div>
          <div v-show="activeSection === 'general'" v-else class="order-9">
          <label class="block text-sm font-medium text-gray-700 mb-2"> My Account </label>
          <div class="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600">
            {{ projectManagerDisplayName }}
          </div>
        </div>

        <!-- 16. Project foreman -->
          <div v-show="activeSection === 'general'" class="order-10">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Project foreman / brigadier <span class="text-red-500">*</span>
          </label>
          <select
            v-model="settingsForm.project_foreman_id"
            :disabled="!canEdit"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          >
            <option :value="null">Select foreman</option>
            <option v-for="foreman in availableForemen" :key="foreman.id" :value="foreman.id">
              {{ foreman.name }}
            </option>
          </select>
          <p v-if="foremanValidationError" class="mt-1 text-sm text-red-600">{{ foremanValidationError }}</p>
          <p class="mt-1 text-xs text-gray-500">
            Default foreman for all tasks in this project (can be overridden per task).
          </p>
          <label
            v-if="canEdit && showPropagateForemanCheckbox"
            class="mt-3 flex items-start gap-2 text-sm text-gray-700 cursor-pointer"
          >
            <input
              v-model="settingsForm.update_task_foreman_on_all_tasks"
              type="checkbox"
              class="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Update task foreman on all existing tasks</span>
          </label>
        </div>

        <!-- 17. Description -->
          <div v-show="activeSection === 'general'" class="order-4">
          <label class="block text-sm font-medium text-gray-700 mb-2"> Description </label>
          <textarea
            v-model="settingsForm.description"
            :disabled="!canEdit"
            rows="4"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 text-gray-900"
            placeholder="Enter project description (optional)"
          ></textarea>
        </div>

        <!-- 18. Notes -->
          <div v-show="activeSection === 'space'" class="order-3">
          <label class="block text-sm font-medium text-gray-700 mb-2"> Notes </label>
          <textarea
            v-model="settingsForm.notes"
            :disabled="!canEdit"
            rows="3"
            maxlength="1000"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 text-gray-900"
            placeholder="Enter project notes (optional, max 1000 characters)"
          ></textarea>
          <p v-if="canEdit" class="mt-1 text-xs text-gray-500">
            {{ settingsForm.notes.length }}/1000 characters
          </p>
        </div>

        <div v-show="activeSection === 'healthcare'" class="order-2">
          <label class="block text-sm font-medium text-gray-700 mb-2">Operational Hours</label>
          <OperationalHoursEditor v-model="settingsForm.operational_hours" :disabled="!canEdit" />
        </div>

        <div v-show="activeSection === 'space'" class="order-1">
          <label class="block text-sm font-medium text-gray-700 mb-2">Contents of Space</label>
          <ContentsOfSpaceEditor v-model="settingsForm.contents_of_space" :disabled="!canEdit" />
        </div>

        <div v-show="activeSection === 'marketing'" class="order-1">
          <label class="block text-sm font-medium text-gray-700 mb-2">Marketing Strategy</label>
          <div class="space-y-2">
            <label v-for="strategy in marketingStrategyOptions" :key="strategy" class="flex items-center gap-2 text-sm text-gray-700">
              <input v-model="settingsForm.marketing_strategy" :disabled="!canEdit" type="checkbox" :value="strategy" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              {{ strategy }}
            </label>
          </div>
        </div>

        <!-- Action Buttons -->
        <div
          v-if="canEdit"
          class="order-last flex items-center justify-end space-x-4 pt-4 border-t border-gray-200"
        >
          <button
            type="submit"
            :disabled="isSaving"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {{ isSaving ? 'Saving...' : 'Save' }}
          </button>
        </div>

        <!-- Read-only notice for non-managers -->
        <div v-else class="order-last bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div class="flex">
            <svg
              class="h-5 w-5 text-yellow-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              ></path>
            </svg>
            <div class="ml-3">
              <p class="text-sm text-yellow-800">
                You can only view project settings. Only Project Managers can edit project
                information.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>

    <PostalFsaSelectorDialog
      :is-open="showLocationsSelector"
      :selected-codes="settingsForm.locations_of_interest"
      @close="showLocationsSelector = false"
      @apply="handleLocationsApply"
    />
    <HrVisionSelectorDialog
      :is-open="showHrVisionSelector"
      :selected-specialties="settingsForm.hr_vision"
      @close="showHrVisionSelector = false"
      @apply="handleHrVisionApply"
    />
    <!-- Primary Client Selector -->
    <ClientSelectorDialog
      :is-open="showClientSelector"
      :selected-client-id="settingsForm.client_id"
      :selected-client-table="settingsForm.client_table"
      @close="showClientSelector = false"
      @select="handleClientSelect"
      @clear="handleClientClear"
    />
    <!-- Additional Clients Selector -->
    <ClientSelectorDialog
      :is-open="showAdditionalClientsSelector"
      multiple
      :selected-clients="settingsForm.additional_clients"
      :exclude-client-id="settingsForm.client_id"
      :exclude-client-table="settingsForm.client_table"
      @close="showAdditionalClientsSelector = false"
      @select-many="handleAdditionalClientsSelect"
      @clear="clearAdditionalClients"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, computed } from 'vue'
import ClientSelectorDialog, {
  type ClientSelectionItem,
} from '@/components/ClientSelectorDialog.vue'
import PostalFsaSelectorDialog from '@/components/PostalFsaSelectorDialog.vue'
import HrVisionSelectorDialog from '@/components/HrVisionSelectorDialog.vue'
import { clientsApi, type Client } from '@/core/utils/clients-api'
import type { AdditionalProjectClient, ClientTableType } from '@/core/utils/project-api'
import { formatFsaLabel } from '@/core/utils/postal-fsa-locations'
import {
  DEFAULT_PROJECT_SYS_STATUS,
  PROJECT_SYS_STATUS_OPTIONS,
  resolveProjectSysStatus,
  type ProjectSysStatus,
} from '@/core/utils/project-sys-status'
import {
  PROJECT_CLINIC_MODEL_TYPES,
  PROJECT_HEALTHCARE_SERVICES,
  PROJECT_LONG_TERM_FM_TEAM_SIZES,
} from '@/core/utils/constants'
import { MARKETING_STRATEGY_OPTIONS } from '@/core/utils/marketing-strategy-options'
import {
  createEmptyContentsOfSpace,
  normalizeContentsOfSpace,
  type ContentsOfSpaceData,
} from '@/core/utils/contents-of-space'
import {
  createEmptyOperationalHours,
  getOperationalHoursValidationError,
  normalizeOperationalHours,
  type OperationalHoursData,
} from '@/core/utils/operational-hours'
import ContentsOfSpaceEditor from '@/components/ContentsOfSpaceEditor.vue'
import OperationalHoursEditor from '@/components/OperationalHoursEditor.vue'
import { hrResourcesApi, type WorkerUser } from '@/core/utils/hr-api'
import { FOREMAN_ROLE_DB_ID } from '@/config/roles'
import { useAuthStore } from '@/core/stores/auth'

defineOptions({
  name: 'SettingsSection',
})

const authStore = useAuthStore()
const projectSysStatusOptions = PROJECT_SYS_STATUS_OPTIONS
const projectClinicModelTypes = PROJECT_CLINIC_MODEL_TYPES
const projectHealthcareServices = PROJECT_HEALTHCARE_SERVICES
const projectLongTermFmTeamSizes = PROJECT_LONG_TERM_FM_TEAM_SIZES
const marketingStrategyOptions = MARKETING_STRATEGY_OPTIONS
const activeSection = ref<'general' | 'healthcare' | 'space' | 'marketing'>('general')
const formSections = [
  { id: 'general', label: 'General', title: 'General Project Information' },
  { id: 'healthcare', label: 'Healthcare', title: 'Healthcare Business Vision' },
  { id: 'space', label: 'Space', title: 'Space Vision' },
  { id: 'marketing', label: 'Marketing', title: 'Marketing Strategy' },
] as const

// Props
interface ProjectData {
  name: string
  address: string
  description?: string
  startDate?: string | null
  endDate?: string | null
  status: string
  sys_status?: ProjectSysStatus | string | null
  purchase_or_lease?: string
  notes?: string | null
  area?: number | null
  level?: string | null
  clinic_model_type?: string | null
  healthcare_services?: string | null
  long_term_fm_team_size?: string | null
  monthly_budget_first_year?: string | null
  est_clinical_hours_mds_on_site?: string | null
  hr_vision?: string[] | null
  operational_hours?: OperationalHoursData | null
  contents_of_space?: ContentsOfSpaceData | null
  marketing_strategy?: string[] | null
  locations_of_interest?: string[] | null
  client_id?: number | null
  client_type?: string | null
  client_table?: string | null
  client_data?: Record<string, unknown> | null
  client_name?: string | null
  client2_id?: number | null
  client2_type?: string | null
  client2_table?: string | null
  client2_data?: Record<string, unknown> | null
  client2_name?: string | null
  additional_clients?: AdditionalProjectClient[] | null
  project_foreman_id?: number | null
  projectManager?: number | null
}

interface Props {
  canEdit?: boolean
  project?: ProjectData | { value: ProjectData }
}

const props = withDefaults(defineProps<Props>(), {
  canEdit: false,
})

// Emits
const emit = defineEmits<{
  saveSettings: []
  resetSettings: []
}>()

// State
const isSaving = ref(false)
const showClientSelector = ref(false)
const selectedClient = ref<Client | null>(null)
const showAdditionalClientsSelector = ref(false)
const showLocationsSelector = ref(false)
const showHrVisionSelector = ref(false)
const clientValidationError = ref('')
const foremanValidationError = ref('')
const managerValidationError = ref('')
const operationalHoursValidationError = ref('')
const availableForemen = ref<Array<{ id: number; name: string }>>([])
const availableManagers = ref<Array<{ id: number; name: string; email: string }>>([])
const initialProjectForemanId = ref<number | null>(null)
const projectManagerNameCache = ref('')

// Settings form
const settingsForm = reactive({
  name: '',
  address: '',
  description: '',
  status: 'draft',
  sys_status: DEFAULT_PROJECT_SYS_STATUS as ProjectSysStatus,
  purchase_or_lease: '',
  notes: '',
  area: null as number | null,
  level: '' as string,
  clinic_model_type: '' as string,
  healthcare_services: '' as string,
  long_term_fm_team_size: '' as string,
  monthly_budget_first_year: '' as string,
  est_clinical_hours_mds_on_site: '' as string,
  hr_vision: [] as string[],
  operational_hours: createEmptyOperationalHours() as OperationalHoursData,
  contents_of_space: createEmptyContentsOfSpace() as ContentsOfSpaceData,
  marketing_strategy: [] as string[],
  locations_of_interest: [] as string[],
  client_id: null as number | null,
  client_type: null as string | null,
  client_table: null as ClientTableType | null,
  client_data: null as Record<string, unknown> | null,
  client_name: null as string | null,
  additional_clients: [] as AdditionalProjectClient[],
  project_foreman_id: null as number | null,
  update_task_foreman_on_all_tasks: false,
  prj_manager: null as number | null,
})

const canAssignManager = computed(
  () => authStore.currentUser?.job_title === 'System Administrator',
)

const showPropagateForemanCheckbox = computed(() => {
  const current = settingsForm.project_foreman_id
  const initial = initialProjectForemanId.value
  return current != null && initial != null && Number(current) !== Number(initial)
})

const projectManagerDisplayName = computed(() => {
  if (projectManagerNameCache.value) return projectManagerNameCache.value
  const id = settingsForm.prj_manager
  if (id == null) return 'Not assigned'
  const fromList = availableManagers.value.find((m) => m.id === Number(id))
  if (fromList) return `${fromList.name} (${fromList.email})`
  return `User ID: ${id}`
})

// Client display name
const clientDisplayName = computed(() => {
  // First try to use selectedClient if available
  if (selectedClient.value) {
    const clientType = clientsApi.getClientTypeLabel(settingsForm.client_table || null)
    return `${selectedClient.value.name} (${clientType})`
  }
  
  // Use client_name from server if available (primary)
  if (settingsForm.client_name) {
    return settingsForm.client_name
  }
  
  // Fallback: use data from client_data if available
  if (settingsForm.client_id && settingsForm.client_type) {
    const clientName = settingsForm.client_data && typeof settingsForm.client_data === 'object' && settingsForm.client_data.name
      ? settingsForm.client_data.name
      : `Client ID: ${settingsForm.client_id}`
    return `${clientName} (${settingsForm.client_type})`
  }
  
  return ''
})

function resolveAdditionalClientsFromProject(project: ProjectData): AdditionalProjectClient[] {
  const validClientTables: ClientTableType[] = ['pharma', 'physician', 'pharmacist', 'medical_clinic']
  if (Array.isArray(project.additional_clients) && project.additional_clients.length > 0) {
    return project.additional_clients
      .filter(
        (c) =>
          c?.client_id != null &&
          c.client_table != null &&
          validClientTables.includes(c.client_table as ClientTableType),
      )
      .map((c, index) => ({
        id: c.id ?? null,
        client_id: Number(c.client_id),
        client_type: c.client_type ?? null,
        client_table: c.client_table as ClientTableType,
        client_name: c.client_name ?? null,
        client_data: c.client_data ?? null,
        sort_order: c.sort_order ?? index + 1,
      }))
  }

  // Legacy fallback: single secondary client
  if (
    project.client2_id &&
    project.client2_table &&
    validClientTables.includes(project.client2_table as ClientTableType)
  ) {
    return [
      {
        client_id: Number(project.client2_id),
        client_type: project.client2_type ?? null,
        client_table: project.client2_table as ClientTableType,
        client_name: project.client2_name ?? null,
        client_data: project.client2_data ?? null,
        sort_order: 1,
      },
    ]
  }

  return []
}

// Initialize form with project data
function initializeForm() {
  if (props.project) {
    // Handle both ref and direct value
    const project =
      (props.project as { value: ProjectData })?.value || (props.project as ProjectData)

    settingsForm.name = String(project.name || '')
    settingsForm.address = String(project.address || '')
    settingsForm.description = String(project.description || '')
    settingsForm.status = String(project.status || 'draft')
    settingsForm.sys_status = resolveProjectSysStatus({
      sys_status: project.sys_status ?? null,
    })
    settingsForm.purchase_or_lease = String(project.purchase_or_lease || '')
    settingsForm.notes = String(project.notes || '')
    settingsForm.area = project.area ?? null
    settingsForm.level = project.level ?? ''
    settingsForm.clinic_model_type = project.clinic_model_type ?? ''
    settingsForm.healthcare_services = project.healthcare_services ?? ''
    settingsForm.long_term_fm_team_size = project.long_term_fm_team_size ?? ''
    settingsForm.monthly_budget_first_year = project.monthly_budget_first_year ?? ''
    settingsForm.est_clinical_hours_mds_on_site = project.est_clinical_hours_mds_on_site ?? ''
    settingsForm.hr_vision = Array.isArray(project.hr_vision) ? [...project.hr_vision] : []
    settingsForm.operational_hours = normalizeOperationalHours(project.operational_hours)
    settingsForm.contents_of_space = normalizeContentsOfSpace(project.contents_of_space)
    settingsForm.marketing_strategy = Array.isArray(project.marketing_strategy)
      ? [...project.marketing_strategy]
      : []
    settingsForm.locations_of_interest = Array.isArray(project.locations_of_interest)
      ? [...project.locations_of_interest]
      : []
    settingsForm.client_id = project.client_id || null
    settingsForm.client_type = project.client_type || null
    settingsForm.client_table = (project.client_table as ClientTableType | null) || null
    settingsForm.client_data = project.client_data || null
    settingsForm.client_name = (project as any).client_name || null
    settingsForm.additional_clients = resolveAdditionalClientsFromProject(project)
    settingsForm.project_foreman_id =
      (project as { project_foreman_id?: number | null }).project_foreman_id ?? null
    initialProjectForemanId.value = settingsForm.project_foreman_id
    settingsForm.update_task_foreman_on_all_tasks = false
    settingsForm.prj_manager =
      project.projectManager != null && Number(project.projectManager) > 0
        ? Number(project.projectManager)
        : null
    clientValidationError.value = ''
    foremanValidationError.value = ''
    managerValidationError.value = ''
    operationalHoursValidationError.value = ''
    void resolveProjectManagerDisplayName()

    const validClientTables: ClientTableType[] = ['pharma', 'physician', 'pharmacist', 'medical_clinic']
    if (project.client_id && project.client_table && validClientTables.includes(project.client_table as ClientTableType)) {
      loadClientData(project.client_table as ClientTableType, project.client_id)
    } else {
      selectedClient.value = null
    }
  }
}

// Update form when project data changes
watch(
  () => props.project,
  (newProject) => {
    if (newProject) {
      initializeForm()
    }
  },
  { immediate: true },
)

// Initialize form on mount
onMounted(() => {
  initializeForm()
  loadForemen()
  loadManagers()
})

// Methods
async function loadClientData(clientTable: ClientTableType | string | null, clientId: number) {
  // Check if clientTable is a valid ClientTableType
  const validClientTables: ClientTableType[] = ['pharma', 'physician', 'pharmacist', 'medical_clinic']
  
  if (!clientTable || !validClientTables.includes(clientTable as ClientTableType)) {
    console.warn('⚠️ Invalid or unsupported client_table:', clientTable)
    console.warn('💡 Supported types:', validClientTables)
    selectedClient.value = null
    return
  }

  try {
    const client = await clientsApi.getById(clientTable as ClientTableType, clientId)
    selectedClient.value = client
    console.log('✅ Client data loaded successfully:', client)
  } catch (error) {
    console.error('❌ Error loading client data:', error)
    const axiosError = error as { response?: { status?: number; data?: { message?: string } } }
    if (axiosError.response?.status === 400) {
      console.error('💡 400 Bad Request - client_table might be invalid or not supported by backend')
      console.error('💡 client_table value:', clientTable)
    }
    selectedClient.value = null
  }
}

function handleClientSelect(client: Client, clientTable: ClientTableType, clientType: string) {
  if (!client || !client.id) {
    return
  }
  
  settingsForm.client_id = client.id
  settingsForm.client_table = clientTable
  settingsForm.client_type = clientType
  
  // Store client data as JSON in client_data field
  if (client.data && typeof client.data === 'object') {
    settingsForm.client_data = client.data
  } else {
    // Fallback: create data object from client fields (excluding id and name)
    const { id, name, data, ...rest } = client
    settingsForm.client_data = Object.keys(rest).length > 0 ? rest : {}
  }

  settingsForm.additional_clients = settingsForm.additional_clients.filter(
    (c) => !(c.client_id === client.id && c.client_table === clientTable),
  )
  
  selectedClient.value = client
  showClientSelector.value = false
  clientValidationError.value = ''
}

function clearClient() {
  settingsForm.client_id = null
  settingsForm.client_table = null
  settingsForm.client_type = null
  settingsForm.client_data = null
  selectedClient.value = null
  clientValidationError.value = ''
}

function handleClientClear() {
  clearClient()
}

function handleAdditionalClientsSelect(items: ClientSelectionItem[]) {
  settingsForm.additional_clients = items
    .filter(
      (item) =>
        !(
          settingsForm.client_id != null &&
          settingsForm.client_table != null &&
          item.client.id === settingsForm.client_id &&
          item.clientTable === settingsForm.client_table
        ),
    )
    .map((item, index) => ({
      client_id: item.client.id,
      client_table: item.clientTable,
      client_type: item.clientType,
      client_name: item.client.name,
      client_data:
        item.client.data && typeof item.client.data === 'object' ? item.client.data : {},
      sort_order: index + 1,
    }))
  showAdditionalClientsSelector.value = false
}

function removeAdditionalClient(index: number) {
  settingsForm.additional_clients = settingsForm.additional_clients.filter((_, i) => i !== index)
}

function clearAdditionalClients() {
  settingsForm.additional_clients = []
}

function handleLocationsApply(codes: string[]) {
  settingsForm.locations_of_interest = [...codes]
  showLocationsSelector.value = false
}

function removeLocationOfInterest(code: string) {
  settingsForm.locations_of_interest = settingsForm.locations_of_interest.filter((c) => c !== code)
}

function handleHrVisionApply(specialties: string[]) {
  settingsForm.hr_vision = [...specialties]
  showHrVisionSelector.value = false
}

function removeHrVisionSpecialty(specialty: string) {
  settingsForm.hr_vision = settingsForm.hr_vision.filter((item) => item !== specialty)
}

async function loadForemen() {
  try {
    const response = await hrResourcesApi.getAllWorkerUsers(1, 100, {
      role_id: FOREMAN_ROLE_DB_ID,
    })
    availableForemen.value = response.workers.map((worker: WorkerUser) => ({
      id: worker.id,
      name: `${worker.first_name} ${worker.last_name}`.trim() || worker.email,
    }))
  } catch {
    availableForemen.value = []
  }
}

async function loadManagers() {
  try {
    const response = await hrResourcesApi.getAllWorkerUsers(1, 100, {
      role_id: 10, // Project Manager role
    })
    availableManagers.value = response.workers.map((worker: WorkerUser) => ({
      id: worker.id,
      name: `${worker.first_name} ${worker.last_name}`.trim() || worker.email,
      email: worker.email,
    }))
  } catch {
    availableManagers.value = []
  }
  await resolveProjectManagerDisplayName()
}

async function resolveProjectManagerDisplayName() {
  const id = settingsForm.prj_manager
  if (id == null) {
    projectManagerNameCache.value = ''
    return
  }
  const fromList = availableManagers.value.find((m) => m.id === Number(id))
  if (fromList) {
    projectManagerNameCache.value = `${fromList.name} (${fromList.email})`
    return
  }
  try {
    const worker = await hrResourcesApi.getWorkerById(Number(id))
    if (!worker) {
      projectManagerNameCache.value = `User ID: ${id}`
      return
    }
    const name =
      `${worker.first_name || ''} ${worker.last_name || ''}`.trim() || worker.email || `User ID: ${id}`
    projectManagerNameCache.value = worker.email ? `${name} (${worker.email})` : name
  } catch {
    projectManagerNameCache.value = `User ID: ${id}`
  }
}

const handleSubmit = () => {
  if (isSaving.value) {
    return // Prevent double submission
  }

  // Primary client is required
  if (!settingsForm.client_id) {
    clientValidationError.value = 'Primary client is required'
    activeSection.value = 'general'
    return
  }
  clientValidationError.value = ''

  if (canAssignManager.value && !settingsForm.prj_manager) {
    managerValidationError.value = 'My Account is required for administrators'
    activeSection.value = 'general'
    return
  }
  managerValidationError.value = ''

  if (!settingsForm.project_foreman_id) {
    foremanValidationError.value = 'Project foreman is required'
    activeSection.value = 'general'
    return
  }
  foremanValidationError.value = ''

  const hoursError = getOperationalHoursValidationError(settingsForm.operational_hours)
  if (hoursError) {
    operationalHoursValidationError.value = hoursError
    activeSection.value = 'healthcare'
    return
  }
  operationalHoursValidationError.value = ''

  isSaving.value = true
  emit('saveSettings')
  
  // Reset saving state after a short delay
  setTimeout(() => {
    isSaving.value = false
  }, 1000)
}

// Removed duplicate saveSettings method - using handleSubmit instead

// const resetSettings = () => {
//   emit('resetSettings')
// }

// Expose settingsForm to parent component
defineExpose({
  settingsForm,
})
</script>

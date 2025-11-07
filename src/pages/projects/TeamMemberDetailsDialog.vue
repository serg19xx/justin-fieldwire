<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
      <!-- Background overlay -->
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="close"></div>

      <!-- Modal panel -->
      <div
        class="bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:max-w-6xl sm:w-full max-h-[90vh] flex flex-col"
      >
        <!-- Header - Fixed -->
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 flex-shrink-0">
          <div class="sm:flex sm:items-start">
            <div class="mt-3 text-center sm:mt-0 sm:text-left w-full">
              <!-- Header -->
              <div class="flex items-center justify-between mb-6">
                <div class="flex items-center">
                  <div
                    v-if="member?.avatar_url || member?.full_img_url"
                    class="w-16 h-16 flex-shrink-0"
                  >
                    <img
                      :src="member.avatar_url || member.full_img_url || ''"
                      :alt="member.name"
                      class="w-16 h-16 rounded-full object-cover"
                    />
                  </div>
                  <div
                    v-else
                    class="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0"
                  >
                    <span class="text-white text-xl font-medium">
                      {{
                        (member?.name || 'Unknown')
                          .split(' ')
                          .map((n: string) => n.charAt(0))
                          .join('')
                      }}
                    </span>
                  </div>
                  <div class="ml-4">
                    <h3 class="text-lg font-medium text-gray-900">
                      {{ member?.name || 'Unknown User' }}
                    </h3>
                    <p class="text-sm text-gray-500">ID: {{ member?.user_id }}</p>
                    <div class="mt-2 flex flex-wrap gap-2">
                      <span
                        v-if="member?.role_in_project"
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {{ member.role_in_project }}
                      </span>
                      <span
                        v-if="member?.user_type"
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                      >
                        {{ member.user_type }}
                      </span>
                      <span
                        v-if="member?.job_title"
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                      >
                        {{ member.job_title }}
                      </span>
                      <span
                        v-if="member?.project_id"
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        Project #{{ member.project_id }}
                      </span>
                    </div>
                  </div>
                </div>
                <button @click="close" class="text-gray-400 hover:text-gray-600 transition-colors">
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
          </div>
        </div>

        <!-- Scrollable Content -->
        <div
          class="flex-1 overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        >
          <div v-if="member" class="space-y-6">
            <!-- Personal Information -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="text-lg font-medium text-gray-900 mb-4">Personal Information</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="text-sm font-medium text-gray-500">Email</label>
                  <p class="text-sm text-gray-900">{{ member.email || 'Not provided' }}</p>
                </div>
                <div v-if="member.phone">
                  <label class="text-sm font-medium text-gray-500">Phone</label>
                  <p class="text-sm text-gray-900">{{ member.phone }}</p>
                </div>
                <div v-if="member.first_name">
                  <label class="text-sm font-medium text-gray-500">First Name</label>
                  <p class="text-sm text-gray-900">{{ member.first_name }}</p>
                </div>
                <div v-if="member.last_name">
                  <label class="text-sm font-medium text-gray-500">Last Name</label>
                  <p class="text-sm text-gray-900">{{ member.last_name }}</p>
                </div>
                <div v-if="member.dob">
                  <label class="text-sm font-medium text-gray-500">Date of Birth</label>
                  <p class="text-sm text-gray-900">{{ member.dob }}</p>
                </div>
                <div v-if="member.gender">
                  <label class="text-sm font-medium text-gray-500">Gender</label>
                  <p class="text-sm text-gray-900">{{ member.gender }}</p>
                </div>
                <div v-if="member.nationality">
                  <label class="text-sm font-medium text-gray-500">Nationality</label>
                  <p class="text-sm text-gray-900">{{ member.nationality }}</p>
                </div>
                <div v-if="member.country_of_origin">
                  <label class="text-sm font-medium text-gray-500">Country of Origin</label>
                  <p class="text-sm text-gray-900">{{ member.country_of_origin }}</p>
                </div>
                <div v-if="member.workforce_group">
                  <label class="text-sm font-medium text-gray-500">Cultural Group</label>
                  <p class="text-sm text-gray-900">{{ member.workforce_group }}</p>
                </div>
                <div v-if="member.city">
                  <label class="text-sm font-medium text-gray-500">City</label>
                  <p class="text-sm text-gray-900">{{ member.city }}</p>
                </div>
              </div>
            </div>

            <!-- Professional Data -->
            <div
              v-if="member.professional_data && member.professional_data.length > 0"
              class="bg-gray-50 p-4 rounded-lg"
            >
              <h4 class="text-lg font-medium text-gray-900 mb-4">Professional Details</h4>
              <div
                v-for="(prof, index) in member.professional_data"
                :key="index"
                class="mb-6 p-4 bg-white rounded-lg border"
              >
                <h5 class="text-md font-medium text-gray-900 mb-4">
                  Professional Record #{{ index + 1 }}
                </h5>

                <!-- Education Section -->
                <div
                  v-if="
                    prof.education_level ||
                    prof.field_of_study ||
                    prof.institution_name ||
                    prof.graduation_year
                  "
                  class="mb-6"
                >
                  <h6
                    class="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-200 pb-1"
                  >
                    Education
                  </h6>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div v-if="prof.education_level">
                      <label class="font-medium text-gray-500">Education Level</label>
                      <p class="text-gray-900">{{ prof.education_level }}</p>
                    </div>
                    <div v-if="prof.field_of_study">
                      <label class="font-medium text-gray-500">Field of Study</label>
                      <p class="text-gray-900">{{ prof.field_of_study }}</p>
                    </div>
                    <div v-if="prof.institution_name">
                      <label class="font-medium text-gray-500">Institution</label>
                      <p class="text-gray-900">{{ prof.institution_name }}</p>
                    </div>
                    <div v-if="prof.graduation_year">
                      <label class="font-medium text-gray-500">Graduation Year</label>
                      <p class="text-gray-900">{{ prof.graduation_year }}</p>
                    </div>
                  </div>
                </div>

                <!-- Experience Section -->
                <div
                  v-if="
                    prof.total_experience ||
                    prof.specialized_experience ||
                    prof.key_projects ||
                    prof.previous_employers ||
                    prof.references
                  "
                  class="mb-6"
                >
                  <h6
                    class="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-200 pb-1"
                  >
                    Experience & Employment
                  </h6>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div v-if="prof.total_experience">
                      <label class="font-medium text-gray-500">Total Experience</label>
                      <p class="text-gray-900">{{ prof.total_experience }} years</p>
                    </div>
                    <div v-if="prof.specialized_experience">
                      <label class="font-medium text-gray-500">Specialized Experience</label>
                      <p class="text-gray-900">{{ prof.specialized_experience }}</p>
                    </div>
                    <div v-if="prof.key_projects" class="md:col-span-2">
                      <label class="font-medium text-gray-500">Key Projects</label>
                      <p class="text-gray-900">{{ prof.key_projects }}</p>
                    </div>
                    <div v-if="prof.previous_employers" class="md:col-span-2">
                      <label class="font-medium text-gray-500">Previous Employers</label>
                      <p class="text-gray-900">{{ prof.previous_employers }}</p>
                    </div>
                    <div v-if="prof.references" class="md:col-span-2">
                      <label class="font-medium text-gray-500">References</label>
                      <p class="text-gray-900">{{ prof.references }}</p>
                    </div>
                  </div>
                </div>

                <!-- Skills & Summary Section -->
                <div v-if="prof.specialized_skills || prof.professional_summary" class="mb-6">
                  <h6
                    class="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-200 pb-1"
                  >
                    Skills & Summary
                  </h6>
                  <div class="grid grid-cols-1 gap-4 text-sm">
                    <div v-if="prof.specialized_skills">
                      <label class="font-medium text-gray-500">Specialized Skills</label>
                      <p class="text-gray-900">{{ prof.specialized_skills }}</p>
                    </div>
                    <div v-if="prof.professional_summary">
                      <label class="font-medium text-gray-500">Professional Summary</label>
                      <p class="text-gray-900">{{ prof.professional_summary }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Contact Information -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="text-lg font-medium text-gray-900 mb-4">Contact Information</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="text-sm font-medium text-gray-500">Primary Email</label>
                  <p class="text-sm text-gray-900">{{ member.email || 'Not provided' }}</p>
                </div>
                <div v-if="member.phone">
                  <label class="text-sm font-medium text-gray-500">Phone Number</label>
                  <p class="text-sm text-gray-900">{{ member.phone }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProjectTeamMember } from '@/core/utils/project-api'

defineOptions({
  name: 'TeamMemberDetailsDialog',
})

interface ExtendedTeamMember extends ProjectTeamMember {
  phone?: string | null
  avatar_url?: string | null
  full_img_url?: string | null
  first_name?: string | null
  last_name?: string | null
  dob?: string | null
  gender?: string | null
  nationality?: string | null
  country_of_origin?: string | null
  workforce_group?: string | null
  city?: string | null
  professional_data?: Array<{
    education_level?: string
    field_of_study?: string
    institution_name?: string
    graduation_year?: string
    total_experience?: string
    specialized_experience?: string
    key_projects?: string
    previous_employers?: string
    references?: string
    specialized_skills?: string
    professional_summary?: string
  }>
}

interface Props {
  isOpen: boolean
  member: ExtendedTeamMember | null
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const close = () => {
  emit('close')
}
</script>

<template>
  <div class="team-section flex-1 flex flex-col">
    <!-- Team Members List -->
    <div class="bg-white rounded-lg shadow">
      <!-- Loading State -->
      <div v-if="loadingTeam" class="p-6">
        <div class="flex items-center justify-center">
          <svg class="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span class="ml-2 text-gray-600">Loading team members...</span>
        </div>
      </div>

      <!-- Team Members Table -->
      <div v-if="!loadingTeam && teamMembers.length > 0" class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Name
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Role
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Join Date
              </th>
              <th
                v-if="canEdit"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="(member, index) in safeMembers" :key="(member as any).id ?? (member as any).user_id ?? index" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <div
                      v-if="(member as any).avatar_url || (member as any).full_img_url"
                      class="h-10 w-10 rounded-full overflow-hidden"
                    >
                      <img
                        :src="(member as any).avatar_url || (member as any).full_img_url"
                        :alt="(member as any).name || 'User'"
                        class="h-10 w-10 object-cover"
                        @error="handleImageError"
                      />
                    </div>
                    <div
                      v-else
                      class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center"
                    >
                      <span class="text-sm font-medium text-gray-700">
                        {{
                          ((member as any).name || 'Unknown')
                            .split(' ')
                            .map((n: string) => n[0])
                            .join('')
                        }}
                      </span>
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ (member as any).name || 'Unknown User' }}
                    </div>
                    <div class="text-sm text-gray-500">
                      {{ (member as any).email || 'No email' }}
                    </div>
                    <div class="text-xs text-gray-400">
                      {{ (member as any).job_title || 'No job title' }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex flex-col">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="{
                      'bg-blue-100 text-blue-800': (member as any).role === 'lead',
                      'bg-green-100 text-green-800': (member as any).role === 'member',
                      'bg-yellow-100 text-yellow-800': (member as any).role === 'supervisor',
                      'bg-purple-100 text-purple-800': (member as any).role === 'coordinator',
                      'bg-gray-100 text-gray-800': ![
                        'lead',
                        'member',
                        'supervisor',
                        'coordinator',
                      ].includes((member as any).role),
                    }"
                  >
                    {{
                      (member as any).role === 'lead'
                        ? 'Team Lead'
                        : (member as any).role === 'member'
                          ? 'Team Member'
                          : (member as any).role === 'supervisor'
                            ? 'Supervisor'
                            : (member as any).role === 'coordinator'
                              ? 'Coordinator'
                              : (member as any).role
                    }}
                  </span>
                  <span class="text-xs text-gray-400 mt-1">
                    {{ getRoleStatusText() }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ (member as any).added_at ? new Date((member as any).added_at).toLocaleDateString() : '—' }}
              </td>
              <td v-if="canEdit" class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  @click="openMemberDetails(member)"
                  class="text-blue-600 hover:text-blue-900 mr-3"
                >
                  Info
                </button>
                <button @click="removeTeamMember(member)" class="text-red-600 hover:text-red-900">
                  Remove
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="!loadingTeam && teamMembers.length === 0" class="p-6 text-center">
        <svg
          class="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          ></path>
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No team members</h3>
        <p class="mt-1 text-sm text-gray-500">
          Get started by adding team members to this project.
        </p>
        <div v-if="canEdit" class="mt-6">
          <button
            @click="addTeamMember"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            + Add Team Member
          </button>
        </div>
      </div>
    </div>
  </div>

  
</template>

<script setup lang="ts">
defineOptions({
  name: 'TeamSection',
})

// Props
interface Props {
  teamMembers: unknown[]
  loadingTeam: boolean
  canEdit: boolean
}

import { computed } from 'vue'
const props = defineProps<Props>()

// Filter out null/undefined members to avoid runtime errors
const safeMembers = computed(() => (Array.isArray(props.teamMembers) ? props.teamMembers.filter(Boolean) : []))

// Emits
const emit = defineEmits<{
  memberDetails: [member: unknown]
  removeTeamMember: [member: unknown]
  addTeamMember: []
}>()

// Methods
const getRoleStatusText = () => {
  // This method should be implemented based on the original logic
  return 'Active'
}

const openMemberDetails = (member: unknown) => {
  emit('memberDetails', member)
}

const removeTeamMember = (member: unknown) => {
  emit('removeTeamMember', member)
}

const addTeamMember = () => {
  emit('addTeamMember')
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
  // Show fallback initials
  const parent = img.parentElement
  if (parent) {
    parent.innerHTML = `
      <div class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
        <span class="text-sm font-medium text-gray-700">
          ${(img.alt || 'U')
            .split(' ')
            .map((n: string) => n[0])
            .join('')}
        </span>
      </div>
    `
  }
}

// Tooltip removed per request
</script>

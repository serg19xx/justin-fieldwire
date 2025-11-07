<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4"
    @click="closeDialog"
  >
    <div
      class="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
      @click.stop
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 class="text-xl font-semibold text-gray-900">Add Team Member</h2>
        <button @click="closeDialog" class="text-gray-400 hover:text-gray-600 transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Search and Filters -->
      <div class="p-4 border-b border-gray-200 bg-gray-50">
        <div class="flex items-center space-x-4">
          <div class="flex-1 relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by name, language, certification..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg
              class="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
          </div>
          <select
            v-model="roleFilter"
            class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Roles</option>
            <option value="Engineer">Engineer</option>
            <option value="Foreman">Foreman</option>
            <option value="Worker">Worker</option>
            <option value="Operator">Operator</option>
            <option value="Supervisor">Supervisor</option>
          </select>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6">
        <!-- Selected count indicator -->
        <div v-if="selectedMembers.length > 0" class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p class="text-sm text-blue-800">
            <strong>{{ selectedMembers.length }}</strong> member{{ selectedMembers.length > 1 ? 's' : '' }} selected
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="member in filteredMembers"
            :key="member.id"
            @click="toggleMemberSelection(member)"
            :class="[
              'p-4 border rounded-lg hover:shadow-md transition-all cursor-pointer',
              isMemberSelected(member.id)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-500'
            ]"
          >
            <div class="flex items-start space-x-3">
              <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span class="text-lg font-medium text-blue-600">
                  {{ getInitials(member.name) }}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="font-semibold text-gray-900">{{ member.name }}</h3>
                    <p class="text-sm text-gray-600">{{ member.role }}</p>
                  </div>
                  <div v-if="isMemberSelected(member.id)" class="flex-shrink-0 ml-2">
                    <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                </div>
                <div class="mt-2 space-y-1 text-xs text-gray-600">
                  <div v-if="member.languages?.length" class="flex items-center space-x-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path>
                    </svg>
                    <span>{{ member.languages.join(', ') }}</span>
                  </div>
                  <div v-if="member.certifications?.length" class="flex items-center space-x-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>{{ member.certifications.join(', ') }}</span>
                  </div>
                  <div v-if="member.experience" class="flex items-center space-x-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>{{ member.experience }} years</span>
                  </div>
                  <div class="flex items-center space-x-1">
                    <span :class="member.available ? 'text-green-600' : 'text-red-600'">
                      {{ member.available ? '✓ Available' : '✗ Busy' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="filteredMembers.length === 0" class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
          <p class="mt-4 text-gray-500">No team members found</p>
        </div>
      </div>

      <!-- Footer with action buttons -->
      <div class="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
        <button
          @click="closeDialog"
          type="button"
          class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors text-sm font-medium"
        >
          Cancel
        </button>
        <button
          @click="saveSelectedMembers"
          :disabled="selectedMembers.length === 0"
          type="button"
          class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          Add Selected ({{ selectedMembers.length }})
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

// Props
interface Props {
  isOpen: boolean
  availablePeople?: Array<{ id: number; name: string; role: string }>
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  availablePeople: () => [],
})

// Emits
const emit = defineEmits<{
  close: []
  add: [memberIds: number[]]
}>()

// State
const searchQuery = ref('')
const roleFilter = ref('')
const selectedMembers = ref<number[]>([])

// Interface for team member (extended from availablePeople)
interface TeamMember {
  id: number
  name: string
  role: string
  languages?: string[]
  certifications?: string[]
  experience?: number
  available?: boolean
}

// Use real data from props instead of mock data
const teamMembers = computed<TeamMember[]>(() => {
  // Map availablePeople to TeamMember format
  return (props.availablePeople || []).map((person) => ({
    id: person.id,
    name: person.name,
    role: person.role,
    // Optional fields - can be extended later if API provides them
    languages: [],
    certifications: [],
    experience: undefined,
    available: true,
  }))
})

// Computed
const filteredMembers = computed(() => {
  let filtered = teamMembers.value

  // Role filter
  if (roleFilter.value) {
    filtered = filtered.filter((member) => member.role === roleFilter.value)
  }

  // Search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (member) =>
        member.name.toLowerCase().includes(query) ||
        member.role.toLowerCase().includes(query) ||
        member.languages?.some((lang) => lang.toLowerCase().includes(query)) ||
        member.certifications?.some((cert) => cert.toLowerCase().includes(query)),
    )
  }

  return filtered
})

// Methods
function closeDialog() {
  selectedMembers.value = []
  emit('close')
}

function toggleMemberSelection(member: TeamMember | { id: number; name: string; role: string }) {
  const index = selectedMembers.value.indexOf(member.id)
  if (index > -1) {
    // Remove from selection
    selectedMembers.value.splice(index, 1)
    console.log('👥 Removed member from selection:', member.id, member.name)
  } else {
    // Add to selection
    selectedMembers.value.push(member.id)
    console.log('👥 Added member to selection:', member.id, member.name)
  }
  console.log('👥 Current selected members:', selectedMembers.value)
}

function isMemberSelected(memberId: number): boolean {
  return selectedMembers.value.includes(memberId)
}

function saveSelectedMembers() {
  if (selectedMembers.value.length > 0) {
    console.log('👥 saveSelectedMembers called with:', selectedMembers.value)
    console.log('👥 Emitting add event with member IDs:', [...selectedMembers.value])
    emit('add', [...selectedMembers.value])
    selectedMembers.value = []
    console.log('✅ Selection cleared after emit')
  } else {
    console.warn('⚠️ saveSelectedMembers called but no members selected')
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Reset selection when dialog opens
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      selectedMembers.value = []
    }
  },
)
</script>


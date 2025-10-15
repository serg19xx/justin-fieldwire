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
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="member in filteredMembers"
            :key="member.id"
            @click="selectMember(member)"
            class="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
          >
            <div class="flex items-start space-x-3">
              <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span class="text-lg font-medium text-blue-600">
                  {{ getInitials(member.name) }}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-gray-900">{{ member.name }}</h3>
                <p class="text-sm text-gray-600">{{ member.role }}</p>
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

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
  add: [memberId: number]
}>()

// State
const searchQuery = ref('')
const roleFilter = ref('')

// Mock data with extended information
interface TeamMember {
  id: number
  name: string
  role: string
  languages?: string[]
  certifications?: string[]
  experience?: number
  available: boolean
}

const teamMembers = ref<TeamMember[]>([
  {
    id: 1,
    name: 'John Doe',
    role: 'Project Manager',
    languages: ['English', 'Spanish'],
    certifications: ['PMP', 'OSHA 30'],
    experience: 15,
    available: true,
  },
  {
    id: 2,
    name: 'Jane Smith',
    role: 'Engineer',
    languages: ['English', 'French'],
    certifications: ['PE', 'LEED AP'],
    experience: 10,
    available: false,
  },
  {
    id: 3,
    name: 'Bob Johnson',
    role: 'Foreman',
    languages: ['English'],
    certifications: ['OSHA 30', 'First Aid'],
    experience: 20,
    available: true,
  },
  {
    id: 4,
    name: 'Ahmed Hassan',
    role: 'Worker',
    languages: ['Arabic', 'English'],
    certifications: ['Welding', 'Scaffolding'],
    experience: 8,
    available: true,
  },
  {
    id: 5,
    name: 'Maria Garcia',
    role: 'Operator',
    languages: ['Spanish', 'English'],
    certifications: ['Crane Operator', 'CDL'],
    experience: 12,
    available: true,
  },
  {
    id: 6,
    name: 'Chen Wei',
    role: 'Supervisor',
    languages: ['Chinese', 'English'],
    certifications: ['OSHA 30', 'Quality Control'],
    experience: 18,
    available: false,
  },
  {
    id: 7,
    name: 'Youssef Al-Rashid',
    role: 'Worker',
    languages: ['Arabic', 'French'],
    certifications: ['Concrete', 'Masonry'],
    experience: 6,
    available: true,
  },
  {
    id: 8,
    name: 'Sarah Thompson',
    role: 'Engineer',
    languages: ['English'],
    certifications: ['PE', 'SE'],
    experience: 9,
    available: true,
  },
])

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
  emit('close')
}

function selectMember(member: TeamMember) {
  emit('add', member.id)
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
</script>


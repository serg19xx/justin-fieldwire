<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()

const projectId = computed(() => parseInt(route.params.id as string))
const project = computed(() => projectsStore.getProjectById(projectId.value))

const activeTab = ref('plans')
const selectedCategory = ref('all')

interface Plan {
  id: number
  name: string
  category: string
  status: 'pending' | 'confirmed' | 'archived'
  thumbnail?: string
  version?: string
}

const plans = ref<Plan[]>([
  {
    id: 1,
    name: 'LEEN CONSULTING Load Calculations Report',
    category: '4 88 Centre St N Load',
    status: 'pending',
  },
  { id: 2, name: 'INPUT', category: '4 88 Centre St N Load', status: 'pending' },
  { id: 3, name: 'Load Calculation Summary', category: '4 88 Centre St N Load', status: 'pending' },
  { id: 4, name: 'Architectural Plan A1', category: 'Architectural Set', status: 'pending' },
  { id: 5, name: 'Architectural Plan A2', category: 'Architectural Set', status: 'pending' },
  { id: 6, name: 'Architectural Plan A3', category: 'Architectural Set', status: 'pending' },
  { id: 7, name: 'Structural Plan S1', category: 'Structural Set', status: 'pending' },
  { id: 8, name: 'Structural Plan S2', category: 'Structural Set', status: 'pending' },
])

const categories = computed(() => {
  const cats = [...new Set(plans.value.map((plan) => plan.category))]
  return [
    { id: 'all', name: 'All plans', count: plans.value.length },
    ...cats.map((cat) => ({
      id: cat,
      name: cat,
      count: plans.value.filter((plan) => plan.category === cat).length,
    })),
  ]
})

const filteredPlans = computed(() => {
  if (selectedCategory.value === 'all') {
    return plans.value
  }
  return plans.value.filter((plan) => plan.category === selectedCategory.value)
})

const pendingPlans = computed(() => {
  return plans.value.filter((plan) => plan.status === 'pending')
})

onMounted(() => {
  if (!project.value) {
    router.push('/')
  }
})

function getStatusColor(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'confirmed':
      return 'bg-green-100 text-green-800'
    case 'archived':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
</script>

<template>
  <div v-if="project" class="flex">
    <div class="flex">
      <!-- Sidebar -->
      <aside class="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
        <div class="p-4">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ project.name }}</h2>

          <!-- FIELD MANAGEMENT -->
          <div class="mb-6">
            <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              FIELD MANAGEMENT
            </h3>
            <nav class="space-y-1">
              <button
                @click="activeTab = 'plans'"
                :class="`w-full text-left px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'plans'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`"
              >
                Plans
              </button>
              <button
                @click="activeTab = 'specifications'"
                :class="`w-full text-left px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'specifications'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`"
              >
                Specifications
              </button>
              <button
                @click="activeTab = 'tasks'"
                :class="`w-full text-left px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'tasks'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`"
              >
                Tasks
              </button>
              <button
                @click="activeTab = 'photos'"
                :class="`w-full text-left px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'photos'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`"
              >
                Photos
              </button>
              <button
                @click="activeTab = 'forms'"
                :class="`w-full text-left px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'forms'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`"
              >
                Forms
              </button>
              <button
                @click="activeTab = 'files'"
                :class="`w-full text-left px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'files'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`"
              >
                Files
              </button>
            </nav>
          </div>

          <!-- PROJECT MANAGEMENT -->
          <div>
            <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              PROJECT MANAGEMENT
            </h3>
            <nav class="space-y-1">
              <div class="space-y-1">
                <button
                  class="w-full text-left px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                >
                  My tasks (87)
                </button>
                <button
                  class="w-full text-left px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                >
                  Watched tasks (87)
                </button>
                <button
                  class="w-full text-left px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                >
                  All tasks (87)
                </button>
              </div>

              <div class="mt-4 space-y-1">
                <div class="px-3 py-1 text-xs font-medium text-gray-500 uppercase">Categories</div>
                <button
                  class="w-full text-left px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded"
                >
                  BA Baseboards (1)
                </button>
                <button
                  class="w-full text-left px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded"
                >
                  CW Concrete Work (1)
                </button>
                <button
                  class="w-full text-left px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded"
                >
                  DE Demolition (2)
                </button>
                <button
                  class="w-full text-left px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded"
                >
                  EL Electrical (3)
                </button>
                <button
                  class="w-full text-left px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded"
                >
                  FP Fire Protection (1)
                </button>
              </div>
            </nav>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 p-6">
        <div v-if="activeTab === 'plans'">
          <!-- Plans Header -->
          <div class="mb-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-2xl font-bold text-gray-900">Plans</h2>
              <div class="flex items-center space-x-3">
                <button
                  class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  + New plan
                </button>
                <button
                  class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  + New folder
                </button>
                <button
                  class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Actions
                </button>
              </div>
            </div>

            <div class="flex items-center justify-between mb-4">
              <p class="text-sm text-gray-600">
                Fieldwire has automatically named {{ pendingPlans.length }} plans
              </p>
              <div class="flex items-center space-x-3">
                <button
                  class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Filter plans
                </button>
                <button
                  class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Version control
                </button>
                <button
                  class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    ></path>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center space-x-3 mb-6">
              <button
                class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Confirm individually
              </button>
              <button
                class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Confirm all
              </button>
              <button
                class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Revert to page numbers
              </button>
            </div>
          </div>

          <!-- Plans Categories -->
          <div class="space-y-6">
            <div
              v-for="category in categories"
              :key="category.id"
              class="bg-white rounded-lg shadow-sm border border-gray-200"
            >
              <div class="p-4 border-b border-gray-200">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-medium text-gray-900">
                    {{ category.name }} ({{ category.count }} plans)
                  </h3>
                  <button
                    v-if="category.id !== 'all' && category.count > 0"
                    class="inline-flex items-center px-3 py-1 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
                  >
                    Confirm names ({{ category.count }})
                  </button>
                </div>
              </div>

              <div class="p-4">
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <div
                    v-for="plan in filteredPlans.filter(
                      (p) => category.id === 'all' || p.category === category.id,
                    )"
                    :key="plan.id"
                    class="border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm cursor-pointer"
                  >
                    <div
                      class="aspect-[3/4] bg-gray-100 rounded mb-2 flex items-center justify-center"
                    >
                      <div class="text-center">
                        <div class="text-2xl font-bold text-gray-400">{{ plan.id }}</div>
                        <div class="text-xs text-gray-500">Page</div>
                      </div>
                    </div>
                    <div class="text-xs font-medium text-gray-900 truncate">{{ plan.name }}</div>
                    <div class="mt-1">
                      <span
                        :class="`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(plan.status)}`"
                      >
                        {{ plan.status === 'pending' ? 'Pending Confirmation' : plan.status }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="activeTab === 'tasks'" class="text-center py-12">
          <h3 class="text-lg font-medium text-gray-900">Tasks Management</h3>
          <p class="text-gray-500">Task management interface will be implemented here</p>
        </div>

        <div v-else class="text-center py-12">
          <h3 class="text-lg font-medium text-gray-900">
            {{ activeTab.charAt(0).toUpperCase() + activeTab.slice(1) }}
          </h3>
          <p class="text-gray-500">{{ activeTab }} interface will be implemented here</p>
        </div>
      </main>
    </div>
  </div>
</template>

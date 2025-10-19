<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4"
    @click="closeDialog"
  >
    <div
      class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      @click.stop
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 class="text-xl font-semibold text-gray-900">Add Resource</h2>
        <button @click="closeDialog" class="text-gray-400 hover:text-gray-600 transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Resource Type Tabs -->
      <div class="border-b border-gray-200">
        <nav class="flex -mb-px">
          <button
            @click="activeTab = 'equipment'"
            :class="[
              'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'equipment'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            🚜 Equipment
          </button>
          <button
            @click="activeTab = 'materials'"
            :class="[
              'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'materials'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            📦 Materials
          </button>
          <button
            @click="activeTab = 'tools'"
            :class="[
              'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'tools'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            🔧 Tools
          </button>
        </nav>
      </div>

      <!-- Search and Filters -->
      <div class="p-4 border-b border-gray-200 bg-gray-50">
        <div class="flex items-center space-x-4">
          <div class="flex-1 relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search resources..."
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
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6">
        <!-- Equipment Tab -->
        <div v-if="activeTab === 'equipment'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="equipment in filteredEquipment"
            :key="equipment.id"
            @click="selectResource(equipment)"
            class="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
          >
            <div class="flex items-start space-x-3">
              <div class="text-3xl">🚜</div>
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900">{{ equipment.name }}</h3>
                <div class="mt-2 space-y-1 text-sm text-gray-600">
                  <p><span class="font-medium">Type:</span> {{ equipment.type }}</p>
                  <p v-if="equipment.capacity"><span class="font-medium">Capacity:</span> {{ equipment.capacity }}</p>
                  <p v-if="equipment.specifications"><span class="font-medium">Specs:</span> {{ equipment.specifications }}</p>
                  <p><span class="font-medium">Status:</span>
                    <span :class="equipment.available ? 'text-green-600' : 'text-red-600'">
                      {{ equipment.available ? 'Available' : 'In Use' }}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Materials Tab -->
        <div v-else-if="activeTab === 'materials'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="material in filteredMaterials"
            :key="material.id"
            @click="selectResource(material)"
            class="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
          >
            <div class="flex items-start space-x-3">
              <div class="text-3xl">📦</div>
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900">{{ material.name }}</h3>
                <div class="mt-2 space-y-1 text-sm text-gray-600">
                  <p><span class="font-medium">Type:</span> {{ material.type }}</p>
                  <p><span class="font-medium">Unit:</span> {{ material.unit }}</p>
                  <p><span class="font-medium">Available:</span> {{ material.quantity }} {{ material.unit }}</p>
                  <p v-if="material.specifications"><span class="font-medium">Specs:</span> {{ material.specifications }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tools Tab -->
        <div v-else-if="activeTab === 'tools'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="tool in filteredTools"
            :key="tool.id"
            @click="selectResource(tool)"
            class="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
          >
            <div class="flex items-start space-x-3">
              <div class="text-3xl">🔧</div>
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900">{{ tool.name }}</h3>
                <div class="mt-2 space-y-1 text-sm text-gray-600">
                  <p><span class="font-medium">Type:</span> {{ tool.type }}</p>
                  <p v-if="tool.specifications"><span class="font-medium">Specs:</span> {{ tool.specifications }}</p>
                  <p><span class="font-medium">Status:</span>
                    <span :class="tool.available ? 'text-green-600' : 'text-red-600'">
                      {{ tool.available ? 'Available' : 'In Use' }}
                    </span>
                  </p>
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
import { ref, computed } from 'vue'

// Props
interface Props {
  isOpen: boolean
}

defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  add: [resource: string]
}>()

// State
const activeTab = ref<'equipment' | 'materials' | 'tools'>('equipment')
const searchQuery = ref('')

// Mock data - Equipment
const equipment = [
  {
    id: 1,
    name: 'Excavator CAT 320D',
    type: 'Excavator',
    capacity: '20 tons',
    specifications: 'Bucket width: 2m, Reach: 9.5m',
    available: true,
  },
  {
    id: 2,
    name: 'Bulldozer Komatsu D85',
    type: 'Bulldozer',
    capacity: '85 HP',
    specifications: 'Blade width: 3.5m',
    available: false,
  },
  {
    id: 3,
    name: 'Crane Liebherr LTM 1100',
    type: 'Mobile Crane',
    capacity: '100 tons',
    specifications: 'Max height: 52m, Max radius: 48m',
    available: true,
  },
  {
    id: 4,
    name: 'Loader Volvo L120',
    type: 'Wheel Loader',
    capacity: '7.5 m³',
    specifications: 'Engine: 224 HP',
    available: true,
  },
]

// Mock data - Materials
const materials = [
  {
    id: 1,
    name: 'Portland Cement Type I',
    type: 'Cement',
    unit: 'tons',
    quantity: 150,
    specifications: 'High quality, standard setting',
  },
  {
    id: 2,
    name: 'Reinforcement Steel Grade 60',
    type: 'Steel',
    unit: 'tons',
    quantity: 45,
    specifications: 'Diameter: 12mm-32mm',
  },
  {
    id: 3,
    name: 'Concrete Mix C30/37',
    type: 'Concrete',
    unit: 'm³',
    quantity: 200,
    specifications: 'Compressive strength: 30 MPa',
  },
  {
    id: 4,
    name: 'Sand - Fine Grade',
    type: 'Aggregate',
    unit: 'm³',
    quantity: 300,
    specifications: 'Washed and graded',
  },
]

// Mock data - Tools
const tools = [
  {
    id: 1,
    name: 'Concrete Mixer 350L',
    type: 'Mixer',
    specifications: 'Electric 2.2kW motor',
    available: true,
  },
  {
    id: 2,
    name: 'Welding Machine MIG 200A',
    type: 'Welding',
    specifications: 'Industrial grade, 200A capacity',
    available: true,
  },
  {
    id: 3,
    name: 'Power Generator 15kVA',
    type: 'Generator',
    specifications: 'Diesel, silent type',
    available: false,
  },
  {
    id: 4,
    name: 'Vibrating Compactor',
    type: 'Compactor',
    specifications: 'Plate size: 500x500mm',
    available: true,
  },
]

// Computed
const filteredEquipment = computed(() => {
  if (!searchQuery.value) return equipment
  const query = searchQuery.value.toLowerCase()
  return equipment.filter(
    (item) =>
      item.name.toLowerCase().includes(query) ||
      item.type.toLowerCase().includes(query) ||
      item.specifications?.toLowerCase().includes(query),
  )
})

const filteredMaterials = computed(() => {
  if (!searchQuery.value) return materials
  const query = searchQuery.value.toLowerCase()
  return materials.filter(
    (item) =>
      item.name.toLowerCase().includes(query) ||
      item.type.toLowerCase().includes(query) ||
      item.specifications?.toLowerCase().includes(query),
  )
})

const filteredTools = computed(() => {
  if (!searchQuery.value) return tools
  const query = searchQuery.value.toLowerCase()
  return tools.filter(
    (item) =>
      item.name.toLowerCase().includes(query) ||
      item.type.toLowerCase().includes(query) ||
      item.specifications?.toLowerCase().includes(query),
  )
})

// Methods
function closeDialog() {
  emit('close')
}

function selectResource(resource: { name: string }) {
  emit('add', resource.name)
}
</script>


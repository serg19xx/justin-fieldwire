<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[120] p-4"
    @click="closeDialog"
  >
    <div
      class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      @click.stop
    >
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 class="text-xl font-semibold text-gray-900">HR Vision</h2>
          <p class="mt-1 text-sm text-gray-500">Selected specialties: {{ draftSpecialties.length }}</p>
        </div>
        <button type="button" class="text-gray-400 hover:text-gray-600" @click="closeDialog">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="p-6 border-b border-gray-100">
        <input
          v-model="searchQuery"
          type="search"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search specialty…"
        />
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <div v-for="group in filteredGroups" :key="group.letter">
          <h3 class="sticky top-0 bg-white py-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {{ group.letter }}
          </h3>
          <ul class="divide-y divide-gray-100 border border-gray-200 rounded-md overflow-hidden">
            <li
              v-for="specialty in group.items"
              :key="specialty"
              class="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
              @click="toggleSpecialty(specialty)"
            >
              <input
                type="checkbox"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                :checked="draftSet.has(specialty)"
                @click.stop
                @change="toggleSpecialty(specialty)"
              />
              <span class="text-sm text-gray-900">{{ specialty }}</span>
            </li>
          </ul>
        </div>
        <p v-if="filteredGroups.length === 0" class="text-center text-sm text-gray-500 py-8">
          No specialties match your search.
        </p>
      </div>

      <div class="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          @click="clearAll"
        >
          Clear
        </button>
        <button
          type="button"
          class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium"
          @click="closeDialog"
        >
          Cancel
        </button>
        <button
          type="button"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
          @click="applySelection"
        >
          Apply ({{ draftSpecialties.length }})
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { HR_VISION_SPECIALTIES } from '@/core/utils/hr-vision-specialties'

interface Props {
  isOpen: boolean
  selectedSpecialties?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  selectedSpecialties: () => [],
})

const emit = defineEmits<{
  close: []
  apply: [specialties: string[]]
}>()

const searchQuery = ref('')
const draftSpecialties = ref<string[]>([])

const draftSet = computed(() => new Set(draftSpecialties.value))

interface SpecialtyGroup {
  letter: string
  items: string[]
}

const filteredGroups = computed((): SpecialtyGroup[] => {
  const q = searchQuery.value.trim().toLowerCase()
  const filtered = !q
    ? [...HR_VISION_SPECIALTIES]
    : HR_VISION_SPECIALTIES.filter((item) => item.toLowerCase().includes(q))

  const byLetter = new Map<string, string[]>()
  for (const item of filtered) {
    const letter = item[0]?.toUpperCase() || '?'
    const list = byLetter.get(letter) || []
    list.push(item)
    byLetter.set(letter, list)
  }

  return Array.from(byLetter.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([letter, items]) => ({ letter, items }))
})

function toggleSpecialty(specialty: string) {
  if (draftSet.value.has(specialty)) {
    draftSpecialties.value = draftSpecialties.value.filter((s) => s !== specialty)
  } else {
    draftSpecialties.value = [...draftSpecialties.value, specialty].sort((a, b) =>
      a.localeCompare(b),
    )
  }
}

function clearAll() {
  draftSpecialties.value = []
}

function applySelection() {
  emit('apply', [...draftSpecialties.value])
  emit('close')
}

function closeDialog() {
  emit('close')
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      draftSpecialties.value = [...(props.selectedSpecialties || [])].sort((a, b) =>
        a.localeCompare(b),
      )
      searchQuery.value = ''
    }
  },
)

defineOptions({
  name: 'HrVisionSelectorDialog',
})
</script>

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
          <h2 class="text-xl font-semibold text-gray-900">Locations of interest</h2>
          <p class="mt-1 text-sm text-gray-500">Selected: {{ draftCodes.length }}</p>
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
          placeholder="Search by code or city…"
        />
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <div v-for="group in filteredGroups" :key="group.letter">
          <h3 class="sticky top-0 bg-white py-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {{ group.letter }}
          </h3>
          <ul class="divide-y divide-gray-100 border border-gray-200 rounded-md overflow-hidden">
            <li
              v-for="item in group.items"
              :key="item.code"
              class="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
              @click="toggleCode(item.code)"
            >
              <input
                type="checkbox"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                :checked="draftSet.has(item.code)"
                @click.stop
                @change="toggleCode(item.code)"
              />
              <span class="text-sm font-medium text-gray-900 w-12">{{ item.code }}</span>
              <span class="text-sm text-gray-600">{{ item.city }}</span>
            </li>
          </ul>
        </div>
        <p v-if="filteredGroups.length === 0" class="text-center text-sm text-gray-500 py-8">
          No locations match your search.
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
          Apply ({{ draftCodes.length }})
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  POSTAL_FSA_LOCATIONS,
  type PostalFsaLocation,
} from '@/core/utils/postal-fsa-locations'

interface Props {
  isOpen: boolean
  selectedCodes?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  selectedCodes: () => [],
})

const emit = defineEmits<{
  close: []
  apply: [codes: string[]]
}>()

const searchQuery = ref('')
const draftCodes = ref<string[]>([])

const draftSet = computed(() => new Set(draftCodes.value))

interface FsaGroup {
  letter: string
  items: PostalFsaLocation[]
}

const filteredGroups = computed((): FsaGroup[] => {
  const q = searchQuery.value.trim().toLowerCase()
  const filtered = !q
    ? POSTAL_FSA_LOCATIONS
    : POSTAL_FSA_LOCATIONS.filter(
        (item) =>
          item.code.toLowerCase().includes(q) || item.city.toLowerCase().includes(q),
      )

  const byLetter = new Map<string, PostalFsaLocation[]>()
  for (const item of filtered) {
    const letter = item.code[0] || '?'
    const list = byLetter.get(letter) || []
    list.push(item)
    byLetter.set(letter, list)
  }

  return Array.from(byLetter.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([letter, items]) => ({ letter, items }))
})

function toggleCode(code: string) {
  if (draftSet.value.has(code)) {
    draftCodes.value = draftCodes.value.filter((c) => c !== code)
  } else {
    draftCodes.value = [...draftCodes.value, code].sort()
  }
}

function clearAll() {
  draftCodes.value = []
}

function applySelection() {
  emit('apply', [...draftCodes.value])
  emit('close')
}

function closeDialog() {
  emit('close')
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      draftCodes.value = [...(props.selectedCodes || [])].map((c) => c.toUpperCase()).sort()
      searchQuery.value = ''
    }
  },
)

defineOptions({
  name: 'PostalFsaSelectorDialog',
})
</script>

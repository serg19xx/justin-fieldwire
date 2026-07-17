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
          <h2 class="text-xl font-semibold text-gray-900">Project Inclusions</h2>
          <p class="mt-1 text-sm text-gray-500">Selected: {{ draftItems.length }}</p>
        </div>
        <button type="button" class="text-gray-400 hover:text-gray-600" @click="closeDialog">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="p-4 border-b border-gray-100">
        <input
          v-model="searchQuery"
          type="search"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search inclusions…"
        />
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <div v-for="group in filteredGroups" :key="group.label">
          <h3 class="sticky top-0 z-[1] bg-white py-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {{ group.label }}
          </h3>
          <ul class="divide-y divide-gray-100 border border-gray-200 rounded-md overflow-hidden">
            <li
              v-for="item in group.items"
              :key="`${group.label}:${item}`"
              class="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
              @click="toggleItem(item)"
            >
              <input
                type="checkbox"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                :checked="draftSet.has(item)"
                @click.stop
                @change="toggleItem(item)"
              />
              <span class="text-sm text-gray-900">{{ item }}</span>
            </li>
          </ul>
        </div>
        <p v-if="filteredGroups.length === 0" class="text-center text-sm text-gray-500 py-8">
          No inclusions match your search.
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
          Apply ({{ draftItems.length }})
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  PROJECT_INCLUSION_GROUPS,
  type ProjectInclusionGroup,
} from '@/core/utils/project-inclusions'

interface Props {
  isOpen: boolean
  selectedItems?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  selectedItems: () => [],
})

const emit = defineEmits<{
  close: []
  apply: [items: string[]]
}>()

const searchQuery = ref('')
const draftItems = ref<string[]>([])
const draftSet = computed(() => new Set(draftItems.value))

const filteredGroups = computed((): ProjectInclusionGroup[] => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) {
    return [...PROJECT_INCLUSION_GROUPS]
  }
  return PROJECT_INCLUSION_GROUPS.map((group) => ({
    label: group.label,
    items: group.items.filter(
      (item) =>
        item.toLowerCase().includes(q) || group.label.toLowerCase().includes(q),
    ),
  })).filter((group) => group.items.length > 0)
})

function toggleItem(item: string) {
  if (draftSet.value.has(item)) {
    draftItems.value = draftItems.value.filter((s) => s !== item)
  } else {
    draftItems.value = [...draftItems.value, item]
  }
}

function clearAll() {
  draftItems.value = []
}

function applySelection() {
  emit('apply', [...draftItems.value])
  emit('close')
}

function closeDialog() {
  emit('close')
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      draftItems.value = [...(props.selectedItems || [])]
      searchQuery.value = ''
    }
  },
)

defineOptions({
  name: 'ProjectInclusionsSelectorDialog',
})
</script>

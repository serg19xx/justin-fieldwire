<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[120] p-4"
    @click="closeDialog"
  >
    <div
      class="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
      @click.stop
    >
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 class="text-xl font-semibold text-gray-900">Healthcare Services</h2>
          <p class="mt-1 text-sm text-gray-500">Selected: {{ draftServices.length }}</p>
        </div>
        <button type="button" class="text-gray-400 hover:text-gray-600" @click="closeDialog">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-4">
        <ul class="divide-y divide-gray-100 border border-gray-200 rounded-md overflow-hidden">
          <li
            v-for="service in options"
            :key="service"
            class="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer"
            @click="toggleService(service)"
          >
            <input
              type="checkbox"
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              :checked="draftSet.has(service)"
              @click.stop
              @change="toggleService(service)"
            />
            <span class="text-sm text-gray-900">{{ service }}</span>
          </li>
        </ul>
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
          Apply ({{ draftServices.length }})
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { PROJECT_HEALTHCARE_SERVICES } from '@/core/utils/constants'

interface Props {
  isOpen: boolean
  selectedServices?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  selectedServices: () => [],
})

const emit = defineEmits<{
  close: []
  apply: [services: string[]]
}>()

const options = PROJECT_HEALTHCARE_SERVICES
const draftServices = ref<string[]>([])
const draftSet = computed(() => new Set(draftServices.value))

function toggleService(service: string) {
  if (draftSet.value.has(service)) {
    draftServices.value = draftServices.value.filter((s) => s !== service)
  } else {
    draftServices.value = [...draftServices.value, service]
  }
}

function clearAll() {
  draftServices.value = []
}

function applySelection() {
  emit('apply', [...draftServices.value])
  emit('close')
}

function closeDialog() {
  emit('close')
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      draftServices.value = [...(props.selectedServices || [])]
    }
  },
)

defineOptions({
  name: 'HealthcareServicesSelectorDialog',
})
</script>

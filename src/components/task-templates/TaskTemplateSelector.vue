<template>
  <div class="task-template-selector">
    <!-- Search and Filter -->
    <div class="mb-4 space-y-3">
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search templates..."
          class="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        />
        <svg
          class="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <!-- Category Filter -->
      <div v-if="categories.length > 0" class="flex flex-wrap gap-2">
        <button
          v-for="category in categories"
          :key="category"
          @click="toggleCategory(category)"
          :class="[
            'px-3 py-1 text-sm rounded-full transition-colors',
            selectedCategories.has(category)
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
          ]"
        >
          {{ category }}
        </button>
      </div>
    </div>

    <!-- Templates List -->
    <div class="space-y-2 max-h-96 overflow-y-auto">
      <div
        v-for="template in filteredTemplates"
        :key="template.id"
        :class="[
          'p-4 border rounded-lg cursor-pointer transition-all',
          isSelected(template.id)
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
        ]"
        @click="toggleSelection(template)"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <input
                type="checkbox"
                :checked="isSelected(template.id)"
                @click.stop
                @change="toggleSelection(template)"
                class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <h3 class="font-medium text-gray-900">{{ template.name }}</h3>
              <span
                v-if="template.category"
                class="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
              >
                {{ template.category }}
              </span>
            </div>
            <p v-if="template.description" class="text-sm text-gray-600 mt-1">
              {{ template.description }}
            </p>
            <div class="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
              <span v-if="template.duration_days">
                Duration: {{ template.duration_days }} day{{ template.duration_days !== 1 ? 's' : '' }}
              </span>
              <span v-if="template.start_offset_days !== null && template.start_offset_days !== undefined">
                Starts: {{ formatOffset(template.start_offset_days) }}
              </span>
              <span v-if="template.milestone" class="text-blue-600 font-medium">
                Milestone
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="filteredTemplates.length === 0" class="text-center py-8 text-gray-500">
        <p>No templates found</p>
        <p class="text-sm mt-1">Try adjusting your search or filters</p>
      </div>
    </div>

    <!-- Selection Summary -->
    <div v-if="selectedTemplates.length > 0" class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <p class="text-sm font-medium text-blue-900">
        {{ selectedTemplates.length }} template{{ selectedTemplates.length !== 1 ? 's' : '' }} selected
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { taskTemplatesApi } from '@/core/utils/task-templates-api'
import { initializeDefaultTemplates } from '@/core/utils/task-templates-init'
import type { TaskTemplate } from '@/core/types/task'

interface Props {
  selectedTemplateIds?: number[]
}

interface Emits {
  (e: 'update:selectedTemplateIds', ids: number[]): void
  (e: 'selection-changed', templates: TaskTemplate[]): void
}

const props = withDefaults(defineProps<Props>(), {
  selectedTemplateIds: () => [],
})

const emit = defineEmits<Emits>()

const templates = ref<TaskTemplate[]>([])
const searchQuery = ref('')
const selectedCategories = ref<Set<string>>(new Set())
const categories = ref<string[]>([])

const selectedTemplates = computed(() => {
  return templates.value.filter((t) => props.selectedTemplateIds.includes(t.id!))
})

const filteredTemplates = computed(() => {
  let filtered = templates.value

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.category?.toLowerCase().includes(query),
    )
  }

  // Filter by category
  if (selectedCategories.value.size > 0) {
    filtered = filtered.filter((t) => t.category && selectedCategories.value.has(t.category))
  }

  // Sort by task_order or name
  return filtered.sort((a, b) => {
    if (a.task_order !== undefined && b.task_order !== undefined) {
      return a.task_order - b.task_order
    }
    return a.name.localeCompare(b.name)
  })
})

function isSelected(templateId?: number): boolean {
  if (!templateId) return false
  return props.selectedTemplateIds.includes(templateId)
}

function toggleSelection(template: TaskTemplate) {
  if (!template.id) return

  const currentIds = [...props.selectedTemplateIds]
  const index = currentIds.indexOf(template.id)

  if (index > -1) {
    currentIds.splice(index, 1)
  } else {
    currentIds.push(template.id)
  }

  emit('update:selectedTemplateIds', currentIds)
  emit('selection-changed', templates.value.filter((t) => currentIds.includes(t.id!)))
}

function toggleCategory(category: string) {
  if (selectedCategories.value.has(category)) {
    selectedCategories.value.delete(category)
  } else {
    selectedCategories.value.add(category)
  }
}

function formatOffset(days: number): string {
  if (days === 0) return 'Project start'
  if (days > 0) return `+${days} day${days !== 1 ? 's' : ''}`
  return `${days} day${days !== -1 ? 's' : ''}`
}

async function loadTemplates() {
  try {
    templates.value = await taskTemplatesApi.getAll()
    
    // Initialize default templates if none exist
    if (templates.value.length === 0) {
      console.log('📋 No templates found, initializing defaults...')
      await initializeDefaultTemplates()
      templates.value = await taskTemplatesApi.getAll()
    }
    
    categories.value = await taskTemplatesApi.getCategories()
  } catch (error) {
    console.error('Error loading templates:', error)
  }
}

onMounted(() => {
  loadTemplates()
})

// Expose refresh method for parent component
defineExpose({
  refresh: loadTemplates,
})
</script>

<style scoped>
.task-template-selector {
  @apply w-full;
}
</style>


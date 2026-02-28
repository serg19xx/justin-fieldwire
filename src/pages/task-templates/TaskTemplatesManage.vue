<template>
  <div class="min-h-screen bg-gray-50">
    <div class="px-4 py-6 md:px-6">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-semibold text-gray-900">Task Templates</h1>
            <p class="mt-1 text-sm text-gray-600">
              Manage task templates for quick task creation in projects.
            </p>
          </div>
          <button
            type="button"
            @click="openCreate"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Template
          </button>
        </div>

        <!-- Filters -->
        <div class="bg-white p-4 rounded-lg border border-gray-200 mb-4">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                v-model="filterCategory"
                class="w-full h-10 px-4 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All categories</option>
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                v-model="filterSearch"
                type="text"
                placeholder="Name or description..."
                class="w-full h-10 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div class="flex items-end">
              <button
                type="button"
                @click="clearFilters"
                class="h-10 px-4 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <!-- Table -->
        <div class="bg-white shadow-sm rounded-lg border border-gray-200">
          <div v-if="loading" class="p-8 text-center text-gray-500">Loading...</div>
          <div v-else class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start offset</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Milestone</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="t in filteredTemplates" :key="t.id" class="hover:bg-gray-50">
                  <td class="px-4 py-3">
                    <div class="text-sm font-medium text-gray-900">{{ t.name }}</div>
                    <div v-if="t.description" class="text-xs text-gray-500 truncate max-w-xs">{{ t.description }}</div>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-600">{{ t.category ?? '—' }}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">{{ t.duration_days ?? '—' }}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">{{ t.start_offset_days ?? '—' }}</td>
                  <td class="px-4 py-3">
                    <span
                      v-if="t.milestone"
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"
                    >
                      {{ t.milestone }}
                    </span>
                    <span v-else class="text-gray-400">—</span>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-600">{{ t.status ?? 'planned' }}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">{{ t.task_order ?? '—' }}</td>
                  <td class="px-4 py-3 text-right text-sm font-medium space-x-2">
                    <button type="button" @click="openEdit(t)" class="text-green-600 hover:text-green-900">Edit</button>
                    <button type="button" @click="confirmDelete(t)" class="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Empty state -->
          <div v-if="!loading && filteredTemplates.length === 0" class="text-center py-12">
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No task templates</h3>
            <p class="mt-1 text-sm text-gray-500">Get started by adding a new template.</p>
            <div class="mt-6">
              <button
                type="button"
                @click="openCreate"
                class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                Add Template
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit dialog -->
    <TaskTemplateDialog
      :is-open="dialogOpen"
      :template="editingTemplate"
      @close="closeDialog"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { taskTemplatesApi } from '@/core/utils/task-templates-api'
import type { TaskTemplate } from '@/core/types/task'
import TaskTemplateDialog from './TaskTemplateDialog.vue'

const templates = ref<TaskTemplate[]>([])
const loading = ref(false)
const dialogOpen = ref(false)
const editingTemplate = ref<TaskTemplate | null>(null)
const filterCategory = ref('')
const filterSearch = ref('')

const categories = computed(() => {
  const set = new Set<string>()
  templates.value.forEach((t) => {
    if (t.category) set.add(t.category)
  })
  return Array.from(set).sort()
})

const filteredTemplates = computed(() => {
  let list = templates.value
  if (filterCategory.value) {
    list = list.filter((t) => t.category === filterCategory.value)
  }
  if (filterSearch.value.trim()) {
    const q = filterSearch.value.toLowerCase()
    list = list.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description?.toLowerCase().includes(q) ?? false)
    )
  }
  return list.sort((a, b) => (a.task_order ?? 0) - (b.task_order ?? 0))
})

async function loadTemplates() {
  loading.value = true
  try {
    templates.value = await taskTemplatesApi.getAll()
  } catch (e) {
    console.error('Failed to load task templates', e)
    templates.value = []
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingTemplate.value = null
  dialogOpen.value = true
}

function openEdit(t: TaskTemplate) {
  editingTemplate.value = { ...t }
  dialogOpen.value = true
}

function closeDialog() {
  dialogOpen.value = false
  editingTemplate.value = null
}

async function handleSave(payload: Omit<TaskTemplate, 'id' | 'created_at' | 'updated_at'>) {
  try {
    if (editingTemplate.value?.id) {
      await taskTemplatesApi.update(editingTemplate.value.id, payload)
    } else {
      await taskTemplatesApi.create(payload)
    }
    await loadTemplates()
    closeDialog()
  } catch (e) {
    console.error('Failed to save template', e)
    throw e
  }
}

function confirmDelete(t: TaskTemplate) {
  const id = t.id
  if (id == null) return
  if (!confirm(`Delete template "${t.name}"?`)) return
  taskTemplatesApi
    .delete(id)
    .then(() => loadTemplates())
    .catch((e) => {
      console.error('Failed to delete template', e)
    })
}

function clearFilters() {
  filterCategory.value = ''
  filterSearch.value = ''
}

onMounted(() => {
  loadTemplates()
})

defineOptions({
  name: 'TaskTemplatesManage',
})
</script>

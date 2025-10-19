<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4"
    @click="closeDialog"
  >
    <div
      class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      @click.stop
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 class="text-xl font-semibold text-gray-900">Add Task Dependency</h2>
        <button @click="closeDialog" class="text-gray-400 hover:text-gray-600 transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-6">
        <form @submit.prevent="handleAdd">
          <!-- Select Task -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Predecessor Task *
            </label>
            <select
              v-model="form.taskId"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a task</option>
              <option
                v-for="task in availableTasks"
                :key="task.id"
                :value="String(task.id)"
              >
                {{ task.name }}
                <span v-if="task.wbs_path"> ({{ task.wbs_path }})</span>
              </option>
            </select>
            <p class="mt-1 text-xs text-gray-500">
              The task that must be completed before this task can start/finish
            </p>
          </div>

          <!-- Dependency Type -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Dependency Type *
            </label>
            <div class="space-y-2">
              <label class="flex items-start p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors" :class="{ 'border-blue-500 bg-blue-50': form.type === 'FS' }">
                <input
                  v-model="form.type"
                  type="radio"
                  value="FS"
                  class="mt-1 mr-3"
                />
                <div>
                  <div class="font-medium text-gray-900">Finish-to-Start (FS)</div>
                  <div class="text-xs text-gray-500">The predecessor must finish before this task can start</div>
                </div>
              </label>

              <label class="flex items-start p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors" :class="{ 'border-blue-500 bg-blue-50': form.type === 'SS' }">
                <input
                  v-model="form.type"
                  type="radio"
                  value="SS"
                  class="mt-1 mr-3"
                />
                <div>
                  <div class="font-medium text-gray-900">Start-to-Start (SS)</div>
                  <div class="text-xs text-gray-500">The predecessor must start before this task can start</div>
                </div>
              </label>

              <label class="flex items-start p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors" :class="{ 'border-blue-500 bg-blue-50': form.type === 'FF' }">
                <input
                  v-model="form.type"
                  type="radio"
                  value="FF"
                  class="mt-1 mr-3"
                />
                <div>
                  <div class="font-medium text-gray-900">Finish-to-Finish (FF)</div>
                  <div class="text-xs text-gray-500">The predecessor must finish before this task can finish</div>
                </div>
              </label>

              <label class="flex items-start p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors" :class="{ 'border-blue-500 bg-blue-50': form.type === 'SF' }">
                <input
                  v-model="form.type"
                  type="radio"
                  value="SF"
                  class="mt-1 mr-3"
                />
                <div>
                  <div class="font-medium text-gray-900">Start-to-Finish (SF)</div>
                  <div class="text-xs text-gray-500">The predecessor must start before this task can finish</div>
                </div>
              </label>
            </div>
          </div>

          <!-- Lag Days -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Lag Days <span class="text-gray-400">(optional)</span>
            </label>
            <input
              v-model.number="form.lagDays"
              type="number"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
            <p class="mt-1 text-xs text-gray-500">
              Number of days to wait after the dependency condition is met
            </p>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end space-x-3">
            <button
              type="button"
              @click="closeDialog"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Add Dependency
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Task } from '@/core/types/task'

// Props
interface Props {
  isOpen: boolean
  availableTasks?: Task[]
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  availableTasks: () => [],
})

// Emits
const emit = defineEmits<{
  close: []
  add: [dependency: { taskId: string; type: string; lagDays: number }]
}>()

// Form
const form = ref({
  taskId: '',
  type: 'FS',
  lagDays: 0,
})

// Reset form when dialog opens
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      form.value = {
        taskId: '',
        type: 'FS',
        lagDays: 0,
      }
    }
  },
)

// Methods
function closeDialog() {
  emit('close')
}

function handleAdd() {
  if (form.value.taskId) {
    emit('add', { ...form.value })
  }
}
</script>


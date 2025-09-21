<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">Task Outside Project Bounds</h3>
      </div>

      <!-- Content -->
      <div class="px-6 py-4">
        <p class="text-gray-700 mb-4">
          Task dates are outside project bounds ({{ projectStart }} to {{ projectEnd }}).
        </p>

        <div class="bg-yellow-50 p-3 rounded-md mb-4">
          <p class="text-sm text-yellow-800"><strong>Issue:</strong> {{ reason }}</p>
        </div>

        <div class="text-sm text-gray-600 mb-4">
          <p><strong>Current task dates:</strong> {{ taskStart }} to {{ taskEnd }}</p>
          <p><strong>Adjusted dates:</strong> {{ adjustedStart }} to {{ adjustedEnd }}</p>
        </div>
      </div>

      <!-- Actions -->
      <div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
        <button
          @click="handleCancel"
          type="button"
          class="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
        <button
          @click="handleAdjust"
          type="button"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Adjust
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

interface Props {
  isOpen: boolean
  taskStart: string
  taskEnd: string
  projectStart: string
  projectEnd: string
  adjustedStart: string
  adjustedEnd: string
  reason: string
}

defineProps<Props>()

const emit = defineEmits<{
  cancel: []
  adjust: []
}>()

function handleCancel() {
  emit('cancel')
}

function handleAdjust() {
  emit('adjust')
}
</script>

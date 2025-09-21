<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">Dependency Constraint Violation</h3>
      </div>

      <!-- Content -->
      <div class="px-6 py-4">
        <p class="text-gray-700 mb-4">Task dates violate dependency constraints.</p>

        <div class="bg-red-50 p-3 rounded-md mb-4">
          <p class="text-sm text-red-800"><strong>Issue:</strong> {{ reason }}</p>
        </div>

        <!-- Violated Constraints -->
        <div v-if="violatedConstraints.length > 0" class="mb-4">
          <h4 class="text-sm font-medium text-gray-700 mb-2">Violated Dependencies:</h4>
          <div class="space-y-2">
            <div
              v-for="constraint in violatedConstraints"
              :key="`${constraint.predecessorId}-${constraint.type}`"
              class="bg-gray-50 p-3 rounded-md text-sm"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="font-medium text-gray-900">{{ constraint.predecessorName }}</span>
                <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  {{ constraint.type }}
                </span>
              </div>
              <div class="text-gray-600">
                <div>
                  Predecessor: {{ constraint.predecessorStartDate }} to
                  {{ constraint.predecessorEndDate }}
                </div>
                <div v-if="constraint.lagDays > 0" class="text-orange-600">
                  +{{ constraint.lagDays }} day{{ constraint.lagDays > 1 ? 's' : '' }} lag
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="text-sm text-gray-600 mb-4">
          <p><strong>Current task dates:</strong> {{ taskStart }} to {{ taskEnd }}</p>
          <p v-if="suggestedStart && suggestedEnd">
            <strong>Suggested dates:</strong> {{ suggestedStart }} to {{ suggestedEnd }}
          </p>
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
          v-if="suggestedStart && suggestedEnd"
          @click="handleAdjust"
          type="button"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Adjust to Dependencies
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import type { DependencyConstraint } from '@/utils/dependency-validator'

interface Props {
  isOpen: boolean
  taskStart: string
  taskEnd: string
  violatedConstraints: DependencyConstraint[]
  suggestedStart?: string
  suggestedEnd?: string
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

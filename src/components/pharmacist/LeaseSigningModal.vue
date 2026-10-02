<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs overflow-y-auto"
    role="dialog"
    aria-modal="true"
    aria-labelledby="lease-dialog-title"
  >
    <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]">
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider bg-blue-900/60 text-blue-200 px-2 py-0.5 rounded border border-blue-500/40">
            Step 4 of 4 • Lease Execution
          </span>
          <h2 id="lease-dialog-title" class="text-lg font-bold mt-1">
            Short Commercial Lease Agreement
          </h2>
          <p class="text-xs text-blue-100">
            Project: {{ project?.prj_name || 'Selected Project' }}
          </p>
        </div>
        <button
          type="button"
          @click="emit('close')"
          class="text-blue-200 hover:text-white p-1 rounded hover:bg-blue-700/60 transition-colors text-lg font-bold"
          aria-label="Close dialog"
        >
          ✕
        </button>
      </div>

      <!-- Scrollable Lease Content & Entries -->
      <div class="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
        <div class="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-2 text-xs">
          <p class="font-semibold text-gray-900">Standard Lease Terms & Premise Entries:</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-600">
            <div><span class="text-gray-400">Premises Location:</span> {{ projectAddress || 'Location Confirmed' }}</div>
            <div><span class="text-gray-400">Target Area:</span> {{ project?.area ? `${project.area} sq ft` : 'Commercial Space' }}</div>
            <div><span class="text-gray-400">Designated Use:</span> Retail Pharmacy & Healthcare Dispensary</div>
            <div><span class="text-gray-400">Term:</span> 5 Years with 5-Year Renewal Option</div>
          </div>
        </div>

        <!-- Modifications / Requested Terms by Client -->
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-gray-800">
            Client Modifications / Notes (Optional):
          </label>
          <textarea
            v-model="modifications"
            rows="3"
            placeholder="Enter any requested adjustments, fixture periods, or operational conditions to submit with your signed lease..."
            class="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
          ></textarea>
        </div>

        <!-- Agreement Terms Box -->
        <div class="border border-gray-200 rounded-lg p-4 bg-white space-y-2 font-mono text-[11px] max-h-48 overflow-y-auto leading-normal">
          <p class="font-bold text-gray-900">STANDARD COMMERCIAL LEASE CONDENSED PROVISIONS</p>
          <p>
            1. Possession & Fixturing: Tenant shall be granted a reasonable fixturing period prior to rent commencement upon completion of landlord base building work.
          </p>
          <p>
            2. Permitted Use: Tenant shall operate the Premises primarily as an accredited pharmacy dispensary and medical supply retail space in coordination with the clinic.
          </p>
          <p>
            3. Utilities & Maintenance: Tenant agrees to standard proportionate share of common area expenses and direct billing for premise-metered utilities.
          </p>
        </div>

        <!-- Digital Signature Entry -->
        <div class="pt-2 border-t border-gray-200 space-y-3">
          <label class="block text-xs font-semibold text-gray-800">
            Type your full legal name to execute lease signature:
          </label>
          <input
            v-model="inputSignatureName"
            type="text"
            placeholder="Type your full legal name"
            class="w-full px-3.5 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
            :class="signatureError ? 'border-red-400 bg-red-50' : 'border-gray-300'"
          />
          <p v-if="signatureError" class="text-xs text-red-600">
            Please enter your full name to execute the lease agreement.
          </p>

          <div class="flex items-start gap-2 pt-1">
            <input
              id="lease-ack"
              v-model="hasAcknowledged"
              type="checkbox"
              class="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label for="lease-ack" class="text-xs text-gray-600 leading-snug cursor-pointer">
              I certify that I have read and agree to the Short Commercial Lease Agreement terms, subject to any requested modifications noted above.
            </label>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="bg-gray-50 px-6 py-3.5 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
        <span class="text-[11px] text-gray-500">
          This digital agreement will be delivered to the Project Manager.
        </span>
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            @click="emit('close')"
            class="flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="handleSign"
            :disabled="isSubmitting || !hasAcknowledged || !inputSignatureName.trim()"
            class="flex-1 sm:flex-none px-5 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            {{ isSubmitting ? 'Submitting...' : 'Sign & Submit Lease Agreement' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Project } from '@/core/utils/project-api'

const props = defineProps<{
  open: boolean
  project: Project | null
  projectAddress?: string
  signerName?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'signed', data: { signerName: string; modifications: string }): void
}>()

const inputSignatureName = ref('')
const modifications = ref('')
const hasAcknowledged = ref(false)
const signatureError = ref(false)
const isSubmitting = ref(false)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      inputSignatureName.value = props.signerName || ''
      modifications.value = ''
      hasAcknowledged.value = false
      signatureError.value = false
      isSubmitting.value = false
    }
  },
  { immediate: true },
)

function handleSign(): void {
  if (!inputSignatureName.value.trim()) {
    signatureError.value = true
    return
  }

  isSubmitting.value = true
  signatureError.value = false

  emit('signed', {
    signerName: inputSignatureName.value.trim(),
    modifications: modifications.value.trim(),
  })
}
</script>

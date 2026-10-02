<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs overflow-y-auto"
    role="dialog"
    aria-modal="true"
    aria-labelledby="nda-dialog-title"
  >
    <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]">
      <!-- Modal Header -->
      <div class="bg-gradient-to-r from-teal-700 to-teal-800 text-white px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider bg-teal-900/60 text-teal-200 px-2 py-0.5 rounded border border-teal-500/40">
            Step 1 of 4 • Digital Contract
          </span>
          <h2 id="nda-dialog-title" class="text-lg font-bold mt-1">
            NDA, Non-Solicitation & Project Fees Agreement
          </h2>
          <p class="text-xs text-teal-100">
            Project: {{ project?.prj_name || 'Selected Project' }}
          </p>
        </div>
        <button
          type="button"
          @click="emit('close')"
          class="text-teal-200 hover:text-white p-1 rounded hover:bg-teal-700/60 transition-colors text-lg font-bold"
          aria-label="Close dialog"
        >
          ✕
        </button>
      </div>

      <!-- Scrollable Contract Content -->
      <div class="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
        <div class="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-2 text-xs">
          <p class="font-semibold text-gray-900">Signer Identity Information (Pre-filled):</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-600">
            <div><span class="text-gray-400">Pharmacist:</span> {{ signerName || 'Pharmacist' }}</div>
            <div><span class="text-gray-400">Email:</span> {{ signerEmail || 'N/A' }}</div>
            <div><span class="text-gray-400">Cell Phone:</span> {{ signerPhone || 'N/A' }}</div>
            <div><span class="text-gray-400">Date:</span> {{ currentDate }}</div>
          </div>
        </div>

        <div class="border border-gray-200 rounded-lg p-4 bg-white space-y-3 font-mono text-[11px] max-h-56 overflow-y-auto leading-normal">
          <p class="font-bold text-gray-900">1. CONFIDENTIALITY & NON-DISCLOSURE (NDA)</p>
          <p>
            The Recipient agrees that all information relating to Project "{{ project?.prj_name }}", including location, lease specifications, drawings, and business terms disclosed prior to formal execution, constitutes proprietary confidential information.
          </p>

          <p class="font-bold text-gray-900">2. NON-SOLICITATION & NON-COMPETE</p>
          <p>
            The Recipient agrees not to circumvent the Project Manager or approach property owners, co-tenants, or clinic doctors directly regarding this location for a period of 24 months from the date hereof without written consent.
          </p>

          <p class="font-bold text-gray-900">3. PROJECT FEES & FACILITATION TERMS</p>
          <p>
            The Recipient acknowledges the project facilitation structure, standard tenant improvement guidelines, and agree that upon digital execution of this agreement, the project site address and documentation will be unlocked for inspection.
          </p>
        </div>

        <!-- Digital Signature Entry Form -->
        <div class="pt-2 border-t border-gray-200 space-y-3">
          <label class="block text-xs font-semibold text-gray-800">
            Type your full legal name to execute digital signature:
          </label>
          <input
            v-model="inputSignatureName"
            type="text"
            placeholder="Type your full legal name (e.g. John Doe, RPh)"
            class="w-full px-3.5 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium"
            :class="signatureError ? 'border-red-400 bg-red-50' : 'border-gray-300'"
          />
          <p v-if="signatureError" class="text-xs text-red-600">
            Please enter your full name to complete digital signing.
          </p>

          <div class="flex items-start gap-2 pt-1">
            <input
              id="nda-ack"
              v-model="hasAcknowledged"
              type="checkbox"
              class="mt-0.5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <label for="nda-ack" class="text-xs text-gray-600 leading-snug cursor-pointer">
              I certify under penalty of perjury that I am authorized to bind this entity and accept the terms of the Non-Disclosure, Non-Solicitation, Non-Compete, and Project Fees Agreement.
            </label>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="bg-gray-50 px-6 py-3.5 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
        <span class="text-[11px] text-gray-500">
          Once signed, the project address will be revealed immediately.
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
            class="flex-1 sm:flex-none px-5 py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            {{ isSubmitting ? 'Signing...' : 'Sign Digital NDA & Unlock Address' }}
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
  signerName?: string
  signerEmail?: string
  signerPhone?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'signed', signature: { signerName: string }): void
}>()

const inputSignatureName = ref('')
const hasAcknowledged = ref(false)
const signatureError = ref(false)
const isSubmitting = ref(false)
const currentDate = new Date().toLocaleDateString(undefined, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      inputSignatureName.value = props.signerName || ''
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
  })
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      @click.self="emit('close')"
    >
      <div class="w-full max-w-md rounded-xl bg-white shadow-xl overflow-hidden">
        <header class="px-4 py-3 border-b border-gray-200">
          <h2 :id="titleId" class="text-base font-semibold text-gray-900">
            {{ kind === 'start' ? 'Record work start' : 'Record work end' }}
          </h2>
          <p v-if="plannedHint" class="text-xs text-gray-500 mt-1">{{ plannedHint }}</p>
        </header>

        <div class="px-4 py-4 space-y-4">
          <div>
            <label :for="datetimeInputId" class="block text-xs font-medium text-gray-700 mb-1">
              Date &amp; time <span class="text-red-600">*</span>
            </label>
            <input
              :id="datetimeInputId"
              v-model="localDateTime"
              type="datetime-local"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
            <button
              v-if="kind === 'start' && plannedStartLocal"
              type="button"
              class="mt-2 text-xs font-medium text-orange-700 hover:text-orange-800"
              @click="localDateTime = plannedStartLocal"
            >
              Use planned start time
            </button>
          </div>

          <div>
            <label :for="reasonInputId" class="block text-xs font-medium text-gray-700 mb-1">
              Reason if different from plan
              <span class="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              :id="reasonInputId"
              v-model="reasonDraft"
              rows="3"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              placeholder="e.g. Sand delivery delayed, crew started early…"
            />
          </div>

          <p v-if="validationError" class="text-xs text-red-700">{{ validationError }}</p>
        </div>

        <footer class="flex gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            class="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
            :disabled="isSaving"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            type="button"
            class="flex-1 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
            :disabled="isSaving"
            @click="confirm"
          >
            {{ isSaving ? 'Saving…' : 'Save' }}
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { datetimeLocalToApiValue, toDatetimeLocalValue } from '@/core/utils/task-field-work-datetime'

export type WorkTimeDialogKind = 'start' | 'end'

const props = defineProps<{
  open: boolean
  kind: WorkTimeDialogKind
  plannedHint?: string
  plannedStartLocal?: string | null
  initialAt?: string | null
  initialReason?: string | null
  /** Minimum datetime-local for end (must be >= start). */
  minDatetimeLocal?: string | null
  isSaving?: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [payload: { at: string; reason: string }]
}>()

const titleId = `work-time-title-${Math.random().toString(36).slice(2, 9)}`
const datetimeInputId = `work-time-dt-${titleId}`
const reasonInputId = `work-time-reason-${titleId}`

const localDateTime = ref('')
const reasonDraft = ref('')
const validationError = ref('')

function resetForm(): void {
  localDateTime.value = props.initialAt
    ? toDatetimeLocalValue(props.initialAt)
    : toDatetimeLocalValue(new Date())
  reasonDraft.value = props.initialReason ?? ''
  validationError.value = ''
}

watch(
  () => [props.open, props.kind, props.initialAt, props.initialReason] as const,
  ([isOpen]) => {
    if (isOpen) resetForm()
  },
)

function confirm(): void {
  validationError.value = ''
  const at = datetimeLocalToApiValue(localDateTime.value)
  if (!at) {
    validationError.value = 'Please enter a valid date and time.'
    return
  }
  if (props.minDatetimeLocal && localDateTime.value < props.minDatetimeLocal) {
    validationError.value = 'End time must be on or after work start time.'
    return
  }
  emit('save', { at, reason: reasonDraft.value.trim() })
}

const isSaving = computed(() => props.isSaving === true)
</script>

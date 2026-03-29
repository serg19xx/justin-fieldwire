<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="dialog-title"
      role="dialog"
      aria-modal="true"
    >
      <div class="flex min-h-full items-center justify-center p-4">
        <div
          class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          @click="$emit('close')"
        />
        <div
          class="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          @click.stop
        >
          <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h2 id="dialog-title" class="text-lg font-semibold text-gray-900">
              {{ template?.id ? 'Edit Task Template' : 'New Task Template' }}
            </h2>
            <button
              type="button"
              class="text-gray-400 hover:text-gray-600"
              aria-label="Close"
              @click="$emit('close')"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form class="px-6 py-4 space-y-4" @submit.prevent="submit">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Name <span class="text-red-500">*</span></label>
              <input
                v-model="form.name"
                type="text"
                required
                maxlength="255"
                class="w-full h-10 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Task template name"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                v-model="form.description"
                rows="2"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Optional description"
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  v-model="form.category"
                  type="text"
                  maxlength="100"
                  class="w-full h-10 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g. Planning & Design, HVAC"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">WBS Path</label>
                <input
                  v-model="form.wbs_path"
                  type="text"
                  maxlength="100"
                  class="w-full h-10 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g. 1.1.1"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
                <input
                  v-model.number="form.duration_days"
                  type="number"
                  min="0"
                  step="1"
                  class="w-full h-10 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="—"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Start offset (days)</label>
                <input
                  v-model.number="form.start_offset_days"
                  type="number"
                  class="w-full h-10 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Days from project start"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">End offset (days)</label>
                <input
                  v-model.number="form.end_offset_days"
                  type="number"
                  class="w-full h-10 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Alternative to duration"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Milestone type</label>
                <select
                  v-model="form.milestone"
                  class="w-full h-10 px-4 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">— Regular task</option>
                  <option v-for="m in milestoneOptions" :key="m" :value="m">{{ m }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Default status</label>
                <select
                  v-model="form.status"
                  class="w-full h-10 px-4 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option v-for="s in statusOptions" :key="s" :value="s">{{ formatStatus(s) }}</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Task order</label>
              <input
                v-model.number="form.task_order"
                type="number"
                min="0"
                step="1"
                class="w-full h-10 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Order in template sequence"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                v-model="form.notes"
                rows="2"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Additional notes"
              />
            </div>

            <div class="flex justify-end gap-2 pt-4 border-t border-gray-200">
              <button
                type="button"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                @click="$emit('close')"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                {{ template?.id ? 'Save' : 'Create' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { watch, ref } from 'vue'
import type { TaskTemplate } from '@/core/types/task'
import type { TaskStatus } from '@/core/types/task'
import type { MilestoneType } from '@/core/types/task'

const MILESTONE_OPTIONS: MilestoneType[] = [
  'inspection',
  'visit',
  'meeting',
  'review',
  'delivery',
  'approval',
  'other',
]

const STATUS_OPTIONS: TaskStatus[] = [
  'planned',
  'scheduled',
  'scheduled_accepted',
  'in_progress',
  'partially_completed',
  'delayed_due_to_issue',
  'ready_for_inspection',
  'completed',
]

interface Props {
  isOpen: boolean
  template: TaskTemplate | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  save: [payload: Omit<TaskTemplate, 'id' | 'created_at' | 'updated_at'>]
}>()

const milestoneOptions = ref(MILESTONE_OPTIONS)
const statusOptions = ref(STATUS_OPTIONS)

const form = ref({
  name: '',
  description: '' as string | undefined,
  category: '' as string | undefined,
  duration_days: undefined as number | undefined,
  start_offset_days: undefined as number | null | undefined,
  end_offset_days: undefined as number | null | undefined,
  milestone: '' as '' | MilestoneType,
  status: 'planned' as TaskStatus,
  notes: '' as string | undefined,
  wbs_path: '' as string | undefined,
  task_order: undefined as number | undefined,
})

watch(
  () => [props.isOpen, props.template] as const,
  ([open, template]) => {
    if (!open) return
    if (template) {
      form.value = {
        name: template.name,
        description: template.description ?? '',
        category: template.category ?? '',
        duration_days: template.duration_days,
        start_offset_days: template.start_offset_days,
        end_offset_days: template.end_offset_days,
        milestone: (template.milestone ?? '') as '' | MilestoneType,
        status: template.status ?? 'planned',
        notes: template.notes ?? '',
        wbs_path: template.wbs_path ?? '',
        task_order: template.task_order,
      }
    } else {
      form.value = {
        name: '',
        description: '',
        category: '',
        duration_days: undefined,
        start_offset_days: undefined,
        end_offset_days: undefined,
        milestone: '' as '' | MilestoneType,
        status: 'planned',
        notes: '',
        wbs_path: '',
        task_order: undefined,
      }
    }
  },
  { immediate: true }
)

function formatStatus(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function submit() {
  const payload: Omit<TaskTemplate, 'id' | 'created_at' | 'updated_at'> = {
    name: form.value.name.trim(),
    description: form.value.description?.trim() || undefined,
    category: form.value.category?.trim() || undefined,
    duration_days: form.value.duration_days ?? undefined,
    start_offset_days: form.value.start_offset_days ?? undefined,
    end_offset_days: form.value.end_offset_days ?? undefined,
    milestone: form.value.milestone === '' || form.value.milestone == null ? null : form.value.milestone,
    status: form.value.status,
    notes: form.value.notes?.trim() || undefined,
    wbs_path: form.value.wbs_path?.trim() || undefined,
    task_order: form.value.task_order ?? undefined,
  }
  emit('save', payload)
}

defineOptions({
  name: 'TaskTemplateDialog',
})
</script>

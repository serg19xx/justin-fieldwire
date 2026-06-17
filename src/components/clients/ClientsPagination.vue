<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import AppIcon from '@/components/AppIcon.vue'

const props = defineProps<{
  page: number
  pageSize: number
  total: number
  pages: number
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:page': [page: number]
}>()

const jumpInputId = useId()
const pageInput = ref('')

const rangeStart = computed(() => {
  if (props.total === 0) return 0
  return (props.page - 1) * props.pageSize + 1
})

const rangeEnd = computed(() => {
  if (props.total === 0) return 0
  return Math.min(props.page * props.pageSize, props.total)
})

const pageCount = computed(() => {
  const n = Number(props.pages)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
})

watch(
  () => props.page,
  (value) => {
    pageInput.value = String(value)
  },
  { immediate: true },
)

function goToPage(target: number) {
  const page = Math.floor(Number(target))
  if (props.loading || page < 1 || page > pageCount.value || page === props.page) return
  emit('update:page', page)
}

function readPageInput(): number {
  const raw = String(pageInput.value ?? '').trim()
  if (!raw) return Number.NaN
  return Number.parseInt(raw, 10)
}

function submitPageJump() {
  const parsed = readPageInput()
  if (Number.isNaN(parsed)) {
    pageInput.value = String(props.page)
    return
  }
  const clamped = Math.min(pageCount.value, Math.max(1, parsed))
  pageInput.value = String(clamped)
  if (props.loading || clamped === props.page) return
  emit('update:page', clamped)
}
</script>

<template>
  <div
    v-if="pageCount > 0"
    class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 min-w-0 w-full"
  >
    <p class="text-sm text-gray-600 shrink-0">
      <template v-if="total === 0">No entries</template>
      <template v-else>
        Showing
        <span class="font-medium text-gray-900">{{ rangeStart }}</span>
        to
        <span class="font-medium text-gray-900">{{ rangeEnd }}</span>
        of
        <span class="font-medium text-gray-900">{{ total }}</span>
        entries
      </template>
    </p>

    <div class="flex flex-wrap items-center justify-end gap-2 min-w-0 ml-auto">
      <button
        type="button"
        class="inline-flex items-center justify-center px-2.5 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40"
        :disabled="page <= 1 || loading"
        title="Previous page"
        @click="goToPage(page - 1)"
      >
        <AppIcon icon="mdi:chevron-left" :size="20" />
      </button>

      <button
        type="button"
        class="inline-flex items-center justify-center px-2.5 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40"
        :disabled="page >= pageCount || loading"
        title="Next page"
        @click="goToPage(page + 1)"
      >
        <AppIcon icon="mdi:chevron-right" :size="20" />
      </button>

      <div v-if="pageCount > 1" class="flex flex-wrap items-center gap-2 text-sm text-gray-600 min-w-0">
        <span class="whitespace-nowrap">Page</span>
        <input
          :id="jumpInputId"
          v-model="pageInput"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          class="w-[5.5rem] px-2 py-1.5 border border-gray-300 rounded bg-white text-sm text-center tabular-nums"
          :disabled="loading"
          @keydown.enter.prevent="submitPageJump"
        />
        <span class="whitespace-nowrap tabular-nums">of {{ pageCount }}</span>
        <button
          type="button"
          class="inline-flex items-center gap-1 px-2.5 py-2 text-sm font-medium border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40"
          :disabled="loading"
          title="Go to page"
          @click.prevent="submitPageJump"
        >
          <span>Go</span>
          <AppIcon icon="mdi:arrow-right-bold" :size="16" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  archivedAt?: string | null
}>()

const archivedLabel = computed(() => {
  if (!props.archivedAt) return ''
  const d = new Date(props.archivedAt.replace(' ', 'T'))
  return Number.isNaN(d.getTime())
    ? 'Archived'
    : `Archived ${d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`
})
</script>

<template>
  <span
    v-if="archivedAt"
    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700"
    :title="archivedLabel"
  >
    Archived
  </span>
</template>

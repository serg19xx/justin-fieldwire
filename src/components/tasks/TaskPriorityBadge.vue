<template>
  <span
    v-if="label"
    class="inline-flex items-center rounded-full border font-medium"
    :class="[badgeClass, size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm']"
  >
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { taskPriorityBadgeClass, taskPriorityLabel } from '@/core/utils/task-priority'

interface Props {
  priority?: string | null
  size?: 'sm' | 'md'
}

const props = withDefaults(defineProps<Props>(), {
  priority: null,
  size: 'md',
})

const label = computed(() => taskPriorityLabel(props.priority))
const badgeClass = computed(() => taskPriorityBadgeClass(props.priority))
</script>

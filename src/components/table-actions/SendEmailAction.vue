<template>
  <button
    @click="$emit('sendEmail', item)"
    class="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-md transition-colors duration-200"
    title="Send Email"
  >
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  </button>
</template>

<script setup lang="ts">
interface Props {
  item: any
}

defineProps<Props>()
defineEmits<{
  sendEmail: [item: any]
}>()
</script>

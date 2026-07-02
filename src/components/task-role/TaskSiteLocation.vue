<template>
  <div v-if="siteName || siteAddress" class="mt-1.5 space-y-0.5" :class="compact ? 'text-xs' : 'text-sm'">
    <p v-if="siteName" class="font-medium text-gray-700 leading-snug">{{ siteName }}</p>
    <p
      v-if="siteAddress"
      class="text-gray-500 whitespace-pre-wrap break-words leading-snug"
      :class="compact ? 'text-xs' : 'text-sm'"
    >
      {{ siteAddress }}
    </p>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    siteName?: string
    siteAddress?: string
    compact?: boolean
  }>(),
  {
    siteName: '',
    siteAddress: '',
    compact: false,
  },
)
</script>

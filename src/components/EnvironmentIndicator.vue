<script setup lang="ts">
import { computed } from 'vue'
import { apiConfig } from '@/config/api'

const currentEnvironment = computed(() => {
  const hostname = window.location.hostname
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'development'
  } else if (hostname.includes('staging') || hostname.includes('dev')) {
    return 'staging'
  } else {
    return 'production'
  }
})

const environmentColor = computed(() => {
  switch (currentEnvironment.value) {
    case 'development':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'staging':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'production':
      return 'bg-green-100 text-green-800 border-green-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
})

const showIndicator = computed(() => {
  return currentEnvironment.value !== 'production'
})
</script>

<template>
  <div v-if="showIndicator" class="fixed top-4 right-4 z-50">
    <div 
      :class="[
        'px-3 py-1 rounded-full text-xs font-medium border shadow-sm',
        environmentColor
      ]"
    >
      {{ currentEnvironment.toUpperCase() }}
    </div>
  </div>
</template>

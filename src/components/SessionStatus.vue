<template>
  <div class="session-status">
    <div class="flex items-center space-x-2">
      <div class="w-3 h-3 rounded-full" :class="sessionStatusClass"></div>
      <span class="text-sm font-medium">{{ sessionStatusText }}</span>
    </div>

    <div v-if="showDetails" class="mt-2 text-xs text-gray-500">
      <div>Last Activity: {{ formatTime(lastActivityTime) }}</div>
      <div>Time Since Activity: {{ formatDuration(timeSinceLastActivity) }}</div>
      <div>User Active: {{ isUserActive ? 'Yes' : 'No' }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getSessionManager } from '@/core/utils/session-manager'
import { useAuthStore } from '@/core/stores/auth'

interface Props {
  showDetails?: boolean
}

withDefaults(defineProps<Props>(), {
  showDetails: false,
})

const authStore = useAuthStore()
const sessionManager = ref(getSessionManager())
const status = ref({
  isActive: false,
  lastActivityTime: 0,
  timeSinceLastActivity: 0,
  isUserActive: false,
})

let statusInterval: number | null = null

const sessionStatusClass = computed(() => {
  if (!authStore.isAuthenticated) {
    return 'bg-gray-400'
  }

  if (!status.value.isActive) {
    return 'bg-red-400'
  }

  if (status.value.isUserActive) {
    return 'bg-green-400'
  }

  return 'bg-yellow-400'
})

const sessionStatusText = computed(() => {
  if (!authStore.isAuthenticated) {
    return 'Not Authenticated'
  }

  if (!status.value.isActive) {
    return 'Session Inactive'
  }

  if (status.value.isUserActive) {
    return 'Session Active'
  }

  return 'Session Idle'
})

const lastActivityTime = computed(() => status.value.lastActivityTime)
const timeSinceLastActivity = computed(() => status.value.timeSinceLastActivity)
const isUserActive = computed(() => status.value.isUserActive)

function updateStatus() {
  if (sessionManager.value) {
    status.value = sessionManager.value.getStatus()
  }
}

function formatTime(timestamp: number): string {
  if (!timestamp) return 'Never'

  const date = new Date(timestamp)
  return date.toLocaleTimeString()
}

function formatDuration(milliseconds: number): string {
  if (!milliseconds) return '0s'

  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

onMounted(() => {
  updateStatus()

  // Update status every 5 seconds
  statusInterval = setInterval(updateStatus, 5000)
})

onUnmounted(() => {
  if (statusInterval) {
    clearInterval(statusInterval)
  }
})
</script>

<style scoped>
.session-status {
  /* @apply is a Tailwind CSS directive */
  @apply p-2 bg-white rounded-lg shadow-sm border;
}
</style>

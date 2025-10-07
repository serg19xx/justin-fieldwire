<template>
  <div class="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
    <!-- User Avatar -->
    <img
      v-if="userAvatar && !isDefaultAvatar"
      :src="userAvatar"
      alt="User Avatar"
      class="w-full h-full object-cover"
    />
    <!-- Default Avatar Placeholder -->
    <div v-else class="w-full h-full bg-gray-200 flex items-center justify-center">
      <svg class="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
        <path
          d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
        />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/core/stores/auth'

const authStore = useAuthStore()

const userAvatar = computed(() => authStore.currentUser?.avatar_url)

const isDefaultAvatar = computed(() => {
  return (
    !userAvatar.value ||
    userAvatar.value === '/images/default-avatar.png' ||
    userAvatar.value === '/default-avatar.png' ||
    userAvatar.value.includes('default-avatar')
  )
})
</script>

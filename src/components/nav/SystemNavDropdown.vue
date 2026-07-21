<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import { useAuthStore } from '@/core/stores/auth'
import {
  getActiveSystemNavItem,
  getSystemNavItemsForUser,
  isSystemNavRoute,
} from '@/config/system-nav'

const props = withDefaults(
  defineProps<{
    /** `on-dark` — white text on green project header; default — gray on light header */
    variant?: 'light' | 'on-dark'
  }>(),
  { variant: 'light' },
)

const route = useRoute()
const authStore = useAuthStore()

const isOnDark = computed(() => props.variant === 'on-dark')
const items = computed(() => getSystemNavItemsForUser(authStore.currentUser))
const activeItem = computed(() => getActiveSystemNavItem(route.path, items.value))
const isActive = computed(() => isSystemNavRoute(route.path))

const rootRef = ref<HTMLElement | null>(null)
const open = ref(false)

function toggle() {
  open.value = !open.value
}

function close() {
  open.value = false
}

function onDocumentClick(event: MouseEvent) {
  if (!open.value || !rootRef.value) return
  if (!rootRef.value.contains(event.target as Node)) {
    open.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
})
</script>

<template>
  <div v-if="items.length > 0" ref="rootRef" class="relative">
    <button
      type="button"
      class="text-sm font-medium px-3 py-2 rounded-md flex items-center gap-1"
      :class="
        isActive
          ? isOnDark
            ? 'bg-green-700 text-white'
            : 'bg-gray-100 text-gray-900'
          : isOnDark
            ? 'text-white hover:text-green-100'
            : 'text-gray-700 hover:text-gray-900'
      "
      @click.stop="toggle"
    >
      Settings
      <AppIcon
        icon="mdi:chevron-down"
        :size="16"
        class="opacity-70 transition-transform"
        :class="{ 'rotate-180': open }"
      />
    </button>
    <div v-if="open" class="absolute left-0 top-full pt-1 w-52 z-50">
      <div class="bg-white border border-gray-200 rounded-md shadow-lg py-1">
        <p class="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
          {{ activeItem?.label ?? 'Settings' }}
        </p>
        <RouterLink
          v-for="item in items"
          :key="item.route"
          :to="item.route"
          class="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          :class="{ 'bg-blue-50 text-blue-800 font-medium': activeItem?.route === item.route }"
          @click="close"
        >
          {{ item.label }}
        </RouterLink>
      </div>
    </div>
  </div>
</template>

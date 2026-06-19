<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import { getEnabledClientTypes } from '@/config/clients-registry'

const props = withDefaults(
  defineProps<{
    activeKey?: string
    /** `on-dark` — white text on green project header; default — gray on light header */
    variant?: 'light' | 'on-dark'
  }>(),
  { variant: 'light' },
)

const isOnDark = computed(() => props.variant === 'on-dark')

const rootRef = ref<HTMLElement | null>(null)
const open = ref(false)
const types = getEnabledClientTypes()

const activeLabel = computed(() => {
  const match = types.find((t) => t.key === props.activeKey)
  return match?.pluralLabel ?? 'Clients'
})

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
  <div ref="rootRef" class="relative">
    <button
      type="button"
      class="text-sm font-medium px-3 py-2 rounded-md flex items-center gap-1"
      :class="
        $route.path.startsWith('/clients')
          ? isOnDark
            ? 'bg-green-700 text-white'
            : 'bg-gray-100 text-gray-900'
          : isOnDark
            ? 'text-white hover:text-green-100'
            : 'text-gray-700 hover:text-gray-900'
      "
      @click.stop="toggle"
    >
      Clients
      <AppIcon
        icon="mdi:chevron-down"
        :size="16"
        class="opacity-70 transition-transform"
        :class="{ 'rotate-180': open }"
      />
    </button>
    <!-- pt-1 bridges button → panel so the pointer path stays inside the hit area -->
    <div v-if="open" class="absolute left-0 top-full pt-1 w-56 z-50">
      <div class="bg-white border border-gray-200 rounded-md shadow-lg py-1">
        <p class="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
          {{ activeLabel }}
        </p>
        <RouterLink
          v-for="t in types"
          :key="t.key"
          :to="`/clients/${t.key}`"
          class="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          :class="{ 'bg-blue-50 text-blue-800 font-medium': activeKey === t.key }"
          @click="close"
        >
          {{ t.pluralLabel }}
        </RouterLink>
      </div>
    </div>
  </div>
</template>

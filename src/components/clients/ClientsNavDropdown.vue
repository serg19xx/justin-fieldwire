<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
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
const menuRef = ref<HTMLElement | null>(null)
const open = ref(false)
const menuStyle = ref<Record<string, string>>({})
const types = getEnabledClientTypes()

const activeLabel = computed(() => {
  const match = types.find((t) => t.key === props.activeKey)
  return match?.pluralLabel ?? 'Clients'
})

function updateMenuPosition(): void {
  const el = rootRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const menuWidth = 224 // w-56
  const left = Math.min(rect.left, Math.max(8, window.innerWidth - menuWidth - 8))
  menuStyle.value = {
    position: 'fixed',
    top: `${Math.round(rect.bottom + 4)}px`,
    left: `${Math.round(left)}px`,
    width: `${menuWidth}px`,
    zIndex: '200',
  }
}

function toggle(): void {
  open.value = !open.value
}

function close(): void {
  open.value = false
}

function onDocumentPointerDown(event: PointerEvent): void {
  if (!open.value) return
  const t = event.target as Node
  if (rootRef.value?.contains(t) || menuRef.value?.contains(t)) return
  open.value = false
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') close()
}

function onWindowChange(): void {
  if (open.value) updateMenuPosition()
}

watch(open, async (isOpen) => {
  if (!isOpen) return
  await nextTick()
  updateMenuPosition()
})

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown, true)
  document.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', onWindowChange)
  window.addEventListener('scroll', onWindowChange, true)
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown, true)
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', onWindowChange)
  window.removeEventListener('scroll', onWindowChange, true)
})
</script>

<template>
  <div ref="rootRef" class="relative">
    <button
      type="button"
      class="text-sm font-medium px-3 py-2 rounded-md flex items-center gap-1"
      :aria-expanded="open"
      aria-haspopup="menu"
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
    <Teleport to="body">
      <div
        v-if="open"
        ref="menuRef"
        role="menu"
        class="rounded-md border border-gray-200 bg-white py-1 shadow-lg"
        :style="menuStyle"
      >
        <p class="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
          {{ activeLabel }}
        </p>
        <RouterLink
          v-for="t in types"
          :key="t.key"
          :to="`/clients/${t.key}`"
          role="menuitem"
          class="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          :class="{ 'bg-blue-50 text-blue-800 font-medium': activeKey === t.key }"
          @click="close"
        >
          {{ t.pluralLabel }}
        </RouterLink>
      </div>
    </Teleport>
  </div>
</template>

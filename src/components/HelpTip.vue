<template>
  <span class="relative inline-flex items-center align-middle ml-1">
    <button
      ref="buttonRef"
      type="button"
      class="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-gray-400 bg-white text-[10px] font-semibold leading-none text-gray-600 hover:border-blue-500 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
      :aria-expanded="isOpen"
      :aria-label="ariaLabel"
      @click.stop="toggle"
    >
      ?
    </button>
    <div
      v-if="isOpen"
      ref="panelRef"
      role="dialog"
      class="absolute left-0 top-full z-[2100] mt-1.5 w-64 max-w-[min(16rem,calc(100vw-2rem))] rounded-lg border border-gray-200 bg-white p-3 text-left text-xs leading-relaxed text-gray-700 shadow-lg sm:w-72"
      @click.stop
    >
      <p v-if="title" class="mb-1 font-semibold text-gray-900">{{ title }}</p>
      <p class="whitespace-pre-line">{{ text }}</p>
    </div>
  </span>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    text: string
    title?: string
    ariaLabel?: string
  }>(),
  {
    title: '',
    ariaLabel: 'Show help',
  },
)

const isOpen = ref(false)
const buttonRef = ref<HTMLButtonElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)

function toggle() {
  isOpen.value = !isOpen.value
}

function close() {
  isOpen.value = false
}

function onDocumentPointerDown(event: Event) {
  if (!isOpen.value) return
  const target = event.target as Node | null
  if (!target) return
  if (buttonRef.value?.contains(target) || panelRef.value?.contains(target)) return
  close()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

watch(
  () => props.text,
  () => close(),
)

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown, true)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown, true)
  document.removeEventListener('keydown', onKeydown)
})
</script>

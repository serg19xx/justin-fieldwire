<template>
  <Teleport to="body">
    <div
      v-if="imageUrl"
      class="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4"
      role="dialog"
      aria-modal="true"
      :aria-label="caption || 'Photo'"
      @click.self="emit('close')"
    >
      <button
        type="button"
        class="absolute right-3 top-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        aria-label="Close photo"
        @click="emit('close')"
      >
        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <figure class="flex max-h-full max-w-5xl flex-col items-center">
        <img :src="imageUrl" :alt="caption || 'Photo'" class="max-h-[80vh] max-w-full rounded-md object-contain" />
        <figcaption v-if="caption" class="mt-3 text-center text-sm text-gray-200">{{ caption }}</figcaption>
      </figure>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'

interface Props {
  imageUrl: string | null
  caption?: string
}

defineProps<Props>()

const emit = defineEmits<{ close: [] }>()

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<script setup lang="ts">
import type { ClientRowActionId } from '@/core/types/client-registry'
import AppIcon from '@/components/AppIcon.vue'

withDefaults(
  defineProps<{
    actions: ClientRowActionId[]
    disabled?: boolean
  }>(),
  {
    disabled: false,
  },
)

const emit = defineEmits<{
  action: [id: ClientRowActionId]
}>()

const actionMeta: Record<
  ClientRowActionId,
  { title: string; icon: string; className: string }
> = {
  delete: { title: 'Delete', icon: 'mdi:delete-outline', className: 'text-red-600 hover:bg-red-50' },
  edit: { title: 'Edit', icon: 'mdi:pencil-outline', className: 'text-blue-600 hover:bg-blue-50' },
  fixAddress: { title: 'Fix address', icon: 'mdi:wrench-outline', className: 'text-blue-600 hover:bg-blue-50' },
  sms: { title: 'Send SMS', icon: 'mdi:message-text-outline', className: 'text-green-600 hover:bg-green-50' },
  fax: { title: 'Send fax', icon: 'mdi:fax', className: 'text-amber-700 hover:bg-amber-50' },
  message: { title: 'Send message', icon: 'mdi:comment-text-outline', className: 'text-purple-600 hover:bg-purple-50' },
  documents: { title: 'Documents', icon: 'mdi:file-document-outline', className: 'text-blue-600 hover:bg-blue-50' },
  email: { title: 'Send email', icon: 'mdi:at', className: 'text-blue-600 hover:bg-blue-50' },
  statusMessage: {
    title: 'Message status',
    icon: 'mdi:message-text-outline',
    className: 'text-teal-600 hover:bg-teal-50',
  },
  statusLock: { title: 'Lock status', icon: 'mdi:lock-outline', className: 'text-teal-600 hover:bg-teal-50' },
  statusEmail: { title: 'Email status', icon: 'mdi:at', className: 'text-teal-600 hover:bg-teal-50' },
  statusFolder: {
    title: 'Folder',
    icon: 'mdi:content-save-outline',
    className: 'text-teal-600 hover:bg-teal-50',
  },
  addUser: { title: 'Add user', icon: 'mdi:account-plus-outline', className: 'text-blue-600 hover:bg-blue-50' },
}
</script>

<template>
  <div class="flex items-center gap-0.5">
    <button
      v-for="id in actions"
      :key="id"
      type="button"
      class="p-1.5 rounded min-w-[28px] min-h-[28px] flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
      :class="disabled ? 'text-gray-400' : actionMeta[id].className"
      :title="disabled ? 'Unavailable while multiple rows are selected' : actionMeta[id].title"
      :disabled="disabled"
      @click="emit('action', id)"
    >
      <AppIcon :icon="actionMeta[id].icon" :size="18" />
    </button>
  </div>
</template>

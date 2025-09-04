<template>
  <div class="flex items-center gap-2">
    <EditAction 
      :item="{ id: 'bulk', type: 'bulk' }" 
      @edit="$emit('edit', selectedItems)"
      title="Edit Selected"
    />
    <SendSmsAction 
      :item="{ id: 'bulk', type: 'bulk' }" 
      @send-sms="$emit('sendSms', selectedItems)"
      title="Send SMS to Selected"
    />
    <SendEmailAction 
      :item="{ id: 'bulk', type: 'bulk' }" 
      @send-email="$emit('sendEmail', selectedItems)"
      title="Send Email to Selected"
    />
    <FixAddressAction 
      :item="{ id: 'bulk', type: 'bulk' }" 
      @fix-address="$emit('fixAddress', selectedItems)"
      title="Fix Address for Selected"
    />
    <DeleteAction 
      :item="{ id: 'bulk', type: 'bulk' }" 
      @delete="$emit('delete', selectedItems)"
      title="Delete Selected"
    />
  </div>
</template>

<script setup lang="ts">
import EditAction from './EditAction.vue'
import SendSmsAction from './SendSmsAction.vue'
import SendEmailAction from './SendEmailAction.vue'
import FixAddressAction from './FixAddressAction.vue'
import DeleteAction from './DeleteAction.vue'

interface Props {
  selectedItems: any[]
}

defineProps<Props>()

defineEmits<{
  edit: [items: any[]]
  sendSms: [items: any[]]
  sendEmail: [items: any[]]
  fixAddress: [items: any[]]
  delete: [items: any[]]
}>()
</script>

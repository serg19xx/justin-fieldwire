<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ClientCommChannel } from '@/core/utils/clients-comms-api'
import { getApiErrorMessage } from '@/core/utils/api'
import { clientsCommsApi } from '@/core/utils/clients-comms-api'
import {
  sendgridTemplatesApi,
  type SendGridDynamicTemplate,
} from '@/core/utils/sendgrid-templates-api'

const props = defineProps<{
  open: boolean
  channel: ClientCommChannel
  clientType: string
  clientName: string
  destination: string
  clientId: number | null
  bulkIds?: number[]
}>()

const emit = defineEmits<{
  close: []
  sent: [message: string]
}>()

const FREEFORM_TEMPLATE_VALUE = ''

const subject = ref('')
const message = ref('')
const selectedTemplateId = ref(FREEFORM_TEMPLATE_VALUE)
const templates = ref<SendGridDynamicTemplate[]>([])
const loadingTemplates = ref(false)
const templatesError = ref<string | null>(null)
const sending = ref(false)
const error = ref<string | null>(null)
const faxAttachment = ref<File | null>(null)
const faxFileInput = ref<HTMLInputElement | null>(null)

const FAX_MAX_FILE_BYTES = 50 * 1024 * 1024
const FAX_ACCEPT = '.pdf,.png,.jpg,.jpeg,.gif,.tif,.tiff,.bmp,.webp'

const isEmailChannel = computed(() => props.channel === 'email')
const isSmsChannel = computed(() => props.channel === 'sms')
const isFaxChannel = computed(() => props.channel === 'fax')
const isFreeformEmail = computed(
  () => !isEmailChannel.value || selectedTemplateId.value === FREEFORM_TEMPLATE_VALUE,
)
const showSubject = computed(
  () => (isEmailChannel.value && isFreeformEmail.value) || props.channel === 'fax',
)
const showMessage = computed(() => props.channel !== 'email' || isFreeformEmail.value)
const messageCharCount = computed(() => message.value.length)
const smsSegmentCount = computed(() =>
  messageCharCount.value === 0 ? 0 : Math.ceil(messageCharCount.value / 160),
)

const isBulk = computed(() => (props.bulkIds?.length ?? 0) > 1)
const channelLabel = computed(() => {
  if (props.channel === 'sms') return 'SMS'
  if (props.channel === 'email') return 'Email'
  return 'Fax'
})

const title = computed(() => {
  if (isBulk.value) {
    return `Send ${channelLabel.value} to ${props.bulkIds?.length ?? 0} clients`
  }
  return `Send ${channelLabel.value} to ${props.clientName}`
})

function resetForm() {
  subject.value = ''
  message.value = ''
  selectedTemplateId.value = FREEFORM_TEMPLATE_VALUE
  templates.value = []
  loadingTemplates.value = false
  templatesError.value = null
  error.value = null
  sending.value = false
  faxAttachment.value = null
  if (faxFileInput.value) {
    faxFileInput.value.value = ''
  }
}

function onFaxFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  if (file && file.size > FAX_MAX_FILE_BYTES) {
    error.value = 'Maximum file size is 50 MB'
    input.value = ''
    faxAttachment.value = null
    return
  }
  faxAttachment.value = file
  error.value = null
}

function clearFaxAttachment() {
  faxAttachment.value = null
  if (faxFileInput.value) {
    faxFileInput.value.value = ''
  }
}

async function loadTemplates() {
  loadingTemplates.value = true
  templatesError.value = null
  try {
    const result = await sendgridTemplatesApi.listActive()
    templates.value = result.templates
    if (result.sendgridConfigured && result.templates.length === 0) {
      templatesError.value =
        'No active SendGrid templates found for this API key. Check that the key belongs to the same SendGrid account as your templates and has Template Engine access.'
    }
  } catch (e) {
    templates.value = []
    const axiosError = e as { response?: { data?: { message?: string }; status?: number } }
    const apiMessage = axiosError.response?.data?.message
    if (apiMessage) {
      templatesError.value = apiMessage
    } else if (axiosError.response?.status === 403) {
      templatesError.value = 'Access denied — admin or project manager role required'
    } else {
      templatesError.value =
        e instanceof Error ? e.message : 'Could not load SendGrid templates'
    }
  } finally {
    loadingTemplates.value = false
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      resetForm()
      if (props.channel === 'email') {
        void loadTemplates()
      }
    }
  },
)

async function handleSend() {
  if (sending.value) return

  const body = message.value.trim()
  const usingTemplate =
    isEmailChannel.value && selectedTemplateId.value !== FREEFORM_TEMPLATE_VALUE

  if (!usingTemplate && !body && !(isFaxChannel.value && faxAttachment.value)) {
    error.value = isFaxChannel.value
      ? 'Cover text or attachment is required'
      : 'Message is required'
    return
  }

  if (isSmsChannel.value && body.length > 1600) {
    error.value = 'SMS message is too long (max 1600 characters)'
    return
  }

  sending.value = true
  error.value = null

  try {
    const payload: {
      message?: string
      subject?: string
      template_id?: string
      attachment?: File
    } = {}

    if (body) {
      payload.message = body
    }

    const trimmedSubject = subject.value.trim()
    if (trimmedSubject) {
      payload.subject = trimmedSubject
    }

    if (usingTemplate) {
      payload.template_id = selectedTemplateId.value
    }

    if (isFaxChannel.value && faxAttachment.value) {
      payload.attachment = faxAttachment.value
    }

    const result =
      isBulk.value && props.bulkIds
        ? await clientsCommsApi.sendBulk(props.clientType, props.channel as 'sms' | 'email', props.bulkIds, payload)
        : props.clientId !== null
          ? await clientsCommsApi.send(props.clientType, props.clientId, props.channel, payload)
          : { success: false, message: 'Missing client id' }

    if (!result.success) {
      error.value = result.message ?? 'Send failed'
      return
    }

    let notice = result.message ?? `${channelLabel.value} sent`
    if (result.testMode && result.sentTo && result.originalTo && result.sentTo !== result.originalTo) {
      notice += ` (test mode: sent to ${result.sentTo}, client had ${result.originalTo})`
    } else if (result.sentTo) {
      notice += ` → ${result.sentTo}`
    }
    if (result.sent !== undefined) {
      notice = `${channelLabel.value}: ${result.sent} sent, ${result.failed ?? 0} failed`
    }

    emit('sent', notice)
    emit('close')
  } catch (e) {
    error.value = getApiErrorMessage(e, 'Send failed')
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
  >
    <div class="absolute inset-0 bg-black/40" @click="emit('close')" />
    <div
      class="relative w-full sm:max-w-lg bg-white rounded-t-xl sm:rounded-xl shadow-xl max-h-[90vh] overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div class="px-4 py-4 sm:px-6 border-b border-gray-200 flex items-start justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">{{ title }}</h2>
          <p v-if="!isBulk" class="mt-1 text-sm text-gray-500">
            {{ channelLabel }}: {{ destination || '—' }}
          </p>
        </div>
        <button
          type="button"
          class="text-gray-400 hover:text-gray-600 text-xl leading-none"
          @click="emit('close')"
        >
          ×
        </button>
      </div>

      <form class="px-4 py-4 sm:px-6 space-y-4" @submit.prevent="handleSend">
        <p v-if="isSmsChannel && isBulk" class="text-xs text-gray-500">
          Plain text only — no templates. Clients without a phone number are skipped.
        </p>
        <p v-else-if="isSmsChannel" class="text-xs text-gray-500">
          Plain text operational message — no templates. Delivered to the client phone below.
        </p>
        <p v-else-if="isFaxChannel" class="text-xs text-gray-500">
          Attach a PDF or image as the fax body, with optional cover text — like the legacy EasyRx fax dialog.
        </p>

        <div v-if="isEmailChannel">
          <label class="block text-sm font-medium text-gray-700 mb-1">Email format</label>
          <select
            v-model="selectedTemplateId"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
            :disabled="loadingTemplates || sending"
          >
            <option :value="FREEFORM_TEMPLATE_VALUE">Free form letter</option>
            <option v-for="tpl in templates" :key="tpl.id" :value="tpl.id">
              {{ tpl.name }} ({{ tpl.version_name }})
            </option>
          </select>
          <p v-if="loadingTemplates" class="mt-1 text-xs text-gray-500">Loading SendGrid templates…</p>
          <p v-else-if="templatesError" class="mt-1 text-xs text-amber-700">{{ templatesError }}</p>
          <p v-else-if="!isFreeformEmail" class="mt-1 text-xs text-gray-500">
            Subject and layout come from the selected SendGrid template. Client name is passed automatically.
          </p>
        </div>

        <div v-if="showSubject">
          <label class="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <input
            v-model="subject"
            type="text"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            :placeholder="isFaxChannel ? 'Optional fax subject' : 'Message subject'"
          />
        </div>

        <div v-if="showMessage">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            {{
              isSmsChannel ? 'SMS message' : isFaxChannel ? 'Cover text' : 'Message'
            }}
          </label>
          <textarea
            v-model="message"
            :rows="isSmsChannel ? 4 : isFaxChannel ? 3 : 5"
            maxlength="1600"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            :placeholder="
              isSmsChannel
                ? 'Type a short operational message…'
                : isFaxChannel
                  ? 'Optional cover page text…'
                  : 'Type your message…'
            "
          />
          <p v-if="isSmsChannel" class="mt-1 text-xs text-gray-500">
            {{ messageCharCount }}/1600 characters
            <span v-if="smsSegmentCount > 1"> · ~{{ smsSegmentCount }} SMS segments</span>
          </p>
        </div>

        <div v-if="isFaxChannel" class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">Fax document</label>
          <div class="flex flex-col sm:flex-row sm:items-center gap-2">
            <input
              ref="faxFileInput"
              type="file"
              :accept="FAX_ACCEPT"
              class="block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
              :disabled="sending"
              @change="onFaxFileChange"
            />
            <button
              v-if="faxAttachment"
              type="button"
              class="text-sm text-gray-600 hover:text-gray-900 shrink-0"
              :disabled="sending"
              @click="clearFaxAttachment"
            >
              Remove
            </button>
          </div>
          <p v-if="faxAttachment" class="text-xs text-gray-600">
            {{ faxAttachment.name }} ({{ Math.ceil(faxAttachment.size / 1024) }} KB)
          </p>
          <p class="text-xs text-gray-500">PDF or image, maximum 50 MB</p>
        </div>

        <div v-else-if="isEmailChannel" class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">Optional note for template</label>
          <textarea
            v-model="message"
            rows="3"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="Optional text passed as message/body variable (if your template uses it)…"
          />
        </div>

        <p v-if="sending && isFaxChannel" class="text-sm text-gray-600">
          Uploading and processing your document on the fax service. Large files may take up to a minute.
        </p>

        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

        <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            :disabled="sending"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            :disabled="sending || (isEmailChannel && loadingTemplates)"
          >
            {{ sending ? 'Sending…' : `Send ${channelLabel}` }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

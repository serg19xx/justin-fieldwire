<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import ClientsPagination from '@/components/clients/ClientsPagination.vue'
import type { ClientRegistryKey } from '@/core/types/client-registry'
import {
  createOutreachCampaign,
  listOutreachCampaigns,
  listOutreachEvents,
  listOutreachRecipients,
  pauseOutreachCampaign,
  startOutreachCampaign,
  type OutreachCampaign,
  type OutreachClientType,
  type OutreachEmailMode,
  type OutreachEvent,
  type OutreachRecipient,
  type OutreachRecipientStatus,
} from '@/core/utils/outreach-api'
import { sendgridTemplatesApi } from '@/core/utils/sendgrid-templates-api'

const props = defineProps<{
  clientType: ClientRegistryKey
  countryOptions: Array<{ code: string; name: string; geoCode: string }>
  regionOptions: string[]
  categoryOptions?: string[]
  specialtyOptions?: string[]
}>()

const STATUS_FILTERS: Array<{ value: '' | OutreachRecipientStatus; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'queued', label: 'Queued' },
  { value: 'sent', label: 'Sent' },
  { value: 'replied', label: 'Replied' },
  { value: 'declined', label: 'Declined' },
  { value: 'unsubscribed', label: 'Unsubscribed' },
  { value: 'no_response', label: 'No reply' },
  { value: 'failed', label: 'Failed' },
  { value: 'skipped', label: 'Skipped' },
]

const PAGE_SIZE_OPTIONS = [50, 100, 200, 500]

const busy = ref(false)
const error = ref<string | null>(null)
const notice = ref<string | null>(null)
const campaigns = ref<OutreachCampaign[]>([])
const activeCampaignId = ref<number | null>(null)
const recipients = ref<OutreachRecipient[]>([])
const recipientsTotal = ref(0)
const recipientsPage = ref(1)
const recipientsPageSize = ref(50)
const recipientsStatus = ref<'' | OutreachRecipientStatus>('')
const recipientsPages = computed(() =>
  recipientsPageSize.value > 0
    ? Math.max(1, Math.ceil(recipientsTotal.value / recipientsPageSize.value))
    : 1,
)

const tableTab = ref<'recipients' | 'events'>('recipients')
const events = ref<OutreachEvent[]>([])
const eventsTotal = ref(0)
const eventsPage = ref(1)
const eventsPageSize = ref(50)
const eventsPages = computed(() =>
  eventsPageSize.value > 0 ? Math.max(1, Math.ceil(eventsTotal.value / eventsPageSize.value)) : 1,
)

const form = ref({
  country: '',
  region: '',
  category: '',
  specialty: '',
  batch_size: 10,
  wait_hours: 72,
  email_mode: 'custom' as OutreachEmailMode,
  email_subject: 'Invitation to collaborate with Medical Contractor / FieldWire',
  email_body:
    "Hello {{client_name}},\n\nWe would like to invite you to collaborate with our team through FieldWire.\n\nPlease reply if interested, or reply DECLINE to opt out.\n\nThank you,\nMedical Contractor Team",
  sendgrid_template_id: '',
  sms_body:
    'Hi {{client_name}}: Medical Contractor invites you to collaborate via FieldWire. Reply YES if interested, STOP to opt out.',
})

const sendgridTemplates = ref<Array<{ id: string; name: string }>>([])
const sendgridTemplatesLoaded = ref(false)
const templatesError = ref<string | null>(null)

const activeCampaign = computed(() =>
  campaigns.value.find((c) => c.id === activeCampaignId.value) ?? campaigns.value[0] ?? null,
)

const showCategory = computed(
  () => props.clientType === 'pharma' || props.clientType === 'medical_clinic',
)
const showSpecialty = computed(() => props.clientType === 'physician')
const needsTemplate = computed(
  () => form.value.email_mode === 'sendgrid_full' || form.value.email_mode === 'sendgrid_body',
)
const needsBody = computed(
  () => form.value.email_mode === 'custom' || form.value.email_mode === 'sendgrid_body',
)
const needsSubject = computed(
  () => form.value.email_mode === 'custom' || form.value.email_mode === 'sendgrid_body',
)

async function refreshCampaigns() {
  campaigns.value = await listOutreachCampaigns(props.clientType as OutreachClientType)
  if (!activeCampaignId.value && campaigns.value[0]) {
    activeCampaignId.value = campaigns.value[0].id
  }
  if (activeCampaignId.value) {
    await Promise.all([refreshRecipients(), refreshEvents()])
  } else {
    recipients.value = []
    recipientsTotal.value = 0
    events.value = []
    eventsTotal.value = 0
  }
}

async function refreshRecipients() {
  const id = activeCampaignId.value
  if (!id) return
  const result = await listOutreachRecipients(id, {
    page: recipientsPage.value,
    limit: recipientsPageSize.value,
    status: recipientsStatus.value || undefined,
  })
  recipients.value = result.recipients
  recipientsTotal.value = result.pagination.total
  if (result.pagination.page !== recipientsPage.value) {
    recipientsPage.value = result.pagination.page
  }
}

async function refreshEvents() {
  const id = activeCampaignId.value
  if (!id) return
  const result = await listOutreachEvents(id, {
    page: eventsPage.value,
    limit: eventsPageSize.value,
  })
  events.value = result.events
  eventsTotal.value = result.pagination.total
  if (result.pagination.page !== eventsPage.value) {
    eventsPage.value = result.pagination.page
  }
}

function setStatusFilter(status: '' | OutreachRecipientStatus) {
  recipientsStatus.value = status
  recipientsPage.value = 1
  tableTab.value = 'recipients'
}

async function handleCreateAndStart() {
  error.value = null
  notice.value = null
  if (!form.value.country.trim() && !form.value.region.trim()) {
    error.value = 'Set country and/or region before starting.'
    return
  }
  if (needsTemplate.value && !form.value.sendgrid_template_id.trim()) {
    error.value = 'Select a SendGrid template.'
    return
  }
  if (needsSubject.value && !form.value.email_subject.trim()) {
    error.value = 'Email subject is required.'
    return
  }
  if (needsBody.value && !form.value.email_body.trim()) {
    error.value = 'Email body is required.'
    return
  }
  busy.value = true
  try {
    const campaign = await createOutreachCampaign({
      client_type: props.clientType as OutreachClientType,
      country: form.value.country || null,
      region: form.value.region || null,
      category: form.value.category || null,
      specialty: form.value.specialty || null,
      batch_size: Math.min(50, Math.max(1, Number(form.value.batch_size) || 10)),
      wait_hours: Number(form.value.wait_hours) || 72,
      email_mode: form.value.email_mode,
      email_subject: needsSubject.value ? form.value.email_subject || null : null,
      email_body: needsBody.value ? form.value.email_body || null : null,
      sendgrid_template_id: needsTemplate.value ? form.value.sendgrid_template_id || null : null,
      sms_body: form.value.sms_body || null,
      start: true,
    })
    activeCampaignId.value = campaign.id
    notice.value = `Wave started (#${campaign.id}): ${campaign.total_queued} contact(s) queued. Campaign pauses automatically after this wave.`
    await refreshCampaigns()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    error.value = err.response?.data?.message || err.message || 'Failed to start campaign'
  } finally {
    busy.value = false
  }
}

async function loadSendgridTemplates(force = false) {
  if (sendgridTemplatesLoaded.value && !force) return
  templatesError.value = null
  try {
    const result = await sendgridTemplatesApi.listActive()
    sendgridTemplates.value = result.templates.map((t) => ({ id: t.id, name: t.name }))
    sendgridTemplatesLoaded.value = true
    if (result.sendgridConfigured && result.templates.length === 0) {
      templatesError.value =
        'SendGrid is configured but returned 0 templates. On local: check API logs for proxy errors (CONNECT 403); click Reload after API fix.'
    } else if (!result.sendgridConfigured) {
      templatesError.value = 'SendGrid is not configured on the API.'
    }
  } catch (e: unknown) {
    sendgridTemplates.value = []
    sendgridTemplatesLoaded.value = false
    const err = e as { response?: { data?: { message?: string }; status?: number }; message?: string }
    templatesError.value =
      err.response?.data?.message ||
      (err.response?.status === 403
        ? 'Access denied — admin or project manager role required'
        : err.message || 'Could not load SendGrid templates')
  }
}

async function handleResume() {
  if (!activeCampaign.value) return
  busy.value = true
  error.value = null
  try {
    const campaign = await startOutreachCampaign(activeCampaign.value.id)
    notice.value = `Next wave started (#${campaign.id}). Pauses automatically when this wave is done.`
    await refreshCampaigns()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    error.value = err.response?.data?.message || err.message || 'Failed to resume'
  } finally {
    busy.value = false
  }
}

async function handlePause() {
  if (!activeCampaign.value) return
  busy.value = true
  error.value = null
  try {
    await pauseOutreachCampaign(activeCampaign.value.id)
    notice.value = 'Campaign paused.'
    await refreshCampaigns()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    error.value = err.response?.data?.message || err.message || 'Failed to pause'
  } finally {
    busy.value = false
  }
}

watch(
  () => props.clientType,
  async () => {
    activeCampaignId.value = null
    recipientsPage.value = 1
    recipientsStatus.value = ''
    eventsPage.value = 1
    tableTab.value = 'recipients'
    await refreshCampaigns()
  },
)

watch(activeCampaignId, () => {
  recipientsPage.value = 1
  eventsPage.value = 1
  void refreshRecipients()
  void refreshEvents()
})

watch(recipientsPage, () => {
  void refreshRecipients()
})

watch(recipientsStatus, () => {
  void refreshRecipients()
})

watch(recipientsPageSize, () => {
  recipientsPage.value = 1
  void refreshRecipients()
})

watch(eventsPage, () => {
  void refreshEvents()
})

watch(eventsPageSize, () => {
  eventsPage.value = 1
  void refreshEvents()
})

watch(
  () => form.value.email_mode,
  (mode) => {
    if (mode === 'sendgrid_full' || mode === 'sendgrid_body') {
      void loadSendgridTemplates(true)
    }
  },
)

onMounted(() => {
  void refreshCampaigns()
  void loadSendgridTemplates()
})
</script>

<template>
  <div class="space-y-4">
    <section class="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <h2 class="text-base font-semibold text-gray-900">Send outreach wave</h2>
      <p class="text-xs text-gray-500">
        Manual start only. Choose location + how many messages (max 50). After this wave finishes,
        the campaign <strong>pauses automatically</strong> — click
        <strong>Send next wave</strong> for more. Email if available, otherwise SMS.
        Placeholders:
        <code v-pre>{{client_name}}</code>,
        <code v-pre>{{destination}}</code>.
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <label class="text-sm text-gray-700">
          Country
          <select v-model="form.country" class="mt-1 w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm">
            <option value="">Any / not set</option>
            <option v-for="c in countryOptions" :key="c.code" :value="c.name || c.code">
              {{ c.name || c.code }}
            </option>
          </select>
        </label>
        <label class="text-sm text-gray-700">
          Region / province / state
          <select v-model="form.region" class="mt-1 w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm">
            <option value="">Any / not set</option>
            <option v-for="r in regionOptions" :key="r" :value="r">{{ r }}</option>
          </select>
        </label>
        <label v-if="showCategory" class="text-sm text-gray-700">
          Category
          <select v-model="form.category" class="mt-1 w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm">
            <option value="">All</option>
            <option v-for="opt in categoryOptions || []" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </label>
        <label v-if="showSpecialty" class="text-sm text-gray-700">
          Specialty
          <select v-model="form.specialty" class="mt-1 w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm">
            <option value="">All</option>
            <option v-for="opt in specialtyOptions || []" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </label>
        <label class="text-sm text-gray-700">
          Messages this wave (max 50)
          <input
            v-model.number="form.batch_size"
            type="number"
            min="1"
            max="50"
            class="mt-1 w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
          />
        </label>
        <label class="text-sm text-gray-700">
          Wait for reply (hours)
          <input
            v-model.number="form.wait_hours"
            type="number"
            min="1"
            max="720"
            class="mt-1 w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
          />
        </label>
      </div>

      <div class="border border-gray-200 rounded-md p-3 space-y-3">
        <p class="text-sm font-medium text-gray-800">Email content</p>
        <div class="flex flex-col gap-2 text-sm">
          <label class="inline-flex items-center gap-2">
            <input v-model="form.email_mode" type="radio" value="custom" />
            Custom subject &amp; body
            <span class="text-xs text-gray-500">(fixed Header + Footer; you edit Body only)</span>
          </label>
          <label class="inline-flex items-center gap-2">
            <input v-model="form.email_mode" type="radio" value="sendgrid_full" />
            SendGrid full template
          </label>
          <label class="inline-flex items-center gap-2">
            <input v-model="form.email_mode" type="radio" value="sendgrid_body" />
            SendGrid template + body from UI
            <span class="text-xs text-gray-500" v-pre>(template must use {{{body}}})</span>
          </label>
        </div>
        <template v-if="needsSubject">
          <label class="block text-sm text-gray-700">
            Subject
            <input
              v-model="form.email_subject"
              type="text"
              class="mt-1 w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
            />
          </label>
        </template>
        <template v-if="needsBody">
          <label class="block text-sm text-gray-700">
            Body
            <textarea
              v-model="form.email_body"
              rows="5"
              class="mt-1 w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm font-mono"
            />
          </label>
          <p v-if="form.email_mode === 'custom'" class="text-xs text-gray-500">
            Custom emails are wrapped as Header (logo) + your Body + Footer (legal text + unsubscribe).
            Placeholders: <code v-pre>{{client_name}}</code>, <code v-pre>{{destination}}</code>,
            <code v-pre>{{unsubscribe_url}}</code>.
          </p>
        </template>
        <label v-if="needsTemplate" class="block text-sm text-gray-700">
          SendGrid template
          <div class="mt-1 flex gap-2">
            <select
              v-model="form.sendgrid_template_id"
              class="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
              @focus="loadSendgridTemplates()"
            >
              <option value="">Select template…</option>
              <option v-for="t in sendgridTemplates" :key="t.id" :value="t.id">
                {{ t.name }} ({{ t.id }})
              </option>
            </select>
            <button
              type="button"
              class="shrink-0 px-2 py-1.5 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              @click="loadSendgridTemplates(true)"
            >
              Reload
            </button>
          </div>
          <span class="text-xs text-gray-500">
            Variables: client_name, destination, client_type, unsubscribe_url
            <template v-if="form.email_mode === 'sendgrid_body'">, body</template>
          </span>
          <p v-if="templatesError" class="text-xs text-amber-700 mt-1">{{ templatesError }}</p>
        </label>
        <label class="block text-sm text-gray-700">
          SMS body (used only when contact has no email)
          <textarea
            v-model="form.sms_body"
            rows="2"
            class="mt-1 w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
          />
        </label>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="px-3 py-1.5 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
          :disabled="busy"
          @click="handleCreateAndStart"
        >
          Start wave
        </button>
        <button
          v-if="activeCampaign?.status === 'running'"
          type="button"
          class="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          :disabled="busy"
          @click="handlePause"
        >
          Pause now
        </button>
        <button
          v-if="activeCampaign?.status === 'paused' || activeCampaign?.status === 'done'"
          type="button"
          class="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          :disabled="busy"
          @click="handleResume"
        >
          Send next wave
        </button>
        <button
          type="button"
          class="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          :disabled="busy"
          @click="refreshCampaigns"
        >
          Refresh
        </button>
      </div>
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <p v-if="notice" class="text-sm text-emerald-700">{{ notice }}</p>
    </section>

    <section v-if="campaigns.length" class="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <div class="flex flex-wrap items-center gap-3">
        <label class="text-sm text-gray-700">
          Campaign
          <select
            v-model.number="activeCampaignId"
            class="ml-2 border border-gray-300 rounded-md px-2 py-1.5 text-sm"
          >
            <option v-for="c in campaigns" :key="c.id" :value="c.id">
              #{{ c.id }} · {{ c.status }} · {{ c.name }}
            </option>
          </select>
        </label>
      </div>
      <div
        v-if="activeCampaign"
        class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs"
      >
        <button
          type="button"
          class="rounded bg-gray-50 p-2 hover:bg-gray-100 text-left w-full"
          @click="setStatusFilter('queued')"
        >
          <div class="text-gray-500">Queued</div>
          <div class="font-semibold text-center">{{ activeCampaign.total_queued }}</div>
        </button>
        <button
          type="button"
          class="rounded bg-gray-50 p-2 hover:bg-gray-100 text-left w-full"
          @click="setStatusFilter('sent')"
        >
          <div class="text-gray-500">Sent</div>
          <div class="font-semibold text-center">{{ activeCampaign.total_sent }}</div>
        </button>
        <button
          type="button"
          class="rounded bg-gray-50 p-2 hover:bg-gray-100 text-left w-full"
          @click="setStatusFilter('replied')"
        >
          <div class="text-gray-500">Replied</div>
          <div class="font-semibold text-center">{{ activeCampaign.total_replied }}</div>
        </button>
        <button
          type="button"
          class="rounded bg-gray-50 p-2 hover:bg-gray-100 text-left w-full"
          @click="setStatusFilter('declined')"
        >
          <div class="text-gray-500">Declined</div>
          <div class="font-semibold text-center">{{ activeCampaign.total_declined }}</div>
        </button>
        <button
          type="button"
          class="rounded bg-gray-50 p-2 hover:bg-gray-100 text-left w-full"
          @click="setStatusFilter('unsubscribed')"
        >
          <div class="text-gray-500">Unsub</div>
          <div class="font-semibold text-center">{{ activeCampaign.total_unsubscribed }}</div>
        </button>
        <button
          type="button"
          class="rounded bg-gray-50 p-2 hover:bg-gray-100 text-left w-full"
          @click="setStatusFilter('no_response')"
        >
          <div class="text-gray-500">No reply</div>
          <div class="font-semibold text-center">{{ activeCampaign.total_no_response }}</div>
        </button>
        <button
          type="button"
          class="rounded bg-gray-50 p-2 hover:bg-gray-100 text-left w-full"
          @click="setStatusFilter('failed')"
        >
          <div class="text-gray-500">Failed</div>
          <div class="font-semibold text-center">{{ activeCampaign.total_failed }}</div>
        </button>
        <div class="rounded bg-gray-50 p-2">
          <div class="text-gray-500">Wait h</div>
          <div class="font-semibold text-center">{{ activeCampaign.wait_hours }}</div>
        </div>
      </div>
      <p v-if="activeCampaign?.last_error" class="text-xs text-amber-700">
        Last error: {{ activeCampaign.last_error }}
      </p>
    </section>

    <section class="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div class="px-4 py-2 border-b border-gray-100 flex flex-wrap gap-2">
        <button
          type="button"
          class="text-sm px-3 py-1.5 rounded-md"
          :class="tableTab === 'recipients' ? 'bg-gray-900 text-white' : 'border border-gray-300 text-gray-700'"
          @click="tableTab = 'recipients'"
        >
          Recipients ({{ recipientsTotal }})
        </button>
        <button
          type="button"
          class="text-sm px-3 py-1.5 rounded-md"
          :class="tableTab === 'events' ? 'bg-gray-900 text-white' : 'border border-gray-300 text-gray-700'"
          @click="tableTab = 'events'"
        >
          Events ({{ eventsTotal }})
        </button>
      </div>

      <template v-if="tableTab === 'recipients'">
        <div
          class="px-4 py-2 border-b border-gray-100 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="text-sm text-gray-600">
            Queue / status
            <span class="text-gray-400">({{ recipientsTotal }} matching)</span>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <label class="text-xs text-gray-600">
              Status
              <select
                v-model="recipientsStatus"
                class="ml-1 border border-gray-300 rounded-md px-2 py-1 text-sm"
                @change="recipientsPage = 1"
              >
                <option v-for="opt in STATUS_FILTERS" :key="opt.label" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </label>
            <label class="text-xs text-gray-600">
              Per page
              <select
                v-model.number="recipientsPageSize"
                class="ml-1 border border-gray-300 rounded-md px-2 py-1 text-sm"
              >
                <option v-for="n in PAGE_SIZE_OPTIONS" :key="n" :value="n">{{ n }}</option>
              </select>
            </label>
            <button
              type="button"
              class="text-xs px-2 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
              @click="setStatusFilter('')"
            >
              Clear filter
            </button>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th class="px-3 py-2">Name</th>
                <th class="px-3 py-2">Type</th>
                <th class="px-3 py-2">Channel</th>
                <th class="px-3 py-2">Destination</th>
                <th class="px-3 py-2">Status</th>
                <th class="px-3 py-2">Sent</th>
                <th class="px-3 py-2">Wait until</th>
                <th class="px-3 py-2">Note</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="recipients.length === 0">
                <td colspan="8" class="px-3 py-6 text-center text-gray-400">No recipients yet</td>
              </tr>
              <tr
                v-for="r in recipients"
                :key="r.id"
                class="border-t border-gray-100"
              >
                <td class="px-3 py-2 text-gray-900">{{ r.client_name }}</td>
                <td class="px-3 py-2 text-gray-600">{{ r.client_type }}</td>
                <td class="px-3 py-2">{{ r.channel }}</td>
                <td class="px-3 py-2 font-mono text-xs">{{ r.destination }}</td>
                <td class="px-3 py-2">{{ r.status }}</td>
                <td class="px-3 py-2 text-xs text-gray-600">{{ r.sent_at || '—' }}</td>
                <td class="px-3 py-2 text-xs text-gray-600">{{ r.wait_until || '—' }}</td>
                <td class="px-3 py-2 text-xs text-gray-600">{{ r.response_note || r.error_message || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="recipientsTotal > 0" class="border-t border-gray-100 px-2 py-2">
          <ClientsPagination
            :page="recipientsPage"
            :page-size="recipientsPageSize"
            :total="recipientsTotal"
            :pages="recipientsPages"
            @update:page="recipientsPage = $event"
          />
        </div>
      </template>

      <template v-else>
        <div class="px-4 py-2 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
          <div class="text-sm text-gray-600">
            Event log
            <span class="text-gray-400">(unsubscribe, SMS replies, no_response)</span>
          </div>
          <label class="text-xs text-gray-600">
            Per page
            <select
              v-model.number="eventsPageSize"
              class="ml-1 border border-gray-300 rounded-md px-2 py-1 text-sm"
            >
              <option v-for="n in PAGE_SIZE_OPTIONS" :key="n" :value="n">{{ n }}</option>
            </select>
          </label>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th class="px-3 py-2">When</th>
                <th class="px-3 py-2">Source</th>
                <th class="px-3 py-2">Event</th>
                <th class="px-3 py-2">Name</th>
                <th class="px-3 py-2">Destination</th>
                <th class="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="events.length === 0">
                <td colspan="6" class="px-3 py-6 text-center text-gray-400">No events yet</td>
              </tr>
              <tr v-for="ev in events" :key="ev.id" class="border-t border-gray-100">
                <td class="px-3 py-2 text-xs text-gray-600">{{ ev.created_at || '—' }}</td>
                <td class="px-3 py-2">{{ ev.source }}</td>
                <td class="px-3 py-2 font-medium">{{ ev.event_type }}</td>
                <td class="px-3 py-2">{{ ev.client_name || '—' }}</td>
                <td class="px-3 py-2 font-mono text-xs">{{ ev.destination || '—' }}</td>
                <td class="px-3 py-2 text-xs">{{ ev.recipient_status || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="eventsTotal > 0" class="border-t border-gray-100 px-2 py-2">
          <ClientsPagination
            :page="eventsPage"
            :page-size="eventsPageSize"
            :total="eventsTotal"
            :pages="eventsPages"
            @update:page="eventsPage = $event"
          />
        </div>
      </template>
    </section>
  </div>
</template>

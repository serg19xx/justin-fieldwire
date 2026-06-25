<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { ClientListRow, ClientRowActionId, ClientToolbarActionId } from '@/core/types/client-registry'
import { getClientRegistryEntry } from '@/config/clients-registry'
import { clientsRegistryApi } from '@/core/utils/clients-registry-api'
import { getDefaultClientSort, type ClientSortDirection } from '@/core/utils/client-list-sort'
import {
  formatContactFilterLabel,
  getClientContactFilterFields,
  type ClientContactFilterFieldKey,
  type ClientContactFilterMode,
} from '@/core/utils/client-contact-filter'
import AppIcon from '@/components/AppIcon.vue'
import ClientsPagination from '@/components/clients/ClientsPagination.vue'
import ClientsTableShell from '@/components/clients/ClientsTableShell.vue'
import PharmacyEditDialog from '@/components/clients/PharmacyEditDialog.vue'
import PhysicianEditDialog from '@/components/clients/PhysicianEditDialog.vue'
import PharmacistEditDialog from '@/components/clients/PharmacistEditDialog.vue'
import MedicalClinicEditDialog from '@/components/clients/MedicalClinicEditDialog.vue'
import ClientCommDialog from '@/components/clients/ClientCommDialog.vue'
import ClientMeetingInviteDialog from '@/components/clients/ClientMeetingInviteDialog.vue'
import ClientExportCsvDialog from '@/components/clients/ClientExportCsvDialog.vue'
import type { ClientCommChannel } from '@/core/utils/clients-comms-api'

const route = useRoute()
const router = useRouter()

const registryKey = computed(() => String(route.params.type ?? ''))
const entry = computed(() => getClientRegistryEntry(registryKey.value))

const rows = ref<ClientListRow[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const search = ref('')
const page = ref(1)
const pageSize = ref(10)
const pagination = ref({ page: 1, limit: 10, total: 0, pages: 1 })

const filterValues = ref<Record<string, string>>({})
const countryOptions = ref<Array<{ code: string; name: string; geoCode: string }>>([])
const regionOptions = ref<string[]>([])
const dataFilterOptions = ref<Record<string, string[]>>({})
const selectedIds = ref<number[]>([])
const clientEditOpen = ref(false)
const clientEditId = ref<number | null>(null)
const actionBusy = ref(false)
const saveNotice = ref<string | null>(null)
const sortBy = ref('')
const sortDir = ref<ClientSortDirection>('asc')
const contactFilterField = ref<ClientContactFilterFieldKey | ''>('')
const contactFilterMode = ref<ClientContactFilterMode>('filled')

const commDialogOpen = ref(false)
const commChannel = ref<ClientCommChannel>('sms')
const commClientId = ref<number | null>(null)
const commClientName = ref('')
const commDestination = ref('')
const commBulkIds = ref<number[] | undefined>(undefined)

const meetingInviteOpen = ref(false)
const meetingInviteClientId = ref(0)
const meetingInviteClientName = ref('')
const meetingInvitePhone = ref('')

const exportDialogOpen = ref(false)

const contactFilterFields = computed(() =>
  entry.value ? getClientContactFilterFields(entry.value.key) : [],
)

const activeContactFilterLabel = computed(() => {
  if (!contactFilterField.value) return null
  const field = contactFilterFields.value.find((f) => f.key === contactFilterField.value)
  if (!field) return null
  return formatContactFilterLabel(field, contactFilterMode.value)
})

function resetSort() {
  if (!entry.value) {
    sortBy.value = ''
    sortDir.value = 'asc'
    return
  }
  const defaults = getDefaultClientSort(entry.value.key)
  sortBy.value = defaults.sortBy
  sortDir.value = defaults.sortDir
}

function handleSort(nextSortBy: string) {
  if (sortBy.value === nextSortBy) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = nextSortBy
    sortDir.value = 'asc'
  }
  page.value = 1
  void load()
}

const supportsClientCrud = computed(() =>
  entry.value?.key === 'pharma' ||
  entry.value?.key === 'physician' ||
  entry.value?.key === 'pharmacist' ||
  entry.value?.key === 'medical_clinic',
)

const selectedCount = computed(() => selectedIds.value.length)
const isBulkSelection = computed(() => selectedCount.value > 1)
const canAddClient = computed(() => !isBulkSelection.value)

const bulkCommActions = computed(() => {
  const trailing = entry.value?.trailingActions ?? []
  return {
    sms: trailing.includes('sms'),
    email: trailing.includes('email'),
  }
})

const pageTitle = computed(() => entry.value?.listTitle ?? entry.value?.pluralLabel ?? 'Clients')
const pageSizeChoices = computed(() => entry.value?.pageSizeOptions ?? [10, 25, 50])
const entriesLabel = computed(() => entry.value?.entriesLabel ?? 'entries')
const toolbarActions = computed<ClientToolbarActionId[]>(
  () => entry.value?.toolbarActions ?? ['add', 'exportCsv'],
)
const hasCountryFilter = computed(() =>
  (entry.value?.filters ?? []).some((f) => f.key === 'country'),
)
const totalPages = computed(() => {
  if (pagination.value.total === 0) return 0
  const pages = Number(pagination.value.pages)
  return Number.isFinite(pages) && pages > 0 ? Math.floor(pages) : 1
})

function goToPage(nextPage: number) {
  const target = Math.floor(Number(nextPage))
  if (!Number.isFinite(target) || target < 1 || target > totalPages.value || loading.value) return
  if (target === page.value) return
  page.value = target
}

function buildQuery() {
  const q: Record<string, string | number | boolean> = {
    page: page.value,
    limit: pageSize.value,
    search: search.value,
    sortBy: sortBy.value,
    sortDir: sortDir.value,
  }
  if (contactFilterField.value) {
    if (contactFilterMode.value === 'filled') {
      q.nonEmpty = contactFilterField.value
    } else {
      q.empty = contactFilterField.value
    }
  }
  for (const f of entry.value?.filters ?? []) {
    const v = filterValues.value[f.key]
    if (v) q[f.queryParam] = v
  }
  return q
}

async function loadFilterOptionsFromData() {
  if (!entry.value) return
  const needs = entry.value.filters.filter((f) => f.optionsFromData)
  if (needs.length === 0) return
  try {
    const sample = await clientsRegistryApi.listForFilterOptions(entry.value)
    const next: Record<string, string[]> = { ...dataFilterOptions.value }
    for (const f of needs) {
      const set = new Set<string>()
      for (const row of sample) {
        const v = row[f.key]
        if (v !== null && v !== undefined && String(v).trim() !== '') {
          set.add(String(v))
        }
      }
      next[f.key] = [...set].sort()
    }
    dataFilterOptions.value = next
  } catch (e) {
    console.warn('Filter options load failed', e)
  }
}

async function loadCountries() {
  countryOptions.value = await clientsRegistryApi.fetchCountries()
}

async function loadRegions() {
  const countryName = filterValues.value.country ?? ''
  const country = countryOptions.value.find((c) => c.code === countryName)
  regionOptions.value = country?.geoCode
    ? await clientsRegistryApi.fetchRegions(country.geoCode)
    : []
}

async function load() {
  if (!entry.value) return
  loading.value = true
  error.value = null
  try {
    const result = await clientsRegistryApi.list(entry.value, buildQuery())
    rows.value = result.rows
    pagination.value = result.pagination
  } catch (e) {
    console.error('Clients list failed', e)
    error.value = 'Failed to load clients. Check API access.'
    rows.value = []
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filterValues.value = {}
  regionOptions.value = []
  contactFilterField.value = ''
  contactFilterMode.value = 'filled'
  page.value = 1
  resetSort()
}

function onContactFilterChange() {
  page.value = 1
  void load()
}

function setContactFilterMode(mode: ClientContactFilterMode) {
  if (!contactFilterField.value) return
  contactFilterMode.value = mode
  onContactFilterChange()
}

function clearContactFilter() {
  contactFilterField.value = ''
  contactFilterMode.value = 'filled'
  onContactFilterChange()
}

function onCountryChange() {
  filterValues.value.region = ''
  void loadRegions()
  page.value = 1
  void load()
}

function onFilterChange() {
  page.value = 1
  void load()
}

function exportCsv() {
  if (!entry.value) return
  exportDialogOpen.value = true
}

function closeExportDialog() {
  exportDialogOpen.value = false
}

function onExportDone(message: string) {
  saveNotice.value = message
}

function clearSelection() {
  selectedIds.value = []
}

function handleAddClient() {
  if (!canAddClient.value || !entry.value) return
  if (supportsClientCrud.value) {
    clientEditId.value = null
    clientEditOpen.value = true
    return
  }
  alert(`Add ${entry.value.label} — form coming in next phase`)
}

function handleBulkDelete() {
  if (!isBulkSelection.value || !entry.value) return
  const label = entry.value.pluralLabel.toLowerCase()
  const confirmed = window.confirm(
    `Delete ${selectedCount.value} selected ${label}?\n\nThis action cannot be undone.`,
  )
  if (!confirmed) return
  void runBulkDelete()
}

async function runBulkDelete() {
  if (!entry.value) return
  const ids = [...selectedIds.value]
  actionBusy.value = true
  try {
    const failed = await clientsRegistryApi.removeMany(entry.value, ids)
    if (failed.length === 0) {
      clearSelection()
    } else {
      selectedIds.value = failed
      window.alert(
        `Deleted ${ids.length - failed.length} record(s). Failed IDs: ${failed.join(', ')}`,
      )
    }
    await load()
  } catch (e) {
    console.error('Bulk delete failed', e)
    window.alert('Bulk delete failed. Check API access.')
  } finally {
    actionBusy.value = false
  }
}

async function handleClientDelete(row: ClientListRow) {
  if (!entry.value || !supportsClientCrud.value) return
  const name = String(row[entry.value.nameField] ?? row.id)
  const label = entry.value.label.toLowerCase()
  const confirmed = window.confirm(`Delete ${label} "${name}" (id: ${row.id})?\n\nThis cannot be undone.`)
  if (!confirmed) return
  actionBusy.value = true
  try {
    await clientsRegistryApi.remove(entry.value, row.id)
    selectedIds.value = selectedIds.value.filter((id) => id !== row.id)
    await load()
  } catch (e) {
    console.error(`Delete ${label} failed`, e)
    window.alert(e instanceof Error ? e.message : `Failed to delete ${label}.`)
  } finally {
    actionBusy.value = false
  }
}

function openClientEdit(id: number) {
  clientEditId.value = id
  clientEditOpen.value = true
}

function closeClientEdit() {
  clientEditOpen.value = false
  clientEditId.value = null
}

async function onClientSaved(savedId: number) {
  if (!entry.value) return
  saveNotice.value = null
  await load()
  await loadFilterOptionsFromData()
  if (!rows.value.some((row) => row.id === savedId)) {
    try {
      const row = await clientsRegistryApi.getById(entry.value, savedId)
      const name = String(row[entry.value.nameField] ?? savedId)
      saveNotice.value = `${entry.value.label} "${name}" (#${savedId}) was saved but is hidden by your search or filters. Clear them to see it in the list.`
    } catch {
      saveNotice.value = `${entry.value.label} #${savedId} was not found after save. Check the database or try another page.`
    }
  }
}

function clearSaveNotice() {
  saveNotice.value = null
}

function clearSearchAndFilters() {
  search.value = ''
  contactFilterField.value = ''
  contactFilterMode.value = 'filled'
  resetFilters()
  saveNotice.value = null
  void load()
}

function handleBulkSms() {
  if (!isBulkSelection.value || !entry.value || !bulkCommActions.value.sms) return
  openCommDialog('sms', undefined, [...selectedIds.value])
}

function handleBulkEmail() {
  if (!isBulkSelection.value || !entry.value || !bulkCommActions.value.email) return
  openCommDialog('email', undefined, [...selectedIds.value])
}

function openCommDialog(
  channel: ClientCommChannel,
  row?: ClientListRow,
  bulkIds?: number[],
) {
  if (!entry.value || actionBusy.value) return

  commChannel.value = channel
  commBulkIds.value = bulkIds && bulkIds.length > 1 ? bulkIds : undefined
  commClientId.value = row?.id ?? (bulkIds?.length === 1 ? bulkIds[0] ?? null : null)

  if (row) {
    commClientName.value = String(row[entry.value.nameField] ?? row.id)
    if (channel === 'sms') {
      commDestination.value = resolveRowPhone(row) ?? ''
    } else if (channel === 'email') {
      commDestination.value = row.email ? String(row.email) : ''
    } else {
      commDestination.value = resolveRowFax(row) ?? ''
    }
  } else {
    commClientName.value = entry.value.pluralLabel
    commDestination.value = ''
  }

  if (!commBulkIds.value && commClientId.value === null) return

  if (!commBulkIds.value) {
    if (channel === 'sms' && !commDestination.value) {
      alert('This client has no phone number on file.')
      return
    }
    if (channel === 'email' && !commDestination.value) {
      alert('This client has no email on file.')
      return
    }
    if (channel === 'fax' && !commDestination.value) {
      alert('This client has no fax number on file.')
      return
    }
  }

  commDialogOpen.value = true
}

function closeCommDialog() {
  commDialogOpen.value = false
}

function onCommSent(notice: string) {
  saveNotice.value = notice
}

function openMeetingInviteDialog(row: ClientListRow) {
  if (!entry.value || actionBusy.value || isBulkSelection.value) return
  const phone = resolveRowPhone(row)
  if (!phone) {
    alert('This client has no phone number on file.')
    return
  }
  meetingInviteClientId.value = row.id
  meetingInviteClientName.value = String(row[entry.value.nameField] ?? row.id)
  meetingInvitePhone.value = phone
  meetingInviteOpen.value = true
}

function closeMeetingInviteDialog() {
  meetingInviteOpen.value = false
}

function onMeetingInviteSent(notice: string) {
  saveNotice.value = notice
}

const actionLabels: Record<ClientRowActionId, string> = {
  delete: 'Delete',
  edit: 'Edit',
  fixAddress: 'Fix address',
  sms: 'SMS',
  meetingInvite: 'Schedule call',
  fax: 'Fax',
  message: 'Message',
  documents: 'Documents',
  email: 'Email',
  statusMessage: 'Message status',
  statusLock: 'Lock status',
  statusEmail: 'Email status',
  statusFolder: 'Folder',
  addUser: 'Add user',
}

function resolveRowPhone(row: ClientListRow): string | null {
  const phone =
    row.cell_phone ??
    row.cellPhone ??
    row.phone ??
    row.cell ??
    row.officePhone
  if (phone === null || phone === undefined || String(phone).trim() === '') return null
  return String(phone)
}

function resolveRowFax(row: ClientListRow): string | null {
  const fax = row.fax ?? row.faxNumber
  if (fax === null || fax === undefined || String(fax).trim() === '') return null
  return String(fax)
}

function handleAction(actionId: ClientRowActionId, row: ClientListRow) {
  if (isBulkSelection.value || actionBusy.value) return
  const name = entry.value ? String(row[entry.value.nameField] ?? row.id) : row.id

  if (supportsClientCrud.value) {
    if (actionId === 'edit') {
      openClientEdit(row.id)
      return
    }
    if (actionId === 'delete') {
      void handleClientDelete(row)
      return
    }
  }

  if (actionId === 'email' || actionId === 'statusEmail') {
    openCommDialog('email', row)
    return
  }
  if (actionId === 'sms' || actionId === 'message') {
    openCommDialog('sms', row)
    return
  }
  if (actionId === 'meetingInvite') {
    openMeetingInviteDialog(row)
    return
  }
  if (actionId === 'fax') {
    openCommDialog('fax', row)
    return
  }
  alert(`${actionLabels[actionId]} — coming soon\n\n${name} (id: ${row.id})`)
}

watch(registryKey, () => {
  page.value = 1
  pageSize.value = entry.value?.defaultPageSize ?? 10
  search.value = ''
  selectedIds.value = []
  rows.value = []
  error.value = null
  clientEditOpen.value = false
  clientEditId.value = null
  saveNotice.value = null
  resetFilters()
  if (!entry.value) {
    router.replace('/clients/pharma')
    return
  }
  if (hasCountryFilter.value) {
    void loadCountries()
  }
  void loadFilterOptionsFromData()
  void load()
})

watch(pageSize, () => {
  page.value = 1
  void load()
})

watch([search, page], () => {
  void load()
})

onMounted(async () => {
  if (!entry.value) {
    router.replace('/clients/pharma')
    return
  }
  pageSize.value = entry.value.defaultPageSize ?? 10
  resetSort()
  if (hasCountryFilter.value) {
    await loadCountries()
  }
  await loadFilterOptionsFromData()
  await load()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 w-full min-w-0 max-w-full overflow-x-hidden">
    <div class="bg-white border-b border-gray-200 px-4 py-4 sm:px-6 min-w-0">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-w-0">
        <div class="min-w-0 shrink-0">
          <h1 class="text-xl font-semibold text-gray-900 truncate">{{ pageTitle }}</h1>
          <a
            href="/CLIENT_COMMUNICATIONS_USER_GUIDE.html"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-1 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            <AppIcon icon="mdi:book-open-page-variant-outline" :size="16" />
            SMS, Email &amp; Fax guide
          </a>
          <a
            href="/SMS_MEETING_INVITE_USER_GUIDE.html"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-1 inline-flex items-center gap-1 text-sm text-teal-700 hover:underline"
          >
            <AppIcon icon="mdi:calendar-clock-outline" :size="16" />
            Schedule call via SMS guide
          </a>
          <a
            href="/SMS_MEETING_INVITE_TESTING_GUIDE.html"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-1 inline-flex items-center gap-1 text-sm text-amber-800 hover:underline"
          >
            <AppIcon icon="mdi:clipboard-check-outline" :size="16" />
            Schedule call via SMS — testing guide
          </a>
        </div>
        <div class="flex flex-wrap items-center gap-3 text-sm min-w-0">
          <button
            v-if="toolbarActions.includes('add')"
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
            :disabled="!canAddClient"
            :title="
              canAddClient
                ? undefined
                : 'Clear multi-selection to add a new client'
            "
            @click="handleAddClient"
          >
            <AppIcon icon="mdi:plus" :size="18" />
            Add {{ entry?.label ?? 'client' }}
          </button>
          <button
            v-if="toolbarActions.includes('loadCsv')"
            type="button"
            class="inline-flex items-center gap-1.5 text-blue-600 hover:underline"
            @click="alert('Load from CSV — coming soon')"
          >
            <AppIcon icon="mdi:upload" :size="16" />
            Load from CSV
          </button>
          <button
            v-if="toolbarActions.includes('exportCsv')"
            type="button"
            class="inline-flex items-center gap-1.5 text-blue-600 hover:underline"
            @click="exportCsv"
          >
            <AppIcon icon="mdi:download" :size="16" />
            Export CSV
          </button>
        </div>
      </div>
    </div>

    <main class="p-4 sm:p-6 space-y-4 w-full min-w-0 max-w-full">
      <div class="flex flex-col xl:flex-row xl:items-end gap-3 flex-wrap min-w-0 w-full">
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600">Show</label>
          <select
            v-model.number="pageSize"
            class="border border-gray-300 rounded-md px-2 py-1.5 text-sm bg-white"
          >
            <option v-for="n in pageSizeChoices" :key="n" :value="n">{{ n }}</option>
          </select>
          <span class="text-sm text-gray-600">{{ entriesLabel }}</span>
        </div>

        <div v-if="entry" class="flex flex-wrap gap-3 flex-1 min-w-0 items-center">
          <template v-for="f in entry.filters" :key="f.key">
            <div
              v-if="f.inline"
              class="flex flex-wrap items-center gap-2"
            >
              <label class="text-sm text-gray-600 whitespace-nowrap">{{ f.label }}</label>
              <select
                v-model="filterValues[f.key]"
                class="border border-gray-300 rounded-md px-2 py-1.5 text-sm bg-white min-w-[12rem]"
                @change="onFilterChange()"
              >
                <option value="">{{ f.emptyOption ?? 'All' }}</option>
                <option
                  v-for="opt in dataFilterOptions[f.key] ?? []"
                  :key="opt"
                  :value="opt"
                >
                  {{ opt }}
                </option>
              </select>
            </div>
            <select
              v-else
              v-model="filterValues[f.key]"
              class="border border-gray-300 rounded-md px-2 py-1.5 text-sm bg-white min-w-[140px]"
              @change="f.key === 'country' ? onCountryChange() : onFilterChange()"
            >
              <option value="">{{ f.emptyOption ?? f.label }}</option>
              <template v-if="f.key === 'country'">
                <option v-for="c in countryOptions" :key="c.geoCode" :value="c.code">
                  {{ c.name }}
                </option>
              </template>
              <template v-else-if="f.key === 'region'">
                <option v-for="r in regionOptions" :key="r" :value="r">{{ r }}</option>
              </template>
              <template v-else-if="f.optionsFromData">
                <option v-for="opt in dataFilterOptions[f.key] ?? []" :key="opt" :value="opt">
                  {{ opt }}
                </option>
              </template>
            </select>
          </template>
        </div>

        <div v-if="entry" class="flex flex-wrap items-center gap-2">
          <label class="text-sm text-gray-600 whitespace-nowrap">Field filter:</label>
          <select
            v-model="contactFilterField"
            class="border border-gray-300 rounded-md px-2 py-1.5 text-sm bg-white min-w-[10rem] max-w-full"
            @change="onContactFilterChange"
          >
            <option value="">All records</option>
            <option v-for="f in contactFilterFields" :key="f.key" :value="f.key">
              {{ f.label }}
            </option>
          </select>
          <div
            class="inline-flex rounded-md border border-gray-300 bg-white text-xs overflow-hidden shrink-0"
            :class="{ 'opacity-50 pointer-events-none': !contactFilterField }"
            role="group"
            aria-label="Has or empty value"
          >
            <button
              type="button"
              class="px-2.5 py-1.5 transition-colors"
              :class="
                contactFilterMode === 'filled'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              "
              :disabled="!contactFilterField"
              @click="setContactFilterMode('filled')"
            >
              Has value
            </button>
            <button
              type="button"
              class="px-2.5 py-1.5 border-l border-gray-300 transition-colors"
              :class="
                contactFilterMode === 'empty'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              "
              :disabled="!contactFilterField"
              @click="setContactFilterMode('empty')"
            >
              No value
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600 whitespace-nowrap">Search:</label>
          <div class="relative w-full sm:w-48">
            <AppIcon
              icon="mdi:magnify"
              :size="16"
              class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              v-model="search"
              type="search"
              class="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
      </div>

      <p
        v-if="activeContactFilterLabel"
        class="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2"
      >
        Showing:
        <span class="font-medium">{{ activeContactFilterLabel }}</span>
        <button
          type="button"
          class="ml-2 text-amber-900 hover:underline"
          @click="clearContactFilter"
        >
          Clear
        </button>
      </p>

      <ClientsPagination
        v-if="pagination.total > 0"
        :page="page"
        :page-size="pageSize"
        :total="pagination.total"
        :pages="totalPages"
        :loading="loading"
        @update:page="goToPage"
      />

      <div
        v-if="saveNotice"
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
      >
        <p>{{ saveNotice }}</p>
        <div class="flex shrink-0 gap-2">
          <button
            type="button"
            class="rounded-md border border-amber-300 bg-white px-2.5 py-1 text-sm font-medium hover:bg-amber-100"
            @click="clearSearchAndFilters"
          >
            Clear search &amp; filters
          </button>
          <button
            type="button"
            class="rounded-md px-2.5 py-1 text-sm text-amber-800 hover:underline"
            @click="clearSaveNotice"
          >
            Dismiss
          </button>
        </div>
      </div>

      <div
        v-if="selectedCount > 0"
        class="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm"
        :class="
          isBulkSelection
            ? 'border-slate-300 bg-slate-50 text-slate-900'
            : 'border-blue-200 bg-blue-50 text-blue-900'
        "
      >
        <span class="font-medium">{{ selectedCount }} selected</span>
        <template v-if="isBulkSelection">
          <button
            v-if="bulkCommActions.sms"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-md border border-green-300 bg-white px-2.5 py-1 text-sm font-medium text-green-700 hover:bg-green-50"
            @click="handleBulkSms"
          >
            <AppIcon icon="mdi:message-text-outline" :size="16" />
            Send SMS
          </button>
          <button
            v-if="bulkCommActions.email"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-md border border-blue-300 bg-white px-2.5 py-1 text-sm font-medium text-blue-700 hover:bg-blue-50"
            @click="handleBulkEmail"
          >
            <AppIcon icon="mdi:at" :size="16" />
            Send email
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-white px-2.5 py-1 text-sm font-medium text-red-700 hover:bg-red-50"
            @click="handleBulkDelete"
          >
            <AppIcon icon="mdi:delete-outline" :size="16" />
            Delete selected
          </button>
        </template>
        <span v-else class="text-blue-700 hidden sm:inline">
          Tip: Shift+click for a range, Ctrl/Cmd+click to add or remove rows with gaps.
        </span>
        <button
          type="button"
          class="ml-auto hover:underline text-slate-700 hover:text-slate-900"
          @click="clearSelection"
        >
          Clear selection
        </button>
      </div>

      <div class="w-full min-w-0 max-w-full">
        <ClientsTableShell
          v-if="entry"
          :key="registryKey"
          :entry="entry"
          :rows="rows"
          :page="page"
          :page-size="pageSize"
          :loading="loading"
          :error="error"
          :sort-by="sortBy"
          :sort-dir="sortDir"
          v-model:selected-ids="selectedIds"
          :row-actions-disabled="isBulkSelection"
          @action="handleAction"
          @sort="handleSort"
        />
      </div>

      <ClientsPagination
        v-if="pagination.total > 0"
        :page="page"
        :page-size="pageSize"
        :total="pagination.total"
        :pages="totalPages"
        :loading="loading"
        @update:page="goToPage"
      />
    </main>

    <PharmacyEditDialog
      v-if="entry?.key === 'pharma'"
      :open="clientEditOpen"
      :entry="entry"
      :pharmacy-id="clientEditId"
      @close="closeClientEdit"
      @saved="onClientSaved"
    />
    <PhysicianEditDialog
      v-if="entry?.key === 'physician'"
      :open="clientEditOpen"
      :entry="entry"
      :physician-id="clientEditId"
      @close="closeClientEdit"
      @saved="onClientSaved"
    />
    <PharmacistEditDialog
      v-if="entry?.key === 'pharmacist'"
      :open="clientEditOpen"
      :entry="entry"
      :pharmacist-id="clientEditId"
      @close="closeClientEdit"
      @saved="onClientSaved"
    />
    <MedicalClinicEditDialog
      v-if="entry?.key === 'medical_clinic'"
      :open="clientEditOpen"
      :entry="entry"
      :clinic-id="clientEditId"
      @close="closeClientEdit"
      @saved="onClientSaved"
    />
    <ClientCommDialog
      v-if="entry"
      :open="commDialogOpen"
      :channel="commChannel"
      :client-type="entry.key"
      :client-name="commClientName"
      :destination="commDestination"
      :client-id="commClientId"
      :bulk-ids="commBulkIds"
      @close="closeCommDialog"
      @sent="onCommSent"
    />
    <ClientMeetingInviteDialog
      v-if="entry"
      :open="meetingInviteOpen"
      :client-type="entry.key"
      :client-id="meetingInviteClientId"
      :client-name="meetingInviteClientName"
      :phone="meetingInvitePhone"
      @close="closeMeetingInviteDialog"
      @sent="onMeetingInviteSent"
    />
    <ClientExportCsvDialog
      v-if="entry"
      :open="exportDialogOpen"
      :entry="entry"
      :initial-country="filterValues.country ?? ''"
      :initial-region="filterValues.region ?? ''"
      @close="closeExportDialog"
      @exported="onExportDone"
    />
  </div>
</template>

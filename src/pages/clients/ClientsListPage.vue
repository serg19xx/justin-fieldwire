<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { ClientListRow, ClientRowActionId, ClientToolbarActionId } from '@/core/types/client-registry'
import { getClientRegistryEntry } from '@/config/clients-registry'
import { clientsRegistryApi } from '@/core/utils/clients-registry-api'
import { exportClientsCsv } from '@/core/utils/clients-export'
import AppIcon from '@/components/AppIcon.vue'
import ClientsPagination from '@/components/clients/ClientsPagination.vue'
import ClientsTableShell from '@/components/clients/ClientsTableShell.vue'

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

const pageTitle = computed(() => entry.value?.listTitle ?? entry.value?.pluralLabel ?? 'Clients')
const pageSizeChoices = computed(() => entry.value?.pageSizeOptions ?? [10, 25, 50])
const entriesLabel = computed(() => entry.value?.entriesLabel ?? 'entries')
const toolbarActions = computed<ClientToolbarActionId[]>(
  () =>
    entry.value?.toolbarActions ?? ['loadCsv', 'exportCsv', 'sendgridTemplate', 'add'],
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
  const q: Record<string, string | number> = {
    page: page.value,
    limit: pageSize.value,
    search: search.value,
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
  page.value = 1
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
  if (!entry.value || rows.value.length === 0) {
    alert('No rows to export')
    return
  }
  exportClientsCsv(entry.value, rows.value)
}

const actionLabels: Record<ClientRowActionId, string> = {
  delete: 'Delete',
  edit: 'Edit',
  fixAddress: 'Fix address',
  sms: 'SMS',
  message: 'Message',
  documents: 'Documents',
  email: 'Email',
  statusMessage: 'Message status',
  statusLock: 'Lock status',
  statusEmail: 'Email status',
  statusFolder: 'Folder',
  addUser: 'Add user',
}

function handleAction(actionId: ClientRowActionId, row: ClientListRow) {
  const name = entry.value ? String(row[entry.value.nameField] ?? row.id) : row.id
  if (actionId === 'email' && row.email) {
    window.location.href = `mailto:${row.email}`
    return
  }
  if (actionId === 'statusEmail' && row.email) {
    window.location.href = `mailto:${row.email}`
    return
  }
  if (actionId === 'sms' || actionId === 'message') {
    const phone =
      row.cell_phone ??
      row.cellPhone ??
      row.phone ??
      row.cell ??
      row.cell_phone ??
      row.officePhone
    if (phone) {
      window.location.href = `tel:${phone}`
      return
    }
  }
  alert(`${actionLabels[actionId]} — coming soon\n\n${name} (id: ${row.id})`)
}

watch(registryKey, () => {
  page.value = 1
  pageSize.value = entry.value?.defaultPageSize ?? 10
  search.value = ''
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
        </div>
        <div class="flex flex-wrap items-center gap-3 text-sm min-w-0">
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
          <button
            v-if="toolbarActions.includes('sendgridTemplate')"
            type="button"
            class="inline-flex items-center gap-1.5 text-blue-600 hover:underline"
            @click="alert('Add SendGrid email template — coming soon')"
          >
            <AppIcon icon="mdi:email-multiple-outline" :size="16" />
            {{
              entry?.key === 'pharma'
                ? 'SGrid email templates'
                : 'Add SendGrid email template'
            }}
          </button>
          <button
            v-if="toolbarActions.includes('add')"
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700"
            @click="alert('Add client — form coming in next phase')"
          >
            <AppIcon icon="mdi:plus" :size="18" />
            Add {{ entry?.label ?? 'client' }}
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

      <ClientsPagination
        v-if="pagination.total > 0"
        :page="page"
        :page-size="pageSize"
        :total="pagination.total"
        :pages="totalPages"
        :loading="loading"
        @update:page="goToPage"
      />

      <div class="w-full min-w-0 max-w-full">
        <ClientsTableShell
          v-if="entry"
          :entry="entry"
          :rows="rows"
          :page="page"
          :page-size="pageSize"
          :loading="loading"
          :error="error"
          @action="handleAction"
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
  </div>
</template>

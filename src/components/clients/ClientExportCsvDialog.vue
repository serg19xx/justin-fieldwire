<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ClientRegistryEntry } from '@/core/types/client-registry'
import { clientsRegistryApi } from '@/core/utils/clients-registry-api'
import { exportClientsCsv } from '@/core/utils/clients-export'

const props = defineProps<{
  open: boolean
  entry: ClientRegistryEntry
  initialCountry?: string
  initialRegion?: string
}>()

const emit = defineEmits<{
  close: []
  exported: [message: string]
}>()

const country = ref('')
const region = ref('')
const city = ref('')
const countryOptions = ref<Array<{ code: string; name: string; geoCode: string }>>([])
const regionOptions = ref<string[]>([])
const cityOptions = ref<string[]>([])
const loadingCities = ref(false)
const exporting = ref(false)
const error = ref<string | null>(null)
const previewTotal = ref<number | null>(null)
const loadingPreview = ref(false)

const scopeSummary = computed(() => {
  if (city.value) {
    return `City: ${city.value}, ${region.value}, ${country.value}`
  }
  if (region.value) {
    return `All cities in ${region.value}, ${country.value}`
  }
  if (country.value) {
    return `All regions in ${country.value}`
  }
  return 'All records (no location filter)'
})

async function loadCountries() {
  countryOptions.value = await clientsRegistryApi.fetchCountries()
}

async function loadRegionsForCountry() {
  const match = countryOptions.value.find((c) => c.code === country.value)
  regionOptions.value = match?.geoCode
    ? await clientsRegistryApi.fetchRegions(match.geoCode)
    : []
}

async function loadCitiesForRegion() {
  cityOptions.value = []
  if (!country.value || !region.value) return
  loadingCities.value = true
  try {
    cityOptions.value = await clientsRegistryApi.listDistinctCities(
      props.entry,
      country.value,
      region.value,
    )
  } catch (e) {
    console.warn('City list load failed', e)
    cityOptions.value = []
  } finally {
    loadingCities.value = false
  }
}

function buildGeoQuery() {
  const query: Record<string, string> = {}
  if (country.value) query.country = country.value
  if (region.value) query.region = region.value
  if (city.value) query.city = city.value
  return query
}

async function refreshPreview() {
  previewTotal.value = null
  loadingPreview.value = true
  try {
    const result = await clientsRegistryApi.list(props.entry, {
      ...buildGeoQuery(),
      page: 1,
      limit: 1,
    })
    previewTotal.value = result.pagination.total
  } catch {
    previewTotal.value = null
  } finally {
    loadingPreview.value = false
  }
}

function resetForm() {
  country.value = props.initialCountry ?? ''
  region.value = props.initialRegion ?? ''
  city.value = ''
  regionOptions.value = []
  cityOptions.value = []
  error.value = null
  previewTotal.value = null
}

watch(
  () => props.open,
  async (open) => {
    if (!open) return
    resetForm()
    await loadCountries()
    if (country.value) {
      await loadRegionsForCountry()
      if (region.value) {
        await loadCitiesForRegion()
      }
    }
    await refreshPreview()
  },
)

watch(country, async () => {
  region.value = ''
  city.value = ''
  cityOptions.value = []
  await loadRegionsForCountry()
  await refreshPreview()
})

watch(region, async () => {
  city.value = ''
  await loadCitiesForRegion()
  await refreshPreview()
})

watch(city, () => {
  void refreshPreview()
})

async function handleExport() {
  if (exporting.value) return
  exporting.value = true
  error.value = null

  try {
    const geo = buildGeoQuery()
    const rows = await clientsRegistryApi.listAll(props.entry, geo)
    if (rows.length === 0) {
      error.value = 'No records match the selected filters.'
      return
    }

    exportClientsCsv(props.entry, rows, {
      country: country.value || undefined,
      region: region.value || undefined,
      city: city.value || undefined,
    })

    emit(
      'exported',
      `Exported ${rows.length} ${props.entry.pluralLabel.toLowerCase()} (${scopeSummary.value})`,
    )
    emit('close')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Export failed'
  } finally {
    exporting.value = false
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
      class="relative w-full sm:max-w-md bg-white rounded-t-xl sm:rounded-xl shadow-xl"
      role="dialog"
      aria-modal="true"
    >
      <div class="px-4 py-4 sm:px-6 border-b border-gray-200 flex items-start justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">Export CSV</h2>
          <p class="mt-1 text-sm text-gray-500">{{ entry.pluralLabel }}</p>
        </div>
        <button
          type="button"
          class="text-gray-400 hover:text-gray-600 text-xl leading-none"
          @click="emit('close')"
        >
          ×
        </button>
      </div>

      <form class="px-4 py-4 sm:px-6 space-y-4" @submit.prevent="handleExport">
        <p class="text-sm text-gray-600">
          Narrow the export step by step. Leave fields empty to include broader areas.
        </p>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Country</label>
          <select
            v-model="country"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
          >
            <option value="">All countries</option>
            <option v-for="c in countryOptions" :key="c.geoCode" :value="c.code">
              {{ c.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Region / Province</label>
          <select
            v-model="region"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white disabled:bg-gray-50"
            :disabled="!country"
          >
            <option value="">{{ country ? 'All regions in country' : 'Select country first' }}</option>
            <option v-for="r in regionOptions" :key="r" :value="r">{{ r }}</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">City</label>
          <select
            v-model="city"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white disabled:bg-gray-50"
            :disabled="!region || loadingCities"
          >
            <option value="">
              {{ !region ? 'Select region first' : loadingCities ? 'Loading cities…' : 'All cities in region' }}
            </option>
            <option v-for="c in cityOptions" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>

        <div class="rounded-md bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-gray-700">
          <p class="font-medium text-gray-900">Export scope</p>
          <p class="mt-0.5">{{ scopeSummary }}</p>
          <p v-if="loadingPreview" class="mt-1 text-gray-500">Counting records…</p>
          <p v-else-if="previewTotal !== null" class="mt-1 text-gray-600">
            About {{ previewTotal.toLocaleString() }} record(s)
          </p>
        </div>

        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

        <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            :disabled="exporting"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            :disabled="exporting"
          >
            {{ exporting ? 'Exporting…' : 'Download CSV' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

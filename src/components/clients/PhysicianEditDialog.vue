<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ClientRegistryEntry } from '@/core/types/client-registry'
import {
  emptyPhysicianForm,
  PHYSICIAN_TITLE_OPTIONS,
  physicianFormFromRow,
  physicianFormToPayload,
  type PhysicianFormModel,
} from '@/core/types/physician-form'
import { clientsRegistryApi } from '@/core/utils/clients-registry-api'

const props = defineProps<{
  open: boolean
  entry: ClientRegistryEntry
  physicianId: number | null
}>()

const emit = defineEmits<{
  close: []
  saved: [id: number]
}>()

const form = ref<PhysicianFormModel>(emptyPhysicianForm())
const loadingRecord = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const fieldErrors = ref<Record<string, string>>({})
const countryOptions = ref<Array<{ code: string; name: string; geoCode: string }>>([])
const regionOptions = ref<string[]>([])

const isAddMode = computed(() => props.physicianId === null)

const title = computed(() =>
  isAddMode.value ? 'Add physician' : `Edit physician #${props.physicianId}`,
)

const submitLabel = computed(() => {
  if (saving.value) return isAddMode.value ? 'Adding…' : 'Saving…'
  return isAddMode.value ? 'Add physician' : 'Save changes'
})

async function loadCountries() {
  countryOptions.value = await clientsRegistryApi.fetchCountries()
}

async function loadRegionsForCountry(countryName: string) {
  const country = countryOptions.value.find((c) => c.code === countryName)
  regionOptions.value = country?.geoCode
    ? await clientsRegistryApi.fetchRegions(country.geoCode)
    : []
}

async function loadForAdd() {
  error.value = null
  fieldErrors.value = {}
  loadingRecord.value = false
  form.value = emptyPhysicianForm()
  try {
    await loadCountries()
    if (countryOptions.value.some((c) => c.code === 'Canada')) {
      form.value.country = 'Canada'
      await loadRegionsForCountry('Canada')
    }
  } catch (e) {
    console.error('Prepare add physician failed', e)
    error.value = 'Failed to load country list. You can still type address manually.'
  }
}

async function loadPhysician() {
  if (!props.physicianId) return
  loadingRecord.value = true
  error.value = null
  fieldErrors.value = {}
  form.value = emptyPhysicianForm()
  try {
    await loadCountries()
    const row = await clientsRegistryApi.getById(props.entry, props.physicianId)
    form.value = physicianFormFromRow(row as Record<string, unknown>)
    await loadRegionsForCountry(form.value.country)
  } catch (e) {
    console.error('Load physician failed', e)
    error.value = 'Failed to load physician details.'
  } finally {
    loadingRecord.value = false
  }
}

function validate(): boolean {
  const next: Record<string, string> = {}
  if (!form.value.fullName.trim()) next.fullName = 'Name is required'
  if (!form.value.email.trim()) next.email = 'Email is required'
  fieldErrors.value = next
  return Object.keys(next).length === 0
}

async function onCountryChange() {
  form.value.region = ''
  await loadRegionsForCountry(form.value.country)
}

async function handleSubmit() {
  if (saving.value) return
  if (!validate()) return
  saving.value = true
  error.value = null
  try {
    let savedId: number
    const payload = physicianFormToPayload(form.value)
    if (isAddMode.value) {
      savedId = await clientsRegistryApi.create(props.entry, payload)
    } else if (props.physicianId) {
      savedId = props.physicianId
      await clientsRegistryApi.update(props.entry, props.physicianId, payload)
    } else {
      return
    }
    emit('saved', savedId)
    emit('close')
  } catch (e) {
    console.error('Save physician failed', e)
    error.value = e instanceof Error ? e.message : 'Failed to save physician.'
  } finally {
    saving.value = false
  }
}

function closeDialog() {
  if (saving.value) return
  emit('close')
}

watch(
  () => [props.open, props.physicianId] as const,
  ([open, id]) => {
    if (open && id) {
      void loadPhysician()
    } else if (open && id === null) {
      void loadForAdd()
    } else if (!open) {
      form.value = emptyPhysicianForm()
      error.value = null
      fieldErrors.value = {}
    }
  },
)
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
    @click="closeDialog"
  >
    <div
      class="bg-white w-full sm:w-[48rem] sm:max-w-3xl max-h-[95vh] sm:max-h-[90vh] flex flex-col rounded-t-xl sm:rounded-lg shadow-xl overflow-hidden"
      @click.stop
    >
      <div class="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-4 sm:px-6">
        <h2 class="text-lg font-semibold text-gray-900">{{ title }}</h2>
        <button
          type="button"
          class="text-gray-400 hover:text-gray-600 p-1"
          aria-label="Close"
          :disabled="saving"
          @click="closeDialog"
        >
          <span class="text-2xl leading-none">&times;</span>
        </button>
      </div>

      <div class="relative flex-1 min-h-[28rem] overflow-y-auto">
        <div
          v-if="loadingRecord"
          class="absolute inset-0 z-10 flex items-center justify-center bg-white/75 text-sm text-gray-600"
        >
          Loading…
        </div>

        <form
          class="p-4 sm:p-6 space-y-4"
          autocomplete="off"
          :class="{ 'pointer-events-none opacity-50': loadingRecord }"
          @submit.prevent="handleSubmit"
        >
          <p
            v-if="error"
            class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {{ error }}
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <select
                v-model="form.prefTitle"
                class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
              >
                <option v-for="t in PHYSICIAN_TITLE_OPTIONS" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
            <div class="sm:col-span-3">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Name <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.fullName"
                type="text"
                class="w-full border rounded-md px-3 py-2 text-sm"
                :class="fieldErrors.fullName ? 'border-red-300' : 'border-gray-300'"
              />
              <p v-if="fieldErrors.fullName" class="mt-1 text-xs text-red-600">{{ fieldErrors.fullName }}</p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Speciality</label>
            <input
              v-model="form.specialty"
              type="text"
              class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <input
              v-model="form.company"
              type="text"
              class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <select
                v-model="form.country"
                class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                @change="onCountryChange()"
              >
                <option value="">Select country</option>
                <option v-for="c in countryOptions" :key="c.geoCode" :value="c.code">{{ c.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Region</label>
              <select
                v-if="regionOptions.length > 0"
                v-model="form.region"
                class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
              >
                <option value="">Select region</option>
                <option v-for="r in regionOptions" :key="r" :value="r">{{ r }}</option>
              </select>
              <input
                v-else
                v-model="form.region"
                type="text"
                class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                v-model="form.city"
                type="text"
                class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-6 gap-3">
            <div class="sm:col-span-1">
              <label class="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <input
                v-model="form.unitNumb"
                type="text"
                class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div class="sm:col-span-3">
              <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                v-model="form.fullAddress"
                type="text"
                class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Postal code</label>
              <input
                v-model="form.postal"
                type="text"
                class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Cell #</label>
              <input
                v-model="form.cellPhone"
                type="text"
                class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Office #</label>
              <input
                v-model="form.officePhone"
                type="text"
                class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Fax #</label>
              <input
                v-model="form.faxNumber"
                type="text"
                class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              E-mail <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.email"
              type="email"
              class="w-full border rounded-md px-3 py-2 text-sm"
              :class="fieldErrors.email ? 'border-red-300' : 'border-gray-300'"
            />
            <p v-if="fieldErrors.email" class="mt-1 text-xs text-red-600">{{ fieldErrors.email }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              v-model="form.notes"
              rows="3"
              class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>

          <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              class="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              :disabled="saving"
              @click="closeDialog"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              :disabled="saving || loadingRecord"
            >
              {{ submitLabel }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

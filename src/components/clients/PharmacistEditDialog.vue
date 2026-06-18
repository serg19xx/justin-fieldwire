<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ClientRegistryEntry } from '@/core/types/client-registry'
import { getClientRegistryEntry } from '@/config/clients-registry'
import {
  emptyPharmacistForm,
  pharmacistFormFromRow,
  pharmacistFormToPayload,
  type PharmacistFormModel,
} from '@/core/types/pharmacist-form'
import { clientsRegistryApi } from '@/core/utils/clients-registry-api'

const props = defineProps<{
  open: boolean
  entry: ClientRegistryEntry
  pharmacistId: number | null
}>()

const emit = defineEmits<{
  close: []
  saved: [id: number]
}>()

const form = ref<PharmacistFormModel>(emptyPharmacistForm())
const loadingRecord = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const fieldErrors = ref<Record<string, string>>({})
const pharmacyOptions = ref<Array<{ id: number; name: string }>>([])
const pharmacySearch = ref('')
const loadingPharmacies = ref(false)

const isAddMode = computed(() => props.pharmacistId === null)

const title = computed(() =>
  isAddMode.value ? 'Add pharmacist' : `Edit pharmacist #${props.pharmacistId}`,
)

const submitLabel = computed(() => {
  if (saving.value) return isAddMode.value ? 'Adding…' : 'Saving…'
  return isAddMode.value ? 'Add pharmacist' : 'Save changes'
})

function ensurePharmacyOption(id: number, name: string) {
  if (!pharmacyOptions.value.some((p) => p.id === id)) {
    pharmacyOptions.value = [{ id, name }, ...pharmacyOptions.value]
  }
}

async function loadPharmacyOptions() {
  const pharmaEntry = getClientRegistryEntry('pharma')
  if (!pharmaEntry) return
  loadingPharmacies.value = true
  try {
    const result = await clientsRegistryApi.list(pharmaEntry, {
      page: 1,
      limit: 100,
      search: pharmacySearch.value.trim() || undefined,
    })
    pharmacyOptions.value = result.rows.map((row) => ({
      id: row.id,
      name: String(row.operName ?? `Pharmacy #${row.id}`),
    }))
  } catch (e) {
    console.error('Load pharmacy options failed', e)
  } finally {
    loadingPharmacies.value = false
  }
}

async function loadForAdd() {
  error.value = null
  fieldErrors.value = {}
  loadingRecord.value = false
  pharmacySearch.value = ''
  form.value = emptyPharmacistForm()
  await loadPharmacyOptions()
}

async function loadPharmacist() {
  if (!props.pharmacistId) return
  loadingRecord.value = true
  error.value = null
  fieldErrors.value = {}
  pharmacySearch.value = ''
  form.value = emptyPharmacistForm()
  try {
    const row = await clientsRegistryApi.getById(props.entry, props.pharmacistId)
    form.value = pharmacistFormFromRow(row as Record<string, unknown>)
    await loadPharmacyOptions()
    if (form.value.pharmId) {
      ensurePharmacyOption(
        Number(form.value.pharmId),
        String(row.operName ?? `Pharmacy #${form.value.pharmId}`),
      )
    }
  } catch (e) {
    console.error('Load pharmacist failed', e)
    error.value = 'Failed to load pharmacist details.'
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

let pharmacySearchTimer: ReturnType<typeof setTimeout> | null = null
function onPharmacySearchInput() {
  if (pharmacySearchTimer) clearTimeout(pharmacySearchTimer)
  pharmacySearchTimer = setTimeout(() => {
    void loadPharmacyOptions()
  }, 300)
}

async function handleSubmit() {
  if (saving.value) return
  if (!validate()) return
  saving.value = true
  error.value = null
  try {
    let savedId: number
    const payload = pharmacistFormToPayload(form.value)
    if (isAddMode.value) {
      savedId = await clientsRegistryApi.create(props.entry, payload)
    } else if (props.pharmacistId) {
      savedId = props.pharmacistId
      await clientsRegistryApi.update(props.entry, props.pharmacistId, payload)
    } else {
      return
    }
    emit('saved', savedId)
    emit('close')
  } catch (e) {
    console.error('Save pharmacist failed', e)
    error.value = e instanceof Error ? e.message : 'Failed to save pharmacist.'
  } finally {
    saving.value = false
  }
}

function closeDialog() {
  if (saving.value) return
  emit('close')
}

watch(
  () => [props.open, props.pharmacistId] as const,
  ([open, id]) => {
    if (open && id) {
      void loadPharmacist()
    } else if (open && id === null) {
      void loadForAdd()
    } else if (!open) {
      form.value = emptyPharmacistForm()
      error.value = null
      fieldErrors.value = {}
      pharmacySearch.value = ''
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
      class="bg-white w-full sm:w-[40rem] sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col rounded-t-xl sm:rounded-lg shadow-xl overflow-hidden"
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

      <div class="relative flex-1 min-h-[22rem] overflow-y-auto">
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

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="sm:col-span-2">
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
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Reg #</label>
              <input
                v-model="form.reg_number"
                type="text"
                class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Pharmacy owned</label>
              <input
                v-model="form.pharm_owned"
                type="text"
                class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">Linked pharmacy</label>
            <input
              v-model="pharmacySearch"
              type="search"
              placeholder="Search pharmacies…"
              class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              @input="onPharmacySearchInput"
            />
            <select
              v-model="form.pharmId"
              class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
              :disabled="loadingPharmacies"
            >
              <option value="">No linked pharmacy</option>
              <option v-for="p in pharmacyOptions" :key="p.id" :value="String(p.id)">
                {{ p.name }} (#{{ p.id }})
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Workplace</label>
            <input
              v-model="form.workplace"
              type="text"
              class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Cell phone</label>
              <input
                v-model="form.cell_phone"
                type="text"
                class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
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

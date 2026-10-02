<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  createExternalContact,
  deactivateExternalContact,
  listExternalContacts,
  updateExternalContact,
  type ExternalContact,
  type ExternalContactKind,
} from '@/core/utils/external-contacts-api'

const activeTab = ref<ExternalContactKind>('contractors')
const rows = ref<ExternalContact[]>([])
const isLoading = ref(false)
const search = ref('')
const errorMessage = ref('')
const showForm = ref(false)
const editingId = ref<number | null>(null)

const form = ref({
  name: '',
  company: '',
  phone: '',
  email: '',
  tradeOrSpecialty: '',
  notes: '',
})

const pageTitle = computed(() =>
  activeTab.value === 'contractors' ? 'Contractors' : 'Inspectors',
)

async function loadRows() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    rows.value = await listExternalContacts(activeTab.value, {
      search: search.value,
      includeInactive: false,
    })
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Failed to load contacts'
    rows.value = []
  } finally {
    isLoading.value = false
  }
}

function openCreate() {
  editingId.value = null
  form.value = {
    name: '',
    company: '',
    phone: '',
    email: '',
    tradeOrSpecialty: '',
    notes: '',
  }
  showForm.value = true
}

function openEdit(row: ExternalContact) {
  editingId.value = row.id
  form.value = {
    name: row.name || '',
    company: row.company || '',
    phone: row.phone || '',
    email: row.email || '',
    tradeOrSpecialty: (activeTab.value === 'contractors' ? row.trade : row.specialty) || '',
    notes: row.notes || '',
  }
  showForm.value = true
}

async function saveContact() {
  const name = form.value.name.trim()
  if (!name) {
    errorMessage.value = 'Name is required'
    return
  }

  const payload = {
    name,
    company: form.value.company.trim() || null,
    phone: form.value.phone.trim() || null,
    email: form.value.email.trim() || null,
    notes: form.value.notes.trim() || null,
    ...(activeTab.value === 'contractors'
      ? { trade: form.value.tradeOrSpecialty.trim() || null }
      : { specialty: form.value.tradeOrSpecialty.trim() || null }),
  }

  try {
    if (editingId.value) {
      await updateExternalContact(activeTab.value, editingId.value, payload)
    } else {
      await createExternalContact(activeTab.value, payload)
    }
    showForm.value = false
    await loadRows()
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Failed to save contact'
  }
}

async function removeContact(row: ExternalContact) {
  if (!confirm(`Deactivate ${row.name}?`)) return
  try {
    await deactivateExternalContact(activeTab.value, row.id)
    await loadRows()
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Failed to deactivate contact'
  }
}

watch(activeTab, () => {
  showForm.value = false
  void loadRows()
})

let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    void loadRows()
  }, 300)
})

onMounted(() => {
  void loadRows()
})
</script>

<template>
  <div class="px-4 py-6 md:px-6 max-w-5xl mx-auto">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">External contacts</h1>
        <p class="text-sm text-gray-500 mt-1">
          Contractors and inspectors without login accounts. Assign them on tasks from the pickers.
        </p>
      </div>
      <button
        type="button"
        class="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
        @click="openCreate"
      >
        + Add {{ activeTab === 'contractors' ? 'contractor' : 'inspector' }}
      </button>
    </div>

    <div class="flex gap-2 mb-4">
      <button
        type="button"
        class="px-3 py-1.5 text-sm rounded-md border"
        :class="activeTab === 'contractors' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'"
        @click="activeTab = 'contractors'"
      >
        Contractors
      </button>
      <button
        type="button"
        class="px-3 py-1.5 text-sm rounded-md border"
        :class="activeTab === 'inspectors' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'"
        @click="activeTab = 'inspectors'"
      >
        Inspectors
      </button>
    </div>

    <div class="mb-4">
      <input
        v-model="search"
        type="search"
        :placeholder="`Search ${pageTitle.toLowerCase()}...`"
        class="w-full sm:w-80 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
      />
    </div>

    <p v-if="errorMessage" class="mb-3 text-sm text-red-600">{{ errorMessage }}</p>

    <div v-if="showForm" class="mb-4 bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <h2 class="text-sm font-medium text-gray-900">
        {{ editingId ? 'Edit' : 'New' }} {{ activeTab === 'contractors' ? 'contractor' : 'inspector' }}
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input v-model="form.name" type="text" placeholder="Name *" class="px-3 py-2 border border-gray-300 rounded-md text-sm" />
        <input v-model="form.company" type="text" placeholder="Company" class="px-3 py-2 border border-gray-300 rounded-md text-sm" />
        <input v-model="form.phone" type="text" placeholder="Phone" class="px-3 py-2 border border-gray-300 rounded-md text-sm" />
        <input v-model="form.email" type="email" placeholder="Email" class="px-3 py-2 border border-gray-300 rounded-md text-sm" />
        <input
          v-model="form.tradeOrSpecialty"
          type="text"
          :placeholder="activeTab === 'contractors' ? 'Trade' : 'Specialty'"
          class="px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
        <input v-model="form.notes" type="text" placeholder="Notes" class="px-3 py-2 border border-gray-300 rounded-md text-sm" />
      </div>
      <div class="flex gap-2">
        <button type="button" class="px-3 py-2 bg-blue-600 text-white rounded-md text-sm" @click="saveContact">Save</button>
        <button type="button" class="px-3 py-2 border border-gray-300 rounded-md text-sm" @click="showForm = false">Cancel</button>
      </div>
    </div>

    <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div v-if="isLoading" class="p-6 text-sm text-gray-500">Loading…</div>
      <div v-else-if="rows.length === 0" class="p-6 text-sm text-gray-500">No {{ pageTitle.toLowerCase() }} yet.</div>
      <table v-else class="min-w-full text-sm">
        <thead class="bg-gray-50 text-left text-gray-600">
          <tr>
            <th class="px-3 py-2 font-medium">Name</th>
            <th class="px-3 py-2 font-medium hidden sm:table-cell">Phone</th>
            <th class="px-3 py-2 font-medium hidden md:table-cell">Email</th>
            <th class="px-3 py-2 font-medium hidden lg:table-cell">
              {{ activeTab === 'contractors' ? 'Trade' : 'Specialty' }}
            </th>
            <th class="px-3 py-2 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id" class="border-t border-gray-100">
            <td class="px-3 py-2 text-gray-900">
              <div class="font-medium">{{ row.name }}</div>
              <div v-if="row.company" class="text-xs text-gray-500">{{ row.company }}</div>
            </td>
            <td class="px-3 py-2 text-gray-700 hidden sm:table-cell">{{ row.phone || '—' }}</td>
            <td class="px-3 py-2 text-gray-700 hidden md:table-cell">{{ row.email || '—' }}</td>
            <td class="px-3 py-2 text-gray-700 hidden lg:table-cell">
              {{ (activeTab === 'contractors' ? row.trade : row.specialty) || '—' }}
            </td>
            <td class="px-3 py-2 text-right whitespace-nowrap">
              <button type="button" class="text-blue-600 hover:underline mr-3" @click="openEdit(row)">Edit</button>
              <button type="button" class="text-red-600 hover:underline" @click="removeContact(row)">Deactivate</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

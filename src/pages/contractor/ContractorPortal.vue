<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/core/stores/auth'
import {
  fetchContractorWorkspace,
  type ContractorPortalWorkspace,
} from '@/core/utils/task-access-key-api'
import { api } from '@/core/utils/api'
import { getApiBaseUrl } from '@/config/api'

const router = useRouter()
const authStore = useAuthStore()

const isLoading = ref(true)
const errorMessage = ref('')
const workspace = ref<ContractorPortalWorkspace | null>(null)
const photoUrls = ref<Record<number, string>>({})

async function loadWorkspace() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    workspace.value = await fetchContractorWorkspace()
    await loadPhotoPreviews()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } }
    errorMessage.value = err.response?.data?.message || 'Failed to load task access'
  } finally {
    isLoading.value = false
  }
}

async function loadPhotoPreviews() {
  const photos = workspace.value?.field_photos || []
  const token = localStorage.getItem('authToken')
  const base = getApiBaseUrl().replace(/\/$/, '')
  for (const photo of photos) {
    try {
      const res = await api.get(`/api/v1/contractor-portal/field-photos/${photo.id}/download`, {
        responseType: 'blob',
      })
      photoUrls.value[photo.id] = URL.createObjectURL(res.data)
    } catch {
      // keep placeholder; allow download link with auth header via blob fallback
      photoUrls.value[photo.id] = ''
    }
  }
  void token
  void base
}

async function logout() {
  await authStore.logout()
  router.replace('/login')
}

onMounted(() => {
  void loadWorkspace()
})
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <header class="bg-emerald-800 text-white px-4 py-3 flex items-center justify-between">
      <div>
        <p class="text-xs uppercase tracking-wide text-emerald-100">Contractor access</p>
        <h1 class="text-lg font-semibold">{{ workspace?.task.name || 'Task' }}</h1>
      </div>
      <button
        type="button"
        class="px-3 py-1.5 text-sm rounded-md bg-emerald-700 hover:bg-emerald-600"
        @click="logout"
      >
        Sign out
      </button>
    </header>

    <main class="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div v-if="isLoading" class="text-sm text-gray-500">Loading…</div>
      <div v-else-if="errorMessage" class="p-3 bg-red-50 text-red-700 rounded-md text-sm">
        {{ errorMessage }}
      </div>
      <template v-else-if="workspace">
        <section class="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
          <p class="text-sm text-gray-500">{{ workspace.task.project_name }}</p>
          <h2 class="text-xl font-semibold text-gray-900">{{ workspace.task.name }}</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
            <p v-if="workspace.task.address"><span class="text-gray-500">Address:</span> {{ workspace.task.address }}</p>
            <p v-if="workspace.task.category"><span class="text-gray-500">Category:</span> {{ workspace.task.category }}</p>
            <p>
              <span class="text-gray-500">Dates:</span>
              {{ workspace.task.start_planned || '—' }}
              <span v-if="workspace.task.end_planned"> → {{ workspace.task.end_planned }}</span>
            </p>
            <p><span class="text-gray-500">Status:</span> {{ workspace.task.status || '—' }}</p>
          </div>
          <p v-if="workspace.task.notes" class="text-sm text-gray-700 whitespace-pre-wrap border-t border-gray-100 pt-3 mt-3">
            {{ workspace.task.notes }}
          </p>
          <p v-if="workspace.key_expires_at" class="text-xs text-amber-700 mt-2">
            Access key expires: {{ workspace.key_expires_at }}
          </p>
        </section>

        <section class="bg-white border border-gray-200 rounded-lg p-4">
          <h3 class="text-base font-medium text-gray-900 mb-3">Task materials (photos)</h3>
          <p v-if="workspace.field_photos.length === 0" class="text-sm text-gray-500">
            No field photos for this task yet.
          </p>
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <figure
              v-for="photo in workspace.field_photos"
              :key="photo.id"
              class="border border-gray-100 rounded-md overflow-hidden bg-gray-50"
            >
              <img
                v-if="photoUrls[photo.id]"
                :src="photoUrls[photo.id]"
                :alt="photo.original_name || 'Photo'"
                class="w-full h-48 object-cover"
              />
              <div v-else class="h-48 flex items-center justify-center text-xs text-gray-400">
                Preview unavailable
              </div>
              <figcaption class="px-2 py-1.5 text-xs text-gray-600">
                {{ photo.slot || 'photo' }}
                <span v-if="photo.work_date"> · {{ photo.work_date }}</span>
                <span v-if="photo.original_name"> · {{ photo.original_name }}</span>
              </figcaption>
            </figure>
          </div>
        </section>
      </template>
    </main>
  </div>
</template>

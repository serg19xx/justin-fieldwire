<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import api from '@/utils/api'

interface PendingCandidate {
  id: string
  firstName: string
  lastName: string
  email: string
  invitationToken: string
  invitedAt: string
  expiresAt: string
  reminderSent: boolean
  lastReminderSent?: string
  status: 'pending' | 'expired' | 'reminder_sent'
}

interface Props {
  isOpen: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'resend-invitation', candidateId: string): void
  (e: 'delete-invitation', candidateId: string): void
}

const { isOpen } = defineProps<Props>()
const emit = defineEmits<Emits>()

const candidates = ref<PendingCandidate[]>([])
const isLoading = ref(false)
const error = ref('')

// Mock data for testing - remove when API is ready
const mockCandidates: PendingCandidate[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    invitationToken: 'token123',
    invitedAt: '2024-01-15T10:00:00Z',
    expiresAt: '2024-01-16T10:00:00Z',
    reminderSent: false,
    status: 'pending',
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    invitationToken: 'token456',
    invitedAt: '2024-01-14T10:00:00Z',
    expiresAt: '2024-01-15T10:00:00Z',
    reminderSent: true,
    lastReminderSent: '2024-01-15T12:00:00Z',
    status: 'reminder_sent',
  },
  {
    id: '3',
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike.johnson@example.com',
    invitationToken: 'token789',
    invitedAt: '2024-01-13T10:00:00Z',
    expiresAt: '2024-01-14T10:00:00Z',
    reminderSent: false,
    status: 'expired',
  },
]

// Temporarily use mock data
candidates.value = mockCandidates

// Загрузка pending candidates
async function loadPendingCandidates() {
  isLoading.value = true
  error.value = ''

  try {
    const response = await api.get('/api/invitations/pending')
    candidates.value = response.data
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { message?: string } }; message?: string }
    error.value = axiosError.response?.data?.message || axiosError.message || 'Failed to load candidates'
  } finally {
    isLoading.value = false
  }
}

// Удаление приглашения
async function deleteInvitation(candidateId: string) {
  if (!confirm('Are you sure you want to delete this invitation?')) {
    return
  }

  try {
    await api.delete(`/api/invitations/${candidateId}`)
    await loadPendingCandidates() // Reload the list
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { message?: string } }; message?: string }
    error.value = axiosError.response?.data?.message || axiosError.message || 'Failed to delete invitation'
  }
}

// Форматирование даты
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function closeDialog() {
  emit('close')
}

// Загружаем данные при открытии
onMounted(() => {
  if (isOpen) {
    loadPendingCandidates()
  }
})

// Watch для загрузки при открытии
watch(
  () => isOpen,
  (newValue: boolean) => {
    if (newValue) {
      loadPendingCandidates()
    }
  },
)
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto" @click.self="closeDialog">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"></div>

    <!-- Dialog -->
    <div class="flex min-h-full items-center justify-center p-2 sm:p-4">
      <div
        class="relative bg-white rounded-lg shadow-xl w-full max-w-4xl mx-auto max-h-[95vh] sm:max-h-[90vh] overflow-hidden"
      >
        <!-- Header -->
        <div class="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-base sm:text-lg font-medium text-gray-900">Pending Invitations</h3>
              <p class="mt-1 text-xs sm:text-sm text-gray-500">
                {{ candidates.length }} invitation{{ candidates.length !== 1 ? 's' : '' }} pending
              </p>
            </div>
            <button @click="closeDialog" class="text-gray-400 hover:text-gray-600 p-1">
              <svg
                class="h-5 w-5 sm:h-6 sm:w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto">
          <div class="px-4 sm:px-6 py-3 sm:py-4">
            <!-- Loading State -->
            <div v-if="isLoading" class="flex items-center justify-center py-8">
              <svg
                class="animate-spin h-6 w-6 sm:h-8 sm:w-8 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="text-center py-6 sm:py-8">
              <div class="text-red-600 bg-red-50 p-3 sm:p-4 rounded-md text-xs sm:text-sm">
                {{ error }}
              </div>
              <button
                @click="loadPendingCandidates"
                class="mt-3 sm:mt-4 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs sm:text-sm"
              >
                Retry
              </button>
            </div>

            <!-- Content -->
            <div v-else>
              <!-- Single Table for All Candidates -->
              <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                    <thead class="bg-gray-50">
                      <tr>
                        <th
                          class="px-3 sm:px-6 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Status
                        </th>
                        <th
                          class="px-3 sm:px-6 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Name
                        </th>
                        <th
                          class="px-3 sm:px-6 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Email
                        </th>
                        <th
                          class="hidden sm:table-cell px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Invited
                        </th>
                        <th
                          class="px-3 sm:px-6 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                      <tr v-for="candidate in candidates" :key="candidate.id">
                        <!-- Status Column -->
                        <td class="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                          <div class="flex items-center">
                            <!-- Status Icon -->
                            <div class="flex-shrink-0">
                              <svg
                                v-if="candidate.status === 'pending'"
                                class="h-4 w-4 text-yellow-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fill-rule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                  clip-rule="evenodd"
                                />
                              </svg>
                              <svg
                                v-else-if="candidate.status === 'expired'"
                                class="h-4 w-4 text-red-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fill-rule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                  clip-rule="evenodd"
                                />
                              </svg>
                              <svg
                                v-else-if="candidate.status === 'reminder_sent'"
                                class="h-4 w-4 text-blue-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fill-rule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                  clip-rule="evenodd"
                                />
                              </svg>
                            </div>
                            <!-- Status Label -->
                            <div class="ml-2">
                              <span
                                :class="{
                                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800':
                                    candidate.status === 'pending',
                                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800':
                                    candidate.status === 'expired',
                                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800':
                                    candidate.status === 'reminder_sent',
                                }"
                              >
                                {{
                                  candidate.status === 'pending'
                                    ? 'Pending'
                                    : candidate.status === 'expired'
                                      ? 'Expired'
                                      : 'Reminder Sent'
                                }}
                              </span>
                            </div>
                          </div>
                        </td>

                        <!-- Name Column -->
                        <td class="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                          <div class="font-medium text-gray-900">
                            {{ candidate.firstName }} {{ candidate.lastName }}
                          </div>
                        </td>

                        <!-- Email Column -->
                        <td class="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-gray-500">
                          {{ candidate.email }}
                        </td>

                        <!-- Invited Column -->
                        <td class="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-gray-500">
                          {{ formatDate(candidate.invitedAt) }}
                        </td>

                        <!-- Actions Column -->
                        <td class="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            @click="deleteInvitation(candidate.id)"
                            class="text-red-600 hover:text-red-900 text-xs sm:text-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Empty State -->
              <div v-if="candidates.length === 0" class="text-center py-8">
                <svg
                  class="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  ></path>
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900">No pending invitations</h3>
                <p class="mt-1 text-sm text-gray-500">
                  All invitations have been processed or expired.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex justify-end">
          <button
            @click="closeDialog"
            class="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

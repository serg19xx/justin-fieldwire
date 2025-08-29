<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  isOpen: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'invite-sent', data: { email: string; firstName: string; lastName: string }): void
}

const { isOpen } = defineProps<Props>()
const emit = defineEmits<Emits>()

const email = ref('')
const firstName = ref('')
const lastName = ref('')
const isLoading = ref(false)
const error = ref('')

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

async function sendInvitation() {
  // Сброс ошибок
  error.value = ''

  // Валидация полей
  if (!firstName.value.trim()) {
    error.value = 'First name is required'
    return
  }

  if (!lastName.value.trim()) {
    error.value = 'Last name is required'
    return
  }

  if (!email.value.trim()) {
    error.value = 'Email is required'
    return
  }

  if (!validateEmail(email.value.trim())) {
    error.value = 'Please enter a valid email address'
    return
  }

  isLoading.value = true

  try {
    // Вызов бекенд API для отправки приглашения
    const response = await fetch('/api/invitations/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify({
        email: email.value.trim(),
        firstName: firstName.value.trim(),
        lastName: lastName.value.trim(),
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to send invitation')
    }

    // Успешная отправка
    emit('invite-sent', {
      email: email.value.trim(),
      firstName: firstName.value.trim(),
      lastName: lastName.value.trim(),
    })

    // Очистка формы
    email.value = ''
    firstName.value = ''
    lastName.value = ''
    emit('close')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to send invitation'
  } finally {
    isLoading.value = false
  }
}

function closeDialog() {
  if (!isLoading.value) {
    email.value = ''
    firstName.value = ''
    lastName.value = ''
    error.value = ''
    emit('close')
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto" @click.self="closeDialog">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"></div>

    <!-- Dialog -->
    <div class="flex min-h-full items-center justify-center p-2 sm:p-4">
      <div class="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
        <!-- Header -->
        <div class="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <h3 class="text-base sm:text-lg font-medium text-gray-900">Invite Builder</h3>
          <p class="mt-1 text-xs sm:text-sm text-gray-500">
            Send an invitation email to join the system
          </p>
        </div>

        <!-- Content -->
        <div class="px-4 sm:px-6 py-3 sm:py-4">
          <form @submit.prevent="sendInvitation">
            <div class="space-y-3 sm:space-y-4">
              <!-- First Name Input -->
              <div>
                <label
                  for="firstName"
                  class="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
                >
                  First Name *
                </label>
                <input
                  id="firstName"
                  v-model="firstName"
                  type="text"
                  placeholder="Enter first name"
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  :disabled="isLoading"
                  required
                />
              </div>

              <!-- Last Name Input -->
              <div>
                <label
                  for="lastName"
                  class="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
                >
                  Last Name *
                </label>
                <input
                  id="lastName"
                  v-model="lastName"
                  type="text"
                  placeholder="Enter last name"
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  :disabled="isLoading"
                  required
                />
              </div>

              <!-- Email Input -->
              <div>
                <label for="email" class="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  id="email"
                  v-model="email"
                  type="email"
                  placeholder="Enter email address"
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  :disabled="isLoading"
                  required
                />
              </div>

              <!-- Error Message -->
              <div
                v-if="error"
                class="text-xs sm:text-sm text-red-600 bg-red-50 p-2 sm:p-3 rounded-md"
              >
                {{ error }}
              </div>
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div
          class="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-row justify-end space-x-2 sm:space-x-3"
        >
          <button
            type="button"
            @click="closeDialog"
            class="flex-1 sm:flex-none px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            :disabled="isLoading"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="sendInvitation"
            class="flex-1 sm:flex-none px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isLoading || !email.trim() || !firstName.trim() || !lastName.trim()"
          >
            <span v-if="isLoading" class="flex items-center justify-center">
              <svg
                class="animate-spin -ml-1 mr-1 h-3 w-3 sm:h-4 sm:w-4 text-white"
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
              <span class="text-xs">Send</span>
            </span>
            <span v-else class="text-xs sm:text-sm">Send</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

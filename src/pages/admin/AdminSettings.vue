<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Main Content -->
    <div class="px-4 py-6 md:px-6">
      <div class="max-w-7xl mx-auto">
        <nav class="mb-4" aria-label="Back">
          <button
            type="button"
            class="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
            @click="goBack"
          >
            <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </nav>

        <!-- Tabs Navigation -->
        <div class="border-b border-gray-200 mb-8">
          <nav class="-mb-px flex space-x-8">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm',
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              ]"
            >
              <div class="flex items-center">
                <component :is="tab.icon" class="w-5 h-5 mr-2" />
                {{ tab.name }}
              </div>
            </button>
          </nav>
        </div>

        <!-- Tab Content -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <!-- Event Rules Tab -->
          <div v-if="activeTab === 'event-rules'">
            <EventRules />
          </div>

          <!-- Message Templates Tab -->
          <div v-if="activeTab === 'message-templates'">
            <MessageTemplates />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/core/stores/auth'
import EventRules from './components/EventRules.vue'
import MessageTemplates from './components/MessageTemplates.vue'

const router = useRouter()

function goBack(): void {
  if (window.history.length > 1) {
    router.back()
    return
  }
  router.push('/projects')
}

// Icons
const EventRulesIcon = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
    </svg>
  `,
}

const MessageTemplatesIcon = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
    </svg>
  `,
}

// Auth store
const authStore = useAuthStore()

// Tabs
const tabs = [
  {
    id: 'event-rules',
    name: 'Event Rules',
    icon: EventRulesIcon,
  },
  {
    id: 'message-templates',
    name: 'Message Templates',
    icon: MessageTemplatesIcon,
  },
]

const activeTab = ref('event-rules')

// Check if user is admin
onMounted(() => {
  console.log('🔍 Admin Settings page loaded')
  console.log('👤 Current user:', {
    id: authStore.currentUser?.id,
    email: authStore.currentUser?.email,
    job_title: authStore.currentUser?.job_title,
    role_category: authStore.currentUser?.role_category,
  })

  const roleCode = authStore.currentUser?.role_code
  if (roleCode !== 'admin' && roleCode !== 'project_manager') {
    console.warn('⚠️ Non-configurator user accessed admin settings', { roleCode })
  }
})

defineOptions({
  name: 'AdminSettings',
})
</script>

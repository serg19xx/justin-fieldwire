<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
      <div>
        <h1 v-if="title" class="text-xl font-semibold text-slate-900">{{ title }}</h1>
        <p v-if="subtitle" class="text-sm text-slate-500 mt-0.5">{{ subtitle }}</p>
        <p v-if="payload?.generated_at" class="text-xs text-slate-400 mt-1">
          Live snapshot · {{ formatGeneratedAt(payload.generated_at) }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <PageUserGuideLink href="/USER_GUIDE_DASHBOARD.html" />
        <button
          class="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
          :disabled="isLoading"
          @click="load"
        >
          <svg
            class="w-4 h-4"
            :class="{ 'animate-spin': isLoading }"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>
    </div>

    <div v-if="hasError" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-5">
      Failed to load dashboard.
      <button class="underline ml-1" @click="load">Retry</button>
    </div>

    <div v-if="isLoading && !payload" class="py-12 text-center text-slate-400 text-sm">Loading…</div>

    <template v-else-if="payload">
      <DashboardKpiTiles :kpis="payload.kpis" scope="field" class="mb-6" />

      <DashboardMessages :messages="payload.messages" class="mb-6" />

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardAlerts :alerts="payload.alerts" :show-project="true" />
        <DashboardActivityFeed :activity="payload.activity" :show-project="true" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { dashboardApi, type DashboardPayload } from '@/core/utils/dashboard-api'
import PageUserGuideLink from '@/components/PageUserGuideLink.vue'
import DashboardKpiTiles from './DashboardKpiTiles.vue'
import DashboardAlerts from './DashboardAlerts.vue'
import DashboardActivityFeed from './DashboardActivityFeed.vue'
import DashboardMessages from './DashboardMessages.vue'

defineOptions({ name: 'FieldDashboardView' })

defineProps<{
  title?: string
  subtitle?: string
}>()

const payload = ref<DashboardPayload | null>(null)
const isLoading = ref(false)
const hasError = ref(false)

async function load(): Promise<void> {
  isLoading.value = true
  hasError.value = false
  try {
    payload.value = await dashboardApi.getField()
  } catch {
    hasError.value = true
    payload.value = null
  } finally {
    isLoading.value = false
  }
}

function formatGeneratedAt(value: string): string {
  const parsed = new Date(value.replace(' ', 'T'))
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

onMounted(load)
</script>

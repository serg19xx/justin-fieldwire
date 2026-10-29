<template>
  <section class="rounded-xl border border-gray-200 bg-white">
    <div v-if="isLoading" class="p-8 text-center text-sm text-gray-500">Loading team…</div>

    <div v-else-if="loadError" class="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      {{ loadError }}
    </div>

    <p v-else-if="!contacts.length" class="p-6 text-center text-sm text-gray-500">No team members in this project yet.</p>

    <ul v-else class="divide-y divide-gray-100">
      <li v-for="contact in contacts" :key="contact.key" class="p-4">
        <p class="font-medium text-gray-900">{{ contact.name }}</p>
        <p v-if="contact.role" class="text-xs text-gray-500">{{ contact.role }}</p>
        <div class="mt-2 flex flex-wrap gap-2 text-sm">
          <a
            v-if="contact.phone"
            :href="`tel:${contact.phone}`"
            class="inline-flex items-center rounded-md border border-gray-200 px-2.5 py-1 text-orange-700 hover:bg-orange-50"
          >
            {{ contact.phone }}
          </a>
          <a
            v-if="contact.email"
            :href="`mailto:${contact.email}`"
            class="inline-flex max-w-full items-center truncate rounded-md border border-gray-200 px-2.5 py-1 text-orange-700 hover:bg-orange-50"
          >
            {{ contact.email }}
          </a>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { projectApi } from '@/core/utils/project-api'

interface TeamContact {
  key: string
  name: string
  role: string
  phone: string
  email: string
}

const props = defineProps<{ projectId: number }>()

const contacts = ref<TeamContact[]>([])
const isLoading = ref(false)
const loadError = ref('')

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function toContact(row: Record<string, unknown>): TeamContact | null {
  const name =
    text(row.full_name) || [text(row.first_name), text(row.last_name)].filter(Boolean).join(' ') || text(row.email)
  if (!name) return null
  const userId = Number(row.user_id ?? row.id)
  return {
    key: Number.isFinite(userId) && userId > 0 ? `u${userId}` : `e${text(row.email) || name}`,
    name,
    role: text(row.job_title) || text(row.role_name),
    phone: text(row.phone),
    email: text(row.email),
  }
}

/** A person can be on the team several times (once per task); show each person once. */
function uniqueContacts(rows: unknown[]): TeamContact[] {
  const byKey = new Map<string, TeamContact>()
  rows.forEach((row) => {
    if (!row || typeof row !== 'object') return
    const contact = toContact(row as Record<string, unknown>)
    if (contact && !byKey.has(contact.key)) byKey.set(contact.key, contact)
  })
  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name))
}

async function loadTeam(): Promise<void> {
  isLoading.value = true
  loadError.value = ''
  try {
    const response = await projectApi.getTeamMembers(props.projectId)
    const rows = response?.data?.team_members
    contacts.value = uniqueContacts(Array.isArray(rows) ? rows : [])
  } catch {
    contacts.value = []
    loadError.value = 'Could not load the project team.'
  } finally {
    isLoading.value = false
  }
}

watch(() => props.projectId, loadTeam, { immediate: true })
</script>

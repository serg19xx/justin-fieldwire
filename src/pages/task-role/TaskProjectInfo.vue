<template>
  <div class="mx-auto px-4 py-4" :class="section === 'plans' ? 'max-w-5xl' : 'max-w-lg'">
    <nav class="mb-4">
      <RouterLink
        :to="`/tasks/projects/${projectId}`"
        class="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        {{ projectName }}
      </RouterLink>
    </nav>

    <div class="mb-4 flex rounded-lg border border-gray-200 bg-gray-50 p-1" role="tablist" aria-label="Project information">
      <RouterLink
        v-for="link in PROJECT_INFO_SECTIONS"
        :key="link.section"
        :to="`/tasks/projects/${projectId}/info/${link.section}`"
        role="tab"
        :aria-selected="section === link.section"
        class="flex-1 rounded-md px-1 py-2 text-center text-sm font-medium transition-colors"
        :class="section === link.section ? 'bg-white text-orange-700 shadow-sm' : 'text-gray-600'"
      >
        {{ link.label }}
      </RouterLink>
    </div>

    <p class="mb-3 text-xs text-gray-500">View only. Ask the project manager to change anything here.</p>

    <PlansSection v-if="section === 'plans'" :project="{ id: projectId }" :read-only="true" />
    <ProjectReportsSection v-else-if="section === 'reports'" :project-id="projectId" />
    <ProjectTeamContacts v-else :project-id="projectId" />
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import ProjectTeamContacts from '@/components/task-role/ProjectTeamContacts.vue'
import { projectApi } from '@/core/utils/project-api'
import { PROJECT_INFO_SECTIONS, isProjectInfoSection, type ProjectInfoSection } from '@/core/utils/task-project-info'

const PlansSection = defineAsyncComponent(() => import('@/pages/projects/PlansSection.vue'))
const ProjectReportsSection = defineAsyncComponent(() => import('@/pages/projects/ProjectReportsSection.vue'))

const route = useRoute()

const projectId = computed(() => Number(route.params.projectId))
const section = computed<ProjectInfoSection>(() =>
  isProjectInfoSection(route.params.section) ? route.params.section : 'plans',
)
const projectName = ref('Project')

onMounted(async () => {
  try {
    const project = await projectApi.getById(projectId.value)
    projectName.value = project?.prj_name ?? `Project #${projectId.value}`
  } catch {
    projectName.value = `Project #${projectId.value}`
  }
})
</script>

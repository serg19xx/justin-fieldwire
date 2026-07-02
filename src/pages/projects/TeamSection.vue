<template>
  <WorkerTeamList
    embedded
    add-worker-mode="emit"
    :project-id="projectId"
    :project-name="projectName"
    :project-tasks="projectTasks"
    :project-hint="projectHint"
    :can-add-worker="canAddWorker"
    :refresh-key="refreshKey"
    @add-team-member="emit('addTeamMember')"
  />
</template>

<script setup lang="ts">
import WorkerTeamList from '@/components/team/WorkerTeamList.vue'
import type { Task } from '@/core/types/task'
import type { AssignmentProjectHint } from '@/core/utils/worker-assignments'

defineOptions({
  name: 'TeamSection',
})

withDefaults(
  defineProps<{
    projectId: number
    projectName?: string
    projectTasks?: Task[]
    projectHint?: AssignmentProjectHint | null
    canAddWorker?: boolean
    refreshKey?: number
  }>(),
  {
    projectName: '',
    projectTasks: () => [],
    projectHint: null,
    canAddWorker: false,
    refreshKey: 0,
  },
)

const emit = defineEmits<{
  addTeamMember: []
}>()
</script>

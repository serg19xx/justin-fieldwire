<script setup lang="ts">
import UserCalendar from '@/components/calendar/UserCalendar.vue'

defineProps<{
  projectId: number
  projectAddress?: string | null
}>()
</script>

<template>
  <UserCalendar mode="project" :project-id="projectId" :project-address="projectAddress" />
</template>

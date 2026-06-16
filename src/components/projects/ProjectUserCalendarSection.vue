<script setup lang="ts">
import UserCalendar from '@/components/calendar/UserCalendar.vue'

defineProps<{
  projectId: number
}>()
</script>

<template>
  <UserCalendar mode="project" :project-id="projectId" />
</template>

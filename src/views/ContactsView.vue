<script setup lang="ts">
// This view serves as a parent container for all contacts pages
// Child routes will be displayed via router-view
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Router view for child routes -->
    <router-view />
  </div>
</template>

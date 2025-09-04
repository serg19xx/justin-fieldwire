<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header with command panel -->
    <div class="bg-white shadow-sm border-b">
      <div class="px-4 py-4 sm:px-6 lg:px-8">
        <slot name="header">
          <!-- Default header content -->
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">
                <slot name="title">Contacts</slot>
              </h1>
            </div>
          </div>
        </slot>
      </div>
    </div>

    <!-- Main content area -->
    <div class="flex-1 p-4 sm:p-6 lg:p-8">
      <slot name="content">
        <!-- Main content will go here -->
        <div class="text-center text-gray-500 py-12">Content slot is empty</div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
// This component provides a consistent layout for all contacts pages
// with slots for header, content, and footer sections
</script>

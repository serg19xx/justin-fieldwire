<template>
  <div class="project-projects">
    <div class="bg-green-600 text-white p-6 rounded-lg mb-6">
      <h1 class="text-3xl font-bold">My Projects</h1>
      <p class="text-green-100">Project Management, в которых вы участвуете</p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-4">Active Projects</h3>
        <p class="text-gray-600">List of active projects</p>
        <button class="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Просмотреть
        </button>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-4">Create Project</h3>
        <p class="text-gray-600">Create a new project</p>
        <button class="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Создать
        </button>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-4">Project Archive</h3>
        <p class="text-gray-600">Completed projects</p>
        <button class="mt-4 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
          Открыть архив
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Project Projects view
</script>

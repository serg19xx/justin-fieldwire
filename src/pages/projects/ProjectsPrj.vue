<template>
  <div class="px-4 py-6 md:px-6" style="padding-bottom: 0;">
      <!-- Search and Filters -->
      <div class="bg-white shadow rounded-lg p-2 sm:p-3" style="margin-bottom: 0.5rem;">
        <div class="flex flex-col sm:flex-row gap-4">
          <!-- Search -->
          <div class="flex-1">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search projects..."
              class="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <!-- Create Project Button (hidden for admins) -->
          <div class="flex items-center gap-2" v-if="!isAdminUser">
            <button
              @click="createProject"
              class="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2 h-7"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              Create Project
            </button>
          </div>

          <!-- Filters -->
          <div class="flex gap-2">
            <!-- Status Filter -->
            <div class="relative">
              <select
                v-model="statusFilter"
                class="px-2 py-1 pr-6 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-700 appearance-none cursor-pointer"
              >
                <option value="" class="text-gray-500">All Statuses</option>
                <option value="Initial Contact Lead" class="text-gray-700">Initial Contact Lead</option>
                <option value="Dead Lead" class="text-gray-700">Dead Lead</option>
                <option value="Waiting On Direction" class="text-gray-700">Waiting On Direction</option>
                <option value="Actively Looking For A Location" class="text-gray-700">Actively Looking For A Location</option>
                <option value="Securing Location" class="text-gray-700">Securing Location</option>
                <option value="Project Secured" class="text-gray-700">Project Secured</option>
                <option value="Construction" class="text-gray-700">Construction</option>
                <option value="Completed Project" class="text-gray-700">Completed Project</option>
              </select>
              <!-- Dropdown Arrow -->
              <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>

            <!-- Sort Dropdown -->
            <div class="relative">
              <select
                v-model="sortBy"
                class="px-2 py-1 pr-6 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-700 appearance-none cursor-pointer"
              >
                <option value="" class="text-gray-500">Sort by...</option>
                <option value="name-asc" class="text-gray-700">↑ Project Name (A-Z)</option>
                <option value="name-desc" class="text-gray-700">↓ Project Name (Z-A)</option>
                <option value="client-asc" class="text-gray-700">↑ Client (A-Z)</option>
                <option value="client-desc" class="text-gray-700">↓ Client (Z-A)</option>
                <option value="status-asc" class="text-gray-700">↑ Status (A-Z)</option>
                <option value="status-desc" class="text-gray-700">↓ Status (Z-A)</option>
                <option value="progress-asc" class="text-gray-700">↑ Progress (0-100%)</option>
                <option value="progress-desc" class="text-gray-700">↓ Progress (100-0%)</option>
              </select>
              <!-- Dropdown Arrow -->
              <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="bg-white shadow rounded-lg p-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-2 text-gray-600">Loading projects...</p>
      </div>

      <!-- Pagination Top -->
      <div v-if="!loading" class="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-200 sm:px-6">
        <div class="flex-1 flex justify-between sm:hidden">
          <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage <= 1"
            class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage >= totalPages"
            class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div class="flex items-center space-x-4">
            <p class="text-sm text-gray-700">
              Showing
              <span class="font-medium">{{ startIndex + 1 }}</span>
              to
              <span class="font-medium">{{ endIndex }}</span>
              of
              <span class="font-medium">{{ totalItems }}</span>
              results
            </p>
            <div class="flex items-center space-x-2">
              <label for="page-size-top" class="text-sm text-gray-700">Show:</label>
              <select
                id="page-size-top"
                v-model="itemsPerPage"
                @change="changePageSize(itemsPerPage)"
                class="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
              </select>
            </div>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                @click="goToPage(currentPage - 1)"
                :disabled="currentPage <= 1"
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="sr-only">Previous</span>
                <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </button>
              <button
                v-for="page in totalPages"
                :key="page"
                @click="goToPage(page)"
                :class="[
                  'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                  page === currentPage
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                ]"
              >
                {{ page }}
              </button>
              <button
                @click="goToPage(currentPage + 1)"
                :disabled="currentPage >= totalPages"
                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="sr-only">Next</span>
                <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>

      <!-- Projects Table -->
      <div v-if="!loading" class="bg-white shadow rounded-lg overflow-hidden" style="margin-bottom: 0; margin-top: 0;">
        <div class="w-full overflow-hidden">
          <table class="w-full table-fixed divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[11%] min-w-0">
                  Project
                </th>
                <th class="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[11%] min-w-0">
                  Client
                </th>
                <th class="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[9%] min-w-0">
                  Sec. Client
                </th>
                <th class="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[14%] min-w-0">
                  Description
                </th>
                <th class="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[14%] min-w-0">
                  Note
                </th>
                <th class="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[9%] min-w-0">
                  Status
                </th>
                <th class="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[9%] min-w-0">
                  Lifecycle
                </th>
                <th class="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[8%] min-w-0">
                  Progress
                </th>
                <th class="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[11%] min-w-0">
                  Address
                </th>
                <th class="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[8%] min-w-0">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="project in displayedProjects" :key="project.id" class="hover:bg-gray-50">
                <!-- PROJECT Column -->
                <td class="px-2 py-4 text-sm min-w-0 overflow-hidden">
                  <div class="truncate" :title="project.prj_name">
                    <div class="font-medium text-gray-900 truncate">{{ project.prj_name }}</div>
                    <div class="text-gray-500 text-xs truncate">
                      {{ project.date_start ? formatDate(project.date_start) : '—' }} - {{ project.date_end ? formatDate(project.date_end) : '—' }}
                    </div>
                  </div>
                </td>
                <!-- CLIENT Column (clickable for contact details) -->
                <td class="px-2 py-4 text-sm min-w-0 overflow-hidden">
                  <template v-if="(project as any).client_name || ((project as ApiProject).client_data as Record<string, unknown>)?.name">
                    <button
                      type="button"
                      @click="openClientContact(project)"
                      class="text-left truncate block max-w-full font-medium text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
                    >
                      {{ (project as any).client_name || ((project as ApiProject).client_data as Record<string, unknown>)?.name as string }}
                    </button>
                  </template>
                  <template v-else-if="(project as ApiProject).client_type">
                    <button
                      v-if="(project as ApiProject).client_id"
                      type="button"
                      @click="openClientContact(project)"
                      class="text-left truncate block max-w-full font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {{ (project as ApiProject).client_type }}
                    </button>
                    <span v-else class="text-gray-500">{{ (project as ApiProject).client_type }}</span>
                  </template>
                  <template v-else-if="(project as ApiProject).client_id">
                    <button
                      type="button"
                      @click="openClientContact(project)"
                      class="text-left text-xs text-blue-600 hover:underline"
                    >
                      ID: {{ (project as ApiProject).client_id }}
                    </button>
                  </template>
                  <template v-else>
                    <span class="text-gray-400">-</span>
                  </template>
                </td>
                <!-- SECONDARY CLIENT Column -->
                <td class="px-2 py-4 text-sm min-w-0 overflow-hidden">
                  <template v-if="(project as any).client2_name || ((project as any).client2_data as Record<string, unknown>)?.name">
                    <button
                      type="button"
                      @click="openClient2Contact(project)"
                      class="text-left truncate block max-w-full font-medium text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
                    >
                      {{ (project as any).client2_name || ((project as any).client2_data as Record<string, unknown>)?.name as string || '—' }}
                    </button>
                  </template>
                  <template v-else-if="(project as any).client2_id">
                    <button
                      type="button"
                      @click="openClient2Contact(project)"
                      class="text-left text-xs text-blue-600 hover:underline"
                    >
                      ID: {{ (project as any).client2_id }}
                    </button>
                  </template>
                  <template v-else>
                    <span class="text-gray-400">—</span>
                  </template>
                </td>
                <!-- DESCRIPTION Column -->
                <td class="px-2 py-4 text-sm text-gray-900 min-w-0 overflow-hidden">
                  <div class="flex items-center gap-1 min-w-0">
                    <span class="truncate min-w-0 flex-1" :title="(project as ApiProject).description || ''">
                      {{ (project as ApiProject).description || '—' }}
                    </span>
                    <button
                      type="button"
                      @click="openDescriptionDetail(project)"
                      class="flex-shrink-0 p-1 text-green-600 hover:text-green-700 rounded hover:bg-green-50"
                      title="View Description"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </td>
                <!-- NOTE Column (from notes table), same presentation as Description -->
                <td class="px-2 py-4 text-sm text-gray-900 min-w-0 overflow-hidden">
                  <div class="flex items-center gap-1 min-w-0">
                    <span class="truncate min-w-0 flex-1" :title="getProjectNote(project) || ''">
                      {{ getProjectNote(project) || '—' }}
                    </span>
                    <button
                      type="button"
                      @click="openNoteDetail(project)"
                      class="flex-shrink-0 p-1 text-green-600 hover:text-green-700 rounded hover:bg-green-50"
                      title="View Note"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </td>
                <td class="px-2 py-4 whitespace-nowrap text-xs min-w-0 overflow-hidden">
                  <span
                    :class="getStatusClass(project.status)"
                    class="px-2 py-1 font-medium rounded-full inline-block truncate max-w-full"
                    :title="getStatusDisplay(project.status)"
                  >
                    {{ getStatusDisplay(project.status) }}
                  </span>
                </td>
                <td class="px-2 py-4 whitespace-nowrap text-xs min-w-0 overflow-hidden">
                  <span
                    :class="getSysStatusClass(resolvedSysStatus(project))"
                    class="px-2 py-1 font-medium rounded-full inline-block truncate max-w-full"
                    :title="sysStatusTitle(project)"
                  >
                    {{ sysStatusLabel(project) }}
                  </span>
                </td>
                <td class="px-2 py-4 whitespace-nowrap min-w-0 overflow-hidden">
                  <div class="flex items-center min-w-0">
                    <div class="w-10 flex-shrink-0 bg-gray-200 rounded-full h-2 mr-1.5">
                      <div
                        class="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style="width: 0%"
                      ></div>
                    </div>
                    <span class="text-sm text-gray-900">0%</span>
                  </div>
                </td>
                <!-- ADDRESS Column -->
                <td class="px-2 py-4 text-sm text-gray-900 min-w-0 overflow-hidden truncate" :title="project.address || ''">
                  {{ project.address || '—' }}
                </td>
                <td class="px-2 py-4 whitespace-nowrap text-sm font-medium min-w-0 overflow-hidden">
                  <div class="flex items-center gap-0.5">
                    <button
                      v-if="canEditProject(project)"
                      type="button"
                      @click="editProject(project.id)"
                      class="p-1.5 text-blue-600 hover:text-blue-700 rounded hover:bg-blue-50"
                      title="Edit"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      v-if="canEditProject(project)"
                      type="button"
                      @click="confirmDeleteProject(project)"
                      class="p-1.5 text-red-600 hover:text-red-700 rounded hover:bg-red-50"
                      title="Delete"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <button
                      v-else
                      type="button"
                      @click="viewProject(project.id)"
                      class="p-1.5 text-green-600 hover:text-green-700 rounded hover:bg-green-50"
                      title="Details"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination Bottom -->
      <div v-if="!loading" class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div class="flex-1 flex justify-between sm:hidden">
          <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage <= 1"
            class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage >= totalPages"
            class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div class="flex items-center space-x-4">
            <p class="text-sm text-gray-700">
              Showing
              <span class="font-medium">{{ startIndex + 1 }}</span>
              to
              <span class="font-medium">{{ endIndex }}</span>
              of
              <span class="font-medium">{{ totalItems }}</span>
              results
            </p>
            <div class="flex items-center space-x-2">
              <label for="page-size" class="text-sm text-gray-700">Show:</label>
              <select
                id="page-size"
                v-model="itemsPerPage"
                @change="changePageSize(itemsPerPage)"
                class="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
              </select>
            </div>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                @click="goToPage(currentPage - 1)"
                :disabled="currentPage <= 1"
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="sr-only">Previous</span>
                <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </button>
              <button
                v-for="page in totalPages"
                :key="page"
                @click="goToPage(page)"
                :class="[
                  'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                  page === currentPage
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                ]"
              >
                {{ page }}
              </button>
              <button
                @click="goToPage(currentPage + 1)"
                :disabled="currentPage >= totalPages"
                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="sr-only">Next</span>
                <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="displayedProjects.length === 0" class="text-center py-8" style="padding-bottom: 0; margin-bottom: 0;">
        <svg
          class="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          ></path>
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
        <p class="mt-1 text-sm text-gray-500">Get started by creating a new project.</p>
      </div>

      <!-- Project Dialog -->
      <ProjectDialog
        :is-open="showCreateDialog"
        @close="showCreateDialog = false"
        @created="handleProjectCreated"
      />

      <!-- Client Contact Details Modal -->
      <div
        v-if="clientContactModal.isOpen"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        @click.self="clientContactModal.isOpen = false"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Client Contact Details</h3>
            <button
              type="button"
              @click="clientContactModal.isOpen = false"
              class="text-gray-400 hover:text-gray-600"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div v-if="!clientContactModal.clientData && !clientContactModal.clientName" class="text-gray-500">No client data.</div>
          <div v-else class="space-y-3 text-sm">
            <p v-if="clientContactModal.clientName"><span class="font-medium text-gray-700">Name:</span> {{ clientContactModal.clientName }}</p>
            <template v-if="clientContactModal.clientData && typeof clientContactModal.clientData === 'object'">
              <p v-for="(val, key) in clientContactModal.clientData" :key="String(key)" v-show="val != null && val !== '' && key !== 'name'">
                <span class="font-medium text-gray-700">{{ formatClientDataKey(key) }}:</span> {{ formatClientDataValue(val) }}
              </p>
            </template>
          </div>
        </div>
      </div>

      <!-- Description detail modal (read-only) -->
      <div
        v-if="descriptionDetailModal.isOpen"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        @click.self="descriptionDetailModal.isOpen = false"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Description</h3>
            <button
              type="button"
              @click="descriptionDetailModal.isOpen = false"
              class="text-gray-400 hover:text-gray-600"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="overflow-y-auto flex-1 min-h-0">
            <div class="text-sm text-gray-900 bg-gray-50 rounded-md p-3 whitespace-pre-wrap break-words border border-gray-200">
              {{ descriptionDetailModal.text || '—' }}
            </div>
          </div>
          <div class="mt-4 flex justify-end">
            <button
              type="button"
              @click="descriptionDetailModal.isOpen = false"
              class="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <!-- Note detail modal (read-only) -->
      <div
        v-if="noteDetailModal.isOpen"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        @click.self="noteDetailModal.isOpen = false"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Note</h3>
            <button
              type="button"
              @click="noteDetailModal.isOpen = false"
              class="text-gray-400 hover:text-gray-600"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="overflow-y-auto flex-1 min-h-0">
            <div class="text-sm text-gray-900 bg-gray-50 rounded-md p-3 whitespace-pre-wrap break-words border border-gray-200">
              {{ noteDetailModal.text || '—' }}
            </div>
          </div>
          <div class="mt-4 flex justify-end">
            <button
              type="button"
              @click="noteDetailModal.isOpen = false"
              class="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/core/stores/auth'
import { projectApi, type Project as ApiProject } from '@/core/utils/project-api'
import {
  PROJECT_SYS_STATUS_LABELS,
  resolveProjectSysStatus,
  type ProjectSysStatus,
} from '@/core/utils/project-sys-status'
import ProjectDialog from './ProjectDialog.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Robust admin detection
const isAdminUser = computed(() => {
  const u = authStore.currentUser
  if (!u) return false
  const roleId = typeof u.role_id === 'string' ? Number(u.role_id) : u.role_id
  return roleId === 9 || u.role_code === 'admin' || u.job_title === 'System Administrator'
})

// Reactive data
const projects = ref<ApiProject[]>([])
const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const sortBy = ref('')
const showCreateDialog = ref(false)

const clientContactModal = ref({
  isOpen: false,
  clientData: null as Record<string, unknown> | null,
  clientName: '',
})
const descriptionDetailModal = ref({
  isOpen: false,
  text: '',
})
const noteDetailModal = ref({
  isOpen: false,
  text: '',
})
// Removed managers ref - now using prj_manager_name from API

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(10)
const pageSizeOptions = [10, 25, 50, 100]

// Server pagination metadata (when provided by API)
const serverTotalItems = ref<number | null>(null)
const serverTotalPages = ref<number | null>(null)

// Computed properties
const filteredProjects = computed(() => {
  let filtered = projects.value

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (project) =>
        project.prj_name.toLowerCase().includes(query) ||
        project.address.toLowerCase().includes(query),
    )
  }

  // Filter by status
  if (statusFilter.value) {
    filtered = filtered.filter((project) => project.status === statusFilter.value)
  }

  // Apply sorting (placeholder - logic to be implemented later)
  if (sortBy.value) {
    // TODO: Implement sorting logic when needed
  }

  return filtered
})

// Pagination computed properties
const useServerPaging = computed(() => authStore.currentUser?.role_code === 'admin')

const totalItems = computed(() =>
  useServerPaging.value && serverTotalItems.value != null
    ? serverTotalItems.value
    : filteredProjects.value.length,
)

const totalPages = computed(() =>
  useServerPaging.value && serverTotalPages.value != null
    ? serverTotalPages.value
    : Math.ceil(totalItems.value / itemsPerPage.value),
)
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value)
const endIndex = computed(() => Math.min(startIndex.value + itemsPerPage.value, totalItems.value))

const displayedProjects = computed(() => {
  if (useServerPaging.value) {
    // Server already returns the page slice
    return projects.value
  }
  return filteredProjects.value.slice(startIndex.value, endIndex.value)
})

// Methods
function getStatusClass(status: string) {
  if (!status) return 'bg-gray-100 text-gray-800'
  const s = status.toLowerCase()
  switch (s) {
    case 'initial contact lead':
      return 'bg-slate-100 text-slate-800'
    case 'dead lead':
      return 'bg-red-100 text-red-800'
    case 'waiting on direction':
      return 'bg-amber-100 text-amber-800'
    case 'actively looking for a location':
      return 'bg-blue-100 text-blue-800'
    case 'securing location':
      return 'bg-cyan-100 text-cyan-800'
    case 'project secured':
      return 'bg-emerald-100 text-emerald-800'
    case 'construction':
      return 'bg-green-100 text-green-800'
    case 'completed project':
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getStatusDisplay(status: string) {
  return status || '—'
}

function resolvedSysStatus(project: ApiProject): ProjectSysStatus {
  return resolveProjectSysStatus({ sys_status: project.sys_status ?? null })
}

function sysStatusLabel(project: ApiProject): string {
  return PROJECT_SYS_STATUS_LABELS[resolvedSysStatus(project)]
}

function sysStatusTitle(project: ApiProject): string {
  const code = resolvedSysStatus(project)
  const label = PROJECT_SYS_STATUS_LABELS[code]
  const stored = project.sys_status != null && String(project.sys_status).trim() !== ''
  if (stored) {
    return `${label} (sys_status: ${String(project.sys_status).trim()})`
  }
  return `${label} (no sys_status — treated as draft)`
}

function getSysStatusClass(code: ProjectSysStatus): string {
  switch (code) {
    case 'draft':
      return 'bg-slate-100 text-slate-800'
    case 'active':
      return 'bg-emerald-100 text-emerald-800'
    case 'closing':
      return 'bg-amber-100 text-amber-800'
    case 'suspended':
      return 'bg-orange-100 text-orange-800'
    case 'done':
      return 'bg-violet-100 text-violet-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Removed getManagerName and loadManagers functions - now using prj_manager_name from API

function parseSort(sortValue: string): { sort_by?: string; sort_order?: 'asc' | 'desc' } {
  if (!sortValue) return {}
  const [field, order] = sortValue.split('-')
  const sortByMap: Record<string, string> = {
    name: 'prj_name',
    client: 'address',
    status: 'status',
    progress: 'progress',
  }
  const sort_by = sortByMap[field] || field
  const sort_order = order === 'desc' ? 'desc' : 'asc'
  return { sort_by, sort_order }
}

async function loadProjects() {
  loading.value = true
  // Prepare filters based on user role (defined outside try-catch for error handling)
  const filters: Record<string, unknown> = {}
  
  try {
    // Project managers can only see their own projects
    if (authStore.currentUser?.role_code === 'project_manager') {
      filters.prj_manager = authStore.currentUser.id
    } else if (authStore.currentUser?.role_code === 'admin') {
      // Administrators: server-side pagination, filtering, sorting
      if (searchQuery.value) filters.search = searchQuery.value
      if (statusFilter.value) filters.status = statusFilter.value
      const sortParams = parseSort(sortBy.value)
      Object.assign(filters, sortParams)
    }

    const page = useServerPaging.value ? currentPage.value : 1
    const limit = useServerPaging.value ? itemsPerPage.value : 100

    const response = await projectApi.getAll(page, limit, filters)
    const rawProjects = Array.isArray(response)
      ? response
      : (response.projects ?? response.data ?? [])
    
    // Map and parse projects, especially client_data JSON field
    projects.value = rawProjects.map((apiProject: ApiProject) => {
      let parsedClientData = apiProject.client_data
      
      // Parse client_data if it's a string
      if (typeof apiProject.client_data === 'string' && (apiProject.client_data as string).trim()) {
        try {
          parsedClientData = JSON.parse(apiProject.client_data)
        } catch (e) {
          console.warn('⚠️ Failed to parse client_data for project', apiProject.id, ':', e)
          parsedClientData = null
        }
      }
      
      // Try to extract client_name from various possible locations
      let clientName: string | null = null
      
      // First, check if client_name is directly in the API response
      const apiProjectAny = apiProject as unknown as Record<string, unknown>
      if (apiProjectAny.client_name && typeof apiProjectAny.client_name === 'string') {
        clientName = apiProjectAny.client_name
      }
      // If not, try to get it from client_data.name
      else if (parsedClientData && typeof parsedClientData === 'object' && parsedClientData !== null) {
        const clientData = parsedClientData as Record<string, unknown>
        if (clientData.name && typeof clientData.name === 'string') {
          clientName = clientData.name
        }
      }
      
      // Parse client2_data if string
      let parsedClient2Data: Record<string, unknown> | null = null
      const rawClient2 = apiProjectAny.client2_data
      if (typeof rawClient2 === 'string' && (rawClient2 as string).trim()) {
        try {
          parsedClient2Data = JSON.parse(rawClient2 as string) as Record<string, unknown>
        } catch {
          parsedClient2Data = null
        }
      } else if (rawClient2 && typeof rawClient2 === 'object') {
        parsedClient2Data = rawClient2 as Record<string, unknown>
      }
      const client2Name =
        (apiProjectAny.client2_name && typeof apiProjectAny.client2_name === 'string'
          ? apiProjectAny.client2_name
          : null) ||
        (parsedClient2Data?.name && typeof parsedClient2Data.name === 'string' ? parsedClient2Data.name : null)

      const mappedProject = {
        ...apiProject,
        client_data: parsedClientData,
        client_name: clientName,
        client2_data: parsedClient2Data,
        client2_name: client2Name,
      } as ApiProject & { client_name?: string | null; client2_data?: Record<string, unknown> | null; client2_name?: string | null }

      return mappedProject
    })

    // Capture server pagination if provided
    const envelope = Array.isArray(response) ? null : response
    const p = (envelope?.pagination || envelope?.meta || null) as
      | { total?: number; last_page?: number; current_page?: number }
      | null
    serverTotalItems.value =
      typeof envelope?.total === 'number' ? envelope.total : p?.total ?? null
    serverTotalPages.value =
      typeof envelope?.last_page === 'number' ? envelope.last_page : p?.last_page ?? null
  } catch (error: unknown) {
    console.error('❌ Error loading projects:', error)
    const axiosError = error as { response?: { status?: number; data?: { message?: string }; statusText?: string } }
    if (axiosError.response) {
      console.error('📊 Error details:', {
        status: axiosError.response.status,
        statusText: axiosError.response.statusText,
        message: axiosError.response.data?.message,
        url: '/api/v1/projects',
        filters: filters,
      })
      if (axiosError.response.status === 500) {
        console.error('⚠️ Server error (500). This might be due to missing fields in the database or backend issues.')
        console.error('💡 Check backend logs for more details.')
      }
    }
    projects.value = []
    serverTotalItems.value = null
    serverTotalPages.value = null
  } finally {
    loading.value = false
  }
}

function viewProject(projectId: number) {
  const target = isAdminUser.value
    ? `/projects/${projectId}/admin`
    : `/projects/${projectId}/detail`
  router.push(target)
}

function editProject(projectId: number) {
  viewProject(projectId)
}

async function confirmDeleteProject(project: ApiProject) {
  if (!confirm(`Delete project "${project.prj_name}"? This cannot be undone.`)) return
  try {
    await projectApi.delete(project.id)
    await loadProjects()
  } catch (err) {
    console.error('Failed to delete project:', err)
    alert('Failed to delete project. Please try again.')
  }
}

function createProject() {
  showCreateDialog.value = true
}

function handleProjectCreated(project: ApiProject) {
  // Reload projects to show the new one
  void project // Suppress unused parameter warning
  loadProjects()
  showCreateDialog.value = false
}

// Check if user can edit a specific project
function canEditProject(project: ApiProject): boolean {
  if (!authStore.currentUser) return false

  // Project managers can only edit their own projects
  if (authStore.currentUser.role_code === 'project_manager') {
    return project.prj_manager === authStore.currentUser.id
  }

  // Administrators have read-only access to all projects
  if (authStore.currentUser.role_code === 'admin') {
    return false // Admins can view but not edit
  }

  return false
}

function formatClientDataKey(key: string): string {
  const labels: Record<string, string> = {
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    company: 'Company',
    address: 'Address',
    first_name: 'First Name',
    last_name: 'Last Name',
  }
  return labels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatClientDataValue(val: unknown): string {
  if (val == null) return '—'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

function openClientContact(project: ApiProject) {
  let data: Record<string, unknown> | null = null
  if (project.client_data && typeof project.client_data === 'object' && project.client_data !== null) {
    data = project.client_data as Record<string, unknown>
  } else if (typeof project.client_data === 'string' && (project.client_data as string).trim()) {
    try {
      data = JSON.parse(project.client_data as string) as Record<string, unknown>
    } catch {
      data = null
    }
  }
  const name = (data?.name as string) || (project as ApiProject & { client_name?: string })?.client_name || ''
  clientContactModal.value.clientData = data
  clientContactModal.value.clientName = typeof name === 'string' ? name : ''
  clientContactModal.value.isOpen = true
}

function openClient2Contact(project: ApiProject & { client2_data?: Record<string, unknown> | null; client2_name?: string | null }) {
  let data: Record<string, unknown> | null = null
  if (project.client2_data && typeof project.client2_data === 'object' && project.client2_data !== null) {
    data = project.client2_data
  } else if (typeof (project as unknown as Record<string, unknown>).client2_data === 'string') {
    try {
      data = JSON.parse((project as unknown as { client2_data: string }).client2_data) as Record<string, unknown>
    } catch {
      data = null
    }
  }
  const name = (data?.name as string) || project.client2_name || ''
  clientContactModal.value.clientData = data
  clientContactModal.value.clientName = typeof name === 'string' ? name : ''
  clientContactModal.value.isOpen = true
}

function openDescriptionDetail(project: ApiProject) {
  descriptionDetailModal.value.text = project.description ?? ''
  descriptionDetailModal.value.isOpen = true
}

function openNoteDetail(project: ApiProject) {
  const p = project as ApiProject & { note?: string | null }
  noteDetailModal.value.text = p.note ?? p.notes ?? ''
  noteDetailModal.value.isOpen = true
}

/** Note from notes table; fallback to project.notes if API does not return note */
function getProjectNote(project: ApiProject): string {
  const p = project as ApiProject & { note?: string | null }
  return p.note ?? p.notes ?? ''
}

// Pagination functions
function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

function changePageSize(newSize: number) {
  itemsPerPage.value = newSize
  currentPage.value = 1 // Reset to first page when changing page size
}

// Lifecycle
// Sync query params (admin only)
onMounted(() => {
  if (useServerPaging.value) {
    const q = route.query
    currentPage.value = q.page ? Number(q.page) || 1 : 1
    itemsPerPage.value = q.limit ? Number(q.limit) || 10 : 10
  }
  loadProjects()
})

// Update data when paging/filtering changes (admin)
watch([currentPage, itemsPerPage], () => {
  if (useServerPaging.value) {
    router.replace({ query: { ...route.query, page: String(currentPage.value), limit: String(itemsPerPage.value) } })
    loadProjects()
  }
})

// Debounce search
let searchTimeout: number | undefined
watch([searchQuery, statusFilter, sortBy], () => {
  if (useServerPaging.value) {
    window.clearTimeout(searchTimeout)
    searchTimeout = window.setTimeout(() => {
      currentPage.value = 1
      loadProjects()
    }, 300)
  }
})

defineOptions({
  name: 'ProjectsPage',
})
</script>

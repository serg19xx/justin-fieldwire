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
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48"
                >
                  Project
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48"
                >
                  Client
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40"
                >
                  Secondary Client
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64"
                >
                  Description
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32"
                >
                  Project Status
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32"
                >
                  Progress
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48"
                >
                  Address
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="project in displayedProjects" :key="project.id" class="hover:bg-gray-50">
                <!-- PROJECT Column -->
                <td class="px-4 py-4 whitespace-nowrap w-48">
                  <div>
                    <div class="text-sm font-medium text-gray-900">{{ project.prj_name }}</div>
                    <div class="text-sm text-gray-500">
                      {{ project.date_start ? formatDate(project.date_start) : '—' }} - {{ project.date_end ? formatDate(project.date_end) : '—' }}
                    </div>
                  </div>
                </td>
                <!-- CLIENT Column (clickable for contact details) -->
                <td class="px-4 py-4 text-sm w-48">
                  <template v-if="(project as any).client_name || ((project as ApiProject).client_data as Record<string, unknown>)?.name">
                    <button
                      type="button"
                      @click="openClientContact(project)"
                      class="text-left max-w-xs truncate font-medium text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
                    >
                      {{ (project as any).client_name || ((project as ApiProject).client_data as Record<string, unknown>)?.name as string }}
                    </button>
                  </template>
                  <template v-else-if="(project as ApiProject).client_type">
                    <button
                      v-if="(project as ApiProject).client_id"
                      type="button"
                      @click="openClientContact(project)"
                      class="text-left max-w-xs truncate font-medium text-blue-600 hover:text-blue-800 hover:underline"
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
                <td class="px-4 py-4 text-sm w-40">
                  <template v-if="(project as any).client2_name || ((project as any).client2_data as Record<string, unknown>)?.name">
                    <button
                      type="button"
                      @click="openClient2Contact(project)"
                      class="text-left max-w-xs truncate font-medium text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
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
                <td class="px-4 py-4 text-sm text-gray-900 w-64">
                  <div class="flex items-center gap-1">
                    <span class="max-w-xs truncate flex-1" :title="(project as ApiProject).description || ''">
                      {{ (project as ApiProject).description || '-' }}
                    </span>
                    <button
                      type="button"
                      @click="openNotesPopup(project)"
                      class="flex-shrink-0 p-1 text-gray-500 hover:text-blue-600 rounded"
                      title="Notes"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap w-32">
                  <span
                    :class="getStatusClass(project.status)"
                    class="px-2 py-1 text-xs font-medium rounded-full"
                  >
                    {{ getStatusDisplay(project.status) }}
                  </span>
                </td>
                <td class="px-4 py-4 whitespace-nowrap w-32">
                  <div class="flex items-center">
                    <div class="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        class="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style="width: 0%"
                      ></div>
                    </div>
                    <span class="text-sm text-gray-900">0%</span>
                  </div>
                </td>
                <!-- ADDRESS Column -->
                <td class="px-4 py-4 text-sm text-gray-900 w-48 max-w-xs truncate" :title="project.address || ''">
                  {{ project.address || '—' }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm font-medium w-32">
                  <div class="flex space-x-2">
                    <button
                      @click="viewProject(project.id)"
                      class="text-blue-600 hover:text-blue-900"
                    >
                      Details
                    </button>
                    <!-- Only show edit button if user has edit permissions -->
                    <button
                      v-if="canEditProject(project)"
                      @click="editProject(project.id)"
                      class="text-gray-600 hover:text-gray-900"
                    >
                      Edit
                    </button>
                    <!-- Show read-only indicator for administrators viewing other projects -->
                    <span
                      v-else-if="authStore.currentUser?.role_code === 'admin'"
                      class="text-gray-400 text-xs"
                    >
                      Read-only
                    </span>
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

      <!-- Notes Popup (editable) -->
      <div
        v-if="notesModal.isOpen"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        @click.self="notesModal.isOpen = false"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Project Notes</h3>
            <button
              type="button"
              @click="notesModal.isOpen = false"
              class="text-gray-400 hover:text-gray-600"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <textarea
            v-model="notesModal.text"
            rows="6"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="Add notes..."
          />
          <div class="mt-4 flex justify-end gap-2">
            <button
              type="button"
              @click="notesModal.isOpen = false"
              class="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              @click="saveNotes"
              class="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              Save
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
const notesModal = ref({
  isOpen: false,
  projectId: null as number | null,
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
    // Expecting { projects, pagination? }
    const rawProjects = response.projects || response.data || []
    
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
    const p = (response.pagination || response.meta || null) as
      | { total?: number; last_page?: number; current_page?: number }
      | null
    serverTotalItems.value = typeof response.total === 'number' ? response.total : p?.total ?? null
    serverTotalPages.value = typeof response.last_page === 'number' ? response.last_page : p?.last_page ?? null
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
  // TODO: Implement edit functionality
  void projectId // Suppress unused parameter warning
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

function openNotesPopup(project: ApiProject) {
  notesModal.value.projectId = project.id
  notesModal.value.text = project.notes || ''
  notesModal.value.isOpen = true
}

async function saveNotes() {
  const id = notesModal.value.projectId
  if (id == null) return
  try {
    await projectApi.update(id, { notes: notesModal.value.text || null })
    const idx = projects.value.findIndex((p) => p.id === id)
    if (idx !== -1) {
      (projects.value[idx] as ApiProject & { notes?: string | null }).notes = notesModal.value.text || null
    }
    notesModal.value.isOpen = false
  } catch (err) {
    console.error('Failed to save notes:', err)
  }
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

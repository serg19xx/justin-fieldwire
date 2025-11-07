<template>
  <div v-if="isOpen" class="absolute inset-0 bg-white z-50 flex flex-col">
    <!-- Header - Simplified (controls moved to ProjectDetailPrj header) -->
    <div class="border-b border-gray-200 bg-gray-50" style="height: 1px"></div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-6">
      <div class="max-w-5xl mx-auto">
        <!-- Basic Information Section -->
        <section class="mb-8">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Basic Information</h3>
          </div>
          <form @submit.prevent="handleBasicInfoSave">
            <div class="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
              <!-- Task Name -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2"> Task Name * </label>
                <input
                  v-model="form.name"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Enter task name"
                />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- WBS Path -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    WBS Path <span class="text-gray-400">(optional)</span>
                  </label>
                  <input
                    v-model="form.wbs_path"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="e.g., 1.1.1"
                  />
                </div>

                <!-- Foreman / Brigadier -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Foreman / Brigadier <span class="text-gray-400">(optional)</span>
                  </label>
                  <select
                    v-model="form.project_lead"
                    :disabled="(mode === 'create' || mode === 'edit') ? (isProjectManager && (typeof form.milestone === 'string' || form.milestone === true)) : true"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 text-gray-900"
                    :class="{ 'text-gray-500': !form.project_lead }"
                  >
                    <option :value="null" class="text-gray-500">Select foreman/brigadier</option>
                    <option :value="0" class="text-gray-500" style="display: none">Empty</option>
                    <option v-for="person in availablePeople" :key="person.id" :value="person.id" class="text-gray-900">
                      {{ person.name }} ({{ person.role }})
                    </option>
                  </select>
                  <p class="mt-1 text-xs text-gray-500">Select a foreman or brigadier responsible for this task</p>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <!-- Start Date -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2"> Start Date * </label>
                  <input
                    v-model="form.start_planned"
                    type="date"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>

                <!-- End Date -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2"> End Date * </label>
                  <input
                    v-model="form.end_planned"
                    type="date"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>

                <!-- Duration -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Duration (days)
                  </label>
                  <input
                    v-model.number="form.duration_days"
                    type="number"
                    min="1"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Status -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    v-model="form.status"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="planned">Planned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                    <option value="blocked">Blocked</option>
                    <option value="delayed">Delayed</option>
                  </select>
                </div>

                <!-- Progress -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Progress ({{ form.progress_pct }}%)
                  </label>
                  <input
                    v-model.number="form.progress_pct"
                    type="range"
                    min="0"
                    max="100"
                    class="w-full"
                  />
                </div>
              </div>

              <!-- Milestone -->
              <div class="flex items-center">
                <input
                  v-model="form.milestone"
                  type="checkbox"
                  id="milestone"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label for="milestone" class="ml-2 block text-sm text-gray-900">
                  This is a milestone
                </label>
              </div>

              <!-- Notes -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Notes <span class="text-gray-400">(optional)</span>
                </label>
                <textarea
                  v-model="form.notes"
                  rows="4"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Add any additional notes or description..."
                ></textarea>
              </div>

              <!-- Save Button for Basic Info -->
              <div class="flex justify-end pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  {{ mode === 'create' ? 'Create Task' : 'Save Changes' }}
                </button>
              </div>
            </div>
          </form>
        </section>

        <!-- Tab Bar Section -->
        <section class="mb-8">
          <!-- Tab Navigation -->
          <div class="border-b border-gray-200 mb-6">
            <nav class="flex -mb-px space-x-8">
              <button
                @click="activeTab = 'dependencies'"
                :class="[
                  'pb-4 px-1 border-b-2 font-medium text-sm transition-colors',
                  activeTab === 'dependencies'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                ]"
              >
                <div class="flex items-center space-x-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    ></path>
                  </svg>
                  <span>Dependencies</span>
                  <span
                    v-if="form.dependencies.length > 0"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {{ form.dependencies.length }}
                  </span>
                </div>
              </button>

              <button
                @click="activeTab = 'resources'"
                :class="[
                  'pb-4 px-1 border-b-2 font-medium text-sm transition-colors',
                  activeTab === 'resources'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                ]"
              >
                <div class="flex items-center space-x-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    ></path>
                  </svg>
                  <span>Resources</span>
                  <span
                    v-if="form.resources.length > 0"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  >
                    {{ form.resources.length }}
                  </span>
                </div>
              </button>

              <button
                @click="activeTab = 'team'"
                :class="[
                  'pb-4 px-1 border-b-2 font-medium text-sm transition-colors',
                  activeTab === 'team'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                ]"
              >
                <div class="flex items-center space-x-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    ></path>
                  </svg>
                  <span>Team Members</span>
                  <span
                    v-if="form.team_members.length > 0"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                  >
                    {{ form.team_members.length }}
                  </span>
                </div>
              </button>
            </nav>
          </div>

          <!-- Tab Content -->
          <div class="bg-white rounded-lg border border-gray-200">
            <!-- Dependencies Tab -->
            <div v-if="activeTab === 'dependencies'" class="p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-base font-medium text-gray-900">Task Dependencies</h3>
                <button
                  @click="openDependencyDialog"
                  class="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  + Add Dependency
                </button>
              </div>
              <div v-if="form.dependencies.length === 0" class="text-center py-12 text-gray-500">
                <svg
                  class="mx-auto h-12 w-12 text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  ></path>
                </svg>
                <p>No dependencies added yet.</p>
                <p class="text-sm mt-1">Click "Add Dependency" to create one.</p>
              </div>
              <div v-else class="space-y-3">
                <div
                  v-for="(dep, index) in form.dependencies"
                  :key="index"
                  class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <div class="flex-1">
                    <div class="flex items-center space-x-3">
                      <svg
                        class="w-5 h-5 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        ></path>
                      </svg>
                      <div>
                        <p class="text-sm font-medium text-gray-900">
                          {{ getDependencyTaskName(dep.taskId) }}
                        </p>
                        <p class="text-xs text-gray-500">
                          {{ formatDependencyType(dep.type) }}
                          <span v-if="dep.lagDays"> · Lag: {{ dep.lagDays }} days</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    @click="removeDependency(index)"
                    class="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Remove dependency"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      ></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Resources Tab -->
            <div v-else-if="activeTab === 'resources'" class="p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-base font-medium text-gray-900">Assigned Resources</h3>
                <button
                  @click="openResourceDialog"
                  class="px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  + Add Resource
                </button>
              </div>
              <div v-if="form.resources.length === 0" class="text-center py-12 text-gray-500">
                <svg
                  class="mx-auto h-12 w-12 text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  ></path>
                </svg>
                <p>No resources assigned yet.</p>
                <p class="text-sm mt-1">Click "Add Resource" to assign one.</p>
              </div>
              <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  v-for="(resource, index) in form.resources"
                  :key="index"
                  class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-green-300 transition-colors"
                >
                  <div class="flex items-center space-x-3">
                    <svg
                      class="w-5 h-5 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      ></path>
                    </svg>
                    <span class="text-sm font-medium text-gray-900">{{ resource }}</span>
                  </div>
                  <button
                    @click="removeResource(index)"
                    class="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Remove resource"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Team Members Tab -->
            <div v-else-if="activeTab === 'team'" class="p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-base font-medium text-gray-900">Assigned Team Members</h3>
                <button
                  @click="openTeamMemberDialog"
                  class="px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  + Add Team Member
                </button>
              </div>
              <div v-if="form.team_members.length === 0" class="text-center py-12 text-gray-500">
                <svg
                  class="mx-auto h-12 w-12 text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  ></path>
                </svg>
                <p>No team members assigned yet.</p>
                <p class="text-sm mt-1">Click "Add Team Member" to assign one.</p>
              </div>
              <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  v-for="(memberId, index) in form.team_members"
                  :key="index"
                  class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors"
                >
                  <div class="flex items-center space-x-3">
                    <div
                      class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center"
                    >
                      <span class="text-sm font-medium text-purple-600">
                        {{ getTeamMemberInitials(memberId) }}
                      </span>
                    </div>
                    <div>
                      <p class="text-sm font-medium text-gray-900">
                        {{ getTeamMemberName(memberId) }}
                      </p>
                      <p class="text-xs text-gray-500">{{ getTeamMemberRole(memberId) }}</p>
                    </div>
                  </div>
                  <button
                    @click="removeTeamMember(index)"
                    class="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Remove team member"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Invited People Section (for milestones only) -->
              <div v-if="isMilestone(form.milestone)" class="mt-8 pt-8 border-t border-gray-200">
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <h3 class="text-base font-medium text-gray-900">Invited People</h3>
                    <p class="text-xs text-gray-500 mt-1">External people invited to this milestone (informational)</p>
                  </div>
                  <button
                    @click="openInvitedPersonDialog"
                    class="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    + Add Invited Person
                  </button>
                </div>
                <div v-if="invitedPeople.length === 0" class="text-center py-8 text-gray-500">
                  <svg
                    class="mx-auto h-10 w-10 text-gray-400 mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    ></path>
                  </svg>
                  <p class="text-sm">No invited people yet.</p>
                  <p class="text-xs mt-1">Click "Add Invited Person" to add external invitees.</p>
                </div>
                <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    v-for="invited in invitedPeople"
                    :key="invited.id"
                    class="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors"
                  >
                    <div class="flex items-center space-x-3 flex-1 min-w-0">
                      <div
                        class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0"
                      >
                        <span v-if="getInvitedAvatar(invited)" class="w-10 h-10 rounded-full overflow-hidden">
                          <img :src="getInvitedAvatar(invited)" :alt="getInvitedName(invited)" class="w-full h-full object-cover" />
                        </span>
                        <span v-else class="text-sm font-medium text-blue-600">
                          {{ getInvitedPersonInitials(getInvitedName(invited)) }}
                        </span>
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900 truncate">{{ getInvitedName(invited) }}</p>
                        <p v-if="getInvitedEmail(invited)" class="text-xs text-gray-500 truncate">{{ getInvitedEmail(invited) }}</p>
                        <p v-if="getInvitedCompany(invited)" class="text-xs text-gray-400 truncate">{{ getInvitedCompany(invited) }}</p>
                      </div>
                    </div>
                    <button
                      @click="removeInvitedPerson(invited.id)"
                      class="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors flex-shrink-0"
                      title="Remove invited person"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M6 18L18 6M6 6l12 12"
                        ></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- Dependency Dialog -->
    <DependencyDialog
      v-if="showDependencyDialog"
      :is-open="showDependencyDialog"
      :available-tasks="availableTasks"
      :current-task-id="task?.id ? String(task.id) : ''"
      :existing-dependencies="form.dependencies"
      @close="showDependencyDialog = false"
      @add="addDependency"
    />

    <!-- Resource Dialog -->
    <ResourceSelectorDialog
      v-if="showResourceDialog"
      :is-open="showResourceDialog"
      @close="showResourceDialog = false"
      @add="addResource"
    />

    <!-- Team Member Dialog -->
    <TeamMemberDialog
      v-if="showTeamMemberDialog"
      :is-open="showTeamMemberDialog"
      :available-people="availablePeople"
      @close="showTeamMemberDialog = false"
      @add="addTeamMember"
    />

    <!-- Invited Person Dialog -->
    <div
      v-if="showInvitedPersonDialog"
      class="fixed inset-0 z-50 overflow-y-auto"
      @click.self="showInvitedPersonDialog = false"
    >
      <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" @click="showInvitedPersonDialog = false"></div>
        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Add Invited Person</h3>
            <form @submit.prevent="handleAddInvitedPerson" class="space-y-4">
              <div>
                <label for="invited-name" class="block text-sm font-medium text-gray-700">Name *</label>
                <input
                  id="invited-name"
                  v-model="invitedPersonForm.name"
                  type="text"
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label for="invited-email" class="block text-sm font-medium text-gray-700">Email</label>
                <input
                  id="invited-email"
                  v-model="invitedPersonForm.email"
                  type="email"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label for="invited-company" class="block text-sm font-medium text-gray-700">Company</label>
                <input
                  id="invited-company"
                  v-model="invitedPersonForm.company"
                  type="text"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Company Name"
                />
              </div>
              <div>
                <label for="invited-phone" class="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  id="invited-phone"
                  v-model="invitedPersonForm.phone"
                  type="tel"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <label for="invited-notes" class="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  id="invited-notes"
                  v-model="invitedPersonForm.notes"
                  rows="3"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Additional information..."
                ></textarea>
              </div>
              <div class="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  @click="showInvitedPersonDialog = false"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add Person
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
import { isMilestone } from '@/core/types/task'
import type { Task, TaskStatus, MilestoneType, TaskCreateUpdate } from '@/core/types/task'
import type { ProjectTeamMember } from '@/core/utils/project-api'
import type { WorkerUser } from '@/core/utils/hr-api'
import DependencyDialog from './DependencyDialog.vue'
import ResourceSelectorDialog from './ResourceSelectorDialog.vue'
import TeamMemberDialog from './TeamMemberDialog.vue'
import { createDependency, getTaskDependencies } from '@/core/utils/dependencies-api'
import { useAuthStore } from '@/core/stores/auth'
import { projectApi } from '@/core/utils/project-api'
import { tasksApi } from '@/core/utils/tasks-api'

// Props
interface Props {
  isOpen: boolean
  mode: 'create' | 'edit'
  task?: Task | null
  projectId: number
  availableTasks?: Task[]
  canManageProject?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  mode: 'create',
  task: null,
  availableTasks: () => [],
  canManageProject: true,
})

// Emits
const emit = defineEmits<{
  close: []
  save: [task: Partial<Task>]
  delete: [taskId: string]
  duplicate: [task: Task]
}>()

// State
const form = ref({
  name: '',
  wbs_path: '',
  start_planned: '',
  end_planned: '',
  duration_days: 1,
  milestone: false as boolean | MilestoneType,
  milestone_type: undefined as MilestoneType | undefined,
  status: 'planned' as TaskStatus,
  progress_pct: 0,
  notes: '',
  dependencies: [] as Array<{ taskId: string; type: string; lagDays: number }>,
  resources: [] as string[],
  project_lead: null as number | null,
  team_members: [] as number[],
})

const showDependencyDialog = ref(false)
const showResourceDialog = ref(false)
const showTeamMemberDialog = ref(false)
const showInvitedPersonDialog = ref(false)

const invitedPersonForm = ref({
  name: '',
  email: '',
  company: '',
  phone: '',
  notes: '',
  avatar: '',
})

// Invited people loaded from API
const invitedPeople = ref<ProjectTeamMember[]>([])

// Active tab for secondary sections
const activeTab = ref<'dependencies' | 'resources' | 'team'>('dependencies')

// Auth store
const authStore = useAuthStore()

// Check if user is project manager
const isProjectManager = computed(() => {
  return authStore.currentUser?.role_code === 'project_manager'
})

// Available data
// Available data for dropdowns - loaded from API
const availablePeople = ref<Array<{ id: number; name: string; role: string }>>([])

// Cache for team members that might not be in availablePeople (e.g., removed from project)
// This ensures we can still display their information even if they're not in the project team
const teamMemberCache = ref<Map<number, { id: number; name: string; role: string }>>(new Map())

// Flag to prevent duplicate API calls
const isLoadingAvailablePeople = ref(false)
const lastLoadParams = ref<{ taskId?: string; startDate?: string; endDate?: string } | null>(null)

// Helper function to ensure project_lead is in availablePeople list
async function ensureProjectLeadInList(leadId: number | null) {
  if (leadId === null || leadId === undefined) return

  const existingIndex = availablePeople.value.findIndex(p => p.id === leadId)

  if (existingIndex >= 0) {
    // Already in list, check if it's a placeholder and needs update
    const existing = availablePeople.value[existingIndex]
    if (existing.name.startsWith('User #')) {
      // It's a placeholder, try to load real data
      await loadAndUpdateUserData(leadId, existingIndex)
    }
    return
  }

  // Double-check that user is not already in list (might have been added while we were loading)
  const doubleCheckIndex = availablePeople.value.findIndex(p => p.id === leadId)
  if (doubleCheckIndex >= 0) {
    console.log('⏸️ User already in list, skipping add:', leadId)
    return
  }

  // Not in list, try to load from cache first
  const cached = teamMemberCache.value.get(leadId)
  if (cached) {
    // Check again before adding
    if (!availablePeople.value.some(p => p.id === leadId)) {
      availablePeople.value.push(cached)
      console.log('✅ Added project_lead to availablePeople from cache:', leadId)
    }
    return
  }

  // If not in cache, load from API BEFORE adding to list (to avoid placeholder flash)
  try {
    console.log('👤 Loading project_lead user data from API:', leadId)

    // Try to load from project team members first (might be in project but not in system workers)
    if (props.projectId) {
      try {
        const teamResponse = await projectApi.getTeamMembers(props.projectId)
        const apiTeamMembers = teamResponse.data?.team_members || teamResponse.team_members || []
        const member = apiTeamMembers.find((m: ProjectTeamMember & { team_member_id?: number; full_name?: string; first_name?: string; last_name?: string; role_name?: string; role_code?: string; project_role?: string; role?: { name?: string | null; code?: string | null } }) => (m.id || m.user_id || m.team_member_id) === leadId)

        if (member) {
          const { getDisplayRole } = await import('@/core/utils/role-utils')
          const userData = {
            id: leadId,
            name: member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.name || 'Unknown',
            role: getDisplayRole({
              role_name: member.role_name,
              role_code: member.role_code,
              project_role: member.project_role,
              role: typeof member.role === 'object' && member.role ? { name: member.role.name || undefined, code: member.role.code || undefined } : undefined,
            }),
          }
          // Add to cache
          teamMemberCache.value.set(leadId, userData)
          // Check again before adding (might have been added from available workers)
          if (!availablePeople.value.some(p => p.id === leadId)) {
            availablePeople.value.push(userData)
            console.log('✅ Loaded and added project_lead from project team:', userData)
          } else {
            console.log('⏸️ User already in list, skipping add from project team:', leadId)
          }
          return
        }
      } catch (error) {
        console.warn('⚠️ Error loading from project team members:', error)
      }
    }

    // Try to load from system workers
    const { hrResourcesApi } = await import('@/core/utils/hr-api')
    const response = await hrResourcesApi.getAllWorkerUsers(1, 1000, {
      status: '1',
      invitation_status: 'registered',
    })

    if ('workers' in response && Array.isArray(response.workers)) {
      const worker = response.workers.find((w: WorkerUser) => w.id === leadId)
      if (worker) {
        const { getDisplayRole } = await import('@/core/utils/role-utils')
        const userData = {
          id: leadId,
          name: `${worker.first_name || ''} ${worker.last_name || ''}`.trim() || worker.name || 'Unknown',
          role: getDisplayRole({
            role_name: worker.role_name,
            role_code: worker.role_code,
            role: typeof worker.role === 'object' && worker.role ? { name: worker.role.name || undefined, code: worker.role.code || undefined } : undefined,
          }),
        }
        // Add to cache
        teamMemberCache.value.set(leadId, userData)
        // Check again before adding
        if (!availablePeople.value.some(p => p.id === leadId)) {
          availablePeople.value.push(userData)
          console.log('✅ Loaded and added project_lead from system workers:', userData)
        } else {
          console.log('⏸️ User already in list, skipping add from system workers:', leadId)
        }
        return
      }
    }
  } catch (error) {
    console.error('❌ Error loading project_lead user data:', error)
  }

  // Only add placeholder as last resort if API load failed
  // Check again before adding placeholder
  if (!availablePeople.value.some(p => p.id === leadId)) {
    const placeholder = {
      id: leadId,
      name: `User #${leadId}`,
      role: 'Worker',
    }
    availablePeople.value.push(placeholder)
    console.log('⚠️ Added project_lead placeholder (API load failed or user not found):', leadId)
  } else {
    console.log('⏸️ User already in list, skipping placeholder:', leadId)
  }

  // Try to load real data in background and update placeholder
  loadAndUpdateUserData(leadId, availablePeople.value.length - 1)
}

// Helper function to load user data and update existing entry in availablePeople
async function loadAndUpdateUserData(userId: number, index: number) {
  try {
    console.log('🔍 Loading user data for ID:', userId, 'at index:', index)

    // Try to load from project team members first (might be in project but not in system workers)
    if (props.projectId) {
      try {
        const response = await projectApi.getTeamMembers(props.projectId)
        const apiTeamMembers = response.data?.team_members || response.team_members || []
        const member = apiTeamMembers.find((m: ProjectTeamMember & { team_member_id?: number; full_name?: string; first_name?: string; last_name?: string; role_name?: string; role_code?: string; project_role?: string; role?: { name?: string | null; code?: string | null } }) => (m.id || m.user_id || m.team_member_id) === userId)

        if (member) {
          const { getDisplayRole: getDisplayRoleForUpdate } = await import('@/core/utils/role-utils')
          const userData = {
            id: userId,
            name: member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.name || 'Unknown',
              role: getDisplayRoleForUpdate({
                role_name: member.role_name,
                role_code: member.role_code,
                project_role: member.project_role,
                role: typeof member.role === 'object' && member.role ? { name: member.role.name || undefined, code: member.role.code || undefined } : undefined,
              }),
          }
          // Update cache
          teamMemberCache.value.set(userId, userData)
          // Update existing entry in availablePeople (replace placeholder)
          if (index >= 0 && index < availablePeople.value.length && availablePeople.value[index].id === userId) {
            availablePeople.value[index] = userData
            console.log('✅ Updated project_lead placeholder with real data from project team:', userData)
            return
          }
        }
      } catch (error) {
        console.warn('⚠️ Error loading from project team members:', error)
      }
    }

    // Try to load from system workers
    const { hrResourcesApi } = await import('@/core/utils/hr-api')
    const response = await hrResourcesApi.getAllWorkerUsers(1, 1000, {
      status: '1',
      invitation_status: 'registered',
    })

    console.log('🔍 System workers response:', {
      hasWorkers: 'workers' in response,
      workersCount: 'workers' in response ? response.workers.length : 0,
      userIds: 'workers' in response ? response.workers.map((w: WorkerUser) => w.id) : [],
    })

    if ('workers' in response && Array.isArray(response.workers)) {
      const worker = response.workers.find((w: WorkerUser) => w.id === userId)
      if (worker) {
        const { getDisplayRole } = await import('@/core/utils/role-utils')
        const userData = {
          id: userId,
          name: `${worker.first_name || ''} ${worker.last_name || ''}`.trim() || worker.name || 'Unknown',
          role: getDisplayRole({
            role_name: worker.role_name,
            role_code: worker.role_code,
            role: typeof worker.role === 'object' && worker.role ? { name: worker.role.name || undefined, code: worker.role.code || undefined } : undefined,
          }),
        }
        // Update cache
        teamMemberCache.value.set(userId, userData)
        // Update existing entry in availablePeople (replace placeholder)
        if (index >= 0 && index < availablePeople.value.length && availablePeople.value[index].id === userId) {
          availablePeople.value[index] = userData
          console.log('✅ Updated project_lead placeholder with real data from system workers:', userData)
          return
        }
      } else {
        console.warn('⚠️ User ID', userId, 'not found in system workers')
      }
    }

    // If user not found anywhere, log warning but keep placeholder
    console.warn('⚠️ User ID', userId, 'not found in any data source, keeping placeholder')
  } catch (error) {
    console.error('❌ Error loading user data for update:', error)
  }
}

// Load available workers for task (from all system users, excluding busy and already assigned)
async function loadAvailablePeople() {
  // Prevent duplicate calls
  if (isLoadingAvailablePeople.value) {
    console.log('⏸️ Already loading available people, skipping duplicate call')
    return
  }

  // Save current project_lead before loading to preserve it
  const currentProjectLead = form.value.project_lead

  // Get dates from task or form
  const startDate = props.task?.start_planned || form.value.start_planned
  const endDate = props.task?.end_planned || form.value.end_planned

  // Check if we're loading with the same parameters
  const loadParams = {
    taskId: props.task?.id,
    startDate,
    endDate,
  }

  if (lastLoadParams.value &&
      lastLoadParams.value.taskId === loadParams.taskId &&
      lastLoadParams.value.startDate === loadParams.startDate &&
      lastLoadParams.value.endDate === loadParams.endDate) {
    console.log('⏸️ Already loaded with same parameters, skipping:', loadParams)
    return
  }

  // Set loading flag
  isLoadingAvailablePeople.value = true

  try {
    // For new tasks (no ID yet), we can't check availability via API
    // So we'll load all system users (excluding admin/PM) and filter on frontend
    if (!props.task?.id) {
      console.log('👥 Loading all system users for new task (no availability check yet)')
      await loadAllSystemUsers()
      // Restore project_lead after loading
      if (currentProjectLead !== null && currentProjectLead !== undefined) {
        await ensureProjectLeadInList(currentProjectLead)
        await nextTick()
        form.value.project_lead = currentProjectLead
      }
      lastLoadParams.value = loadParams
      return
    }

    // For existing tasks, use API with availability check
    if (!startDate || !endDate) {
      console.warn('⚠️ Cannot check availability: task dates missing')
      // Fallback: load from project team if no task dates
      if (props.projectId) {
        await loadProjectTeamMembers()
        // Restore project_lead after loading
        if (currentProjectLead !== null && currentProjectLead !== undefined) {
          await ensureProjectLeadInList(currentProjectLead)
          await nextTick()
          form.value.project_lead = currentProjectLead
        }
      }
      lastLoadParams.value = loadParams
      return
    }

    console.log('👥 Loading available workers for task:', props.task.id)
    console.log('📅 Task dates:', startDate, 'to', endDate)

    // Use new API endpoint to get available workers with availability check
    const availableWorkers = await tasksApi.getAvailableWorkers(
      props.task.id,
      startDate,
      endDate,
    )

    console.log('✅ Available workers loaded:', availableWorkers.length)
    console.log('👥 Available workers:', availableWorkers)

    // Exclude already assigned team members
    const currentTeamMembers = form.value.team_members || []
    const filteredWorkers = availableWorkers.filter((worker) => !currentTeamMembers.includes(worker.id))

    // Map to our format - worker.role already comes formatted from getAvailableWorkers API
    const newAvailablePeople = filteredWorkers.map((worker) => ({
      id: worker.id,
      name: worker.name,
      // worker.role already comes formatted from getAvailableWorkers API, but use formatter for consistency
      role: worker.role || 'Worker',
    }))

    // Store in cache (including already assigned ones for display)
    availableWorkers.forEach((worker) => {
      teamMemberCache.value.set(worker.id, {
        id: worker.id,
        name: worker.name,
        role: worker.role,
      })
    })

    // Set availablePeople and remove duplicates
    const uniquePeople = new Map<number, { id: number; name: string; role: string }>()
    newAvailablePeople.forEach((person) => {
      if (!uniquePeople.has(person.id)) {
        uniquePeople.set(person.id, person)
      }
    })
    availablePeople.value = Array.from(uniquePeople.values())

    // Restore project_lead after loading
    if (currentProjectLead !== null && currentProjectLead !== undefined) {
      await ensureProjectLeadInList(currentProjectLead)
      await nextTick()
      form.value.project_lead = currentProjectLead
      console.log('🔄 Restored project_lead after loading available workers:', currentProjectLead)
    } else if (props.task?.task_lead_id) {
      // If project_lead was null but task has task_lead_id, set it
      const leadId = Number(props.task.task_lead_id)
      if (!isNaN(leadId) && leadId > 0) {
        await ensureProjectLeadInList(leadId)
        await nextTick()
        form.value.project_lead = leadId
        console.log('🔄 Set project_lead from task_lead_id after loading:', leadId)
      }
    }

    // Final deduplication after all additions
    const finalUnique = new Map<number, { id: number; name: string; role: string }>()
    availablePeople.value.forEach((person) => {
      if (!finalUnique.has(person.id)) {
        finalUnique.set(person.id, person)
      }
    })
    availablePeople.value = Array.from(finalUnique.values())

    console.log('👥 Excluded already assigned:', currentTeamMembers.length, 'workers')
    console.log('👥 Available after filtering:', availablePeople.value.length)

    // Save load parameters
    lastLoadParams.value = loadParams

  } catch (error) {
    console.error('❌ Error loading available workers:', error)
    // Fallback: load all system users
    await loadAllSystemUsers()
    // Restore project_lead after fallback
    if (currentProjectLead !== null && currentProjectLead !== undefined) {
      await nextTick()
      form.value.project_lead = currentProjectLead
      ensureProjectLeadInList(currentProjectLead)
    }
    lastLoadParams.value = loadParams
  } finally {
    // Clear loading flag
    isLoadingAvailablePeople.value = false
  }
}

// Load all system users (excluding admin and PM) - for new tasks
async function loadAllSystemUsers() {
  try {
    console.log('👥 Loading all system users (excluding admin/PM)')
    // Use hrResourcesApi to get all workers
    const { hrResourcesApi } = await import('@/core/utils/hr-api')
    const response = await hrResourcesApi.getAllWorkerUsers(1, 1000, {
      status: '1', // active only
      invitation_status: 'registered',
    })

    if ('workers' in response && Array.isArray(response.workers)) {
      // Filter out admin and project_manager
      const filteredWorkers = response.workers.filter((worker: WorkerUser) => {
        return worker.role_code !== 'admin' && worker.role_code !== 'project_manager'
      })

      // Exclude already assigned team members
      const currentTeamMembers = form.value.team_members || []
      const furtherFiltered = filteredWorkers.filter((worker: WorkerUser) => !currentTeamMembers.includes(worker.id))

      // Map to our format using unified role formatter
      const { getDisplayRole } = await import('@/core/utils/role-utils')
      const newAvailablePeople = furtherFiltered.map((worker: WorkerUser) => ({
        id: worker.id,
        name: `${worker.first_name || ''} ${worker.last_name || ''}`.trim() || worker.name || 'Unknown',
        role: getDisplayRole({
          role_name: worker.role_name,
          role_code: worker.role_code,
          role: typeof worker.role === 'object' && worker.role ? { name: worker.role.name || undefined, code: worker.role.code || undefined } : undefined,
        }),
      }))

      // Store in cache (including already assigned ones for display) using unified role formatter
      const { getDisplayRole: getDisplayRoleForCache2 } = await import('@/core/utils/role-utils')
      filteredWorkers.forEach((worker: WorkerUser) => {
        teamMemberCache.value.set(worker.id, {
          id: worker.id,
          name: `${worker.first_name || ''} ${worker.last_name || ''}`.trim() || worker.name || 'Unknown',
          role: getDisplayRoleForCache2({
            role_name: worker.role_name,
            role_code: worker.role_code,
            role: typeof worker.role === 'object' && worker.role ? { name: worker.role.name || undefined, code: worker.role.code || undefined } : undefined,
          }),
        })
      })

      // Set availablePeople and remove duplicates
      const uniquePeople1 = new Map<number, { id: number; name: string; role: string }>()
      newAvailablePeople.forEach((person) => {
        if (!uniquePeople1.has(person.id)) {
          uniquePeople1.set(person.id, person)
        }
      })
      availablePeople.value = Array.from(uniquePeople1.values())

      // Restore project_lead if it was set
      const savedProjectLead = form.value.project_lead
      if (savedProjectLead !== null && savedProjectLead !== undefined) {
        await ensureProjectLeadInList(savedProjectLead)
        await nextTick()
        form.value.project_lead = savedProjectLead
        console.log('🔄 Restored project_lead after loading all system users:', savedProjectLead)
      } else if (props.task?.task_lead_id) {
        const leadId = Number(props.task.task_lead_id)
        if (!isNaN(leadId) && leadId > 0) {
          await ensureProjectLeadInList(leadId)
          await nextTick()
          form.value.project_lead = leadId
          console.log('🔄 Set project_lead from task_lead_id after loading all system users:', leadId)
        }
      }

      console.log('✅ All system users loaded:', availablePeople.value.length)
      console.log('👥 Excluded already assigned:', currentTeamMembers.length, 'workers')
    }
  } catch (error) {
    console.error('❌ Error loading all system users:', error)
    // Fallback: load from project team
    if (props.projectId) {
      await loadProjectTeamMembers()
    } else {
      availablePeople.value = []
    }
  }
}

// Fallback: Load project team members (used when task has no dates or API fails)
async function loadProjectTeamMembers() {
  if (!props.projectId) {
    console.warn('⚠️ No project ID provided, cannot load team members')
    availablePeople.value = []
    return
  }

  try {
    console.log('👥 Loading project team members as fallback for project:', props.projectId)
    const response = await projectApi.getTeamMembers(props.projectId)
    console.log('🔍 Full API response:', response)

    // Map the API response structure to our expected format
    const apiTeamMembers = response.data?.team_members || response.team_members || []
    // Map using unified role formatter
    const { getDisplayRole } = await import('@/core/utils/role-utils')
    const mappedPeople = apiTeamMembers.map((member: ProjectTeamMember & { team_member_id?: number; full_name?: string; first_name?: string; last_name?: string; role_name?: string; role_code?: string; project_role?: string; role?: { name?: string | null; code?: string | null } }) => ({
      id: member.id || member.user_id || member.team_member_id,
      name: member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.name || 'Unknown',
      role: getDisplayRole({
        role_name: member.role_name,
        role_code: member.role_code,
        project_role: member.project_role,
        role: typeof member.role === 'object' && member.role ? { name: member.role.name || undefined, code: member.role.code || undefined } : undefined,
      }),
    }))

    // Remove duplicates by user_id
    const uniquePeopleMap = new Map<number, { id: number; name: string; role: string }>()
    mappedPeople.forEach((person: { id: number; name: string; role: string }) => {
      if (!uniquePeopleMap.has(person.id)) {
        uniquePeopleMap.set(person.id, person)
      }
    })

    const newAvailablePeople = Array.from(uniquePeopleMap.values())
    // Remove duplicates before setting
    const uniquePeople2 = new Map<number, { id: number; name: string; role: string }>()
    newAvailablePeople.forEach((person) => {
      if (!uniquePeople2.has(person.id)) {
        uniquePeople2.set(person.id, person)
      }
    })
    availablePeople.value = Array.from(uniquePeople2.values())

    // Store in cache
    mappedPeople.forEach((member: { id: number; name: string; role: string }) => {
      teamMemberCache.value.set(member.id, member)
    })

    // Restore project_lead if it was set
    const savedProjectLead = form.value.project_lead
    if (savedProjectLead !== null && savedProjectLead !== undefined) {
      await ensureProjectLeadInList(savedProjectLead)
      await nextTick()
      form.value.project_lead = savedProjectLead
      console.log('🔄 Restored project_lead after loading project team members:', savedProjectLead)
    } else if (props.task?.task_lead_id) {
      const leadId = Number(props.task.task_lead_id)
      if (!isNaN(leadId) && leadId > 0) {
        await ensureProjectLeadInList(leadId)
        await nextTick()
        form.value.project_lead = leadId
        console.log('🔄 Set project_lead from task_lead_id after loading project team members:', leadId)
      }
    }

    console.log('✅ Project team members loaded (fallback):', availablePeople.value.length)
  } catch (error) {
    console.error('❌ Error loading project team members:', error)
    availablePeople.value = []
  }
}

// Load data for assigned team members to populate cache
async function loadAssignedTeamMembersData() {
  const assignedMemberIds = form.value.team_members || []
  if (assignedMemberIds.length === 0) {
    return
  }

  // Check which members are missing from cache
  const missingIds = assignedMemberIds.filter((id: number) => !teamMemberCache.value.has(id))
  if (missingIds.length === 0) {
    console.log('✅ All assigned team members already in cache')
    return
  }

  console.log('👥 Loading data for assigned team members:', missingIds)

  try {
    // Import role utils once at the beginning
    const { getDisplayRole } = await import('@/core/utils/role-utils')

    // Try to load from project team first
    if (props.projectId) {
      const response = await projectApi.getTeamMembers(props.projectId)
      const apiTeamMembers = response.data?.team_members || response.team_members || []

      for (const memberId of missingIds) {
        const member = apiTeamMembers.find((m: ProjectTeamMember & { team_member_id?: number; full_name?: string; first_name?: string; last_name?: string; role_name?: string; role_code?: string; project_role?: string; role?: { name?: string | null; code?: string | null } }) => {
          const id = m.id || m.user_id || m.team_member_id
          return id === memberId
        })

        if (member) {
          teamMemberCache.value.set(memberId, {
            id: memberId,
            name: member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.name || 'Unknown',
            role: getDisplayRole({
              role_name: member.role_name,
              role_code: member.role_code,
              project_role: member.project_role,
              role: typeof member.role === 'object' && member.role ? { name: member.role.name || undefined, code: member.role.code || undefined } : undefined,
            }),
          })
          console.log(`✅ Loaded team member ${memberId} from project team`)
        }
      }
    }

    // If still missing, try to load from all system users
    const stillMissing = missingIds.filter((id: number) => !teamMemberCache.value.has(id))
    if (stillMissing.length > 0) {
      console.log('👥 Still missing team members, loading from system users:', stillMissing)
      const { hrResourcesApi } = await import('@/core/utils/hr-api')
      const response = await hrResourcesApi.getAllWorkerUsers(1, 1000, {
        status: '1',
        invitation_status: 'registered',
      })

      if ('workers' in response && Array.isArray(response.workers)) {
        for (const memberId of stillMissing) {
          const worker = response.workers.find((w: WorkerUser) => w.id === memberId)
          if (worker) {
            teamMemberCache.value.set(memberId, {
              id: memberId,
              name: `${worker.first_name || ''} ${worker.last_name || ''}`.trim() || worker.name || 'Unknown',
              role: getDisplayRole({
                role_name: worker.role_name,
                role_code: worker.role_code,
                role: typeof worker.role === 'object' && worker.role ? { name: worker.role.name || undefined, code: worker.role.code || undefined } : undefined,
              }),
            })
            console.log(`✅ Loaded team member ${memberId} from system users`)
          }
        }
      }
    }

    console.log('✅ Finished loading assigned team members data')
  } catch (error) {
    console.error('❌ Error loading assigned team members data:', error)
  }
}

// Watch for task changes
watch(
  () => [props.isOpen, props.task, props.projectId],
  async ([isOpen]) => {
    if (isOpen) {
      // Load available people when panel opens
      // Reset last load params to ensure fresh load
      lastLoadParams.value = null
      await loadAvailablePeople()
    }

    if (isOpen && props.mode === 'create') {
      // Reset form for create mode
      // For PM creating milestone, automatically set project_lead to current user
      // For regular tasks, PM can select project lead (foreman/brigadier)
      const defaultProjectLead = null // Always start with null for tasks, PM can select

      form.value = {
        name: '',
        wbs_path: '',
        start_planned: '',
        end_planned: '',
        duration_days: 1,
        milestone: false,
        milestone_type: undefined,
        status: 'planned',
        progress_pct: 0,
        notes: '',
        dependencies: [],
        resources: [],
        project_lead: defaultProjectLead,
        team_members: [],
      }
      invitedPeople.value = []
    } else if (isOpen && props.task) {
      // Initialize form with task data for edit mode
      form.value = {
        name: props.task.name || '',
        wbs_path: props.task.wbs_path || '',
        start_planned: props.task.start_planned || '',
        end_planned: props.task.end_planned || '',
        duration_days: props.task.duration_days || 1,
        milestone: typeof props.task.milestone === 'string' ? props.task.milestone : (props.task.milestone ? true : false),
        milestone_type: typeof props.task.milestone === 'string' ? props.task.milestone : (props.task.milestone_type || (props.task.milestone ? 'other' : undefined)),
        status: props.task.status || 'planned',
        progress_pct: props.task.progress_pct || 0,
        notes: props.task.notes || '',
        dependencies: [], // Will be loaded from API
        resources: props.task.resources || [],
        // For tasks, use task_lead_id from task (PM can select foreman/brigadier)
        // For milestones, if PM and no project_lead, use current user
        project_lead: (() => {
          // Get task_lead_id from task, handle both number and string types
          let projectLead: number | null = null
          if (props.task.task_lead_id !== undefined && props.task.task_lead_id !== null) {
            const leadId = Number(props.task.task_lead_id)
            if (!isNaN(leadId) && leadId > 0) {
              projectLead = leadId
            }
          }

          console.log('👤 Setting project_lead from task:', {
            taskId: props.task.id,
            task_lead_id: props.task.task_lead_id,
            task_lead_idType: typeof props.task.task_lead_id,
            projectLead,
            taskIsMilestone: isMilestone(props.task.milestone),
            isPM: isProjectManager.value,
          })

          const taskIsMilestone = isMilestone(props.task.milestone)
          // Only auto-set for milestones if PM and no project_lead
          if (taskIsMilestone && isProjectManager.value && !projectLead && authStore.currentUser?.id) {
            projectLead = authStore.currentUser.id
            console.log('👤 Auto-setting project_lead to current PM for milestone:', projectLead)
          }

          return projectLead
        })(),
        team_members: (() => {
          const members = props.task.team_members || []
          console.log('👥 Loading team_members from task:', {
            taskId: props.task.id,
            taskName: props.task.name,
            team_members: members,
            team_membersType: typeof members,
            isArray: Array.isArray(members),
            length: Array.isArray(members) ? members.length : 'N/A',
          })
          // Ensure it's an array of numbers
          if (Array.isArray(members)) {
            return members.map((m: unknown) => Number(m)).filter((m: number) => !isNaN(m) && m > 0)
          }
          return []
        })(),
      }

      // Load invited people from API
      if (props.task.id && isMilestone(props.task.milestone)) {
        await loadInvitedPeople()
      } else {
        invitedPeople.value = []
      }

      console.log('✅ Form initialized with team_members:', form.value.team_members)
      console.log('✅ Team members count:', form.value.team_members.length)
      console.log('✅ Team members IDs:', form.value.team_members)
      console.log('✅ Form team_members type:', typeof form.value.team_members, 'isArray:', Array.isArray(form.value.team_members))

      // Load dependencies from API for accurate data
      if (props.task.id) {
        try {
          console.log('🔄 Loading dependencies for task:', props.task.id)
          const dependencies = await getTaskDependencies(Number(props.task.id))
          console.log('✅ Loaded dependencies:', dependencies)

          // Update form dependencies with data from API
          form.value.dependencies = dependencies.map((dep) => ({
            taskId: String(dep.from_task_id),
            type: dep.dependency_type,
            lagDays: dep.lag_days || 0,
          }))
          console.log('✅ Form dependencies initialized:', form.value.dependencies)
        } catch (error) {
          console.warn('⚠️ Could not load dependencies from API, using task data:', error)
          // Fallback: use dependencies from task object
          form.value.dependencies = (props.task.dependencies || []).map((dep) => {
            if (typeof dep === 'object') {
              return {
                taskId: String(dep.predecessor_id),
                type: dep.type,
                lagDays: dep.lag_days || 0,
              }
            }
            return {
              taskId: String(dep),
              type: 'FS',
              lagDays: 0,
            }
          })
        }
      }

      // Load data for assigned team members to populate cache (after form is initialized)
      await loadAssignedTeamMembersData()

      // Ensure project_lead is set correctly after availablePeople is loaded
      await nextTick()

      // Force set project_lead from task_lead_id after availablePeople is loaded
      if (props.task.task_lead_id !== undefined && props.task.task_lead_id !== null) {
        const leadId = Number(props.task.task_lead_id)
        if (!isNaN(leadId) && leadId > 0) {
          // Always set project_lead from task_lead_id
          form.value.project_lead = leadId
          console.log('🔄 Force setting project_lead from task_lead_id:', leadId)

          // Ensure this person is in availablePeople - use ensureProjectLeadInList to load real data
          await ensureProjectLeadInList(leadId)

          // Force Vue to update by setting again after nextTick
          await nextTick()
          if (form.value.project_lead !== leadId) {
            form.value.project_lead = leadId
            console.log('🔄 Force setting project_lead again after nextTick:', leadId)
          }
        }
      }

      console.log('✅ Form initialized for edit mode:', {
        taskId: props.task.id,
        task_lead_id: props.task.task_lead_id,
        task_lead_idType: typeof props.task.task_lead_id,
        project_lead: form.value.project_lead,
        project_leadType: typeof form.value.project_lead,
        availablePeopleCount: availablePeople.value.length,
        project_leadInList: availablePeople.value.some(p => p.id === form.value.project_lead),
        availablePeopleIds: availablePeople.value.map(p => p.id),
        availablePeopleTypes: availablePeople.value.map(p => ({ id: p.id, idType: typeof p.id })),
      })
    }
  },
)

// Watch for availablePeople changes to ensure project_lead is set correctly
watch(
  () => availablePeople.value,
  async (newPeople) => {
    if (props.isOpen && props.mode === 'edit' && props.task && newPeople.length > 0) {
      // If project_lead is set but not in list, or if task has task_lead_id but project_lead is null
      const taskLeadId = props.task.task_lead_id
      if (taskLeadId !== undefined && taskLeadId !== null) {
        const leadId = Number(taskLeadId)
        if (!isNaN(leadId) && leadId > 0) {
          // Check if current project_lead matches
          if (form.value.project_lead !== leadId) {
            // Check if leadId is in availablePeople
            const leadInList = newPeople.some(p => p.id === leadId)
            if (leadInList) {
              form.value.project_lead = leadId
              console.log('🔄 Updated project_lead after availablePeople loaded:', leadId)
            } else {
              // Use ensureProjectLeadInList to load real data (not placeholder)
              await ensureProjectLeadInList(leadId)
              await nextTick()
              form.value.project_lead = leadId
              console.log('🔄 Set project_lead after ensuring it in list:', leadId)
            }
          } else {
            // project_lead is already set, but check if it's a placeholder and needs update
            const existingIndex = newPeople.findIndex(p => p.id === leadId)
            if (existingIndex >= 0) {
              const existing = newPeople[existingIndex]
              if (existing.name.startsWith('User #')) {
                // It's a placeholder, try to load real data
                await loadAndUpdateUserData(leadId, existingIndex)
              }
            }
          }
        }
      }
    }
  },
  { deep: true },
)

// Watch for date changes to recalculate duration
watch(
  () => [form.value.start_planned, form.value.end_planned],
  async ([startDate, endDate]) => {
    if (startDate && endDate && !form.value.milestone) {
      // Calculate duration including both start and end dates (inclusive)
      const start = new Date(startDate)
      const end = new Date(endDate)
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 to include both start and end days
      form.value.duration_days = diffDays
      console.log('📅 Recalculated duration:', {
        start: startDate,
        end: endDate,
        duration: diffDays,
      })
    }

    // Reload available workers when dates change (for existing tasks with availability check)
    // Only reload if dates actually changed (not on initial load)
    if (props.isOpen && props.task?.id && startDate && endDate) {
      const newParams = {
        taskId: props.task.id,
        startDate,
        endDate,
      }
      // Check if parameters changed
      if (!lastLoadParams.value ||
          lastLoadParams.value.taskId !== newParams.taskId ||
          lastLoadParams.value.startDate !== newParams.startDate ||
          lastLoadParams.value.endDate !== newParams.endDate) {
        console.log('📅 Dates changed, reloading available workers')
        await loadAvailablePeople()
      }
    }
  },
)

// Watch for team_members changes to update available list
watch(
  () => form.value.team_members,
  async (newMembers, oldMembers) => {
    if (props.isOpen && props.task?.id) {
      // Only reload if members actually changed (not just initial load)
      const membersChanged = JSON.stringify(newMembers) !== JSON.stringify(oldMembers)
      if (membersChanged && oldMembers !== undefined) {
        console.log('👥 Team members changed, updating available list')
        // Reset last load params to force reload
        lastLoadParams.value = null
        await loadAvailablePeople()
      }
    }
  },
  { deep: true },
)

// Methods

function handleBasicInfoSave() {
  console.log('💾 handleBasicInfoSave called:', form.value)
  console.log('💾 Mode:', props.mode)
  console.log('💾 Task ID:', props.task?.id)

  // Validate required fields only for create mode
  if (props.mode === 'create') {
    if (!form.value.name || !form.value.start_planned || !form.value.end_planned) {
      alert('Please fill in all required fields (Name, Start Date, End Date)')
      return
    }
  } else if (props.mode === 'edit') {
    // For edit mode, at least name should be present
    if (!form.value.name) {
      alert('Task name is required')
      return
    }
    // For edit mode, dates should be present (they should already be set from task data)
    if (!form.value.start_planned) {
      console.warn('⚠️ start_planned is missing in edit mode, using task start_planned')
      form.value.start_planned = props.task?.start_planned || ''
    }
    if (!form.value.end_planned && props.task?.end_planned) {
      form.value.end_planned = props.task.end_planned
    }
  }

  // Transform dependencies to match Task type
  const taskData: TaskCreateUpdate & { id?: string } = {
    name: form.value.name,
    wbs_path: form.value.wbs_path || undefined,
    start_planned: form.value.start_planned || props.task?.start_planned || '',
    end_planned: form.value.end_planned || props.task?.end_planned || undefined,
    duration_days: form.value.duration_days,
    milestone: typeof form.value.milestone === 'string' ? form.value.milestone as MilestoneType : (form.value.milestone ? (form.value.milestone_type || 'other' as MilestoneType) : false),
    milestone_type: typeof form.value.milestone === 'string' ? form.value.milestone as MilestoneType : form.value.milestone_type,
    status: form.value.status,
    progress_pct: form.value.progress_pct,
    notes: form.value.notes || undefined,
    project_id: props.projectId,
    // Ensure task_lead_id is included only if it's a valid positive number
    task_lead_id: (() => {
      const leadId = form.value.project_lead
      if (leadId !== null && leadId !== undefined && leadId !== 0 && typeof leadId === 'number') {
        if (leadId > 0) {
          return leadId
        }
      }
      return undefined
    })(),
    team_members: form.value.team_members || [],
    resources: form.value.resources || [],
    // Transform dependencies
    dependencies: form.value.dependencies.map((dep) => ({
      predecessor_id: Number(dep.taskId),
      type: dep.type,
      lag_days: dep.lagDays,
    })),
    // Send invited people only for milestones
    // For milestone: [] if empty, [{},{}...] if has invited people
    // For regular task: null (will be set in tasks-api.ts)
    invited_people: (() => {
      if (!isMilestone(form.value.milestone)) {
        return undefined // Will be set to null in tasks-api.ts for regular tasks
      }
      // For milestone, return array (empty if no invited people)
      return invitedPeople.value
        .filter(invited => invited.role_in_project === 'invited' || invited.role_in_project === 'Invited')
        .map(invited => ({
          name: getInvitedName(invited),
          email: getInvitedEmail(invited),
          company: getInvitedCompany(invited),
          phone: invited.invited_people?.phone,
          notes: invited.invited_people?.notes,
          avatar: getInvitedAvatar(invited),
        }))
    })(),
  }

  // Add task ID if editing
  if (props.mode === 'edit' && props.task?.id) {
    taskData.id = props.task.id
  }

  console.log('='.repeat(80))
  console.log('📤 TaskEditPanel: Emitting save event')
  console.log('📋 Mode:', props.mode)
  console.log('📋 Task ID:', taskData.id || 'NEW')
  console.log('📋 Full taskData:', JSON.stringify(taskData, null, 2))
  console.log('📋 Form values:', {
    name: form.value.name,
    project_lead: form.value.project_lead,
    team_members: form.value.team_members,
    milestone: form.value.milestone,
    milestone_type: form.value.milestone_type,
  })
  console.log('='.repeat(80))

  emit('save', taskData)
  console.log('✅ Save event emitted from TaskEditPanel')
}


// Dependencies methods
function openDependencyDialog() {
  showDependencyDialog.value = true
}

async function addDependency(dep: { taskId: string; type: string; lagDays: number }) {
  if (!props.task?.id) {
    console.warn('⚠️ Cannot create dependency: task ID is missing')
    // If task doesn't exist yet, just add to form (will be saved with task)
    form.value.dependencies.push(dep)
    showDependencyDialog.value = false
    return
  }

  try {
    console.log('🔗 Creating dependency via API:', {
      fromTaskId: Number(dep.taskId),
      toTaskId: props.task.id,
      type: dep.type,
      lagDays: dep.lagDays,
    })

    // Create dependency via API
    const createdDependency = await createDependency(props.projectId, {
      from_task_id: Number(dep.taskId),
      to_task_id: Number(props.task.id),
      dependency_type: dep.type as 'FS' | 'SS' | 'FF' | 'SF',
      lag_days: dep.lagDays || 0,
    })

    console.log('✅ Dependency created successfully:', createdDependency)

    // Reload dependencies from API to get the full updated list
    try {
      console.log('🔄 Reloading dependencies for task:', props.task.id)
      const updatedDependencies = await getTaskDependencies(Number(props.task.id))
      console.log('✅ Updated dependencies:', updatedDependencies)

      // Update form dependencies with fresh data from API
      form.value.dependencies = updatedDependencies.map((dep) => ({
        taskId: String(dep.from_task_id),
        type: dep.dependency_type,
        lagDays: dep.lag_days || 0,
      }))
      console.log('✅ Form dependencies updated:', form.value.dependencies)
    } catch (fetchError) {
      console.warn('⚠️ Could not reload dependencies, adding locally:', fetchError)
      // Fallback: add to form for display
      form.value.dependencies.push(dep)
    }

    showDependencyDialog.value = false
  } catch (error) {
    console.error('❌ Error creating dependency:', error)

    // Extract error message from server response
    let errorMessage = 'Failed to create dependency. Please try again.'
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string } } }
      if (axiosError.response?.data?.message) {
        errorMessage = axiosError.response.data.message
      }
    }

    alert(`❌ ${errorMessage}`)
  }
}

function removeDependency(index: number) {
  form.value.dependencies.splice(index, 1)
}

function getDependencyTaskName(taskId: string): string {
  const task = props.availableTasks?.find((t) => String(t.id) === String(taskId))
  return task?.name || `Task #${taskId}`
}

function formatDependencyType(type: string): string {
  const types: Record<string, string> = {
    FS: 'Finish-to-Start',
    SS: 'Start-to-Start',
    FF: 'Finish-to-Finish',
    SF: 'Start-to-Finish',
  }
  return types[type] || type
}

// Resources methods
function openResourceDialog() {
  showResourceDialog.value = true
}

function addResource(resource: string) {
  form.value.resources.push(resource)
  showResourceDialog.value = false
}

function removeResource(index: number) {
  form.value.resources.splice(index, 1)
}

// Team members methods
function openTeamMemberDialog() {
  showTeamMemberDialog.value = true
}

async function addTeamMember(memberIds: number[]) {
  console.log('👥 addTeamMember called with memberIds:', memberIds)
  console.log('👥 Current team_members before:', form.value.team_members)
  console.log('👥 Mode:', props.mode, 'Task ID:', props.task?.id)

  // Ensure new members are in cache (they should be from availablePeople, but double-check)
  memberIds.forEach((memberId) => {
    if (!teamMemberCache.value.has(memberId)) {
      // Try to find in availablePeople
      const person = availablePeople.value.find((p) => p.id === memberId)
      if (person) {
        teamMemberCache.value.set(memberId, person)
        console.log(`✅ Added member ${memberId} to cache from availablePeople`)
      } else {
        console.warn(`⚠️ Member ${memberId} not found in availablePeople or cache`)
      }
    }
  })

  // Add all selected members that are not already in the list
  const addedCount = memberIds.filter((memberId) => {
    if (!form.value.team_members.includes(memberId)) {
      form.value.team_members.push(memberId)
      console.log(`  ✅ Added member ID ${memberId}`)
      return true
    } else {
      console.log(`  ⚠️ Member ID ${memberId} already in list`)
      return false
    }
  }).length

  console.log('👥 Added', addedCount, 'new members')
  console.log('👥 Current team_members after:', form.value.team_members)
  console.log('👥 Team members array length:', form.value.team_members.length)

  showTeamMemberDialog.value = false

  // If task already exists (edit mode), save changes immediately
  if (props.mode === 'edit' && props.task?.id) {
    console.log('💾 Auto-saving task after adding team members')
    console.log('💾 Current team_members:', form.value.team_members)
    console.log('💾 Task ID:', props.task.id)

    try {
      // Save only team_members update for existing task
      const taskData: Partial<Task> = {
        id: props.task.id,
        name: props.task.name, // Use existing name
        start_planned: props.task.start_planned, // Use existing dates
        end_planned: props.task.end_planned,
        status: props.task.status,
        progress_pct: props.task.progress_pct || 0,
        project_id: props.projectId,
        task_lead_id: props.task.task_lead_id,
        team_members: form.value.team_members, // Updated team members
        resources: props.task.resources || [],
        wbs_path: props.task.wbs_path,
        notes: props.task.notes,
        milestone: props.task.milestone,
        milestone_type: typeof props.task.milestone === 'string' ? props.task.milestone : props.task.milestone_type,
      }

      console.log('📤 Emitting save event with team members update:', taskData)
      console.log('📤 Team members in payload:', taskData.team_members)
      emit('save', taskData)
      console.log('✅ Save event emitted successfully')
    } catch (error) {
      console.error('❌ Error auto-saving task after adding team members:', error)
    }
  } else {
    console.log('⚠️ Not in edit mode or no task ID, skipping auto-save')
  }
}

function removeTeamMember(index: number) {
  form.value.team_members.splice(index, 1)

  // If task already exists (edit mode), save changes immediately
  if (props.mode === 'edit' && props.task?.id) {
    console.log('💾 Auto-saving task after removing team member')
    console.log('💾 Current team_members:', form.value.team_members)

    try {
      // Save only team_members update for existing task
      const taskData: Partial<Task> = {
        id: props.task.id,
        name: props.task.name, // Use existing name
        start_planned: props.task.start_planned, // Use existing dates
        end_planned: props.task.end_planned,
        status: props.task.status,
        progress_pct: props.task.progress_pct || 0,
        project_id: props.projectId,
        task_lead_id: props.task.task_lead_id,
        team_members: form.value.team_members, // Updated team members
        resources: props.task.resources || [],
        wbs_path: props.task.wbs_path,
        notes: props.task.notes,
        milestone: props.task.milestone,
        milestone_type: typeof props.task.milestone === 'string' ? props.task.milestone : props.task.milestone_type,
      }

      console.log('📤 Emitting save event with team members update:', taskData)
      emit('save', taskData)
    } catch (error) {
      console.error('❌ Error auto-saving task after removing team member:', error)
    }
  }
}

function getTeamMemberName(memberId: number): string {
  // First check availablePeople
  const person = availablePeople.value.find((p) => p.id === memberId)
  if (person) return person.name

  // Then check cache (for members not in project team anymore)
  const cached = teamMemberCache.value.get(memberId)
  if (cached) return cached.name

  return `Member #${memberId}`
}

function getTeamMemberRole(memberId: number): string {
  // First check availablePeople
  const person = availablePeople.value.find((p) => p.id === memberId)
  if (person) return person.role

  // Then check cache (for members not in project team anymore)
  const cached = teamMemberCache.value.get(memberId)
  if (cached) return cached.role

  return 'Unknown'
}

function getTeamMemberInitials(memberId: number): string {
  const name = getTeamMemberName(memberId)
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Invited people methods
function openInvitedPersonDialog() {
  invitedPersonForm.value = {
    name: '',
    email: '',
    company: '',
    phone: '',
    notes: '',
    avatar: '',
  }
  showInvitedPersonDialog.value = true
}

function handleAddInvitedPerson() {
  // Add to local list (will be sent together on save)
  const newInvited: ProjectTeamMember = {
    id: Date.now(), // Temporary ID for local tracking
    project_id: props.projectId,
    task_id: props.task?.id ? Number(props.task.id) : null,
    user_id: null,
    role_in_project: 'invited',
    assigned_at: new Date().toISOString(),
    invited_people: {
      name: invitedPersonForm.value.name,
      email: invitedPersonForm.value.email || undefined,
      company: invitedPersonForm.value.company || undefined,
      phone: invitedPersonForm.value.phone || undefined,
      notes: invitedPersonForm.value.notes || undefined,
      avatar: invitedPersonForm.value.avatar || undefined,
    },
  }
  invitedPeople.value.push(newInvited)
  showInvitedPersonDialog.value = false
}

function removeInvitedPerson(teamMemberId: number) {
  // Remove from local list (will be sent together on save)
  const index = invitedPeople.value.findIndex(invited => invited.id === teamMemberId)
  if (index !== -1) {
    invitedPeople.value.splice(index, 1)
  }
}

async function loadInvitedPeople() {
  if (!props.task?.id || !props.projectId) {
    invitedPeople.value = []
    return
  }

  try {
    const response = await projectApi.getTaskTeamMembers(props.projectId, Number(props.task.id))
    const members = response.data?.team_members || response.team_members || []
    // Filter only invited people
    invitedPeople.value = members.filter((m: ProjectTeamMember) =>
      m.role_in_project === 'invited' || m.role_in_project === 'Invited'
    )
    console.log('✅ Loaded invited people:', invitedPeople.value.length)
  } catch (error) {
    console.error('❌ Error loading invited people:', error)
    invitedPeople.value = []
  }
}

function getInvitedName(invited: ProjectTeamMember): string {
  if (invited.invited_people?.name) {
    return invited.invited_people.name
  }
  return invited.name || 'Unknown'
}

function getInvitedEmail(invited: ProjectTeamMember): string | undefined {
  return invited.invited_people?.email || invited.email
}

function getInvitedCompany(invited: ProjectTeamMember): string | undefined {
  return invited.invited_people?.company
}

function getInvitedAvatar(invited: ProjectTeamMember): string | undefined {
  return invited.invited_people?.avatar
}

function getInvitedPersonInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

</script>

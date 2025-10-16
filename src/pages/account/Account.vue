<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Success/Error Messages -->
      <div v-if="successMessage" class="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
        <p class="text-sm text-green-800">{{ successMessage }}</p>
      </div>

      <div v-if="errorMessage" class="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
        <p class="text-sm text-red-800">{{ errorMessage }}</p>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-3 text-gray-600">Loading profile...</span>
      </div>

      <!-- Profile Content -->
      <div v-else class="space-y-6">
        <!-- Tab Navigation -->
        <div class="bg-white shadow rounded-lg">
          <div class="border-b border-gray-200">
            <!-- Desktop Navigation -->
            <nav class="hidden sm:flex space-x-8 px-6" aria-label="Tabs">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                @click="setActiveTab(tab.id)"
                :class="[
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                  'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2'
                ]"
              >
                <span>{{ tab.icon }}</span>
                {{ tab.name }}
              </button>
            </nav>

            <!-- Mobile Navigation -->
            <div class="sm:hidden px-4 py-3">
              <select
                :value="activeTab"
                @change="setActiveTab(($event.target as HTMLSelectElement).value)"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
              >
                <option
                  v-for="tab in tabs"
                  :key="tab.id"
                  :value="tab.id"
                  class="bg-white text-gray-900"
                >
                  {{ tab.icon }} {{ tab.name }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Tab Content -->
        <div class="bg-white shadow rounded-lg">
          <!-- Basic Info Tab -->
          <div v-if="activeTab === 'basic'" class="p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>

            <!-- Avatar Section -->
            <div class="mb-8">
              <div class="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
              <!-- Avatar Widget -->
              <AvatarWidget
                  :key="avatarKey"
                :initial-avatar="userAvatar"
                :full-photo-url="fullPhotoUrl"
                upload-url="/api/upload-avatar"
                @avatar-updated="handleAvatarUpdated"
                  @avatar-saved="handleAvatarSaved"
                />

                <!-- User Info -->
                <div class="flex-1 text-left w-full">
                  <h4 class="text-sm font-semibold text-gray-900 mb-3">{{ fullName }}</h4>

                  <!-- Additional User Information - Mobile First -->
                  <div class="space-y-3 text-xs text-gray-600 sm:grid sm:grid-cols-2 sm:gap-x-8 sm:gap-y-3">
                    <!-- Mobile: Single Column, Desktop: Two Columns -->
                    <div class="space-y-3">
                      <p v-if="profileForm.gender" class="flex items-start">
                        <span class="w-16 sm:w-20 text-gray-500 flex-shrink-0">Gender:</span>
                        <span class="ml-2">{{ profileForm.gender }}</span>
                      </p>

                      <p v-if="profileForm.birth_date || profileForm.age" class="flex items-start">
                        <span class="w-16 sm:w-20 text-gray-500 flex-shrink-0">Age:</span>
                        <span class="ml-2">{{ profileForm.birth_date || profileForm.age || 'Not specified' }}</span>
                      </p>

                      <p v-if="profileForm.specialization || profileForm.job_title" class="flex items-start">
                        <span class="w-16 sm:w-20 text-gray-500 flex-shrink-0">Specialty:</span>
                        <span class="ml-2">{{ profileForm.specialization || profileForm.job_title || 'Not specified' }}</span>
                      </p>
                    </div>

                    <!-- Right Column (Desktop only) -->
                    <div class="space-y-3">

                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Work Status Section -->
            <div class="border-t pt-6 mt-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Work Status</h3>

              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-600">
                      {{
                        profileForm.status
                          ? 'Active - Available for work'
                          : 'Inactive - Not available for work'
                      }}
                    </p>
                  </div>

                  <!-- Status Toggle -->
                  <div class="flex items-center">
                    <button
                      @click="toggleWorkStatus"
                      :disabled="isUpdating"
                      class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      :class="profileForm.status ? 'bg-blue-600' : 'bg-gray-200'"
                    >
                      <span
                        class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                        :class="profileForm.status ? 'translate-x-6' : 'translate-x-1'"
                      />
                    </button>
                    <span class="ml-3 text-sm font-medium text-gray-900">
                      {{ profileForm.status ? 'Active' : 'Inactive' }}
                    </span>
                  </div>
                </div>

                <!-- Status Description -->
                <div class="bg-gray-50 rounded-lg p-4">
                  <div class="flex">
                    <div class="flex-shrink-0">
                      <svg
                        class="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div class="ml-3">
                      <h4 class="text-sm font-medium text-gray-900">
                        {{ profileForm.status ? 'Active Status' : 'Inactive Status' }}
                      </h4>
                      <p class="text-sm text-gray-600 mt-1">
                        {{
                          profileForm.status
                            ? 'You are currently available for new projects and tasks. Managers can assign work to you.'
                            : 'You are currently not available for new work. You will not receive new project assignments or tasks.'
                        }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Status Change Reason (when setting to inactive) -->
                <div v-if="showInactiveReasonFields" class="space-y-3">
                  <div
                    v-if="showInactiveReasonFields"
                    class="bg-blue-50 border border-blue-200 rounded-md p-3"
                  >
                    <p class="text-sm text-blue-800">
                      <strong>Setting status to Inactive:</strong> Please select a reason and click
                      "Save Inactive Status" to confirm.
                    </p>
                  </div>

                  <label for="status_reason" class="block text-sm font-medium text-gray-700">
                    Reason for being inactive
                  </label>
                  <select
                    id="status_reason"
                    v-model="profileForm.status_reason"
                    class="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a reason</option>
                    <option value="vacation">Vacation / Holiday</option>
                    <option value="sick_leave">Sick Leave</option>
                    <option value="personal_leave">Personal Leave</option>
                    <option value="training">Training / Course</option>
                    <option value="other">Other</option>
                  </select>

                  <label
                    v-if="profileForm.status_reason"
                    for="status_details"
                    class="block text-sm font-medium text-gray-700"
                  >
                    {{
                      profileForm.status_reason === 'other'
                        ? 'Please specify the reason'
                        : 'Additional details (optional)'
                    }}
                  </label>

                  <textarea
                    v-if="profileForm.status_reason"
                    v-model="profileForm.status_details"
                    rows="2"
                    class="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    :placeholder="
                      profileForm.status_reason === 'other'
                        ? 'Please specify the reason...'
                        : 'Additional details (optional)...'
                    "
                  ></textarea>

                  <!-- Inactive Until Date -->
                  <div v-if="profileForm.status_reason" class="space-y-2">
                    <label
                      for="status_end_at"
                      class="block text-sm font-medium text-gray-700"
                    >
                      Unavailable until (optional)
                    </label>
                    <input
                      id="status_end_at"
                      v-model="profileForm.status_end_at"
                      type="date"
                      class="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      :min="new Date().toISOString().split('T')[0]"
                      @click.stop
                      @focus.stop
                      @touchstart.stop
                      @touchend.stop
                      @mousedown.stop
                      @mouseup.stop
                    />
                  </div>

                  <!-- Save Inactive Status Button -->
                  <div
                    v-if="showInactiveReasonFields && profileForm.status_reason"
                    class="flex justify-end space-x-3"
                  >
                    <button
                      @click="showInactiveReasonFields = false"
                      class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      @click="saveInactiveStatus"
                      :disabled="isUpdating"
                      class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      <span v-if="isUpdating">Saving...</span>
                      <span v-else>Save Inactive Status</span>
                    </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Divider -->
        <div class="border-t border-gray-200 my-8"></div>

        <!-- Profile Information -->
          <form @submit.prevent="updateProfile" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- First Name -->
              <div>
                  <label for="first_name" class="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                </label>
                <input
                  id="first_name"
                  v-model="profileForm.first_name"
                  type="text"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your first name"
                />
                <p v-if="validationErrors.first_name" class="mt-1 text-sm text-red-600">
                  {{ validationErrors.first_name }}
                </p>
              </div>

              <!-- Last Name -->
              <div>
                  <label for="last_name" class="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                </label>
                <input
                  id="last_name"
                  v-model="profileForm.last_name"
                  type="text"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your last name"
                />
                <p v-if="validationErrors.last_name" class="mt-1 text-sm text-red-600">
                  {{ validationErrors.last_name }}
                </p>
              </div>

              <!-- Phone -->
              <div>
                  <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  id="phone"
                  v-model="profileForm.phone"
                  type="tel"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="(xxx) xxx-xxxx"
                    @input="formatPhone"
                />
                <p v-if="validationErrors.phone" class="mt-1 text-sm text-red-600">
                  {{ validationErrors.phone }}
                </p>
              </div>

              <!-- Gender -->
              <div>
                <label for="gender" class="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <select
                  id="gender"
                  v-model="profileForm.gender"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                <p v-if="validationErrors.gender" class="mt-1 text-sm text-red-600">
                  {{ validationErrors.gender }}
                </p>
              </div>

              <!-- Date of Birth -->
              <div>
                <label for="birth_date" class="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <input
                  id="birth_date"
                  v-model="profileForm.birth_date"
                  type="date"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p v-if="validationErrors.birth_date" class="mt-1 text-sm text-red-600">
                  {{ validationErrors.birth_date }}
                </p>
              </div>

              <!-- Job Title -->
              <div>
                <label for="job_title" class="block text-sm font-medium text-gray-700 mb-2">
                  Job Title *
                </label>
                <input
                  id="job_title"
                  v-model="profileForm.job_title"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your job title"
                />
                <p v-if="validationErrors.job_title" class="mt-1 text-sm text-red-600">
                  {{ validationErrors.job_title }}
                </p>
              </div>

              <!-- City -->
              <div>
                <label for="city" class="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  id="city"
                  v-model="profileForm.city"
                  type="text"
                  placeholder="Enter your city"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  maxlength="100"
                />
                <p v-if="validationErrors.city" class="mt-1 text-sm text-red-600">
                  {{ validationErrors.city }}
                </p>
              </div>

            </div>

            <!-- Cultural & Language Information section -->
            <div class="border-t pt-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">
                Cultural & Language Information
              </h3>
              <p class="text-sm text-gray-600 mb-6">
                This information helps form effective work teams based on cultural compatibility and language skills.
              </p>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Nationality -->
                <div>
                  <label for="nationality" class="block text-sm font-medium text-gray-700 mb-2">
                    Nationality
                  </label>
                  <input
                    id="nationality"
                    v-model="profileForm.nationality"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your nationality"
                  />
                  <p v-if="validationErrors.nationality" class="mt-1 text-sm text-red-600">
                    {{ validationErrors.nationality }}
                  </p>
                </div>

                <!-- Country of Origin -->
                <div>
                  <label for="country_of_origin" class="block text-sm font-medium text-gray-700 mb-2">
                    Country of Origin
                  </label>
                  <input
                    id="country_of_origin"
                    v-model="profileForm.country_of_origin"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your country of origin"
                  />
                  <p v-if="validationErrors.country_of_origin" class="mt-1 text-sm text-red-600">
                    {{ validationErrors.country_of_origin }}
                  </p>
                </div>

                <!-- Workforce Group -->
                <div class="md:col-span-2">
                  <label for="workforce_group" class="block text-sm font-medium text-gray-700 mb-2">
                    Workforce Group *
                  </label>
                  <select
                    id="workforce_group"
                    v-model="profileForm.workforce_group"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select workforce group</option>
                    <option v-for="group in WORKFORCE_GROUPS" :key="group.value" :value="group.value">
                      {{ group.label }}
                    </option>
                  </select>
                  <p v-if="validationErrors.workforce_group" class="mt-1 text-sm text-red-600">
                    {{ validationErrors.workforce_group }}
                  </p>
                </div>

                <!-- Languages -->
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Languages *
                  </label>
                  <div class="space-y-3">
                    <div v-for="(language, index) in profileForm.languages" :key="index" class="flex items-center space-x-3">
                      <select
                        v-model="language.language_id"
                        class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select language</option>
                        <option v-for="lang in AVAILABLE_LANGUAGES" :key="lang.id" :value="lang.id">
                          {{ lang.name }}
                        </option>
                      </select>
                      <select
                        v-model="language.prof_level"
                        class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Level</option>
                        <option v-for="level in PROFICIENCY_LEVELS" :key="level.value" :value="level.value">
                          {{ level.label }}
                        </option>
                      </select>
                      <button
                        type="button"
                        @click="removeLanguage(index)"
                        class="px-3 py-2 text-red-600 hover:text-red-800 focus:outline-none"
                      >
                        Remove
                      </button>
                  </div>
                    <button
                      type="button"
                      @click="addLanguage"
                      class="px-4 py-2 text-blue-600 hover:text-blue-800 focus:outline-none border border-blue-300 rounded-md"
                    >
                      + Add Language
                    </button>
                  </div>
                  <p v-if="validationErrors.languages" class="mt-1 text-sm text-red-600">
                    {{ validationErrors.languages }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Read-only fields section -->

            <!-- Additional Info -->
            <div>
                <label for="additional_info" class="block text-sm font-medium text-gray-700 mb-2">
                Additional Information
              </label>
              <textarea
                id="additional_info"
                v-model="profileForm.additional_info"
                rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any additional information about yourself"
              ></textarea>
            </div>

            <!-- Submit Button -->
            <div class="flex justify-end">
              <button
                type="submit"
                :disabled="isUpdating"
                class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="isUpdating">Updating...</span>
                <span v-else>Update Profile</span>
              </button>
            </div>
          </form>
        </div>


          <!-- Emergency Tab -->
        <div v-if="activeTab === 'emergency'" class="p-6 max-w-4xl mx-auto">
            <h2 class="text-xl font-semibold text-gray-900 mb-6">Emergency Information</h2>
            <p class="text-gray-600 mb-6">This information will be used in case of emergency situations on the construction site.</p>

            <!-- Emergency Contacts Section -->
            <div class="mb-8">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Emergency Contacts</h3>

              <!-- Primary Contact Row -->
              <div class="mb-4">
                <h4 class="text-md font-medium text-gray-800 mb-3">Primary Contact</h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      v-model="profileForm.emergency_data.primary_contact_name"
                      type="text"
                      placeholder="Full name"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
              </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      v-model="profileForm.emergency_data.primary_contact_phone"
                      type="text"
                      placeholder="(xxx) xxx-xxxx"
                      @input="formatPhone($event, 'primary_contact_phone')"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p v-if="validationErrors.primary_contact_phone" class="mt-1 text-sm text-red-600">{{ validationErrors.primary_contact_phone }}</p>
              </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                    <input
                      v-model="profileForm.emergency_data.primary_contact_relationship"
                      type="text"
                      placeholder="Wife, Mother, Brother, etc."
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                </div>

              <!-- Secondary Contact Row -->
              <div class="mb-4">
                <h4 class="text-md font-medium text-gray-800 mb-3">Secondary Contact (Optional)</h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      v-model="profileForm.emergency_data.secondary_contact_name"
                      type="text"
                      placeholder="Full name"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      v-model="profileForm.emergency_data.secondary_contact_phone"
                      type="text"
                      placeholder="(xxx) xxx-xxxx"
                      @input="formatPhone($event, 'secondary_contact_phone')"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p v-if="validationErrors.secondary_contact_phone" class="mt-1 text-sm text-red-600">{{ validationErrors.secondary_contact_phone }}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                    <input
                      v-model="profileForm.emergency_data.secondary_contact_relationship"
                      type="text"
                      placeholder="Friend, Colleague, etc."
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
              </div>
            </div>
          </div>

            <!-- Medical Information Section -->
            <div class="mb-8">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Medical Information</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Blood Type</label>
                  <input
                    v-model="profileForm.emergency_data.blood_type"
                    type="text"
                    placeholder="A+, B-, O+, AB-, etc."
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
              </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
                  <input
                    v-model="profileForm.emergency_data.allergies"
                    type="text"
                    placeholder="Penicillin, dust, latex, etc."
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Medical Conditions</label>
                  <input
                    v-model="profileForm.emergency_data.medical_conditions"
                    type="text"
                    placeholder="Diabetes, asthma, heart condition, etc."
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Current Medications</label>
                  <input
                    v-model="profileForm.emergency_data.medications"
                    type="text"
                    placeholder="Insulin, aspirin, blood pressure medication, etc."
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
              </div>
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Additional Medical Notes</label>
                <textarea
                    v-model="profileForm.emergency_data.medical_notes"
                  rows="3"
                    placeholder="Any additional medical information that could be important in an emergency..."
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
                </div>
              </div>
              </div>

            <!-- Insurance Information Section -->
            <div class="mb-8">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Insurance Information</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Insurance Company</label>
                  <input
                    v-model="profileForm.emergency_data.insurance_company"
                    type="text"
                    placeholder="Company name"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Policy Number</label>
                  <input
                    v-model="profileForm.emergency_data.policy_number"
                    type="text"
                    placeholder="Policy number"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Emergency Contact at Insurance</label>
                  <input
                    v-model="profileForm.emergency_data.insurance_emergency_contact"
                    type="text"
                    placeholder="Phone number or contact person"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                </div>
              </div>

            <!-- Save Button -->
              <div class="flex justify-end">
                <button
                @click="updateEmergencyData"
                  :disabled="isUpdating"
                class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                {{ isUpdating ? 'Saving...' : 'Save Emergency Information' }}
                </button>
              </div>
          </div>

          <!-- Professional Tab -->
        <div v-if="activeTab === 'professional'" class="p-6 max-w-4xl mx-auto">

            <!-- Work Experience Section -->
            <div class="mb-8">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Work Experience</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Total Years of Experience</label>
                  <input
                    v-model="profileForm.professional_data.total_experience"
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    placeholder="Years"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    @input="cleanNumericInput"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Specialized Experience</label>
                  <input
                    v-model="profileForm.professional_data.specialized_experience"
                    type="text"
                    placeholder="e.g., High-rise construction, residential, commercial"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Previous Employers</label>
                  <textarea
                    v-model="profileForm.professional_data.previous_employers"
                    rows="3"
                    placeholder="List your previous employers and positions..."
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Professional References</label>
                  <textarea
                    v-model="profileForm.professional_data.references"
                    rows="3"
                    placeholder="Name, position, company, contact information..."
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>
              </div>
                </div>

            <!-- Education Section -->
            <div class="mb-8">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Education</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Highest Education Level</label>
                  <select
                    v-model="profileForm.professional_data.education_level"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select education level</option>
                    <option>High School Diploma</option>
                    <option>Trade School/College</option>
                    <option>Apprenticeship Program</option>
                    <option>University Degree</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Institution Name</label>
                  <input
                    v-model="profileForm.professional_data.institution_name"
                    type="text"
                    placeholder="School/College/University name"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Graduation Year</label>
                  <input
                    v-model="profileForm.professional_data.graduation_year"
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    placeholder="YYYY"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    @input="cleanGraduationYear"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Field of Study</label>
                  <input
                    v-model="profileForm.professional_data.field_of_study"
                    type="text"
                    placeholder="e.g., Construction Management, Civil Engineering"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                </div>
              </div>

            <!-- Certifications Section -->
            <div class="mb-8">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Certifications & Licenses</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Red Seal Certification</label>
                  <select
                    v-model="profileForm.professional_data.red_seal"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select status</option>
                    <option>Certified</option>
                    <option>Apprentice</option>
                    <option>Not applicable</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Provincial Trade Certificate</label>
                  <input
                    v-model="profileForm.professional_data.provincial_certificate"
                    type="text"
                    placeholder="Certificate number and province"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Driver's License Class</label>
                  <select
                    v-model="profileForm.professional_data.drivers_license"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select class</option>
                    <option value="G1">G1 (Learner's Permit)</option>
                    <option value="G2">G2 (Probationary)</option>
                    <option value="G">G (Full License)</option>
                    <option value="D">D (Commercial)</option>
                    <option value="A">A (Motorcycle)</option>
                    <option value="none">No license</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Union Membership</label>
                  <input
                    v-model="profileForm.professional_data.union_membership"
                    type="text"
                    placeholder="Union name and local number"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <!-- Safety Certifications Section -->
            <div class="mb-8">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Safety Certifications</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">WHMIS Certificate</label>
                  <select
                    v-model="profileForm.professional_data.whmis"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select status</option>
                    <option>Current</option>
                    <option>Expired</option>
                    <option>Not certified</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">First Aid/CPR</label>
                  <select
                    v-model="profileForm.professional_data.first_aid"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select status</option>
                    <option>Current</option>
                    <option>Expired</option>
                    <option>Not certified</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Fall Protection</label>
                  <select
                    v-model="profileForm.professional_data.fall_protection"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select status</option>
                    <option>Current</option>
                    <option>Expired</option>
                    <option>Not certified</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Confined Space Entry</label>
                  <select
                    v-model="profileForm.professional_data.confined_space"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select status</option>
                    <option>Current</option>
                    <option>Expired</option>
                    <option>Not certified</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Lockout/Tagout</label>
                  <select
                    v-model="profileForm.professional_data.lockout_tagout"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select status</option>
                    <option>Current</option>
                    <option>Expired</option>
                    <option>Not certified</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Other Safety Certifications</label>
                  <textarea
                    v-model="profileForm.professional_data.other_safety"
                    rows="3"
                    placeholder="List other safety certifications..."
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>
              </div>
            </div>

            <!-- Skills & Equipment Section -->
            <div class="mb-8">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Skills & Equipment</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Specialized Skills</label>
                  <textarea
                    v-model="profileForm.professional_data.specialized_skills"
                    rows="3"
                    placeholder="e.g., Welding, electrical work, plumbing, concrete work..."
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Equipment & Tools</label>
                  <textarea
                    v-model="profileForm.professional_data.equipment_tools"
                    rows="3"
                    placeholder="Equipment and tools you can operate..."
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Willing to Travel</label>
                  <select
                    v-model="profileForm.professional_data.travel_willingness"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select option</option>
                    <option>Local only</option>
                    <option>Within province</option>
                    <option>Across Canada</option>
                    <option>International</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                  <select
                    v-model="profileForm.professional_data.availability"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select availability</option>
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Seasonal</option>
                    <option>On-call</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Professional Summary Section -->
            <div class="mb-8">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Professional Summary</h3>
              <div class="grid grid-cols-1 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Professional Summary</label>
                  <textarea
                    v-model="profileForm.professional_data.professional_summary"
                    rows="4"
                    placeholder="Brief description of your professional background, key achievements, and what makes you unique as a construction professional..."
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Key Projects</label>
                  <textarea
                    v-model="profileForm.professional_data.key_projects"
                    rows="3"
                    placeholder="Describe your most significant projects or achievements..."
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>
              </div>
            </div>

            <!-- Save Button -->
              <div class="flex justify-end">
                <button
                @click="updateProfessionalData"
                  :disabled="isUpdating"
                class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                {{ isUpdating ? 'Saving...' : 'Save Professional Information' }}
                </button>
              </div>
          </div>

          <!-- System Tab -->
        <div v-if="activeTab === 'system'" class="p-6 max-w-4xl mx-auto">
            <h2 class="text-xl font-semibold text-gray-900 mb-6">System Settings</h2>
            <p class="text-gray-600 mb-6">Security and account settings</p>

            <!-- 2FA Section -->
            <div class="mb-8">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Two-Factor Authentication</h3>
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-600">
                    {{ authStore.currentUser?.two_factor_enabled ? 'Enabled' : 'Disabled' }}
                  </p>
                </div>
                <button
                  @click="toggleTwoFactor"
                  :disabled="isUpdating"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  :class="authStore.currentUser?.two_factor_enabled ? 'bg-blue-600' : 'bg-gray-200'"
                >
                  <span
                    class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                    :class="
                      authStore.currentUser?.two_factor_enabled ? 'translate-x-6' : 'translate-x-1'
                    "
                  ></span>
                </button>
              </div>
            </div>

            <!-- Change Password Section -->
            <div class="mb-8">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Change Password</h3>

              <!-- Password requirements info -->
              <div class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h4 class="text-sm font-medium text-blue-900 mb-2">Password Requirements:</h4>
                <ul class="text-sm text-blue-800 space-y-1">
                  <li>• Minimum 8 characters</li>
                  <li>• At least one uppercase letter (A-Z)</li>
                  <li>• At least one lowercase letter (a-z)</li>
                  <li>• At least one number (0-9)</li>
                  <li>• At least one special character (@$!%*?&)</li>
                </ul>
              </div>

              <!-- Success/Error messages -->
              <div v-if="successMessage" class="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <p class="text-sm text-green-800">{{ successMessage }}</p>
              </div>
              <div v-if="errorMessage" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p class="text-sm text-red-800">{{ errorMessage }}</p>
              </div>

              <form @submit.prevent="changePassword" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <input
                    v-model="passwordForm.currentPassword"
                    type="password"
                    required
                    autocomplete="off"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <input
                    v-model="passwordForm.newPassword"
                    type="password"
                    required
                    minlength="8"
                    autocomplete="off"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                  <input
                    v-model="passwordForm.confirmPassword"
                    type="password"
                    required
                    autocomplete="off"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Confirm new password"
                  />
                </div>
                <div class="flex justify-end">
                  <button
                    type="submit"
                    :disabled="isUpdating || !isPasswordFormValid"
                    class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {{ isUpdating ? 'Updating...' : 'Change Password' }}
                  </button>
                </div>
              </form>
            </div>

            <!-- Account Information -->
            <div class="mb-8">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="font-medium text-gray-700">Email:</span>
                  <span class="ml-2 text-gray-900">{{ authStore.currentUser?.email }}</span>
                </div>
                <div>
                  <span class="font-medium text-gray-700">Role:</span>
                  <span class="ml-2 text-gray-900">{{ authStore.currentUser?.role_code }}</span>
                </div>
                <div>
                  <span class="font-medium text-gray-700">Status:</span>
                  <span class="ml-2 text-gray-900">{{
                    authStore.currentUser?.status ? 'Active' : 'Inactive'
                  }}</span>
                </div>
                <div>
                  <span class="font-medium text-gray-700">Last Login:</span>
                  <span class="ml-2 text-gray-900">{{
                    authStore.currentUser?.last_login || 'Never'
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useAuthStore } from '@/core/stores/auth'
import { api } from '@/core/utils/api'
import { useProfileStore, WORKFORCE_GROUPS, AVAILABLE_LANGUAGES, PROFICIENCY_LEVELS } from '@/core/stores/profile'
import AvatarWidget from './AvatarWidget.vue'

// Component name
defineOptions({
  name: 'AccountSettings',
})

const authStore = useAuthStore()
const profileStore = useProfileStore()

// User data
const user = computed(() => authStore.currentUser)
const userAvatar = computed(() => {
  return profileStore.profile?.avatar_url || user.value?.avatar_url || '/default-avatar.png'
})

// Password form validation
const isPasswordFormValid = computed(() => {
  return passwordForm.currentPassword.trim() !== '' &&
         passwordForm.newPassword.trim() !== '' &&
         passwordForm.confirmPassword.trim() !== '' &&
         passwordForm.newPassword === passwordForm.confirmPassword &&
         passwordForm.newPassword.length >= 8
})

// State
const isLoading = ref(false)
const isUpdating = ref(false)
const errorMessage = ref('')
const successMessage = ref('')


const avatarKey = ref(0) // For forcing image refresh
const showInactiveReasonFields = ref(false) // New state for showing reason fields

// Tab management
const activeTab = ref<string>('basic')
const tabs = [
  { id: 'basic', name: 'Basic Info', icon: '👤' },
  { id: 'professional', name: 'Professional', icon: '💼' },
  { id: 'emergency', name: 'Emergency', icon: '🚨' },
  { id: 'system', name: 'System', icon: '⚙️' }
]

// Profile form
const profileForm = reactive({
  first_name: '',
  last_name: '',
  phone: '',
  job_title: '',
  additional_info: '',
  status: true,
  status_reason: '',
  status_details: '',
  status_end_at: '',
  // Extended profile fields
  resume: '',
  experience_years: '',
  specialization: 'Civil Engineer',
  certifications: '',
  emergency_contact: '',
  emergency_phone: '',
  skills: '',
  bio: '',
  linkedin_url: '',
  portfolio_url: '',
  // Additional fields
  gender: 'Male',
  birth_date: '1985-03-15',
  age: '39 years old',
  // Cultural and language fields
  nationality: '',
  country_of_origin: '',
  workforce_group: '',
  city: '',
  emergency_data: {} as Record<string, string>,
  professional_data: {
    total_experience: '',
    specialized_experience: '',
    previous_employers: '',
    references: '',
    education_level: '',
    institution_name: '',
    graduation_year: '',
    field_of_study: '',
    red_seal: '',
    provincial_certificate: '',
    drivers_license: '',
    union_membership: '',
    whmis: '',
    first_aid: '',
    fall_protection: '',
    confined_space: '',
    lockout_tagout: '',
    other_safety: '',
    specialized_skills: '',
    equipment_tools: '',
    travel_willingness: '',
    availability: '',
    professional_summary: '',
    key_projects: ''
  } as Record<string, string>,
  languages: [] as Array<{ language_id: number; prof_level: 'Basic' | 'Intermediate' | 'Fluent'; worker_id: number }>,
})

// Password form
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Validation errors
const validationErrors = reactive({
  first_name: '',
  last_name: '',
  phone: '',
  job_title: '',
  gender: '',
  birth_date: '',
  nationality: '',
  country_of_origin: '',
  workforce_group: '',
  city: '',
  languages: '',
  primary_contact_phone: '',
  secondary_contact_phone: '',
})

// Validation rules with proper typing
interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  message?: string
  custom?: (value: unknown) => string
}

const validationRules: Record<string, ValidationRule> = {
  first_name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Zа-яА-Я\s'-]+$/,
  },
  last_name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Zа-яА-Я\s'-]+$/,
  },
  phone: {
    required: true,
    pattern: /^\(\d{3}\) \d{3}-\d{4}$/,
  },
  job_title: {
    required: true,
    maxLength: 100,
  },
  gender: {
    required: true,
  },
  birth_date: {
    required: true,
  },
  nationality: {
    maxLength: 100,
    pattern: /^[a-zA-Zа-яА-Я\s'-]+$/,
  },
  country_of_origin: {
    maxLength: 100,
    pattern: /^[a-zA-Zа-яА-Я\s'-]+$/,
  },
  workforce_group: {
    required: true,
  },
  city: {
    required: true,
    maxLength: 100,
  },
  languages: {
    required: true,
    custom: (value: unknown) => {
      // Only validate if languages are provided
      if (Array.isArray(value) && value.length > 0) {
        // Check if all languages have both language_id and prof_level
        for (const lang of value) {
          if (!lang.language_id || !lang.prof_level) {
            return 'All languages must have both language and proficiency level selected'
          }
        }

        // Check for duplicate languages
        const languageIds = value.map(lang => lang.language_id)
        const uniqueIds = new Set(languageIds)
        if (languageIds.length !== uniqueIds.size) {
          return 'Duplicate languages are not allowed'
        }
      }

      return ''
    }
  },
  // Emergency contact phone validation
  primary_contact_phone: {
    pattern: /^\(\d{3}\) \d{3}-\d{4}$/,
    message: 'Phone must be in format (xxx) xxx-xxxx'
  },
  secondary_contact_phone: {
    pattern: /^\(\d{3}\) \d{3}-\d{4}$/,
    message: 'Phone must be in format (xxx) xxx-xxxx'
  }
}

// Computed properties
const fullName = computed(() => {
  return `${profileForm.first_name} ${profileForm.last_name}`.trim()
})

const fullPhotoUrl = computed(() => {
  return user.value?.full_img_url || user.value?.avatar_url || '/default-avatar.png'
})

// Functions
function validateField(fieldName: string, value: unknown): string {
  const rule = validationRules[fieldName]
  if (!rule) return ''

  // Handle emergency_data phone fields
  if (fieldName === 'primary_contact_phone') {
    const phoneValue = profileForm.emergency_data?.primary_contact_phone || ''
    if (phoneValue && !rule.pattern?.test(phoneValue)) {
      return rule.message || 'Invalid phone format'
    }
    return ''
  }

  if (fieldName === 'secondary_contact_phone') {
    const phoneValue = profileForm.emergency_data?.secondary_contact_phone || ''
    if (phoneValue && !rule.pattern?.test(phoneValue)) {
      return rule.message || 'Invalid phone format'
    }
    return ''
  }

  // console.log(`🔍 Validating ${fieldName}:`, value, 'Rule:', rule)

  // Check required fields
  if (rule.required) {
    if (!value) {
      const fieldNames: Record<string, string> = {
        'first_name': 'First name',
        'last_name': 'Last name',
        'phone': 'Phone number',
        'job_title': 'Job title',
        'gender': 'Gender',
        'birth_date': 'Date of birth',
        'nationality': 'Nationality',
        'country_of_origin': 'Country of origin',
        'workforce_group': 'Workforce group',
        'city': 'City',
        'languages': 'Languages'
      }
      return `${fieldNames[fieldName] || fieldName.replace('_', ' ')} is required`
    }

    // For strings, check if empty after trimming
    if (typeof value === 'string' && !value.trim()) {
      const fieldNames: Record<string, string> = {
        'first_name': 'First name',
        'last_name': 'Last name',
        'phone': 'Phone number',
        'job_title': 'Job title',
        'gender': 'Gender',
        'birth_date': 'Date of birth',
        'nationality': 'Nationality',
        'country_of_origin': 'Country of origin',
        'workforce_group': 'Workforce group',
        'city': 'City',
        'languages': 'Languages'
      }
      return `${fieldNames[fieldName] || fieldName.replace('_', ' ')} is required`
    }

    // For arrays, check if empty
    if (Array.isArray(value) && value.length === 0) {
      const fieldNames: Record<string, string> = {
        'first_name': 'First name',
        'last_name': 'Last name',
        'phone': 'Phone number',
        'job_title': 'Job title',
        'gender': 'Gender',
        'birth_date': 'Date of birth',
        'nationality': 'Nationality',
        'country_of_origin': 'Country of origin',
        'workforce_group': 'Workforce group',
        'city': 'City',
        'languages': 'Languages'
      }
      return `${fieldNames[fieldName] || fieldName.replace('_', ' ')} is required`
    }
  }

  if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
    return `${fieldName.replace('_', ' ')} must be at least ${rule.minLength} characters`
  }

  if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
    return `${fieldName.replace('_', ' ')} must be no more than ${rule.maxLength} characters`
  }

  if (rule.pattern && typeof value === 'string' && value && !rule.pattern.test(value)) {
    if (fieldName === 'phone') {
      return 'Phone number must be in format (xxx) xxx-xxxx'
    }
    return `${fieldName.replace('_', ' ')} format is invalid`
  }

  if (rule.custom) {
    const customError = rule.custom(value)
    if (customError) {
      return customError
    }
  }

  return ''
}

function validateForm(): boolean {
  let isValid = true
  console.log('🔍 Validating form...')

  Object.keys(validationRules).forEach((field) => {
    const value = profileForm[field as keyof typeof profileForm]
    const error = validateField(field, value)
    validationErrors[field as keyof typeof validationErrors] = error
    if (error) {
      console.log(`❌ Validation error for ${field}:`, error, 'Value:', value)
      isValid = false
    } else {
      console.log(`✅ ${field} is valid:`, value)
    }
  })

  console.log('🔍 Form validation result:', isValid)
  return isValid
}

async function updateProfile() {
  console.log('🔄 updateProfile called')
  if (!validateForm()) {
    console.log('❌ Form validation failed')
    errorMessage.value = 'Please fix the validation errors'
    return
  }

  console.log('✅ Form validation passed')
  isUpdating.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    // Фильтруем языки - убираем те, у которых не выбран уровень
    const validLanguages = profileForm.languages.filter(lang =>
      lang.prof_level && lang.prof_level.trim() !== ''
    )

    // Используем profile store для обновления профиля
    const result = await profileStore.updateProfile({
      first_name: profileForm.first_name,
      last_name: profileForm.last_name,
      phone: profileForm.phone,
      job_title: profileForm.job_title,
      additional_info: profileForm.additional_info,
      gender: profileForm.gender,
      birth_date: profileForm.birth_date,
      nationality: profileForm.nationality,
      country_of_origin: profileForm.country_of_origin,
      workforce_group: profileForm.workforce_group,
      city: profileForm.city,
      languages: validLanguages
    })

    console.log('📥 Profile update result:', result)

    if (result.success) {
      console.log('✅ Profile updated successfully')
      successMessage.value = 'Profile updated successfully!'
    } else {
      console.log('❌ Profile update failed:', result.error)
      errorMessage.value = result.error || 'Failed to update profile'
    }
  } catch (error) {
    console.log('❌ Profile update error:', error)
    errorMessage.value = 'Failed to update profile'
  } finally {
    isUpdating.value = false
  }
}

async function updateEmergencyData() {
  console.log('🔄 updateEmergencyData called')
  if (!validateEmergencyForm()) {
    console.log('❌ Emergency form validation failed')
    errorMessage.value = 'Please fix the validation errors'
    return
  }

  isUpdating.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    console.log('📤 Account.vue - emergency data before sending:', profileForm.emergency_data)
    console.log('📤 Account.vue - emergency data JSON:', JSON.stringify(profileForm.emergency_data, null, 2))

    // Construct the JSON payload with named object
    const jsonPayload = {
      data: {
        primary_contact_name: profileForm.emergency_data.primary_contact_name || '',
        primary_contact_phone: profileForm.emergency_data.primary_contact_phone || '',
        primary_contact_relationship: profileForm.emergency_data.primary_contact_relationship || '',
        secondary_contact_name: profileForm.emergency_data.secondary_contact_name || '',
        secondary_contact_phone: profileForm.emergency_data.secondary_contact_phone || '',
        secondary_contact_relationship: profileForm.emergency_data.secondary_contact_relationship || '',
        blood_type: profileForm.emergency_data.blood_type || '',
        allergies: profileForm.emergency_data.allergies || '',
        medical_conditions: profileForm.emergency_data.medical_conditions || '',
        medications: profileForm.emergency_data.medications || '',
        medical_notes: profileForm.emergency_data.medical_notes || '',
        insurance_company: profileForm.emergency_data.insurance_company || '',
        policy_number: profileForm.emergency_data.policy_number || '',
        insurance_emergency_contact: profileForm.emergency_data.insurance_emergency_contact || ''
      }
    }

    console.log('📤 Emergency data JSON payload:', JSON.stringify(jsonPayload, null, 2))

    // Call API directly for now
    const response = await api.put('/api/v1/profile/emergency', jsonPayload)
    console.log('📥 Emergency data update response:', response.data)

    const result = {
      success: response.data.status === 'success',
      data: response.data.data,
      error: response.data.status !== 'success' ? response.data.message : undefined
    }
    console.log('📥 Emergency data update result:', result)

    if (result.success) {
      successMessage.value = 'Emergency data updated successfully'
    } else {
      errorMessage.value = result.error || 'Failed to update emergency data'
    }
  } catch (error) {
    console.log('❌ Emergency data update error:', error)
    errorMessage.value = 'Failed to update emergency data'
  } finally {
    isUpdating.value = false
  }
}

function validateEmergencyForm(): boolean {
  let isValid = true
  console.log('🔍 Validating emergency form...')

  // Validate emergency phone fields
  const emergencyPhoneFields = ['primary_contact_phone', 'secondary_contact_phone']
  emergencyPhoneFields.forEach((field) => {
    const error = validateField(field, null)
    validationErrors[field as keyof typeof validationErrors] = error
    if (error) {
      console.log(`❌ Validation error for ${field}:`, error)
      isValid = false
    } else {
      console.log(`✅ ${field} is valid`)
    }
  })

  console.log('🔍 Emergency form validation result:', isValid)
  return isValid
}

function validateProfessionalData(): boolean {
  let isValid = true
  console.log('🔍 Validating professional data...')

  // Validate numeric fields
  const numericFields = ['total_experience', 'graduation_year']
  numericFields.forEach((field) => {
    const value = profileForm.professional_data[field]
    if (value && value.toString().trim() !== '') {
      const numValue = Number(value)
      if (isNaN(numValue) || numValue < 0) {
        console.log(`❌ Validation error for ${field}: Must be a valid positive number`)
        isValid = false
      }
    }
  })

  // Validate year field specifically
  const graduationYear = profileForm.professional_data.graduation_year
  if (graduationYear && graduationYear.toString().trim() !== '') {
    const year = Number(graduationYear)
    const currentYear = new Date().getFullYear()
    if (isNaN(year) || year < 1900 || year > currentYear + 5) {
      console.log(`❌ Validation error for graduation_year: Must be a valid year between 1900 and ${currentYear + 5}`)
      isValid = false
    }
  }

  // Validate experience field specifically
  const totalExperience = profileForm.professional_data.total_experience
  if (totalExperience && totalExperience.toString().trim() !== '') {
    const experience = Number(totalExperience)
    if (isNaN(experience) || experience < 0 || experience > 100) {
      console.log(`❌ Validation error for total_experience: Must be a valid number between 0 and 100`)
      isValid = false
    }
  }

  console.log('🔍 Professional data validation result:', isValid)
  return isValid
}

async function updateProfessionalData() {
  console.log('🔄 updateProfessionalData called')

  // Validate professional data
  if (!validateProfessionalData()) {
    console.log('❌ Professional data validation failed')
    errorMessage.value = 'Please fix the validation errors'
    return
  }

  // Check if any data is provided
  const hasData = Object.values(profileForm.professional_data).some(value =>
    value && value.toString().trim() !== ''
  )

  if (!hasData) {
    console.log('❌ No professional data provided')
    errorMessage.value = 'Please fill in at least one field before saving'
    return
  }

  isUpdating.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    console.log('📤 Account.vue - professional data before sending:', profileForm.professional_data)
    console.log('📤 Account.vue - professional data JSON:', JSON.stringify(profileForm.professional_data, null, 2))
    console.log('📤 Account.vue - references field value:', profileForm.professional_data.references)

    // Simple atomic fields - NO JSON objects
    const jsonPayload = {
      user_id: user.value?.id || 0,
      total_experience: parseInt(profileForm.professional_data.total_experience) || 0,
      education_level: profileForm.professional_data.education_level || '',
      field_of_study: profileForm.professional_data.field_of_study || '',
      institution_name: profileForm.professional_data.institution_name || '',
      graduation_year: parseInt(profileForm.professional_data.graduation_year) || null,
      professional_summary: profileForm.professional_data.professional_summary || '',
      specialized_skills: profileForm.professional_data.specialized_skills || '',
      specialized_experience: profileForm.professional_data.specialized_experience || '',
      key_projects: profileForm.professional_data.key_projects || '',
      previous_employers: profileForm.professional_data.previous_employers || '',
      references: profileForm.professional_data.references || '',
      availability: profileForm.professional_data.availability || '',
      travel_willingness: profileForm.professional_data.travel_willingness || '',
      drivers_license: profileForm.professional_data.drivers_license || '',
      red_seal: profileForm.professional_data.red_seal || '',
      provincial_certificate: profileForm.professional_data.provincial_certificate || '',
      union_membership: profileForm.professional_data.union_membership || '',
      equipment_tools: profileForm.professional_data.equipment_tools || '',
      whmis: profileForm.professional_data.whmis || '',
      first_aid: profileForm.professional_data.first_aid || '',
      fall_protection: profileForm.professional_data.fall_protection || '',
      confined_space: profileForm.professional_data.confined_space || '',
      lockout_tagout: profileForm.professional_data.lockout_tagout || '',
      other_safety: profileForm.professional_data.other_safety || ''
    }

    console.log('📤 Professional data JSON payload:', JSON.stringify(jsonPayload, null, 2))

    // Call API directly
    const response = await api.put('/api/v1/profile/professional', jsonPayload)
    console.log('📥 Professional data update response:', response.data)

    const result = {
      success: response.data.status === 'success',
      data: response.data.data,
      error: response.data.status !== 'success' ? response.data.message : undefined
    }
    console.log('📥 Professional data update result:', result)

    if (result.success) {
      successMessage.value = 'Professional data updated successfully'
    } else {
      errorMessage.value = result.error || 'Failed to update professional data'
    }
  } catch (error) {
    console.log('❌ Professional data update error:', error)
    errorMessage.value = 'Failed to update professional data'
  } finally {
    isUpdating.value = false
  }
}

function setActiveTab(tabId: string) {
  activeTab.value = tabId
}

// Clean numeric input - SIMPLE AND EFFECTIVE
function cleanNumericInput(event: Event) {
  const target = event.target as HTMLInputElement
  let value = target.value

  // Remove ALL non-numeric characters
  value = value.replace(/[^0-9]/g, '')

  // Limit to 3 digits for experience
  if (value.length > 3) {
    value = value.slice(0, 3)
  }

  // Limit to 100
  const numValue = parseInt(value)
  if (numValue > 100) {
    value = '100'
  }

  // Update the field immediately
  profileForm.professional_data.total_experience = value
}

// Clean graduation year input
function cleanGraduationYear(event: Event) {
  const target = event.target as HTMLInputElement
  let value = target.value

  // Remove ALL non-numeric characters
  value = value.replace(/[^0-9]/g, '')

  // Limit to 4 digits for year
  if (value.length > 4) {
    value = value.slice(0, 4)
  }

  // Update the field immediately
  profileForm.professional_data.graduation_year = value
}

// Load professional data from GET /api/v1/profile/professional
async function loadProfessionalData() {
  try {
    console.log('📥 Loading professional data from /api/v1/profile/professional')
    const response = await api.get('/api/v1/profile/professional')

    if (response.data && response.data.data) {
      const professionalData = response.data.data
      console.log('📥 Professional data from server:', professionalData)
      console.log('📥 References from server:', professionalData.references)

      // Convert server data to form values
      profileForm.professional_data = convertServerToForm(professionalData)
      console.log('📥 Mapped professional data to form:', profileForm.professional_data)
      console.log('📥 Mapped references to form:', profileForm.professional_data.references)
    } else {
      console.log('📥 No professional data found, initializing empty structure')
      initializeEmptyProfessionalData()
    }
  } catch (error) {
    console.log('❌ Error loading professional data:', error)
    initializeEmptyProfessionalData()
  }
}

// Convert server values to form keys (for loading)
function convertServerToForm(serverData: Record<string, unknown>) {
  return {
    total_experience: String(serverData.total_experience || ''),
    education_level: String(serverData.education_level || ''),
    field_of_study: String(serverData.field_of_study || ''),
    institution_name: String(serverData.institution_name || ''),
    graduation_year: String(serverData.graduation_year || ''),
    professional_summary: String(serverData.professional_summary || ''),
    specialized_skills: String(serverData.specialized_skills || ''),
    specialized_experience: String(serverData.specialized_experience || ''),
    key_projects: String(serverData.key_projects || ''),
    previous_employers: String(serverData.previous_employers || ''),
    references: String(serverData.references || ''),
    availability: String(serverData.availability || ''),
    travel_willingness: String(serverData.travel_willingness || ''),
    drivers_license: String(serverData.drivers_license || ''),
    red_seal: String(serverData.red_seal || ''),
    provincial_certificate: String(serverData.provincial_certificate || ''),
    union_membership: String(serverData.union_membership || ''),
    equipment_tools: String(serverData.equipment_tools || ''),
    whmis: String(serverData.whmis || ''),
    first_aid: String(serverData.first_aid || ''),
    fall_protection: String(serverData.fall_protection || ''),
    confined_space: String(serverData.confined_space || ''),
    lockout_tagout: String(serverData.lockout_tagout || ''),
    other_safety: String(serverData.other_safety || '')
  }
}

// Initialize empty professional data structure
function initializeEmptyProfessionalData() {
  profileForm.professional_data = {
    total_experience: '',
    education_level: '',
    field_of_study: '',
    institution_name: '',
    graduation_year: '',
    professional_summary: '',
    specialized_skills: '',
    specialized_experience: '',
    key_projects: '',
    previous_employers: '',
    references: '',
    availability: '',
    travel_willingness: '',
    drivers_license: '',
    red_seal: '',
    provincial_certificate: '',
    union_membership: '',
    equipment_tools: '',
    whmis: '',
    first_aid: '',
    fall_protection: '',
    confined_space: '',
    lockout_tagout: '',
    other_safety: ''
  }
}

// Phone formatting function
function formatPhone(event: Event, fieldName?: string) {
  const target = event.target as HTMLInputElement
  let value = target.value.replace(/\D/g, '') // Remove all non-digits

  if (value.length >= 6) {
    value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`
  } else if (value.length >= 3) {
    value = `(${value.slice(0, 3)}) ${value.slice(3)}`
  } else if (value.length > 0) {
    value = `(${value}`
  }

  if (fieldName === 'primary_contact_phone') {
    profileForm.emergency_data.primary_contact_phone = value
  } else if (fieldName === 'secondary_contact_phone') {
    profileForm.emergency_data.secondary_contact_phone = value
  } else {
    profileForm.phone = value
  }
}



// Language management functions
function addLanguage() {
  console.log('🔍 Adding new language')
  profileForm.languages.push({
    language_id: 0,
    prof_level: 'Basic' as 'Basic' | 'Intermediate' | 'Fluent',
    worker_id: authStore.currentUser?.id || 0
  })
  console.log('🔍 Languages after adding:', profileForm.languages)
}

function removeLanguage(index: number) {
  profileForm.languages.splice(index, 1)
}

// Avatar functions
function handleAvatarUpdated(avatarData: { croppedAvatar: string; fullImage: string } | string) {
  try {
    if (typeof avatarData === 'string') {
      // Old format - just avatar URL
      if (authStore.currentUser) {
        authStore.currentUser.avatar_url = avatarData
        localStorage.setItem('user', JSON.stringify(authStore.currentUser))
      }
    } else {
      // New format - object with croppedAvatar and fullImage
      if (authStore.currentUser) {
        authStore.currentUser.avatar_url = avatarData.croppedAvatar
        ;(authStore.currentUser as { full_img_url?: string }).full_img_url = avatarData.fullImage
        localStorage.setItem('user', JSON.stringify(authStore.currentUser))
      }
    }

    successMessage.value = 'Avatar updated successfully!'
    avatarKey.value++

  } catch (error) {
    // Проверяем, если ошибка связана с размером файла
    if (error instanceof Error && error.message.includes('File size too large')) {
      errorMessage.value = 'Image file is too large. Please try with a smaller image or crop it more.'
    } else {
      errorMessage.value = 'Failed to update avatar'
    }
  }
}

async function handleAvatarSaved(avatarData: { croppedAvatar: string; fullImage: string }) {
  try {
    if (authStore.currentUser) {
        authStore.currentUser.avatar_url = avatarData.croppedAvatar
      ;(authStore.currentUser as { full_img_url?: string }).full_img_url = avatarData.fullImage
      localStorage.setItem('user', JSON.stringify(authStore.currentUser))
    }

    successMessage.value = 'Avatar updated successfully!'
    avatarKey.value++

  } catch (error) {

    // Проверяем, если ошибка связана с размером файла
    if (error instanceof Error && error.message.includes('File size too large')) {
      errorMessage.value = 'Image file is too large. Please try with a smaller image or crop it more.'
    } else {
      errorMessage.value = 'Failed to update avatar'
    }
  }
}


// 2FA functions
async function toggleTwoFactor() {
  isUpdating.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    console.log('🔄 Toggling 2FA for user:', authStore.currentUser?.id)
    const newValue = !authStore.currentUser?.two_factor_enabled
    console.log('🔄 Current value:', authStore.currentUser?.two_factor_enabled)
    console.log('🔄 New value:', newValue)
    console.log('🔄 Sending to:', 'POST /api/v1/2fa/toggle')
    console.log('🔄 Payload:', { enabled: newValue })

    const response = await api.post('/api/v1/2fa/toggle', {
      enabled: newValue
    })

    console.log('📥 Full response:', response)
    console.log('📥 Response status:', response.status)
    console.log('📥 Response data:', response.data)
    console.log('📥 Response data type:', typeof response.data)

    // Expected format: { status: 'success', message: '...', data: { two_factor_enabled: true/false } }
    if (response.data && response.data.status === 'success') {
      if (authStore.currentUser) {
        authStore.currentUser.two_factor_enabled = newValue
      }
      successMessage.value = response.data.message || `Two-factor authentication ${newValue ? 'enabled' : 'disabled'}`
      console.log('✅ 2FA toggled successfully')
    } else {
      throw new Error(response.data?.message || 'Failed to update 2FA')
    }

  } catch (error) {
    console.error('❌ Error toggling 2FA:', error)
    const apiError = error as { response?: { status?: number; data?: { status?: string; message?: string } } }

    // Check if error response has status 'error'
    if (apiError.response?.data?.status === 'error') {
      errorMessage.value = apiError.response.data.message || 'Failed to update two-factor authentication'
    } else {
      errorMessage.value = apiError.response?.data?.message || 'Failed to update two-factor authentication'
    }
  } finally {
    isUpdating.value = false
  }
}

// Password change function
async function changePassword() {
  isUpdating.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    console.log('🔄 Changing password for user:', authStore.currentUser?.id)
    console.log('🔍 AuthStore methods:', Object.keys(authStore))
    console.log('🔍 All authStore properties:', authStore)
    console.log('🔍 changePassword function exists:', typeof (authStore as any).changePassword)

    // Temporary workaround - call API directly
    console.log('🔧 Using direct API call as workaround')

    // Validate passwords match
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      throw new Error('New passwords do not match')
    }

    // Validate password strength
    const password = passwordForm.newPassword
    const errors = []

    if (password.length < 8) {
      errors.push('at least 8 characters')
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('at least one uppercase letter (A-Z)')
    }

    if (!/[a-z]/.test(password)) {
      errors.push('at least one lowercase letter (a-z)')
    }

    if (!/[0-9]/.test(password)) {
      errors.push('at least one number (0-9)')
    }

    if (!/[@$!%*?&]/.test(password)) {
      errors.push('at least one special character (@$!%*?&)')
    }

    if (errors.length > 0) {
      throw new Error(`Password must contain: ${errors.join(', ')}`)
    }

    const response = await api.post('/api/v1/profile/change-password', {
      current_password: passwordForm.currentPassword,
      new_password: passwordForm.newPassword,
      confirm_password: passwordForm.confirmPassword,
    })

    console.log('✅ Change password response:', response.data)

    const result = {
      success: response.data.status === 'success',
      error: response.data.status !== 'success' ? response.data.message : undefined
    }

    if (result.success) {
      successMessage.value = 'Password changed successfully'
      // Clear form
      passwordForm.currentPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
      console.log('✅ Password changed successfully')

      // Auto-clear success message after 5 seconds
      setTimeout(() => {
        successMessage.value = ''
      }, 5000)
    } else {
      errorMessage.value = result.error || 'Failed to change password'
      console.log('❌ Password change failed:', result.error)

      // Auto-clear error after 10 seconds
      setTimeout(() => {
        errorMessage.value = ''
      }, 10000)
    }
  } catch (error) {
    console.error('❌ Error changing password:', error)
    errorMessage.value = 'An unexpected error occurred while changing password'

    // Auto-clear error after 10 seconds
    setTimeout(() => {
      errorMessage.value = ''
    }, 10000)
  } finally {
    isUpdating.value = false
  }
}

// Work status functions
async function toggleWorkStatus() {
  const newStatus = !profileForm.status
  console.log('🔄 toggleWorkStatus called, newStatus:', newStatus)

  if (newStatus) {
    // Setting to active - automatically save
    console.log('🔄 Setting to active, calling saveActiveStatus')
    await saveActiveStatus()
  } else {
    // Setting to inactive - show reason fields
    console.log('🔄 Setting to inactive, showing reason fields')
    profileForm.status = false
    showInactiveReasonFields.value = true
  }
}

async function saveActiveStatus() {
  console.log('🔄 saveActiveStatus called')
  isUpdating.value = true
  try {
    // Используем profile store для обновления статуса
    const result = await profileStore.updateWorkStatus({
      status: true,
      status_reason: '',
      status_details: '',
      status_end_at: ''
    })

    if (result.success) {
      // Обновляем локальное состояние
      profileForm.status = true
      showInactiveReasonFields.value = false
      successMessage.value = 'Status updated to active'
    } else {
      errorMessage.value = result.error || 'Failed to update status'
    }
  } catch {
    errorMessage.value = 'Failed to update status'
  } finally {
    isUpdating.value = false
  }
}

async function saveInactiveStatus() {
  isUpdating.value = true
  try {
    // Используем profile store для обновления статуса
    const result = await profileStore.updateWorkStatus({
      status: false,
      status_reason: profileForm.status_reason,
      status_details: profileForm.status_details,
      status_end_at: profileForm.status_end_at
    })

    if (result.success) {
      // Обновляем локальное состояние
      profileForm.status = false
      showInactiveReasonFields.value = false
      successMessage.value = 'Status updated to inactive'
    } else {
      errorMessage.value = result.error || 'Failed to update status'
    }
  } catch {
    errorMessage.value = 'Failed to update status'
  } finally {
    isUpdating.value = false
  }
}

// Load user data
onMounted(async () => {
  isLoading.value = true
  try {
    // Загружаем полный профиль с сервера
    const response = await api.get('/api/v1/profile')

    if (response.data && response.data.data && response.data.data.user) {
      const userData = response.data.data.user

      console.log('📥 Server response data:', userData)
      console.log('📥 dob from server:', userData.dob)

      // Заполняем форму данными с сервера
      profileForm.first_name = userData.first_name || ''
      profileForm.last_name = userData.last_name || ''
      profileForm.phone = userData.phone || ''
      profileForm.job_title = userData.job_title || ''
      profileForm.status = userData.status
      profileForm.gender = userData.gender || ''
      profileForm.birth_date = userData.dob || ''
      profileForm.age = userData.age || ''
      profileForm.specialization = userData.specialization || ''
      profileForm.nationality = userData.nationality || ''
      profileForm.country_of_origin = userData.country_of_origin || ''
      profileForm.workforce_group = userData.workforce_group || ''
      profileForm.city = userData.city || ''
      // Load emergency data
      console.log('📥 Emergency data from server:', userData.emergency)
      if (userData.emergency) {
        // If emergency is a JSON string, parse it
        if (typeof userData.emergency === 'string') {
          try {
            profileForm.emergency_data = JSON.parse(userData.emergency)
            console.log('📥 Parsed emergency data:', profileForm.emergency_data)
          } catch (error) {
            console.log('❌ Error parsing emergency data:', error)
            profileForm.emergency_data = {}
          }
        } else {
          profileForm.emergency_data = userData.emergency
        }
      } else {
        profileForm.emergency_data = {}
      }

      // Load professional data from separate endpoint
      await loadProfessionalData()

      profileForm.languages = userData.languages || []


      // Обновляем authStore с полными данными пользователя
      if (authStore.currentUser) {
        authStore.currentUser.first_name = userData.first_name || ''
        authStore.currentUser.last_name = userData.last_name || ''
        authStore.currentUser.phone = userData.phone || ''
        authStore.currentUser.job_title = userData.job_title || ''
        authStore.currentUser.gender = userData.gender || ''
        authStore.currentUser.birth_date = userData.dob || ''
        authStore.currentUser.age = userData.age || ''
        authStore.currentUser.specialization = userData.specialization || ''
        authStore.currentUser.two_factor_enabled = userData.two_factor_enabled || false

        console.log('📥 Updated 2FA status in authStore:', authStore.currentUser.two_factor_enabled)

        // Обновляем URL изображений, если они есть
        if (userData.avatar_url) {
          authStore.currentUser.avatar_url = userData.avatar_url.startsWith('http')
            ? userData.avatar_url
            : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${userData.avatar_url}`
        }
        if (userData.full_img_url) {
          authStore.currentUser.full_img_url = userData.full_img_url.startsWith('http')
            ? userData.full_img_url
            : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${userData.full_img_url}`
        }

        // Сохраняем обновленные данные в localStorage
        localStorage.setItem('user', JSON.stringify(authStore.currentUser))
      }

    } else {
      // Fallback to authStore data
      if (authStore.currentUser) {
        // Разбиваем name на first_name и last_name
        const fullName = authStore.currentUser.name || ''
        const nameParts = fullName.split(' ')
        profileForm.first_name = nameParts[0] || ''
        profileForm.last_name = nameParts.slice(1).join(' ') || ''
        profileForm.phone = authStore.currentUser.phone || ''
        profileForm.job_title = authStore.currentUser.job_title || ''
        profileForm.status = authStore.currentUser.status ?? true
      }
    }
  } catch (error) {
    console.error('❌ Failed to load user profile:', error)
    errorMessage.value = 'Failed to load user data'

    // Fallback to authStore data
    if (authStore.currentUser) {
      const fullName = authStore.currentUser.name || ''
      const nameParts = fullName.split(' ')
      profileForm.first_name = nameParts[0] || ''
      profileForm.last_name = nameParts.slice(1).join(' ') || ''
      profileForm.phone = authStore.currentUser.phone || ''
      profileForm.job_title = authStore.currentUser.job_title || ''
      profileForm.status = authStore.currentUser.status ?? true
    }
  } finally {
    isLoading.value = false
  }
})

// Watch for tab changes to clear messages
watch(activeTab, () => {
  errorMessage.value = ''
  successMessage.value = ''
})

// Watch for inactive reason changes
watch(() => profileForm.status_reason, (newReason) => {
  if (!newReason) {
    profileForm.status_details = ''
    profileForm.status_end_at = ''
  }
})

// Watch for total_experience changes and force numeric only
watch(() => profileForm.professional_data.total_experience, (newValue) => {
  if (newValue && typeof newValue === 'string') {
    const numericOnly = newValue.replace(/[^0-9]/g, '')
    if (numericOnly !== newValue) {
      profileForm.professional_data.total_experience = numericOnly
    }
    // Limit to 3 digits
    if (numericOnly.length > 3) {
      profileForm.professional_data.total_experience = numericOnly.slice(0, 3)
    }
    // Limit to 100
    const numValue = parseInt(numericOnly)
    if (numValue > 100) {
      profileForm.professional_data.total_experience = '100'
    }
  }
})

// Watch for graduation_year changes and force numeric only
watch(() => profileForm.professional_data.graduation_year, (newValue) => {
  if (newValue && typeof newValue === 'string') {
    const numericOnly = newValue.replace(/[^0-9]/g, '')
    if (numericOnly !== newValue) {
      profileForm.professional_data.graduation_year = numericOnly
    }
    // Limit to 4 digits
    if (numericOnly.length > 4) {
      profileForm.professional_data.graduation_year = numericOnly.slice(0, 4)
    }
  }
})
</script>

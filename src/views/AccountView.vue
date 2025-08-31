<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import TwoFactorSetup from '@/components/TwoFactorSetup.vue'

const authStore = useAuthStore()
const activeTab = ref('profile')

// Profile data
const profileForm = ref({
  firstName: authStore.currentUser?.name?.split(' ')[0] || '',
  lastName: authStore.currentUser?.name?.split(' ').slice(1).join(' ') || '',
  email: authStore.currentUser?.email || '',
  phone: '', // Not in current user model
  jobTitle: '', // Not in current user model
  userType: authStore.currentUser?.role || '',
  status: authStore.currentUser?.isActive ? 'active' : 'inactive',
  additionalInfo: '' // Not in current user model
})

// Добавим опции для типа пользователя
const userTypeOptions = [
  'Architect',
  'Project Manager',
  'General Contractor',
  'Trade Contractor',
  'Client'
]

const isEditing = ref(false)
const avatarFile = ref<File | null>(null)
const avatarPreview = ref('')
const showTwoFactorSetup = ref(false)

// Settings data
const settingsForm = ref({
  notifications: true,
  emailUpdates: true,
  language: 'en',
  timezone: 'UTC'
})

function switchTab(tab: string) {
  activeTab.value = tab
}

function saveProfile() {
  // TODO: API call to save profile
  console.log('Saving profile:', profileForm.value)
  isEditing.value = false
}

function cancelEdit() {
  // Reset form to original values
  profileForm.value = {
    firstName: authStore.currentUser?.name?.split(' ')[0] || '',
    lastName: authStore.currentUser?.name?.split(' ').slice(1).join(' ') || '',
    email: authStore.currentUser?.email || '',
    phone: '',
    jobTitle: '',
    userType: authStore.currentUser?.role || '',
    status: authStore.currentUser?.isActive ? 'active' : 'inactive',
    additionalInfo: ''
  }
  isEditing.value = false
}

function handleAvatarUpload(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    avatarFile.value = target.files[0]
    avatarPreview.value = URL.createObjectURL(target.files[0])
  }
}

function toggleStatus() {
  profileForm.value.status = profileForm.value.status === 'active' ? 'inactive' : 'active'
}

function saveSettings() {
  // TODO: API call to save settings
  console.log('Saving settings:', settingsForm.value)
}

function openTwoFactorSetup() {
  showTwoFactorSetup.value = true
}

function closeTwoFactorSetup() {
  showTwoFactorSetup.value = false
}

function onTwoFactorSuccess() {
  showTwoFactorSetup.value = false
  // Обновить статус 2FA в профиле
  if (authStore.currentUser) {
    authStore.currentUser.twoFactorEnabled = true
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Account Settings</h1>
        <p class="mt-2 text-sm text-gray-600">Manage your account information and preferences</p>
      </div>

      <!-- Tabs -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div class="border-b border-gray-200">
          <nav class="flex space-x-8 px-6" aria-label="Tabs">
            <button
              @click="switchTab('profile')"
              :class="[
                'py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200',
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              <div class="flex items-center space-x-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Profile</span>
              </div>
            </button>
            <button
              @click="switchTab('settings')"
              :class="[
                'py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200',
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              <div class="flex items-center space-x-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Settings</span>
              </div>
            </button>
          </nav>
        </div>

        <!-- Tab Content -->
        <div class="p-6">
          <!-- Profile Tab -->
          <div v-if="activeTab === 'profile'" class="space-y-8">
            <!-- Avatar Section -->
            <div class="flex items-center space-x-6">
              <div class="relative">
                <div class="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <img
                    v-if="avatarPreview"
                    :src="avatarPreview"
                    alt="Avatar preview"
                    class="w-24 h-24 rounded-full object-cover"
                  />
                  <span v-else class="text-white text-2xl font-semibold">
                    {{ profileForm.firstName.charAt(0) }}{{ profileForm.lastName.charAt(0) }}
                  </span>
                </div>
                <div v-if="isEditing" class="absolute -bottom-1 -right-1">
                  <label class="bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <input
                      type="file"
                      accept="image/*"
                      @change="handleAvatarUpload"
                      class="hidden"
                    />
                  </label>
                </div>
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-gray-900">{{ profileForm.firstName }} {{ profileForm.lastName }}</h3>
                <p class="text-sm text-gray-500">{{ profileForm.jobTitle || 'No job title' }}</p>
                <div class="mt-2">
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      profileForm.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    ]"
                  >
                    {{ profileForm.status === 'active' ? 'Active' : 'Inactive' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Profile Form -->
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input
                  v-model="profileForm.firstName"
                  type="text"
                  :disabled="!isEditing"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                  placeholder="Enter your first name"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input
                  v-model="profileForm.lastName"
                  type="text"
                  :disabled="!isEditing"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                  placeholder="Enter your last name"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  v-model="profileForm.email"
                  type="email"
                  :disabled="!isEditing"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  v-model="profileForm.phone"
                  type="tel"
                  :disabled="!isEditing"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                <input
                  v-model="profileForm.jobTitle"
                  type="text"
                  :disabled="!isEditing"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                  placeholder="Enter your job title"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">User Type</label>
                <select
                  v-model="profileForm.userType"
                  :disabled="!isEditing"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                >
                  <option value="">Select user type</option>
                  <option v-for="type in userTypeOptions" :key="type" :value="type">
                    {{ type }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Account Status</label>
                <button
                  @click="toggleStatus"
                  :disabled="!isEditing"
                  class="w-full px-4 py-3 border rounded-lg text-left transition-all duration-200"
                  :class="{
                    'bg-green-50 border-green-200 text-green-800 hover:bg-green-100': profileForm.status === 'active',
                    'bg-red-50 border-red-200 text-red-800 hover:bg-red-100': profileForm.status === 'inactive',
                    'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed': !isEditing
                  }"
                >
                  <div class="flex items-center justify-between">
                    <span class="font-medium">{{ profileForm.status === 'active' ? 'Active' : 'Inactive' }}</span>
                    <svg v-if="isEditing" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    </svg>
                  </div>
                </button>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Two-Factor Authentication</label>
                <div class="flex items-center justify-between p-4 border border-gray-300 rounded-lg">
                  <div>
                    <p class="font-medium">
                      {{ authStore.currentUser?.twoFactorEnabled ? 'Enabled' : 'Disabled' }}
                    </p>
                    <p class="text-sm text-gray-500">
                      {{ authStore.currentUser?.twoFactorEnabled ? 'SMS verification required' : 'No additional security' }}
                    </p>
                  </div>
                  <button
                    v-if="!authStore.currentUser?.twoFactorEnabled"
                    @click="openTwoFactorSetup"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Enable 2FA
                  </button>
                  <span
                    v-else
                    class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                  >
                    Active
                  </span>
                </div>
              </div>

              <div class="sm:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Additional Information
                  <span class="text-gray-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  v-model="profileForm.additionalInfo"
                  :disabled="!isEditing"
                  rows="4"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors resize-none"
                  placeholder="Tell us about your skills, experience, specializations, certifications, or any other relevant information that would help in project team selection..."
                ></textarea>
                <p class="mt-2 text-sm text-gray-500">
                  This information will be visible to administrators when forming project teams.
                </p>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                v-if="!isEditing"
                @click="isEditing = true"
                class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Edit Profile
              </button>
              <template v-else>
                <button
                  @click="cancelEdit"
                  class="bg-white text-gray-700 px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  @click="saveProfile"
                  class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Save Changes
                </button>
              </template>
            </div>
          </div>

          <!-- Settings Tab -->
          <div v-if="activeTab === 'settings'" class="space-y-8">
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <!-- Notifications -->
              <div class="bg-gray-50 rounded-lg p-6">
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <h4 class="text-lg font-medium text-gray-900">Push Notifications</h4>
                    <p class="text-sm text-gray-600">Receive real-time updates about your projects</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input
                      v-model="settingsForm.notifications"
                      type="checkbox"
                      class="sr-only peer"
                    />
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <!-- Email Updates -->
              <div class="bg-gray-50 rounded-lg p-6">
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <h4 class="text-lg font-medium text-gray-900">Email Updates</h4>
                    <p class="text-sm text-gray-600">Get important updates via email</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input
                      v-model="settingsForm.emailUpdates"
                      type="checkbox"
                      class="sr-only peer"
                    />
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <!-- Language -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Language</label>
                <select
                  v-model="settingsForm.language"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>

              <!-- Timezone -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                <select
                  v-model="settingsForm.timezone"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="UTC">UTC</option>
                  <option value="EST">Eastern Time</option>
                  <option value="PST">Pacific Time</option>
                  <option value="CET">Central European Time</option>
                </select>
              </div>
            </div>

            <!-- Save Button -->
            <div class="flex justify-end pt-6 border-t border-gray-200">
              <button
                @click="saveSettings"
                class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Two-Factor Setup Dialog -->
    <TwoFactorSetup
      :is-open="showTwoFactorSetup"
      @close="closeTwoFactorSetup"
      @success="onTwoFactorSuccess"
    />
  </div>
</template>

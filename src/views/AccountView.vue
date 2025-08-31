<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import TwoFactorDialog from '@/components/TwoFactorDialog.vue'
import ImageCropper from '@/components/ImageCropper.vue'

const authStore = useAuthStore()

// State
const isLoading = ref(false)
const isUpdating = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const showTwoFactorDialog = ref(false)
const showDisable2FADialog = ref(false)
const showAvatarEditor = ref(false)
const showImageCropper = ref(false)
const disable2FACode = ref('')
const avatarKey = ref(0) // For forcing image refresh

// Profile form
const profileForm = reactive({
  first_name: '',
  last_name: '',
  phone: '',
  job_title: '',
  additional_info: '',
})

// Computed
const fullName = computed(() => {
  return `${profileForm.first_name} ${profileForm.last_name}`.trim() || 'Not specified'
})

const userAvatar = computed(() => {
  // Check if user has avatar URL from backend
  if (authStore.currentUser?.avatarUrl) {
    return authStore.currentUser.avatarUrl
  }

  // Fallback to default avatar or empty
  return ''
})

const hasAvatar = computed(() => {
  return !!userAvatar.value
})

const isLocalAvatar = computed(() => {
  return userAvatar.value?.startsWith('data:')
})

// Load profile data
async function loadProfile() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const result = await authStore.getProfile()

    if (result.success && result.user) {
      // Populate form with user data
      profileForm.first_name = result.user.name.split(' ')[0] || ''
      profileForm.last_name = result.user.name.split(' ').slice(1).join(' ') || ''
      profileForm.phone = '' // Will be populated from backend
      profileForm.job_title = '' // Will be populated from backend
      profileForm.additional_info = '' // Will be populated from backend

      console.log('✅ Profile loaded successfully')
      console.log('👤 User data:', result.user)
      console.log('🖼️ Avatar URL from profile:', result.user?.avatarUrl)
    } else {
      errorMessage.value = result.error || 'Failed to load profile'
      console.log('❌ Failed to load profile:', result.error)
    }
  } catch (error) {
    console.error('❌ Load profile error:', error)
    errorMessage.value = 'Failed to load profile'
  } finally {
    isLoading.value = false
  }
}

// Update profile
async function updateProfile() {
  isUpdating.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const result = await authStore.updateProfile({
      first_name: profileForm.first_name,
      last_name: profileForm.last_name,
      phone: profileForm.phone,
      job_title: profileForm.job_title,
      additional_info: profileForm.additional_info,
    })

    if (result.success) {
      successMessage.value = 'Profile updated successfully!'
      console.log('✅ Profile updated successfully')
    } else {
      errorMessage.value = result.error || 'Failed to update profile'
      console.log('❌ Failed to update profile:', result.error)
    }
  } catch (error) {
    console.error('❌ Update profile error:', error)
    errorMessage.value = 'Failed to update profile'
  } finally {
    isUpdating.value = false
  }
}

// Avatar editor functions
function closeAvatarEditor() {
  showAvatarEditor.value = false
}

async function saveAvatarFromEditor(avatarDataUrl: string) {
  try {
    console.log('🔄 Starting avatar save from editor...')
    console.log('📄 Avatar data URL received, length:', avatarDataUrl.length)

        // Store data URL directly in localStorage and update user
    if (authStore.currentUser) {
      authStore.currentUser.avatarUrl = avatarDataUrl
      localStorage.setItem('user', JSON.stringify(authStore.currentUser))

      console.log('✅ Avatar saved as data URL')
      successMessage.value = 'Avatar updated successfully!'
      showAvatarEditor.value = false

      // Force image refresh
      avatarKey.value++

      // Force re-render
      console.log('🔄 Current user avatar after update:', authStore.currentUser.avatarUrl)
    } else {
      errorMessage.value = 'User not found'
    }
  } catch (error) {
    console.error('❌ Save avatar error:', error)
    errorMessage.value = 'Failed to save avatar'
  }
}

// Image Cropper functions
function openImageCropper() {
  showImageCropper.value = true
}

async function handleImageCrop(file: File) {
  try {
    console.log('🔄 Starting avatar save from cropper...')
    console.log('📄 Cropped file received:', file.name, file.size, file.type)

    // Convert file to data URL
    const reader = new FileReader()
    reader.onload = (e) => {
      const avatarDataUrl = e.target?.result as string

      if (authStore.currentUser) {
        authStore.currentUser.avatarUrl = avatarDataUrl
        localStorage.setItem('user', JSON.stringify(authStore.currentUser))

        console.log('✅ Avatar saved as data URL from cropper')
        successMessage.value = 'Avatar updated successfully!'
        showImageCropper.value = false

        // Force image refresh
        avatarKey.value++
      } else {
        errorMessage.value = 'User not found'
      }
    }
    reader.readAsDataURL(file)
  } catch (error) {
    console.error('❌ Save avatar from cropper error:', error)
    errorMessage.value = 'Failed to save avatar'
  }
}

function handleImageCropCancel() {
  showImageCropper.value = false
}

// Enable 2FA
async function enableTwoFactor() {
  showTwoFactorDialog.value = true
}

// Disable 2FA
async function disableTwoFactor() {
  if (!disable2FACode.value || disable2FACode.value.length !== 6) {
    errorMessage.value = 'Please enter a 6-digit verification code'
    return
  }

  isUpdating.value = true
  errorMessage.value = ''

  try {
    const result = await authStore.disableTwoFactorFromProfile(disable2FACode.value)

    if (result.success) {
      successMessage.value = '2FA disabled successfully!'
      showDisable2FADialog.value = false
      disable2FACode.value = ''
      console.log('✅ 2FA disabled successfully')
    } else {
      errorMessage.value = result.error || 'Failed to disable 2FA'
      console.log('❌ Failed to disable 2FA:', result.error)
    }
  } catch (error) {
    console.error('❌ Disable 2FA error:', error)
    errorMessage.value = 'Failed to disable 2FA'
  } finally {
    isUpdating.value = false
  }
}

// Handle 2FA dialog success
function handleTwoFactorSuccess() {
  showTwoFactorDialog.value = false
  successMessage.value = '2FA enabled successfully!'
}

// Handle avatar image events
function handleAvatarError(event: Event) {
  console.log('❌ Avatar image failed to load:', userAvatar.value)
  console.log('🚫 Error event:', event)
  console.log('🔍 Current user avatar URL:', authStore.currentUser?.avatarUrl)
  console.log('🔍 Is local avatar:', isLocalAvatar.value)
}

function handleAvatarLoad(event: Event) {
  console.log('✅ Avatar image loaded successfully:', userAvatar.value)
  console.log('📸 Load event:', event)
  console.log('🖼️ Image dimensions:', (event.target as HTMLImageElement).naturalWidth, 'x', (event.target as HTMLImageElement).naturalHeight)
}

// Load profile on mount
onMounted(() => {
  console.log('🚀 AccountView mounted - loading profile...')
  console.log('👤 Current user:', authStore.currentUser)
  console.log('🖼️ User avatar URL:', authStore.currentUser?.avatarUrl)
  console.log('🖼️ Has avatar:', hasAvatar.value)
  loadProfile()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Account Settings</h1>
        <p class="mt-2 text-gray-600">Manage your profile information and security settings</p>
      </div>

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
      <div v-else class="space-y-8">
        <!-- Avatar Section -->
        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">Profile Picture</h2>

          <!-- Image Cropper (when active) -->
          <div v-if="showImageCropper" class="mb-6">
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-medium text-gray-900">Edit Profile Picture</h3>
                <button
                  @click="handleImageCropCancel"
                  class="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                  </svg>
                  Back
                </button>
              </div>
              <ImageCropper
                :aspect-ratio="1"
                :quality="0.9"
                format="image/jpeg"
                :initial-image="userAvatar"
                @crop="handleImageCrop"
                @cancel="handleImageCropCancel"
              />
            </div>
          </div>

          <!-- Avatar Display and Controls -->
          <div v-else class="flex items-center space-x-6">
            <!-- Current Avatar -->
            <div class="flex-shrink-0">
              <div class="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                <img
                  v-if="hasAvatar"
                  :key="avatarKey"
                  :src="userAvatar"
                  :alt="fullName"
                  class="w-full h-full object-cover object-center rounded-full"
                  style="aspect-ratio: 1/1;"
                  @error="handleAvatarError"
                  @load="handleAvatarLoad"
                />
                <svg
                  v-else
                  class="w-10 h-10 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <p class="text-xs text-gray-500 mt-2 text-center">Profile Picture</p>
            </div>

            <!-- Avatar Info and Controls -->
            <div class="flex-1">
              <div class="space-y-3">
                <p class="text-sm text-gray-600">
                  {{ hasAvatar ? 'Your current profile picture' : 'No profile picture set' }}
                </p>

                                <div class="flex space-x-3">
                  <button
                    @click="openImageCropper"
                    class="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {{ hasAvatar ? 'Edit Picture' : 'Add Picture' }}
                  </button>
                </div>

                <p class="text-xs text-gray-500">
                  Upload and crop your profile picture. Supported formats: JPG, PNG, GIF (max 5MB)
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Profile Information -->
        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>

          <form @submit.prevent="updateProfile" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- First Name -->
              <div>
                <label for="first_name" class="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  id="first_name"
                  v-model="profileForm.first_name"
                  type="text"
                  class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your first name"
                />
              </div>

              <!-- Last Name -->
              <div>
                <label for="last_name" class="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  id="last_name"
                  v-model="profileForm.last_name"
                  type="text"
                  class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your last name"
                />
              </div>

              <!-- Phone -->
              <div>
                <label for="phone" class="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  id="phone"
                  v-model="profileForm.phone"
                  type="tel"
                  class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+1234567890"
                />
              </div>

              <!-- Job Title -->
              <div>
                <label for="job_title" class="block text-sm font-medium text-gray-700">
                  Job Title
                </label>
                <input
                  id="job_title"
                  v-model="profileForm.job_title"
                  type="text"
                  class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your job title"
                />
              </div>
            </div>

            <!-- Additional Info -->
            <div>
              <label for="additional_info" class="block text-sm font-medium text-gray-700">
                Additional Information
              </label>
              <textarea
                id="additional_info"
                v-model="profileForm.additional_info"
                rows="3"
                class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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

        <!-- Security Settings -->
        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">Security Settings</h2>

          <div class="space-y-6">
            <!-- 2FA Status -->
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-medium text-gray-900">Two-Factor Authentication</h3>
                <p class="text-sm text-gray-600">
                  {{ authStore.currentUser?.twoFactorEnabled ? 'Enabled' : 'Disabled' }}
                </p>
              </div>

              <div class="flex space-x-3">
                <button
                  v-if="!authStore.currentUser?.twoFactorEnabled"
                  @click="enableTwoFactor"
                  class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Enable 2FA
                </button>

                <button
                  v-else
                  @click="showDisable2FADialog = true"
                  class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Disable 2FA
                </button>
              </div>
            </div>

            <!-- Account Info -->
            <div class="border-t pt-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Account Information</h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="font-medium text-gray-700">Email:</span>
                  <span class="ml-2 text-gray-900">{{ authStore.currentUser?.email }}</span>
                </div>

                <div>
                  <span class="font-medium text-gray-700">Role:</span>
                  <span class="ml-2 text-gray-900">{{ authStore.currentUser?.role }}</span>
                </div>

                <div>
                  <span class="font-medium text-gray-700">Status:</span>
                  <span class="ml-2 text-gray-900">{{ authStore.currentUser?.isActive ? 'Active' : 'Inactive' }}</span>
                </div>

                <div>
                  <span class="font-medium text-gray-700">Last Login:</span>
                  <span class="ml-2 text-gray-900">{{ authStore.currentUser?.lastLogin || 'Never' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Two-Factor Authentication Dialog -->
    <TwoFactorDialog
      :is-open="showTwoFactorDialog"
      @close="showTwoFactorDialog = false"
      @success="handleTwoFactorSuccess"
    />

    <!-- Disable 2FA Dialog -->
    <div
      v-if="showDisable2FADialog"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    >
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3 text-center">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Disable Two-Factor Authentication</h3>
          <p class="text-sm text-gray-500 mb-6">
            Enter your verification code to disable 2FA
          </p>

          <div class="mb-6">
            <input
              v-model="disable2FACode"
              type="text"
              maxlength="6"
              placeholder="000000"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div class="flex space-x-3">
            <button
              @click="showDisable2FADialog = false"
              class="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              @click="disableTwoFactor"
              :disabled="isUpdating"
              class="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="isUpdating">Disabling...</span>
              <span v-else>Disable 2FA</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Avatar Editor Dialog -->
    <AvatarEditor
      :is-open="showAvatarEditor"
      :current-avatar="userAvatar"
      @close="closeAvatarEditor"
      @save="saveAvatarFromEditor"
    />
  </div>
</template>

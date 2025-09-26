<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'

import ImageCropper from '@/components/ImageCropper.vue'

const authStore = useAuthStore()

// State
const isLoading = ref(false)
const isUpdating = ref(false)
const errorMessage = ref('')
const successMessage = ref('')


const showAvatarEditor = ref(false)
const showImageCropper = ref(false)

const avatarKey = ref(0) // For forcing image refresh
const showInactiveReasonFields = ref(false) // New state for showing reason fields

// Profile form
const profileForm = reactive({
  first_name: '',
  last_name: '',
  phone: '',
  job_title: '',
  additional_info: '',
  user_type: '',
  company: '',
  department: '',
  location: '',
  isActive: true,
  inactive_reason: '',
  inactive_reason_details: '',
})

// Validation errors
const validationErrors = reactive({
  first_name: '',
  last_name: '',
  phone: '',
  job_title: '',
  user_type: '',
})

// Validation rules with proper typing
const validationRules: Record<string, any> = {
  first_name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Zа-яА-Я\s'-]+$/
  },
  last_name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Zа-яА-Я\s'-]+$/
  },
  phone: {
    required: false,
    pattern: /^[\+]?[1-9][\d]{0,15}$/
  }
}

// Validation functions
function validateField(fieldName: string, value: string): string {
  const rules = validationRules[fieldName as keyof typeof validationRules]
  if (!rules) return ''

  // Required validation
  if (rules.required && !value.trim()) {
    return `${fieldName.replace('_', ' ')} is required`
  }

  // Min length validation
  if (rules.minLength && value.length < rules.minLength) {
    return `${fieldName.replace('_', ' ')} must be at least ${rules.minLength} characters`
  }

  // Max length validation
  if (rules.maxLength && value.length > rules.maxLength) {
    return `${fieldName.replace('_', ' ')} must be no more than ${rules.maxLength} characters`
  }

  // Pattern validation
  if (rules.pattern && value && !rules.pattern.test(value)) {
    if (fieldName === 'phone') {
      return 'Please enter a valid phone number'
    }
    return `Please enter a valid ${fieldName.replace('_', ' ')}`
  }

  return ''
}

function validateForm(): boolean {
  let isValid = true

  // Clear previous errors
  Object.keys(validationErrors).forEach(key => {
    validationErrors[key as keyof typeof validationErrors] = ''
  })

  // Validate each field (only string fields that have validation rules)
  Object.keys(profileForm).forEach(fieldName => {
    if (validationRules[fieldName] && typeof profileForm[fieldName as keyof typeof profileForm] === 'string') {
      const error = validateField(fieldName, profileForm[fieldName as keyof typeof profileForm] as string)
      if (error) {
        validationErrors[fieldName as keyof typeof validationErrors] = error
        isValid = false
      }
    }
  })

  return isValid
}

// Clear validation errors when user types
function clearValidationError(fieldName: string) {
  if (validationErrors[fieldName as keyof typeof validationErrors]) {
    validationErrors[fieldName as keyof typeof validationErrors] = ''
  }
}

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

      // Попробуем загрузить дополнительные поля из backend
      // Если backend поддерживает эти поля, они будут загружены
      // Если нет - останутся пустыми
      profileForm.phone = result.user.phone || ''
      profileForm.job_title = result.user.job_title || result.user.user_type || ''
      profileForm.additional_info = result.user.additional_info || ''
      profileForm.user_type = result.user.user_type || ''
      profileForm.company = result.user.company || ''
      profileForm.department = result.user.department || ''
      profileForm.location = result.user.location || ''
      profileForm.isActive = result.user.isActive !== undefined ? result.user.isActive : true
      profileForm.inactive_reason = result.user.inactive_reason || ''
      profileForm.inactive_reason_details = result.user.inactive_reason_details || ''

      // Always hide inactive reason fields on profile load
      // They will only show when user actively changes status
      showInactiveReasonFields.value = false

      console.log('✅ Profile loaded successfully')
      console.log('👤 User data:', result.user)
      console.log('🔄 profileForm.isActive set to:', profileForm.isActive)
      console.log('🔄 showInactiveReasonFields set to:', showInactiveReasonFields.value)
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

// Update profile with validation (removed user_type and job_title from editable fields)
async function updateProfile() {
  // Clear previous messages
  errorMessage.value = ''
  successMessage.value = ''

  // Validate form
  if (!validateForm()) {
    errorMessage.value = 'Please fix the validation errors below'
    return
  }

  isUpdating.value = true

  try {
    const result = await authStore.updateProfile({
      first_name: profileForm.first_name.trim(),
      last_name: profileForm.last_name.trim(),
      phone: profileForm.phone.trim(),
      // user_type and job_title are now read-only, so we don't send them
      additional_info: profileForm.additional_info.trim(),
      company: profileForm.company.trim(),
      department: profileForm.department.trim(),
      location: profileForm.location.trim(),
    })

    if (result.success) {
      successMessage.value = 'Profile updated successfully!'
      console.log('✅ Profile updated successfully')

      // Clear validation errors after successful update
      Object.keys(validationErrors).forEach(key => {
        validationErrors[key as keyof typeof validationErrors] = ''
      })
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

// Toggle 2FA
async function toggleTwoFactor() {
  console.log('🔄 toggleTwoFactor called!')
  console.log('🔄 Current 2FA status:', authStore.currentUser?.twoFactorEnabled)

  const newStatus = !authStore.currentUser?.twoFactorEnabled
  console.log('🔄 New 2FA status will be:', newStatus)

  try {
    // Use the toggle API endpoint
    const response = await fetch('http://localhost:8000/api/v1/2fa/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        user_id: authStore.currentUser?.id,
        enabled: newStatus ? 1 : 0
      })
    })

    const result = await response.json()
    console.log('📥 2FA toggle response:', result)

    if (result.status === 'success') {
      // Update local state
      if (authStore.currentUser) {
        authStore.currentUser.twoFactorEnabled = newStatus
      }
      successMessage.value = `2FA ${newStatus ? 'enabled' : 'disabled'} successfully!`
      console.log('✅ 2FA status updated to:', newStatus)
    } else {
      errorMessage.value = result.message || 'Failed to toggle 2FA'
      console.log('❌ 2FA toggle failed:', result.message)
    }
  } catch (error) {
    console.error('❌ 2FA toggle error:', error)
    errorMessage.value = 'Failed to toggle 2FA'
  }
}







// Add work status functions
async function toggleWorkStatus() {
  console.log('🔄 toggleWorkStatus called!')
  console.log('🔄 Current profileForm.isActive:', profileForm.isActive)

  const newStatus = !profileForm.isActive
  console.log('🔄 New status will be:', newStatus)

  if (!newStatus) {
    // Setting to inactive - show reason fields immediately
    console.log('🔄 Setting to inactive - showing reason fields')
    showInactiveReasonFields.value = true
    // Don't update status yet - wait for user to fill in reason
  } else {
    // Setting to active - hide reason fields and update immediately
    console.log('🔄 Setting to active - hiding reason fields and updating status')
    showInactiveReasonFields.value = false
    // Clear reason fields when going active
    profileForm.inactive_reason = ''
    profileForm.inactive_reason_details = ''
    console.log('🔄 Calling updateWorkStatus...')
    await updateWorkStatus(newStatus)

    // Force hide fields after update (in case backend didn't change the status)
    showInactiveReasonFields.value = false
  }
}

async function updateWorkStatus(newStatus: boolean) {
  console.log('🔄 updateWorkStatus called with newStatus:', newStatus)
  console.log('🔄 Current profileForm.isActive:', profileForm.isActive)

  // Validate that reason is provided when setting to inactive
  if (!newStatus && !profileForm.inactive_reason) {
    errorMessage.value = 'Please select a reason for being inactive'
    return
  }

  isUpdating.value = true

  try {
    console.log('📤 Sending work status update to backend:', {
      isActive: newStatus,
      inactive_reason: newStatus ? '' : profileForm.inactive_reason,
      inactive_reason_details: newStatus ? '' : profileForm.inactive_reason_details,
    })

    const result = await authStore.updateWorkStatus({
      isActive: newStatus,
      inactive_reason: newStatus ? '' : profileForm.inactive_reason,
      inactive_reason_details: newStatus ? '' : profileForm.inactive_reason_details,
    })

    console.log('📥 Backend response:', result)

    if (result.success) {
      // Update form with data from backend response
      if (result.workStatus) {
        console.log('🔄 Updating profileForm with workStatus:', result.workStatus)
        profileForm.isActive = result.workStatus.isActive
        profileForm.inactive_reason = result.workStatus.inactive_reason || ''
        profileForm.inactive_reason_details = result.workStatus.inactive_reason_details || ''

        console.log('✅ profileForm.isActive set to:', profileForm.isActive)
        console.log('✅ profileForm.inactive_reason set to:', profileForm.inactive_reason)

        // Also update the authStore currentUser to keep everything in sync
        if (authStore.currentUser) {
          authStore.currentUser.isActive = result.workStatus.isActive
          authStore.currentUser.inactive_reason = result.workStatus.inactive_reason
          authStore.currentUser.inactive_reason_details = result.workStatus.inactive_reason_details
          console.log('✅ authStore.currentUser.isActive set to:', authStore.currentUser.isActive)
        }
      } else {
        // Fallback to the status we sent
        profileForm.isActive = newStatus
      }

      // Always hide reason fields after update
      showInactiveReasonFields.value = false

      successMessage.value = newStatus
        ? 'Status updated to Active. You are now available for work.'
        : 'Status updated to Inactive. You will not receive new work assignments.'

      // Clear reason fields when going active
      if (newStatus) {
        profileForm.inactive_reason = ''
        profileForm.inactive_reason_details = ''
      }
    } else {
      errorMessage.value = result.error || 'Failed to update work status'
    }
  } catch (error) {
    console.error('❌ Update work status error:', error)
    errorMessage.value = 'Failed to update work status'
  } finally {
    isUpdating.value = false
  }
}

// Save inactive status function
async function saveInactiveStatus() {
  if (!profileForm.inactive_reason) {
    errorMessage.value = 'Please select a reason for being inactive'
    return
  }

  await updateWorkStatus(false)

  // Hide fields after saving inactive status
  showInactiveReasonFields.value = false
}

// Cancel inactive status function
function cancelInactiveStatus() {
  showInactiveReasonFields.value = false
  profileForm.inactive_reason = ''
  profileForm.inactive_reason_details = ''
  // Reset status back to active if user cancels
  profileForm.isActive = true
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

    // Ensure inactive reason fields are hidden by default
  showInactiveReasonFields.value = false

  loadProfile()
})

// Watch for changes in work status and hide/show inactive reason fields accordingly
watch(() => profileForm.isActive, (newStatus) => {
  if (newStatus) {
    // If status becomes active, hide inactive reason fields
    showInactiveReasonFields.value = false
    // Clear inactive reason fields when going active
    profileForm.inactive_reason = ''
    profileForm.inactive_reason_details = ''
  }
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

          <!-- Work Status Section -->
          <div class="border-t pt-6 mt-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Work Status</h3>

            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-600">
                    {{ profileForm.isActive ? 'Active - Available for work' : 'Inactive - Not available for work' }}
                  </p>
                </div>

                <!-- Status Toggle -->
                <div class="flex items-center">
                  <button
                    @click="toggleWorkStatus"
                    :disabled="isUpdating"
                    class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    :class="profileForm.isActive ? 'bg-blue-600' : 'bg-gray-200'"
                  >
                    <span
                      class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                      :class="profileForm.isActive ? 'translate-x-6' : 'translate-x-1'"
                    />
                  </button>
                  <span class="ml-3 text-sm font-medium text-gray-900">
                    {{ profileForm.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </div>
              </div>

              <!-- Status Description -->
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <h4 class="text-sm font-medium text-gray-900">
                      {{ profileForm.isActive ? 'Active Status' : 'Inactive Status' }}
                    </h4>
                    <p class="text-sm text-gray-600 mt-1">
                      {{ profileForm.isActive
                        ? 'You are currently available for new projects and tasks. Managers can assign work to you.'
                        : 'You are currently not available for new work. You will not receive new project assignments or tasks.'
                      }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Status Change Reason (when setting to inactive) -->
              <!-- Debug: showInactiveReasonFields = {{ showInactiveReasonFields }}, profileForm.isActive = {{ profileForm.isActive }} -->
              <div v-if="showInactiveReasonFields" class="space-y-3">
                <div v-if="showInactiveReasonFields" class="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p class="text-sm text-blue-800">
                    <strong>Setting status to Inactive:</strong> Please select a reason and click "Save Inactive Status" to confirm.
                  </p>
                </div>

                <label for="inactive_reason" class="block text-sm font-medium text-gray-700">
                  Reason for being inactive
                </label>
                <select
                  id="inactive_reason"
                  v-model="profileForm.inactive_reason"
                  class="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a reason</option>
                  <option value="vacation">Vacation / Holiday</option>
                  <option value="sick_leave">Sick Leave</option>
                  <option value="personal_leave">Personal Leave</option>
                  <option value="training">Training / Course</option>
                  <option value="other">Other</option>
                </select>

                <label v-if="profileForm.inactive_reason" for="inactive_reason_details" class="block text-sm font-medium text-gray-700">
                  {{ profileForm.inactive_reason === 'other' ? 'Please specify the reason' : 'Additional details (optional)' }}
                </label>

                <textarea
                  v-if="profileForm.inactive_reason"
                  v-model="profileForm.inactive_reason_details"
                  rows="2"
                  class="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  :placeholder="profileForm.inactive_reason === 'other' ? 'Please specify the reason...' : 'Additional details (optional)...'"
                ></textarea>

                <!-- Save Inactive Status Button -->
                <div v-if="showInactiveReasonFields && profileForm.inactive_reason" class="flex justify-end space-x-3">
                  <button
                    @click="cancelInactiveStatus"
                    :disabled="isUpdating"
                    class="px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    @click="saveInactiveStatus"
                    :disabled="isUpdating"
                    class="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span v-if="isUpdating">Saving...</span>
                    <span v-else>Save Inactive Status</span>
                  </button>
                </div>
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
                  First Name <span class="text-red-500">*</span>
                </label>
                <input
                  id="first_name"
                  v-model="profileForm.first_name"
                  type="text"
                  class="mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  :class="validationErrors.first_name ? 'border-red-300 bg-red-50' : 'border-gray-300'"
                  placeholder="Enter your first name"
                  @input="clearValidationError('first_name')"
                  @blur="validationErrors.first_name = validateField('first_name', profileForm.first_name)"
                />
                <p v-if="validationErrors.first_name" class="mt-1 text-sm text-red-600">
                  {{ validationErrors.first_name }}
                </p>
              </div>

              <!-- Last Name -->
              <div>
                <label for="last_name" class="block text-sm font-medium text-gray-700">
                  Last Name <span class="text-red-500">*</span>
                </label>
                <input
                  id="last_name"
                  v-model="profileForm.last_name"
                  type="text"
                  class="mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  :class="validationErrors.last_name ? 'border-red-300 bg-red-50' : 'border-gray-300'"
                  placeholder="Enter your last name"
                  @input="clearValidationError('last_name')"
                  @blur="validationErrors.last_name = validateField('last_name', profileForm.last_name)"
                />
                <p v-if="validationErrors.last_name" class="mt-1 text-sm text-red-600">
                  {{ validationErrors.last_name }}
                </p>
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
                  class="mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  :class="validationErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'"
                  placeholder="+1234567890"
                  @input="clearValidationError('phone')"
                  @blur="validationErrors.phone = validateField('phone', profileForm.phone)"
                />
                <p v-if="validationErrors.phone" class="mt-1 text-sm text-red-600">
                  {{ validationErrors.phone }}
                </p>
              </div>

              <!-- Company -->
              <div>
                <label for="company" class="block text-sm font-medium text-gray-700">
                  Company
                </label>
                <input
                  id="company"
                  v-model="profileForm.company"
                  type="text"
                  class="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your company name"
                />
              </div>

              <!-- Department -->
              <div>
                <label for="department" class="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <input
                  id="department"
                  v-model="profileForm.department"
                  type="text"
                  class="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your department"
                />
              </div>

              <!-- Location -->
              <div>
                <label for="location" class="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  id="location"
                  v-model="profileForm.location"
                  type="text"
                  class="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your location"
                />
              </div>
            </div>

            <!-- Read-only fields section -->
            <div class="border-t pt-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Account Information (Read Only)</h3>
              <p class="text-sm text-gray-600 mb-4">
                These fields are managed by administrators and cannot be changed from your profile.
              </p>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- User Type (Read Only) -->
                <div>
                  <label class="block text-sm font-medium text-gray-700">
                    User Type
                  </label>
                  <div class="mt-1 flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                    <span class="text-gray-900">
                      {{ profileForm.user_type || 'Not specified' }}
                    </span>
                    <svg class="ml-2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p class="mt-1 text-xs text-gray-500">
                    Contact an administrator to change your user type
                  </p>
                </div>

                <!-- Job Title (Read Only) -->
                <div>
                  <label class="block text-sm font-medium text-gray-700">
                    Job Title
                  </label>
                  <div class="mt-1 flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                    <span class="text-gray-900">
                      {{ profileForm.job_title || 'Not specified' }}
                    </span>
                    <svg class="ml-2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p class="mt-1 text-xs text-gray-500">
                    Contact an administrator to change your job title
                  </p>
                </div>

                <!-- Role (Read Only) -->
                <div>
                  <label class="block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <div class="mt-1 flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                    <span class="text-gray-900 capitalize">
                      {{ authStore.currentUser?.role || 'Not specified' }}
                    </span>
                    <svg class="ml-2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p class="mt-1 text-xs text-gray-500">
                    Your role determines your permissions in the system
                  </p>
                </div>

                <!-- Email (Read Only) -->
                <div>
                  <label class="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div class="mt-1 flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                    <span class="text-gray-900">
                      {{ authStore.currentUser?.email || 'Not specified' }}
                    </span>
                    <svg class="ml-2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p class="mt-1 text-xs text-gray-500">
                    Email address cannot be changed from profile
                  </p>
                </div>
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

              <div class="flex items-center">
                <!-- 2FA Toggle Switch -->
                <button
                  @click="toggleTwoFactor"
                  :disabled="isUpdating"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  :class="authStore.currentUser?.twoFactorEnabled ? 'bg-blue-600' : 'bg-gray-200'"
                >
                  <span
                    class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                    :class="authStore.currentUser?.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'"
                  ></span>
                </button>
                <span class="ml-3 text-sm font-medium text-gray-900">
                  {{ authStore.currentUser?.twoFactorEnabled ? 'ON' : 'OFF' }}
                </span>
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





    <!-- Avatar Editor Dialog -->
    <AvatarEditor
      :is-open="showAvatarEditor"
      :current-avatar="userAvatar"
      @close="closeAvatarEditor"
      @save="saveAvatarFromEditor"
    />
  </div>
</template>

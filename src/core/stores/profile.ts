import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/core/utils/api'

export interface WorkerLanguage {
  worker_id: number
  language_id: number
  prof_level: 'Basic' | 'Intermediate' | 'Fluent'
}

export interface Language {
  id: number
  name: string
}

export interface UserProfile {
  id: number
  email: string
  first_name?: string | null
  last_name?: string | null
  name: string
  phone?: string | null
  job_title?: string | null
  status: boolean
  status_changed_at?: string | null
  status_end_at?: string | null
  status_reason?: string | null
  status_details?: string | null
  additional_info?: string | null
  gender?: string | null
  birth_date?: string | null
  nationality?: string | null
  country_of_origin?: string | null
  workforce_group?: string | null
  city?: string | null
  emergency_data?: Record<string, string> | null
  languages?: WorkerLanguage[]
  avatar_url?: string | null
  full_img_url?: string | null
  two_factor_enabled: boolean
  last_login?: string | null
  created_at?: string | null
  updated_at?: string | null
}

// Workforce groups based on cultural/ethnic classification
export const WORKFORCE_GROUPS = [
  { value: 'european_eastern', label: 'European Group - Eastern Europe' },
  { value: 'european_western', label: 'European Group - Western Europe' },
  { value: 'european_balkans', label: 'European Group - Balkans' },
  { value: 'latin_american', label: 'Latin American Group' },
  { value: 'asian_south', label: 'Asian Group - South Asia' },
  { value: 'asian_east', label: 'Asian Group - East Asia' },
  { value: 'asian_southeast', label: 'Asian Group - Southeast Asia' },
  { value: 'middle_eastern', label: 'Middle Eastern / Arab Group' },
  { value: 'african_north', label: 'African Group - North Africa' },
  { value: 'african_sub_saharan', label: 'African Group - Central & Sub-Saharan Africa' },
  { value: 'mixed_universal', label: 'Mixed / Universal Teams' },
]

// Available languages
export const AVAILABLE_LANGUAGES = [
  { id: 1, name: 'English' },
  { id: 2, name: 'French' },
  { id: 3, name: 'Spanish' },
  { id: 4, name: 'Portuguese' },
  { id: 5, name: 'Italian' },
  { id: 6, name: 'German' },
  { id: 7, name: 'Polish' },
  { id: 8, name: 'Ukrainian' },
  { id: 9, name: 'Russian' },
  { id: 10, name: 'Arabic' },
  { id: 11, name: 'Turkish' },
  { id: 12, name: 'Farsi' },
  { id: 13, name: 'Hindi' },
  { id: 14, name: 'Punjabi' },
  { id: 15, name: 'Urdu' },
  { id: 16, name: 'Bengali' },
  { id: 17, name: 'Tagalog' },
  { id: 18, name: 'Mandarin Chinese' },
  { id: 19, name: 'Cantonese Chinese' },
  { id: 20, name: 'Vietnamese' },
  { id: 21, name: 'Korean' },
  { id: 22, name: 'Japanese' },
  { id: 23, name: 'Somali' },
  { id: 24, name: 'Swahili' },
  { id: 25, name: 'Amharic' },
]

export const PROFICIENCY_LEVELS = [
  { value: 'Basic', label: 'Basic' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Fluent', label: 'Fluent' },
]

export const useProfileStore = defineStore('profile', () => {
  // State
  const profile = ref<UserProfile | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  async function loadProfile(): Promise<{
    success: boolean
    profile?: UserProfile
    error?: string
  }> {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.get('/api/v1/profile')

      if (response.data && response.data.data && response.data.data.user) {
        const userData = response.data.data.user

        profile.value = {
          id: userData.id,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          name: userData.name,
          phone: userData.phone,
          job_title: userData.job_title,
          status: userData.status,
          status_changed_at: userData.status_changed_at,
          status_end_at: userData.status_end_at,
          status_reason: userData.status_reason,
          status_details: userData.status_details,
          additional_info: userData.additional_info,
          avatar_url: userData.avatar_url,
          full_img_url: userData.full_img_url,
          two_factor_enabled: userData.two_factor_enabled,
          last_login: userData.last_login,
          created_at: userData.created_at,
          updated_at: userData.updated_at,
        }

        return { success: true, profile: profile.value }
      } else {
        error.value = 'Failed to load profile data'
        return { success: false, error: error.value || undefined }
      }
    } catch {
      error.value = 'Failed to load profile'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function updateProfile(profileData: {
    first_name?: string
    last_name?: string
    phone?: string
    job_title?: string
    additional_info?: string
    gender?: string
    birth_date?: string
    nationality?: string
    country_of_origin?: string
    workforce_group?: string
    city?: string
    emergency_data?: Record<string, string>
    languages?: WorkerLanguage[]
  }): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
    isLoading.value = true
    error.value = null

    try {
      // Transform birth_date to dob for server
      const serverData = {
        ...profileData,
        dob: profileData.birth_date,
        birth_date: undefined,
      }
      delete serverData.birth_date

      const response = await api.put('/api/v1/profile', serverData)

      if (response.data.status === 'success') {
        // Обновляем локальное состояние
        if (profile.value) {
          Object.assign(profile.value, profileData)
        }

        return { success: true, profile: profile.value || undefined }
      } else {
        error.value = response.data.message || 'Failed to update profile'
        return { success: false, error: error.value || undefined }
      }
    } catch {
      error.value = 'Failed to update profile'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function updateWorkStatus(statusData: {
    status: boolean
    status_reason?: string
    status_details?: string
    status_end_at?: string
  }): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
    isLoading.value = true
    error.value = null

    try {
      // Преобразуем данные для сервера
      const serverData = {
        isActive: statusData.status === true,
        inactive_reason: statusData.status_reason || '',
        inactive_reason_details: statusData.status_details || '',
        inactive_until: statusData.status_end_at || '',
      }

      console.log('📤 Original statusData:', statusData)
      console.log('📤 Sending work status data:', serverData)
      console.log('📤 isActive type:', typeof serverData.isActive, 'value:', serverData.isActive)
      const response = await api.put('/api/v1/profile/work-status', serverData, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.data.status === 'success') {
        // Обновляем локальное состояние
        if (profile.value) {
          Object.assign(profile.value, statusData)
        }

        return { success: true, profile: profile.value || undefined }
      } else {
        error.value = response.data.message || 'Failed to update work status'
        return { success: false, error: error.value || undefined }
      }
    } catch {
      error.value = 'Failed to update work status'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function updateAvatar(avatarData: {
    croppedAvatar: string
    fullImage: string
  }): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('/api/v1/profile/avatar', avatarData)

      if (response.data.status === 'success') {
        // Обновляем локальное состояние
        if (profile.value) {
          profile.value.avatar_url = response.data.data.avatar_url
          profile.value.full_img_url = response.data.data.full_image_url
        }

        return { success: true, profile: profile.value || undefined }
      } else {
        error.value = response.data.message || 'Failed to update avatar'
        return { success: false, error: error.value || undefined }
      }
    } catch {
      error.value = 'Failed to update avatar'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  // Upload avatar file
  async function uploadAvatar(
    file: File,
  ): Promise<{ success: boolean; avatarUrl?: string; error?: string }> {
    isLoading.value = true
    error.value = null

    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await api.post('/api/v1/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data.status === 'success') {
        const avatarUrl = response.data.data.avatar_url
        const fullAvatarUrl = avatarUrl.startsWith('http')
          ? avatarUrl
          : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${avatarUrl}`

        // Обновляем локальное состояние
        if (profile.value) {
          profile.value.avatar_url = fullAvatarUrl
        }

        return { success: true, avatarUrl: fullAvatarUrl }
      } else {
        error.value = response.data.message || 'Failed to upload avatar'
        return { success: false, error: error.value || undefined }
      }
    } catch {
      error.value = 'Failed to upload avatar'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  // Upload both full image and cropped avatar
  async function uploadAvatarImages(
    fullImage: string,
    croppedAvatar: string,
  ): Promise<{ success: boolean; avatarUrl?: string; fullImageUrl?: string; error?: string }> {
    isLoading.value = true
    error.value = null

    try {
      const formData = new FormData()

      // Convert base64 to File objects
      const fullImageFile = await base64ToFile(fullImage, 'full-image.png')
      const croppedAvatarFile = await base64ToFile(croppedAvatar, 'avatar.png')

      formData.append('full_image', fullImageFile)
      formData.append('avatar', croppedAvatarFile)

      const response = await api.post('/api/v1/profile/avatar-images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data.status === 'success') {
        const avatarUrl = response.data.data.avatar_url
        const fullImageUrl = response.data.data.full_image_url

        const fullAvatarUrl = avatarUrl.startsWith('http')
          ? avatarUrl
          : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${avatarUrl}`

        const fullFullImageUrl = fullImageUrl.startsWith('http')
          ? fullImageUrl
          : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${fullImageUrl}`

        // Обновляем локальное состояние
        if (profile.value) {
          profile.value.avatar_url = fullAvatarUrl
          profile.value.full_img_url = fullFullImageUrl
        }

        return { success: true, avatarUrl: fullAvatarUrl, fullImageUrl: fullFullImageUrl }
      } else {
        error.value = response.data.message || 'Failed to upload avatar images'
        return { success: false, error: error.value || undefined }
      }
    } catch {
      error.value = 'Failed to upload avatar images'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  // Helper function to convert base64 to File
  async function base64ToFile(base64: string, filename: string): Promise<File> {
    const response = await fetch(base64)
    const blob = await response.blob()
    return new File([blob], filename, { type: blob.type })
  }

  return {
    // State
    profile,
    isLoading,
    error,

    // Actions
    loadProfile,
    updateProfile,
    updateWorkStatus,
    updateAvatar,
    uploadAvatar,
    uploadAvatarImages,
    base64ToFile,
  }
})

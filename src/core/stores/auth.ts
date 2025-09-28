import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api, setSessionExpiredCallback } from '@/core/utils/api'
import { apiConfig } from '@/config/api'
import {
  initializeSessionManager,
  startSessionManager,
  stopSessionManager,
} from '@/core/utils/session-manager'
import { isTokenExpired } from '@/core/utils/jwt-utils'

// Helper function to get current environment
function getCurrentEnvironment(): string {
  if (typeof window === 'undefined') {
    return 'development'
  }

  const hostname = window.location.hostname

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'development'
  } else if (hostname.includes('staging') || hostname.includes('dev')) {
    return 'staging'
  } else {
    return 'production'
  }
}

export interface User {
  id: number
  email: string
  name: string
  first_name?: string
  last_name?: string
  role_category?: 'global' | 'project' | 'task'
  role_code?:
    | 'admin'
    | 'project_manager'
    | 'architect'
    | 'foreman'
    | 'worker'
    | 'contractor'
    | 'inspector'
  role_name?: string
  twoFactorEnabled: boolean
  isActive: boolean
  lastLogin?: string
  permissions?: string[]
  avatarUrl?: string
  // Добавляем дополнительные поля профиля
  phone?: string
  job_title?: string
  user_type?: string
  additional_info?: string
  company?: string
  department?: string
  location?: string
  // Добавляем поля для статуса работы
  inactive_reason?: string
  inactive_reason_details?: string
}

export interface Invitation {
  id: number
  email: string
  role: string
  invitedBy: string
  invitedAt: string
  expiresAt: string
  status: 'pending' | 'accepted' | 'expired'
  temporaryPassword: string
}

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<User | null>(null)
  const isAuthenticated = ref(false)
  const invitations = ref<Invitation[]>([])

  // Mock users data
  const users = ref<User[]>([])

  // Computed properties
  const isAdmin = computed(() => currentUser.value?.role_code === 'admin')
  const isManager = computed(() => currentUser.value?.role_code === 'project_manager')
  const canManageUsers = computed(() =>
    ['admin', 'project_manager'].includes(currentUser.value?.role_code || ''),
  )
  const canManageProjects = computed(() =>
    ['admin', 'project_manager'].includes(currentUser.value?.role_code || ''),
  )

  // Actions
  async function login(
    email: string,
    password: string,
  ): Promise<{ success: boolean; user?: User; requires2FA?: boolean; error?: string }> {
    try {
      console.log('🌐 Making login request to:', `${api.defaults.baseURL}/api/v1/auth/login`)
      console.log('📧 Email:', email)
      console.log('🔑 Password:', password ? '***' : 'empty')

      const response = await api.post('/api/v1/auth/login', {
        email,
        password,
      })

      console.log('✅ Login response:', response.data)

      // Check if backend returned an error
      if (response.data.status === 'error') {
        console.log('❌ Backend returned error:', response.data.message)
        throw new Error(response.data.message || 'Login failed')
      }

      // Бэкенд возвращает данные в поле data
      const { data } = response.data
      const { user, token, requires_2fa } = data

      console.log('👤 User data from backend:', user)
      console.log('🔐 Token from backend:', token ? 'present' : 'missing')
      console.log('🔒 2FA required:', requires_2fa)
      console.log('🔍 Role category from backend:', user.role_category)
      console.log('🔍 Role code from backend:', user.role_code)

      // Преобразуем структуру пользователя в формат фронтенда
      const frontendUser: User = {
        id: user.id,
        email: user.email,
        name: user.name,
        user_type: user.role_code,
        role_category: user.role_category,
        role_code: user.role_code,
        twoFactorEnabled: user.two_factor_enabled,
        isActive: isUserActive(user.status),
        lastLogin: user.last_login,
        permissions: getPermissionsForRole(user.role_code),
        avatarUrl: user.avatar_url
          ? user.avatar_url.startsWith('http')
            ? user.avatar_url
            : `${apiConfig.baseURL}${user.avatar_url}`
          : undefined,
      }

      // Токен сохраняем только если НЕ требуется 2FA
      // При 2FA токен будет сохранен после успешной верификации
      if (token && !requires_2fa) {
        localStorage.setItem('authToken', token)
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        console.log('🔐 Token saved to localStorage')
      } else if (token && requires_2fa) {
        console.log('⚠️ Token received but NOT saved - waiting for 2FA verification')
      }

      if (requires_2fa) {
        // При 2FA НЕ сохраняем токен и НЕ устанавливаем authenticated
        // Только сохраняем пользователя для 2FA диалога
        currentUser.value = frontendUser
        console.log('🔒 2FA required for user:', frontendUser.email)
        console.log('⚠️ Token NOT saved - waiting for 2FA verification')
        return { success: true, requires2FA: true, user: frontendUser }
      } else {
        // Обычный логин - сохраняем токен и устанавливаем authenticated
        currentUser.value = frontendUser
        isAuthenticated.value = true
        localStorage.setItem('user', JSON.stringify(frontendUser))
        console.log('✅ Login successful for user:', frontendUser.email)
        console.log('🖼️ Avatar URL after login:', frontendUser.avatarUrl)

        // Initialize session manager after successful login
        initializeSessionManager({
          checkInterval: 5 * 60 * 1000, // 5 minutes
          activityCheckInterval: 60 * 1000, // 1 minute
          useAPI: true, // Enable API checks now that backend is ready
          onSessionExpired: () => {
            console.log('🔒 Session expired - logging out')
            logout()
          },
          onSessionValid: () => {
            console.log('✅ Session is valid')
          },
        })

        // Set up API interceptor callback
        setSessionExpiredCallback(() => {
          console.log('🔒 API interceptor detected session expiration')
          logout()
        })

        // Start session monitoring
        startSessionManager()

        return { success: true, user: frontendUser }
      }
    } catch (error: unknown) {
      console.error('❌ Login error:', error)

      // Обработка ошибок от бэкенда
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as {
          response?: { data?: { message?: string; data?: { message?: string } }; status?: number }
        }
        console.log('🔍 Login error response status:', axiosError.response?.status)
        console.log('🔍 Login error response data:', axiosError.response?.data)

        // Try to get error message from different possible locations
        const errorMessage =
          axiosError.response?.data?.message ||
          axiosError.response?.data?.data?.message ||
          'Invalid email or password'

        return { success: false, error: errorMessage }
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Login failed. Please check your credentials.'
      return { success: false, error: errorMessage }
    }
  }

  // New 2FA functions for the updated flow
  async function sendTwoFactorCode(
    email: string,
    deliveryMethod: 'sms' | 'email',
  ): Promise<{ success: boolean; error?: string; data?: Record<string, unknown> }> {
    try {
      console.log('📤 Sending 2FA code via:', deliveryMethod)
      console.log('📧 Email:', email)

      const response = await api.post('/api/v1/2fa/send-code', {
        email,
        delivery_method: deliveryMethod,
      })

      console.log('✅ Send code response:', response.data)

      const { data } = response.data

      if (response.data.status === 'success') {
        console.log('✅ Code sent successfully')
        return { success: true, data }
      } else {
        console.log('❌ Failed to send code')
        return { success: false, error: response.data.message }
      }
    } catch (error: unknown) {
      console.error('❌ Send code error:', error)

      // Обработка ошибок от бэкенда
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } }
        if (axiosError.response?.data?.message) {
          return { success: false, error: axiosError.response.data.message }
        }
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Failed to send verification code'
      return { success: false, error: errorMessage }
    }
  }

  async function verifyTwoFactor(code: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔐 Making 2FA verification request')
      console.log('📱 2FA Code:', code)
      console.log('👤 Verifying for user:', currentUser.value?.email)
      console.log('🆔 User ID:', currentUser.value?.id)

      // Используем правильный эндпоинт с user_id
      const response = await api.post('/api/v1/2fa/verify-code', {
        user_id: currentUser.value?.id,
        code,
      })

      console.log('✅ 2FA response:', response.data)

      // Бэкенд возвращает данные в поле data
      const { data } = response.data
      const { token, user } = data

      if (token && user) {
        // Обновляем данные пользователя из ответа
        const updatedUser: User = {
          id: user.id,
          email: user.email,
          name: user.name,
          user_type: user.role_code,
          role_category: user.role_category,
          role_code: user.role_code,
          twoFactorEnabled: user.two_factor_enabled,
          isActive: isUserActive(user.status),
          lastLogin: user.last_login,
          permissions: getPermissionsForRole(user.role_code),
        }

        localStorage.setItem('authToken', token)
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        currentUser.value = updatedUser
        isAuthenticated.value = true
        localStorage.setItem('user', JSON.stringify(updatedUser))
        console.log('✅ 2FA verification successful - user authenticated')

        // Initialize session manager after successful 2FA verification
        initializeSessionManager({
          checkInterval: 5 * 60 * 1000, // 5 minutes
          activityCheckInterval: 60 * 1000, // 1 minute
          useAPI: true, // Enable API checks now that backend is ready
          onSessionExpired: () => {
            console.log('🔒 Session expired - logging out')
            logout()
          },
          onSessionValid: () => {
            console.log('✅ Session is valid')
          },
        })

        // Set up API interceptor callback
        setSessionExpiredCallback(() => {
          console.log('🔒 API interceptor detected session expiration')
          logout()
        })

        // Start session monitoring
        startSessionManager()

        return { success: true }
      } else {
        console.log('❌ No token or user data in 2FA response')
        return { success: false, error: 'Invalid 2FA code' }
      }
    } catch (error: unknown) {
      console.error('❌ 2FA verification error:', error)

      // Обработка ошибок от бэкенда
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } }
        if (axiosError.response?.data?.message) {
          return { success: false, error: axiosError.response.data.message }
        }
      }

      const errorMessage = error instanceof Error ? error.message : 'Invalid 2FA code'
      return { success: false, error: errorMessage }
    }
  }

  async function enableTwoFactor(phone: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📱 Enabling 2FA for phone:', phone)
      console.log('🆔 User ID:', currentUser.value?.id)

      const response = await api.post('/api/v1/2fa/enable', {
        user_id: currentUser.value?.id,
        phone,
      })

      console.log('✅ Enable 2FA response:', response.data)

      if (response.data.status === 'success') {
        // Обновляем статус пользователя
        if (currentUser.value) {
          currentUser.value.twoFactorEnabled = true
          localStorage.setItem('user', JSON.stringify(currentUser.value))
        }
        console.log('✅ 2FA enabled successfully')
        return { success: true }
      } else {
        console.log('❌ Failed to enable 2FA')
        return { success: false, error: response.data.message }
      }
    } catch (error: unknown) {
      console.error('❌ Enable 2FA error:', error)

      // Обработка ошибок от бэкенда
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } }
        if (axiosError.response?.data?.message) {
          return { success: false, error: axiosError.response.data.message }
        }
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to enable 2FA'
      return { success: false, error: errorMessage }
    }
  }

  async function disableTwoFactor(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📱 Disabling 2FA')
      console.log('🆔 User ID:', currentUser.value?.id)

      const response = await api.post('/api/v1/2fa/disable', {
        user_id: currentUser.value?.id,
      })

      console.log('✅ Disable 2FA response:', response.data)

      if (response.data.status === 'success') {
        // Обновляем статус пользователя
        if (currentUser.value) {
          currentUser.value.twoFactorEnabled = false
          localStorage.setItem('user', JSON.stringify(currentUser.value))
        }
        console.log('✅ 2FA disabled successfully')
        return { success: true }
      } else {
        console.log('❌ Failed to disable 2FA')
        return { success: false, error: response.data.message }
      }
    } catch (error: unknown) {
      console.error('❌ Disable 2FA error:', error)

      // Обработка ошибок от бэкенда
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } }
        if (axiosError.response?.data?.message) {
          return { success: false, error: axiosError.response.data.message }
        }
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to disable 2FA'
      return { success: false, error: errorMessage }
    }
  }

  // Helper function to check if token is expired
  // Now uses the new JWT utility function
  function isTokenExpiredLocal(token: string): boolean {
    // Skip check for mock tokens
    if (token.startsWith('dev_token_')) {
      console.log('🔍 Mock token detected, skipping expiration check')
      return false
    }

    // Use the new JWT utility function
    return isTokenExpired(token)
  }

  // Helper function to check if token needs refresh (5 minutes before expiry)
  // Simple validation without complex JWT parsing
  function shouldRefreshToken(token: string): boolean {
    // For now, always return false to avoid complex validation
    // TODO: Implement proper token refresh logic when backend is ready
    console.log('🔍 Token refresh check - always false for now')
    console.log('🔑 Token length:', token.length)
    return false
  }

  // Function to refresh token
  async function refreshToken(): Promise<boolean> {
    try {
      console.log('🔄 Attempting to refresh token...')

      // Try to get new token using current user data
      if (currentUser.value) {
        const response = await api.post('/api/v1/auth/refresh', {
          user_id: currentUser.value.id,
          email: currentUser.value.email,
        })

        if (response.data.status === 'success') {
          const newToken = response.data.data.token
          localStorage.setItem('authToken', newToken)
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
          console.log('✅ Token refreshed successfully')
          return true
        }
      }

      console.log('❌ Token refresh failed')
      return false
    } catch (error) {
      console.error('❌ Token refresh error:', error)
      return false
    }
  }

  // Profile management functions
  async function getProfile(): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      console.log('👤 Fetching user profile')
      console.log('🔑 Current token in headers:', api.defaults.headers.common['Authorization'])
      console.log('🔑 Current user:', currentUser.value?.email)

      // Temporarily disabled token refresh to fix login
      // const authHeader = api.defaults.headers.common['Authorization']
      // const token = typeof authHeader === 'string' ? authHeader.replace('Bearer ', '') : ''
      // if (token && shouldRefreshToken(token)) {
      //   console.log('⚠️ Token needs refresh before API call, attempting to refresh...')
      //   const refreshSuccess = await refreshToken()
      //   if (!refreshSuccess) {
      //     console.log('❌ Token refresh failed, logging out')
      //     logout()
      //     return { success: false, error: 'Token expired' }
      //   }
      // }

      const response = await api.get('/api/v1/profile')

      console.log('✅ Profile response:', response.data)

      if (response.data.status === 'success') {
        const backendUser = response.data.data.user
        const frontendUser: User = {
          id: backendUser.id,
          email: backendUser.email,
          name: backendUser.name,
          role_category: backendUser.role_category,
          role_code: backendUser.role_code,
          twoFactorEnabled: isTwoFactorEnabled(backendUser.two_factor_enabled),
          isActive: isUserActive(backendUser.status),
          lastLogin: backendUser.last_login,
          permissions: getPermissionsForRole(backendUser.role_code),
          avatarUrl: backendUser.avatar_url
            ? backendUser.avatar_url.startsWith('http')
              ? backendUser.avatar_url
              : `${apiConfig.baseURL}${backendUser.avatar_url}`
            : undefined,
          // Добавляем дополнительные поля
          phone: backendUser.phone,
          job_title: backendUser.job_title,
          user_type: backendUser.role_code,
          additional_info: backendUser.additional_info,
          company: backendUser.company,
          department: backendUser.department,
          location: backendUser.location,
        }

        // Update current user
        currentUser.value = frontendUser
        localStorage.setItem('user', JSON.stringify(frontendUser))

        console.log('✅ Profile fetched successfully')
        console.log('🖼️ Avatar URL:', frontendUser.avatarUrl)
        return { success: true, user: frontendUser }
      } else {
        console.log('❌ Failed to fetch profile')
        return { success: false, error: response.data.message }
      }
    } catch (error: unknown) {
      console.error('❌ Get profile error:', error)

      // Обработка ошибок от бэкенда
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string }; status?: number } }
        console.log('🔍 Error response status:', axiosError.response?.status)
        console.log('🔍 Error response data:', axiosError.response?.data)
        if (axiosError.response?.data?.message) {
          return { success: false, error: axiosError.response.data.message }
        }
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch profile'
      return { success: false, error: errorMessage }
    }
  }

  async function updateProfile(profileData: {
    first_name?: string
    last_name?: string
    phone?: string
    job_title?: string
    additional_info?: string
    user_type?: string
    company?: string
    department?: string
    location?: string
  }): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      console.log('📝 Updating user profile:', profileData)

      const response = await api.put('/api/v1/profile', profileData)

      console.log('✅ Update profile response:', response.data)

      if (response.data.status === 'success') {
        const backendUser = response.data.data.user
        const frontendUser: User = {
          id: backendUser.id,
          email: backendUser.email,
          name: backendUser.name,
          role_category: backendUser.role_category,
          role_code: backendUser.role_code,
          twoFactorEnabled: isTwoFactorEnabled(backendUser.two_factor_enabled),
          isActive: isUserActive(backendUser.status),
          lastLogin: backendUser.last_login,
          permissions: getPermissionsForRole(backendUser.role_code),
          avatarUrl: backendUser.avatar_url
            ? backendUser.avatar_url.startsWith('http')
              ? backendUser.avatar_url
              : `${apiConfig.baseURL}${backendUser.avatar_url}`
            : undefined,
          // Добавляем дополнительные поля
          phone: backendUser.phone,
          job_title: backendUser.job_title,
          user_type: backendUser.role_code,
          additional_info: backendUser.additional_info,
          company: backendUser.company,
          department: backendUser.department,
          location: backendUser.location,
        }

        // Update current user
        currentUser.value = frontendUser
        localStorage.setItem('user', JSON.stringify(frontendUser))

        console.log('✅ Profile updated successfully')
        console.log('🖼️ Avatar URL:', frontendUser.avatarUrl)
        return { success: true, user: frontendUser }
      } else {
        console.log('❌ Failed to update profile')
        return { success: false, error: response.data.message }
      }
    } catch (error: unknown) {
      console.error('❌ Update profile error:', error)

      // Обработка ошибок от бэкенда
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } }
        if (axiosError.response?.data?.message) {
          return { success: false, error: axiosError.response.data.message }
        }
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile'
      return { success: false, error: errorMessage }
    }
  }

  async function uploadAvatar(
    file: File,
  ): Promise<{ success: boolean; avatarUrl?: string; error?: string }> {
    try {
      console.log('📸 Uploading avatar:', file.name)

      const formData = new FormData()
      formData.append('avatar', file)

      const response = await api.post('/api/v1/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      console.log('✅ Upload avatar response:', response.data)

      if (response.data.status === 'success') {
        const avatarUrl = response.data.data.avatar_url
        // Check if it's a relative path and add baseURL if needed
        const fullAvatarUrl = avatarUrl.startsWith('http')
          ? avatarUrl
          : `${apiConfig.baseURL}${avatarUrl}`

        // Update current user avatar with full URL
        if (currentUser.value) {
          currentUser.value.avatarUrl = fullAvatarUrl
          localStorage.setItem('user', JSON.stringify(currentUser.value))
        }

        console.log('✅ Avatar uploaded successfully')
        console.log('🔗 Avatar URL from server:', avatarUrl)
        console.log('🔗 Full URL:', fullAvatarUrl)
        console.log('🌍 Environment:', getCurrentEnvironment())
        console.log('🔗 Base URL:', apiConfig.baseURL)
        console.log('📁 File size:', file.size, 'bytes')
        console.log('📁 File type:', file.type)
        return { success: true, avatarUrl: fullAvatarUrl }
      } else {
        console.log('❌ Failed to upload avatar')
        return { success: false, error: response.data.message }
      }
    } catch (error: unknown) {
      console.error('❌ Upload avatar error:', error)

      // Обработка ошибок от бэкенда
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } }
        if (axiosError.response?.data?.message) {
          return { success: false, error: axiosError.response.data.message }
        }
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to upload avatar'
      return { success: false, error: errorMessage }
    }
  }

  async function enableTwoFactorFromProfile(
    deliveryMethod: 'sms' | 'email',
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📱 Enabling 2FA from profile via:', deliveryMethod)

      const response = await api.post('/api/v1/profile/2fa/enable', {
        delivery_method: deliveryMethod,
      })

      console.log('✅ Enable 2FA from profile response:', response.data)

      if (response.data.status === 'success') {
        console.log('✅ 2FA enable request sent successfully')
        return { success: true }
      } else {
        console.log('❌ Failed to enable 2FA')
        return { success: false, error: response.data.message }
      }
    } catch (error: unknown) {
      console.error('❌ Enable 2FA from profile error:', error)

      // Обработка ошибок от бэкенда
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } }
        if (axiosError.response?.data?.message) {
          return { success: false, error: axiosError.response.data.message }
        }
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to enable 2FA'
      return { success: false, error: errorMessage }
    }
  }

  async function disableTwoFactorFromProfile(
    verificationCode: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📱 Disabling 2FA from profile')

      const response = await api.post('/api/v1/profile/2fa/disable', {
        verification_code: verificationCode,
      })

      console.log('✅ Disable 2FA from profile response:', response.data)

      if (response.data.status === 'success') {
        // Обновляем статус пользователя
        if (currentUser.value) {
          currentUser.value.twoFactorEnabled = false
          localStorage.setItem('user', JSON.stringify(currentUser.value))
        }
        console.log('✅ 2FA disabled successfully from profile')
        return { success: true }
      } else {
        console.log('❌ Failed to disable 2FA')
        return { success: false, error: response.data.message }
      }
    } catch (error: unknown) {
      console.error('❌ Disable 2FA from profile error:', error)

      // Обработка ошибок от бэкенда
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } }
        if (axiosError.response?.data?.message) {
          return { success: false, error: axiosError.response.data.message }
        }
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to disable 2FA'
      return { success: false, error: errorMessage }
    }
  }

  async function logout() {
    try {
      // Get token before clearing localStorage
      const token = localStorage.getItem('authToken')

      // Stop session manager first
      stopSessionManager()

      // Call backend logout endpoint first
      if (token) {
        try {
          await api.post(
            '/api/v1/auth/logout',
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          )
          console.log('🔓 Logout - backend call successful')
        } catch (error) {
          console.error('Logout backend error:', error)
          // Continue with local cleanup even if backend call fails
        }
      }

      // Clear local state
      currentUser.value = null
      isAuthenticated.value = false
      localStorage.removeItem('user')
      localStorage.removeItem('authToken')
      delete api.defaults.headers.common['Authorization']

      console.log('✅ Logout completed - local state cleared')
      console.log('🔍 localStorage after logout:', Object.keys(localStorage))
      console.log('🔍 authToken after logout:', localStorage.getItem('authToken'))
      console.log('🔍 user after logout:', localStorage.getItem('user'))
    } catch (error) {
      console.error('Logout error:', error)
      // Ensure local state is cleared even if there's an error
      currentUser.value = null
      isAuthenticated.value = false
      localStorage.removeItem('user')
      localStorage.removeItem('authToken')
      delete api.defaults.headers.common['Authorization']

      console.log('✅ Logout error cleanup completed')
      console.log('🔍 localStorage after error cleanup:', Object.keys(localStorage))
    }
  }

  function checkPermission(permission: string): boolean {
    if (!currentUser.value) return false

    // Проверяем, есть ли permissions
    if (!currentUser.value.permissions) {
      console.warn('⚠️ User permissions not defined, using role-based fallback')
      // Fallback на основе роли
      if (permission === 'projects:read') {
        return ['admin', 'manager', 'supervisor', 'engineer', 'viewer'].includes(
          currentUser.value.role_code || '',
        )
      }
      if (permission === 'people:read') {
        return ['admin'].includes(currentUser.value.role_code || '')
      }
      return ['admin', 'project_manager'].includes(currentUser.value.role_code || '')
    }

    if (currentUser.value.permissions.includes('all')) return true
    return currentUser.value.permissions.includes(permission)
  }

  // Update work status
  async function updateWorkStatus(statusData: {
    isActive: boolean
    inactive_reason?: string
    inactive_reason_details?: string
  }): Promise<{
    success: boolean
    user?: User
    workStatus?: {
      isActive: boolean
      inactive_reason?: string
      inactive_reason_details?: string
      updated_at?: string
    }
    error?: string
  }> {
    try {
      console.log('📝 Updating work status:', statusData)

      const response = await api.put('/api/v1/profile/work-status', statusData)

      console.log('✅ Update work status response:', response.data)

      if (response.data.status === 'success') {
        const workStatus = response.data.data.work_status

        // Update current user's work status
        if (currentUser.value) {
          currentUser.value.isActive = workStatus.isActive
          currentUser.value.inactive_reason = workStatus.inactive_reason
          currentUser.value.inactive_reason_details = workStatus.inactive_reason_details
          localStorage.setItem('user', JSON.stringify(currentUser.value))
        }

        console.log('✅ Work status updated successfully')
        return { success: true, workStatus, user: currentUser.value || undefined }
      } else {
        console.log('❌ Failed to update work status')
        return { success: false, error: response.data.message }
      }
    } catch (error: unknown) {
      console.error('❌ Update work status error:', error)

      // Обработка ошибок от бэкенда
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } }
        if (axiosError.response?.data?.message) {
          return { success: false, error: axiosError.response.data.message }
        }
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to update work status'
      return { success: false, error: errorMessage }
    }
  }

  // Initialize from localStorage and token
  async function initializeAuth() {
    const token = localStorage.getItem('authToken')
    const savedUser = localStorage.getItem('user')

    console.log('🔄 Initializing auth...')
    console.log('🔑 Token exists:', !!token)
    console.log('👤 Saved user exists:', !!savedUser)

    if (token && savedUser) {
      try {
        // Check if token is expired using new JWT utils
        if (isTokenExpiredLocal(token)) {
          console.log('❌ Token is expired, logging out')
          logout()
          return
        }

        // Parse saved user data
        const user = JSON.parse(savedUser)

        // Validate user data
        if (user && user.id && user.email) {
          currentUser.value = user
          isAuthenticated.value = true
          console.log('✅ Auth initialized from localStorage')
          console.log('👤 Current user:', user.email)

          // Initialize session manager
          initializeSessionManager({
            checkInterval: 5 * 60 * 1000, // 5 minutes
            activityCheckInterval: 60 * 1000, // 1 minute
            useAPI: true, // Enable API checks now that backend is ready
            onSessionExpired: () => {
              console.log('🔒 Session expired - logging out')
              logout()
            },
            onSessionValid: () => {
              console.log('✅ Session is valid')
            },
          })

          // Set up API interceptor callback
          setSessionExpiredCallback(() => {
            console.log('🔒 API interceptor detected session expiration')
            logout()
          })

          // Start session monitoring
          startSessionManager()
        } else {
          // User data corrupted, clear everything
          console.log('❌ User data corrupted, logging out')
          logout()
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        // Clear everything on error
        logout()
      }
    } else {
      console.log('❌ No token or user data found')
    }
  }

  // Helper function to check if user is active
  function isUserActive(status: number | string | boolean): boolean {
    if (typeof status === 'boolean') return status
    if (typeof status === 'number') return status === 1
    if (typeof status === 'string') {
      const lowerStatus = status.toLowerCase()
      return (
        lowerStatus === 'active' ||
        lowerStatus === '1' ||
        lowerStatus === 'true' ||
        lowerStatus === 'yes'
      )
    }
    return false
  }

  // Helper function to check if 2FA is enabled
  function isTwoFactorEnabled(enabled: boolean | number | string | null | undefined): boolean {
    if (enabled === null || enabled === undefined) return false
    if (typeof enabled === 'boolean') return enabled
    if (typeof enabled === 'number') return enabled === 1
    if (typeof enabled === 'string') return enabled === '1' || enabled === 'true'
    return false
  }

  // Helper function to get permissions for a specific role
  function getPermissionsForRole(role_code: User['role_code']): string[] {
    switch (role_code) {
      case 'admin':
        return [
          'all',
          'manage_users',
          'projects:read',
          'people:read',
          'manage_tasks',
          'manage_files',
          'manage_reports',
          'view_analytics',
          'system_settings',
        ]
      case 'project_manager':
        return [
          'manage_projects',
          'projects:read',
          'people:read',
          'manage_tasks',
          'manage_files',
          'manage_reports',
          'view_analytics',
          'invite_users',
        ]
      case 'architect':
        return ['projects:read', 'manage_tasks', 'manage_files', 'view_reports', 'view_analytics']
      case 'foreman':
        return ['projects:read', 'manage_tasks', 'upload_files', 'view_reports']
      case 'worker':
        return ['projects:read', 'view_tasks', 'view_files', 'view_reports']
      case 'contractor':
        return ['projects:read', 'view_tasks', 'view_files', 'view_reports']
      case 'inspector':
        return ['projects:read', 'view_tasks', 'view_files', 'view_reports']
      default:
        return ['projects:read', 'view_tasks']
    }
  }

  return {
    // State
    currentUser,
    isAuthenticated,
    users,
    invitations,

    // Computed
    isAdmin,
    isManager,
    canManageUsers,
    canManageProjects,

    // Actions
    login,
    sendTwoFactorCode,
    verifyTwoFactor,
    enableTwoFactor,
    disableTwoFactor,
    logout,
    checkPermission,
    initializeAuth,
    getProfile,
    updateProfile,
    uploadAvatar,
    enableTwoFactorFromProfile,
    disableTwoFactorFromProfile,
    updateWorkStatus,
    refreshToken,
    shouldRefreshToken,
  }
})

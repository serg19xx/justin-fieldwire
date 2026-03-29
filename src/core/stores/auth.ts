import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api, setSessionExpiredCallback } from '@/core/utils/api'
import { apiConfig } from '@/config/api'
import {
  initializeSessionManager,
  startSessionManager,
  stopSessionManager,
} from '@/core/utils/session-manager'

export interface User {
  id: number
  email: string
  name: string
  first_name?: string
  last_name?: string
  role_id?: number
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
  two_factor_enabled: boolean
  twoFactorEnabled?: boolean // Added for backward compatibility
  status: boolean
  isActive?: boolean // Added for backward compatibility
  last_login?: string
  permissions?: string[]
  avatar_url?: string
  full_img_url?: string
  // Добавляем дополнительные поля профиля
  phone?: string
  job_title?: string
  additional_info?: string
  gender?: string
  birth_date?: string
  age?: string
  specialization?: string
  // Добавляем поля для статуса работы
  inactive_reason?: string
  inactive_reason_details?: string
  inactive_until?: string
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
  ): Promise<{
    success: boolean
    user?: User
    requires2FA?: boolean
    requiresPasswordChange?: boolean
    error?: string
  }> {
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
      console.log('📥 Full response.data:', response.data)
      console.log('📥 response.data.data:', response.data.data)

      const responseData = response.data.data || response.data
      console.log('📥 responseData:', responseData)

      const { user, token, requires_2fa } = responseData
      console.log('📥 After destructuring - user:', user)
      console.log('📥 After destructuring - token:', token)
      console.log('📥 After destructuring - requires_2fa:', requires_2fa)

      console.log('👤 User data from backend:', user)
      console.log('🔐 Token from backend:', token ? 'present' : 'missing')
      console.log('🔒 2FA required:', requires_2fa)
      console.log('🔍 Role category from backend:', user.role_category)
      console.log('🔍 Role code from backend:', user.role_code)
      console.log('🔍 Full user from backend:', JSON.stringify(user, null, 2))

      // Преобразуем структуру пользователя в формат фронтенда
      const frontendUser: User = ensureUserRoleCategory({
        id: user.id,
        email: user.email,
        name: user.name,
        first_name: user.first_name,
        last_name: user.last_name,
        role_id: user.role_id,
        phone: user.phone,
        job_title: user.job_title,
        role_category: user.role_category,
        role_code: user.role_code,
        role_name: user.role_name,
        two_factor_enabled: user.two_factor_enabled,
        twoFactorEnabled: user.two_factor_enabled, // Add compatibility field
        status: isUserActive(user.status),
        isActive: isUserActive(user.status), // Add compatibility field
        last_login: user.last_login,
        permissions: getPermissionsForRole(user.role_code),
        avatar_url: user.avatar_url
          ? user.avatar_url.startsWith('http')
            ? user.avatar_url
            : `${apiConfig.baseURL}${user.avatar_url}`
          : undefined,
        full_img_url: user.full_img_url
          ? user.full_img_url.startsWith('http')
            ? user.full_img_url
            : `${apiConfig.baseURL}${user.full_img_url}`
          : undefined,
      } as User)

      // Log invitation status for debugging
      console.log('🔍 Invitation status check:', {
        invitation_status: user.invitation_status,
        is_temporary_password: user.is_temporary_password,
        password_must_change: user.password_must_change,
        first_login: user.first_login,
      })

      // Check if invitation is expired - block login completely
      if (user.invitation_status === 'expired') {
        console.log('❌ Invitation expired for user:', frontendUser.email)
        return {
          success: false,
          error:
            'Your invitation has expired. Please contact your administrator to resend the invitation.',
        }
      }

      // Check if user needs to change temporary password
      // Only redirect if user has specific invitation-related flags
      const needsPasswordChange =
        user.is_temporary_password ||
        user.password_must_change ||
        user.first_login ||
        // Check invitation_status - only 'invited' requires password change
        user.invitation_status === 'invited'

      console.log('🔍 Password change check result:', needsPasswordChange)

      if (needsPasswordChange) {
        // User needs to change temporary password - DON'T save token or set authenticated
        // But save token temporarily for password change request
        if (token) {
          localStorage.setItem('tempAuthToken', token)
          console.log('🔑 Token saved temporarily for password change')
        }

        // Save user data to localStorage for password change process
        localStorage.setItem('user', JSON.stringify(frontendUser))
        currentUser.value = frontendUser
        console.log('🔑 User needs to change temporary password:', frontendUser.email)
        console.log('🔑 User data saved to localStorage for password change')
        console.log('🔍 Password change reasons:', {
          is_temporary_password: user.is_temporary_password,
          password_must_change: user.password_must_change,
          first_login: user.first_login,
          last_login: user.last_login,
          invitation_status: user.invitation_status,
          invitation_status_check: user.invitation_status === 'invited',
          registration_completed_at: user.registration_completed_at,
          role_id: user.role_id,
        })
        console.log('⚠️ Token NOT saved permanently - user must change password first')
        return { success: true, requiresPasswordChange: true, user: frontendUser }
      }

      // Токен сохраняем только если НЕ требуется 2FA и НЕ требуется смена пароля
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
        // Normal login: set user from login response first (correct role_category for layout)
        currentUser.value = frontendUser
        isAuthenticated.value = true
        localStorage.setItem('user', JSON.stringify(frontendUser))
        console.log('✅ Login successful for user:', frontendUser.email)

        // Merge profile (avatar, etc.) but keep role fields from login so layout stays correct
        try {
          const profileResult = await getProfile()
          if (profileResult.success && profileResult.user) {
            const profileUser = profileResult.user
            currentUser.value = {
              ...currentUser.value,
              ...profileUser,
              role_category: frontendUser.role_category,
              role_code: frontendUser.role_code,
              role_id: frontendUser.role_id,
              role_name: frontendUser.role_name,
              permissions: getPermissionsForRole(frontendUser.role_code),
            }
            localStorage.setItem('user', JSON.stringify(currentUser.value))
            console.log('✅ Profile merged, role_category kept from login:', currentUser.value.role_category)
          }
        } catch (error) {
          console.warn('⚠️ Failed to load profile after login:', error)
        }

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

        return { success: true, user: currentUser.value }
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

      // Бэкенд возвращает данные напрямую в response.data
      const { token, user } = response.data

      if (token && user) {
        // Обновляем данные пользователя из ответа
        const updatedUser: User = ensureUserRoleCategory({
          id: user.id,
          email: user.email,
          name: user.name,
          role_id: user.role_id,
          role_category: user.role_category,
          role_code: user.role_code,
          role_name: user.role_name,
          two_factor_enabled: isTwoFactorEnabled(user.two_factor_enabled),
          status: isUserActive(user.status),
          last_login: user.last_login,
          permissions: getPermissionsForRole(user.role_code),
        } as User)

        localStorage.setItem('authToken', token)
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        currentUser.value = updatedUser
        isAuthenticated.value = true
        localStorage.setItem('user', JSON.stringify(updatedUser))
        console.log('✅ 2FA verification successful - user authenticated')
        console.log('🔍 Auth state after 2FA:', {
          isAuthenticated: isAuthenticated.value,
          hasUser: !!currentUser.value,
          userEmail: currentUser.value?.email,
        })

        // Load full profile data including avatar
        try {
          console.log('🖼️ Loading full profile data for avatar...')
          const profileResult = await getProfile()
          if (profileResult.success && profileResult.user && currentUser.value) {
            currentUser.value = mergeUserPreserveLayoutRoles(
              currentUser.value,
              profileResult.user,
            )
            localStorage.setItem('user', JSON.stringify(currentUser.value))
            console.log('✅ Full profile loaded, avatar URL:', currentUser.value.avatar_url)
          }
        } catch (error) {
          console.warn('⚠️ Failed to load full profile, using basic user data:', error)
        }

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

        // Force reactivity update
        await new Promise((resolve) => setTimeout(resolve, 0))

        console.log('🔍 Final auth state check:', {
          isAuthenticated: isAuthenticated.value,
          hasUser: !!currentUser.value,
        })

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
          currentUser.value.two_factor_enabled = true
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
          currentUser.value.two_factor_enabled = false
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
          first_name: backendUser.first_name,
          last_name: backendUser.last_name,
          role_id: backendUser.role_id,
          role_category: backendUser.role_category,
          role_code: backendUser.role_code,
          role_name: backendUser.role_name,
          two_factor_enabled: isTwoFactorEnabled(backendUser.two_factor_enabled),
          twoFactorEnabled: isTwoFactorEnabled(backendUser.two_factor_enabled), // Add compatibility field
          status: isUserActive(backendUser.status),
          isActive: isUserActive(backendUser.status), // Add compatibility field
          last_login: backendUser.last_login,
          permissions: getPermissionsForRole(backendUser.role_code),
          avatar_url: backendUser.avatar_url
            ? backendUser.avatar_url.startsWith('http')
              ? backendUser.avatar_url
              : `${apiConfig.baseURL}${backendUser.avatar_url}`
            : undefined,
          full_img_url: backendUser.full_img_url
            ? backendUser.full_img_url.startsWith('http')
              ? backendUser.full_img_url
              : `${apiConfig.baseURL}${backendUser.full_img_url}`
            : undefined,
          // Добавляем дополнительные поля
          phone: backendUser.phone,
          job_title: backendUser.job_title,
          additional_info: backendUser.additional_info,
          gender: backendUser.gender,
          birth_date: backendUser.birth_date,
          age: backendUser.age,
          specialization: backendUser.specialization,
          inactive_reason: backendUser.inactive_reason,
          inactive_reason_details: backendUser.inactive_reason_details,
          inactive_until: backendUser.inactive_until,
        }

        const hasLayoutCategory =
          frontendUser.role_category === 'global' ||
          frontendUser.role_category === 'project' ||
          frontendUser.role_category === 'task'
        if (!hasLayoutCategory) {
          console.warn(
            '[auth] GET /api/v1/profile: user.role_category is missing or invalid. ' +
              'Return role_category (global | project | task) with role_code so layout matches login after refresh. ' +
              'See docs/BACKEND_PROFILE_ROLE_FIELDS.md',
            { role_code: frontendUser.role_code, raw: backendUser.role_category },
          )
        }

        // Don't update currentUser - keep login data intact
        // Only return profile data for editing

        console.log('✅ Profile fetched successfully')
        console.log('🖼️ Avatar URL:', frontendUser.avatar_url)
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
          currentUser.value.two_factor_enabled = false
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

  /**
   * Layout + router depend on role_category. Profile API often omits it; spread merge would clear it.
   */
  function inferRoleCategoryFromRoleCode(
    roleCode: string | null | undefined,
  ): User['role_category'] | undefined {
    if (roleCode == null || typeof roleCode !== 'string') return undefined
    const c = roleCode.toLowerCase()
    if (c === 'admin') return 'global'
    if (c === 'project_manager' || c === 'architect') return 'project'
    if (['worker', 'foreman', 'contractor', 'inspector'].includes(c)) return 'task'
    return undefined
  }

  function ensureUserRoleCategory(user: User): User {
    if (user.role_category === 'global' || user.role_category === 'project' || user.role_category === 'task') {
      return user
    }
    const inferred = inferRoleCategoryFromRoleCode(user.role_code)
    return inferred ? { ...user, role_category: inferred } : user
  }

  function mergeUserPreserveLayoutRoles(base: User, patch: Partial<User>): User {
    const merged: User = { ...base, ...patch }
    merged.role_category =
      patch.role_category ??
      base.role_category ??
      inferRoleCategoryFromRoleCode(patch.role_code ?? base.role_code)
    merged.role_code = (patch.role_code ?? base.role_code) as User['role_code']
    merged.role_id = patch.role_id ?? base.role_id
    merged.role_name = patch.role_name ?? base.role_name
    merged.permissions = getPermissionsForRole(merged.role_code)
    return ensureUserRoleCategory(merged)
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

  // Initialize from localStorage and token
  async function initializeAuth() {
    const token = localStorage.getItem('authToken')
    const savedUser = localStorage.getItem('user')

    console.log('🔄 Initializing auth...')
    console.log('🔑 Token exists:', !!token)
    console.log('👤 Saved user exists:', !!savedUser)

    if (token && savedUser) {
      try {
        // Temporarily disabled token expiration check for development
        // if (isTokenExpiredLocal(token)) {
        //   console.log('❌ Token is expired, logging out')
        //   logout()
        //   return
        // }

        // Parse saved user data
        const user = JSON.parse(savedUser)

        // Validate user data
        if (user && user.id && user.email) {
          currentUser.value = ensureUserRoleCategory(user as User)
          isAuthenticated.value = true
          console.log('✅ Auth initialized from localStorage')
          console.log('👤 Current user:', user.email)
          console.log('🔍 Auth state after init:', {
            isAuthenticated: isAuthenticated.value,
            hasUser: !!currentUser.value,
          })

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

          // Load full profile data if avatar is missing
          if (currentUser.value && !currentUser.value.avatar_url) {
            try {
              console.log('🖼️ Loading full profile data for missing avatar...')
              const profileResult = await getProfile()
              if (profileResult.success && profileResult.user && currentUser.value) {
                currentUser.value = mergeUserPreserveLayoutRoles(
                  currentUser.value,
                  profileResult.user,
                )
                localStorage.setItem('user', JSON.stringify(currentUser.value))
                console.log(
                  '✅ Full profile loaded on init, avatar URL:',
                  currentUser.value.avatar_url,
                )
              }
            } catch (error) {
              console.warn('⚠️ Failed to load full profile on init:', error)
            }
          }
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
    checkSession,
    getProfile,
    enableTwoFactorFromProfile,
    disableTwoFactorFromProfile,
    refreshToken,
    shouldRefreshToken,
    requestPasswordRecovery,
    resetPassword,
    changePassword,
  }

  // Password recovery function
  async function requestPasswordRecovery(
    email: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📧 Requesting password recovery for:', email)

      const response = await api.post('/api/v1/auth/forgot-password', {
        email: email,
      })

      console.log('✅ Password recovery response:', response.data)

      if (response.data.status === 'success') {
        return { success: true }
      } else {
        return { success: false, error: response.data.message || 'Failed to send recovery email' }
      }
    } catch (error: unknown) {
      console.error('❌ Password recovery error:', error)

      // Handle backend errors
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } }
        if (axiosError.response?.data?.message) {
          return { success: false, error: axiosError.response.data.message }
        }
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to send recovery email'
      return { success: false, error: errorMessage }
    }
  }

  // Reset password function (for forgot password flow)
  async function resetPassword(data: {
    token: string
    newPassword: string
    confirmPassword: string
  }): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔐 Resetting password with token')

      // Validate passwords match
      if (data.newPassword !== data.confirmPassword) {
        return { success: false, error: 'New passwords do not match' }
      }

      // Validate password strength
      if (data.newPassword.length < 8) {
        return { success: false, error: 'New password must be at least 8 characters long' }
      }

      const response = await api.post('/api/v1/auth/reset-password', {
        token: data.token,
        new_password: data.newPassword,
        confirm_password: data.confirmPassword,
      })

      console.log('✅ Reset password response:', response.data)

      if (response.data.status === 'success') {
        return { success: true }
      } else {
        return { success: false, error: response.data.message || 'Failed to reset password' }
      }
    } catch (error: unknown) {
      console.error('❌ Reset password error:', error)

      // Handle backend errors
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } }
        if (axiosError.response?.data?.message) {
          return { success: false, error: axiosError.response.data.message }
        }
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to reset password'
      return { success: false, error: errorMessage }
    }
  }

  // Change password function (for authenticated users)
  async function changePassword(data: {
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔐 Changing password for user:', currentUser.value?.email)

      // Validate passwords match
      if (data.newPassword !== data.confirmPassword) {
        return { success: false, error: 'New passwords do not match' }
      }

      // Validate password strength
      if (data.newPassword.length < 8) {
        return { success: false, error: 'New password must be at least 8 characters long' }
      }

      const response = await api.post('/api/v1/profile/change-password', {
        current_password: data.currentPassword,
        new_password: data.newPassword,
        confirm_password: data.confirmPassword,
      })

      console.log('✅ Change password response:', response.data)

      if (response.data.status === 'success') {
        return { success: true }
      } else {
        return { success: false, error: response.data.message || 'Failed to change password' }
      }
    } catch (error: unknown) {
      console.error('❌ Change password error:', error)

      // Handle backend errors
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } }
        if (axiosError.response?.data?.message) {
          return { success: false, error: axiosError.response.data.message }
        }
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to change password'
      return { success: false, error: errorMessage }
    }
  }

  // Check if user session is valid
  async function checkSession(): Promise<boolean> {
    // Session check completely disabled for development
    console.log('🔍 Session check disabled for development - always returning true')
    return true
  }
})

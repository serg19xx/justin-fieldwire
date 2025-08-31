import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/utils/api'
import { apiConfig } from '@/config/api'

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
  role: 'admin' | 'manager' | 'supervisor' | 'engineer' | 'viewer'
  twoFactorEnabled: boolean
  isActive: boolean
  lastLogin?: string
  permissions?: string[] // Сделали опциональным
  avatarUrl?: string // Added for avatar management
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
  const users = ref<User[]>([
    {
      id: 1,
      email: 'admin@company.com',
      name: 'Justin Admin',
      role: 'admin',
      twoFactorEnabled: true,
      isActive: true,
      lastLogin: '2024-01-15T10:30:00Z',
      permissions: ['all'],
    },
    {
      id: 2,
      email: 'manager@company.com',
      name: 'Sarah Manager',
      role: 'manager',
      twoFactorEnabled: false,
      isActive: true,
      lastLogin: '2024-01-15T09:15:00Z',
      permissions: ['projects:read', 'projects:write', 'people:read', 'tasks:read', 'tasks:write'],
    },
    {
      id: 3,
      email: 'supervisor@company.com',
      name: 'Mike Supervisor',
      role: 'supervisor',
      twoFactorEnabled: true,
      isActive: true,
      lastLogin: '2024-01-15T08:45:00Z',
      permissions: ['projects:read', 'tasks:read', 'tasks:write', 'photos:read', 'photos:write'],
    },
    {
      id: 4,
      email: 'engineer@company.com',
      name: 'Lisa Engineer',
      role: 'engineer',
      twoFactorEnabled: false,
      isActive: true,
      lastLogin: '2024-01-14T16:20:00Z',
      permissions: ['projects:read', 'tasks:read', 'tasks:write', 'specifications:read'],
    },
    {
      id: 5,
      email: 'viewer@company.com',
      name: 'John Viewer',
      role: 'viewer',
      twoFactorEnabled: false,
      isActive: false,
      lastLogin: '2024-01-10T14:20:00Z',
      permissions: ['projects:read', 'tasks:read'],
    },
  ])

  // Mock invitations data
  const mockInvitations = ref<Invitation[]>([
    {
      id: 1,
      email: 'newuser@company.com',
      role: 'engineer',
      invitedBy: 'admin@company.com',
      invitedAt: '2024-01-15T10:00:00Z',
      expiresAt: '2024-01-22T10:00:00Z',
      status: 'pending',
      temporaryPassword: 'temp123',
    },
  ])

  // Computed properties
  const isAdmin = computed(() => currentUser.value?.role === 'admin')
  const isManager = computed(() => currentUser.value?.role === 'manager')
  const canManageUsers = computed(() =>
    ['admin', 'manager'].includes(currentUser.value?.role || ''),
  )
  const canManageProjects = computed(() =>
    ['admin', 'manager'].includes(currentUser.value?.role || ''),
  )

  // Actions
  async function login(
    email: string,
    password: string,
  ): Promise<{ success: boolean; user?: User; requires2FA?: boolean; error?: string }> {
    try {
      console.log('🌐 Making login request to:', `${api.defaults.baseURL}/auth/login`)
      console.log('📧 Email:', email)
      console.log('🔑 Password:', password ? '***' : 'empty')

      const response = await api.post('/auth/login', {
        email,
        password,
      })

      console.log('✅ Login response:', response.data)

      // Бэкенд возвращает данные в поле data
      const { data } = response.data
      const { user, token, requires_2fa } = data

      console.log('👤 User data from backend:', user)
      console.log('🔐 Token from backend:', token ? 'present' : 'missing')
      console.log('🔒 2FA required:', requires_2fa)

      // Преобразуем структуру пользователя в формат фронтенда
      const frontendUser: User = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: mapUserTypeToRole(user.user_type),
        twoFactorEnabled: user.two_factor_enabled,
        isActive: user.status === 'active',
        lastLogin: user.last_login,
        permissions: getPermissionsForRole(mapUserTypeToRole(user.user_type)),
        avatarUrl: user.avatar_url
          ? user.avatar_url.startsWith('http')
            ? user.avatar_url
            : `${apiConfig.baseURL}${user.avatar_url}`
          : undefined,
      }

      // Токен сохраняем только если НЕ требуется 2FA
      // При 2FA токен будет сохранен после успешной верификации
      if (token && !requires_2fa) {
        localStorage.setItem('token', token)
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
        return { success: true, user: frontendUser }
      }
    } catch (error: unknown) {
      console.error('❌ Login error:', error)

      // Обработка ошибок от бэкенда
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { data?: { message?: string } } } }
        if (axiosError.response?.data?.data?.message) {
          return { success: false, error: axiosError.response.data.data.message }
        }
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
          role: mapUserTypeToRole(user.user_type),
          twoFactorEnabled: user.two_factor_enabled,
          isActive: user.status === 'active',
          lastLogin: user.last_login,
          permissions: getPermissionsForRole(mapUserTypeToRole(user.user_type)),
        }

        localStorage.setItem('token', token)
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        currentUser.value = updatedUser
        isAuthenticated.value = true
        localStorage.setItem('user', JSON.stringify(updatedUser))
        console.log('✅ 2FA verification successful - user authenticated')
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

  // Profile management functions
  async function getProfile(): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      console.log('👤 Fetching user profile')

      const response = await api.get('/api/v1/profile')

      console.log('✅ Profile response:', response.data)

      if (response.data.status === 'success') {
        const backendUser = response.data.data.user
        const frontendUser: User = {
          id: backendUser.id,
          email: backendUser.email,
          name: backendUser.name,
          role: mapUserTypeToRole(backendUser.user_type),
          twoFactorEnabled: backendUser.two_factor_enabled,
          isActive: backendUser.status === 'active',
          lastLogin: backendUser.last_login,
          permissions: getPermissionsForRole(mapUserTypeToRole(backendUser.user_type)),
          avatarUrl: backendUser.avatar_url
            ? backendUser.avatar_url.startsWith('http')
              ? backendUser.avatar_url
              : `${apiConfig.baseURL}${backendUser.avatar_url}`
            : undefined,
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
        const axiosError = error as { response?: { data?: { message?: string } } }
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
          role: mapUserTypeToRole(backendUser.user_type),
          twoFactorEnabled: backendUser.two_factor_enabled,
          isActive: backendUser.status === 'active',
          lastLogin: backendUser.last_login,
          permissions: getPermissionsForRole(mapUserTypeToRole(backendUser.user_type)),
          avatarUrl: backendUser.avatar_url
            ? backendUser.avatar_url.startsWith('http')
              ? backendUser.avatar_url
              : `${apiConfig.baseURL}${backendUser.avatar_url}`
            : undefined,
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
      // TODO: Uncomment when backend is ready
      // await api.post('/auth/logout')
      console.log('🔓 Logout - backend call disabled')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear local state
      currentUser.value = null
      isAuthenticated.value = false
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
      console.log('✅ Logout completed - local state cleared')
    }
  }

  function checkPermission(permission: string): boolean {
    if (!currentUser.value) return false

    // Проверяем, есть ли permissions
    if (!currentUser.value.permissions) {
      console.warn('⚠️ User permissions not defined, using role-based fallback')
      // Fallback на основе роли
      return ['admin', 'manager'].includes(currentUser.value.role || '')
    }

    if (currentUser.value.permissions.includes('all')) return true
    return currentUser.value.permissions.includes(permission)
  }

  function inviteUser(email: string, role: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const invitation: Invitation = {
          id: Date.now(),
          email,
          role,
          invitedBy: currentUser.value?.email || '',
          invitedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          status: 'pending',
          temporaryPassword: generateTemporaryPassword(),
        }

        invitations.value.push(invitation)
        resolve(true)
      }, 1000)
    })
  }

  function generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  function createUserFromInvitation(invitation: Invitation): User {
    const newUser: User = {
      id: Date.now(),
      email: invitation.email,
      name: invitation.email.split('@')[0], // Use email prefix as name
      role: invitation.role as User['role'],
      twoFactorEnabled: false,
      isActive: true,
      lastLogin: new Date().toISOString(),
      permissions: getPermissionsForRole(invitation.role),
    }

    users.value.push(newUser)
    return newUser
  }

  function getPermissionsForRole(role: string): string[] {
    switch (role) {
      case 'admin':
        return ['all']
      case 'manager':
        return [
          'projects:read',
          'projects:write',
          'people:read',
          'people:write',
          'tasks:read',
          'tasks:write',
          'reports:read',
        ]
      case 'supervisor':
        return [
          'projects:read',
          'tasks:read',
          'tasks:write',
          'photos:read',
          'photos:write',
          'forms:read',
          'forms:write',
        ]
      case 'engineer':
        return ['projects:read', 'tasks:read', 'tasks:write', 'specifications:read', 'plans:read']
      case 'viewer':
        return ['projects:read', 'tasks:read']
      default:
        return ['projects:read']
    }
  }

  function updateUserRole(userId: number, newRole: string): boolean {
    const user = users.value.find((u) => u.id === userId)
    if (user) {
      user.role = newRole as User['role']
      user.permissions = getPermissionsForRole(newRole)
      return true
    }
    return false
  }

  function deactivateUser(userId: number): boolean {
    const user = users.value.find((u) => u.id === userId)
    if (user) {
      user.isActive = false
      return true
    }
    return false
  }

  function activateUser(userId: number): boolean {
    const user = users.value.find((u) => u.id === userId)
    if (user) {
      user.isActive = true
      return true
    }
    return false
  }

  // Initialize from localStorage and token
  async function initializeAuth() {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')

    if (token && savedUser) {
      try {
        // Set token in API headers
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`

        // TODO: Uncomment when backend is ready
        // const response = await api.get('/auth/me')
        // const user = response.data

        // For now, use saved user data
        const user = JSON.parse(savedUser)

        if (user && user.isActive) {
          currentUser.value = user
          isAuthenticated.value = true
          console.log('✅ Auth initialized from localStorage')
        } else {
          // User inactive, clear everything
          logout()
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        // Clear everything on error
        logout()
      }
    }
  }

  // Helper function to map backend user_type to frontend role
  function mapUserTypeToRole(userType: string): User['role'] {
    switch (userType.toLowerCase()) {
      case 'system administrator':
        return 'admin'
      case 'manager':
        return 'manager'
      case 'supervisor':
        return 'supervisor'
      case 'engineer':
        return 'engineer'
      case 'viewer':
        return 'viewer'
      default:
        return 'viewer'
    }
  }

  return {
    // State
    currentUser,
    isAuthenticated,
    users,
    invitations: mockInvitations,

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
    inviteUser,
    createUserFromInvitation,
    updateUserRole,
    deactivateUser,
    activateUser,
    initializeAuth,
    getProfile,
    updateProfile,
    uploadAvatar,
    enableTwoFactorFromProfile,
    disableTwoFactorFromProfile,
  }
})

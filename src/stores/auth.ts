import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/utils/api'

export interface User {
  id: number
  email: string
  name: string
  role: 'admin' | 'manager' | 'supervisor' | 'engineer' | 'viewer'
  twoFactorEnabled: boolean
  isActive: boolean
  lastLogin?: string
  permissions?: string[] // Сделали опциональным
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
      const { user, token, requires2FA } = data

      console.log('👤 User data from backend:', user)

      if (token) {
        localStorage.setItem('token', token)
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        console.log('🔐 Token saved to localStorage')
      }

      // Добавляем fallback permissions если их нет
      if (!user.permissions) {
        user.permissions = getPermissionsForRole(user.role)
        console.log('🔧 Added fallback permissions for role:', user.role)
      }

      if (requires2FA) {
        currentUser.value = user
        console.log('🔒 2FA required for user:', user.email)
        return { success: true, requires2FA: true, user }
      } else {
        currentUser.value = user
        isAuthenticated.value = true
        localStorage.setItem('user', JSON.stringify(user))
        console.log('✅ Login successful for user:', user.email)
        return { success: true, user }
      }
    } catch (error: unknown) {
      console.error('❌ Login error:', error)

      // Упрощенная обработка ошибок
      const errorMessage =
        error instanceof Error ? error.message : 'Login failed. Please check your credentials.'
      return { success: false, error: errorMessage }
    }
  }

  async function verifyTwoFactor(code: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔐 Making 2FA verification request')
      console.log('📱 2FA Code:', code)

      const response = await api.post('/auth/verify-2fa', {
        code,
      })

      console.log('✅ 2FA response:', response.data)

      // Бэкенд возвращает данные в поле data
      const { data } = response.data
      const { token } = data

      if (token) {
        localStorage.setItem('token', token)
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        isAuthenticated.value = true
        localStorage.setItem('user', JSON.stringify(currentUser.value))
        console.log('✅ 2FA verification successful')
        return { success: true }
      } else {
        console.log('❌ No token in 2FA response')
        return { success: false, error: 'Invalid 2FA code' }
      }
    } catch (error: unknown) {
      console.error('❌ 2FA verification error:', error)

      // Упрощенная обработка ошибок
      const errorMessage = error instanceof Error ? error.message : 'Invalid 2FA code'
      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  async function logout() {
    try {
      // Call logout endpoint to invalidate token on server
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear local state
      currentUser.value = null
      isAuthenticated.value = false
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
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

        // Verify token with server
        const response = await api.get('/auth/me')
        const user = response.data

        if (user && user.isActive) {
          currentUser.value = user
          isAuthenticated.value = true
          localStorage.setItem('user', JSON.stringify(user))
        } else {
          // Token invalid or user inactive
          logout()
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        // Token invalid, clear everything
        logout()
      }
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
    verifyTwoFactor,
    logout,
    checkPermission,
    inviteUser,
    createUserFromInvitation,
    updateUserRole,
    deactivateUser,
    activateUser,
    initializeAuth,
  }
})

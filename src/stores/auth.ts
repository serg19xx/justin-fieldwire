import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface User {
  id: number
  email: string
  name: string
  role: 'admin' | 'manager' | 'supervisor' | 'engineer' | 'viewer'
  twoFactorEnabled: boolean
  isActive: boolean
  lastLogin?: string
  permissions: string[]
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
  function login(
    email: string,
    password: string,
  ): Promise<{ success: boolean; user?: User; requires2FA?: boolean }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = users.value.find((u) => u.email === email && u.isActive)

        if (user) {
          // In real app, verify password hash
          if (password === 'password123' || password === 'temp123') {
            if (user.twoFactorEnabled) {
              currentUser.value = user
              resolve({ success: true, requires2FA: true, user })
            } else {
              currentUser.value = user
              isAuthenticated.value = true
              resolve({ success: true, user })
            }
          } else {
            resolve({ success: false })
          }
        } else {
          resolve({ success: false })
        }
      }, 1000)
    })
  }

  function verifyTwoFactor(code: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (code === '123456' && currentUser.value) {
          isAuthenticated.value = true
          resolve(true)
        } else {
          resolve(false)
        }
      }, 1000)
    })
  }

  function logout() {
    currentUser.value = null
    isAuthenticated.value = false
    localStorage.removeItem('user')
  }

  function checkPermission(permission: string): boolean {
    if (!currentUser.value) return false
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

  // Initialize from localStorage
  function initializeAuth() {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        const user = users.value.find((u) => u.email === userData.email)
        if (user && user.isActive) {
          currentUser.value = user
          isAuthenticated.value = true
        } else {
          localStorage.removeItem('user')
        }
      } catch {
        localStorage.removeItem('user')
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

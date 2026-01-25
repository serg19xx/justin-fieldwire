import axios from 'axios'
import { apiConfig } from '@/config/api'
import { isTokenExpired } from './jwt-utils'

// Создаем основной экземпляр axios для всего приложения
export const api = axios.create(apiConfig)

// Callback for handling session expiration
let onSessionExpired: (() => void) | null = null

/**
 * Set callback for session expiration
 */
export function setSessionExpiredCallback(callback: () => void): void {
  onSessionExpired = callback
}

// Добавляем интерцепторы для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('API Error:', error)

    // Handle 401 Unauthorized errors - auto logout disabled
    if (error.response?.status === 401) {
      console.log('🔒 401 Unauthorized - auto logout disabled')

      // Auto logout disabled - user stays logged in
      console.log('⚠️ 401 error - auto logout disabled, user stays logged in')

      // DISABLED: Token expiration checks disabled for development
      console.log('🚫 Token expiration checks DISABLED - treating as server issue')
      console.log('🔍 Request details:', {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
      })
    }

    // Handle 500 Internal Server Error
    if (error.response?.status === 500) {
      console.error('🔥 500 Internal Server Error')
      console.error('📋 Request URL:', error.config?.url)
      console.error('📋 Request Method:', error.config?.method)
      console.error('📋 Request Params:', error.config?.params)
      console.error('📋 Response Data:', error.response?.data)
      console.error('💡 This is a server-side error. Check backend logs for details.')
    }

    return Promise.reject(error)
  },
)

// Функция для получения токена авторизации
function getAuthToken(): string | null {
  const token = localStorage.getItem('authToken')
  console.log('🔑 getAuthToken called - localStorage keys:', Object.keys(localStorage))
  console.log(
    '🔑 getAuthToken called - authToken value:',
    token ? token.substring(0, 20) + '...' : 'null',
  )
  return token
}

// DISABLED: Token expiration checks disabled for development
async function isTokenExpiringSoon(): Promise<boolean> {
  console.log('🚫 Token expiration soon check DISABLED')
  return false

  // const token = getAuthToken()
  // if (!token) return true

  // try {
  //   // Use the new JWT utility function
  //   const { isTokenExpiringSoon: checkExpiringSoon } = await import('./jwt-utils')
  //   return checkExpiringSoon(token, 5)
  // } catch (error) {
  //   console.warn('⚠️ Error checking token expiration:', error)
  //   // Don't treat parsing errors as expiration - just skip the check
  //   return false
  // }
}

// Refresh token function (currently unused)
// async function _refreshToken(): Promise<boolean> {
//   try {
//     console.log('🔄 Attempting to refresh token...')
//
//     // For now, we'll just return false to trigger re-login
//     // In the future, this could call a refresh endpoint
//     console.log('⚠️ Token refresh not implemented - user needs to re-login')
//     return false
//   } catch (error) {
//     console.error('❌ Token refresh failed:', error)
//     return false
//   }
// }

// Добавляем интерцептор для автоматического добавления токена
api.interceptors.request.use(
  async (config) => {
    // Skip token checks for login requests
    const isLoginRequest = config.url?.includes('/auth/login')
    if (isLoginRequest) {
      console.log('🔑 Login request - skipping token checks')
      return config
    }

    // DISABLED: Token expiration checks disabled for development
    console.log('🚫 Token expiration checks DISABLED - skipping all checks')

    // Get real token from storage
    const token = getAuthToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('🔑 Using real token from storage')
    } else {
      console.log('🔑 No token found - request will be unauthorized')
    }
    
    return config
  },
  (error) => {
    console.error('❌ Request interceptor error:', error)
    return Promise.reject(error)
  },
)

// Response interceptor disabled - refresh tokens not working
// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     // Refresh token logic disabled
//     return Promise.reject(error)
//   }
// )

// Auth API for invitation token validation
export const authApi = {
  async validateInvitationToken(token: string): Promise<{
    valid: boolean
    message?: string
    user?: {
      email: string
      first_name: string
      last_name: string
      user_type: string
    }
  }> {
    try {
      const response = await api.get(`/api/v1/auth/validate-invitation-token?token=${token}`)
      return response.data
    } catch (error: unknown) {
      console.error('Error validating invitation token:', error)
      return {
        valid: false,
        message:
          (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
          'Token validation failed',
      }
    }
  },
}

export default api

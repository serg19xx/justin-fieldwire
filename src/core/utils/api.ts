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

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      console.log('🔒 401 Unauthorized - token may be expired')

      // Don't redirect if we're already on login page or if it's a login/logout request
      const isLoginRequest = error.config?.url?.includes('/auth/login')
      const isLogoutRequest = error.config?.url?.includes('/auth/logout')
      const isCheckSessionRequest = error.config?.url?.includes('/auth/check-session')
      const isLoginPage = window.location.pathname === '/login'

      if (!isLoginRequest && !isLogoutRequest && !isCheckSessionRequest && !isLoginPage) {
        console.log('🔒 401 error - triggering session expiration')

        // Check if token is actually expired
        const token = localStorage.getItem('authToken')
        if (token && isTokenExpired(token)) {
          console.log('❌ Token is expired - calling logout')
          onSessionExpired?.()
        } else {
          console.log('⚠️ 401 but token not expired - may be server issue')
          console.log('🔍 Token details:', {
            token: token ? `${token.substring(0, 20)}...` : 'No token',
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers
          })
        }
      } else {
        console.log('🔒 401 on login/logout/check-session page or request - not redirecting')
      }
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

// Check if token is about to expire (within 5 minutes)
async function isTokenExpiringSoon(): Promise<boolean> {
  const token = getAuthToken()
  if (!token) return true

  try {
    // Use the new JWT utility function
    const { isTokenExpiringSoon: checkExpiringSoon } = await import('./jwt-utils')
    return checkExpiringSoon(token, 5)
  } catch (error) {
    console.warn('⚠️ Error checking token expiration:', error)
    // Don't treat parsing errors as expiration - just skip the check
    return false
  }
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

    // Check if token is expiring soon
    try {
      if (await isTokenExpiringSoon()) {
        console.log('⚠️ Token is expiring soon, but skipping refresh for now')
        // TODO: Implement proper token refresh when backend is fixed
        console.log('⚠️ Backend JWT issue - skipping token refresh')
      }
    } catch (error) {
      console.warn('⚠️ Error checking token expiration:', error)
      // Continue with request even if token check fails
    }

    const token = getAuthToken()
    console.log(
      '🔑 Request interceptor - Token check:',
      token ? `Bearer ${token.substring(0, 20)}...` : 'No token found',
    )
    console.log('🔑 Request interceptor - Request URL:', config.url)
    console.log('🔑 Request interceptor - Current headers:', config.headers)

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('✅ Authorization header added to request')
      console.log('🔑 Request interceptor - Final headers:', config.headers)
    } else {
      console.log('❌ No auth token, request will be unauthorized')
    }
    return config
  },
  (error) => {
    console.error('❌ Request interceptor error:', error)
    return Promise.reject(error)
  },
)

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

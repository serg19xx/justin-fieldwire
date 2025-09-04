import axios from 'axios'
import { apiConfig } from '@/config/api'

// Создаем основной экземпляр axios для всего приложения
export const api = axios.create(apiConfig)

// Добавляем интерцепторы для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('API Error:', error)

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      console.log('🔒 401 Unauthorized - token may be expired')

      // Don't redirect if we're already on login page or if it's a login request
      const isLoginRequest = error.config?.url?.includes('/auth/login')
      const isLoginPage = window.location.pathname === '/login'

      if (!isLoginRequest && !isLoginPage) {
        console.log('🔒 401 error - but keeping token for now (backend issue)')
        // TODO: Fix backend JWT validation instead of clearing tokens
        console.log('⚠️ Backend JWT validation issue - keeping token')
      } else {
        console.log('🔒 401 on login page or login request - not redirecting')
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
function isTokenExpiringSoon(): boolean {
  const token = getAuthToken()
  if (!token) return true

  try {
    // Validate token format first
    if (!token.includes('.') || token.split('.').length !== 3) {
      console.warn('⚠️ Invalid JWT token format')
      return true
    }

    // Decode JWT token to get expiration time
    const payload = JSON.parse(atob(token.split('.')[1]))
    const expirationTime = payload.exp * 1000 // Convert to milliseconds
    const currentTime = Date.now()
    const timeUntilExpiry = expirationTime - currentTime

    // Return true if token expires within 5 minutes
    console.log('⏰ Token expires in:', Math.round(timeUntilExpiry / 1000 / 60), 'minutes')
    return timeUntilExpiry < 5 * 60 * 1000
  } catch (error) {
    console.warn('⚠️ Error parsing token:', error)
    console.log('🔑 Token value:', token ? token.substring(0, 50) + '...' : 'null')
    // Don't treat parsing errors as expiration - just skip the check
    return false
  }
}

// Refresh token function
async function refreshToken(): Promise<boolean> {
  try {
    console.log('🔄 Attempting to refresh token...')

    // For now, we'll just return false to trigger re-login
    // In the future, this could call a refresh endpoint
    console.log('⚠️ Token refresh not implemented - user needs to re-login')
    return false
  } catch (error) {
    console.error('❌ Token refresh failed:', error)
    return false
  }
}

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
      if (isTokenExpiringSoon()) {
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

export default api

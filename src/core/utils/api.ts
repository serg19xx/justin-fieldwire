import axios from 'axios'
import { apiConfig } from '@/config/api'

// Создаем основной экземпляр axios для всего приложения
export const api = axios.create(apiConfig)

// Callback for handling session expiration
let onSessionExpired: (() => void) | null = null

/**
 * Set callback for session expiration
 */
export function setSessionExpiredCallback(callback: () => void): void {
  onSessionExpired = callback
  sessionExpiryHandled = false
}

const RENEWED_TOKEN_HEADER = 'x-renewed-token'

let sessionExpiryHandled = false

function storeRenewedToken(headers: unknown): void {
  const renewed = (headers as Record<string, unknown> | undefined)?.[RENEWED_TOKEN_HEADER]
  if (typeof renewed !== 'string' || renewed.split('.').length !== 3) return
  if (!localStorage.getItem('authToken')) return
  localStorage.setItem('authToken', renewed)
  api.defaults.headers.common['Authorization'] = `Bearer ${renewed}`
}

function handleSessionExpired(): void {
  if (sessionExpiryHandled) return
  sessionExpiryHandled = true

  if (onSessionExpired) {
    onSessionExpired()
  } else {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
  }

  const path = window.location.pathname
  if (!path.startsWith('/login')) {
    window.location.assign('/login')
  }
}

// Добавляем интерцепторы для обработки ошибок
api.interceptors.response.use(
  (response) => {
    storeRenewedToken(response.headers)
    return response
  },
  async (error) => {
    console.error('API Error:', error)

    // Token rejected (bad signature or expired): end the session instead of leaving a broken UI.
    if (error.response?.status === 401) {
      const url = String(error.config?.url ?? '')
      const sentToken = Boolean(error.config?.headers?.Authorization)
      if (sentToken && !url.includes('/api/v1/auth/')) {
        handleSessionExpired()
      }
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

// Добавляем интерцептор для автоматического добавления токена
api.interceptors.request.use(
  async (config) => {
    // Skip token checks for login requests
    const isLoginRequest = config.url?.includes('/auth/login')
    if (isLoginRequest) {
      console.log('🔑 Login request - skipping token checks')
      return config
    }

    // Get real token from storage
    const token = getAuthToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('🔑 Using real token from storage')
    } else {
      console.log('🔑 No token found - request will be unauthorized')
    }

    if (config.data instanceof FormData) {
      if (typeof config.headers.delete === 'function') {
        config.headers.delete('Content-Type')
      } else {
        delete config.headers['Content-Type']
      }
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

export function getApiErrorMessage(error: unknown, fallback = 'Request failed'): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message
    if (typeof message === 'string' && message.trim() !== '') {
      return message
    }
  }

  if (error instanceof Error && error.message.trim() !== '') {
    return error.message
  }

  return fallback
}

export default api

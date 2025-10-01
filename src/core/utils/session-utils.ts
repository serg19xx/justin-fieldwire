/**
 * Session management utilities
 */

import { api } from './api'
import { isTokenExpired, parseJWT } from './jwt-utils'

export interface SessionCheckResult {
  isValid: boolean
  error?: string
  user?: {
    id: number
    email: string
    name: string
  }
}

/**
 * Check session validity using API endpoint
 * @param token JWT token
 * @returns Session check result
 */
export async function checkSessionWithAPI(token: string): Promise<SessionCheckResult> {
  try {
    console.log('🔍 Checking session with API...')

    // First check if token is expired locally
    if (isTokenExpired(token)) {
      console.log('❌ Token is expired locally')
      return { isValid: false, error: 'Token expired' }
    }

    // Make API call to check session
    const response = await api.post(
      '/api/v1/auth/check-session',
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    console.log('✅ Session check API response:', response.data)

    if (response.status === 200) {
      return { isValid: true }
    } else {
      return { isValid: false, error: 'Session invalid' }
    }
  } catch (error: unknown) {
    console.error('❌ Session check API error:', error)

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      console.log('🔒 Session check returned 401 - token invalid')
      return { isValid: false, error: 'Unauthorized' }
    }

    // Handle network errors
    if (!error.response) {
      console.log('🌐 Network error during session check')
      return { isValid: false, error: 'Network error' }
    }

    return { isValid: false, error: error.response?.data?.message || 'Session check failed' }
  }
}

/**
 * Check session validity locally (without API call)
 * @param token JWT token
 * @returns Session check result
 */
export function checkSessionLocally(token: string): SessionCheckResult {
  try {
    console.log('🔍 Checking session locally...')

    if (!token) {
      return { isValid: false, error: 'No token provided' }
    }

    // Parse token to get user info
    const payload = parseJWT(token)
    if (!payload) {
      return { isValid: false, error: 'Invalid token format' }
    }

    // Check if token is expired
    if (isTokenExpired(token)) {
      return { isValid: false, error: 'Token expired' }
    }

    return {
      isValid: true,
      user: {
        id: payload.user_id,
        email: payload.email,
        name: payload.name || payload.email,
      },
    }
  } catch (error) {
    console.error('❌ Local session check error:', error)
    return { isValid: false, error: 'Session check failed' }
  }
}

/**
 * Get token from localStorage
 * @returns Token string or null
 */
export function getStoredToken(): string | null {
  return localStorage.getItem('authToken')
}

/**
 * Check if user is currently authenticated
 * @returns true if authenticated, false otherwise
 */
export function isUserAuthenticated(): boolean {
  const token = getStoredToken()
  if (!token) {
    return false
  }

  const result = checkSessionLocally(token)
  return result.isValid
}

/**
 * Get current user info from token
 * @returns User info or null
 */
export function getCurrentUserFromToken(): { id: number; email: string; name: string } | null {
  const token = getStoredToken()
  if (!token) {
    return null
  }

  const result = checkSessionLocally(token)
  return result.user || null
}

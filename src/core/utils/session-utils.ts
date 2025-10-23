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
  needsRefresh?: boolean
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

    // Check response structure
    if (
      response.data &&
      response.data.status === 'success' &&
      response.data.data?.session_valid === true
    ) {
      console.log('✅ Session is valid according to API')
      return {
        isValid: true,
        user: response.data.data.user
          ? {
              id: response.data.data.user.id,
              email: response.data.data.user.email,
              name: `${response.data.data.user.first_name} ${response.data.data.user.last_name}`,
            }
          : undefined,
      }
    } else if (response.data && response.data.status === 'error') {
      console.log('❌ Session is invalid according to API:', response.data.message)
      return { isValid: false, error: response.data.message || 'Session invalid' }
    } else {
      console.log('❌ Unexpected API response structure')
      return { isValid: false, error: 'Unexpected response format' }
    }
  } catch (error: unknown) {
    console.error('❌ Session check API error:', error)

    // Handle different HTTP status codes
    const apiError = error as { response?: { status?: number; data?: { message?: string } } }

    console.log('🔍 Error details:', {
      hasResponse: !!apiError.response,
      status: apiError.response?.status,
      message: apiError.response?.data?.message,
    })

    if (apiError.response?.status === 401) {
      console.log('🔒 Session check returned 401 - refresh tokens disabled')
      return { isValid: false, error: 'Unauthorized' }
    }

    if (apiError.response?.status === 500) {
      console.log('⚠️ Session check returned 500 - server error, falling back to local check')
      // Fall back to local token validation for 500 errors
      const localResult = checkSessionLocally(token)
      console.log('🏠 Local check result:', localResult)
      return localResult
    }

    // Handle network errors
    if (!apiError.response) {
      console.log('🌐 Network error during session check, falling back to local check')
      const localResult = checkSessionLocally(token)
      console.log('🏠 Local check result:', localResult)
      return localResult
    }

    console.log('❌ Session check failed with status:', apiError.response.status)
    return { isValid: false, error: apiError.response?.data?.message || 'Session check failed' }
  }
}

/**
 * Refresh access token using refresh token
 * @returns New access token or null if refresh failed
 */
export async function refreshAccessToken(): Promise<string | null> {
  // Refresh tokens disabled - always return null
  console.log('⚠️ Refresh tokens disabled - returning null')
  return null
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
        name: (payload.name as string) || payload.email,
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

/**
 * Check if token needs refresh (expires within specified minutes)
 * @param minutes Minutes before expiry to trigger refresh (default: 5)
 * @returns true if token needs refresh
 */
export function shouldRefreshToken(minutes: number = 5): boolean {
  // DISABLED: Token expiration checks disabled for development
  console.log('🚫 Token refresh check DISABLED in session-utils')
  return false

  // const token = getStoredToken()
  // if (!token) {
  //   console.log('🔍 No token found for refresh check')
  //   return false
  // }

  // const payload = parseJWT(token)
  // if (!payload) {
  //   console.log('🔍 Invalid token payload for refresh check')
  //   return false
  // }

  // const currentTime = Math.floor(Date.now() / 1000)
  // const timeUntilExpiry = payload.exp - currentTime
  // const minutesUntilExpiry = timeUntilExpiry / 60

  // console.log('🔍 Token expiry check:', {
  //   currentTime: new Date(currentTime * 1000).toISOString(),
  //   expiryTime: new Date(payload.exp * 1000).toISOString(),
  //   minutesUntilExpiry: Math.floor(minutesUntilExpiry),
  //   threshold: minutes,
  //   shouldRefresh: minutesUntilExpiry <= minutes,
  // })

  // return minutesUntilExpiry <= minutes
}

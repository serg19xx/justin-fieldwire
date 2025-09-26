/**
 * JWT Token utilities for session management
 */

export interface JWTPayload {
  user_id: number
  email: string
  exp: number
  iat?: number
  [key: string]: any
}

/**
 * Parse JWT token and return payload
 * @param token JWT token string or base64-encoded JSON
 * @returns Parsed payload or null if invalid
 */
export function parseJWT(token: string): JWTPayload | null {
  try {
    if (!token || typeof token !== 'string') {
      console.warn('⚠️ Invalid token format')
      return null
    }

    // Check if token has correct JWT format (header.payload.signature)
    const parts = token.split('.')

    if (parts.length === 3) {
      // Standard JWT format - decode payload (second part)
      console.log('🔍 Parsing JWT token (standard format)')
      const payload = parts[1]
      const decodedPayload = atob(payload)
      const parsedPayload = JSON.parse(decodedPayload) as JWTPayload

      // Validate required fields
      if (!parsedPayload.exp || !parsedPayload.user_id || !parsedPayload.email) {
        console.warn('⚠️ JWT payload missing required fields')
        return null
      }

      return parsedPayload
    } else if (parts.length === 1) {
      // Base64-encoded JSON format (your backend format)
      console.log('🔍 Parsing token (base64-encoded JSON format)')
      const decodedPayload = atob(token)
      const parsedPayload = JSON.parse(decodedPayload) as JWTPayload

      // Validate required fields
      if (!parsedPayload.exp || !parsedPayload.user_id || !parsedPayload.email) {
        console.warn('⚠️ Token payload missing required fields')
        return null
      }

      return parsedPayload
    } else {
      console.warn('⚠️ Invalid token format - should be JWT (3 parts) or base64 JSON (1 part)')
      return null
    }
  } catch (error) {
    console.warn('⚠️ Error parsing token:', error)
    return null
  }
}

/**
 * Check if JWT token is expired
 * @param token JWT token string
 * @returns true if token is expired, false otherwise
 */
export function isTokenExpired(token: string): boolean {
  const payload = parseJWT(token)
  if (!payload) {
    return true
  }

  const currentTime = Math.floor(Date.now() / 1000) // Current time in Unix timestamp
  const isExpired = payload.exp < currentTime

  if (isExpired) {
    console.log('❌ Token is expired')
    console.log('⏰ Token expires at:', new Date(payload.exp * 1000).toISOString())
    console.log('⏰ Current time:', new Date(currentTime * 1000).toISOString())
  } else {
    const timeUntilExpiry = payload.exp - currentTime
    console.log('✅ Token is valid')
    console.log('⏰ Token expires in:', Math.floor(timeUntilExpiry / 60), 'minutes')
  }

  return isExpired
}

/**
 * Check if token will expire within specified minutes
 * @param token JWT token string
 * @param minutes Number of minutes to check ahead (default: 5)
 * @returns true if token expires within specified time
 */
export function isTokenExpiringSoon(token: string, minutes: number = 5): boolean {
  const payload = parseJWT(token)
  if (!payload) {
    return true
  }

  const currentTime = Math.floor(Date.now() / 1000)
  const timeUntilExpiry = payload.exp - currentTime
  const minutesUntilExpiry = timeUntilExpiry / 60

  const isExpiringSoon = minutesUntilExpiry <= minutes

  if (isExpiringSoon) {
    console.log(`⚠️ Token expires soon (within ${minutes} minutes)`)
    console.log('⏰ Minutes until expiry:', Math.floor(minutesUntilExpiry))
  }

  return isExpiringSoon
}

/**
 * Get token expiration time as Date object
 * @param token JWT token string
 * @returns Date object or null if invalid
 */
export function getTokenExpirationDate(token: string): Date | null {
  const payload = parseJWT(token)
  if (!payload) {
    return null
  }

  return new Date(payload.exp * 1000)
}

/**
 * Get time until token expires in minutes
 * @param token JWT token string
 * @returns Minutes until expiry or null if invalid/expired
 */
export function getMinutesUntilExpiry(token: string): number | null {
  const payload = parseJWT(token)
  if (!payload) {
    return null
  }

  const currentTime = Math.floor(Date.now() / 1000)
  const timeUntilExpiry = payload.exp - currentTime

  if (timeUntilExpiry <= 0) {
    return null // Token is expired
  }

  return Math.floor(timeUntilExpiry / 60)
}

/**
 * Get user ID from token
 * @param token JWT token string
 * @returns User ID or null if invalid
 */
export function getUserIdFromToken(token: string): number | null {
  const payload = parseJWT(token)
  return payload?.user_id || null
}

/**
 * Get user email from token
 * @param token JWT token string
 * @returns User email or null if invalid
 */
export function getUserEmailFromToken(token: string): string | null {
  const payload = parseJWT(token)
  return payload?.email || null
}

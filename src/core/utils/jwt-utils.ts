/**
 * JWT Token utilities for session management
 */

/**
 * Only `exp` is guaranteed: user tokens may carry `email: null`, and contractor
 * access tokens have no `user_id` at all.
 */
export interface JWTPayload {
  exp: number
  user_id?: number
  email?: string | null
  iat?: number
  [key: string]: unknown
}

/** JWT segments are base64url without padding; payload text is UTF-8 (names). */
function decodeBase64Url(segment: string): string {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/**
 * Parse JWT token and return payload
 * @param token JWT token string or base64-encoded JSON
 * @returns Parsed payload or null if invalid
 */
export function parseJWT(token: string): JWTPayload | null {
  if (!token || typeof token !== 'string') return null

  const parts = token.split('.')
  // Standard JWT (header.payload.signature) or legacy single-segment base64 JSON
  const payloadSegment = parts.length === 3 ? parts[1] : parts.length === 1 ? parts[0] : null
  if (payloadSegment == null) return null

  try {
    const payload = JSON.parse(decodeBase64Url(payloadSegment)) as JWTPayload
    if (typeof payload?.exp !== 'number' || !Number.isFinite(payload.exp)) return null
    return payload
  } catch {
    return null
  }
}

/**
 * Check if JWT token is expired. A token that cannot be read counts as expired.
 * @param token JWT token string
 * @returns true if token is expired, false otherwise
 */
export function isTokenExpired(token: string): boolean {
  const payload = parseJWT(token)
  if (!payload) return true
  return payload.exp <= Math.floor(Date.now() / 1000)
}

/**
 * Check if token will expire within specified minutes
 * @param token JWT token string
 * @param minutes Number of minutes to check ahead (default: 5)
 * @returns true if token expires within specified time
 */
export function isTokenExpiringSoon(token: string, minutes: number = 5): boolean {
  const payload = parseJWT(token)
  if (!payload) return true
  return payload.exp - Math.floor(Date.now() / 1000) <= minutes * 60
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

/**
 * Session Manager - handles automatic session checking and logout
 */

import {
  checkSessionWithAPI,
  checkSessionLocally,
  getStoredToken,
} from './session-utils'

export interface SessionManagerConfig {
  checkInterval: number // Interval in milliseconds (default: 5 minutes)
  activityCheckInterval: number // Activity check interval in milliseconds (default: 1 minute)
  useAPI: boolean // Whether to use API for session checks (default: true)
  onSessionExpired: () => void // Callback when session expires
  onSessionValid?: () => void // Callback when session is valid
}

/** Sign out after this long without user interaction (field crews leave the app open between tasks). */
const MAX_INACTIVITY_MS = 12 * 60 * 60 * 1000

export class SessionManager {
  private config: SessionManagerConfig
  private checkIntervalId: number | null = null
  private lastActivityTime: number = Date.now()
  private isActive: boolean = false
  private activityListeners: (() => void)[] = []
  private lastActivityUpdate: number = 0
  private activityThrottleMs: number = 1000 // Update activity max once per second

  constructor(config: SessionManagerConfig) {
    this.config = {
      checkInterval: config.checkInterval ?? 5 * 60 * 1000, // 5 minutes (check frequently)
      activityCheckInterval: config.activityCheckInterval ?? 60 * 1000, // 1 minute
      useAPI: config.useAPI ?? true,
      onSessionExpired: config.onSessionExpired,
      onSessionValid: config.onSessionValid,
    }

    this.setupActivityListeners()
  }

  /**
   * Start session monitoring
   */
  start(): void {
    if (this.isActive) {
      console.log('⚠️ Session manager is already active')
      return
    }

    console.log('🚀 Starting session manager...')
    console.log('⏰ Check interval:', this.config.checkInterval / 1000 / 60, 'minutes')
    console.log('🌐 Use API for checks:', this.config.useAPI)

    this.isActive = true
    this.lastActivityTime = Date.now()

    console.log('🕐 Session manager started at:', new Date(this.lastActivityTime).toISOString())
    console.log('🕐 Last activity time set to:', new Date(this.lastActivityTime).toISOString())

    // Start periodic session checks
    this.startPeriodicChecks()

    // Setup activity listeners (no polling needed)
    this.setupActivityListeners()
  }

  /**
   * Stop session monitoring
   */
  stop(): void {
    if (!this.isActive) {
      return
    }

    console.log('🛑 Stopping session manager...')

    this.isActive = false

    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId)
      this.checkIntervalId = null
    }

    this.removeActivityListeners()
  }

  /**
   * Manually trigger session check
   */
  async checkSession(): Promise<boolean> {
    const token = getStoredToken()
    if (!token) {
      console.log('❌ No token found for session check')
      this.config.onSessionExpired()
      return false
    }

    console.log('🔍 Starting session check...')
    console.log('🔑 Token exists:', !!token)
    console.log('🌐 Using API for check:', this.config.useAPI)

    try {
      let result
      if (this.config.useAPI) {
        console.log('📡 Making API call to check session...')
        result = await checkSessionWithAPI(token)
      } else {
        console.log('🏠 Checking session locally...')
        result = checkSessionLocally(token)
      }

      console.log('📊 Session check result:', result)

      if (result.isValid) {
        console.log('✅ Session is valid')
        this.config.onSessionValid?.()
        return true
      }

      console.log('❌ Session is invalid:', result.error)
      // Network or server trouble must not sign people out in the field; only a dead token does.
      if (result.expired) {
        this.config.onSessionExpired()
      }
      return false
    } catch (error) {
      console.error('❌ Session check error:', error)
      return false
    }
  }

  /**
   * Update last activity time (throttled). The API renews the access token itself
   * (X-Renewed-Token response header), so there is nothing to refresh here.
   */
  updateActivity(): void {
    const now = Date.now()

    // Throttle activity updates to prevent spam
    if (now - this.lastActivityUpdate < this.activityThrottleMs) {
      return
    }

    this.lastActivityTime = now
    this.lastActivityUpdate = now
  }

  /**
   * Check if user has been active recently
   */
  private isUserActive(): boolean {
    const timeSinceLastActivity = Date.now() - this.lastActivityTime
    return timeSinceLastActivity < MAX_INACTIVITY_MS
  }

  /**
   * Start unified session monitoring
   */
  private startPeriodicChecks(): void {
    this.checkIntervalId = setInterval(async () => {
      if (!this.isActive) {
        return
      }

      const timeSinceLastActivity = Date.now() - this.lastActivityTime
      const minutesSinceActivity = Math.floor(timeSinceLastActivity / 1000 / 60)

      console.log(`⏰ Session check - ${minutesSinceActivity} minutes since last activity`)
      console.log('🕐 Current time:', new Date().toISOString())
      console.log('🕐 Last activity time:', new Date(this.lastActivityTime).toISOString())
      console.log('🕐 Time since last activity (ms):', timeSinceLastActivity)

      // Check if user has been inactive for too long
      if (!this.isUserActive()) {
        console.log(`😴 User inactive for ${MAX_INACTIVITY_MS / 3600000}+ hours - forcing logout`)
        console.log('🔍 isUserActive() returned false')
        this.config.onSessionExpired()
        return
      }

      // User is active - check session validity
      console.log('🔄 User is active - checking session validity...')
      console.log('🔍 isUserActive() returned true')
      await this.checkSession()
    }, this.config.checkInterval)
  }

  /**
   * Start activity monitoring (simplified - only tracks activity)
   */
  private startActivityMonitoring(): void {
    // Remove this completely - we don't need it!
    // Activity is tracked by event listeners, not by polling
  }

  /**
   * Setup activity event listeners
   */
  private setupActivityListeners(): void {
    // Reduced events to prevent spam - only track meaningful user interactions
    const events = ['mousedown', 'keypress', 'scroll', 'touchstart', 'click']

    const activityHandler = () => {
      this.updateActivity()
    }

    events.forEach((event) => {
      document.addEventListener(event, activityHandler, true)
      this.activityListeners.push(() => {
        document.removeEventListener(event, activityHandler, true)
      })
    })

    console.log('🎯 Activity listeners set up for events:', events)
  }

  /**
   * Remove activity event listeners
   */
  private removeActivityListeners(): void {
    this.activityListeners.forEach((removeListener) => {
      removeListener()
    })
    this.activityListeners = []
  }

  /**
   * Get session status info
   */
  getStatus(): {
    isActive: boolean
    lastActivityTime: number
    timeSinceLastActivity: number
    isUserActive: boolean
  } {
    return {
      isActive: this.isActive,
      lastActivityTime: this.lastActivityTime,
      timeSinceLastActivity: Date.now() - this.lastActivityTime,
      isUserActive: this.isUserActive(),
    }
  }
}

// Global session manager instance
let globalSessionManager: SessionManager | null = null

/**
 * Initialize global session manager
 */
export function initializeSessionManager(config: SessionManagerConfig): SessionManager {
  if (globalSessionManager) {
    globalSessionManager.stop()
  }

  globalSessionManager = new SessionManager(config)
  return globalSessionManager
}

/**
 * Get global session manager instance
 */
export function getSessionManager(): SessionManager | null {
  return globalSessionManager
}

/**
 * Start global session manager
 */
export function startSessionManager(): void {
  if (globalSessionManager) {
    globalSessionManager.start()
  }
}

/**
 * Stop global session manager
 */
export function stopSessionManager(): void {
  if (globalSessionManager) {
    globalSessionManager.stop()
  }
}

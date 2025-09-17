# 🔐 Session Management System

## Overview

The session management system provides automatic session checking and logout functionality for the FieldWire application. It monitors JWT token expiration and user activity to ensure secure session handling.

## Features

### ✅ Implemented Features

1. **JWT Token Validation**
   - Parse and validate JWT tokens
   - Check token expiration locally
   - Extract user information from tokens

2. **Automatic Session Checking**
   - Periodic checks every 5 minutes
   - Activity-based checks every 1 minute
   - API-based session validation using `/api/v1/auth/check-session`

3. **HTTP Request Interception**
   - Automatic 401 error handling
   - Session expiration detection on API calls
   - Smart filtering of login/logout requests

4. **User Activity Monitoring**
   - Track mouse movements, clicks, keyboard input
   - Debounced activity detection (1 minute intervals)
   - Skip session checks for inactive users

5. **Automatic Logout**
   - Call `/api/v1/auth/logout` endpoint
   - Clear localStorage data
   - Redirect to login page
   - Stop session monitoring

## File Structure

```
src/utils/
├── jwt-utils.ts          # JWT token parsing and validation
├── session-utils.ts      # Session checking utilities
├── session-manager.ts    # Main session management class
└── api.ts               # Updated with session handling
```

## Usage

### Automatic Initialization

The session management system is automatically initialized when:

1. User logs in successfully
2. User completes 2FA verification
3. App starts with existing valid token

### Manual Control

```typescript
import { 
  initializeSessionManager, 
  startSessionManager, 
  stopSessionManager,
  getSessionManager 
} from '@/utils/session-manager'

// Initialize with custom config
const sessionManager = initializeSessionManager({
  checkInterval: 5 * 60 * 1000,        // 5 minutes
  activityCheckInterval: 60 * 1000,    // 1 minute
  useAPI: true,                        // Use API for validation
  onSessionExpired: () => {
    // Handle session expiration
    console.log('Session expired!')
  },
  onSessionValid: () => {
    // Handle valid session
    console.log('Session is valid')
  }
})

// Start monitoring
startSessionManager()

// Stop monitoring
stopSessionManager()

// Get status
const status = getSessionManager()?.getStatus()
```

## Configuration Options

### SessionManagerConfig

```typescript
interface SessionManagerConfig {
  checkInterval: number        // Interval in milliseconds (default: 5 minutes)
  activityCheckInterval: number // Activity check interval (default: 1 minute)
  useAPI: boolean             // Whether to use API for session checks (default: true)
  onSessionExpired: () => void // Callback when session expires
  onSessionValid?: () => void  // Callback when session is valid
}
```

## API Endpoints

### POST /api/v1/auth/check-session

**Headers:**
```
Authorization: Bearer <token>
```

**Response (Valid):**
```json
{
  "status": "success",
  "message": "Session is valid"
}
```

**Response (Invalid):**
```json
{
  "status": "error",
  "message": "Session expired"
}
```

### POST /api/v1/auth/logout

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

## JWT Token Structure

The system expects JWT tokens with the following payload structure:

```json
{
  "user_id": 47,
  "email": "user@example.com",
  "exp": 1757610619,
  "iat": 1757607019
}
```

## Activity Monitoring

The system monitors the following user activities:

- `mousedown` - Mouse button press
- `mousemove` - Mouse movement
- `keypress` - Keyboard input
- `scroll` - Page scrolling
- `touchstart` - Touch input (mobile)
- `click` - Click events

## Error Handling

### Network Errors
- Graceful handling of network failures
- Fallback to local token validation
- Continue monitoring on network recovery

### Invalid Tokens
- Automatic logout on malformed tokens
- Clear error logging
- User-friendly error messages

### API Errors
- Handle 401 Unauthorized responses
- Distinguish between expired tokens and server errors
- Smart retry logic for temporary failures

## Security Considerations

1. **Token Storage**: Tokens are stored in localStorage
2. **Automatic Cleanup**: All session data is cleared on logout
3. **Activity Tracking**: Only tracks activity, no sensitive data collection
4. **API Validation**: Server-side session validation for security
5. **Error Logging**: Comprehensive logging for debugging

## Debugging

### Console Logs

The system provides detailed console logging:

- `🚀 Starting session manager...` - System startup
- `⏰ Periodic session check...` - Regular checks
- `🔄 Activity-based session check...` - Activity-triggered checks
- `✅ Session is valid` - Valid session
- `❌ Session is invalid` - Invalid session
- `🔒 Session expired - logging out` - Automatic logout

### Status Information

```typescript
const status = getSessionManager()?.getStatus()
console.log(status)
// {
//   isActive: true,
//   lastActivityTime: 1757607019000,
//   timeSinceLastActivity: 30000,
//   isUserActive: true
// }
```

## Integration with Auth Store

The session management system is fully integrated with the Pinia auth store:

- Automatic initialization on login
- Session monitoring during authentication
- Cleanup on logout
- Error handling integration

## Performance Considerations

1. **Debounced Activity**: Activity checks are debounced to prevent excessive API calls
2. **Smart Intervals**: Different intervals for different types of checks
3. **Inactive User Handling**: Skip checks for inactive users
4. **Memory Management**: Proper cleanup of event listeners and intervals

## Future Enhancements

1. **Token Refresh**: Implement automatic token refresh
2. **Offline Support**: Handle offline scenarios
3. **Custom Activity Events**: Allow custom activity event configuration
4. **Session Analytics**: Track session duration and patterns
5. **Multi-tab Support**: Synchronize sessions across browser tabs

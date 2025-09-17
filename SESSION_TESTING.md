# 🧪 Session Management Testing Guide

## Testing the Session Management System

This guide provides instructions for testing the newly implemented session management system.

## Prerequisites

1. Ensure the backend API is running with the `/api/v1/auth/check-session` endpoint
2. Have valid user credentials for testing
3. Browser developer tools open for console monitoring

## Test Scenarios

### 1. Basic Session Monitoring

**Objective**: Verify that session monitoring starts automatically after login

**Steps**:
1. Open browser developer tools (F12)
2. Navigate to the login page
3. Log in with valid credentials
4. Check console for session manager startup logs:
   ```
   🚀 Starting session manager...
   ⏰ Check interval: 5 minutes
   🔄 Activity check interval: 60 seconds
   🌐 Use API for checks: true
   ```

**Expected Result**: Session manager starts automatically and begins monitoring

### 2. Periodic Session Checks

**Objective**: Verify that session checks occur every 5 minutes

**Steps**:
1. Log in successfully
2. Wait for periodic check (or manually trigger by waiting)
3. Monitor console for periodic check logs:
   ```
   ⏰ Periodic session check...
   🔍 Checking session with API...
   ✅ Session is valid
   ```

**Expected Result**: Regular session validation occurs every 5 minutes

### 3. Activity-Based Session Checks

**Objective**: Verify that user activity triggers session checks

**Steps**:
1. Log in successfully
2. Wait for 1 minute of inactivity
3. Move mouse or click somewhere on the page
4. Monitor console for activity-based check logs:
   ```
   🔄 Activity-based session check...
   🔍 Checking session with API...
   ✅ Session is valid
   ```

**Expected Result**: Activity triggers additional session validation

### 4. JWT Token Expiration Detection

**Objective**: Verify that expired tokens are detected locally

**Steps**:
1. Log in successfully
2. Manually modify the JWT token in localStorage to have an expired `exp` field
3. Trigger any API request or wait for periodic check
4. Monitor console for expiration detection:
   ```
   ❌ Token is expired
   🔒 Session expired - logging out
   ```

**Expected Result**: Expired tokens are detected and user is logged out

### 5. API 401 Error Handling

**Objective**: Verify that 401 errors trigger automatic logout

**Steps**:
1. Log in successfully
2. Make an API request that returns 401 (or simulate server-side token invalidation)
3. Monitor console for 401 handling:
   ```
   🔒 401 Unauthorized - token may be expired
   🔒 401 error - triggering session expiration
   ❌ Token is expired - calling logout
   ```

**Expected Result**: 401 errors trigger automatic logout

### 6. Session Status Component

**Objective**: Verify that the session status component displays correctly

**Steps**:
1. Add the SessionStatus component to any page:
   ```vue
   <SessionStatus :show-details="true" />
   ```
2. Log in successfully
3. Observe the status indicator:
   - Green dot: Session active
   - Yellow dot: Session idle
   - Red dot: Session inactive
   - Gray dot: Not authenticated

**Expected Result**: Visual indicator shows current session status

### 7. Manual Session Check

**Objective**: Verify manual session checking functionality

**Steps**:
1. Log in successfully
2. Open browser console
3. Execute manual session check:
   ```javascript
   // Get session manager instance
   const sessionManager = window.getSessionManager?.()
   
   // Trigger manual check
   sessionManager?.checkSession()
   ```
4. Monitor console for manual check results

**Expected Result**: Manual session check works correctly

### 8. Logout Functionality

**Objective**: Verify that logout properly cleans up session management

**Steps**:
1. Log in successfully
2. Verify session manager is running
3. Click logout button
4. Monitor console for logout process:
   ```
   🛑 Stopping session manager...
   🔓 Logout - backend call successful
   ✅ Logout completed - local state cleared
   ```

**Expected Result**: Session manager stops and all data is cleared

### 9. 2FA Integration

**Objective**: Verify that session management works with 2FA

**Steps**:
1. Log in with a user that has 2FA enabled
2. Complete 2FA verification
3. Verify session manager starts after 2FA completion
4. Monitor console for 2FA session initialization

**Expected Result**: Session management starts after successful 2FA

### 10. Network Error Handling

**Objective**: Verify graceful handling of network errors

**Steps**:
1. Log in successfully
2. Disconnect network or block API requests
3. Wait for session check attempt
4. Monitor console for network error handling:
   ```
   🌐 Network error during session check
   ```

**Expected Result**: Network errors are handled gracefully without logout

## Debugging Tools

### Console Commands

```javascript
// Check session manager status
const sessionManager = window.getSessionManager?.()
console.log(sessionManager?.getStatus())

// Manually trigger session check
sessionManager?.checkSession()

// Check current token
console.log(localStorage.getItem('authToken'))

// Parse JWT token
const token = localStorage.getItem('authToken')
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]))
  console.log('Token payload:', payload)
  console.log('Expires at:', new Date(payload.exp * 1000))
}
```

### Browser Storage Inspection

1. Open Developer Tools (F12)
2. Go to Application tab
3. Check Local Storage for:
   - `authToken`: JWT token
   - `user`: User data

### Network Tab Monitoring

1. Open Developer Tools (F12)
2. Go to Network tab
3. Monitor requests to:
   - `/api/v1/auth/check-session`
   - `/api/v1/auth/logout`
   - Other API endpoints for 401 responses

## Common Issues and Solutions

### Issue: Session manager not starting

**Symptoms**: No session manager logs in console
**Solution**: Check if user is properly authenticated and token exists

### Issue: Frequent session checks

**Symptoms**: Too many API calls to check-session
**Solution**: Verify activity detection is working correctly

### Issue: Session not expiring

**Symptoms**: User remains logged in with expired token
**Solution**: Check JWT parsing and API endpoint responses

### Issue: False logout triggers

**Symptoms**: User logged out unexpectedly
**Solution**: Check 401 error handling and token validation logic

## Performance Monitoring

### Metrics to Monitor

1. **API Call Frequency**: Should not exceed once per minute
2. **Memory Usage**: Session manager should not cause memory leaks
3. **CPU Usage**: Activity monitoring should be lightweight
4. **Network Traffic**: Minimal overhead from session checks

### Performance Tests

1. **Long Session Test**: Leave user logged in for extended period
2. **High Activity Test**: Rapid user interactions
3. **Inactive User Test**: Leave user idle for extended period
4. **Multiple Tab Test**: Open multiple tabs with same session

## Security Testing

### Security Scenarios

1. **Token Manipulation**: Try to modify JWT token
2. **Session Hijacking**: Attempt to use another user's token
3. **Replay Attacks**: Try to reuse old tokens
4. **XSS Protection**: Verify token is not exposed in DOM

### Security Verification

1. **Token Storage**: Verify tokens are stored securely
2. **Automatic Cleanup**: Verify all data is cleared on logout
3. **Error Handling**: Verify no sensitive data in error messages
4. **API Security**: Verify proper authorization headers

## Reporting Issues

When reporting issues, include:

1. **Browser and Version**: Chrome 120, Firefox 119, etc.
2. **Console Logs**: Full console output during issue
3. **Network Requests**: Relevant API calls and responses
4. **Steps to Reproduce**: Detailed reproduction steps
5. **Expected vs Actual**: What should happen vs what happened
6. **Token Information**: JWT payload (without sensitive data)

## Success Criteria

The session management system is working correctly when:

✅ Session monitoring starts automatically after login
✅ Periodic checks occur every 5 minutes
✅ Activity-based checks work properly
✅ Expired tokens are detected and handled
✅ 401 errors trigger automatic logout
✅ Logout properly cleans up all data
✅ Network errors are handled gracefully
✅ 2FA integration works correctly
✅ Performance impact is minimal
✅ Security requirements are met

# 2FA Testing Guide

## Overview
This guide describes how to test the Two-Factor Authentication (2FA) feature during login.

## Prerequisites
- Backend API running and accessible
- Frontend development server running (`npm run dev`)
- Test users configured in the database with different 2FA settings

## Test Scenarios

### Scenario 1: Login without 2FA (2FA Disabled)

**Test Steps:**
1. Navigate to the login page
2. Enter email and password for a user with `two_factor_enabled = false`
3. Click "Sign In"

**Expected Results:**
- User is logged in immediately
- Redirected to the appropriate dashboard based on role
- No 2FA dialog appears
- Auth token is saved in localStorage
- Session manager is initialized

**Console Logs to Verify:**
```
✅ Login successful for user: user@example.com
🔐 Token saved to localStorage
✅ Session is valid
```

---

### Scenario 2: Login with 2FA - SMS Method

**Test Steps:**
1. Navigate to the login page
2. Enter email and password for a user with `two_factor_enabled = true` and a valid phone number
3. Click "Sign In"
4. 2FA dialog should appear
5. Select "SMS" as the delivery method
6. Click "Send Code"
7. Wait for SMS with verification code (check backend logs if testing locally)
8. Enter the 6-digit code
9. Click "Verify Code"

**Expected Results:**
- After step 3: Login succeeds but no token is saved, 2FA dialog appears
- After step 6: Success message displays "Verification code sent to your phone"
- After step 6: Resend timer starts (60 seconds countdown)
- After step 9: User is authenticated and redirected to dashboard
- After step 9: Auth token is saved and session manager is initialized

**Console Logs to Verify:**
```
🔒 2FA required for user: user@example.com
⚠️ Token NOT saved - waiting for 2FA verification
📤 Sending 2FA code via: sms
✅ Code sent successfully
🔐 Verifying 2FA code
✅ 2FA verification successful - user authenticated
```

---

### Scenario 3: Login with 2FA - Email Method

**Test Steps:**
1. Navigate to the login page
2. Enter email and password for a user with `two_factor_enabled = true`
3. Click "Sign In"
4. 2FA dialog should appear
5. Select "Email" as the delivery method
6. Click "Send Code"
7. Check email for verification code
8. Enter the 6-digit code
9. Click "Verify Code"

**Expected Results:**
- Similar to Scenario 2 but code is sent via email
- Success message displays "Verification code sent to your email"

---

### Scenario 4: Resend Code Feature

**Test Steps:**
1. Follow steps 1-6 from Scenario 2 or 3
2. Wait for code to be sent
3. Notice the resend timer (60 seconds)
4. Wait for timer to reach 0
5. Click "Resend code" link
6. Enter the newly received code
7. Click "Verify Code"

**Expected Results:**
- Resend link is disabled during countdown
- Timer shows remaining seconds: "Resend code in Xs"
- After timer expires, "Resend code" link becomes active
- New code is sent successfully
- New timer starts after resending

---

### Scenario 5: Invalid Code Entry

**Test Steps:**
1. Follow steps 1-6 from Scenario 2 or 3
2. Enter an incorrect 6-digit code (e.g., "000000")
3. Click "Verify Code"

**Expected Results:**
- Error message displays: "Invalid or expired verification code"
- User remains on the code entry screen
- Can try again with the correct code

**Console Logs to Verify:**
```
❌ 2FA verification failed: Invalid or expired verification code
```

---

### Scenario 6: Missing Phone Number (SMS Method)

**Test Steps:**
1. Login with a user who has `two_factor_enabled = true` but no phone number
2. Select "SMS" as delivery method
3. Click "Send Code"

**Expected Results:**
- Error message displays: "Phone number not found for this user"
- User cannot proceed with SMS method
- Can switch to email method instead

---

### Scenario 7: Cancel 2FA Dialog

**Test Steps:**
1. Login with a user who has 2FA enabled
2. 2FA dialog appears
3. Click "Cancel" button

**Expected Results:**
- Dialog closes
- User returns to login page
- User is NOT authenticated
- No token is saved

---

### Scenario 8: Back to Delivery Method Selection

**Test Steps:**
1. Login with a user who has 2FA enabled
2. Select a delivery method and send code
3. On the code entry screen, click "Back" button

**Expected Results:**
- Returns to delivery method selection screen
- Can select a different delivery method
- Code field is cleared
- Previous code (if any) remains valid for 10 minutes

---

### Scenario 9: Code Expiration

**Test Steps:**
1. Login with a user who has 2FA enabled
2. Send verification code
3. Wait for more than 10 minutes (or adjust expiration time in backend for testing)
4. Try to verify the code

**Expected Results:**
- Error message displays: "Invalid or expired verification code"
- User needs to request a new code

---

### Scenario 10: Session Management After 2FA

**Test Steps:**
1. Successfully complete 2FA login
2. Verify user is redirected to dashboard
3. Check browser localStorage for:
   - `authToken` - should contain JWT token
   - `user` - should contain user object with `two_factor_enabled: true`
4. Leave the app idle
5. Try to navigate or perform actions

**Expected Results:**
- Token and user data are properly saved
- Session manager is initialized
- Session checks occur every 5 minutes
- Activity tracking works properly
- On token expiration, user is logged out

---

## API Endpoints Used

### 1. Login
```
POST /api/v1/auth/login
Request: { email, password }
Response: { user, requires_2fa, token (null if 2FA required) }
```

### 2. Send Verification Code
```
POST /api/v1/2fa/send-code
Request: { email, delivery_method: 'sms' | 'email' }
Response: { user_id, delivery_method, contact_info (masked), expires_at }
```

### 3. Verify Code
```
POST /api/v1/2fa/verify-code
Request: { user_id, code }
Response: { user, token, expires_at }
```

---

## Test Data Setup

### User 1: No 2FA
```sql
UPDATE fw_users 
SET two_factor_enabled = false 
WHERE email = 'user1@example.com';
```

### User 2: 2FA with Phone
```sql
UPDATE fw_users 
SET two_factor_enabled = true, 
    phone = '+1234567890' 
WHERE email = 'user2@example.com';
```

### User 3: 2FA without Phone
```sql
UPDATE fw_users 
SET two_factor_enabled = true, 
    phone = NULL 
WHERE email = 'user3@example.com';
```

---

## Frontend Components

### Files Involved
- `src/pages/auth/views/LoginView.vue` - Main login view with dialog state
- `src/pages/auth/components/LoginForm.vue` - Login form component
- `src/components/TwoFactorDialog.vue` - 2FA dialog with delivery method and code entry
- `src/core/stores/auth.ts` - Auth store with login, sendTwoFactorCode, and verifyTwoFactor methods

### Key Features
- **Delivery Method Selection**: SMS or Email
- **Code Input**: 6-digit numeric input
- **Resend Timer**: 60-second countdown before allowing resend
- **Error Handling**: Clear error messages for all failure scenarios
- **Session Management**: Automatic initialization after successful 2FA

---

## Troubleshooting

### Code Not Received (SMS)
- Check backend logs for SMS sending
- Verify phone number format in database
- Check SMS service configuration (Twilio, etc.)

### Code Not Received (Email)
- Check spam folder
- Verify email configuration in backend
- Check backend logs for email sending errors

### Invalid Code Error
- Verify code hasn't expired (10 minutes)
- Ensure code hasn't been used already
- Check for typos in code entry

### Token Not Saved After 2FA
- Check browser console for errors
- Verify backend returns token in response
- Check localStorage after verification

---

## Developer Notes

### State Management
- During login with 2FA: `currentUser` is set but `isAuthenticated` remains false
- Token is NOT saved until after successful 2FA verification
- Session manager is initialized ONLY after token is saved

### Security Considerations
- Codes expire after 10 minutes
- Codes can only be used once
- Rate limiting prevents spam (1 SMS per minute per phone)
- Phone numbers are masked in responses (e.g., "+123456****")
- JWT tokens include expiration time

### UI/UX Features
- Mobile-responsive design
- Keyboard support (Enter key to submit)
- Loading states during API calls
- Clear error and success messages
- Timer for code resend to prevent abuse
- Auto-focus on code input field

---

## Success Criteria

✅ Users without 2FA can login normally
✅ Users with 2FA see the 2FA dialog
✅ SMS delivery works correctly
✅ Email delivery works correctly
✅ Code verification works correctly
✅ Invalid codes show appropriate errors
✅ Code expiration is enforced
✅ Resend functionality works with timer
✅ Session is properly initialized after 2FA
✅ Users are redirected to correct dashboard based on role
✅ All error scenarios are handled gracefully

---

## Additional Testing

### Browser Testing
- Chrome
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Android)

### Responsive Testing
- Mobile (320px - 768px)
- Tablet (768px - 1024px)
- Desktop (1024px+)

### Accessibility Testing
- Keyboard navigation
- Screen reader support
- Color contrast
- Focus indicators


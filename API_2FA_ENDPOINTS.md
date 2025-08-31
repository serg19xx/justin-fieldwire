# 2FA API Endpoints Documentation

## Overview
This document describes the 2FA (Two-Factor Authentication) API endpoints for the FieldWire application.

## Authentication Flow

### 1. Login with 2FA Check
**Endpoint:** `POST /auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (2FA NOT enabled):**
```json
{
  "error_code": 0,
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "name": "John Doe",
      "phone": "+1234567890",
      "user_type": "System Administrator",
      "job_title": "System Administrator",
      "status": "active",
      "two_factor_enabled": false,
      "last_login": "2025-08-31 08:44:18"
    },
    "requires_2fa": false,
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "expires_at": "2025-08-31 09:44:18"
  }
}
```

**Response (2FA IS enabled):**
```json
{
  "error_code": 0,
  "status": "success",
  "message": "Login successful, 2FA required",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "name": "John Doe",
      "phone": "+1234567890",
      "user_type": "System Administrator",
      "job_title": "System Administrator",
      "status": "active",
      "two_factor_enabled": true,
      "last_login": "2025-08-31 08:44:18"
    },
    "requires_2fa": true,
    "token": null,
    "expires_at": null
  }
}
```

### 2. Send Verification Code
**Endpoint:** `POST /api/v1/2fa/send-code`

**Request:**
```json
{
  "email": "user@example.com",
  "delivery_method": "sms"
}
```

**Delivery Methods:**
- `"sms"` - Send code via SMS to user's phone number
- `"email"` - Send code via email to user's email address

**Response (Success):**
```json
{
  "error_code": 0,
  "status": "success",
  "message": "Verification code sent successfully",
  "data": {
    "user_id": 1,
    "delivery_method": "sms",
    "contact_info": "+123456****",
    "expires_at": "2025-08-31 14:19:46"
  }
}
```

**Response (Error):**
```json
{
  "error_code": 400,
  "status": "error",
  "message": "Phone number not found for this user",
  "data": null
}
```

### 3. Verify Code
**Endpoint:** `POST /api/v1/2fa/verify-code`

**Request:**
```json
{
  "user_id": 1,
  "code": "123456"
}
```

**Response (Success):**
```json
{
  "error_code": 0,
  "status": "success",
  "message": "Verification successful",
  "data": {
    "user": {
      "id": 1,
      "email": "admin@medicalcontractor.ca",
      "first_name": "Justin",
      "last_name": "Admin",
      "name": "Justin Admin",
      "phone": "+1234567890",
      "user_type": "System Administrator",
      "job_title": "System Administrator",
      "status": "active",
      "two_factor_enabled": true,
      "last_login": "2025-08-31 08:06:20"
    },
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "expires_at": "2025-08-31T15:10:10+02:00"
  }
}
```

**Response (Error):**
```json
{
  "error_code": 401,
  "status": "error",
  "message": "Invalid or expired verification code",
  "data": null
}
```

### 4. Enable 2FA
**Endpoint:** `POST /api/v1/2fa/enable`

**Request:**
```json
{
  "user_id": 1,
  "phone": "+1234567890"
}
```

**Response (Success):**
```json
{
  "error_code": 0,
  "status": "success",
  "message": "2FA enabled successfully",
  "data": {
    "user_id": 1,
    "phone": "+123456****",
    "two_factor_enabled": true
  }
}
```

### 5. Disable 2FA
**Endpoint:** `POST /api/v1/2fa/disable`

**Request:**
```json
{
  "user_id": 1
}
```

**Response (Success):**
```json
{
  "error_code": 0,
  "status": "success",
  "message": "2FA disabled successfully",
  "data": {
    "user_id": 1,
    "two_factor_enabled": false
  }
}
```

## Frontend Implementation Flow

### Step 1: User Login
```typescript
const result = await authStore.login(email, password)

if (result.success && result.requires2FA) {
  // Show 2FA dialog with delivery method selection
  showTwoFactorDialog.value = true
} else if (result.success) {
  // User is logged in, redirect to dashboard
  router.push('/')
} else {
  // Show error
  showError(result.error)
}
```

### Step 2: Send Verification Code
```typescript
const result = await authStore.sendTwoFactorCode(email, 'sms')

if (result.success) {
  // Show code input form
  showCodeInput.value = true
} else {
  // Show error
  showError(result.error)
}
```

### Step 3: Verify Code
```typescript
const result = await authStore.verifyTwoFactor(code)

if (result.success) {
  // User is authenticated, redirect to dashboard
  router.push('/')
} else {
  // Show error
  showError(result.error)
}
```

## Backend Requirements

### Database Schema
```sql
-- Users table
ALTER TABLE users 
ADD COLUMN phone VARCHAR(20) NULL,
ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE;

-- 2FA codes table
CREATE TABLE two_factor_codes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used TINYINT(1) NOT NULL DEFAULT 0,
  used_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY user_id (user_id),
  KEY code (code),
  KEY expires_at (expires_at),
  KEY used (used),
  CONSTRAINT fk_two_factor_codes_user_id FOREIGN KEY (user_id) REFERENCES fw_users (id) ON DELETE CASCADE
);
```

### Backend Logic
1. **Login endpoint** should:
   - Validate email/password
   - Check if user has 2FA enabled
   - If 2FA enabled: return user data + `requires_2fa: true` + NO token
   - If 2FA disabled: return user data + token + `requires_2fa: false`

2. **Send code endpoint** should:
   - Accept email and delivery method (sms/email)
   - Generate 6-digit code
   - Send code via SMS or email
   - Save code to database with 10-minute expiration
   - Return success with contact info (masked)

3. **Verify code endpoint** should:
   - Accept user_id and 6-digit code
   - Validate the code for the specific user
   - Check if code is expired (10 minutes)
   - Check if code was already used
   - If valid: return authentication token and user data
   - If invalid: return error message

4. **Enable 2FA endpoint** should:
   - Accept user_id and phone number
   - Validate phone number format
   - Update user's phone and 2FA status

## Security Considerations
- Codes expire after 10 minutes
- Codes can only be used once
- Maximum 3 attempts per code
- Rate limiting: 1 SMS per minute per phone number
- All endpoints require authentication (except login and send-code)
- Phone numbers are masked in responses

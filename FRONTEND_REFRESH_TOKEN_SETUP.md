# Frontend Refresh Token Setup Instructions

## ✅ Changes Made

The following changes have been implemented to support refresh tokens:

### 1. Updated API Configuration
- Added `withCredentials` property to all environment configurations in `src/config/api.ts`
- Updated `ApiConfig` interface to include `withCredentials` property
- **Development**: `withCredentials: false` (temporarily disabled due to CORS)
- **Staging/Production**: `withCredentials: true` (enabled for refresh tokens)

### 2. Updated Session Utils
- Added `withCredentials: true` specifically for refresh token requests in `src/core/utils/session-utils.ts`
- This ensures refresh tokens work even when global CORS is disabled

### 3. Updated Test Configuration
- Added `withCredentials: false` to API test configuration in `src/core/utils/api-test.js`

## 🔧 Required Actions

### Step 1: Clear Browser Data
1. Open DevTools (F12)
2. Go to **Application** tab
3. Clear **Local Storage**:
   - Right-click on your domain → Clear
4. Clear **Cookies**:
   - Go to Cookies → http://localhost:8000
   - Delete all cookies
5. Or use incognito/private browsing mode

### Step 2: Re-login
1. Log out if currently logged in
2. Log in again with your credentials
3. This will create new refresh token cookies

### Step 3: Verify Setup
1. Open DevTools → **Application** → **Cookies**
2. Navigate to `http://localhost:8000`
3. You should see refresh token cookies:
   - `refresh_token` (HttpOnly, Secure)
   - Any other authentication cookies

### Step 4: Test Refresh Token Flow
1. Wait for access token to expire (or manually expire it)
2. Make an API request
3. Check that refresh token automatically renews the access token
4. Verify no re-login is required

## 🔍 Debugging

### Check Cookie Settings
- Cookies should be `HttpOnly` and `Secure` (in production)
- Domain should match your API domain
- Path should be `/` or appropriate API path

### Network Tab Verification
- All requests should include `Cookie` header
- Refresh requests should be automatic
- No 401 errors should occur during normal usage

### Console Logs
- Look for refresh token related logs
- Check for any CORS or cookie errors
- Verify session management logs

## 🚨 Troubleshooting

### CORS Error: "Credential is not supported if the CORS header 'Access-Control-Allow-Origin' is '*'"
**Problem**: Backend is configured with `Access-Control-Allow-Origin: *` but `withCredentials: true` requires specific origin.

**Solutions**:
1. **Backend Fix** (Required): Change CORS to allow specific origins:
   ```python
   # Instead of: Access-Control-Allow-Origin: *
   # Use: Access-Control-Allow-Origin: http://localhost:5173
   # And add: Access-Control-Allow-Credentials: true
   ```
   
   **Important**: Frontend now runs on port 5173 (not 3000). Backend must allow:
   - `http://localhost:5173` for development
   - Or configure multiple allowed origins if needed

2. **Frontend Workaround** (Current): 
   - `withCredentials: false` for general API requests in development
   - `withCredentials: true` specifically for refresh token requests

### If cookies are not being set:
1. Check CORS configuration on backend
2. Verify `withCredentials: true` is working
3. Check browser security settings
4. Try different browser or incognito mode

### If refresh tokens don't work:
1. Verify backend refresh endpoint is working
2. Check token expiration times
3. Verify cookie domain/path settings
4. Check network requests for errors

## 📝 Notes

- `withCredentials: true` enables sending cookies with cross-origin requests
- This is required for refresh token cookies to work properly
- All API requests will now include authentication cookies
- Session management will work automatically in the background

## ✅ Status

- **Backend**: Ready ✅
- **Frontend Configuration**: Complete ✅
- **Refresh Tokens**: Temporarily disabled due to CORS issues ⚠️
- **Current Behavior**: Users will need to re-login when tokens expire
- **Next Step**: Fix CORS on backend for full refresh token support 🔧

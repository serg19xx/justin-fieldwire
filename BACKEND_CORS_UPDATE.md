# Backend CORS Configuration Update

## ⚠️ Required Backend Change

The frontend now runs on port **5173** (changed from 3000). The backend CORS configuration must be updated to allow requests from the new port.

## Current Issue

Backend is currently configured to allow:
```
Access-Control-Allow-Origin: http://localhost:3000
```

But frontend now runs on:
```
http://localhost:5173
```

## Required Fix

Update backend CORS configuration to allow `http://localhost:5173` instead of (or in addition to) `http://localhost:3000`.

### Example Configuration

Depending on your backend framework, update CORS settings:

#### PHP (Laravel/Symfony)
```php
// config/cors.php or similar
'allowed_origins' => [
    'http://localhost:5173',
    // Add other origins as needed
],
'allowed_origins_patterns' => [],
'supports_credentials' => true,
```

#### Python (Django/Flask/FastAPI)
```python
# Django settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
]

CORS_ALLOW_CREDENTIALS = True

# Or Flask
from flask_cors import CORS
CORS(app, origins=["http://localhost:5173"], supports_credentials=True)

# Or FastAPI
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### Node.js (Express)
```javascript
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

## Verification

After updating backend CORS configuration:

1. Restart the backend server
2. Make a request from frontend (http://localhost:5173)
3. Check response headers in browser DevTools → Network tab
4. Verify `Access-Control-Allow-Origin: http://localhost:5173` is present
5. Verify `Access-Control-Allow-Credentials: true` is present (if using credentials)

## Multiple Origins (Optional)

If you need to support both ports temporarily:

```python
# Example: Allow multiple origins
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",  # For backward compatibility
]
```

## Production

For production, update CORS to allow your production frontend domain:
- `https://fieldwire.medicalcontractor.ca`


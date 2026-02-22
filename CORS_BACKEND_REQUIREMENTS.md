# CORS Configuration for Backend API

## Problem

Frontend: `https://fieldwire.medicalcontractor.ca`  
API: `https://fwapi.medicalcontractor.ca`

Different origins → browser blocks requests without proper CORS headers.

**Error:** `Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource`

---

## Required Backend Configuration

The API server at `fwapi.medicalcontractor.ca` **must** respond with these headers:

### 1. For all API responses (GET, POST, PUT, DELETE)

```
Access-Control-Allow-Origin: https://fieldwire.medicalcontractor.ca
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

### 2. For OPTIONS preflight requests

When browser sends `OPTIONS` before POST (e.g. login), the server must:
- Respond with **200 OK**
- Include the same CORS headers above
- No body required

---

## Framework Examples

### Express (Node.js)

```javascript
const cors = require('cors');
app.use(cors({
  origin: 'https://fieldwire.medicalcontractor.ca',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Nginx (reverse proxy in front of API)

```nginx
add_header 'Access-Control-Allow-Origin' 'https://fieldwire.medicalcontractor.ca' always;
add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, PATCH, DELETE, OPTIONS' always;
add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;

if ($request_method = 'OPTIONS') {
    add_header 'Access-Control-Max-Age' 86400;
    add_header 'Content-Length' 0;
    return 204;
}
```

### Laravel (PHP)

In `config/cors.php` or middleware:

```php
'allowed_origins' => ['https://fieldwire.medicalcontractor.ca'],
'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
'allowed_headers' => ['Content-Type', 'Authorization'],
```

---

## Development

For local development with `localhost:5173`, add:
```
Access-Control-Allow-Origin: http://localhost:5173
```

Or use multiple origins if your backend supports it.

---

---

## Alternative: API Proxy (avoids CORS)

If the same server hosts both the frontend and can proxy to the API, add to `.htaccess` **before** the SPA rewrite rules:

```apache
# Proxy API requests to backend (avoids CORS)
RewriteCond %{REQUEST_URI} ^/api
RewriteRule ^api/(.*)$ https://fwapi.medicalcontractor.ca/api/$1 [P,L]
```

Requires: `mod_proxy` and `mod_proxy_http` enabled. Then set `VITE_API_URL=` (empty) so frontend uses relative `/api`.

---

## Verify

After config, test:

```bash
curl -I -X OPTIONS https://fwapi.medicalcontractor.ca/api/v1/auth/login \
  -H "Origin: https://fieldwire.medicalcontractor.ca" \
  -H "Access-Control-Request-Method: POST"
```

Response must include `Access-Control-Allow-Origin: https://fieldwire.medicalcontractor.ca`

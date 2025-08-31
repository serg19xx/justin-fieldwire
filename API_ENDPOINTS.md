# 🔌 FieldWire API Endpoints

## Authentication Endpoints

### POST /auth/login
**Login with email and password**

**Request:**
```json
{
  "email": "admin@medicalcontractor.ca",
  "password": "password1234"
}
```

**Response (Success):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "admin@medicalcontractor.ca",
    "name": "Justin Admin",
    "role": "admin",
    "twoFactorEnabled": false,
    "isActive": true,
    "permissions": ["all"]
  },
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "requires2FA": false
}
```

**Response (2FA Required):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "admin@medicalcontractor.ca",
    "name": "Justin Admin",
    "role": "admin",
    "twoFactorEnabled": true,
    "isActive": true,
    "permissions": ["all"]
  },
  "requires2FA": true
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### POST /auth/verify-2fa
**Verify 2FA code**

**Request:**
```json
{
  "code": "123456"
}
```

**Response (Success):**
```json
{
  "success": true,
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Invalid 2FA code"
}
```

### GET /auth/me
**Get current user info (requires token)**

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": 1,
  "email": "admin@medicalcontractor.ca",
  "name": "Justin Admin",
  "role": "admin",
  "twoFactorEnabled": false,
  "isActive": true,
  "lastLogin": "2024-01-15T10:30:00Z",
  "permissions": ["all"]
}
```

### POST /auth/logout
**Logout (invalidate token)**

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## User Management Endpoints

### GET /api/builders
**Get all users (requires admin permission)**

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "users": [
    {
      "id": 1,
      "email": "admin@medicalcontractor.ca",
      "name": "Justin Admin",
      "role": "admin",
      "jobTitle": "System Administrator",
      "userType": "System Administrator",
      "status": "active",
      "twoFactorEnabled": false,
      "isActive": true,
      "lastLogin": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### PATCH /api/builders/{id}/status
**Toggle user status (requires admin permission)**

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "status": "inactive"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User status updated"
}
```

## Invitation Endpoints

### POST /api/invitations
**Send invitation to new user**

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "email": "newuser@company.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "engineer"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invitation sent successfully"
}
```

### GET /api/invitations/pending
**Get pending invitations**

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "invitations": [
    {
      "id": 1,
      "email": "newuser@company.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "engineer",
      "invitedBy": "admin@medicalcontractor.ca",
      "invitedAt": "2024-01-15T10:00:00Z",
      "status": "pending"
    }
  ]
}
```

### DELETE /api/invitations/{id}
**Delete invitation**

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Invitation deleted"
}
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'manager', 'supervisor', 'engineer', 'viewer') NOT NULL,
  job_title VARCHAR(255),
  user_type ENUM('System Administrator', 'Architect', 'Project Manager', 'General Contractor', 'Trade Contractor', 'Client') NOT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Invitations Table
```sql
CREATE TABLE invitations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  invited_by INT NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  status ENUM('pending', 'accepted', 'expired') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invited_by) REFERENCES users(id)
);
```

## Security Notes

1. **Password Hashing**: Use bcrypt with cost factor 12
2. **JWT Tokens**: Use secure secret and reasonable expiration time
3. **CORS**: Configure for your frontend domain
4. **Rate Limiting**: Implement for login attempts
5. **Input Validation**: Validate all inputs server-side
6. **SQL Injection**: Use prepared statements
7. **XSS Protection**: Sanitize all outputs

## Testing

Use the API Tester at `/api-tester` to test endpoints:

1. **Health Check**: `GET /api/v1/health`
2. **Version Info**: `GET /api/v1/version`
3. **Database Tables**: `GET /api/v1/database/tables`

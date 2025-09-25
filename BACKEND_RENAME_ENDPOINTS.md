# Backend API Endpoints for Rename Operations

## File Rename
**Endpoint:** `PUT /api/v1/plan/files/{fileId}/rename`
**Purpose:** Rename a file

### Request Body:
```json
{
  "new_name": "new_filename.pdf"
}
```

### Response:
```json
{
  "id": 123,
  "file_name": "new_filename.pdf",
  "original_name": "old_filename.pdf",
  "file_path": "/uploads/project_10/files/abc123.pdf",
  "folder_id": 5,
  "file_size": 1024000,
  "mime_type": "application/pdf",
  "category": "document",
  "description": "File description",
  "version": "1.0",
  "uploaded_by": 47,
  "uploaded_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T14:30:00Z"
}
```

### Error Responses:
- `400 Bad Request` - Invalid new name (empty, too long, invalid characters)
- `404 Not Found` - File not found
- `409 Conflict` - File with same name already exists in folder
- `500 Internal Server Error` - Server error

---

## Folder Rename
**Endpoint:** `PUT /api/v1/plan/folders/{folderId}/rename`
**Purpose:** Rename a folder

### Request Body:
```json
{
  "new_name": "New Folder Name"
}
```

### Response:
```json
{
  "id": 5,
  "name": "New Folder Name",
  "parent_id": 1,
  "project_id": 10,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T14:30:00Z"
}
```

### Error Responses:
- `400 Bad Request` - Invalid new name (empty, too long, invalid characters)
- `404 Not Found` - Folder not found
- `409 Conflict` - Folder with same name already exists in parent
- `500 Internal Server Error` - Server error

---

## File Description Update
**Endpoint:** `PUT /api/v1/plan/files/{fileId}/description`
**Purpose:** Update file description

### Request Body:
```json
{
  "description": "Updated file description with more details about the content"
}
```

### Response:
```json
{
  "id": 123,
  "file_name": "document.pdf",
  "original_name": "document.pdf",
  "file_path": "/uploads/project_10/files/abc123.pdf",
  "folder_id": 5,
  "file_size": 1024000,
  "mime_type": "application/pdf",
  "category": "document",
  "description": "Updated file description with more details about the content",
  "version": "1.0",
  "uploaded_by": 47,
  "uploaded_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T14:30:00Z"
}
```


### Error Responses:
- `400 Bad Request` - Invalid description (too long)
- `404 Not Found` - File not found
- `500 Internal Server Error` - Server error

---

## Business Logic Requirements

### Name Validation:
- **Minimum length:** 1 character
- **Maximum length:** 255 characters
- **Allowed characters:** Letters, numbers, spaces, hyphens, underscores, dots
- **Forbidden characters:** `/\:*?"<>|`
- **Trim whitespace** from beginning and end

### Description Validation:
- **Maximum length:** 1000 characters
- **Allow empty** descriptions
- **Trim whitespace** from beginning and end

### Conflict Resolution:
- **File rename:** Check if file with same name exists in same folder
- **Folder rename:** Check if folder with same name exists in same parent
- **Case insensitive** comparison for conflicts
- **Return 409 Conflict** if name already exists

### Database Updates:
- **Update `updated_at`** timestamp
- **Log the change** in audit trail (optional)
- **Maintain referential integrity**

### Security:
- **User authorization** - only project members can rename
- **File/folder ownership** - users can only rename their own files (optional)
- **Project permissions** - check user has edit permissions for project

---

## Implementation Priority: HIGH
These endpoints are required for the file manager's rename and description editing functionality.

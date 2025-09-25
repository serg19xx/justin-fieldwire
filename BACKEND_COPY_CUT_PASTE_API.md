# Backend API Requirements: Copy/Cut/Paste Operations

## Overview
This document defines the backend API endpoints required for file and folder copy/cut/paste operations in the Fieldwire application.

## API Endpoints

### 1. Move File to Different Folder

**Endpoint:** `PUT /api/v1/plan/files/{fileId}/move`

**Description:** Moves a file from its current folder to a new folder.

**Request:**
```json
{
  "folder_id": 123
}
```

**Response (Success - 200):**
```json
{
  "id": 456,
  "file_name": "document.pdf",
  "original_name": "document.pdf",
  "file_path": "/uploads/project_1/folder_123/document_456.pdf",
  "folder_id": 123,
  "file_size": 1024000,
  "mime_type": "application/pdf",
  "category": "document",
  "description": "Project documentation",
  "version": "1.0",
  "uploaded_by": 1,
  "uploaded_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid folder_id or file_id
- `404 Not Found` - File or folder not found
- `403 Forbidden` - User doesn't have permission to move file
- `409 Conflict` - File with same name already exists in destination

### 2. Copy File to Different Folder

**Endpoint:** `POST /api/v1/plan/files/{fileId}/copy`

**Description:** Creates a copy of a file in a new folder.

**Request:**
```json
{
  "folder_id": 123,
  "file_name": "document_copy.pdf"  // Optional: new name for the copy
}
```

**Response (Success - 201):**
```json
{
  "id": 789,
  "file_name": "document_copy.pdf",
  "original_name": "document.pdf",
  "file_path": "/uploads/project_1/folder_123/document_copy_789.pdf",
  "folder_id": 123,
  "file_size": 1024000,
  "mime_type": "application/pdf",
  "category": "document",
  "description": "Project documentation",
  "version": "1.0",
  "uploaded_by": 1,
  "uploaded_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid folder_id or file_id
- `404 Not Found` - Source file or destination folder not found
- `403 Forbidden` - User doesn't have permission to copy file
- `409 Conflict` - File with same name already exists in destination

### 3. Move Folder to Different Parent

**Endpoint:** `PUT /api/v1/plan/folders/{folderId}/move`

**Description:** Moves a folder to a new parent folder.

**Request:**
```json
{
  "parent_id": 456  // null for root level
}
```

**Response (Success - 200):**
```json
{
  "id": 123,
  "name": "Project Documents",
  "parent_id": 456,
  "project_id": 1,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "children": []
}
```

**Error Responses:**
- `400 Bad Request` - Invalid parent_id or folder_id
- `404 Not Found` - Folder or parent folder not found
- `403 Forbidden` - User doesn't have permission to move folder
- `409 Conflict` - Folder with same name already exists in destination
- `400 Bad Request` - Cannot move folder to its own subfolder (circular reference)

### 4. Copy Folder to Different Parent

**Endpoint:** `POST /api/v1/plan/folders/{folderId}/copy`

**Description:** Creates a copy of a folder and all its contents in a new parent folder.

**Request:**
```json
{
  "parent_id": 456,
  "name": "Project Documents Copy"  // Optional: new name for the copy
}
```

**Response (Success - 201):**
```json
{
  "id": 789,
  "name": "Project Documents Copy",
  "parent_id": 456,
  "project_id": 1,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "children": []
}
```

**Error Responses:**
- `400 Bad Request` - Invalid parent_id or folder_id
- `404 Not Found` - Source folder or destination parent not found
- `403 Forbidden` - User doesn't have permission to copy folder
- `409 Conflict` - Folder with same name already exists in destination

## Business Logic Requirements

### File Operations

1. **Move File:**
   - Update the file's `folder_id` in the database
   - Update the `updated_at` timestamp
   - Verify user has permission to move the file
   - Check for name conflicts in destination folder
   - Return updated file data

2. **Copy File:**
   - Create a new file record with same metadata
   - Generate new unique file path
   - Copy the physical file to new location
   - Set new `folder_id` and `uploaded_at` timestamp
   - Handle name conflicts (append number if needed)
   - Return new file data

### Folder Operations

1. **Move Folder:**
   - Update the folder's `parent_id` in the database
   - Update the `updated_at` timestamp
   - Verify user has permission to move the folder
   - Check for name conflicts in destination
   - Prevent circular references (folder cannot be moved to its own subfolder)
   - Return updated folder data

2. **Copy Folder:**
   - Create new folder record with same metadata
   - Set new `parent_id` and `created_at` timestamp
   - Recursively copy all subfolders and files
   - Handle name conflicts for all copied items
   - Return new folder data

## Error Handling

### Common Error Responses

```json
// 400 Bad Request
{
  "error": "Bad Request",
  "message": "Invalid folder_id provided",
  "code": "INVALID_FOLDER_ID"
}

// 404 Not Found
{
  "error": "Not Found",
  "message": "File with ID 123 not found",
  "code": "FILE_NOT_FOUND"
}

// 403 Forbidden
{
  "error": "Forbidden",
  "message": "You don't have permission to move this file",
  "code": "INSUFFICIENT_PERMISSIONS"
}

// 409 Conflict
{
  "error": "Conflict",
  "message": "A file with the same name already exists in the destination folder",
  "code": "NAME_CONFLICT"
}
```

## Database Schema Considerations

### Files Table
- `id` (Primary Key)
- `file_name` (VARCHAR)
- `original_name` (VARCHAR)
- `file_path` (VARCHAR) - Physical path on server
- `folder_id` (Foreign Key to folders table)
- `file_size` (BIGINT)
- `mime_type` (VARCHAR)
- `category` (VARCHAR)
- `description` (TEXT)
- `version` (VARCHAR)
- `uploaded_by` (Foreign Key to users table)
- `uploaded_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Folders Table
- `id` (Primary Key)
- `name` (VARCHAR)
- `parent_id` (Foreign Key to folders table, nullable)
- `project_id` (Foreign Key to projects table)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Security Considerations

1. **Permission Checks:**
   - Verify user has access to source file/folder
   - Verify user has write access to destination folder
   - Check project-level permissions

2. **Path Validation:**
   - Prevent directory traversal attacks
   - Validate file paths are within allowed directories
   - Sanitize file names

3. **Resource Limits:**
   - Limit folder copy depth to prevent infinite recursion
   - Set maximum file size limits
   - Implement rate limiting for copy operations

## Performance Considerations

1. **Copy Operations:**
   - Use database transactions for consistency
   - Implement batch operations for large folder copies
   - Consider background processing for large operations

2. **File System:**
   - Use efficient file copying methods
   - Implement progress tracking for large operations
   - Consider using symbolic links for large files

## Testing Requirements

### Unit Tests
- Test all API endpoints with valid and invalid inputs
- Test permission checks
- Test error handling scenarios
- Test name conflict resolution

### Integration Tests
- Test complete copy/move workflows
- Test with large folders containing many files
- Test concurrent operations
- Test rollback scenarios

### Performance Tests
- Test with large files (100MB+)
- Test with deep folder structures (10+ levels)
- Test with many files in single folder (1000+ files)

## Implementation Notes

1. **File System Operations:**
   - Use atomic operations where possible
   - Implement proper cleanup on failures
   - Consider using file system events for real-time updates

2. **Database Operations:**
   - Use transactions for multi-table operations
   - Implement proper indexing for performance
   - Consider using database triggers for audit trails

3. **API Design:**
   - Follow RESTful conventions
   - Use appropriate HTTP status codes
   - Provide detailed error messages
   - Include request/response examples in documentation

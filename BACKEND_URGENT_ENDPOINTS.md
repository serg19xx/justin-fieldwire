# 🚨 URGENT: Backend Endpoints Needed for Copy/Cut/Paste Operations

## Current Status
- ✅ Frontend implementation is complete
- ❌ Backend endpoints are missing (causing 500 errors)
- 🔧 Users see error: "Copy/Paste operations are not yet implemented on the backend"

## Required Endpoints (PRIORITY 1)

### 1. Copy File
```
POST /api/v1/plan/files/{fileId}/copy
Body: { folder_id: number, file_name?: string }
Response: FileUpload object
```

### 2. Copy Folder  
```
POST /api/v1/plan/folders/{folderId}/copy
Body: { parent_id: number, name?: string }
Response: Folder object
```

### 3. Move File
```
PUT /api/v1/plan/files/{fileId}/move
Body: { folder_id: number }
Response: FileUpload object
```

### 4. Move Folder
```
PUT /api/v1/plan/folders/{folderId}/move
Body: { parent_id: number }
Response: Folder object
```

## Current Error
```
POST http://localhost:8000/api/v1/plan/files/20/copy
[HTTP/1.1 500 Internal Server Error 463ms]
```

## Full Implementation Details
See: `BACKEND_COPY_CUT_PASTE_API.md` for complete API specification.

## Test After Implementation
1. Copy a file (Ctrl+C, then Ctrl+V)
2. Move a file (select file, click "📁 Move", choose destination)
3. Copy a folder (Ctrl+C, then Ctrl+V)
4. Move a folder (select folder, click "📁 Move", choose destination)

## Expected Behavior
- Copy operations should create new files/folders
- Move operations should relocate existing files/folders
- UI should update automatically after operations
- Success/error messages should be shown to user

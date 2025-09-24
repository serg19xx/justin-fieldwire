# Backend API Mapping for File Management

## Database Structure

### 1. Folders Table (Left Panel Tree)
```sql
CREATE TABLE folders (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  parent_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Files Table (Right Panel Content)
```sql
CREATE TABLE files (
  id SERIAL PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL, -- Physical path on server
  folder_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  version VARCHAR(50),
  uploaded_by INTEGER NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### Folder Management

#### Get Folder Tree (Left Panel)
```
GET /folders/tree
Response: Folder[]
```

#### Get Subfolders
```
GET /folders/{folderId}/subfolders
Response: Folder[]
```

#### Create Folder
```
POST /folders
Body: { name: string, parent_id?: number }
Response: Folder
```

#### Rename Folder
```
PUT /folders/{folderId}
Body: { name: string }
Response: Folder
```

#### Delete Folder
```
DELETE /folders/{folderId}
Response: void
```

### File Management

#### Get Files in Folder (Right Panel)
```
GET /folders/{folderId}/files
Response: FileUpload[]
```

#### Upload File
```
POST /files/upload
Body: FormData {
  file: File,
  folder_id: number,
  fileName: string,
  description: string,
  category: string,
  version: string
}
Response: FileUpload
```

#### Download File
```
GET /files/{fileId}/download
Response: Blob
```

#### Delete File
```
DELETE /files/{fileId}
Response: void
```

#### Rename File
```
PUT /files/{fileId}
Body: { file_name: string }
Response: FileUpload
```

#### Move File
```
PUT /files/{fileId}/move
Body: { folder_id: number }
Response: FileUpload
```

#### Copy File
```
POST /files/{fileId}/copy
Body: { folder_id: number, file_name?: string }
Response: FileUpload
```

#### Update File Metadata
```
PUT /files/{fileId}
Body: Partial<FileUpload>
Response: FileUpload
```

## Frontend-Backend Mapping

### Left Panel (Folder Tree)
- **Load**: `filesApi.getFolderTree()` → `GET /folders/tree`
- **Navigate**: `filesApi.getSubfolders(folderId)` → `GET /folders/{folderId}/subfolders`
- **Create**: `filesApi.createFolder(name, parentId)` → `POST /folders`
- **Rename**: `filesApi.renameFolder(folderId, newName)` → `PUT /folders/{folderId}`
- **Delete**: `filesApi.deleteFolder(folderId)` → `DELETE /folders/{folderId}`

### Right Panel (File Content)
- **Load**: `filesApi.getFilesInFolder(folderId)` → `GET /folders/{folderId}/files`
- **Upload**: `filesApi.uploadFile(file, folderId, metadata)` → `POST /files/upload`
- **Download**: `filesApi.downloadFile(fileId)` → `GET /files/{fileId}/download`
- **Delete**: `filesApi.deleteFile(fileId)` → `DELETE /files/{fileId}`
- **Rename**: `filesApi.renameFile(fileId, newName)` → `PUT /files/{fileId}`
- **Move**: `filesApi.moveFile(fileId, newFolderId)` → `PUT /files/{fileId}/move`
- **Copy**: `filesApi.copyFile(fileId, newFolderId, newName)` → `POST /files/{fileId}/copy`

## File System Structure

### Physical Storage
```
/uploads/
├── file_1234567890_abc123.pdf
├── file_1234567891_def456.jpg
├── file_1234567892_ghi789.xlsx
└── ...
```

### Virtual Structure (Database)
```
Root (parent_id: null)
├── Project Plans (id: 1)
│   ├── Drawings (id: 2)
│   └── Specifications (id: 3)
└── Task Documents (id: 4)
    └── Photos (id: 5)
```

## Operations Mapping

### Copy Operation
1. **Frontend**: User copies file → `clipboard` stores file reference
2. **Backend**: `POST /files/{fileId}/copy` → Creates new file record, same physical file
3. **Result**: Two file records point to same physical file

### Move Operation
1. **Frontend**: User moves file → `clipboard` stores file reference
2. **Backend**: `PUT /files/{fileId}/move` → Updates `folder_id` in database
3. **Result**: File record points to new folder, same physical file

### Delete Operation
1. **Frontend**: User deletes file → Confirmation dialog
2. **Backend**: `DELETE /files/{fileId}` → Removes file record
3. **Result**: File record deleted, physical file may remain (garbage collection)

## Conflict Resolution

### File Name Conflicts
1. **Check**: Backend checks if file with same name exists in target folder
2. **Resolve**: Frontend shows dialog with options:
   - Replace existing file
   - Rename new file (auto-generate unique name)
   - Cancel operation
3. **Backend**: Handles rename by generating unique filename

### Folder Name Conflicts
1. **Check**: Backend checks if folder with same name exists in parent
2. **Resolve**: Same as file conflicts
3. **Backend**: Handles rename by generating unique folder name

## Error Handling

### Common Errors
- **404**: Folder/File not found
- **409**: Name conflict (file/folder already exists)
- **413**: File too large
- **415**: Unsupported file type
- **500**: Server error

### Frontend Handling
- Show user-friendly error messages
- Retry failed operations
- Preserve user state during errors
- Log errors for debugging

## Performance Considerations

### Lazy Loading
- Load folder tree on startup
- Load files only when folder is opened
- Cache frequently accessed data

### Pagination
- Implement pagination for large file lists
- Load files in batches of 50-100
- Virtual scrolling for very large lists

### Caching
- Cache folder tree structure
- Cache file metadata
- Invalidate cache on updates

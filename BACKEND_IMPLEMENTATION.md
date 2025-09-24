npm

## Backend Implementation (Node.js/Express)

### 1. Folder Tree Endpoint
```javascript
// GET /api/v1/plan/folders/tree
app.get('/api/v1/plan/folders/tree', async (req, res) => {
  try {
    // Get all folders
    const folders = await db.query(`
      SELECT id, name, parent_id, created_at, updated_at 
      FROM fw_plan_folders 
      ORDER BY name
    `);
    
    // Build tree structure
    const folderMap = new Map();
    const rootFolders = [];
    
    // Create map of all folders
    folders.rows.forEach(folder => {
      folder.children = [];
      folderMap.set(folder.id, folder);
    });
    
    // Build tree
    folders.rows.forEach(folder => {
      if (folder.parent_id === null) {
        rootFolders.push(folder);
      } else {
        const parent = folderMap.get(folder.parent_id);
        if (parent) {
          parent.children.push(folder);
        }
      }
    });
    
    res.json(rootFolders);
  } catch (error) {
    console.error('Error fetching folder tree:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### 2. Folder Content Endpoint
```javascript
// GET /api/v1/plan/folders/:folderId/content
app.get('/api/v1/plan/folders/:folderId/content', async (req, res) => {
  try {
    const folderId = parseInt(req.params.folderId);
    
    // Get folder info
    const folderResult = await db.query(`
      SELECT id, name, parent_id, created_at, updated_at 
      FROM fw_plan_folders 
      WHERE id = $1
    `, [folderId]);
    
    if (folderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    const folder = folderResult.rows[0];
    
    // Get subfolders
    const subfoldersResult = await db.query(`
      SELECT id, name, parent_id, created_at, updated_at 
      FROM fw_plan_folders 
      WHERE parent_id = $1 
      ORDER BY name
    `, [folderId]);
    
    // Get files
    const filesResult = await db.query(`
      SELECT id, file_name, original_name, file_path, folder_id, 
             file_size, mime_type, category, description, version, 
             uploaded_by, uploaded_at, updated_at 
      FROM fw_plan_files 
      WHERE folder_id = $1 
      ORDER BY file_name
    `, [folderId]);
    
    res.json({
      folder: folder,
      subfolders: subfoldersResult.rows,
      files: filesResult.rows
    });
  } catch (error) {
    console.error('Error fetching folder content:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

## Frontend Integration

### 1. Update API Types
```typescript
// src/utils/files-api.ts
export interface Folder {
  id: number
  name: string
  parent_id: number | null
  created_at: string
  updated_at: string
  children?: Folder[]
}

export interface FileUpload {
  id: number
  file_name: string
  original_name: string
  file_path: string
  folder_id: number
  file_size: number
  mime_type: string
  category: string
  description: string | null
  version: string | null
  uploaded_by: number
  uploaded_at: string
  updated_at: string
}

export interface FolderContent {
  folder: Folder
  subfolders: Folder[]
  files: FileUpload[]
}
```

### 2. Update API Functions
```typescript
// src/utils/files-api.ts
export const filesApi = {
  // Get folder tree (for left panel)
  async getFolderTree(): Promise<Folder[]> {
    const response = await api.get('/v1/plan/folders/tree')
    return response.data
  },

  // Get folder content (for right panel)
  async getFolderContent(folderId: number): Promise<FolderContent> {
    const response = await api.get(`/v1/plan/folders/${folderId}/content`)
    return response.data
  }
}
```

### 3. Update FolderManager Component
```typescript
// src/components/FolderManager.vue
async function loadFolderTree() {
  try {
    const tree = await filesApi.getFolderTree()
    folders.value = tree
  } catch (error) {
    console.error('Error loading folder tree:', error)
  }
}

async function loadFolderContent(folderId: number) {
  try {
    const content = await filesApi.getFolderContent(folderId)
    // Update current folder
    currentFolder.value = content.folder
    // Update subfolders and files
    currentFolders.value = content.subfolders
    currentFiles.value = content.files
  } catch (error) {
    console.error('Error loading folder content:', error)
  }
}
```

## Testing

### 1. Test Folder Tree
```bash
curl -X GET http://localhost:3000/api/v1/plan/folders/tree
```

### 2. Test Folder Content
```bash
curl -X GET http://localhost:3000/api/v1/plan/folders/2/content
```

## Next Steps

1. **Implement these 2 endpoints** on backend
2. **Test with frontend** integration
3. **Add error handling** and validation
4. **Add remaining endpoints** (create, update, delete)
5. **Add file upload** functionality

## Error Handling

### Common Errors
- **404**: Folder not found
- **500**: Database connection error
- **400**: Invalid folder ID

### Response Format
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional details"
}
```

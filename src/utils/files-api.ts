import { api } from './api'

export interface FileUpload {
  id: number
  file_name: string
  original_name: string
  file_path: string // Physical path on server (unique filename)
  folder_id: number // ID of folder where file is located
  file_size: number
  mime_type: string
  category: string
  description?: string
  version?: string
  uploaded_by: number
  uploaded_at: string
  updated_at: string
}

export interface Folder {
  id: number
  name: string
  parent_id?: number // ID of parent folder (null for root)
  project_id: number // ID of project this folder belongs to
  created_at: string
  updated_at: string
  children?: Folder[] // Nested folders
  files?: FileUpload[] // Files in this folder
}

export interface FileUploadResponse {
  files: FileUpload[]
  folders: Folder[]
  total: number
  page: number
  limit: number
}

export interface FolderResponse {
  folders: Folder[]
  total: number
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export const filesApi = {
  // Get folder tree (for left panel)
  async getFolderTree(projectId: number): Promise<Folder[]> {
    const response = await api.get(`/api/v1/plan/folders/tree?project_id=${projectId}`)
    return response.data
  },

  // Get folder content (for right panel)
  async getFolderContent(
    folderId: number,
  ): Promise<{ folder: Folder; subfolders: Folder[]; files: FileUpload[] }> {
    const response = await api.get(`/api/v1/plan/folders/${folderId}/content`)
    return response.data
  },

  // Get subfolders in specific folder
  async getSubfolders(folderId: number): Promise<Folder[]> {
    const response = await api.get(`/api/v1/plan/folders/${folderId}/subfolders`)
    return response.data
  },

  // Create folder
  async createFolder(name: string, projectId: number, parentId?: number): Promise<Folder> {
    const response = await api.post('/api/v1/plan/folders', {
      name,
      project_id: projectId,
      parent_id: parentId || null,
    })
    return response.data
  },

  // Delete folder
  async deleteFolder(folderId: number): Promise<{ message: string; folder: Folder }> {
    const response = await api.delete(`/api/v1/plan/folders/${folderId}`)
    return response.data
  },

  // Upload file to specific folder
  async uploadFile(
    file: File,
    folderId: number,
    metadata: {
      fileName: string
      description: string
      category: string
      version: string
    },
  ): Promise<FileUpload> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder_id', folderId.toString())
    formData.append('fileName', metadata.fileName)
    formData.append('description', metadata.description)
    formData.append('category', metadata.category)
    formData.append('version', metadata.version)

    const response = await api.post('/api/v1/plan/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Download file (force download)
  async downloadFile(fileId: number): Promise<Blob> {
    const response = await api.get(`/api/v1/plan/files/${fileId}/download`, {
      responseType: 'blob',
    })
    return response.data
  },

  // Preview file (open in browser)
  async previewFile(fileId: number): Promise<Blob> {
    const response = await api.get(`/api/v1/plan/files/${fileId}/download?action=preview`, {
      responseType: 'blob',
    })
    return response.data
  },

  // Delete file
  async deleteFile(fileId: number): Promise<void> {
    await api.delete(`/api/v1/plan/files/${fileId}`)
  },

  // Move file to different folder
  async moveFile(fileId: number, newFolderId: number): Promise<FileUpload> {
    const response = await api.put(`/api/v1/plan/files/${fileId}/move`, { folder_id: newFolderId })
    return response.data
  },

  // Copy file (creates new file record, same physical file)
  async copyFile(fileId: number, newFolderId: number, newName?: string): Promise<FileUpload> {
    const response = await api.post(`/api/v1/plan/files/${fileId}/copy`, {
      folder_id: newFolderId,
      file_name: newName,
    })
    return response.data
  },

  // Move folder to different parent
  async moveFolder(folderId: number, newParentId?: number): Promise<Folder> {
    const response = await api.put(`/api/v1/plan/folders/${folderId}/move`, {
      parent_id: newParentId || null,
    })
    return response.data
  },

  // Copy folder (creates new folder with all contents)
  async copyFolder(folderId: number, newParentId: number, newName?: string): Promise<Folder> {
    const response = await api.post(`/api/v1/plan/folders/${folderId}/copy`, {
      parent_id: newParentId,
      name: newName,
    })
    return response.data
  },

  // Update file metadata
  async updateFile(fileId: number, metadata: Partial<FileUpload>): Promise<FileUpload> {
    const response = await api.put(`/api/v1/plan/files/${fileId}`, metadata)
    return response.data
  },

  // Get file info by ID
  async getFileInfo(fileId: number): Promise<FileUpload> {
    const response = await api.get(`/api/v1/plan/files/${fileId}`)
    return response.data
  },

  // Get folder info by ID
  async getFolderInfo(folderId: number): Promise<Folder> {
    const response = await api.get(`/api/v1/plan/folders/${folderId}`)
    return response.data
  },

  // Rename file
  async renameFile(fileId: number, newName: string): Promise<FileUpload> {
    const response = await api.put(`/api/v1/plan/files/${fileId}/rename`, {
      new_name: newName,
    })
    return response.data
  },

  // Rename folder
  async renameFolder(folderId: number, newName: string): Promise<Folder> {
    const response = await api.put(`/api/v1/plan/folders/${folderId}/rename`, {
      new_name: newName,
    })
    return response.data
  },

  // Update file description
  async updateFileDescription(fileId: number, description: string): Promise<FileUpload> {
    const response = await api.put(`/api/v1/plan/files/${fileId}/description`, {
      description: description,
    })
    return response.data
  },
}

// Utility function to download file from blob
export function downloadFileFromBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

// Interface for file icon with label
export interface FileIcon {
  icon: string
  label: string
  color: string
}

// Utility function to get file icon with label based on MIME type and filename
export function getFileIcon(mimeType: string, fileName?: string): FileIcon {
  const name = fileName?.toLowerCase() || ''

  // Images - specific format icons
  if (mimeType.startsWith('image/')) {
    if (mimeType.includes('svg')) return { icon: '🎨', label: 'SVG', color: 'text-purple-600' }
    if (mimeType.includes('gif')) return { icon: '🎞️', label: 'GIF', color: 'text-green-600' }
    if (mimeType.includes('png') || mimeType.includes('jpg') || mimeType.includes('jpeg'))
      return { icon: '🖼️', label: 'IMG', color: 'text-blue-600' }
    return { icon: '🖼️', label: 'IMG', color: 'text-blue-600' }
  }

  // Main document types - priority files
  if (
    mimeType.includes('excel') ||
    mimeType.includes('spreadsheet') ||
    name.endsWith('.xls') ||
    name.endsWith('.xlsx')
  ) {
    return { icon: '📊', label: 'XLS', color: 'text-green-600' }
  }
  if (
    mimeType.includes('word') ||
    mimeType.includes('document') ||
    name.endsWith('.doc') ||
    name.endsWith('.docx')
  ) {
    return { icon: '📝', label: 'DOC', color: 'text-blue-600' }
  }
  if (name.endsWith('.csv')) {
    return { icon: '📋', label: 'CSV', color: 'text-emerald-800' }
  }

  // Other documents
  if (mimeType.includes('pdf') || name.endsWith('.pdf')) {
    return { icon: '📕', label: 'PDF', color: 'text-red-600' }
  }
  if (
    mimeType.includes('powerpoint') ||
    mimeType.includes('presentation') ||
    name.endsWith('.ppt') ||
    name.endsWith('.pptx')
  ) {
    return { icon: '📙', label: 'PPT', color: 'text-orange-600' }
  }

  // CAD/Drawing files
  if (
    name.endsWith('.dwg') ||
    name.endsWith('.dxf') ||
    name.endsWith('.skp') ||
    name.endsWith('.step') ||
    name.endsWith('.stp')
  ) {
    return { icon: '📐', label: 'CAD', color: 'text-gray-600' }
  }

  // Archives
  if (
    mimeType.includes('zip') ||
    mimeType.includes('rar') ||
    mimeType.includes('archive') ||
    name.endsWith('.zip') ||
    name.endsWith('.rar') ||
    name.endsWith('.7z') ||
    name.endsWith('.tar') ||
    name.endsWith('.gz')
  ) {
    return { icon: '🗜️', label: 'ZIP', color: 'text-yellow-600' }
  }

  // Media
  if (mimeType.includes('video/')) return { icon: '🎬', label: 'VID', color: 'text-purple-600' }
  if (mimeType.includes('audio/')) return { icon: '🎵', label: 'AUD', color: 'text-pink-600' }

  // Text files
  if (
    mimeType.includes('text/') ||
    name.endsWith('.txt') ||
    name.endsWith('.md') ||
    name.endsWith('.json') ||
    name.endsWith('.xml')
  ) {
    return { icon: '📋', label: 'TXT', color: 'text-gray-600' }
  }

  // Default
  return { icon: '📄', label: 'FILE', color: 'text-gray-600' }
}

// Utility function to get folder icon - all folders have the same icon
export function getFolderIcon(): string {
  // All folders have the same icon
  return '📁'
}

// Utility function to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

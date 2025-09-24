<template>
  <div class="h-full flex flex-col" @keydown="handleKeydown" tabindex="0">
    <!-- Top Bar with Breadcrumb and Toolbar -->
    <div class="flex items-center justify-end px-4 py-2 border-b border-gray-200 bg-white">
      <!-- Toolbar -->
      <div class="flex items-center space-x-2">
        <!-- Create Actions -->
        <button
          @click="showCreateFolderDialog = true"
          class="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          + New Folder
        </button>
        <button
          @click="createNewDocument"
          class="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          + New Document
        </button>
        <button
          @click="refreshCurrentPath"
          class="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
        >
          🔄 Refresh
        </button>

        <!-- Divider -->
        <div class="w-px h-6 bg-gray-300 mx-2"></div>

        <!-- File Actions -->
        <button
          @click="deleteSelected"
          :disabled="selectedItems.length === 0"
          class="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          :title="`Delete (${selectedItems.length} selected) - Delete / Backspace`"
        >
          Delete
        </button>
        <button
          @click="moveSelected"
          :disabled="selectedItems.length === 0"
          class="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          :title="`Move (${selectedItems.length} selected) - Permanent move to new location`"
        >
          📁 Move
        </button>
        <button
          @click="cutSelected"
          :disabled="selectedItems.length === 0"
          class="px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          :title="`Cut (${selectedItems.length} selected) - Cut for paste - Ctrl+X / Cmd+X`"
        >
          ✂️ Cut
        </button>
        <button
          @click="copySelected"
          :disabled="selectedItems.length === 0"
          class="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          :title="`Copy (${selectedItems.length} selected) - Ctrl+C / Cmd+C`"
        >
          📋 Copy
        </button>
        <button
          @click="pasteItems"
          :disabled="clipboard.length === 0"
          class="px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
          :title="`Paste (${clipboard.length} in clipboard) - Ctrl+V / Cmd+V${clipboard.some((item) => item.action === 'copy') ? ' (can paste multiple times)' : ''}`"
        >
          📋 Paste
        </button>
        <button
          @click="downloadSelected"
          :disabled="selectedItems.length === 0"
          class="px-3 py-1 text-xs bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
          :title="`Download (${selectedItems.length} selected)`"
        >
          ⬇️ Download
        </button>
        <button
          @click="clearClipboard"
          :disabled="clipboard.length === 0"
          class="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          :title="`Clear Clipboard (${clipboard.length} items)`"
        >
          🗑️ Clear
        </button>
      </div>
    </div>

    <!-- Two Panel Layout -->
    <div class="flex-1 flex">
      <!-- Left Panel - Folder Tree -->
      <div class="w-64 border-r border-gray-200 bg-gray-50">
        <div class="p-3">
          <div class="space-y-1">
            <FolderTreeNode
              v-for="folder in rootFolders"
              :key="folder.id"
              :folder="folder"
              :current-path="currentPath"
              :all-folders="getAllFoldersFlat()"
              :expanded-folders="expandedFolders"
              @navigate="navigateToPath"
              @toggle-expanded="toggleFolderExpanded"
            />
          </div>
        </div>
      </div>

      <!-- Right Panel - Content -->
      <div class="flex-1 flex flex-col">
        <!-- Content Grid -->
        <div class="flex-1 overflow-y-auto p-3">
          <div
            class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-3"
          >
            <!-- Folders -->
            <div
              v-for="folder in currentFolders"
              :key="folder.id"
              @click="handleFolderClick(folder)"
              @dblclick="navigateToPath(`/folder/${folder.id}`)"
              @contextmenu.prevent="showFolderContextMenu($event, folder)"
              class="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow cursor-pointer group h-24"
              :class="
                selectedItems.some((item) => item.id === folder.id && item.type === 'folder')
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200'
              "
            >
              <div class="flex flex-col items-center text-center">
                <div class="text-3xl mb-2">{{ getFolderIcon(folder.name) }}</div>
                <h3 class="text-xs font-medium text-gray-900 truncate w-full" :title="folder.name">
                  {{ folder.name }}
                </h3>
              </div>
            </div>

            <!-- Files -->
            <div
              v-for="file in currentFiles"
              :key="file.id"
              @click="handleFileClick(file)"
              @dblclick="openFile(file)"
              @contextmenu.prevent="showFileContextMenu($event, file)"
              :class="[
                'bg-white rounded-lg shadow-sm border p-3 hover:shadow-md transition-shadow cursor-pointer group h-24',
                selectedItems.some((item) => item.id === file.id && item.type === 'file')
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200',
              ]"
            >
              <div class="flex flex-col items-center text-center">
                <div class="relative mb-2">
                  <div class="text-3xl">
                    {{ getFileIcon(file.mime_type, file.file_name).icon }}
                  </div>
                  <div
                    class="absolute -bottom-1 -right-1 text-xs font-bold px-1 py-0.5 rounded shadow-sm"
                    :class="[
                      getFileIcon(file.mime_type, file.file_name).label === 'CSV'
                        ? 'bg-emerald-500 text-white'
                        : getFileIcon(file.mime_type, file.file_name)
                            .color.replace('text-', 'bg-')
                            .replace('-600', '-500') + ' text-white',
                    ]"
                  >
                    {{ getFileIcon(file.mime_type, file.file_name).label }}
                  </div>
                </div>
                <h3
                  class="text-xs font-medium text-gray-900 truncate w-full"
                  :title="file.file_name"
                >
                  {{ file.file_name }}
                </h3>
                <p class="text-xs text-gray-500 mt-1">
                  {{ formatFileSize(file.file_size) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Status Bar -->
    <div
      class="flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-600"
    >
      <div class="flex items-center space-x-4">
        <span>{{ currentFolders.length }} folders</span>
        <span>{{ currentFiles.length }} files</span>
        <span>{{ currentItems.length }} total items</span>
      </div>
      <div class="flex items-center space-x-2">
        <span v-if="selectedItems.length > 0">{{ selectedItems.length }} selected</span>
        <span v-if="clipboard.length > 0">{{ clipboard.length }} in clipboard</span>
      </div>
    </div>

    <!-- Empty State - Hidden for now -->
    <!-- <div v-if="currentItems.length === 0 && !isLoading" class="text-center py-12">
      <svg
        class="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        ></path>
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">No files or folders</h3>
      <p class="mt-1 text-sm text-gray-500">
        This folder is empty. Upload files or create folders to get started.
      </p>
    </div> -->
  </div>

  <!-- Create Folder Dialog -->
  <div
    v-if="showCreateFolderDialog"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="showCreateFolderDialog = false"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">Create New Folder</h3>
      </div>
      <div class="px-6 py-4">
        <input
          v-model="newFolderName"
          type="text"
          placeholder="Folder name"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          @keyup.enter="createFolder"
        />
      </div>
      <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-3">
        <button
          @click="showCreateFolderDialog = false"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          @click="createFolder"
          :disabled="!newFolderName.trim()"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          Create
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import {
  filesApi,
  type FileUpload,
  type Folder,
  formatFileSize,
  getFileIcon,
  getFolderIcon,
} from '@/utils/files-api'
import FolderTreeNode from './FolderTreeNode.vue'

interface Props {
  projectId: number
  taskId?: number
  initialPath?: string
}

interface Emits {
  (e: 'file-selected', file: File): void
  (e: 'folder-created', folder: Folder): void
  (e: 'file-uploaded', file: FileUpload): void
}

const props = withDefaults(defineProps<Props>(), {
  initialPath: '/',
})

const emit = defineEmits<Emits>()

// State
const currentPath = ref(props.initialPath)
const folders = ref<Folder[]>([])
const files = ref<FileUpload[]>([])
const subfolders = ref<Folder[]>([])
const showCreateFolderDialog = ref(false)
const newFolderName = ref('')
const selectedItems = ref<Array<{ id: number; type: 'file' | 'folder' }>>([])
const clipboard = ref<
  Array<{ id: number; type: 'file' | 'folder'; action: 'copy' | 'cut'; newName?: string }>
>([])

// Track expanded folders in tree
const expandedFolders = ref<Set<number>>(new Set())

// Computed

const currentFolders = computed(() => {
  // For root level, show subfolders of Home (ID=1) instead of Home itself
  if (currentPath.value === '/') {
    return subfolders.value // Show Home's children, not Home itself
  }
  // For other paths, use subfolders from API
  return subfolders.value
})

const currentFiles = computed(() => {
  // Files are loaded from API and stored in files.value
  return files.value
})

const currentItems = computed(() => {
  return [...currentFolders.value, ...currentFiles.value]
})

const rootFolders = computed(() => {
  // Left panel shows the full hierarchical tree
  // For the root level, show only the Home folder (ID=1) and its children
  // This prevents showing "Home" as a separate item in the right panel
  const homeFolder = folders.value.find((f) => f.id === 1)
  if (homeFolder) {
    return [homeFolder]
  }
  // Fallback: show all root level folders if Home not found
  return folders.value.filter((f) => f.parent_id === null)
})

// Methods
function getAllFoldersFlat(): Folder[] {
  const flattened: Folder[] = []

  function flatten(folders: Folder[]) {
    for (const folder of folders) {
      flattened.push(folder)
      if (folder.children && folder.children.length > 0) {
        flatten(folder.children)
      }
    }
  }

  flatten(folders.value)
  return flattened
}

async function navigateToPath(path: string) {
  currentPath.value = path
  await loadCurrentPath()

  // Auto-expand tree to show current folder
  if (path !== '/') {
    // Use nextTick to ensure DOM is updated
    nextTick(() => {
      expandTreeToCurrentPath()
    })
  }
}

function expandTreeToCurrentPath() {
  if (currentPath.value === '/') return

  // Extract folder ID from current path
  const pathSegments = currentPath.value.split('/').filter(Boolean)
  let currentFolderId = null

  for (let i = 0; i < pathSegments.length; i++) {
    if (pathSegments[i] === 'folder' && i + 1 < pathSegments.length) {
      currentFolderId = parseInt(pathSegments[i + 1])
      break
    }
  }

  if (currentFolderId) {
    // Find all parent folders and expand them
    const parentIds = findParentFolderIds(currentFolderId)

    // Expand all parent folders
    parentIds.forEach((parentId) => {
      if (!expandedFolders.value.has(parentId)) {
        expandedFolders.value.add(parentId)
      }
    })

    // Trigger reactivity
    expandedFolders.value = new Set(expandedFolders.value)
  }
}

function findParentFolderIds(folderId: number): number[] {
  const parentIds: number[] = []
  let currentId = folderId

  // Find the folder in our flat list
  const allFolders = getAllFoldersFlat()

  while (currentId) {
    const folder = allFolders.find((f) => f.id === currentId)
    if (folder && folder.parent_id) {
      parentIds.unshift(folder.parent_id)
      currentId = folder.parent_id
    } else {
      break
    }
  }

  return parentIds
}

function toggleFolderExpanded(folderId: number) {
  if (expandedFolders.value.has(folderId)) {
    expandedFolders.value.delete(folderId)
  } else {
    expandedFolders.value.add(folderId)
  }
  // Trigger reactivity
  expandedFolders.value = new Set(expandedFolders.value)
}

async function loadCurrentPath() {
  try {
    // Load folder tree from API
    const folderTree = await filesApi.getFolderTree(props.projectId)
    // Store the hierarchical structure as-is, don't flatten it
    folders.value = folderTree

    // Load content of current folder
    if (currentPath.value === '/') {
      // For root, automatically navigate to Home folder (ID=1) to show its content
      // This prevents showing "Home" as a folder in the right panel
      const rootContent = await filesApi.getFolderContent(1) // Root folder ID is 1

      // Update files and subfolders with content from API
      files.value = rootContent.files || []
      subfolders.value = rootContent.subfolders || []

      // Auto-expand Home folder in the tree
      expandedFolders.value.add(1)
    } else {
      // Extract folder ID from path like "/folder/4"
      const pathSegments = currentPath.value.split('/').filter(Boolean)

      // Look for folder/ID pattern in path segments
      let folderId = null
      for (let i = 0; i < pathSegments.length; i++) {
        if (pathSegments[i] === 'folder' && i + 1 < pathSegments.length) {
          folderId = parseInt(pathSegments[i + 1])
          break
        }
      }

      if (folderId) {
        // Load content of the specific folder
        const folderContent = await filesApi.getFolderContent(folderId)

        // Update files and subfolders with content from API
        files.value = folderContent.files || []
        subfolders.value = folderContent.subfolders || []
      } else {
        files.value = []
        subfolders.value = []
      }
    }
  } catch (error) {
    console.error('Failed to load data from API:', error)
    console.log('📁 Working with in-memory data only')
    console.log('📁 Current folders:', folders.value.length)
    console.log('📁 Current files:', files.value.length)
  }
}

async function refreshCurrentPath() {
  await loadCurrentPath()
}

async function createFolder() {
  if (!newFolderName.value.trim()) return

  try {
    // Determine parent folder ID
    let parentId: number | undefined = undefined

    if (currentPath.value !== '/') {
      // Extract folder ID from current path
      const pathSegments = currentPath.value.split('/').filter(Boolean)
      for (let i = 0; i < pathSegments.length; i++) {
        if (pathSegments[i] === 'folder' && i + 1 < pathSegments.length) {
          parentId = parseInt(pathSegments[i + 1])
          break
        }
      }
    }

    // Create folder via API
    const folder = await filesApi.createFolder(
      newFolderName.value.trim(),
      props.projectId,
      parentId,
    )

    // Clear form
    showCreateFolderDialog.value = false
    newFolderName.value = ''

    // Refresh the folder tree and current path
    await loadCurrentPath()

    console.log('📁 Folder created via API:', folder)
    emit('folder-created', folder)
  } catch (error) {
    console.error('Failed to create folder:', error)
    alert('Failed to create folder. Please try again.')
  }
}

async function editFolder(folder: Folder) {
  const newName = prompt('Enter new folder name:', folder.name)
  if (!newName || newName.trim() === folder.name) return

  try {
    // Update folder in memory only
    const updatedFolder: Folder = {
      ...folder,
      name: newName.trim(),
      updated_at: new Date().toISOString(),
    }

    const index = folders.value.findIndex((f) => f.id === folder.id)
    if (index !== -1) {
      folders.value[index] = updatedFolder
    }

    console.log('📁 Folder renamed in memory:', updatedFolder)
  } catch (error) {
    console.error('Failed to update folder:', error)
    alert('Failed to rename folder. Please try again.')
  }
}

async function deleteFolder(folder: Folder) {
  if (
    !confirm(
      `Are you sure you want to delete folder "${folder.name}"? This will also delete all files inside.`,
    )
  ) {
    return
  }

  try {
    // Delete folder via API
    console.log('📁 Calling API to delete folder:', folder.id)
    const result = await filesApi.deleteFolder(folder.id)
    console.log('📁 API response:', result)

    if (result && result.message) {
      console.log('📁 Folder deleted via API:', result.message)
    } else {
      console.log('📁 Folder deleted via API (no message)')
    }

    // Refresh the folder tree and current path
    await loadCurrentPath()

    // Clear selection if deleted folder was selected
    selectedItems.value = selectedItems.value.filter((item) => item.id !== folder.id)
  } catch (error) {
    console.error('Failed to delete folder:', error)

    // Check if it's a 404 error (folder already deleted)
    if (error.response?.status === 404) {
      console.log('📁 Folder already deleted, refreshing interface...')
      // Refresh the interface anyway
      await loadCurrentPath()
      selectedItems.value = selectedItems.value.filter((item) => item.id !== folder.id)
      return
    }

    // Show specific error message from API
    if (error.response?.data?.error) {
      alert(`Failed to delete folder: ${error.response.data.error}`)
    } else {
      alert('Failed to delete folder. Please try again.')
    }
  }
}

async function downloadFile(file: FileUpload) {
  try {
    console.log('📄 Downloading file:', file.file_name)
    console.log('📄 File ID:', file.id)
    console.log('📄 Original name:', file.original_name)

    // Download file via API
    const blob = await filesApi.downloadFile(file.id)

    console.log('📄 Blob received:', {
      size: blob.size,
      type: blob.type,
    })

    // Create download link
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = file.original_name || file.file_name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    console.log('✅ File downloaded successfully:', file.file_name)
  } catch (error) {
    console.error('Failed to download file:', error)
    alert('Failed to download file. Please try again.')
  }
}

async function previewFile(file: FileUpload) {
  try {
    console.log('👁️ Previewing file:', file.file_name)
    console.log('📄 File mime_type:', file.mime_type)
    console.log('📄 File extension:', file.file_name.split('.').pop())

    // Check if file can be previewed in browser
    if (file.mime_type.startsWith('image/')) {
      console.log('🖼️ Image detected, opening in new tab')
      // For images, use preview endpoint (inline)
      const blob = await filesApi.previewFile(file.id)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      // Clean up URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    } else if (file.mime_type === 'application/pdf') {
      console.log('📄 PDF detected, opening in new tab')
      // For PDFs, use preview endpoint (inline)
      const blob = await filesApi.previewFile(file.id)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      // Clean up URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    } else {
      console.log('📁 Other file type, downloading')
      // For other files, download them
      await downloadFile(file)
    }

    console.log('✅ File previewed successfully:', file.file_name)
  } catch (error) {
    console.error('Failed to preview file:', error)
    alert('Failed to preview file. Please try again.')
  }
}

async function moveFile(file: FileUpload) {
  // TODO: Implement file move functionality
  alert('Move file functionality will be implemented')
}

async function deleteFile(file: FileUpload) {
  if (!confirm(`Are you sure you want to delete "${file.file_name}"?`)) {
    return
  }

  try {
    // Delete file via API
    console.log('📄 Deleting file via API:', file.file_name)
    await filesApi.deleteFile(file.id)

    console.log('✅ File deleted via API:', file.file_name)

    // Refresh the current path to update the interface
    await loadCurrentPath()

    // Clear selection if deleted file was selected
    selectedItems.value = selectedItems.value.filter((item) => item.id !== file.id)
  } catch (error) {
    console.error('Failed to delete file:', error)

    // Show specific error message from API
    if (error.response?.data?.error) {
      alert(`Failed to delete file: ${error.response.data.error}`)
    } else {
      alert('Failed to delete file. Please try again.')
    }
  }
}

function showFolderContextMenu(event: MouseEvent, folder: Folder) {
  // TODO: Implement context menu
  console.log('Folder context menu:', folder)
}

function showFileContextMenu(event: MouseEvent, file: FileUpload) {
  // TODO: Implement context menu
  console.log('File context menu:', file)
}

// Selection and clipboard methods
function toggleFileSelection(file: FileUpload) {
  const index = selectedItems.value.findIndex((item) => item.id === file.id && item.type === 'file')
  if (index >= 0) {
    selectedItems.value.splice(index, 1)
  } else {
    selectedItems.value.push({ id: file.id, type: 'file' })
  }
}

// Handle single click on folders
function handleFolderClick(folder: Folder) {
  // Clear other selections and select this folder
  selectedItems.value = [{ id: folder.id, type: 'folder' }]
  console.log('📁 Folder selected:', folder.name, 'Selected items:', selectedItems.value)
  console.log('📊 selectedItems.length:', selectedItems.value.length)
}

// Handle single click on files
function handleFileClick(file: FileUpload) {
  // Clear other selections and select this file
  selectedItems.value = [{ id: file.id, type: 'file' }]
  console.log('📄 File selected:', file.file_name, 'Selected items:', selectedItems.value)
  console.log('📊 selectedItems.length:', selectedItems.value.length)
}

// Keyboard shortcuts handler
function handleKeydown(event: KeyboardEvent) {
  // Check for modifier keys (Ctrl on Windows/Linux, Cmd on macOS)
  const isCtrlOrCmd = event.ctrlKey || event.metaKey

  if (isCtrlOrCmd) {
    switch (event.key.toLowerCase()) {
      case 'c':
        event.preventDefault()
        if (selectedItems.value.length > 0) {
          copySelected()
        }
        break
      case 'x':
        event.preventDefault()
        if (selectedItems.value.length > 0) {
          cutSelected()
        }
        break
      case 'v':
        event.preventDefault()
        if (clipboard.value.length > 0) {
          pasteItems()
        }
        break
      case 'a':
        event.preventDefault()
        selectAll()
        break
    }
  }

  // Delete key
  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault()
    if (selectedItems.value.length > 0) {
      deleteSelected()
    }
  }
}

// Select all items in current view
function selectAll() {
  const allItems = [
    ...currentFolders.value.map((folder) => ({ id: folder.id, type: 'folder' as const })),
    ...currentFiles.value.map((file) => ({ id: file.id, type: 'file' as const })),
  ]
  selectedItems.value = allItems
  console.log('📋 All items selected:', allItems.length)
}

// Clear clipboard manually
function clearClipboard() {
  clipboard.value = []
  console.log('🗑️ Clipboard cleared manually')
}

// Handle double click on files - open with system application
function openFile(file: FileUpload) {
  console.log('Opening file:', file.file_name)

  // Use our preview function for smart file handling
  previewFile(file)
}

// Create download link for file (for copy/paste functionality)
function createDownloadLink(file: FileUpload): string {
  // In a real system, this would create a proper download URL
  // For now, we'll create a data URL or blob URL
  const fileExtension = file.file_name.split('.').pop()?.toLowerCase()
  const mimeType = getMimeTypeFromExtension(fileExtension)

  // Create a simple text content for demonstration
  const content = `This is a mock file: ${file.file_name}\nSize: ${file.file_size} bytes\nType: ${file.mime_type}\nCreated: ${file.created_at}`

  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)

  return url
}

// Get MIME type from file extension
function getMimeTypeFromExtension(extension: string | undefined): string {
  const mimeTypes: { [key: string]: string } = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
  }

  return mimeTypes[extension || ''] || 'application/octet-stream'
}

async function deleteSelected() {
  console.log('🗑️ deleteSelected called, selectedItems:', selectedItems.value)

  if (selectedItems.value.length === 0) {
    console.log('❌ No items selected')
    return
  }

  const confirmMessage = `Are you sure you want to delete ${selectedItems.value.length} item(s)?`
  if (!confirm(confirmMessage)) {
    console.log('❌ User cancelled deletion')
    return
  }

  console.log('✅ User confirmed deletion, processing items...')

  // Delete selected items
  for (const item of selectedItems.value) {
    console.log('🗑️ Processing item:', item)
    console.log('🗑️ Item type:', item.type)
    console.log('🗑️ Item id:', item.id)

    if (item.type === 'file') {
      const file = files.value.find((f) => f.id === item.id)
      console.log('📄 Found file:', file)
      if (file) {
        console.log('📄 Deleting file:', file.file_name)
        await deleteFile(file)
      } else {
        console.log('❌ File not found in files.value')
      }
    } else if (item.type === 'folder') {
      // Search in both folders.value and subfolders.value
      let folder = folders.value.find((f) => f.id === item.id)
      if (!folder) {
        folder = subfolders.value.find((f) => f.id === item.id)
      }

      console.log('📁 Found folder:', folder)
      console.log(
        '📁 Available folders:',
        folders.value.map((f) => ({ id: f.id, name: f.name })),
      )
      console.log(
        '📁 Available subfolders:',
        subfolders.value.map((f) => ({ id: f.id, name: f.name })),
      )

      if (folder) {
        console.log('📁 Deleting folder:', folder.name)
        await deleteFolder(folder)
      } else {
        console.log('❌ Folder not found in folders.value or subfolders.value')
      }
    } else {
      console.log('❌ Unknown item type:', item.type)
    }
  }

  selectedItems.value = []
  console.log('✅ Selected items deleted')
}

function copySelected() {
  if (selectedItems.value.length === 0) {
    console.log('❌ No items selected for copy')
    return
  }

  // Store in internal clipboard for paste operations
  clipboard.value = selectedItems.value.map((item) => ({ ...item, action: 'copy' }))
  console.log('📋 Items copied to clipboard:', clipboard.value)
}

// Move selected items (permanent move in file system)
function moveSelected() {
  if (selectedItems.value.length === 0) {
    console.log('❌ No items selected for move')
    return
  }

  // For now, show a dialog to select destination
  // In real implementation, this would:
  // 1. Show folder picker
  // 2. Move files/folders to new location
  // 3. Update database with new paths

  console.log('📁 Moving items to new location:', selectedItems.value)
  alert(`Move ${selectedItems.value.length} items to new location (not implemented yet)`)
}

// Cut selected items (cut for paste - temporary operation)
function cutSelected() {
  if (selectedItems.value.length === 0) {
    console.log('❌ No items selected for cut')
    return
  }

  clipboard.value = selectedItems.value.map((item) => ({ ...item, action: 'cut' }))
  console.log('✂️ Items cut to clipboard:', clipboard.value)
}

// Check if file/folder exists in destination
function checkItemExists(
  item: { id: number; type: 'file' | 'folder' },
  destinationPath: string,
): boolean {
  if (item.type === 'file') {
    const file = files.value.find((f) => f.id === item.id)
    if (!file) return false

    const existingFile = files.value.find(
      (f) =>
        f.folder_path === destinationPath && f.file_name === file.file_name && f.id !== file.id,
    )
    return !!existingFile
  } else {
    const folder = folders.value.find((f) => f.id === item.id)
    if (!folder) return false

    const existingFolder = folders.value.find(
      (f) =>
        f.parent_path === destinationPath &&
        f.folder_name === folder.folder_name &&
        f.id !== folder.id,
    )
    return !!existingFolder
  }
}

// Handle file/folder name conflicts
function handleNameConflict(
  item: { id: number; type: 'file' | 'folder' },
  destinationPath: string,
): Promise<'replace' | 'rename' | 'cancel'> {
  return new Promise((resolve) => {
    const itemName =
      item.type === 'file'
        ? files.value.find((f) => f.id === item.id)?.file_name || 'Unknown'
        : folders.value.find((f) => f.id === item.id)?.folder_name || 'Unknown'

    const message = `${item.type === 'file' ? 'File' : 'Folder'} "${itemName}" already exists in destination.\n\nWhat would you like to do?`

    // Show more detailed dialog with options
    const action = prompt(
      message +
        '\n\nOptions:\n' +
        '1. Type "replace" to overwrite existing file/folder\n' +
        '2. Type "rename" to create with new name\n' +
        '3. Press Cancel to skip this item',
      'rename',
    )

    if (action === null) {
      resolve('cancel')
    } else if (action.toLowerCase() === 'replace') {
      resolve('replace')
    } else {
      resolve('rename')
    }
  })
}

// Generate unique name for file/folder
function generateUniqueName(
  originalName: string,
  destinationPath: string,
  type: 'file' | 'folder',
): string {
  const baseName = originalName.replace(/\.[^/.]+$/, '') // Remove extension
  const extension = type === 'file' ? originalName.match(/\.[^/.]+$/)?.pop() || '' : ''

  let counter = 1
  let newName = originalName

  while (true) {
    const exists =
      type === 'file'
        ? files.value.some((f) => f.folder_path === destinationPath && f.file_name === newName)
        : folders.value.some((f) => f.parent_path === destinationPath && f.folder_name === newName)

    if (!exists) break

    newName = `${baseName} (${counter})${extension}`
    counter++
  }

  return newName
}

function downloadSelected() {
  if (selectedItems.value.length === 0) {
    console.log('❌ No items selected for download')
    return
  }

  // Download selected files
  selectedItems.value.forEach(async (item) => {
    if (item.type === 'file') {
      const file = files.value.find((f) => f.id === item.id)
      if (file) {
        await downloadFile(file)
      }
    }
  })
}

async function pasteItems() {
  if (clipboard.value.length === 0) {
    console.log('❌ Clipboard is empty')
    return
  }
  console.log('📋 Pasting items:', clipboard.value)

  for (const item of clipboard.value) {
    console.log('Processing item:', item)

    // Check for conflicts
    if (checkItemExists(item, currentPath.value)) {
      const conflictResolution = await handleNameConflict(item, currentPath.value)

      if (conflictResolution === 'cancel') {
        console.log('❌ Operation cancelled by user')
        continue
      }

      if (conflictResolution === 'replace') {
        // Remove existing file/folder
        if (item.type === 'file') {
          const existingFile = files.value.find(
            (f) =>
              f.folder_path === currentPath.value &&
              f.file_name === files.value.find((f) => f.id === item.id)?.file_name,
          )
          if (existingFile) {
            const index = files.value.indexOf(existingFile)
            files.value.splice(index, 1)
            console.log('🗑️ Replaced existing file:', existingFile.file_name)
          }
        } else {
          const existingFolder = folders.value.find(
            (f) =>
              f.parent_path === currentPath.value &&
              f.folder_name === folders.value.find((f) => f.id === item.id)?.folder_name,
          )
          if (existingFolder) {
            const index = folders.value.indexOf(existingFolder)
            folders.value.splice(index, 1)
            console.log('🗑️ Replaced existing folder:', existingFolder.folder_name)
          }
        }
      } else if (conflictResolution === 'rename') {
        // Generate unique name
        const originalName =
          item.type === 'file'
            ? files.value.find((f) => f.id === item.id)?.file_name || 'Unknown'
            : folders.value.find((f) => f.id === item.id)?.folder_name || 'Unknown'

        const uniqueName = generateUniqueName(originalName, currentPath.value, item.type)
        console.log(`📝 Renaming to: ${uniqueName}`)

        // Store the new name for later use in paste operation
        // Don't modify the original item in clipboard
        item.newName = uniqueName
      }
    }

    if (item.type === 'file') {
      const file = files.value.find((f) => f.id === item.id)
      console.log('Found file:', file)
      if (file) {
        if (item.action === 'cut') {
          // Move file - update original file's path
          file.folder_path = currentPath.value
          file.updated_at = new Date().toISOString()
          // Use new name if it was generated for conflict resolution
          if (item.newName) {
            file.file_name = item.newName
          }
          console.log('File moved to:', currentPath.value)
        } else {
          // Copy file - create new instance with new path
          const newFile = {
            ...file,
            id: Date.now() + Math.random(),
            folder_path: currentPath.value,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          // Use new name if it was generated for conflict resolution
          if (item.newName) {
            newFile.file_name = item.newName
          }
          files.value.push(newFile)
          console.log('File copied to:', currentPath.value)
        }
      }
    } else if (item.type === 'folder') {
      const folder = folders.value.find((f) => f.id === item.id)
      console.log('Found folder:', folder)
      if (folder) {
        if (item.action === 'cut') {
          // Move folder
          folder.parent_path = currentPath.value === '/' ? undefined : currentPath.value
          // Use new name if it was generated for conflict resolution
          const folderName = item.newName || folder.folder_name
          folder.folder_name = folderName
          folder.parent_id = getCurrentFolderId()
          folder.updated_at = new Date().toISOString()
          console.log('Folder moved to:', currentPath.value)
        } else {
          // Copy folder (create new instance)
          const folderName = item.newName || folder.folder_name
          const newFolder = {
            ...folder,
            id: Date.now() + Math.random(),
            folder_name: folderName,
            parent_path: currentPath.value === '/' ? undefined : currentPath.value,
            path:
              currentPath.value === '/' ? `/${folderName}` : `${currentPath.value}/${folderName}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          folders.value.push(newFolder)
          console.log('Folder copied to:', currentPath.value)
        }
      }
    }
  }

  // Only clear clipboard if it contains cut operations
  const hasCutOperations = clipboard.value.some((item) => item.action === 'cut')
  if (hasCutOperations) {
    clipboard.value = []
    console.log('📋 Clipboard cleared (cut operations completed)')
  } else {
    console.log('📋 Clipboard preserved (copy operations - can paste again)')
  }

  // Force reactivity update
  console.log('Files after paste:', files.value.length)
  console.log('Folders after paste:', folders.value.length)
}

// Create new document function
async function createNewDocument() {
  // Trigger file input for document upload (interface only, no server)
  const input = document.createElement('input')
  input.type = 'file'

  // Allow only supported file types
  input.accept =
    '.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.md,.json,.xml,.png,.jpg,.jpeg,.gif,.svg,.zip,.rar,.7z,.tar,.gz,.dwg,.dxf,.skp,.step,.stp'
  input.multiple = true // Allow multiple files

  input.onchange = async (event) => {
    const target = event.target as HTMLInputElement
    const selectedFiles = Array.from(target.files || [])
    if (selectedFiles.length > 0) {
      await handleFilesSelected(selectedFiles)
    }
  }

  input.click()
}

// Check if file type is supported
function isFileTypeSupported(file: File): boolean {
  const supportedExtensions = [
    '.pdf',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.csv',
    '.ppt',
    '.pptx',
    '.txt',
    '.md',
    '.json',
    '.xml',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    '.zip',
    '.rar',
    '.7z',
    '.tar',
    '.gz',
    '.dwg',
    '.dxf',
    '.skp',
    '.step',
    '.stp',
  ]

  const fileName = file.name.toLowerCase()
  return supportedExtensions.some((ext) => fileName.endsWith(ext))
}

// Handle files selected for upload
async function handleFilesSelected(selectedFiles: File[]) {
  if (selectedFiles.length > 0) {
    // Filter only supported file types
    const supportedFiles = selectedFiles.filter(isFileTypeSupported)
    const unsupportedFiles = selectedFiles.filter((file) => !isFileTypeSupported(file))

    if (unsupportedFiles.length > 0) {
      console.warn(
        'Unsupported file types:',
        unsupportedFiles.map((f) => f.name),
      )
      alert(`Unsupported file types: ${unsupportedFiles.map((f) => f.name).join(', ')}`)
    }

    if (supportedFiles.length === 0) {
      return
    }

    // Get current path from FolderManager
    const currentFolderPath = currentPath.value || '/'

    // Upload files to server via API
    for (const file of supportedFiles) {
      try {
        console.log('📄 Uploading file:', file.name)
        // Determine category based on file type
        let category = 'document'
        if (file.type.startsWith('image/')) {
          category = 'image'
        } else if (file.type.includes('pdf')) {
          category = 'pdf'
        } else if (
          file.type.includes('excel') ||
          file.type.includes('spreadsheet') ||
          file.name.endsWith('.xls') ||
          file.name.endsWith('.xlsx')
        ) {
          category = 'spreadsheet'
        } else if (
          file.type.includes('word') ||
          file.name.endsWith('.doc') ||
          file.name.endsWith('.docx')
        ) {
          category = 'document'
        } else if (
          file.type.includes('powerpoint') ||
          file.name.endsWith('.ppt') ||
          file.name.endsWith('.pptx')
        ) {
          category = 'presentation'
        } else if (file.name.endsWith('.dwg') || file.name.endsWith('.dxf')) {
          category = 'drawing'
        } else if (file.type.includes('video/')) {
          category = 'video'
        } else if (file.type.includes('audio/')) {
          category = 'audio'
        } else if (
          file.type.includes('zip') ||
          file.type.includes('rar') ||
          file.type.includes('7z')
        ) {
          category = 'archive'
        }

        // Get current folder ID
        const currentFolderId = getCurrentFolderId()

        // Upload file via API
        const uploadedFile = await filesApi.uploadFile(file, currentFolderId, {
          fileName: file.name,
          description: '',
          category: category,
          version: '1.0',
        })

        console.log('✅ File uploaded successfully:', uploadedFile)

        // Refresh the current path to show the new file
        await loadCurrentPath()
      } catch (error) {
        console.error('❌ Failed to upload file:', file.name, error)
        alert(`Failed to upload file: ${file.name}`)
      }
    }
  }
}

// Helper function to get current folder ID
function getCurrentFolderId(): number {
  // For root level, return 1 (Home folder)
  if (currentPath.value === '/') {
    return 1
  }

  // Extract folder ID from current path (e.g., /folder/2)
  const pathSegments = currentPath.value.split('/').filter(Boolean)
  for (let i = 0; i < pathSegments.length; i++) {
    if (pathSegments[i] === 'folder' && i + 1 < pathSegments.length) {
      return parseInt(pathSegments[i + 1])
    }
  }

  // Default to root folder
  return 1
}

// Watch for path changes
watch(
  () => props.initialPath,
  (newPath) => {
    currentPath.value = newPath
    loadCurrentPath()
  },
  { immediate: true },
)

// Expose methods and state for parent component
defineExpose({
  showCreateFolderDialog,
  refreshCurrentPath,
  loadCurrentPath,
  folders,
  files,
  currentPath,
})
</script>

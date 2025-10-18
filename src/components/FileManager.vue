<template>
  <div class="h-full flex flex-col overflow-hidden" @keydown="handleKeydown" tabindex="0">
    <!-- Two Panel Layout -->
    <div class="flex-1 flex h-full">
      <!-- Left Panel - Folder Tree -->
      <div class="w-64 border-r border-gray-200 bg-gray-50 flex flex-col h-full">
        <div class="flex-1 overflow-y-auto p-3">
          <div class="space-y-1">
            <FolderTreeNode
              v-for="folder in rootFolders"
              :key="folder.id"
              :folder="folder"
              :current-path="currentPath"
              :all-folders="getAllFoldersFlat()"
              :expanded-folders="expandedFolders"
              :folder-files-count="folderFilesCount"
              @navigate="navigateToPath"
              @toggle-expanded="toggleFolderExpanded"
            />
          </div>
        </div>
      </div>

      <!-- Right Panel - Content -->
      <div class="flex-1 flex flex-col h-full" style="width: calc(100% - 256px)">
        <!-- Content Area -->
        <div class="flex-1 overflow-y-auto overflow-x-auto p-3">
          <!-- Icons View -->
          <div v-if="props.viewMode === 'icons'" class="flex flex-wrap gap-3">
            <!-- Folders -->
            <div
              v-for="folder in currentFolders"
              :key="folder.id"
              @click="handleFolderClick(folder)"
              @dblclick="navigateToPath(`/folder/${folder.id}`)"
              @contextmenu.prevent="showFolderContextMenu($event, folder)"
              class="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow cursor-pointer group h-24 w-24"
              :class="
                selectedItems.some((item) => item.id === folder.id && item.type === 'folder')
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200'
              "
            >
              <div class="flex flex-col items-center text-center h-full">
                <div class="text-3xl mb-2 flex-shrink-0">{{ getFolderIcon() }}</div>
                <h3
                  class="text-xs font-medium text-gray-900 truncate w-full flex-shrink-0"
                  :title="folder.name"
                >
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
                'bg-white rounded-lg shadow-sm border p-3 hover:shadow-md transition-shadow cursor-pointer group h-24 w-24',
                selectedItems.some((item) => item.id === file.id && item.type === 'file')
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200',
              ]"
            >
              <div class="flex flex-col items-center text-center h-full">
                <div class="relative mb-2 flex-shrink-0">
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
                  class="text-xs font-medium text-gray-900 truncate w-full flex-shrink-0"
                  :title="file.file_name"
                >
                  {{ file.file_name }}
                </h3>
                <p class="text-xs text-gray-500 mt-1 flex-shrink-0">
                  {{ formatFileSize(file.file_size) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Details View -->
          <div
            v-else-if="props.viewMode === 'details'"
            class="flex flex-col h-full overflow-hidden"
          >
            <!-- Content with Scroll -->
            <div
              v-if="currentItems.length > 0"
              class="flex-1 overflow-auto border border-gray-300"
              style="width: 100%"
            >
              <div style="width: 1200px; min-width: 1200px">
                <!-- Header -->
                <div
                  style="
                    display: flex;
                    background-color: #f5f5f5;
                    border-bottom: 1px solid #ddd;
                    width: 1200px;
                  "
                >
                  <div style="width: 400px; padding: 8px; font-weight: bold; color: #374151">
                    Name
                  </div>
                  <div
                    style="
                      width: 100px;
                      padding: 8px;
                      text-align: right;
                      font-weight: bold;
                      color: #374151;
                    "
                  >
                    Size
                  </div>
                  <div
                    style="
                      width: 120px;
                      padding: 8px;
                      text-align: right;
                      font-weight: bold;
                      color: #374151;
                    "
                  >
                    Type
                  </div>
                  <div
                    style="
                      width: 180px;
                      padding: 8px;
                      text-align: right;
                      font-weight: bold;
                      color: #374151;
                    "
                  >
                    Modified
                  </div>
                  <div style="width: 300px; padding: 8px; font-weight: bold; color: #374151">
                    Description
                  </div>
                  <div
                    style="
                      width: 100px;
                      padding: 8px;
                      text-align: right;
                      font-weight: bold;
                      color: #374151;
                    "
                  >
                    Actions
                  </div>
                </div>

                <!-- Content -->
                <!-- Folders -->
                <div
                  v-for="folder in currentFolders"
                  :key="`folder-${folder.id}`"
                  @click="handleFolderClick(folder)"
                  @dblclick="navigateToPath(`/folder/${folder.id}`)"
                  @contextmenu.prevent="showFolderContextMenu($event, folder)"
                  :class="
                    selectedItems.some((item) => item.id === folder.id && item.type === 'folder')
                      ? 'bg-blue-50'
                      : 'hover:bg-gray-50'
                  "
                  style="
                    display: flex;
                    cursor: pointer;
                    border-bottom: 1px solid #eee;
                    width: 100%;
                  "
                >
                  <div style="flex: 1; padding: 8px; display: flex; align-items: center">
                    <span style="margin-right: 12px; font-size: 18px">{{
                      getFolderIcon()
                    }}</span>
                    <span
                      style="
                        font-weight: 500;
                        color: #111827;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                        flex: 1;
                      "
                      :title="folder.name"
                      >{{ folder.name }}</span
                    >
                  </div>
                  <div style="width: 100px; min-width: 100px; text-align: right; padding: 8px; color: #6b7280"></div>
                  <div style="width: 120px; min-width: 120px; text-align: right; padding: 8px">
                    <span
                      style="
                        background: #f3f4f6;
                        color: #374151;
                        padding: 2px 8px;
                        border-radius: 12px;
                        font-size: 12px;
                        font-weight: 500;
                      "
                      >Folder</span
                    >
                  </div>
                  <div style="width: 180px; min-width: 180px; text-align: right; padding: 8px; color: #6b7280">
                    {{ formatDate(folder.created_at) }}
                  </div>
                  <div style="width: 300px; min-width: 300px; padding: 8px; color: #6b7280"></div>
                  <div style="width: 100px; min-width: 100px; text-align: right; padding: 8px">
                    <button
                      style="
                        color: #2563eb;
                        padding: 4px;
                        border-radius: 4px;
                        background: none;
                        border: none;
                        cursor: pointer;
                      "
                      title="Rename folder"
                    >
                      ✏️
                    </button>
                  </div>
                </div>

                <!-- Files -->
                <div
                  v-for="file in currentFiles"
                  :key="`file-${file.id}`"
                  @click="handleFileClick(file)"
                  @dblclick="openFile(file)"
                  @contextmenu.prevent="showFileContextMenu($event, file)"
                  :class="
                    selectedItems.some((item) => item.id === file.id && item.type === 'file')
                      ? 'bg-blue-50'
                      : 'hover:bg-gray-50'
                  "
                  style="
                    display: flex;
                    cursor: pointer;
                    border-bottom: 1px solid #eee;
                    width: 100%;
                  "
                >
                  <div style="flex: 1; padding: 8px; display: flex; align-items: center">
                    <span style="margin-right: 12px; font-size: 18px">{{
                      getFileIcon(file.mime_type, file.file_name).icon
                    }}</span>
                    <span
                      style="
                        font-weight: 500;
                        color: #111827;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                        flex: 1;
                      "
                      :title="file.file_name"
                      >{{ truncateFileName(file.file_name, 35) }}</span
                    >
                  </div>
                  <div style="width: 100px; min-width: 100px; text-align: right; padding: 8px; color: #111827">
                    {{ formatFileSize(file.file_size) }}
                  </div>
                  <div style="width: 120px; min-width: 120px; text-align: right; padding: 8px">
                    <span
                      class="text-xs font-bold px-2 py-1 rounded shadow-sm"
                      :class="[
                        getFileIcon(file.mime_type, file.file_name).label === 'CSV'
                          ? 'bg-emerald-500 text-white'
                          : getFileIcon(file.mime_type, file.file_name)
                              .color.replace('text-', 'bg-')
                              .replace('-600', '-500') + ' text-white',
                      ]"
                    >
                      {{ getFileIcon(file.mime_type, file.file_name).label }}
                    </span>
                  </div>
                  <div style="width: 180px; min-width: 180px; text-align: right; padding: 8px; color: #6b7280">
                    {{ formatDate(file.updated_at) }}
                  </div>
                  <div style="width: 300px; min-width: 300px; padding: 8px; color: #6b7280">
                    <span v-if="file.description" style="color: #6b7280">{{
                      file.description.length <= 30
                        ? file.description
                        : file.description.substring(0, 30) + '...'
                    }}</span>
                    <span
                      v-else
                      style="color: #9ca3af; cursor: pointer"
                      @click.stop="
                        startDescriptionEdit({
                          id: file.id,
                          type: 'file',
                          name: file.file_name,
                          description: file.description,
                        })
                      "
                      >Click to add</span
                    >
                  </div>
                  <div style="width: 100px; min-width: 100px; text-align: right; padding: 8px">
                    <button
                      @click.stop="
                        startDescriptionEdit({
                          id: file.id,
                          type: 'file',
                          name: file.file_name,
                          description: file.description,
                        })
                      "
                      style="
                        color: #16a34a;
                        padding: 4px;
                        border-radius: 4px;
                        background: none;
                        border: none;
                        cursor: pointer;
                        margin-right: 4px;
                      "
                      title="Edit description"
                    >
                      📝
                    </button>
                    <button
                      style="
                        color: #2563eb;
                        padding: 4px;
                        border-radius: 4px;
                        background: none;
                        border: none;
                        cursor: pointer;
                      "
                      title="Rename file"
                    >
                      ✏️
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-if="currentItems.length === 0" class="text-center py-12">
              <div class="text-gray-400 text-4xl mb-4">📁</div>
              <h3 class="text-lg font-medium text-gray-900 mb-2">No items</h3>
              <p class="text-gray-500">This folder is empty</p>
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
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
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

  <!-- Move Dialog -->
  <div
    v-if="showMoveDialog"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="cancelMove"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">Move Items</h3>
        <p class="text-sm text-gray-600 mt-1">
          Select destination folder for {{ moveItems.length }} item(s)
        </p>
      </div>
      <div class="px-6 py-4">
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2"> Destination Folder </label>
          <select
            v-model="moveDestinationFolderId"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option :value="null">Select a folder...</option>
            <option :value="1">/ Home</option>
            <option
              v-for="folder in getAllFoldersFlat().filter((f) => f.id !== 1)"
              :key="folder.id"
              :value="folder.id"
              :disabled="moveItems.some((item) => item.id === folder.id && item.type === 'folder')"
            >
              {{ getFolderPath(folder) }}
            </option>
          </select>
        </div>
        <div class="text-sm text-gray-600">
          <p class="font-medium">Items to move:</p>
          <ul class="mt-2 space-y-1">
            <li
              v-for="item in moveItems"
              :key="`${item.type}-${item.id}`"
              class="flex items-center"
            >
              <span class="mr-2">{{ item.type === 'file' ? '📄' : '📁' }}</span>
              <span>{{ getItemName(item) }}</span>
            </li>
          </ul>
        </div>
      </div>
      <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-3">
        <button
          @click="cancelMove"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          @click="executeMove"
          :disabled="!moveDestinationFolderId"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          Move
        </button>
      </div>
    </div>
  </div>

  <!-- Rename functionality is handled by parent ProjectDetail component -->

  <!-- Description Dialog -->
  <div
    v-if="showDescriptionDialog"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="cancelEdit"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">Edit Description</h3>
        <p class="text-sm text-gray-600 mt-1">
          {{ editItem?.type === 'file' ? 'File' : 'Folder' }}: "{{ editItem?.currentName }}"
        </p>
      </div>
      <div class="px-6 py-4">
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2"> Description </label>
          <textarea
            v-model="newDescription"
            rows="4"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="Enter description..."
          />
        </div>
      </div>
      <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-3">
        <button
          @click="cancelEdit"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          @click="executeDescriptionUpdate"
          class="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
        >
          Update Description
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
} from '@/core/utils/files-api'
import FolderTreeNode from './FolderTreeNode.vue'

interface Props {
  projectId: number
  taskId?: number
  initialPath?: string
  viewMode?: 'icons' | 'details'
}

interface Emits {
  (e: 'file-selected', file: File): void
  (e: 'folder-created', folder: Folder): void
  (e: 'file-uploaded', file: FileUpload): void
  (e: 'file-double-click', file: FileUpload): void
}

const props = withDefaults(defineProps<Props>(), {
  initialPath: '/',
  viewMode: 'icons',
})

const emit = defineEmits<Emits>()

// State
const currentPath = ref(props.initialPath)
const folders = ref<Folder[]>([])
const files = ref<FileUpload[]>([])
const subfolders = ref<Folder[]>([])
const folderStats = ref<Record<number, { files_count: number; subfolders_count: number }>>({})
const statsLoaded = ref(false) // Track if stats have been loaded
const showCreateFolderDialog = ref(false)
const newFolderName = ref('')
const selectedItems = ref<Array<{ id: number; type: 'file' | 'folder' }>>([])
const clipboard = ref<
  Array<{ id: number; type: 'file' | 'folder'; action: 'copy' | 'cut'; newName?: string }>
>([])

// Move dialog state
const showMoveDialog = ref(false)
const moveDestinationFolderId = ref<number | null>(null)
const moveItems = ref<Array<{ id: number; type: 'file' | 'folder' }>>([])

// Track expanded folders in tree
const expandedFolders = ref<Set<number>>(new Set())

// View mode is now passed as prop

// Edit dialogs state
const showDescriptionDialog = ref(false)
const editItem = ref<{
  id: number
  type: 'file' | 'folder'
  currentName: string
  currentDescription?: string
} | null>(null)
const newDescription = ref('')

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

// Compute files count for each folder
const folderFilesCount = computed(() => {
  const counts: Record<number, number> = {}

  // Use folder stats from server
  Object.entries(folderStats.value).forEach(([folderId, stats]) => {
    counts[parseInt(folderId)] = stats.files_count
  })

  return counts
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

// Rename file in tree structure
function renameFileInTree(fileId: number, newName: string) {
  // Find and rename file in tree
  const renameInFolder = (folderList: Folder[]): boolean => {
    for (const folder of folderList) {
      if (folder.files) {
        const fileIndex = folder.files.findIndex((f) => f.id === fileId)
        if (fileIndex !== -1) {
          folder.files[fileIndex].file_name = newName
          return true
        }
      }
      if (folder.children && renameInFolder(folder.children)) {
        return true
      }
    }
    return false
  }

  if (renameInFolder(folders.value)) {
    console.log('✏️ File renamed in tree structure:', fileId, '→', newName)
  } else {
    console.log('⚠️ File not found in tree for rename:', fileId)
  }
}

// Rename folder in tree structure
function renameFolderInTree(folderId: number, newName: string) {
  // Find and rename folder in tree
  const renameInParent = (folderList: Folder[]): boolean => {
    for (const folder of folderList) {
      if (folder.id === folderId) {
        folder.name = newName
        return true
      }
      if (folder.children && renameInParent(folder.children)) {
        return true
      }
    }
    return false
  }

  if (renameInParent(folders.value)) {
    console.log('✏️ Folder renamed in tree structure:', folderId, '→', newName)
  } else {
    console.log('⚠️ Folder not found in tree for rename:', folderId)
  }
}

async function navigateToPath(path: string) {
  currentPath.value = path

  // Load folder tree only if not loaded yet
  if (folders.value.length === 0) {
    await loadFolderTree()
  }

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

// Load folder statistics for tree indicators
async function loadFolderStats(forceReload = false) {
  // Skip if already loaded and not forcing reload
  if (statsLoaded.value && !forceReload) {
    console.log('📁 Folder stats already loaded, skipping')
    return
  }

  try {
    const allFolders = getAllFoldersFlat()
    const statsMap: Record<number, { files_count: number; subfolders_count: number }> = {}

    // Initialize all folders with zero counts
    allFolders.forEach((folder) => {
      statsMap[folder.id] = { files_count: 0, subfolders_count: 0 }
    })

    // Count subfolders and files for each folder from tree structure
    allFolders.forEach((folder) => {
      // Count subfolders
      if (folder.parent_id && statsMap[folder.parent_id]) {
        statsMap[folder.parent_id].subfolders_count++
      }

      // Count files if they exist in the tree structure
      if (folder.files && Array.isArray(folder.files)) {
        if (statsMap[folder.id]) {
          statsMap[folder.id].files_count = folder.files.length
        }
      }
    })

    folderStats.value = statsMap
    statsLoaded.value = true
    console.log('📁 Loaded folder stats from tree structure:', statsMap)
  } catch (error) {
    console.error('Failed to load folder stats:', error)
    folderStats.value = {}
    statsLoaded.value = false
  }
}

// Add new folder to tree structure
function addFolderToTree(newFolder: Folder) {
  const parentId = newFolder.parent_id

  if (parentId) {
    // Find parent folder and add child
    const addToParent = (folderList: Folder[]): boolean => {
      for (const folder of folderList) {
        if (folder.id === parentId) {
          if (!folder.children) {
            folder.children = []
          }
          folder.children.push(newFolder)
          return true
        }
        if (folder.children && addToParent(folder.children)) {
          return true
        }
      }
      return false
    }

    addToParent(folders.value)
  } else {
    // Add to root level
    folders.value.push(newFolder)
  }

  // Update folder stats
  if (folderStats.value[parentId || 0]) {
    folderStats.value[parentId || 0].subfolders_count++
  }

  console.log('📁 Folder added to tree structure:', newFolder)
}

// Add new file to tree structure
function addFileToTree(newFile: FileUpload) {
  const folderId = newFile.folder_id

  // Find folder and add file
  const addToFolder = (folderList: Folder[]): boolean => {
    for (const folder of folderList) {
      if (folder.id === folderId) {
        if (!folder.files) {
          folder.files = []
        }
        folder.files.push(newFile)
        return true
      }
      if (folder.children && addToFolder(folder.children)) {
        return true
      }
    }
    return false
  }

  addToFolder(folders.value)

  // Update folder stats
  if (folderStats.value[folderId]) {
    folderStats.value[folderId].files_count++
  }

  console.log('📄 File added to tree structure:', newFile)
}

// Remove file from tree structure
function removeFileFromTree(fileId: number) {
  // Find and remove file from tree
  const removeFromFolder = (folderList: Folder[]): boolean => {
    for (const folder of folderList) {
      if (folder.files) {
        const fileIndex = folder.files.findIndex((f) => f.id === fileId)
        if (fileIndex !== -1) {
          folder.files.splice(fileIndex, 1)

          // Update folder stats
          if (folderStats.value[folder.id]) {
            folderStats.value[folder.id].files_count--
          }

          console.log('📄 File removed from tree structure:', fileId)
          return true
        }
      }
      if (folder.children && removeFromFolder(folder.children)) {
        return true
      }
    }
    return false
  }

  removeFromFolder(folders.value)
}

// Remove folder from tree structure
function removeFolderFromTree(folderId: number) {
  // Find and remove folder from tree
  const removeFromParent = (folderList: Folder[]): boolean => {
    for (let i = 0; i < folderList.length; i++) {
      const folder = folderList[i]
      if (folder.id === folderId) {
        folderList.splice(i, 1)

        // Update parent folder stats
        if (folder.parent_id && folderStats.value[folder.parent_id]) {
          folderStats.value[folder.parent_id].subfolders_count--
        }

        console.log('📁 Folder removed from tree structure:', folderId)
        return true
      }
      if (folder.children && removeFromParent(folder.children)) {
        return true
      }
    }
    return false
  }

  removeFromParent(folders.value)
}

// Move file in tree structure
function moveFileInTree(fileId: number, newFolderId: number) {
  // Find and remove file from current location
  let fileToMove: FileUpload | null = null

  const removeFromFolder = (folderList: Folder[]): boolean => {
    for (const folder of folderList) {
      if (folder.files) {
        const fileIndex = folder.files.findIndex((f) => f.id === fileId)
        if (fileIndex !== -1) {
          fileToMove = folder.files[fileIndex]
          folder.files.splice(fileIndex, 1)

          // Update folder stats
          if (folderStats.value[folder.id]) {
            folderStats.value[folder.id].files_count--
          }

          console.log('📄 File removed from tree structure:', fileId)
          return true
        }
      }
      if (folder.children && removeFromFolder(folder.children)) {
        return true
      }
    }
    return false
  }

  if (removeFromFolder(folders.value) && fileToMove) {
    // Update file's folder_id
    (fileToMove as FileUpload).folder_id = newFolderId

    // Add file to new location
    addFileToTree(fileToMove)
    console.log('📄 File moved in tree structure:', fileId, 'to folder:', newFolderId)
  }
}

// Move folder in tree structure
function moveFolderInTree(folderId: number, newParentId: number) {
  // Find and remove folder from current location
  let folderToMove: Folder | null = null

  const removeFromParent = (folderList: Folder[]): boolean => {
    for (let i = 0; i < folderList.length; i++) {
      const folder = folderList[i]
      if (folder.id === folderId) {
        folderToMove = folderList.splice(i, 1)[0]

        // Update parent folder stats
        if (folder.parent_id && folderStats.value[folder.parent_id]) {
          folderStats.value[folder.parent_id].subfolders_count--
        }

        console.log('📁 Folder removed from tree structure:', folderId)
        return true
      }
      if (folder.children && removeFromParent(folder.children)) {
        return true
      }
    }
    return false
  }

  if (removeFromParent(folders.value) && folderToMove) {
    // Update folder's parent_id
    if (folderToMove) {
      (folderToMove as Folder).parent_id = newParentId
    }

    // Add folder to new location
    addFolderToTree(folderToMove)
    console.log('📁 Folder moved in tree structure:', folderId, 'to parent:', newParentId)
  }
}

// Copy file in tree structure
function copyFileInTree(fileId: number, newFolderId: number, newName?: string) {
  // Find file to copy
  let fileToCopy: FileUpload | null = null

  const findFile = (folderList: Folder[]): boolean => {
    for (const folder of folderList) {
      if (folder.files) {
        const file = folder.files.find((f) => f.id === fileId)
        if (file) {
          fileToCopy = { ...file }
          if (newName) {
            fileToCopy.file_name = newName
            fileToCopy.original_name = newName
          }
          return true
        }
      }
      if (folder.children && findFile(folder.children)) {
        return true
      }
    }
    return false
  }

  if (findFile(folders.value) && fileToCopy) {
    // Add copied file to new location
    addFileToTree(fileToCopy)
    console.log('📄 File copied in tree structure:', fileId, 'to folder:', newFolderId)
  }
}

// Copy folder in tree structure
function copyFolderInTree(folderId: number, newParentId: number, newName?: string) {
  // Find folder to copy
  let folderToCopy: Folder | null = null

  const findFolder = (folderList: Folder[]): boolean => {
    for (const folder of folderList) {
      if (folder.id === folderId) {
        folderToCopy = { ...folder }
        if (newName) {
          folderToCopy.name = newName
        }
        return true
      }
      if (folder.children && findFolder(folder.children)) {
        return true
      }
    }
    return false
  }

  if (findFolder(folders.value) && folderToCopy) {
    // Update folder's parent_id
    if (folderToCopy) {
      (folderToCopy as Folder).parent_id = newParentId
    }

    // Add copied folder to new location
    addFolderToTree(folderToCopy)
    console.log('📁 Folder copied in tree structure:', folderId, 'to parent:', newParentId)
  }
}

// Load initial folder tree from API (only once)
async function loadFolderTree() {
  try {
    // Load folder tree from API
    const folderTree = await filesApi.getFolderTree(props.projectId)
    // Store the hierarchical structure as-is, don't flatten it
    folders.value = folderTree

    // Load folder statistics for tree indicators
    await loadFolderStats()

    console.log('📁 Folder tree loaded:', folderTree)
  } catch (error) {
    console.error('Failed to load folder tree from API:', error)
    console.log('📁 Working with in-memory data only')
    console.log('📁 Current folders:', folders.value.length)
  }
}

async function loadCurrentPath() {
  // Load content of current folder from tree structure (no API calls)
  if (currentPath.value === '/') {
    // For root, automatically navigate to Home folder (ID=1) to show its content
    const homeFolder = folders.value.find((f) => f.id === 1)
    if (homeFolder) {
      // Get files and subfolders from tree structure
      files.value = homeFolder.files || []
      subfolders.value = homeFolder.children || []
    } else {
      files.value = []
      subfolders.value = []
    }

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
      // Find folder in tree structure
      const allFolders = getAllFoldersFlat()
      const targetFolder = allFolders.find((f) => f.id === folderId)

      if (targetFolder) {
        // Get files and subfolders from tree structure
        files.value = targetFolder.files || []
        subfolders.value = targetFolder.children || []
      } else {
        files.value = []
        subfolders.value = []
      }
    } else {
      files.value = []
      subfolders.value = []
    }
  }
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

    // Add new folder to tree structure
    addFolderToTree(folder)

    // Refresh current path to show new folder
    await loadCurrentPath()

    console.log('📁 Folder created via API:', folder)
    emit('folder-created', folder)
  } catch (error) {
    console.error('Failed to create folder:', error)
    alert('Failed to create folder. Please try again.')
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

    // Remove folder from tree structure
    removeFolderFromTree(folder.id)

    // Clear selection if deleted folder was selected
    selectedItems.value = selectedItems.value.filter((item) => item.id !== folder.id)

    console.log('✅ Folder deleted successfully:', folder.name)
  } catch (error: unknown) {
    console.error('Failed to delete folder:', error)

    // Check if it's a 404 error (folder already deleted)
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: { error?: string } } }
      if (axiosError.response?.status === 404) {
        console.log('📁 Folder already deleted, updating interface...')
        // Remove folder from tree structure anyway
        removeFolderFromTree(folder.id)
        selectedItems.value = selectedItems.value.filter((item) => item.id !== folder.id)
        return
      }

      // Show specific error message from API
      if (axiosError.response?.data?.error) {
        alert(`Failed to delete folder: ${axiosError.response.data.error}`)
      } else {
        alert('Failed to delete folder. Please try again.')
      }
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
  } catch (error: unknown) {
    console.error('Failed to download file:', error)
    console.error('Error details:', error)

    // Check if it's a 404 error
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number } }
      if (axiosError.response?.status === 404) {
        alert(
          `File not found on server. File ID: ${file.id}. The file may have been deleted or moved.`,
        )
      } else {
        alert('Failed to download file. Please try again.')
      }
    } else {
      alert('Failed to download file. Please try again.')
    }
  }
}

async function previewFile(file: FileUpload) {
  try {
    console.log('👁️ Previewing file:', file.file_name)
    console.log('📄 File ID:', file.id)
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
  } catch (error: unknown) {
    console.error('Failed to preview file:', error)
    console.error('Error details:', error)

    // Check if it's a 404 error
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number } }
      if (axiosError.response?.status === 404) {
        alert(
          `File not found on server. File ID: ${file.id}. The file may have been deleted or moved.`,
        )
      } else {
        alert('Failed to preview file. Please try again.')
      }
    } else {
      alert('Failed to preview file. Please try again.')
    }
  }
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

    // Remove file from tree structure
    removeFileFromTree(file.id)

    // Clear selection if deleted file was selected
    selectedItems.value = selectedItems.value.filter((item) => item.id !== file.id)

    console.log('✅ File deleted successfully:', file.file_name)
  } catch (error: unknown) {
    console.error('Failed to delete file:', error)

    // Show specific error message from API
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { error?: string } } }
      if (axiosError.response?.data?.error) {
        alert(`Failed to delete file: ${axiosError.response.data.error}`)
      } else {
        alert('Failed to delete file. Please try again.')
      }
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
          pasteToCurrentFolder()
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


// Format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

function truncateFileName(fileName: string, maxLength: number = 30): string {
  if (fileName.length <= maxLength) {
    return fileName
  }

  // Find the last dot to get the extension
  const lastDotIndex = fileName.lastIndexOf('.')
  if (lastDotIndex === -1) {
    // No extension, just truncate
    return fileName.substring(0, maxLength - 3) + '...'
  }

  const extension = fileName.substring(lastDotIndex)
  const nameWithoutExt = fileName.substring(0, lastDotIndex)

  // If extension is too long, just truncate the whole name
  if (extension.length > maxLength - 3) {
    return fileName.substring(0, maxLength - 3) + '...'
  }

  // Calculate how much space we have for the name part
  const availableForName = maxLength - extension.length - 3 // 3 for '...'

  if (nameWithoutExt.length <= availableForName) {
    return fileName
  }

  return nameWithoutExt.substring(0, availableForName) + '...' + extension
}


// Rename functionality is handled by parent ProjectDetail component

// Start description edit process
function startDescriptionEdit(item: {
  id: number
  type: 'file' | 'folder'
  name: string
  description?: string
}) {
  editItem.value = {
    id: item.id,
    type: item.type,
    currentName: item.name,
    currentDescription: item.description || '',
  }
  newDescription.value = item.description || ''
  showDescriptionDialog.value = true
}

// Rename functionality is handled by parent ProjectDetail component

// Execute description update
async function executeDescriptionUpdate() {
  if (!editItem.value || editItem.value.type !== 'file') return

  try {
    const updatedFile = await filesApi.updateFileDescription(
      editItem.value.id,
      newDescription.value.trim(),
    )
    // Update local file data
    const fileIndex = files.value.findIndex((f) => f.id === editItem.value!.id)
    if (fileIndex !== -1) {
      files.value[fileIndex] = updatedFile
    }
    console.log('✅ File description updated')

    // Close dialog
    showDescriptionDialog.value = false
    editItem.value = null
    newDescription.value = ''

    // Refresh current folder content
    await loadCurrentPath()
  } catch (error: unknown) {
    console.error('❌ Error during description update:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    alert(`❌ Error during description update: ${errorMessage}`)
  }
}

// Cancel edit operations (only for description now)
function cancelEdit() {
  showDescriptionDialog.value = false
  editItem.value = null
  newDescription.value = ''
}

// Handle double click on files - open with system application
function openFile(file: FileUpload) {
  console.log('Opening file:', file.file_name)

  // Emit double-click event to parent
  emit('file-double-click', file)

  // Use our preview function for smart file handling
  previewFile(file)
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


// Execute move operation
async function executeMove() {
  console.log('📁 executeMove called')
  console.log('📁 moveDestinationFolderId:', moveDestinationFolderId.value)
  console.log('📁 moveItems:', moveItems.value)

  if (!moveDestinationFolderId.value || moveItems.value.length === 0) {
    console.log('❌ No destination folder selected or no items to move')
    return
  }

  try {
    console.log(
      '📁 Executing move operation:',
      moveItems.value,
      'to folder:',
      moveDestinationFolderId.value,
    )

    for (const item of moveItems.value) {
      if (item.type === 'file') {
        // Move file via API
        console.log('📁 Moving file via API:', item.id, 'to folder:', moveDestinationFolderId.value)
        await filesApi.moveFile(item.id, moveDestinationFolderId.value)

        // Update tree structure
        moveFileInTree(item.id, moveDestinationFolderId.value)

        console.log('✅ File moved via API:', item.id)
      } else if (item.type === 'folder') {
        // Move folder via API
        console.log(
          '📁 Moving folder via API:',
          item.id,
          'to parent:',
          moveDestinationFolderId.value,
        )
        await filesApi.moveFolder(item.id, moveDestinationFolderId.value)

        // Update tree structure
        moveFolderInTree(item.id, moveDestinationFolderId.value)

        console.log('✅ Folder moved via API:', item.id)
      }
    }

    // Store count before clearing
    const movedCount = moveItems.value.length

    // Close dialog and refresh
    showMoveDialog.value = false
    moveItems.value = []
    moveDestinationFolderId.value = null

    // Clear selection
    selectedItems.value = []

    // Show success message
    alert(`✅ Successfully moved ${movedCount} item(s)`)

    console.log('✅ Move operation completed successfully')
  } catch (error: unknown) {
    console.error('❌ Error during move operation:', error)

    // Check if it's a 500 error (backend not implemented)
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number }; message?: string }
      if (axiosError.response?.status === 500) {
        alert(
          `❌ Move operations are not yet implemented on the backend.\n\nPlease wait for backend implementation.\n\nError: ${axiosError.message || 'Unknown error'}`,
        )
      } else {
        // Show user-friendly error message for other errors
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        alert(`❌ Error during move operation: ${errorMessage}`)
      }
    } else {
      // Show user-friendly error message for other errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`❌ Error during move operation: ${errorMessage}`)
    }
  }
}

// Cancel move operation
function cancelMove() {
  showMoveDialog.value = false
  moveItems.value = []
  moveDestinationFolderId.value = null
}

// Helper functions for move dialog
function getItemName(item: { id: number; type: 'file' | 'folder' }): string {
  if (item.type === 'file') {
    // Search in all files (including nested ones)
    const allFolders = getAllFoldersFlat()
    for (const folder of allFolders) {
      if (folder.files) {
        const file = folder.files.find((f) => f.id === item.id)
        if (file) {
          return truncateFileName(file.file_name, 30)
        }
      }
    }
    return 'Unknown file'
  } else {
    // Search in all folders (including nested ones)
    const allFolders = getAllFoldersFlat()
    const folder = allFolders.find((f) => f.id === item.id)
    return folder?.name || 'Unknown folder'
  }
}

function getFolderPath(folder: Folder): string {
  const pathParts: string[] = []
  let current = folder
  let depth = 0

  console.log(
    '🔍 Building path for folder:',
    folder.name,
    'ID:',
    folder.id,
    'Parent ID:',
    folder.parent_id,
  )

  // Build path from current folder to root
  while (current && depth < 10) {
    // Prevent infinite loops
    pathParts.unshift(current.name)
    console.log('  Step', depth, ':', current.name, 'Parent ID:', current.parent_id)

    if (current.parent_id) {
      // Find parent folder in the flattened list
      const parent = getAllFoldersFlat().find((f) => f.id === current.parent_id)
      if (parent) {
        current = parent
        depth++
      } else {
        console.log('  Parent not found for ID:', current.parent_id)
        break
      }
    } else {
      break
    }
  }

  const fullPath = '/' + pathParts.join('/')
  console.log('  Final path:', fullPath)
  return fullPath
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
): boolean {
  if (item.type === 'file') {
    const file = files.value.find((f) => f.id === item.id)
    if (!file) return false

    const existingFile = files.value.find(
      (f) =>
        f.folder_id === getCurrentFolderId() && f.file_name === file.file_name && f.id !== file.id,
    )
    return !!existingFile
  } else {
    const folder = folders.value.find((f) => f.id === item.id)
    if (!folder) return false

    const existingFolder = folders.value.find(
      (f) =>
        f.parent_id === getCurrentFolderId() &&
        f.name === folder.name &&
        f.id !== folder.id,
    )
    return !!existingFolder
  }
}

// Handle file/folder name conflicts
function handleNameConflict(
  item: { id: number; type: 'file' | 'folder' },
): Promise<'replace' | 'rename' | 'cancel'> {
  return new Promise((resolve) => {
    const itemName =
      item.type === 'file'
        ? files.value.find((f) => f.id === item.id)?.file_name || 'Unknown'
        : folders.value.find((f) => f.id === item.id)?.name || 'Unknown'

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
        ? files.value.some((f) => f.folder_id === getCurrentFolderId() && f.file_name === newName)
        : folders.value.some((f) => f.parent_id === getCurrentFolderId() && f.name === newName)

    if (!exists) break

    newName = `${baseName} (${counter})${extension}`
    counter++
  }

  return newName
}


async function pasteToCurrentFolder() {
  if (clipboard.value.length === 0) {
    console.log('❌ Clipboard is empty')
    return
  }
  console.log('📋 Pasting items to current folder:', clipboard.value)

  // Execute paste directly to current folder without dialog
  await executePasteToFolder(getCurrentFolderId())
}

// Execute paste to specific folder (without dialog)
async function executePasteToFolder(destinationFolderId: number) {
  if (clipboard.value.length === 0) {
    console.log('❌ No items to paste')
    return
  }

  try {
    console.log('🔍 Starting paste operation to folder:', destinationFolderId)
    console.log('🔍 Clipboard items:', clipboard.value)

    for (const item of clipboard.value) {
      console.log('Processing item:', item)

      // Check for conflicts
      if (checkItemExists(item)) {
        const conflictResolution = await handleNameConflict(item)

        if (conflictResolution === 'cancel') {
          console.log('❌ Operation cancelled by user')
          continue
        }

        if (conflictResolution === 'replace') {
          // Remove existing file/folder
          if (item.type === 'file') {
            const existingFile = files.value.find(
              (f) =>
                f.folder_id === getCurrentFolderId() &&
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
                f.parent_id === getCurrentFolderId() &&
                f.name === folders.value.find((f) => f.id === item.id)?.name,
            )
            if (existingFolder) {
              const index = folders.value.indexOf(existingFolder)
              folders.value.splice(index, 1)
              console.log('🗑️ Replaced existing folder:', existingFolder.name)
            }
          }
        } else if (conflictResolution === 'rename') {
          // Generate unique name
          const originalName =
            item.type === 'file'
              ? files.value.find((f) => f.id === item.id)?.file_name || 'Unknown'
              : folders.value.find((f) => f.id === item.id)?.name || 'Unknown'

          const uniqueName = generateUniqueName(originalName, currentPath.value, item.type)
          console.log(`📝 Renaming to: ${uniqueName}`)

          // Store the new name for later use in paste operation
          // Don't modify the original item in clipboard
          item.newName = uniqueName
        }
      }

      if (item.type === 'file') {
        if (item.action === 'cut') {
          // Move file via API
          console.log('📁 Moving file via API:', item.id, 'to folder:', destinationFolderId)
          await filesApi.moveFile(item.id, destinationFolderId)

          // Update tree structure
          moveFileInTree(item.id, destinationFolderId)

          console.log('✅ File moved via API:', item.id)
        } else {
          // Copy file via API
          console.log('📋 Copying file via API:', item.id, 'to folder:', destinationFolderId)
          const newName = item.newName || undefined
          const copiedFile = await filesApi.copyFile(item.id, destinationFolderId, newName)

          // Update tree structure
          copyFileInTree(item.id, destinationFolderId, newName)

          console.log('✅ File copied via API:', copiedFile.file_name)
        }
      } else if (item.type === 'folder') {
        if (item.action === 'cut') {
          // Move folder via API
          console.log('📁 Moving folder via API:', item.id, 'to parent:', destinationFolderId)
          await filesApi.moveFolder(item.id, destinationFolderId)

          // Update tree structure
          moveFolderInTree(item.id, destinationFolderId)

          console.log('✅ Folder moved via API:', item.id)
        } else {
          // Copy folder via API
          console.log('📋 Copying folder via API:', item.id, 'to parent:', destinationFolderId)
          const newName = item.newName || undefined
          const copiedFolder = await filesApi.copyFolder(item.id, destinationFolderId, newName)

          // Update tree structure
          copyFolderInTree(item.id, destinationFolderId, newName)

          console.log('✅ Folder copied via API:', copiedFolder.name)
        }
      }
    }

    // Store count before clearing clipboard
    const itemCount = clipboard.value.length
    const hasCutOperations = clipboard.value.some((item) => item.action === 'cut')

    // Only clear clipboard if it contains cut operations
    if (hasCutOperations) {
      clipboard.value = []
      console.log('📋 Clipboard cleared (cut operations completed)')
    } else {
      console.log('📋 Clipboard preserved (copy operations - can paste again)')
    }

    // Show success message
    const operationType = hasCutOperations ? 'moved' : 'copied'
    alert(`✅ Successfully ${operationType} ${itemCount} item(s)`)

    console.log('✅ Paste operation completed successfully')
  } catch (error: unknown) {
    console.error('❌ Error during paste operation:', error)

    // Check if it's a 500 error (backend not implemented)
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number }; message?: string }
      if (axiosError.response?.status === 500) {
        alert(
          `❌ Copy/Paste operations are not yet implemented on the backend.\n\nPlease use the Move button instead, or wait for backend implementation.\n\nError: ${axiosError.message || 'Unknown error'}`,
        )
      } else {
        // Show user-friendly error message for other errors
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        alert(`❌ Error during paste operation: ${errorMessage}`)
      }
    } else {
      // Show user-friendly error message for other errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`❌ Error during paste operation: ${errorMessage}`)
    }

    // Clear clipboard on error to prevent retry issues
    clipboard.value = []
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
  async (newPath) => {
    currentPath.value = newPath

    // Load folder tree only if not loaded yet
    if (folders.value.length === 0) {
      await loadFolderTree()
    }

    await loadCurrentPath()
  },
  { immediate: true },
)

// Expose methods and state for parent component
defineExpose({
  showCreateFolderDialog,
  loadCurrentPath,
  loadFolderTree,
  addFolderToTree,
  addFileToTree,
  removeFileFromTree,
  removeFolderFromTree,
  moveFileInTree,
  moveFolderInTree,
  renameFileInTree,
  renameFolderInTree,
  getAllFoldersFlat,
  folders,
  files,
  currentPath,
  selectedItems,
  clipboard,
})
</script>

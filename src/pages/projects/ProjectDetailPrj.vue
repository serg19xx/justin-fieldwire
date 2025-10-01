<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/core/stores/auth'
import {
  projectApi,
  type Project as ApiProject,
  type ProjectTeamMember,
} from '@/core/utils/project-api'
import { tasksApi } from '@/core/utils/tasks-api'
import type { Task } from '@/core/types/task'
import ProjectCalendar from '@/components/ProjectCalendar.vue'
import AddTeamMemberDialog from '@/components/AddTeamMemberDialog.vue'
import FileUploadDialog from '@/components/FileUploadDialog.vue'
import FileManager from '@/components/FileManager.vue'
import {
  exportTasksToICal as exportTasksToICalUtil,
  downloadFile as downloadFileUtil,
} from '@/core/utils/task-utils'
import { filesApi, type FileUpload, type Folder } from '@/core/utils/files-api'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// Emits
// const emit = defineEmits<{
//   createTask: []
// }>()

// Project data
const project = ref<Project | null>(null)
const projects = ref<Project[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const calendarRef = ref()

// Navigation state
const activeSection = ref<'plans' | 'tasks' | 'photos' | 'team' | 'settings'>('plans')

// Settings form state
const settingsForm = ref({
  name: '',
  address: '',
  priority: 'low',
  status: 'draft',
  startDate: '',
  endDate: '',
})
const isSavingSettings = ref(false)

// Team state
const teamMembers = ref<ProjectTeamMember[]>([])
const loadingTeam = ref(false)
const showAddTeamMemberDialog = ref(false)

// Export state
const isExporting = ref(false)

// Search state
const selectedTask = ref<Task | null>(null)
const searchQuery = ref('')
const isSearching = ref(false)
const allTasks = ref<Task[]>([])

// Files state
const showFileUploadDialog = ref(false)
const selectedFile = ref<File | null>(null)
const isUploading = ref(false)
const uploadProgress = ref(0)
const currentFolderPath = ref('/')
const folderManagerRef = ref()

// Folder Manager state
const selectedItems = ref<Array<{ id: number; type: 'file' | 'folder' }>>([])
const clipboard = ref<
  Array<{ id: number; type: 'file' | 'folder'; action: 'copy' | 'cut'; newName?: string }>
>([])
const viewMode = ref<'icons' | 'details'>('icons')
// const showCreateFolderDialog = ref(false) // Removed - not used
const showMoveDialog = ref(false)
const moveItems = ref<Array<{ id: number; type: 'file' | 'folder' }>>([])
const moveDestinationFolderId = ref<number | null>(null)
const folders = ref<Folder[]>([])
const files = ref<FileUpload[]>([])
const fileManagerKey = ref(0)

// Sync with FileManager state
watch(
  () => folderManagerRef.value?.selectedItems,
  (newItems) => {
    if (newItems) {
      selectedItems.value = newItems
    }
  },
  { deep: true },
)

watch(
  () => folderManagerRef.value?.clipboard,
  (newClipboard) => {
    if (newClipboard) {
      clipboard.value = newClipboard
    }
  },
  { deep: true },
)

// Sync back to FileManager when we change selectedItems or clipboard
watch(
  selectedItems,
  (newItems) => {
    if (folderManagerRef.value) {
      folderManagerRef.value.selectedItems = newItems
    }
  },
  { deep: true },
)

watch(
  clipboard,
  (newClipboard) => {
    if (folderManagerRef.value) {
      folderManagerRef.value.clipboard = newClipboard
    }
  },
  { deep: true },
)

// Computed properties for button states
const hasSelectedItems = computed(() => selectedItems.value.length > 0)
const hasClipboardItems = computed(() => clipboard.value.length > 0)
const selectedFilesCount = computed(
  () => selectedItems.value.filter((item) => item.type === 'file').length,
)
// const selectedFoldersCount = computed(
//   () => selectedItems.value.filter((item) => item.type === 'folder').length,
// ) // Removed - not used
const hasSelectedFiles = computed(() => selectedFilesCount.value > 0)
// const hasSelectedFolders = computed(() => selectedFoldersCount.value > 0) // Removed - not used

// Button availability logic
const canDelete = computed(() => hasSelectedItems.value)
const canMove = computed(() => hasSelectedItems.value)
const canRename = computed(() => hasSelectedItems.value)
const canCut = computed(() => hasSelectedItems.value)
const canCopy = computed(() => hasSelectedItems.value)
const canPaste = computed(() => hasClipboardItems.value)
const canClear = computed(() => hasClipboardItems.value)
const canDownload = computed(() => hasSelectedFiles.value)

// Calendar state
const selectedEvent = ref<{
  id: string
  title: string
  start: Date
  end?: Date
  description?: string
  assignee?: string
  priority?: string
} | null>(null)
const showEventModal = ref(false)

// Debug: watch activeSection changes
watch(activeSection, (newSection) => {
  console.log('📱 Active section changed to:', newSection)
})

// Project interface (mapped from API)
interface Project {
  id: number
  name: string
  address: string
  priority: string
  startDate: string
  endDate: string
  status: string
  projectManager?: number
  description?: string
  createdAt: string
  updatedAt: string
}

// Load project data
// Load all projects for the dropdown
async function loadProjects() {
  try {
    console.log('🚀 Loading projects for dropdown...')
    console.log('👤 Current user:', authStore.currentUser)

    const filters: Record<string, unknown> = {}

    // If user is Project Manager, filter by their ID
    // Temporarily disabled to test API
    // if (authStore.currentUser?.user_type === 'Project Manager') {
    //   filters.prj_manager = authStore.currentUser.id
    //   console.log('🔍 Filtering by PM ID:', authStore.currentUser.id)
    // } else {
    //   console.log('👑 System Administrator - loading all projects')
    // }

    console.log('🔧 Testing without filters first')

    console.log('📋 Filters:', filters)

    console.log('📤 Request params:', { page: 1, limit: 100, filters })

    const response = await projectApi.getAll(1, 100, filters)

    console.log('📦 Projects API response:', response)

    projects.value = response.projects.map((apiProject: ApiProject) => ({
      id: apiProject.id,
      name: apiProject.prj_name,
      address: apiProject.address,
      priority: apiProject.priority,
      startDate: apiProject.date_start,
      endDate: apiProject.date_end,
      status: apiProject.status,
      projectManager: apiProject.prj_managger || undefined, // cspell:ignore managger
      description: '',
      createdAt: apiProject.created_at,
      updatedAt: apiProject.updated_at,
    }))

    console.log('✅ Mapped projects:', projects.value)
  } catch (error) {
    console.error('❌ Error loading projects:', error)
  }
}

async function loadProject() {
  const projectId = route.params.id as string
  console.log('🎯 Loading project with ID:', projectId)

  if (!projectId) {
    error.value = 'Project ID not found'
    return
  }

  loading.value = true
  error.value = null

  try {
    console.log('📡 Calling projectApi.getById...')
    const apiResponse = await projectApi.getById(parseInt(projectId))
    console.log('📦 Raw API response:', apiResponse)
    console.log('🔍 API response structure:', {
      hasId: 'id' in apiResponse,
      keys: Object.keys(apiResponse),
    })

    // Map API data to frontend format
    project.value = {
      id: apiResponse.id,
      name: apiResponse.prj_name,
      address: apiResponse.address,
      priority: apiResponse.priority,
      startDate: apiResponse.date_start,
      endDate: apiResponse.date_end,
      status: apiResponse.status,
      projectManager: apiResponse.prj_managger || undefined, // cspell:ignore managger
      description: '',
      createdAt: apiResponse.created_at,
      updatedAt: apiResponse.updated_at,
    }
    console.log('✅ Project loaded successfully:', project.value)
    console.log('🔍 Project ID type:', typeof project.value.id, 'value:', project.value.id)
  } catch (apiError: unknown) {
    console.error('❌ Error loading project:', apiError)
    error.value = 'Failed to load project'
  } finally {
    loading.value = false
  }
}

// Navigation functions
function setActiveSection(section: 'plans' | 'tasks' | 'photos' | 'team' | 'settings') {
  console.log('🔄 Switching to section:', section)
  console.log('🔍 Current project state:', {
    hasProject: !!project.value,
    projectId: project.value?.id,
    projectName: project.value?.name,
  })
  activeSection.value = section

  // Load settings form when switching to settings
  if (section === 'settings' && project.value) {
    loadSettingsForm()
  }

  // Load team members when switching to team
  if (section === 'team' && project.value) {
    loadTeamMembers()
  }
}

// Switch to different project
function switchProject(projectId: number) {
  router.push(`/projects/${projectId}`)
}

// Project action functions (now handled through navigation)
// function archiveProject() {
//   console.log('🗑️ Archive project:', project.value?.id)
//   // TODO: Implement project archiving
//   if (confirm('Are you sure you want to archive this project?')) {
//     // Archive logic here
//   }
// }

// Settings functions
function loadSettingsForm() {
  if (project.value) {
    settingsForm.value = {
      name: project.value.name,
      address: project.value.address,
      priority: project.value.priority,
      status: project.value.status,
      startDate: project.value.startDate,
      endDate: project.value.endDate,
    }
  }
}

async function saveSettings() {
  if (!project.value) return

  isSavingSettings.value = true

  try {
    const updateData = {
      prj_name: settingsForm.value.name.trim(),
      address: settingsForm.value.address.trim(),
      priority: settingsForm.value.priority,
      status: settingsForm.value.status,
      date_start: settingsForm.value.startDate,
      date_end: settingsForm.value.endDate,
    }

    await projectApi.update(project.value.id, updateData)

    // Reload project data
    await loadProject()

    alert('Project settings saved successfully!')
  } catch (error: unknown) {
    console.error('❌ Error saving project:', error)
    alert('Failed to save project settings. Please try again.')
  } finally {
    isSavingSettings.value = false
  }
}

function resetSettings() {
  loadSettingsForm()
}

const canEditProject = computed(() => {
  const userType = authStore.currentUser?.user_type
  const canEdit = userType === 'Project Manager' || userType === 'System Administrator'
  console.log('🔧 canEditProject check:', { userType, canEdit, currentUser: authStore.currentUser })

  // Temporary: always return true for debugging
  console.log('🔧 FORCING canEditProject to true for debugging')
  return true
})

// Team functions
async function loadTeamMembers() {
  if (!project.value) return

  loadingTeam.value = true

  try {
    console.log('👥 Loading team members for project:', project.value.id)

    // Try to load from API first
    try {
      const response = await projectApi.getTeamMembers(project.value.id)
      teamMembers.value = response.team_members
      console.log('✅ Team members loaded from API:', teamMembers.value.length)
    } catch {
      console.log('⚠️ API not available, using mock data')

      // Fallback to mock data
      teamMembers.value = [
        {
          id: 1,
          project_id: project.value.id,
          user_id: 1,
          role: 'lead',
          added_at: '2025-01-15T10:00:00Z',
          added_by: 1,
          name: 'John Smith',
          email: 'john.smith@example.com',
          user_type: 'Project Manager',
          job_title: 'Senior Project Manager',
          status: 1,
        },
        {
          id: 2,
          project_id: project.value.id,
          user_id: 2,
          role: 'member',
          added_at: '2025-01-20T10:00:00Z',
          added_by: 1,
          name: 'Sarah Johnson',
          email: 'sarah.johnson@example.com',
          user_type: 'Architect',
          job_title: 'Lead Architect',
          status: 1,
        },
        {
          id: 3,
          project_id: project.value.id,
          user_id: 3,
          role: 'member',
          added_at: '2025-01-25T10:00:00Z',
          added_by: 1,
          name: 'Mike Davis',
          email: 'mike.davis@example.com',
          user_type: 'Engineer',
          job_title: 'Senior Engineer',
          status: 1,
        },
      ]
      console.log('✅ Team members loaded from mock data:', teamMembers.value.length)
    }
  } catch (error) {
    console.error('❌ Error loading team members:', error)
    teamMembers.value = []
  } finally {
    loadingTeam.value = false
  }
}

// Calendar functions
function handleEventClick(event: unknown) {
  console.log('📅 Event clicked:', event)
  const eventInfo = event as {
    id: string
    title: string
    start: Date
    end?: Date
    extendedProps?: {
      description?: string
      assignee?: string
      priority?: string
    }
  }
  selectedEvent.value = {
    id: eventInfo.id,
    title: eventInfo.title,
    start: eventInfo.start,
    end: eventInfo.end,
    description: eventInfo.extendedProps?.description || '',
    assignee: eventInfo.extendedProps?.assignee || '',
    priority: eventInfo.extendedProps?.priority || 'medium',
  }
  showEventModal.value = true
}

function handleDateClick(info: unknown) {
  console.log('📅 Date clicked:', info)
  // TODO: Open dialog to create new event
  const dateInfo = info as { dateStr: string }
  alert(`Create new task on ${dateInfo.dateStr}`)
}

function handleEventDrop(info: unknown) {
  console.log('📅 Event moved:', info)
  // TODO: Update event in backend
  const eventInfo = info as { event: { title: string; start: Date } }
  alert(`Event "${eventInfo.event.title}" moved to ${eventInfo.event.start.toDateString()}`)
}

function handleEventResize(info: unknown) {
  console.log('📅 Event resized:', info)
  // TODO: Update event duration in backend
  const eventInfo = info as { event: { title: string } }
  alert(`Event "${eventInfo.event.title}" duration updated`)
}

function closeEventModal() {
  showEventModal.value = false
  selectedEvent.value = null
}

// Section-specific action functions

// File management functions

// Folder Manager functions
async function createNewDocument() {
  // Trigger file input for document upload (interface only, no server)
  const input = document.createElement('input')
  input.type = 'file'
  input.multiple = true
  input.accept = '.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.svg,.zip,.rar'

  input.onchange = (event) => {
    const files = (event.target as HTMLInputElement).files
    if (files && files.length > 0) {
      handleFilesSelected(Array.from(files))
    }
  }

  input.click()
}

async function deleteSelected() {
  if (selectedItems.value.length === 0) {
    alert('Please select items to delete')
    return
  }

  const confirmed = confirm(
    `Are you sure you want to delete ${selectedItems.value.length} item(s)?`,
  )
  if (!confirmed) return

  try {
    for (const item of selectedItems.value) {
      if (item.type === 'file') {
        await filesApi.deleteFile(item.id)
        // Remove from FileManager tree
        if (folderManagerRef.value) {
          folderManagerRef.value.removeFileFromTree?.(item.id)
        }
      } else if (item.type === 'folder') {
        await filesApi.deleteFolder(item.id)
        // Remove from FileManager tree
        if (folderManagerRef.value) {
          folderManagerRef.value.removeFolderFromTree?.(item.id)
        }
      }
    }

    selectedItems.value = []
  } catch (error) {
    console.error('Error deleting items:', error)
    alert('Failed to delete items. Please try again.')
  }
}

function moveSelected() {
  if (selectedItems.value.length === 0) {
    alert('Please select items to move')
    return
  }

  moveItems.value = [...selectedItems.value]
  showMoveDialog.value = true
}

function cutSelected() {
  if (selectedItems.value.length === 0) {
    alert('Please select items to cut')
    return
  }

  // Clear clipboard first
  clipboard.value = []

  // Add items to clipboard with 'cut' action
  selectedItems.value.forEach((item) => {
    clipboard.value.push({
      id: item.id,
      type: item.type,
      action: 'cut',
    })
  })

  console.log('📋 Items cut to clipboard:', clipboard.value)
  selectedItems.value = []
}

function copySelected() {
  if (selectedItems.value.length === 0) {
    alert('Please select items to copy')
    return
  }

  // Clear clipboard first
  clipboard.value = []

  // Add items to clipboard with 'copy' action
  selectedItems.value.forEach((item) => {
    clipboard.value.push({
      id: item.id,
      type: item.type,
      action: 'copy',
    })
  })

  console.log('📋 Items copied to clipboard:', clipboard.value)
  selectedItems.value = []
}

async function pasteToCurrentFolder() {
  if (clipboard.value.length === 0) {
    alert('Clipboard is empty')
    return
  }

  const currentFolderId = getCurrentFolderId()
  await executePasteToFolder(currentFolderId)
}

async function downloadSelected() {
  if (selectedItems.value.length === 0) {
    alert('Please select items to download')
    return
  }

  // Download each selected file
  for (const item of selectedItems.value) {
    if (item.type === 'file') {
      try {
        // Get file from FileManager
        let file: FileUpload | undefined

        if (folderManagerRef.value?.files) {
          file = folderManagerRef.value.files.find((f: FileUpload) => f.id === item.id)
        }

        if (!file) {
          console.error('File not found:', item.id)
          alert(`File not found: ${item.id}`)
          continue
        }

        console.log('📥 Downloading file:', file.file_name)
        const blob = await filesApi.downloadFile(file.id)
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = file.original_name || file.file_name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        console.log('✅ File downloaded:', file.file_name)
      } catch (error) {
        console.error('❌ Error downloading file:', error)

        // Show more detailed error message
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as {
            response?: { status?: number; data?: { message?: string } }
            message?: string
          }
          console.error('❌ Download API Error:', axiosError.response?.data || axiosError.message)
          alert(
            `Failed to download file: ${axiosError.response?.data?.message || axiosError.message || 'Unknown error'}`,
          )
        } else {
          alert('Failed to download file. Please try again.')
        }
      }
    }
  }
}

function clearClipboard() {
  clipboard.value = []
  console.log('🗑️ Clipboard cleared manually')
}

async function renameSelected() {
  if (selectedItems.value.length === 0) {
    alert('Please select items to rename')
    return
  }

  // For now, only allow renaming one item at a time
  if (selectedItems.value.length > 1) {
    alert('Please select only one item to rename')
    return
  }

  const item = selectedItems.value[0]

  try {
    // Get current name
    let currentName = ''
    let fileExtension = ''

    if (item.type === 'file') {
      if (folderManagerRef.value?.files) {
        const file = folderManagerRef.value.files.find((f: FileUpload) => f.id === item.id)
        if (file) {
          // Use original_name to get the full filename with extension
          const fullName = file.original_name || file.file_name || 'Unknown file'
          // Extract file extension for security
          const lastDotIndex = fullName.lastIndexOf('.')
          if (lastDotIndex > 0) {
            fileExtension = fullName.substring(lastDotIndex)
            currentName = fullName.substring(0, lastDotIndex)
          } else {
            currentName = fullName
            fileExtension = ''
          }
        }
      }
    } else {
      if (folderManagerRef.value?.getAllFoldersFlat) {
        const allFolders = folderManagerRef.value.getAllFoldersFlat()
        const folder = allFolders.find((f: Folder) => f.id === item.id)
        currentName = folder?.name || 'Unknown folder'
      }
    }

    if (!currentName) {
      alert('Could not find item to rename')
      return
    }

    // Prompt for new name (only filename without extension for files)
    const promptText =
      item.type === 'file'
        ? `Enter new name for file (without extension${fileExtension ? ` "${fileExtension}"` : ''}):`
        : `Enter new name for folder:`

    const newName = prompt(promptText, currentName)
    if (!newName || newName.trim() === '' || newName === currentName) {
      return
    }

    // For files, add back the extension for security
    const finalName = item.type === 'file' ? newName.trim() + fileExtension : newName.trim()

    console.log(`✏️ Renaming ${item.type}:`, currentName, '→', finalName)

    if (item.type === 'file') {
      // Rename file via API
      await filesApi.renameFile(item.id, finalName)

      // Update in FileManager tree
      if (folderManagerRef.value) {
        folderManagerRef.value.renameFileInTree?.(item.id, finalName)
      }
    } else {
      // Rename folder via API
      await filesApi.renameFolder(item.id, finalName)

      // Update in FileManager tree
      if (folderManagerRef.value) {
        folderManagerRef.value.renameFolderInTree?.(item.id, finalName)
      }
    }

    console.log(`✅ ${item.type} renamed successfully`)
  } catch (error) {
    console.error('❌ Error renaming item:', error)

    // Show more detailed error message
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as {
        response?: { status?: number; data?: { message?: string } }
        message?: string
      }
      console.error('❌ Rename API Error:', axiosError.response?.data || axiosError.message)
      alert(
        `Failed to rename ${item.type}: ${axiosError.response?.data?.message || axiosError.message || 'Unknown error'}`,
      )
    } else {
      alert(`Failed to rename ${item.type}. Please try again.`)
    }
  }
}

// Move dialog functions
function cancelMove() {
  showMoveDialog.value = false
  moveItems.value = []
  moveDestinationFolderId.value = null
}

async function executeMove() {
  if (!moveDestinationFolderId.value) {
    alert('Please select a destination folder')
    return
  }

  try {
    for (const item of moveItems.value) {
      if (item.type === 'file') {
        await filesApi.moveFile(item.id, moveDestinationFolderId.value)
        // Update FileManager tree
        if (folderManagerRef.value) {
          folderManagerRef.value.moveFileInTree?.(item.id, moveDestinationFolderId.value)
        }
      } else if (item.type === 'folder') {
        await filesApi.moveFolder(item.id, moveDestinationFolderId.value)
        // Update FileManager tree
        if (folderManagerRef.value) {
          folderManagerRef.value.moveFolderInTree?.(item.id, moveDestinationFolderId.value)
        }
      }
    }

    selectedItems.value = []
    showMoveDialog.value = false
    moveItems.value = []
    moveDestinationFolderId.value = null
  } catch (error) {
    console.error('Error moving items:', error)
    alert('Failed to move items. Please try again.')
  }
}

// Helper functions for move dialog
function getAllFoldersFlat(): Folder[] {
  if (folderManagerRef.value) {
    return folderManagerRef.value.getAllFoldersFlat?.() || []
  }
  return []
}

function getFolderPath(folder: Folder): string {
  if (!folderManagerRef.value?.getAllFoldersFlat) {
    return `/${folder.name}`
  }

  const allFolders = folderManagerRef.value.getAllFoldersFlat()
  const pathParts: string[] = []

  // Build path from current folder to root
  let currentFolder = folder
  const visited = new Set<number>() // Prevent infinite loops

  while (currentFolder && !visited.has(currentFolder.id)) {
    visited.add(currentFolder.id)
    pathParts.unshift(currentFolder.name)

    if (currentFolder.parent_id) {
      currentFolder = allFolders.find((f: Folder) => f.id === currentFolder.parent_id)
    } else {
      break
    }
  }

  // Add root indicator
  if (pathParts.length === 0 || pathParts[0] !== 'Home') {
    pathParts.unshift('Home')
  }

  return '/' + pathParts.join('/')
}

function getItemName(item: { id: number; type: 'file' | 'folder' }): string {
  if (item.type === 'file') {
    // Get file from FileManager
    if (folderManagerRef.value?.files) {
      const file = folderManagerRef.value.files.find((f: FileUpload) => f.id === item.id)
      return file?.file_name || 'Unknown file'
    }
    return 'Unknown file'
  } else {
    // Get folder from FileManager's flat list
    if (folderManagerRef.value?.getAllFoldersFlat) {
      const allFolders = folderManagerRef.value.getAllFoldersFlat()
      const folder = allFolders.find((f: Folder) => f.id === item.id)
      return folder?.name || 'Unknown folder'
    }
    return 'Unknown folder'
  }
}

// Create new folder function
async function createNewFolder() {
  const folderName = prompt('Enter folder name:')
  if (!folderName || !folderName.trim()) {
    return
  }

  try {
    const currentFolderId = getCurrentFolderId()
    console.log('📁 Creating folder with parent_id:', currentFolderId)

    const newFolder = await filesApi.createFolder(
      folderName.trim(),
      project.value?.id || 0,
      currentFolderId,
    )

    // Add to local state
    folders.value.push(newFolder)

    // Add folder to FileManager's tree without full reload
    if (folderManagerRef.value) {
      // Try to add folder to FileManager's internal tree
      try {
        await folderManagerRef.value.addFolderToTree?.(newFolder)
        console.log('✅ Folder added to FileManager tree')
      } catch {
        console.log('FileManager addFolderToTree method not available, using key refresh')
        fileManagerKey.value++
      }
    } else {
      // Fallback to key refresh if no ref
      fileManagerKey.value++
    }

    console.log('✅ Folder created:', newFolder)
  } catch (error) {
    console.error('❌ Error creating folder:', error)

    // Show more detailed error message
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as {
        response?: { status?: number; data?: { message?: string } }
        message?: string
      }
      console.error('❌ API Error:', axiosError.response?.data || axiosError.message)
      alert(
        `Failed to create folder: ${axiosError.response?.data?.message || axiosError.message || 'Unknown error'}`,
      )
    } else {
      alert('Failed to create folder. Please try again.')
    }
  }
}

// Helper function to get current folder ID
function getCurrentFolderId(): number {
  // Try to get current path from FileManager component
  const fileManagerPath = folderManagerRef.value?.currentPath || currentFolderPath.value
  console.log('📁 Current path from FileManager:', fileManagerPath)

  // For root level, return 1 (Home folder)
  if (fileManagerPath === '/') {
    console.log('📁 Using root folder (ID: 1)')
    return 1
  }

  // Extract folder ID from path like "/folder/123"
  const pathSegments = fileManagerPath.split('/').filter(Boolean)
  for (let i = 0; i < pathSegments.length; i++) {
    if (pathSegments[i] === 'folder' && i + 1 < pathSegments.length) {
      const folderId = parseInt(pathSegments[i + 1])
      if (!isNaN(folderId)) {
        console.log('📁 Using folder ID:', folderId)
        return folderId
      }
    }
  }

  // Fallback to Home folder
  console.log('📁 Fallback to root folder (ID: 1)')
  return 1
}

// Execute paste to specific folder
async function executePasteToFolder(destinationFolderId: number) {
  if (clipboard.value.length === 0) {
    console.log('📋 Clipboard is empty, nothing to paste')
    return
  }

  try {
    for (const item of clipboard.value) {
      console.log('Processing item:', item)

      // Check for conflicts
      if (checkItemExists(item, currentFolderPath.value)) {
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
                f.file_path === currentFolderPath.value &&
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

          const uniqueName = generateUniqueName(originalName, currentFolderPath.value, item.type)
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

          // Remove from current location and add to new location
          if (folderManagerRef.value) {
            folderManagerRef.value.removeFileFromTree?.(item.id)
            // Note: We don't add it back because it's moved to a different folder
            // The user will need to navigate to the destination folder to see it
          }

          console.log('✅ File moved via API:', item.id)
        } else {
          // Copy file via API
          console.log('📋 Copying file via API:', item.id, 'to folder:', destinationFolderId)
          const newName = item.newName || undefined
          const copiedFile = await filesApi.copyFile(item.id, destinationFolderId, newName)

          // Add copied file to FileManager tree
          if (folderManagerRef.value) {
            folderManagerRef.value.addFileToTree?.(copiedFile)
          }

          console.log('✅ File copied via API:', copiedFile.file_name)
        }
      } else if (item.type === 'folder') {
        if (item.action === 'cut') {
          // Move folder via API
          console.log('📁 Moving folder via API:', item.id, 'to parent:', destinationFolderId)
          await filesApi.moveFolder(item.id, destinationFolderId)

          // Remove from current location
          if (folderManagerRef.value) {
            folderManagerRef.value.removeFolderFromTree?.(item.id)
            // Note: We don't add it back because it's moved to a different parent
            // The user will need to navigate to see the updated tree structure
          }

          console.log('✅ Folder moved via API:', item.id)
        } else {
          // Copy folder via API
          console.log('📋 Copying folder via API:', item.id, 'to parent:', destinationFolderId)
          const newName = item.newName || undefined
          const copiedFolder = await filesApi.copyFolder(item.id, destinationFolderId, newName)

          // Add copied folder to FileManager tree
          if (folderManagerRef.value) {
            folderManagerRef.value.addFolderToTree?.(copiedFolder)
          }

          console.log('✅ Folder copied via API:', copiedFolder.name)
        }
      }
    }

    // Store count before clearing clipboard
    // const itemCount = clipboard.value.length // Removed - not used
    const hasCutOperations = clipboard.value.some((item) => item.action === 'cut')

    // Only clear clipboard if it contains cut operations
    if (hasCutOperations) {
      clipboard.value = []
      console.log('📋 Clipboard cleared (cut operations completed)')
    } else {
      console.log('📋 Clipboard preserved (copy operations - can paste again)')
    }

    // Force FileManager to refresh to show changes
    if (folderManagerRef.value) {
      try {
        // For cut operations, we need to refresh the entire tree structure
        if (hasCutOperations) {
          await folderManagerRef.value.loadFolderTree?.()
          await folderManagerRef.value.loadCurrentPath?.()
          console.log('✅ FileManager tree refreshed after cut operations')
        } else {
          // For copy operations, just refresh current path
          await folderManagerRef.value.loadCurrentPath?.()
          console.log('✅ FileManager refreshed to show copied items')
        }
      } catch {
        console.log('⚠️ Could not refresh FileManager, forcing component refresh')
        // Fallback: force key change to refresh entire component
        fileManagerKey.value++
      }
    }

    console.log('✅ Paste operation completed successfully')
  } catch (error: unknown) {
    console.error('❌ Error during paste operation:', error)

    // Handle specific error cases
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number }; message?: string }
      if (axiosError.response?.status === 500) {
        alert(
          `❌ Copy/Paste operations are not yet implemented on the backend.\n\nPlease use the Move button instead, or wait for backend implementation.\n\nError: ${axiosError.message || 'Unknown error'}`,
        )
      } else {
        // Show user-friendly error message for other errors
        alert(
          `❌ Failed to paste items. Please try again.\n\nError: ${axiosError.message || 'Unknown error'}`,
        )
      }
    } else {
      // Show generic error message
      alert('❌ Failed to paste items. Please try again.')
    }
  }
}

// Helper functions for paste operations
function checkItemExists(
  item: { id: number; type: 'file' | 'folder' },
  currentPath: string,
): boolean {
  if (item.type === 'file') {
    const file = files.value.find((f: FileUpload) => f.id === item.id)
    if (file) {
      return files.value.some(
        (f: FileUpload) => f.file_path === currentPath && f.file_name === file.file_name,
      )
    }
  } else {
    const folder = folders.value.find((f: Folder) => f.id === item.id)
    if (folder) {
      return folders.value.some(
        (f: Folder) => f.parent_id === getCurrentFolderId() && f.name === folder.name,
      )
    }
  }
  return false
}

async function handleNameConflict(item: {
  id: number
  type: 'file' | 'folder'
}): Promise<'replace' | 'rename' | 'cancel'> {
  const itemName =
    item.type === 'file'
      ? files.value.find((f) => f.id === item.id)?.file_name || 'Unknown'
      : folders.value.find((f) => f.id === item.id)?.name || 'Unknown'

  const message = `"${itemName}" already exists in this location. What would you like to do?`
  const choice = confirm(
    `${message}\n\nClick OK to replace, Cancel to rename, or close to cancel operation.`,
  )

  if (choice) {
    return 'replace'
  } else {
    return 'rename'
  }
}

function generateUniqueName(
  originalName: string,
  currentPath: string,
  type: 'file' | 'folder',
): string {
  const nameWithoutExt =
    originalName.lastIndexOf('.') > 0
      ? originalName.substring(0, originalName.lastIndexOf('.'))
      : originalName
  const extension =
    originalName.lastIndexOf('.') > 0 ? originalName.substring(originalName.lastIndexOf('.')) : ''

  let counter = 1
  let newName = `${nameWithoutExt} (${counter})${extension}`

  while (checkItemExists({ id: -1, type }, currentPath)) {
    counter++
    newName = `${nameWithoutExt} (${counter})${extension}`
  }

  return newName
}

// Tree manipulation functions
// These functions are now handled by FileManager component
// moveFileInTree, moveFolderInTree, copyFileInTree, copyFolderInTree

async function handleFilesSelected(selectedFiles: File[]) {
  if (selectedFiles.length > 0) {
    // Get current path from FolderManager
    // const currentPath = folderManagerRef.value?.currentPath || '/' // Removed - not used

    // Upload files to server via API
    for (const file of selectedFiles) {
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

        // Add file to tree structure
        if (folderManagerRef.value) {
          folderManagerRef.value.addFileToTree?.(uploadedFile)
        }

        // Refresh the current path to show the new file
        if (folderManagerRef.value) {
          await folderManagerRef.value.loadCurrentPath?.()
        }
      } catch (error) {
        console.error('❌ Error uploading file:', error)
        alert(`Failed to upload ${file.name}. Please try again.`)
      }
    }
  }
}

async function handleFileUpload(data: {
  file: File
  formData: { fileName: string; description: string; category: string; version: string }
}) {
  if (!project.value?.id) return

  try {
    isUploading.value = true
    uploadProgress.value = 0

    const uploadedFile = await filesApi.uploadFile(data.file, getCurrentFolderId(), {
      fileName: data.formData.fileName,
      description: data.formData.description,
      category: data.formData.category,
      version: data.formData.version,
    })

    console.log('✅ File uploaded successfully:', uploadedFile)

    // Files will be refreshed by FolderManager

    // Close dialog
    showFileUploadDialog.value = false
    selectedFile.value = null

    alert('File uploaded successfully!')
  } catch (error) {
    console.error('❌ File upload failed:', error)
    alert('File upload failed. Please try again.')
  } finally {
    isUploading.value = false
    uploadProgress.value = 0
  }
}

function closeFileUploadDialog() {
  showFileUploadDialog.value = false
  selectedFile.value = null
  isUploading.value = false
  uploadProgress.value = 0
}

// Folder Manager event handlers
function handleFolderCreated(folder: Folder) {
  console.log('📁 Folder created:', folder)
}

function handleFileUploaded(file: FileUpload) {
  console.log('📄 File uploaded:', file)
}

// Handle file double-click for preview
function handleFileDoubleClick(file: FileUpload) {
  console.log('📄 Opening file for preview:', file.file_name)

  // Use the preview function from FileManager
  if (folderManagerRef.value) {
    folderManagerRef.value.previewFile?.(file)
  }
}

// Folder management functions

async function exportTasksToICalLocal() {
  if (!project.value?.id) {
    alert('No project selected')
    return
  }

  console.log('📅 Export tasks to iCal for project:', project.value.id)

  try {
    isExporting.value = true

    // Fetch tasks from API
    const tasksResponse = await tasksApi.getAll(project.value.id)
    const tasks = tasksResponse.tasks
    console.log('📋 Fetched tasks for export:', tasks.length)

    if (tasks.length === 0) {
      alert('No tasks found to export')
      return
    }

    // Generate iCal content
    const icalContent = exportTasksToICalUtil(tasks)

    // Create filename with project name and date
    const projectName = project.value.name.replace(/[^a-zA-Z0-9]/g, '_')
    const dateStr = new Date().toISOString().split('T')[0]
    const filename = `${projectName}_tasks_${dateStr}.ics`

    // Download the file
    downloadFileUtil(icalContent, filename, 'text/calendar')

    console.log('✅ iCal export completed:', filename)
    console.log('📄 iCal content preview:', icalContent.substring(0, 500) + '...')
  } catch (error) {
    console.error('❌ Export failed:', error)
    alert('Failed to export tasks. Please try again.')
  } finally {
    isExporting.value = false
  }
}

function uploadPhoto() {
  console.log('📸 Upload photo for project:', project.value?.id)
  // TODO: Open file upload dialog
  alert('Upload photo dialog will be implemented here')
}

function addTeamMember() {
  console.log('👥 Add team member for project:', project.value?.id)
  showAddTeamMemberDialog.value = true
}

// Load all tasks for search
async function loadTasksForSearch() {
  if (!project.value?.id) return

  try {
    isSearching.value = true
    const tasksResponse = await tasksApi.getAll(project.value.id)
    allTasks.value = tasksResponse.tasks
    console.log(`📋 Loaded ${allTasks.value.length} tasks for search`)
  } catch (error) {
    console.error('❌ Failed to load tasks for search:', error)
    allTasks.value = []
  } finally {
    isSearching.value = false
  }
}

// Filter tasks based on search query
const filteredTasks = computed(() => {
  if (!searchQuery.value.trim()) return []

  const query = searchQuery.value.toLowerCase()
  return allTasks.value.filter(
    (task) =>
      task.name.toLowerCase().includes(query) ||
      (task.notes && task.notes.toLowerCase().includes(query)) ||
      (task.wbs_path && task.wbs_path.toLowerCase().includes(query)),
  )
})

// Handle task selection
function handleTaskSelect(task: Task) {
  console.log('🎯 Selected task:', task.name)
  selectedTask.value = task

  // Switch to tasks section and navigate to the task
  activeSection.value = 'tasks'

  // Clear search
  searchQuery.value = ''

  // Navigate to task in calendar
  nextTick(() => {
    if (calendarRef.value && typeof calendarRef.value.searchTasks === 'function') {
      calendarRef.value.searchTasks(task.name)
    }
  })
}

// Handle team member added
function handleTeamMemberAdded(newMember: ProjectTeamMember) {
  console.log('👥 Team member added:', newMember)
  // Add new member to local data without full reload
  teamMembers.value.push(newMember)
}

// Edit role dialog state
const editRoleDialog = ref({
  isOpen: false,
  member: null as ProjectTeamMember | null,
  newRole: '',
})

// Role options
const roleOptions = [
  { value: 'member', label: 'Team Member' },
  { value: 'lead', label: 'Team Lead' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'coordinator', label: 'Coordinator' },
]

// Function to get default role based on user type
function getDefaultRoleForUserType(userType: string): string {
  switch (userType) {
    case 'Plumber':
    case 'Electrician':
    case 'Carpenter':
    case 'Mason':
    case 'Painter':
      return 'member'
    case 'Architect':
    case 'Engineer':
    case 'Project Manager':
      return 'lead'
    case 'Foreman':
    case 'Safety Inspector':
    case 'Quality Control':
      return 'supervisor'
    default:
      return 'member'
  }
}

// Function to get role status text for table display
function getRoleStatusText(member: ProjectTeamMember): string {
  const defaultRole = getDefaultRoleForUserType(member.user_type || '')

  if (member.role === defaultRole) {
    return 'Auto-assigned'
  } else {
    return 'Custom role'
  }
}

// Open edit role dialog
function openEditRoleDialog(member: ProjectTeamMember) {
  editRoleDialog.value = {
    isOpen: true,
    member,
    newRole: member.role,
  }
}

// Close edit role dialog
function closeEditRoleDialog() {
  editRoleDialog.value = {
    isOpen: false,
    member: null,
    newRole: '',
  }
}

// Save role changes
async function saveRoleChanges() {
  if (!editRoleDialog.value.member || !project.value) return

  try {
    console.log(
      '💾 Updating role for member:',
      editRoleDialog.value.member.id,
      'to:',
      editRoleDialog.value.newRole,
    )

    // Update role via API
    await projectApi.updateTeamMemberRole(
      project.value.id,
      editRoleDialog.value.member.id,
      editRoleDialog.value.newRole,
    )

    console.log('✅ Role updated successfully')

    // Update local data without full reload
    const memberIndex = teamMembers.value.findIndex(
      (m: ProjectTeamMember) => m.id === editRoleDialog.value.member!.id,
    )
    if (memberIndex > -1) {
      teamMembers.value[memberIndex] = {
        ...teamMembers.value[memberIndex],
        role: editRoleDialog.value.newRole,
      }
    }

    closeEditRoleDialog()
  } catch (error) {
    console.error('❌ Error updating role:', error)
    alert('Failed to update role. Please try again.')
  }
}

// Remove team member
async function removeTeamMember(member: ProjectTeamMember) {
  if (!project.value) return

  if (!confirm(`Are you sure you want to remove ${member.name} from the project team?`)) {
    return
  }

  try {
    console.log('🗑️ Removing team member:', member.id)

    // Remove member via API
    await projectApi.removeTeamMember(project.value.id, member.id)

    console.log('✅ Team member removed successfully')

    // Update local data without full reload
    const index = teamMembers.value.findIndex((m: ProjectTeamMember) => m.id === member.id)
    if (index > -1) {
      teamMembers.value.splice(index, 1)
    }
  } catch (error) {
    console.error('❌ Error removing team member:', error)
    alert('Failed to remove team member. Please try again.')
  }
}

// Handle task updates from calendar
function handleTaskUpdate(task: unknown) {
  console.log('📝 Task updated:', task)
  // TODO: Show notification or update UI
}

// Handle task duplication from calendar
function handleTaskDuplicate(task: unknown) {
  console.log('📋 Task duplicated:', task)
  // TODO: Show notification or update UI
}

// Helper functions
function getPriorityColor(priority?: string) {
  if (!priority) return 'bg-gray-100 text-gray-800'

  switch (priority.toLowerCase()) {
    case 'urgent':
      return 'bg-red-100 text-red-800'
    case 'high':
      return 'bg-orange-100 text-orange-800'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'low':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getStatusColor(status?: string) {
  if (!status) return 'bg-gray-100 text-gray-800'

  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'planning':
      return 'bg-blue-100 text-blue-800'
    case 'draft':
      return 'bg-gray-100 text-gray-800'
    case 'on-hold':
      return 'bg-yellow-100 text-yellow-800'
    case 'completed':
      return 'bg-purple-100 text-purple-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// function formatDate(dateString: string) {
//   return new Date(dateString).toLocaleDateString('en-US', {
//     year: 'numeric',
//     month: 'short',
//     day: 'numeric',
//   })
// }

// Load project on mount
onMounted(() => {
  loadProjects()
  loadProject()
})

// Load tasks and files when project is loaded
watch(
  project,
  (newProject) => {
    if (newProject) {
      loadTasksForSearch()
      // Files will be loaded by FolderManager
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="flex h-screen bg-gray-100">
    <!-- Left Sidebar -->
    <div class="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      <!-- Project Selector Header -->
      <div class="p-4 border-b border-gray-200">
        <div v-if="loading" class="animate-pulse">
          <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div class="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div v-else-if="error" class="text-red-600 text-sm">
          {{ error }}
        </div>
        <div v-else>
          <!-- Project Selector -->
          <div class="mb-3">
            <label class="block text-xs font-medium text-gray-700 mb-1"> Select Project </label>
            <select
              :value="project?.id"
              @change="switchProject(parseInt(($event.target as HTMLSelectElement).value))"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="" disabled>Choose a project...</option>
              <option v-for="proj in projects" :key="proj.id" :value="proj.id">
                {{ proj.name }}
              </option>
            </select>
          </div>

          <!-- Current Project Info -->
          <div v-if="project">
            <h2 class="text-lg font-semibold text-gray-900 truncate">
              {{ project.name }}
            </h2>
            <p class="text-sm text-gray-500 truncate">
              {{ project.address }}
            </p>
            <div class="flex items-center space-x-2 mt-2">
              <span
                :class="getPriorityColor(project.priority)"
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
              >
                {{ project.priority }}
              </span>
              <span
                :class="getStatusColor(project.status)"
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
              >
                {{ project.status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <div class="flex-1 overflow-y-auto">
        <!-- FIELD MANAGEMENT Section -->
        <div class="p-4">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            FIELD MANAGEMENT
          </h3>
          <nav class="space-y-1">
            <button
              @click="setActiveSection('plans')"
              :class="[
                'w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                activeSection === 'plans'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              ]"
            >
              <svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                ></path>
              </svg>
              Plans
            </button>

            <button
              @click="setActiveSection('tasks')"
              :class="[
                'w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                activeSection === 'tasks'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              ]"
            >
              <svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                ></path>
              </svg>
              Tasks
            </button>

            <button
              @click="setActiveSection('photos')"
              :class="[
                'w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                activeSection === 'photos'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              ]"
            >
              <svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                ></path>
              </svg>
              Photos
            </button>
            <button
              @click="setActiveSection('team')"
              :class="[
                'flex items-center px-3 py-2 rounded-md text-sm font-medium w-full text-left',
                activeSection === 'team'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              ]"
            >
              <svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                ></path>
              </svg>
              Team
            </button>
            <button
              @click="setActiveSection('settings')"
              :class="[
                'flex items-center px-3 py-2 rounded-md text-sm font-medium w-full text-left',
                activeSection === 'settings'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              ]"
            >
              <svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                ></path>
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                ></path>
              </svg>
              Settings
            </button>
          </nav>
        </div>

        <!-- Dynamic Section (will be populated based on active section) -->
        <div class="border-t border-gray-200 p-4">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {{ activeSection.toUpperCase() }}
          </h3>
          <div class="text-sm text-gray-500">
            <!-- This will be populated with dynamic content based on activeSection -->
            <p v-if="activeSection === 'plans'">Plans content will go here</p>
            <p v-if="activeSection === 'tasks'">Tasks content will go here</p>
            <p v-if="activeSection === 'photos'">Photos content will go here</p>
            <p v-if="activeSection === 'team'">Team content will go here</p>
            <p v-if="activeSection === 'settings'">Settings content will go here</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Content Header -->
      <div class="bg-white shadow-sm border-b border-gray-200 px-6 py-2">
        <div class="flex items-center justify-between">
          <!-- Dynamic Action Buttons -->
          <div>
            <!-- Plans Section Buttons -->
            <template v-if="activeSection === 'plans'">
              <div class="flex items-center space-x-2">
                <!-- Create Actions -->
                <button
                  @click="createNewFolder"
                  class="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors h-7 flex items-center"
                >
                  + New Folder
                </button>
                <button
                  @click="createNewDocument"
                  class="px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors h-7 flex items-center"
                >
                  + New Document
                </button>

                <!-- View Mode Toggle -->
                <div class="flex items-center space-x-1">
                  <button
                    @click="viewMode = 'icons'"
                    :class="
                      viewMode === 'icons' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
                    "
                    class="px-3 py-1.5 text-xs rounded-l hover:bg-blue-600 transition-colors h-7 flex items-center"
                    title="Icons View"
                  >
                    🗂️
                  </button>
                  <button
                    @click="viewMode = 'details'"
                    :class="
                      viewMode === 'details'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700'
                    "
                    class="px-3 py-1.5 text-xs rounded-r hover:bg-blue-600 transition-colors h-7 flex items-center"
                    title="Details View"
                  >
                    📋
                  </button>
                </div>

                <!-- Divider -->
                <div class="w-px h-6 bg-gray-300 mx-2"></div>

                <!-- File Actions -->
                <button
                  @click="deleteSelected"
                  :disabled="!canDelete"
                  class="px-3 py-1.5 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed h-7 flex items-center"
                  :title="`Delete (${selectedItems.length} selected) - Delete / Backspace`"
                >
                  Delete
                </button>
                <button
                  @click="moveSelected"
                  :disabled="!canMove"
                  class="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed h-7 flex items-center"
                  :title="`Move (${selectedItems.length} selected) - Permanent move to new location`"
                >
                  📁 Move
                </button>
                <button
                  @click="renameSelected"
                  :disabled="!canRename"
                  class="px-3 py-1.5 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed h-7 flex items-center"
                  :title="`Rename (${selectedItems.length} selected) - Rename selected items`"
                >
                  ✏️ Rename
                </button>
                <button
                  @click="cutSelected"
                  :disabled="!canCut"
                  class="px-3 py-1.5 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed h-7 flex items-center"
                  :title="`Cut (${selectedItems.length} selected) - Cut for paste - Ctrl+X / Cmd+X`"
                >
                  ✂️ Cut
                </button>
                <button
                  @click="copySelected"
                  :disabled="!canCopy"
                  class="px-3 py-1.5 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed h-7 flex items-center"
                  :title="`Copy (${selectedItems.length} selected) - Ctrl+C / Cmd+C`"
                >
                  📋 Copy
                </button>
                <button
                  @click="pasteToCurrentFolder"
                  :disabled="!canPaste"
                  class="px-3 py-1.5 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed h-7 flex items-center"
                  :title="`Paste (${clipboard.length} in clipboard) - Ctrl+V / Cmd+V${clipboard.some((item) => item.action === 'copy') ? ' (can paste multiple times)' : ''}`"
                >
                  📋 Paste
                </button>
                <button
                  @click="downloadSelected"
                  :disabled="!canDownload"
                  class="px-3 py-1.5 text-xs bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed h-7 flex items-center"
                  :title="`Download (${selectedItems.length} selected)`"
                >
                  ⬇️ Download
                </button>
                <button
                  @click="clearClipboard"
                  :disabled="!canClear"
                  class="px-3 py-1.5 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed h-7 flex items-center"
                  :title="`Clear Clipboard (${clipboard.length} items)`"
                >
                  🗑️ Clear
                </button>
              </div>
            </template>

            <!-- Tasks Section Buttons -->
            <template v-else-if="activeSection === 'tasks'">
              <div class="flex items-center space-x-2">
                <button
                  @click="exportTasksToICalLocal"
                  :disabled="isExporting"
                  :class="[
                    'px-4 py-2 rounded-md transition-colors text-sm font-medium flex items-center space-x-2',
                    isExporting
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700',
                  ]"
                  title="Export tasks to iCal format"
                >
                  <span v-if="isExporting" class="animate-spin">⏳</span>
                  <span v-else>📅</span>
                  <span>{{ isExporting ? 'Exporting...' : 'Export iCal' }}</span>
                </button>
              </div>
            </template>

            <!-- Photos Section Buttons -->
            <template v-else-if="activeSection === 'photos'">
              <button
                v-if="canEditProject"
                @click="uploadPhoto"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                + Upload Photo
              </button>
            </template>

            <!-- Team Section Buttons -->
            <template v-else-if="activeSection === 'team'">
              <button
                v-if="canEditProject"
                @click="addTeamMember"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                + Add Member
              </button>
            </template>

            <!-- Settings Section Buttons -->
            <template v-else-if="activeSection === 'settings'">
              <button
                v-if="canEditProject"
                @click="saveSettings"
                :disabled="isSavingSettings"
                class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                <span v-if="isSavingSettings" class="flex items-center">
                  <svg
                    class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </span>
                <span v-else>Save Changes</span>
              </button>
            </template>
          </div>

          <!-- Search Bar -->
          <div class="w-64 relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search tasks..."
              class="w-full pl-8 pr-10 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <svg
              class="absolute left-2.5 top-2 h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>

            <!-- Search Results Dropdown -->
            <div
              v-if="searchQuery.trim() && filteredTasks.length > 0"
              class="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto"
            >
              <div
                v-for="task in filteredTasks"
                :key="task.id"
                @click="handleTaskSelect(task)"
                class="px-3 py-2 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
              >
                <div class="flex items-center space-x-2">
                  <span class="text-xs">{{ task.milestone ? '🎯' : '📋' }}</span>
                  <div class="flex-1 min-w-0">
                    <div class="font-medium truncate">{{ task.name }}</div>
                    <div v-if="task.wbs_path" class="text-xs text-gray-500 truncate">
                      WBS: {{ task.wbs_path }}
                    </div>
                    <div v-if="task.notes" class="text-xs text-gray-500 truncate">
                      {{ task.notes }}
                    </div>
                  </div>
                  <span class="text-xs px-2 py-1 bg-gray-100 rounded">{{ task.status }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Content Body -->
      <div class="flex-1 overflow-y-auto px-6 pb-6">
        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center h-full">
          <div class="text-center">
            <svg
              class="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p class="text-gray-600">Loading project...</p>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="flex items-center justify-center h-full">
          <div class="text-center">
            <svg
              class="h-12 w-12 text-red-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <p class="text-red-600 mb-4">{{ error }}</p>
            <button
              @click="loadProject"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>

        <!-- Content based on active section -->
        <div
          v-else-if="project"
          class="flex-1 flex flex-col overflow-hidden"
          style="height: calc(100vh - 120px)"
        >
          <!-- Plans Section -->
          <div v-if="activeSection === 'plans'" class="flex-1 flex flex-col overflow-hidden h-full">
            <!-- Folder Manager -->
            <div class="bg-white rounded-lg shadow flex-1 w-full overflow-hidden mt-4 mb-4 h-full">
              <div class="h-full p-4">
                <FileManager
                  v-if="project?.id"
                  :key="fileManagerKey"
                  ref="folderManagerRef"
                  :project-id="project.id"
                  :initial-path="currentFolderPath"
                  :view-mode="viewMode"
                  @file-selected="(file: File) => handleFilesSelected([file])"
                  @folder-created="handleFolderCreated"
                  @file-uploaded="handleFileUploaded"
                  @file-double-click="handleFileDoubleClick"
                />
                <div v-else class="flex items-center justify-center h-full">
                  <div class="text-gray-500">Loading project...</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tasks Section -->
          <div v-else-if="activeSection === 'tasks'" class="flex-1 flex flex-col overflow-hidden">
            <!-- Calendar Component -->
            <ProjectCalendar
              v-if="project && project.id"
              ref="calendarRef"
              :project-id="project.id"
              :can-edit="canEditProject"
              @event-click="handleEventClick"
              @date-click="handleDateClick"
              @event-drop="handleEventDrop"
              @event-resize="handleEventResize"
              @task-update="handleTaskUpdate"
              @task-duplicate="handleTaskDuplicate"
            />
            <!-- Loading state for tasks -->
            <div v-else class="flex items-center justify-center h-64">
              <div class="text-center">
                <svg
                  class="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <p class="text-gray-600">Loading project tasks...</p>
                <p class="text-xs text-gray-500 mt-2">
                  Project state: {{ project ? 'Loaded' : 'Not loaded' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Photos Section -->
          <div v-else-if="activeSection === 'photos'" class="flex-1 flex flex-col overflow-hidden">
            <div class="bg-white rounded-lg shadow p-6">
              <p class="text-gray-500">Photos content will be implemented here</p>
            </div>
          </div>

          <!-- Team Section -->
          <div v-else-if="activeSection === 'team'" class="flex-1 flex flex-col overflow-hidden">
            <!-- Team Members List -->
            <div class="bg-white rounded-lg shadow">
              <!-- Loading State -->
              <div v-if="loadingTeam" class="p-6">
                <div class="flex items-center justify-center">
                  <svg class="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span class="ml-2 text-gray-600">Loading team members...</span>
                </div>
              </div>

              <!-- Team Members Table -->
              <div v-else-if="teamMembers.length > 0" class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th
                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Name
                      </th>
                      <th
                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        <div class="flex items-center">
                          <span>Role</span>
                          <div class="ml-1 group relative">
                            <svg
                              class="h-4 w-4 text-gray-400 cursor-help"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              ></path>
                            </svg>
                            <div
                              class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10"
                            >
                              Role in this project (not job title)
                              <div
                                class="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"
                              ></div>
                            </div>
                          </div>
                        </div>
                      </th>
                      <th
                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Join Date
                      </th>
                      <th
                        v-if="canEditProject"
                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-for="member in teamMembers" :key="member.id" class="hover:bg-gray-50">
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                          <div class="flex-shrink-0 h-10 w-10">
                            <div
                              class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center"
                            >
                              <span class="text-sm font-medium text-gray-700">
                                {{
                                  (member.name || 'Unknown')
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                }}
                              </span>
                            </div>
                          </div>
                          <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">
                              {{ member.name || 'Unknown User' }}
                            </div>
                            <div class="text-sm text-gray-500">
                              {{ member.email || 'No email' }}
                            </div>
                            <div class="text-xs text-gray-400">
                              {{ member.user_type || 'Unknown Type' }}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex flex-col">
                          <span
                            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            :class="{
                              'bg-blue-100 text-blue-800': member.role === 'lead',
                              'bg-green-100 text-green-800': member.role === 'member',
                              'bg-yellow-100 text-yellow-800': member.role === 'supervisor',
                              'bg-purple-100 text-purple-800': member.role === 'coordinator',
                              'bg-gray-100 text-gray-800': ![
                                'lead',
                                'member',
                                'supervisor',
                                'coordinator',
                              ].includes(member.role),
                            }"
                          >
                            {{
                              member.role === 'lead'
                                ? 'Team Lead'
                                : member.role === 'member'
                                  ? 'Team Member'
                                  : member.role === 'supervisor'
                                    ? 'Supervisor'
                                    : member.role === 'coordinator'
                                      ? 'Coordinator'
                                      : member.role
                            }}
                          </span>
                          <span class="text-xs text-gray-400 mt-1">
                            {{ getRoleStatusText(member) }}
                          </span>
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span
                          :class="
                            member.status === 1
                              ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'
                              : 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'
                          "
                        >
                          {{ member.status === 1 ? 'Active' : 'Inactive' }}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {{ new Date(member.added_at).toLocaleDateString() }}
                      </td>
                      <td
                        v-if="canEditProject"
                        class="px-6 py-4 whitespace-nowrap text-sm font-medium"
                      >
                        <button
                          @click="openEditRoleDialog(member)"
                          class="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          @click="removeTeamMember(member)"
                          class="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Empty State -->
              <div v-else class="p-6 text-center">
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  ></path>
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900">No team members</h3>
                <p class="mt-1 text-sm text-gray-500">
                  Get started by adding team members to this project.
                </p>
                <div v-if="canEditProject" class="mt-6">
                  <button
                    @click="addTeamMember"
                    class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    + Add Team Member
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Settings Section -->
          <div
            v-else-if="activeSection === 'settings'"
            class="flex-1 flex flex-col overflow-hidden"
          >
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-semibold text-gray-900">Project Settings</h2>
            </div>

            <!-- Settings Form -->
            <div class="bg-white rounded-lg shadow p-6">
              <form @submit.prevent="saveSettings" class="space-y-6">
                <!-- Project Name -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Project Name *
                  </label>
                  <input
                    v-model="settingsForm.name"
                    type="text"
                    :disabled="!canEditProject"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="Enter project name"
                    required
                  />
                </div>

                <!-- Project Address -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Project Address *
                  </label>
                  <textarea
                    v-model="settingsForm.address"
                    :disabled="!canEditProject"
                    rows="3"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="Enter project address"
                    required
                  ></textarea>
                </div>

                <!-- Priority and Status -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- Priority -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2"> Priority </label>
                    <select
                      v-model="settingsForm.priority"
                      :disabled="!canEditProject"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <!-- Status -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2"> Status </label>
                    <select
                      v-model="settingsForm.status"
                      :disabled="!canEditProject"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <!-- Dates -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- Start Date -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2"> Start Date </label>
                    <input
                      v-model="settingsForm.startDate"
                      type="date"
                      :disabled="!canEditProject"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <!-- End Date -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2"> End Date </label>
                    <input
                      v-model="settingsForm.endDate"
                      type="date"
                      :disabled="!canEditProject"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>

                <!-- Action Buttons -->
                <div
                  v-if="canEditProject"
                  class="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200"
                >
                  <button
                    type="button"
                    @click="resetSettings"
                    :disabled="isSavingSettings"
                    class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    Reset
                  </button>
                </div>

                <!-- Read-only notice for non-managers -->
                <div v-else class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div class="flex">
                    <svg
                      class="h-5 w-5 text-yellow-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      ></path>
                    </svg>
                    <div class="ml-3">
                      <p class="text-sm text-yellow-800">
                        You can only view project settings. Only Project Managers can edit project
                        information.
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Event Details Modal -->
    <div
      v-if="showEventModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      @click="closeEventModal"
    >
      <div
        class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"
        @click.stop
      >
        <div class="mt-3">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900">Task Details</h3>
            <button @click="closeEventModal" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </div>

          <div v-if="selectedEvent" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Title</label>
              <p class="mt-1 text-sm text-gray-900">{{ selectedEvent.title }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Start Date</label>
              <p class="mt-1 text-sm text-gray-900">
                {{ selectedEvent.start.toLocaleDateString() }}
              </p>
            </div>

            <div v-if="selectedEvent.end">
              <label class="block text-sm font-medium text-gray-700">End Date</label>
              <p class="mt-1 text-sm text-gray-900">
                {{ selectedEvent.end.toLocaleDateString() }}
              </p>
            </div>

            <div v-if="selectedEvent.description">
              <label class="block text-sm font-medium text-gray-700">Description</label>
              <p class="mt-1 text-sm text-gray-900">{{ selectedEvent.description }}</p>
            </div>

            <div v-if="selectedEvent.assignee">
              <label class="block text-sm font-medium text-gray-700">Assignee</label>
              <p class="mt-1 text-sm text-gray-900">{{ selectedEvent.assignee }}</p>
            </div>

            <div v-if="selectedEvent.priority">
              <label class="block text-sm font-medium text-gray-700">Priority</label>
              <span
                :class="{
                  'bg-red-100 text-red-800': selectedEvent.priority === 'high',
                  'bg-yellow-100 text-yellow-800': selectedEvent.priority === 'medium',
                  'bg-green-100 text-green-800': selectedEvent.priority === 'low',
                }"
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              >
                {{ selectedEvent.priority }}
              </span>
            </div>
          </div>

          <div class="flex items-center justify-end space-x-3 mt-6">
            <button
              @click="closeEventModal"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Close
            </button>
            <button
              v-if="canEditProject"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Edit Task
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Add Team Member Dialog -->
  <AddTeamMemberDialog
    :is-open="showAddTeamMemberDialog"
    :project-id="project?.id || 0"
    :existing-team-members="teamMembers"
    @close="showAddTeamMemberDialog = false"
    @member-added="handleTeamMemberAdded"
  />

  <!-- File Upload Dialog -->
  <FileUploadDialog
    :is-open="showFileUploadDialog"
    :title="'Upload File'"
    :file-info="
      selectedFile
        ? {
            name: selectedFile.name,
            size: selectedFile.size,
            type: selectedFile.type,
          }
        : null
    "
    @close="closeFileUploadDialog"
    @upload="handleFileUpload"
  />

  <!-- Edit Role Dialog -->
  <div v-if="editRoleDialog.isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <div
      class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
    >
      <!-- Background overlay -->
      <div
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        @click="closeEditRoleDialog"
      ></div>

      <!-- Dialog panel -->
      <div
        class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
      >
        <!-- Header -->
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div
              class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10"
            >
              <svg
                class="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                ></path>
              </svg>
            </div>
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 class="text-lg leading-6 font-medium text-gray-900">Edit Team Member Role</h3>
              <div class="mt-2">
                <p class="text-sm text-gray-500">
                  Change the role for {{ editRoleDialog.member?.name || 'this team member' }}
                </p>
                <p class="text-xs text-gray-400 mt-1">
                  Roles are auto-assigned based on profession. Change only if needed.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="bg-white px-4 pb-4 sm:p-6">
          <div class="mb-4">
            <label for="role" class="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              id="role"
              v-model="editRoleDialog.newRole"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option v-for="role in roleOptions" :key="role.value" :value="role.value">
                {{ role.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- Footer -->
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            @click="saveRoleChanges"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Save Changes
          </button>
          <button
            @click="closeEditRoleDialog"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Move Dialog -->
  <div
    v-if="showMoveDialog"
    class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
  >
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900">Move Items</h3>
          <button @click="cancelMove" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Destination Folder</label>
          <select
            v-model="moveDestinationFolderId"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option :value="1">/ Home</option>
            <option
              v-for="folder in getAllFoldersFlat()"
              :key="folder.id"
              :value="folder.id"
              :disabled="moveItems.some((item) => item.id === folder.id && item.type === 'folder')"
            >
              {{ getFolderPath(folder) }}
            </option>
          </select>
        </div>

        <div class="mb-4">
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

        <div class="flex justify-end space-x-3">
          <button
            @click="cancelMove"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            @click="executeMove"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Move
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

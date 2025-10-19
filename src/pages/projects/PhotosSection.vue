<template>
  <div class="photos-section flex-1 flex flex-col">
    <!-- Header -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-gray-900">Project Photos</h2>
        <button
          v-if="canEdit"
          @click="showUploadDialog = true"
          class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            ></path>
          </svg>
          Upload Photos
        </button>
      </div>
      <p class="text-sm text-gray-600">
        Document work progress, completed tasks, and any issues with photos organized by tasks.
      </p>
    </div>

    <!-- Filter and Search -->
    <div class="bg-white rounded-lg shadow p-4 mb-6">
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search photos by task name or description..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div class="flex gap-2">
          <select
            v-model="selectedTask"
            class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Tasks</option>
            <option v-for="task in tasks" :key="task.id" :value="task.id">
              {{ task.title }}
            </option>
          </select>
          <select
            v-model="sortBy"
            class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="task">By Task</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Photos Grid -->
    <div
      v-if="filteredPhotos.length > 0"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      <div
        v-for="photo in filteredPhotos"
        :key="photo.id"
        class="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
        @click="openPhotoModal(photo)"
      >
        <div class="aspect-square relative">
          <img
            :src="photo.thumbnail || photo.url"
            :alt="photo.description"
            class="w-full h-full object-cover"
            @error="handleImageError"
          />
          <div class="absolute top-2 right-2">
            <span
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
              :class="getPhotoStatusClass(photo.status)"
            >
              {{ getPhotoStatusText(photo.status) }}
            </span>
          </div>
        </div>
        <div class="p-3">
          <h3 class="font-medium text-gray-900 text-sm truncate">{{ photo.taskTitle }}</h3>
          <p class="text-xs text-gray-500 mt-1">{{ formatDate(photo.createdAt) }}</p>
          <p class="text-xs text-gray-600 mt-1 line-clamp-2">{{ photo.description }}</p>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="bg-white rounded-lg shadow p-12 text-center">
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
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        ></path>
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">No photos yet</h3>
      <p class="mt-1 text-sm text-gray-500">
        Start documenting your project progress by uploading photos.
      </p>
      <div v-if="canEdit" class="mt-6">
        <button
          @click="showUploadDialog = true"
          class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            ></path>
          </svg>
          Upload First Photo
        </button>
      </div>
    </div>

    <!-- Photo Modal -->
    <div v-if="selectedPhoto" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
        <div
          class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          @click="closePhotoModal"
        ></div>

        <div
          class="bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:max-w-4xl sm:w-full max-h-[90vh] flex flex-col"
        >
          <!-- Header -->
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 flex-shrink-0">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-medium text-gray-900">{{ selectedPhoto.taskTitle }}</h3>
                <p class="text-sm text-gray-500">{{ formatDate(selectedPhoto.createdAt) }}</p>
              </div>
              <button @click="closePhotoModal" class="text-gray-400 hover:text-gray-600">
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
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-6">
            <div class="space-y-4">
              <!-- Photo -->
              <div class="text-center">
                <img
                  :src="selectedPhoto.url"
                  :alt="selectedPhoto.description"
                  class="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
                  @error="handleImageError"
                />
              </div>

              <!-- Details -->
              <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="text-sm font-medium text-gray-900 mb-2">Description</h4>
                <p class="text-sm text-gray-700">
                  {{ selectedPhoto.description || 'No description provided' }}
                </p>
              </div>

              <!-- Metadata -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-gray-50 p-4 rounded-lg">
                  <h4 class="text-sm font-medium text-gray-900 mb-2">Photo Details</h4>
                  <div class="space-y-1 text-sm">
                    <div>
                      <span class="font-medium">Status:</span>
                      {{ getPhotoStatusText(selectedPhoto.status) }}
                    </div>
                    <div>
                      <span class="font-medium">Uploaded by:</span> {{ selectedPhoto.uploadedBy }}
                    </div>
                    <div>
                      <span class="font-medium">File size:</span>
                      {{ formatFileSize(selectedPhoto.fileSize) }}
                    </div>
                  </div>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg">
                  <h4 class="text-sm font-medium text-gray-900 mb-2">Task Information</h4>
                  <div class="space-y-1 text-sm">
                    <div><span class="font-medium">Task:</span> {{ selectedPhoto.taskTitle }}</div>
                    <div>
                      <span class="font-medium">Category:</span> {{ selectedPhoto.category }}
                    </div>
                    <div>
                      <span class="font-medium">Location:</span>
                      {{ selectedPhoto.location || 'Not specified' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Upload Dialog -->
    <div v-if="showUploadDialog" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
        <div
          class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          @click="closeUploadDialog"
        ></div>

        <div
          class="bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:max-w-2xl sm:w-full"
        >
          <div class="px-4 pt-5 pb-4 sm:p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Upload Photos</h3>
            <p class="text-sm text-gray-600 mb-4">
              Upload photos to document work progress, completed tasks, or any issues.
            </p>

            <!-- Upload Form -->
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Select Task</label>
                <select
                  v-model="uploadForm.taskId"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Choose a task...</option>
                  <option v-for="task in tasks" :key="task.id" :value="task.id">
                    {{ task.title }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  v-model="uploadForm.description"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe what this photo shows..."
                ></textarea>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  v-model="uploadForm.category"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="progress">Work Progress</option>
                  <option value="completed">Completed Work</option>
                  <option value="issue">Issue/Problem</option>
                  <option value="quality">Quality Check</option>
                  <option value="safety">Safety</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Photos</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  @change="handleFileSelect"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p class="text-xs text-gray-500 mt-1">Select multiple photos to upload</p>
              </div>
            </div>
          </div>

          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              @click="uploadPhotos"
              :disabled="!uploadForm.taskId || !selectedFiles.length"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Upload Photos
            </button>
            <button
              @click="closeUploadDialog"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

defineOptions({
  name: 'PhotosSection',
})

interface Photo {
  id: number
  url: string
  thumbnail: string
  description: string
  taskId: number
  taskTitle: string
  status: string
  category: string
  uploadedBy: string
  createdAt: string
  fileSize: number
  location: string
}

interface Task {
  id: number
  title: string
}

interface Props {
  canEdit?: boolean
  project?: unknown
}

withDefaults(defineProps<Props>(), {
  canEdit: false,
  project: undefined,
})

// State
const photos = ref<Photo[]>([])
const tasks = ref<Task[]>([])
const searchQuery = ref('')
const selectedTask = ref('')
const sortBy = ref('newest')
const selectedPhoto = ref<Photo | null>(null)
const showUploadDialog = ref(false)
const selectedFiles = ref<File[]>([])

const uploadForm = ref({
  taskId: '',
  description: '',
  category: 'progress',
})

// Computed
const filteredPhotos = computed(() => {
  let filtered = photos.value

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (photo) =>
        photo.taskTitle.toLowerCase().includes(query) ||
        photo.description.toLowerCase().includes(query),
    )
  }

  // Filter by task
  if (selectedTask.value) {
    filtered = filtered.filter((photo) => photo.taskId === Number(selectedTask.value))
  }

  // Sort
  switch (sortBy.value) {
    case 'newest':
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      break
    case 'oldest':
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      break
    case 'task':
      filtered.sort((a, b) => a.taskTitle.localeCompare(b.taskTitle))
      break
  }

  return filtered
})

// Methods
const loadPhotos = async () => {
  // TODO: Load photos from API
  // Mock data for now
  photos.value = [
    {
      id: 1,
      url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkZvdW5kYXRpb24gV29yazwvdGV4dD48L3N2Zz4=',
      thumbnail:
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkZvdW5kYXRpb248L3RleHQ+PC9zdmc+',
      description: 'Completed foundation work',
      taskId: 1,
      taskTitle: 'Foundation Installation',
      status: 'completed',
      category: 'completed',
      uploadedBy: 'John Smith',
      createdAt: '2024-01-15T10:30:00Z',
      fileSize: 2048000,
      location: 'Building A',
    },
    {
      id: 2,
      url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPldhbGwgSXNzdWU8L3RleHQ+PC9zdmc+',
      thumbnail:
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPldhbGwgSXNzdWU8L3RleHQ+PC9zdmc+',
      description: 'Crack in the wall that needs attention',
      taskId: 2,
      taskTitle: 'Wall Inspection',
      status: 'issue',
      category: 'issue',
      uploadedBy: 'Sarah Johnson',
      createdAt: '2024-01-14T14:20:00Z',
      fileSize: 1536000,
      location: 'Building B',
    },
  ]
}

const loadTasks = async () => {
  // TODO: Load tasks from API
  // Mock data for now
  tasks.value = [
    { id: 1, title: 'Foundation Installation' },
    { id: 2, title: 'Wall Inspection' },
    { id: 3, title: 'Electrical Work' },
    { id: 4, title: 'Plumbing Installation' },
  ]
}

const openPhotoModal = (photo: Photo) => {
  selectedPhoto.value = photo
}

const closePhotoModal = () => {
  selectedPhoto.value = null
}

const closeUploadDialog = () => {
  showUploadDialog.value = false
  uploadForm.value = {
    taskId: '',
    description: '',
    category: 'progress',
  }
  selectedFiles.value = []
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    selectedFiles.value = Array.from(target.files)
  }
}

const uploadPhotos = async () => {
  // TODO: Implement photo upload
  console.log('Uploading photos:', {
    taskId: uploadForm.value.taskId,
    description: uploadForm.value.description,
    category: uploadForm.value.category,
    files: selectedFiles.value,
  })

  closeUploadDialog()
}

const getPhotoStatusClass = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'issue':
      return 'bg-red-100 text-red-800'
    case 'progress':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getPhotoStatusText = (status: string) => {
  switch (status) {
    case 'completed':
      return 'Completed'
    case 'issue':
      return 'Issue'
    case 'progress':
      return 'Progress'
    default:
      return 'Unknown'
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIEVycm9yPC90ZXh0Pjwvc3ZnPg=='
}

// Lifecycle
onMounted(() => {
  loadPhotos()
  loadTasks()
})
</script>

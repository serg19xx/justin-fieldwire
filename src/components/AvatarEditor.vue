<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

interface Props {
  isOpen: boolean
  currentAvatar?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  save: [avatarUrl: string]
}>()

// State
const imageUrl = ref<string>('')
const isProcessing = ref(false)

// Refs
const imageRef = ref<HTMLImageElement>()
const canvasRef = ref<HTMLCanvasElement>()

// Transform state
const scale = ref(1)
const rotation = ref(0)
const offsetX = ref(0)
const offsetY = ref(0)
const isDragging = ref(false)
const lastX = ref(0)
const lastY = ref(0)

// Canvas context
let ctx: CanvasRenderingContext2D | null = null

// Animation frame for smooth dragging
let animationFrame: number | null = null

// Computed
const hasImage = computed(() => !!imageUrl.value)
const isLocalImage = computed(() => imageUrl.value?.startsWith('data:'))

// Add new computed for overlay styles
const overlayStyles = computed(() => ({
  background: `radial-gradient(circle at center, transparent 96px, rgba(0, 0, 0, 0.5) 96px)`,
}))

// Draw image function - copied from PetPhotoEditor
function drawImage() {
  if (!imageRef.value || !canvasRef.value) return

  if (!ctx) {
    ctx = canvasRef.value.getContext('2d')
  }

  if (!ctx) return

  const image = imageRef.value

  // Check if image is loaded
  if (image.width === 0 || image.height === 0) return

  // Auto-scale image to fit in circle on first load
  if (scale.value === 1 && offsetX.value === 0 && offsetY.value === 0 && rotation.value === 0) {
    const canvasSize = 320
    const imageSize = Math.max(image.width, image.height)
    const fitScale = (canvasSize / imageSize) * 0.8 // 0.8 to leave some margin
    scale.value = fitScale
  }

  // Clear canvas
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)

  // Save current state
  ctx.save()

  // Move to center
  ctx.translate(canvasRef.value.width / 2, canvasRef.value.height / 2)

  // Rotate
  ctx.rotate((rotation.value * Math.PI) / 180)

  // Scale
  ctx.scale(scale.value, scale.value)

  // Apply offset
  ctx.translate(offsetX.value, offsetY.value)

  // Draw image
  ctx.drawImage(image, -image.width / 2, -image.height / 2, image.width, image.height)

  // Restore state
  ctx.restore()
}

// Initialize with current avatar
onMounted(() => {
  if (props.currentAvatar) {
    imageUrl.value = props.currentAvatar
  }
})

// File selection
function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      imageUrl.value = e.target?.result as string
      // Reset transforms when loading new image
      scale.value = 1
      rotation.value = 0
      offsetX.value = 0
      offsetY.value = 0
      drawImage()
    }
    reader.readAsDataURL(file)
  }
}

// Center image
function centerImage() {
  offsetX.value = 0
  offsetY.value = 0
  drawImage()
}

// Rotate functions
function rotateLeft() {
  rotation.value -= 90
  drawImage()
}

function rotateRight() {
  rotation.value += 90
  drawImage()
}

// Zoom functions
function zoomIn() {
  scale.value = Math.min(scale.value * 1.1, 5)
  drawImage()
}

function zoomOut() {
  scale.value = Math.max(scale.value * 0.9, 0.1)
  drawImage()
}

// Mouse events for dragging
function startDrag(event: MouseEvent) {
  if (!hasImage.value) return
  isDragging.value = true
  lastX.value = event.clientX
  lastY.value = event.clientY
}

function drag(event: MouseEvent) {
  if (!isDragging.value || !hasImage.value) return
  event.preventDefault()

  const currentX = event.clientX
  const currentY = event.clientY

  const dx = (currentX - lastX.value) / scale.value
  const dy = (currentY - lastY.value) / scale.value

  offsetX.value += dx
  offsetY.value += dy

  lastX.value = currentX
  lastY.value = currentY

  // Use requestAnimationFrame for smooth dragging
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
  }
  animationFrame = requestAnimationFrame(drawImage)
}

function stopDrag() {
  isDragging.value = false
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
  }
}

// Save avatar - copied from PetPhotoEditor
async function saveAvatar() {
  if (!hasImage.value) {
    return
  }

  isProcessing.value = true

  try {
    if (isLocalImage.value) {
      // For local images, emit the data URL directly
      emit('save', imageUrl.value)
    } else {
      // For server images, capture the current canvas state
      if (!canvasRef.value) return

      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = 320
      tempCanvas.height = 320

      const tempCtx = tempCanvas.getContext('2d')
      if (tempCtx) {
        tempCtx.drawImage(canvasRef.value, 0, 0, 320, 320)

        // Convert to data URL
        const dataUrl = tempCanvas.toDataURL('image/png', 1.0)
        emit('save', dataUrl)
      }
    }

    isProcessing.value = false
    closeDialog()
  } catch (error) {
    console.error('Error saving avatar:', error)
    isProcessing.value = false
  }
}

// Close dialog
function closeDialog() {
  emit('close')
}

// Watch for dialog open/close
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen && props.currentAvatar) {
      // Reset ctx for new session
      ctx = null

      // Always reset transforms when opening editor
      scale.value = 1
      rotation.value = 0
      offsetX.value = 0
      offsetY.value = 0

      // Add timestamp to force reload
      const separator = props.currentAvatar.includes('?') ? '&' : '?'
      imageUrl.value = props.currentAvatar + separator + '_t=' + Date.now()

      // Force redraw after a short delay to ensure image is loaded
      setTimeout(() => {
        if (imageRef.value && imageRef.value.complete) {
          drawImage()
        }
      }, 100)
    }
  },
)

// Cleanup on unmount
onUnmounted(() => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
  }
})
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click="closeDialog"
  >
    <div
      class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      @click.stop
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b">
        <h2 class="text-xl font-semibold text-gray-900">Edit Profile Picture</h2>
        <button @click="closeDialog" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-6">
        <!-- File Selection -->
        <div v-if="!hasImage" class="text-center py-12">
          <div
            class="w-32 h-32 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center"
          >
            <svg
              class="w-16 h-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <p class="text-gray-600 mb-4">Select an image to edit</p>
          <input
            type="file"
            accept="image/*"
            @change="handleFileSelect"
            class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <!-- Image Editor -->
        <div v-else class="space-y-6">
          <!-- Editor Container -->
          <div
            class="relative w-full aspect-square max-w-md mx-auto"
            @mousedown="startDrag"
            @mousemove="drag"
            @mouseup="stopDrag"
            @mouseleave="stopDrag"
          >
            <!-- Semi-transparent overlay with transparent circle -->
            <div
              :style="overlayStyles"
              class="absolute inset-0 pointer-events-none"
              style="z-index: 5"
            ></div>

            <!-- Canvas for image display -->
            <canvas
              v-if="imageUrl"
              ref="canvasRef"
              width="320"
              height="320"
              class="absolute inset-0 w-full h-full"
              style="z-index: 10"
            ></canvas>

            <!-- Hidden image for loading -->
            <img
              v-if="imageUrl"
              ref="imageRef"
              :src="imageUrl"
              crossorigin="anonymous"
              @load="
                () => {
                  drawImage()
                }
              "
              @error="() => console.log('Failed to load image:', imageUrl)"
              class="hidden"
            />

            <!-- Circle border indicator -->
            <div
              class="absolute inset-0 flex items-center justify-center pointer-events-none"
              style="z-index: 15"
            >
              <div class="w-48 h-48 rounded-full border-2 border-white shadow-lg"></div>
            </div>
          </div>

          <!-- Controls -->
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <!-- Rotate Left -->
              <button
                @click="rotateLeft"
                class="p-2 bg-gray-100 rounded-md hover:bg-gray-200"
                title="Rotate Left"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>

              <!-- Rotate Right -->
              <button
                @click="rotateRight"
                class="p-2 bg-gray-100 rounded-md hover:bg-gray-200"
                title="Rotate Right"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>

              <!-- Zoom Out -->
              <button
                @click="zoomOut"
                class="p-2 bg-gray-100 rounded-md hover:bg-gray-200"
                title="Zoom Out"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
                  />
                </svg>
              </button>

              <!-- Zoom In -->
              <button
                @click="zoomIn"
                class="p-2 bg-gray-100 rounded-md hover:bg-gray-200"
                title="Zoom In"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                  />
                </svg>
              </button>

              <!-- Center -->
              <button
                @click="centerImage"
                class="p-2 bg-gray-100 rounded-md hover:bg-gray-200"
                title="Center"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
              </button>
            </div>

            <!-- Change Image -->
            <input
              type="file"
              accept="image/*"
              @change="handleFileSelect"
              class="hidden"
              id="avatar-file-input"
            />
            <label
              for="avatar-file-input"
              class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 cursor-pointer"
            >
              Change Image
            </label>
          </div>

          <!-- Instructions -->
          <div class="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
            <p class="font-medium mb-1">How to edit:</p>
            <ul class="space-y-1 text-xs">
              <li>• Drag the image to position it within the circle</li>
              <li>• Use rotate buttons to rotate the image</li>
              <li>• Use zoom buttons to resize the image</li>
              <li>• Click "Center" to reset position</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-end space-x-3 p-6 border-t">
        <button
          @click="closeDialog"
          class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          @click="saveAvatar"
          :disabled="!hasImage || isProcessing"
          class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="isProcessing">Processing...</span>
          <span v-else>Save Avatar</span>
        </button>
      </div>
    </div>
  </div>
</template>

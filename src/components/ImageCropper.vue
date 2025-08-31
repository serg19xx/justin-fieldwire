<template>
  <div class="image-cropper">
    <!-- Upload Area -->
    <div v-if="!imageUrl" class="upload-area" @click="triggerFileInput">
      <div class="upload-content">
        <svg class="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p>Click to upload image</p>
      </div>
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        @change="handleFileSelect"
        class="hidden"
      />

      <!-- Hidden input for upload new -->
      <input
        ref="uploadNewInput"
        type="file"
        accept="image/*"
        @change="handleUploadNew"
        class="hidden"
      />
    </div>

    <!-- Cropper -->
    <div v-else class="cropper">
      <div
        class="image-wrapper"
        ref="imageWrapper"
      >
        <img
          ref="imageElement"
          :src="imageUrl"
          @load="onImageLoad"
          class="cropper-image"
          :style="imageStyle"
          @mousedown="startDrag"
          @dragstart="(e) => e.preventDefault()"
        />

        <!-- Crop Box -->
        <div class="crop-box" :style="cropBoxStyle">
          <!-- Image can be dragged by clicking and dragging on the image itself -->
        </div>
      </div>

      <!-- Controls -->
      <div class="controls">
        <div class="control-buttons">
          <button @click="rotateLeft" class="btn">↶</button>
          <button @click="rotateRight" class="btn">↷</button>
          <button @click="zoomOut" class="btn">−</button>
          <button @click="zoomIn" class="btn">+</button>
          <button @click="reset" class="btn">Reset</button>
          <label for="upload-new" class="btn btn-upload cursor-pointer">
            📁 Upload New
            <input
              id="upload-new"
              type="file"
              accept="image/*"
              @change="handleUploadNew"
              class="hidden"
            />
          </label>
        </div>

        <div class="action-buttons">
          <button @click="cancel" class="btn btn-secondary">Cancel</button>
          <button @click="crop" class="btn btn-primary">Crop & Save</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Props {
  aspectRatio?: number
  quality?: number
  format?: string
  initialImage?: string
}

const props = withDefaults(defineProps<Props>(), {
  aspectRatio: 1,
  quality: 0.9,
  format: 'image/jpeg',
  initialImage: '',
})

const emit = defineEmits<{
  crop: [file: File]
  cancel: []
}>()

// Refs
const fileInput = ref<HTMLInputElement>()
const uploadNewInput = ref<HTMLInputElement>()
const imageElement = ref<HTMLImageElement>()
const imageWrapper = ref<HTMLDivElement>()

// State
const imageUrl = ref(props.initialImage || '')
const isDragging = ref(false)

// Transform state
const scale = ref(1)
const rotation = ref(0)
const offsetX = ref(0)
const offsetY = ref(0)

// Crop state
const cropX = ref(0)
const cropY = ref(0)
const cropWidth = ref(200)
const cropHeight = ref(200)

// Mouse state
const lastX = ref(0)
const lastY = ref(0)

// Computed
const imageStyle = computed(() => ({
  transform: `scale(${scale.value}) rotate(${rotation.value}deg) translate(${offsetX.value}px, ${offsetY.value}px)`,
}))

const cropBoxStyle = computed(() => ({
  left: `${cropX.value}px`,
  top: `${cropY.value}px`,
  width: `${cropWidth.value}px`,
  height: `${cropHeight.value}px`,
}))

// Methods
function triggerFileInput() {
  console.log('🔍 triggerFileInput called')
  console.log('🔍 fileInput.value:', fileInput.value)
  if (fileInput.value) {
    fileInput.value.click()
    console.log('✅ File input clicked')
  } else {
    console.log('❌ File input not found')
  }
}

function handleFileSelect(event: Event) {
  console.log('📁 handleFileSelect called')
  const file = (event.target as HTMLInputElement).files?.[0]
  console.log('📁 Selected file:', file)

  if (file) {
    console.log('📁 File details:', { name: file.name, size: file.size, type: file.type })
    const reader = new FileReader()
    reader.onload = (e) => {
      console.log('✅ File loaded successfully')
      imageUrl.value = e.target?.result as string
      resetTransforms()
    }
    reader.readAsDataURL(file)
  } else {
    console.log('❌ No file selected')
  }
}

function onImageLoad() {
  if (!imageWrapper.value) return

  const rect = imageWrapper.value.getBoundingClientRect()
  // Make crop area smaller and circular
  const size = Math.min(rect.width, rect.height) * 0.6

  cropWidth.value = size
  cropHeight.value = size
  cropX.value = (rect.width - size) / 2
  cropY.value = (rect.height - size) / 2
}

// Watch for initial image changes
import { watch } from 'vue'

watch(
  () => props.initialImage,
  (newImage) => {
    if (newImage) {
      imageUrl.value = newImage
      resetTransforms()
    }
  },
)

// Drag image
function startDrag(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()

  console.log('🖱️ Start drag')
  isDragging.value = true
  lastX.value = event.clientX
  lastY.value = event.clientY

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

function handleMouseMove(event: MouseEvent) {
  if (!isDragging.value) return

  event.preventDefault()

  const deltaX = event.clientX - lastX.value
  const deltaY = event.clientY - lastY.value

  // Move the image instead of crop area
  offsetX.value += deltaX / scale.value
  offsetY.value += deltaY / scale.value

  lastX.value = event.clientX
  lastY.value = event.clientY
}

function handleMouseUp(event: MouseEvent) {
  event.preventDefault()
  console.log('🖱️ Stop drag')
  isDragging.value = false

  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

// Transform controls
function rotateLeft() {
  rotation.value -= 90
}

function rotateRight() {
  rotation.value += 90
}

function zoomIn() {
  scale.value = Math.min(scale.value * 1.1, 3)
}

function zoomOut() {
  scale.value = Math.max(scale.value * 0.9, 0.1)
}

function reset() {
  resetTransforms()
}

function resetTransforms() {
  scale.value = 1
  rotation.value = 0
  offsetX.value = 0
  offsetY.value = 0
}

// Crop and save
function crop() {
  if (!imageElement.value) return

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Create circular crop
  canvas.width = cropWidth.value
  canvas.height = cropHeight.value

  // Create circular clipping path
  ctx.beginPath()
  ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, 2 * Math.PI)
  ctx.clip()

  // Calculate the visible area of the image
  const imageRect = imageElement.value.getBoundingClientRect()
  const cropRect = {
    x: cropX.value,
    y: cropY.value,
    width: cropWidth.value,
    height: cropHeight.value,
  }

  // Draw the cropped area
  ctx.drawImage(
    imageElement.value,
    cropRect.x,
    cropRect.y,
    cropRect.width,
    cropRect.height,
    0,
    0,
    canvas.width,
    canvas.height,
  )

  canvas.toBlob(
    (blob) => {
      if (blob) {
        const file = new File([blob], 'cropped.jpg', { type: props.format })
        emit('crop', file)
      }
    },
    props.format,
    props.quality,
  )
}

function uploadNew() {
  console.log('📁 uploadNew called')
  if (uploadNewInput.value) {
    uploadNewInput.value.value = ''
    uploadNewInput.value.click()
    console.log('✅ Upload new input clicked')
  } else {
    console.log('❌ Upload new input not found')
  }
}

function handleUploadNew(event: Event) {
  console.log('📁 handleUploadNew called')
  const file = (event.target as HTMLInputElement).files?.[0]
  console.log('📁 New file selected:', file)

  if (file) {
    console.log('📁 New file details:', { name: file.name, size: file.size, type: file.type })
    const reader = new FileReader()
    reader.onload = (e) => {
      console.log('✅ New file loaded successfully')
      const newImageUrl = e.target?.result as string
      imageUrl.value = newImageUrl
      resetTransforms()

      // Wait for image to load and then reinitialize crop area
      if (imageElement.value) {
        imageElement.value.onload = () => {
          console.log('🖼️ New image loaded, reinitializing crop area')
          onImageLoad()
        }
      }
    }
    reader.readAsDataURL(file)
  } else {
    console.log('❌ No new file selected')
  }
}

function cancel() {
  imageUrl.value = ''
  emit('cancel')
}

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})
</script>

<style scoped>
.image-cropper {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.upload-area {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s;
}

.upload-area:hover {
  border-color: #3b82f6;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.upload-icon {
  width: 48px;
  height: 48px;
  color: #6b7280;
}

.cropper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.image-wrapper {
  position: relative;
  width: 100%;
  height: 400px;
  background: #f3f4f6;
  border-radius: 8px;
  overflow: hidden;
}

.cropper-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.1s ease;
  cursor: grab;
}

.cropper-image:active {
  cursor: grabbing;
}

.crop-box {
  position: absolute;
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
  pointer-events: none;
}

.crop-handle {
  position: absolute;
  width: 12px;
  height: 12px;
  background: white;
  border: 2px solid #3b82f6;
  border-radius: 50%;
}

.crop-handle.nw {
  top: -6px;
  left: -6px;
  cursor: nw-resize;
}

.crop-handle.ne {
  top: -6px;
  right: -6px;
  cursor: ne-resize;
}

.crop-handle.sw {
  bottom: -6px;
  left: -6px;
  cursor: sw-resize;
}

.crop-handle.se {
  bottom: -6px;
  right: -6px;
  cursor: se-resize;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.control-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:hover {
  background: #f9fafb;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-upload {
  background: #10b981;
  color: white;
  border-color: #10b981;
}

.btn-upload:hover {
  background: #059669;
}

.hidden {
  display: none;
}
</style>

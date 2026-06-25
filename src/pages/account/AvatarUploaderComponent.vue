<template>
  <div class="avatar-uploader space-y-6">
    <!-- Simple upload area -->
    <div
      v-if="!image"
      class="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
      @click="triggerFileInput"
    >
      <div class="flex flex-col items-center space-y-4">
        <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>
        <div>
          <p class="text-lg font-medium text-gray-900">Upload a new photo</p>
          <p class="text-sm text-gray-500">Click to browse or drag and drop</p>
        </div>
      </div>
    </div>

    <!-- Hidden file input -->
    <input ref="fileInput" type="file" accept="image/*" @change="onFileChange" class="hidden" />

    <!-- Cropper -->
    <div v-if="image" class="space-y-4">
      <div class="text-center space-x-4">
        <button @click="changePhoto" class="text-sm text-blue-600 hover:text-blue-800 underline">
          Choose different photo
        </button>
      </div>

      <div class="flex justify-center">
        <Cropper
          ref="cropper"
          class="cropper"
          :src="image"
          :stencil-component="'circle-stencil'"
          :stencil-props="{
            aspectRatio: 1,
            movable: true,
            resizable: true,
            handlers: true,
            lines: true,
          }"
          @change="updatePreview"
          @ready="restoreTransformations"
          draggable="false"
        />
      </div>

      <!-- Controls -->
      <div class="flex gap-2 flex-wrap justify-center">
        <button class="btn" @click="zoomIn" title="Zoom In">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
            />
          </svg>
        </button>
        <button class="btn" @click="zoomOut" title="Zoom Out">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
            />
          </svg>
        </button>
        <button class="btn" @click="rotateLeft" title="Rotate Left">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
        <button class="btn" @click="rotateRight" title="Rotate Right">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      <!-- Preview and Save -->
      <div class="flex flex-col items-center space-y-4">
        <div class="text-center">
          <p class="text-sm font-medium text-gray-700 mb-2">Preview</p>
          <img
            :src="preview || displayedAvatar"
            alt="Preview"
            class="w-20 h-20 rounded-full border-2 border-gray-200 object-cover mx-auto"
          />
        </div>

        <button
          class="btn-primary flex items-center gap-2"
          @click="handleSaveClick"
          :disabled="loading"
        >
          <span v-if="loading" class="loader"></span>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>{{ loading ? 'Saving...' : 'Save Avatar' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, toRefs, onMounted } from 'vue'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import { api } from '@/core/utils/api'
import { resolveApiMediaUrl } from '@/config/api'

/**
 * Props: можно прокидывать старый аватар и endpoint
 */
const props = defineProps({
  initialAvatar: { type: String, default: '/images/default-avatar.png' },
  fullImageUrl: { type: String, default: null },
  uploadUrl: { type: String, default: '/api/upload-avatar' },
})

const { initialAvatar, fullImageUrl: propFullImageUrl } = toRefs(props)

// Emit events
const emit = defineEmits(['avatar-saved'])

const cropper = ref<{
  getResult: (options: { size: { width: number; height: number } }) => { canvas: HTMLCanvasElement }
  zoom: (factor: number) => void
  rotate: (degrees: number) => void
} | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const image = ref<string | null>(null)
const preview = ref<string | null>(null)
const oldAvatar = ref(initialAvatar.value) // серверный аватар
const displayedAvatar = ref(initialAvatar.value) // показываемый аватар
const loading = ref(false)

// Сохраняем исходное изображение и трансформации
const originalImage = ref<string | null>(null)
const savedTransformations = ref<{
  coordinates?: unknown
  visibleArea?: unknown
  imageSize?: unknown
} | null>(null)

// Отслеживаем, есть ли существующий аватар для сброса
const hasExistingAvatar = ref(false)

// Функция для проверки и загрузки существующего аватара
function loadExistingAvatar() {
  // Всегда загружаем полное изображение из props
  if (propFullImageUrl.value) {
    loadFullImage()
  } else {
    image.value = null
    originalImage.value = null
    savedTransformations.value = null
    hasExistingAvatar.value = false
  }
}

// Инициализация при монтировании
onMounted(() => {
  loadExistingAvatar()
})

// Watch for changes in initialAvatar
watch(
  () => props.initialAvatar,
  () => {
    loadExistingAvatar()
  },
  { immediate: true },
)

// Когда пропсы меняются — обновляем
watch(initialAvatar, (val) => {
  oldAvatar.value = val
  displayedAvatar.value = val
  loadExistingAvatar()
})

// Загрузка файла
function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement)?.files?.[0]
  if (file) {
    // Конвертируем файл в base64 вместо blob URL
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64Url = event.target?.result as string
      image.value = base64Url
      originalImage.value = base64Url // Сохраняем исходное изображение
      savedTransformations.value = null // Сбрасываем трансформации
    }
    reader.readAsDataURL(file)
  }
}

// Trigger file input
function triggerFileInput() {
  fileInput.value?.click()
}

// Change photo (reset to upload state)
function changePhoto() {
  image.value = null
  preview.value = null
  // Reset file input
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// Загружаем полное изображение из props
async function loadFullImage() {
  if (!propFullImageUrl.value) {
    return
  }

  try {
    const response = await fetch(propFullImageUrl.value)

    if (response.ok) {
      const blob = await response.blob()

      // Проверяем, что это изображение
      if (blob.type.startsWith('image/')) {
        const base64Url = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (event) => resolve(event.target?.result as string)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })

        image.value = base64Url
        originalImage.value = base64Url
        savedTransformations.value = null
        hasExistingAvatar.value = false
      }
    }
  } catch {
    // Ошибка загрузки изображения
  }
}

// Локальный preview
function updatePreview() {
  if (!cropper.value) return
  const { canvas } = cropper.value.getResult({ size: { width: 128, height: 128 } })
  if (canvas) {
    preview.value = canvas.toDataURL('image/png')
    displayedAvatar.value = preview.value || displayedAvatar.value
  }
}

// Восстановление трансформаций после загрузки кроппера
function restoreTransformations() {
  if (savedTransformations.value && cropper.value) {
    console.log('🔄 Restoring saved transformations:', savedTransformations.value)

    // Восстанавливаем трансформации через API кроппера
    try {
      // Пока что просто логируем - API кроппера может отличаться
      console.log('✅ Transformations would be restored here')
    } catch (e) {
      console.warn('Could not restore transformations:', e)
    }
  }
}

// Функция для конвертации blob URL в base64
async function blobUrlToBase64(blobUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fetch(blobUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const reader = new FileReader()
        reader.onload = () => {
          const base64 = reader.result as string
          resolve(base64)
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
      .catch(reject)
  })
}

// Функция для сжатия изображения
async function compressImage(
  base64: string,
  quality: number,
  maxWidth: number,
  maxHeight: number,
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        resolve(base64)
        return
      }

      // Вычисляем новые размеры с сохранением пропорций
      let { width, height } = img
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = width * ratio
        height = height * ratio
      }

      canvas.width = width
      canvas.height = height

      // Рисуем сжатое изображение
      ctx.drawImage(img, 0, 0, width, height)

      // Конвертируем в base64 с заданным качеством
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality)
      resolve(compressedBase64)
    }
    img.onerror = () => resolve(base64)
    img.src = base64
  })
}

// Обработчик клика на кнопку Save
async function handleSaveClick() {
  try {
    await saveAvatar()
  } catch (error) {
    console.error('❌ Save button error:', error)
  }
}

// Сохранение
async function saveAvatar() {
  console.log('💾 Save button clicked!')
  console.log('🔍 Cropper value:', cropper.value)

  if (!cropper.value) {
    console.error('❌ Cropper not initialized!')
    return
  }

  loading.value = true
  console.log('⏳ Loading started...')

  try {
    console.log('🎯 Getting cropper result...')
    const { canvas } = cropper.value.getResult({ size: { width: 256, height: 256 } })
    console.log('🎨 Canvas:', canvas)

    if (!canvas) {
      console.error('❌ Canvas not created!')
      return
    }

    console.log('🖼️ Converting canvas to data URL...')
    let croppedAvatar = canvas.toDataURL('image/jpeg', 0.8)
    console.log('📸 Original cropped avatar length:', croppedAvatar.length)

    // Сжимаем изображение если оно слишком большое
    if (croppedAvatar.length > 5 * 1024 * 1024) {
      console.log('🗜️ Compressing cropped avatar...')
      croppedAvatar = await compressImage(croppedAvatar, 0.6, 256, 256)
      console.log('🗜️ Compressed cropped avatar length:', croppedAvatar.length)
    }

    displayedAvatar.value = croppedAvatar

    // Используем оригинальное полное изображение из props, а не originalImage.value
    let fullImage = null
    if (propFullImageUrl.value && propFullImageUrl.value.includes('full-image')) {
      console.log('🔄 Using original full image from props:', propFullImageUrl.value)
      try {
        // Загружаем оригинальное полное изображение с сервера
        const response = await fetch(propFullImageUrl.value)
        console.log('🔍 Response status:', response.status)
        console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()))
        console.log('🔍 Response URL:', response.url)

        if (response.ok) {
          const blob = await response.blob()
          console.log('🔍 Blob size:', blob.size)
          console.log('🔍 Blob type:', blob.type)

          // Проверяем, что это действительно изображение
          if (blob.size < 1000 || !blob.type.startsWith('image/')) {
            console.error('❌ Server returned invalid image data:')
            console.error('  - Size:', blob.size, 'bytes')
            console.error('  - Type:', blob.type)
            console.error('  - This is not a valid image!')

            // Пробуем прочитать как текст, чтобы понять, что вернул сервер
            const text = await blob.text()
            console.error('  - Content preview:', text.substring(0, 200))

            // Используем fallback - originalImage.value
            console.log('🔄 Using fallback: originalImage.value')
            fullImage = originalImage.value
            if (fullImage && fullImage.startsWith('blob:')) {
              try {
                fullImage = await blobUrlToBase64(fullImage)
                console.log('✅ Converted fallback blob URL to base64')
              } catch (error) {
                console.error('❌ Failed to convert fallback blob URL:', error)
                fullImage = null
              }
            }
          } else {
            fullImage = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader()
              reader.onload = (event) => resolve(event.target?.result as string)
              reader.onerror = reject
              reader.readAsDataURL(blob)
            })
            console.log('✅ Loaded original full image, length:', fullImage.length)
          }
        } else {
          console.error('❌ Failed to load original full image:', response.status)
          console.log('🔄 Using fallback: originalImage.value')
          fullImage = originalImage.value
          if (fullImage && fullImage.startsWith('blob:')) {
            try {
              fullImage = await blobUrlToBase64(fullImage)
              console.log('✅ Converted fallback blob URL to base64')
            } catch (error) {
              console.error('❌ Failed to convert fallback blob URL:', error)
              fullImage = null
            }
          }
        }
      } catch (error) {
        console.error('❌ Error loading original full image:', error)
      }
    } else {
      console.log('⚠️ No original full image available, using originalImage.value as fallback')
      fullImage = originalImage.value
      if (fullImage && fullImage.startsWith('blob:')) {
        console.log('🔄 Converting blob URL to base64...')
        try {
          fullImage = await blobUrlToBase64(fullImage)
          console.log('✅ Converted blob URL to base64, length:', fullImage.length)
        } catch (error) {
          console.error('❌ Failed to convert blob URL to base64:', error)
          fullImage = null
        }
      }
    }

    // Сжимаем full image если оно слишком большое
    if (fullImage && fullImage.length > 5 * 1024 * 1024) {
      console.log('🗜️ Compressing full image...')
      fullImage = await compressImage(fullImage, 0.7, 1024, 1024)
      console.log('🗜️ Compressed full image length:', fullImage.length)
    }

    // Подготавливаем данные для отправки на сервер
    const avatarData = {
      fullImage: fullImage, // Полное оригинальное фото (сжатое)
      croppedAvatar: croppedAvatar, // Обрезанный круглый аватар (сжатый)
      transformations: savedTransformations.value,
    }

    // Отправляем данные на сервер
    const serverResponse = await uploadAvatarToServer(avatarData)

    if (!serverResponse.success) {
      throw new Error('Avatar upload failed')
    }

    console.log('✅ Avatar saved to server successfully')
    console.log('🔗 Server avatar URL:', serverResponse.avatarUrl)
    console.log('🔗 Server full image URL:', serverResponse.fullImageUrl)

    const savedPayload = {
      croppedAvatar:
        resolveApiMediaUrl(serverResponse.avatarUrl) ||
        avatarData.croppedAvatar,
      fullImage:
        resolveApiMediaUrl(serverResponse.fullImageUrl) ||
        resolveApiMediaUrl(serverResponse.avatarUrl) ||
        avatarData.fullImage ||
        avatarData.croppedAvatar,
    }

    // Сохраняем трансформации для возможности повторного редактирования
    if (originalImage.value) {
      // Сохраняем состояние кроппера (упрощенная версия)
      savedTransformations.value = {
        // Пока что сохраняем только базовую информацию
        coordinates: null,
        visibleArea: null,
        imageSize: null,
      }

      // Сохраняем в localStorage для восстановления при следующем открытии
      try {
        localStorage.setItem('avatar_original_image', originalImage.value)
        localStorage.setItem('avatar_transformations', JSON.stringify(savedTransformations.value))
      } catch (e) {
        console.warn('Could not save to localStorage:', e)
      }
    }

    // Notify parent with server URLs (not base64 blobs).
    emit('avatar-saved', savedPayload)
  } catch (error) {
    console.error('❌ Error saving avatar:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      cropper: !!cropper.value,
      originalImage: !!originalImage.value,
    })
    // Можно добавить уведомление об ошибке пользователю
  } finally {
    console.log('🏁 Loading finished')
    loading.value = false
  }
}

// Функция для отправки аватара на сервер
async function uploadAvatarToServer(avatarData: {
  fullImage: string | null
  croppedAvatar: string
  transformations: unknown
}) {
  try {
    console.log('📸 Uploading avatar to server...')

    const formData = new FormData()

    // Конвертируем base64 в File объекты
    if (avatarData.fullImage) {
      console.log('🖼️ Converting full image to File...')
      console.log('🖼️ Full image base64 length:', avatarData.fullImage.length)
      console.log('🖼️ Full image base64 start:', avatarData.fullImage.substring(0, 50) + '...')

      const fullImageFile = await base64ToFile(avatarData.fullImage, 'full-image.png')
      formData.append('full_image', fullImageFile)
    }

    console.log('🖼️ Converting cropped avatar to File...')
    console.log('🖼️ Cropped avatar base64 length:', avatarData.croppedAvatar.length)
    console.log(
      '🖼️ Cropped avatar base64 start:',
      avatarData.croppedAvatar.substring(0, 50) + '...',
    )

    const croppedAvatarFile = await base64ToFile(avatarData.croppedAvatar, 'avatar.png')
    formData.append('avatar', croppedAvatarFile)

    // Проверяем размеры файлов перед отправкой
    console.log('📊 File size checks:')
    console.log('🔍 avatarData.fullImage length:', avatarData.fullImage?.length)
    console.log('🔍 avatarData.fullImage start:', avatarData.fullImage?.substring(0, 50))
    if (avatarData.fullImage) {
      const fullImageFile = formData.get('full_image') as File
      console.log(
        `  Full image: ${fullImageFile?.name}, ${fullImageFile?.size} bytes, ${fullImageFile?.type}`,
      )
      console.log('🔍 Full image file content preview:', fullImageFile?.name)
    }
    const avatarFile = formData.get('avatar') as File
    console.log(`  Avatar: ${avatarFile?.name}, ${avatarFile?.size} bytes, ${avatarFile?.type}`)
    console.log('🔍 Avatar file content preview:', avatarFile?.name)

    // Проверяем, что файлы не пустые и не слишком большие
    if (avatarFile && (avatarFile.size === 0 || avatarFile.size > 5 * 1024 * 1024)) {
      throw new Error(`Invalid avatar file: size ${avatarFile.size} bytes`)
    }

    // Отправляем на сервер
    console.log('📡 Sending request to:', '/api/v1/profile/avatar-images')
    console.log('📡 FormData contents:')
    for (const [key, value] of formData.entries()) {
      console.log(
        `  ${key}:`,
        value instanceof File ? `File(${value.name}, ${value.size} bytes, ${value.type})` : value,
      )
    }

    // Используем правильный эндпоинт для загрузки аватара
    const endpoint = '/api/v1/profile/avatar'

    console.log(`📡 Using correct endpoint: ${endpoint}`)

    // Отправляем запрос на правильный эндпоинт
    const response = await api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    console.log(`✅ Success with endpoint: ${endpoint}`)
    console.log(`📊 Response status: ${response.status}`)
    console.log(`📊 Response data: ${response.data}`)
    console.log(`📊 Response headers:`, response.headers)

    console.log('✅ Avatar upload response:', response.data)
    console.log('📊 Response status:', response.status)
    console.log('📊 Response headers:', response.headers)

    // Обрабатываем ответ от сервера согласно вашему API
    if (response.status === 200 || response.status === 201) {
      console.log('📄 Raw response data:', response.data)
      console.log('📄 Response data type:', typeof response.data)

      // Если сервер вернул пустой ответ, но статус успешный
      if (!response.data || response.data === '') {
        console.log('⚠️ Server returned empty response, but status is successful')
        return {
          success: true,
          avatarUrl: null,
          fullImageUrl: null,
          serverData: null,
          message: 'Avatar uploaded successfully (no URLs returned)',
        }
      }

      // Если есть данные в ожидаемом формате
      if (response.data && response.data.data) {
        const { avatar_url, full_image_url } = response.data.data

        console.log('✅ Avatar uploaded successfully')
        console.log('🔗 Avatar URL:', avatar_url)
        console.log('🔗 Full Image URL:', full_image_url)

        return {
          success: true,
          avatarUrl: avatar_url,
          fullImageUrl: full_image_url,
          serverData: response.data.data,
        }
      }

      // Если данные в другом формате
      if (response.data) {
        console.log('📄 Server response format:', typeof response.data)
        console.log('📄 Server response keys:', Object.keys(response.data))

        return {
          success: true,
          avatarUrl: response.data.avatar_url || response.data.avatarUrl,
          fullImageUrl: response.data.full_image_url || response.data.fullImageUrl,
          serverData: response.data,
          message: 'Avatar uploaded successfully (different format)',
        }
      }
    }

    // Если ничего не подошло
    console.log('❌ Unexpected server response format')
    console.log('❌ Response data:', response.data)
    console.log('❌ Response status:', response.status)

    throw new Error(
      `Invalid server response: ${response.status} - ${JSON.stringify(response.data)}`,
    )
  } catch (error) {
    console.error('❌ Avatar upload error:', error)

    // Детальная информация об ошибке
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as {
        response?: {
          data?: unknown
          status?: number
          statusText?: string
        }
      }

      console.error('🔍 Detailed error info:', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }

    throw error
  }
}

// Функция для конвертации base64 в File (улучшенная версия)
async function base64ToFile(base64: string, filename: string): Promise<File> {
  try {
    console.log('🔄 Converting base64 to File:', {
      base64Length: base64.length,
      base64Start: base64.substring(0, 50) + '...',
      filename,
    })

    // Используем более надежный метод через fetch
    const response = await fetch(base64)
    const blob = await response.blob()
    const file = new File([blob], filename, { type: blob.type || 'image/png' })

    console.log('✅ Successfully converted to File:', {
      filename,
      size: file.size,
      type: file.type,
    })

    // Проверяем размер файла (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size too large. Maximum size is 5MB.')
    }

    // Проверяем, что файл не пустой
    if (file.size === 0) {
      throw new Error('File is empty.')
    }

    return file
  } catch (error) {
    console.error('❌ Error converting base64 to File:', error)
    console.error('❌ Base64 string:', base64.substring(0, 100) + '...')

    // Fallback к старому методу если fetch не работает
    console.log('🔄 Trying fallback method...')
    return base64ToFileFallback(base64, filename)
  }
}

// Fallback метод для конвертации base64 в File
function base64ToFileFallback(base64: string, filename: string): Promise<File> {
  return new Promise((resolve, reject) => {
    try {
      // Проверяем, есть ли префикс data:image
      let base64Data: string
      if (base64.includes(',')) {
        // Убираем data:image/png;base64, префикс
        base64Data = base64.split(',')[1]
        console.log('📝 Removed data URL prefix, base64 length:', base64Data.length)
      } else {
        // Если нет префикса, используем как есть
        base64Data = base64
        console.log('📝 Using base64 as-is, length:', base64Data.length)
      }

      // Очищаем base64 от возможных пробелов и переносов строк
      base64Data = base64Data.replace(/\s/g, '')
      console.log('🧹 Cleaned base64, length:', base64Data.length)

      // Проверяем, что base64 строка валидна
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Data)) {
        throw new Error('Invalid base64 string format')
      }

      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }

      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'image/png' })
      const file = new File([blob], filename, { type: 'image/png' })

      console.log('✅ Successfully converted to File (fallback):', {
        filename,
        size: file.size,
        type: file.type,
      })

      // Проверяем размер файла (максимум 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size too large. Maximum size is 5MB.')
      }

      // Проверяем, что файл не пустой
      if (file.size === 0) {
        throw new Error('File is empty.')
      }

      resolve(file)
    } catch (error) {
      console.error('❌ Error converting base64 to File (fallback):', error)
      console.error('❌ Base64 string:', base64.substring(0, 100) + '...')
      reject(error)
    }
  })
}

// Управление
function zoomIn() {
  cropper.value?.zoom(1.1)
}
function zoomOut() {
  cropper.value?.zoom(0.9)
}
function rotateLeft() {
  cropper.value?.rotate(-90)
}
function rotateRight() {
  cropper.value?.rotate(90)
}
</script>

<style scoped>
.cropper {
  width: 320px;
  height: 320px;
  border-radius: 12px;
  overflow: hidden;
  margin: auto;
  border: 2px solid #e5e7eb;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  cursor: grab;
}

.cropper:active {
  cursor: grabbing;
}

/* Отключаем AI помощника браузера */
.cropper img {
  pointer-events: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: #ffffff;
  color: #374151;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.15s ease-in-out;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  width: 2rem;
  height: 2rem;
}

.btn:hover {
  background-color: #f9fafb;
  border-color: #9ca3af;
  box-shadow:
    0 1px 3px 0 rgba(0, 0, 0, 0.1),
    0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

.btn:active {
  transform: translateY(1px);
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.15s ease-in-out;
  box-shadow:
    0 4px 6px -1px rgba(59, 130, 246, 0.3),
    0 2px 4px -1px rgba(59, 130, 246, 0.2);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  box-shadow:
    0 6px 8px -1px rgba(59, 130, 246, 0.4),
    0 4px 6px -1px rgba(59, 130, 246, 0.3);
  transform: translateY(-1px);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  background-color: #ffffff;
  color: #374151;
  transition: all 0.15s ease-in-out;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  cursor: pointer;
}

.btn-icon:hover {
  background-color: #f3f4f6;
  border-color: #6b7280;
  box-shadow:
    0 2px 4px 0 rgba(0, 0, 0, 0.1),
    0 1px 2px 0 rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.btn-icon:active {
  transform: translateY(1px);
}

.btn-primary-compact {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.15s ease-in-out;
  box-shadow:
    0 4px 6px -1px rgba(59, 130, 246, 0.3),
    0 2px 4px -1px rgba(59, 130, 246, 0.2);
}

.btn-primary-compact:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  box-shadow:
    0 6px 8px -1px rgba(59, 130, 246, 0.4),
    0 4px 6px -1px rgba(59, 130, 246, 0.3);
  transform: translateY(-1px);
}

.btn-primary-compact:active:not(:disabled) {
  transform: translateY(0);
}

.btn-primary-compact:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Loader spinner */
.loader {
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .cropper {
    width: 280px;
    height: 280px;
  }
}
</style>

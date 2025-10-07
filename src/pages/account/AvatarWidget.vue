<template>
  <div class="relative inline-block">
    <!-- Avatar -->
    <div class="avatar-container">
      <img
        v-if="avatar && !isDefaultAvatar"
        :src="avatar"
        alt="Avatar"
        class="avatar-img cursor-pointer hover:opacity-80 transition-opacity"
        @click="showFullPhoto"
        :title="hasFullPhoto ? 'Click to view full photo' : 'Click to edit avatar'"
      />
      <div
        v-else
        class="avatar-placeholder cursor-pointer hover:opacity-80 transition-opacity"
        @click="showFullPhoto"
        title="Click to edit avatar"
      >
        <svg class="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
          <path
            d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
          />
        </svg>
      </div>
    </div>

    <!-- Camera overlay -->
    <button class="camera-btn" @click="openModal" title="Edit avatar">📷</button>

    <!-- Avatar Editor Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay p-2 sm:p-4" @click.self="closeModal">
        <Transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-4"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-4"
        >
          <div v-if="showModal" class="modal-box">
            <div class="flex justify-between items-center mb-3 sm:mb-4">
              <h2 class="text-base sm:text-lg font-semibold">Update Avatar</h2>
              <button @click="closeModal" class="text-gray-500 hover:text-black">✖</button>
            </div>

            <AvatarUploaderComponent
              :initial-avatar="avatar"
              :full-image-url="originalFullPhoto"
              :upload-url="uploadUrl"
              @avatar-saved="onAvatarSaved"
            />
          </div>
        </Transition>
      </div>
    </Teleport>

    <!-- Full Photo Modal -->
    <Teleport to="body">
      <div v-if="showFullPhotoModal" class="modal-overlay" @click.self="closeFullPhoto">
        <Transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div v-if="showFullPhotoModal" class="full-photo-modal">
            <div class="flex justify-between items-center mb-3 sm:mb-4">
              <h2 class="text-base sm:text-lg font-semibold">Full Photo</h2>
              <button @click="closeFullPhoto" class="text-gray-500 hover:text-black">✖</button>
            </div>
            <div class="flex justify-center items-center min-h-0 flex-1">
              <img
                :src="fullPhotoUrlComputed"
                alt="Full photo"
                class="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </Transition>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import AvatarUploaderComponent from './AvatarUploaderComponent.vue'

const props = defineProps({
  initialAvatar: { type: String, default: '/images/default-avatar.png' },
  fullPhotoUrl: { type: String, default: '' },
  uploadUrl: { type: String, default: '/api/upload-avatar' },
})

const emit = defineEmits(['avatar-updated', 'avatar-saved'])

const showModal = ref(false)
const showFullPhotoModal = ref(false)
const avatar = ref(props.initialAvatar)
const fullPhoto = ref(props.fullPhotoUrl)
const originalFullPhoto = ref(props.fullPhotoUrl) // Сохраняем оригинальное полное изображение

// Инициализируем fullPhoto и originalFullPhoto при загрузке
if (props.fullPhotoUrl) {
  fullPhoto.value = props.fullPhotoUrl

  // originalFullPhoto устанавливаем ТОЛЬКО если это полное изображение (не аватар)
  if (props.fullPhotoUrl.includes('full-image') && !props.fullPhotoUrl.includes('avatar')) {
    originalFullPhoto.value = props.fullPhotoUrl
  }
} else if (props.initialAvatar && !props.initialAvatar.includes('default-avatar')) {
  fullPhoto.value = props.initialAvatar
  // НЕ устанавливаем originalFullPhoto для аватара
}

// Watch for changes in initialAvatar
watch(
  () => props.initialAvatar,
  (newAvatar) => {
    avatar.value = newAvatar
  },
  { immediate: true },
)

// Watch for changes in fullPhotoUrl
watch(
  () => props.fullPhotoUrl,
  (newFullPhoto) => {
    fullPhoto.value = newFullPhoto

    // Обновляем оригинальное изображение ТОЛЬКО если это новое изображение
    // (не обрезанный аватар, а полное изображение)
    if (newFullPhoto && !newFullPhoto.includes('avatar') && newFullPhoto.includes('full-image')) {
      originalFullPhoto.value = newFullPhoto
    }
  },
  { immediate: true },
)

// Отдельный watcher для отслеживания изменений оригинального изображения
watch(
  () => originalFullPhoto.value,
  () => {
    // originalFullPhoto changed
  },
  { immediate: true },
)

// Computed properties
const isDefaultAvatar = computed(() => {
  return (
    !avatar.value ||
    avatar.value === '/images/default-avatar.png' ||
    avatar.value === '/default-avatar.png' ||
    avatar.value.includes('default-avatar')
  )
})

const hasFullPhoto = computed(() => {
  return (
    fullPhoto.value &&
    fullPhoto.value !== '/default-avatar.png' &&
    !fullPhoto.value.includes('default-avatar')
  )
})

const fullPhotoUrlComputed = computed(() => {
  return fullPhoto.value || avatar.value
})

// Modal functions
function openModal() {
  // Просто открываем диалог - AvatarUploaderComponent сам загрузит нужные данные
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

function showFullPhoto() {
  if (hasFullPhoto.value) {
    showFullPhotoModal.value = true
  } else {
    openModal()
  }
}

function closeFullPhoto() {
  showFullPhotoModal.value = false
}

// Обработчик события avatar-saved от AvatarUploaderComponent
function onAvatarSaved(avatarData: { croppedAvatar: string; fullImage: string } | string) {
  if (typeof avatarData === 'string') {
    // Старый формат (только обрезанный аватар)
    avatar.value = avatarData
    fullPhoto.value = avatarData // Используем тот же URL для полного фото
    // НЕ обновляем originalFullPhoto для старого формата
  } else {
    // Новый формат (объект с двумя изображениями)
    avatar.value = avatarData.croppedAvatar
    fullPhoto.value = avatarData.fullImage
    // НЕ обновляем originalFullPhoto - сохраняем оригинальное полное изображение
  }

  closeModal()
  emit('avatar-saved', avatarData)
}
</script>

<style scoped>
.avatar-container {
  position: relative;
  width: 80px;
  height: 80px;
}

.avatar-img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 2px solid #e5e7eb;
  object-fit: cover;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 2px solid #e5e7eb;
  background-color: #f9fafb;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* Camera button */
.camera-btn {
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 50%;
  padding: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-size: 16px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.camera-btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
  transform: scale(1.05);
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 1rem;
}

.modal-box {
  background: white;
  border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  padding: 1.5rem;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.full-photo-modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  padding: 1.5rem;
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .modal-box {
    margin: 0.25rem;
    max-width: calc(100vw - 0.5rem);
    max-height: calc(100vh - 0.5rem);
    padding: 0.75rem;
  }

  .full-photo-modal {
    margin: 0.25rem;
    max-width: calc(100vw - 0.5rem);
    max-height: calc(100vh - 0.5rem);
    padding: 0.75rem;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: auto;
    height: auto;
    display: flex;
    flex-direction: column;
  }
}
</style>

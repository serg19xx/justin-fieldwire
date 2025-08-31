<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-6">Image Cropper Demo</h1>

    <ImageCropper
      :aspect-ratio="1"
      :quality="0.9"
      format="image/jpeg"
      @crop="handleCrop"
      @cancel="handleCancel"
    />

    <div v-if="croppedImage" class="mt-6">
      <h2 class="text-lg font-semibold mb-4">Cropped Result:</h2>
      <img :src="croppedImage" alt="Cropped" class="max-w-xs rounded-lg shadow" />
      <p class="text-sm text-gray-600 mt-2">File size: {{ fileSize }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ImageCropper from './ImageCropper.vue'

const croppedImage = ref<string>('')
const fileSize = ref<string>('')

function handleCrop(file: File) {
  const reader = new FileReader()
  reader.onload = (e) => {
    croppedImage.value = e.target?.result as string
    fileSize.value = `${(file.size / 1024).toFixed(1)} KB`
  }
  reader.readAsDataURL(file)
}

function handleCancel() {
  croppedImage.value = ''
  fileSize.value = ''
}
</script>

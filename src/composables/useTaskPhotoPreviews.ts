import { onBeforeUnmount, reactive } from 'vue'
import { taskFieldPhotosApi, type TaskFieldPhoto } from '@/core/utils/task-field-photos-api'

type PhotoRef = Pick<TaskFieldPhoto, 'id' | 'project_id' | 'task_id'>

/**
 * Photo downloads need the auth header, so previews are fetched as blobs and shown via object URLs.
 * URLs are cached per photo id and revoked when the component unmounts.
 */
export function useTaskPhotoPreviews() {
  const previewUrls = reactive<Record<number, string>>({})
  const failedIds = reactive<Record<number, boolean>>({})
  const pending = new Map<number, Promise<void>>()

  function loadPreview(photo: PhotoRef): Promise<void> {
    if (previewUrls[photo.id] || failedIds[photo.id]) return Promise.resolve()
    const existing = pending.get(photo.id)
    if (existing) return existing
    const job = taskFieldPhotosApi
      .download(photo.project_id, photo.task_id, photo.id, true)
      .then((blob) => {
        previewUrls[photo.id] = URL.createObjectURL(blob)
      })
      .catch(() => {
        failedIds[photo.id] = true
      })
      .finally(() => {
        pending.delete(photo.id)
      })
    pending.set(photo.id, job)
    return job
  }

  async function loadPreviews(photos: PhotoRef[]): Promise<void> {
    await Promise.all(photos.map(loadPreview))
  }

  function forgetPreview(photoId: number): void {
    const url = previewUrls[photoId]
    if (url) URL.revokeObjectURL(url)
    delete previewUrls[photoId]
    delete failedIds[photoId]
  }

  onBeforeUnmount(() => {
    Object.values(previewUrls).forEach((url) => URL.revokeObjectURL(url))
  })

  return { previewUrls, failedIds, loadPreview, loadPreviews, forgetPreview }
}

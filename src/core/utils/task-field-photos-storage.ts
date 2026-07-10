export type TaskFieldPhotoSlot = 'before' | 'after'

export interface TaskFieldPhotoRecord {
  id: string
  dataUrl: string
  fileName: string
  uploadedAt: string
}

export const MAX_TASK_FIELD_PHOTOS_PER_SLOT = 15

const IMAGE_EXT_RE = /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i

function storageKey(projectId: number, taskId: string, slot: TaskFieldPhotoSlot): string {
  return `fw_task_field_photo_${projectId}_${taskId}_${slot}`
}

function newPhotoId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `photo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function normalizePhotoRecord(raw: unknown): TaskFieldPhotoRecord | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  if (typeof row.dataUrl !== 'string' || !row.dataUrl) return null
  return {
    id: typeof row.id === 'string' && row.id ? row.id : newPhotoId(),
    dataUrl: row.dataUrl,
    fileName: typeof row.fileName === 'string' ? row.fileName : 'photo.jpg',
    uploadedAt: typeof row.uploadedAt === 'string' ? row.uploadedAt : new Date().toISOString(),
  }
}

function persistPhotos(
  projectId: number,
  taskId: string,
  slot: TaskFieldPhotoSlot,
  photos: TaskFieldPhotoRecord[],
): void {
  try {
    localStorage.setItem(storageKey(projectId, taskId, slot), JSON.stringify(photos))
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      throw new Error('Photo storage is full on this device. Remove some photos or use smaller images.')
    }
    throw new Error('Could not save photo on this device.')
  }
}

export function isAcceptedImageFile(file: File): boolean {
  const type = (file.type || '').toLowerCase()
  if (type.startsWith('image/')) return true
  return IMAGE_EXT_RE.test(file.name)
}

function isHeicLike(file: File): boolean {
  const type = (file.type || '').toLowerCase()
  return (
    /\.heic$/i.test(file.name) ||
    /\.heif$/i.test(file.name) ||
    type === 'image/heic' ||
    type === 'image/heif'
  )
}

async function isHeicByMagic(file: File): Promise<boolean> {
  try {
    const head = await file.slice(0, 16).arrayBuffer()
    const text = new TextDecoder().decode(head)
    if (!text.includes('ftyp')) return false
    return /heic|heif|mif1|msf1/i.test(text)
  } catch {
    return false
  }
}

async function convertHeicToJpeg(file: File): Promise<File> {
  const { default: heic2any } = await import('heic2any')
  const converted = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.85,
  })
  const blob = Array.isArray(converted) ? converted[0] : converted
  const baseName = file.name.replace(/\.(heic|heif)$/i, '') || 'photo'
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' })
}

/** Normalize Mac HEIC and other formats the browser cannot decode directly. */
async function normalizeImageFile(file: File): Promise<File> {
  if (isHeicLike(file) || (await isHeicByMagic(file))) {
    return convertHeicToJpeg(file)
  }
  return file
}

export function readTaskFieldPhotos(
  projectId: number,
  taskId: string,
  slot: TaskFieldPhotoSlot,
): TaskFieldPhotoRecord[] {
  try {
    const raw = localStorage.getItem(storageKey(projectId, taskId, slot))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      return parsed
        .map(normalizePhotoRecord)
        .filter((p): p is TaskFieldPhotoRecord => p != null)
        .sort((a, b) => a.uploadedAt.localeCompare(b.uploadedAt))
    }
    const legacy = normalizePhotoRecord(parsed)
    if (!legacy) return []
    const migrated = [legacy]
    persistPhotos(projectId, taskId, slot, migrated)
    return migrated
  } catch {
    return []
  }
}

/** @deprecated Use {@link readTaskFieldPhotos} */
export function readTaskFieldPhoto(
  projectId: number,
  taskId: string,
  slot: TaskFieldPhotoSlot,
): TaskFieldPhotoRecord | null {
  const photos = readTaskFieldPhotos(projectId, taskId, slot)
  return photos[0] ?? null
}

export function appendTaskFieldPhoto(
  projectId: number,
  taskId: string,
  slot: TaskFieldPhotoSlot,
  record: Omit<TaskFieldPhotoRecord, 'id'> & { id?: string },
): TaskFieldPhotoRecord[] {
  const existing = readTaskFieldPhotos(projectId, taskId, slot)
  if (existing.length >= MAX_TASK_FIELD_PHOTOS_PER_SLOT) {
    throw new Error(`Maximum ${MAX_TASK_FIELD_PHOTOS_PER_SLOT} photos per section.`)
  }
  const next: TaskFieldPhotoRecord = {
    id: record.id ?? newPhotoId(),
    dataUrl: record.dataUrl,
    fileName: record.fileName,
    uploadedAt: record.uploadedAt,
  }
  const photos = [...existing, next]
  persistPhotos(projectId, taskId, slot, photos)
  return photos
}

export function removeTaskFieldPhoto(
  projectId: number,
  taskId: string,
  slot: TaskFieldPhotoSlot,
  photoId: string,
): TaskFieldPhotoRecord[] {
  const photos = readTaskFieldPhotos(projectId, taskId, slot).filter((p) => p.id !== photoId)
  persistPhotos(projectId, taskId, slot, photos)
  return photos
}

/** @deprecated Use {@link appendTaskFieldPhoto} */
export function writeTaskFieldPhoto(
  projectId: number,
  taskId: string,
  slot: TaskFieldPhotoSlot,
  record: Omit<TaskFieldPhotoRecord, 'id'> & { id?: string },
): void {
  appendTaskFieldPhoto(projectId, taskId, slot, record)
}

export function clearTaskFieldPhoto(
  projectId: number,
  taskId: string,
  slot: TaskFieldPhotoSlot,
): void {
  try {
    localStorage.removeItem(storageKey(projectId, taskId, slot))
  } catch {
    /* ignore */
  }
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      void img.decode().then(() => resolve(img)).catch(() => resolve(img))
    }
    img.onerror = () => reject(new Error('decode_failed'))
    img.src = src
  })
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('read_failed'))
    }
    reader.onerror = () => reject(new Error('read_failed'))
    reader.readAsDataURL(file)
  })
}

async function loadImageSource(file: File): Promise<{
  width: number
  height: number
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
  cleanup: () => void
}> {
  const errors: string[] = []

  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file)
      return {
        width: bitmap.width,
        height: bitmap.height,
        draw: (ctx, w, h) => {
          ctx.drawImage(bitmap, 0, 0, w, h)
        },
        cleanup: () => bitmap.close(),
      }
    } catch {
      errors.push('bitmap')
    }
  }

  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await loadImageElement(objectUrl)
    return {
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      draw: (ctx, w, h) => {
        ctx.drawImage(img, 0, 0, w, h)
      },
      cleanup: () => URL.revokeObjectURL(objectUrl),
    }
  } catch {
    URL.revokeObjectURL(objectUrl)
    errors.push('blob')
  }

  try {
    const dataUrl = await readFileAsDataUrl(file)
    const img = await loadImageElement(dataUrl)
    return {
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      draw: (ctx, w, h) => {
        ctx.drawImage(img, 0, 0, w, h)
      },
      cleanup: () => {},
    }
  } catch {
    errors.push('dataurl')
  }

  throw new Error(
    'Could not open this file. On Mac: export the photo as JPEG (not HEIC), or use a JPG/PNG screenshot.',
  )
}

/** Resize/compress image for localStorage (max ~1200px, JPEG). */
export async function fileToCompressedDataUrl(file: File, maxEdge = 1200): Promise<string> {
  if (!file.size) {
    throw new Error('Empty file.')
  }
  if (!isAcceptedImageFile(file)) {
    throw new Error('Please choose a JPG, PNG, or WebP image.')
  }

  let workingFile = file
  try {
    workingFile = await normalizeImageFile(file)
  } catch {
    throw new Error(
      'HEIC photo could not be converted. Export as JPEG from Photos, or use a JPG/PNG file.',
    )
  }

  const source = await loadImageSource(workingFile)
  try {
    let { width, height } = source
    if (!width || !height) {
      throw new Error('Invalid image dimensions.')
    }
    const scale = Math.min(1, maxEdge / Math.max(width, height))
    width = Math.max(1, Math.round(width * scale))
    height = Math.max(1, Math.round(height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Canvas not supported in this browser.')
    }
    source.draw(ctx, width, height)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.82)
    if (!dataUrl.startsWith('data:image/')) {
      throw new Error('Could not compress image. Try JPG or PNG.')
    }
    return dataUrl
  } finally {
    source.cleanup()
  }
}

/** Compress image client-side and return a JPEG File ready for server upload. */
export async function fileToCompressedUploadFile(file: File, maxEdge = 1200): Promise<File> {
  const dataUrl = await fileToCompressedDataUrl(file, maxEdge)
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  const baseName = file.name.replace(/\.[^.]+$/i, '') || 'photo'
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' })
}

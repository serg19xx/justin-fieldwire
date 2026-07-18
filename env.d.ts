/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_APP_ENV: string
  readonly VITE_APP_TITLE: string
  readonly VITE_VAPID_PUBLIC_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'heic2any' {
  interface Heic2AnyOptions {
    blob: Blob
    toType?: string
    quality?: number
  }
  function heic2any(options: Heic2AnyOptions): Promise<Blob | Blob[]>
  export default heic2any
}

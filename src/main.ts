import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { registerSW } from 'virtual:pwa-register'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './core/stores/auth'

registerSW({ immediate: true })

async function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)

  const authStore = useAuthStore()
  try {
    await authStore.initializeAuth()
  } catch (error) {
    console.error('Failed to initialize auth:', error)
  }

  app.use(router)
  app.mount('#app')
}

bootstrap()

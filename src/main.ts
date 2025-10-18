import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './core/stores/auth'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Initialize auth store
const authStore = useAuthStore()
authStore.initializeAuth().catch((error) => {
  console.error('Failed to initialize auth:', error)
})

app.mount('#app')


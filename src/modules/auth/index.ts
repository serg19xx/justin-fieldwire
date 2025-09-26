// Auth module exports
export { default as AuthGuard } from './components/AuthGuard.vue'
export { default as CategoryRouter } from './components/CategoryRouter.vue'
export { default as LoginForm } from './components/LoginForm.vue'
export { default as TwoFactorDialog } from './components/TwoFactorDialog.vue'

// Views
export { default as LoginView } from './views/LoginView.vue'
export { default as GlobalDashboardView } from './views/GlobalDashboardView.vue'
export { default as ProjectDashboardView } from './views/ProjectDashboardView.vue'
export { default as TaskDashboardView } from './views/TaskDashboardView.vue'

// Stores
export { useAuthStore } from '@/core/stores/auth'

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/core/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Login routes
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/auth/views/LoginView.vue'),
    },
    {
      path: '/password-change',
      name: 'password-change',
      component: () => import('@/pages/auth/views/PasswordChangeView.vue'),
      meta: { requiresAuth: true },
    },

    // Main application routes
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/dashboard',
      component: () => {
        const authStore = useAuthStore()
        const roleCategory = authStore.currentUser?.role_category

        console.log('🔍 Router dashboard debug:', { roleCategory })

        // Global users get GlobalDashboard
        if (roleCategory === 'global') {
          return import('../pages/dashboard/GlobalDashboard.vue')
        }

        // Project Managers get ProjectDashboard
        if (roleCategory === 'project') {
          return import('../pages/dashboard/ProjectDashboard.vue')
        }

        // Task Executors get TaskDashboard
        if (roleCategory === 'task') {
          return import('../pages/dashboard/TaskDashboard.vue')
        }

        // Default fallback
        return import('../pages/dashboard/ProjectDashboard.vue')
      },
    },
    {
      path: '/team',
      component: () => {
        const authStore = useAuthStore()
        const roleCategory = authStore.currentUser?.role_category
        return roleCategory === 'global'
          ? import('../pages/team/TeamAdmin.vue')
          : import('../pages/team/TeamPrj.vue')
      },
    },
    {
      path: '/tasks',
      component: () => {
        const authStore = useAuthStore()
        const roleCode = authStore.currentUser?.role_code

        console.log('🔍 Router tasks debug:', { roleCode })

        // All users get Tasks.vue for now
        return import('../pages/tasks/Tasks.vue')
      },
    },
    {
      path: '/reports',
      component: () => {
        const authStore = useAuthStore()
        const roleCode = authStore.currentUser?.role_code

        console.log('🔍 Router reports debug:', { roleCode })

        // All users get Reports.vue for now
        return import('../pages/reports/Reports.vue')
      },
    },
    {
      path: '/account',
      component: () => {
        const authStore = useAuthStore()
        const roleCode = authStore.currentUser?.role_code

        console.log('🔍 Router account debug:', { roleCode })

        // All users get Account.vue for now
        return import('../pages/account/Account.vue')
      },
    },
    {
      path: '/projects',
      component: () => {
        const authStore = useAuthStore()
        const roleCode = authStore.currentUser?.role_code

        console.log('🔍 Router projects debug:', { roleCode })

        // All users get ProjectsPrj for now
        return import('../pages/projects/ProjectsPrj.vue')
      },
    },
    {
      path: '/projects/:id',
      component: () => {
        const authStore = useAuthStore()
        const roleCode = authStore.currentUser?.role_code

        console.log('🔍 Router project detail debug:', { roleCode })

        // All users get ProjectDetailPrj (layout is handled by App.vue)
        return import('../pages/projects/ProjectDetailPrj.vue')
      },
    },
  ],
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Allow access to login and password change pages
  if (to.path === '/login' || to.path === '/password-change') {
    next()
    return
  }

  // Redirect to login if not authenticated
  if (!authStore.isAuthenticated) {
    next('/login')
    return
  }

  // Redirect to dashboard if already logged in and trying to access login
  if (to.path === '/login' && authStore.isAuthenticated) {
    next('/dashboard')
    return
  }

  next()
})

export default router

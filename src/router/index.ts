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
      meta: { requiresAuth: false }, // Allow access for users with temporary passwords
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('@/pages/auth/views/ResetPasswordView.vue'),
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

        // Redirect to projects for now since tasks are handled within projects
        return import('../pages/projects/ProjectsPrj.vue')
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
router.beforeEach(async (to, from, next) => {
  console.log('🛡️ Router guard checking:', { to: to.path, from: from.path })

  const authStore = useAuthStore()

  // All routes require authentication by default

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/reset-password']

  if (publicRoutes.includes(to.path)) {
    console.log('🛡️ Public route - allowing access')
    next()
    return
  }

  // Check if user is authenticated
  if (!authStore.isAuthenticated) {
    console.log('🛡️ User not authenticated - redirecting to login')
    next('/login')
    return
  }

  // Session check disabled for development
  // try {
  //   const isValid = await authStore.checkSession()
  //   if (!isValid) {
  //     console.log('🛡️ Session invalid - redirecting to login')
  //     next('/login')
  //     return
  //   }
  // } catch {
  //   console.log('🛡️ Session check failed - redirecting to login')
  //   next('/login')
  //   return
  // }

  console.log('🛡️ Access granted')
  next()
})

export default router

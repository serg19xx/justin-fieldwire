import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/core/stores/auth'

// Import layouts
import GlobalLayout from '@/layouts/GlobalLayout.vue'
import ProjectLayout from '@/layouts/ProjectLayout.vue'
import TaskLayout from '@/layouts/TaskLayout.vue'

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

    // Main application route with dynamic layout
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/dashboard',
      component: () => {
        const authStore = useAuthStore()
        const category = authStore.currentUser?.role_category

        switch (category) {
          case 'global':
            return GlobalLayout
          case 'project':
            return ProjectLayout
          case 'task':
            return TaskLayout
          default:
            return GlobalLayout
        }
      },
      children: [
        // Dashboard pages
        {
          path: '',
          component: () => {
            const authStore = useAuthStore()
            const category = authStore.currentUser?.role_category

            switch (category) {
              case 'global':
                return import('@/pages/dashboard/GlobalDashboard.vue')
              case 'project':
                return import('@/pages/dashboard/ProjectDashboard.vue')
              case 'task':
                return import('@/pages/dashboard/TaskDashboard.vue')
              default:
                return import('@/pages/dashboard/GlobalDashboard.vue')
            }
          },
        },

        // Tasks
        {
          path: 'tasks',
          component: () => import('../pages/tasks/Tasks.vue'),
        },

        // Reports
        {
          path: 'reports',
          component: () => import('../pages/reports/Reports.vue'),
        },

        // People/Team
        {
          path: 'people',
          component: () => import('../pages/people/People.vue'),
        },
        {
          path: 'team',
          component: () => import('../pages/team/Team.vue'),
        },

        // Account
        {
          path: 'account',
          component: () => import('../pages/account/Account.vue'),
        },

        // Calendar
        {
          path: 'calendar',
          component: () => import('../pages/calendar/Calendar.vue'),
        },

        // Photos
        {
          path: 'photos',
          component: () => import('../pages/photos/Photos.vue'),
        },
      ],
    },
    {
      path: '/team',
      component: () => {
        const authStore = useAuthStore()
        const category = authStore.currentUser?.role_category

        switch (category) {
          case 'global':
            return GlobalLayout
          case 'project':
            return ProjectLayout
          case 'task':
            return TaskLayout
          default:
            return GlobalLayout
        }
      },
      children: [
        {
          path: '',
          component: () => import('../pages/team/Team.vue'),
        },
      ],
    },
    {
      path: '/projects',
      component: () => {
        const authStore = useAuthStore()
        const category = authStore.currentUser?.role_category

        switch (category) {
          case 'global':
            return GlobalLayout
          case 'project':
            return ProjectLayout
          case 'task':
            return TaskLayout
          default:
            return GlobalLayout
        }
      },
      children: [
        {
          path: '',
          component: () => import('@/pages/projects/Projects.vue'),
        },
        {
          path: ':id',
          component: () => import('@/pages/projects/ProjectDetail.vue'),
        },
      ],
    },
    {
      path: '/account',
      component: ProjectLayout,
      children: [
        {
          path: '',
          component: () => import('../pages/account/Account.vue'),
        },
      ],
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

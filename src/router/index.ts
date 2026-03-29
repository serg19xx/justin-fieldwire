import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/core/stores/auth'
import { isTaskRoleForeman } from '@/core/utils/task-role-ux'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Login routes
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/auth/views/LoginView.vue'),
      meta: { requiresAuth: false, isAuthPage: true },
    },
    {
      path: '/password-change',
      name: 'password-change',
      component: () => import('@/pages/auth/views/PasswordChangeView.vue'),
      meta: { requiresAuth: false, isAuthPage: true }, // Allow access for users with temporary passwords
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('@/pages/auth/views/ResetPasswordView.vue'),
      meta: { requiresAuth: false, isAuthPage: true },
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

        // Task role: foreman gets overview dashboard; workers / contractors get compact "my work" dashboard
        if (roleCategory === 'task') {
          const u = authStore.currentUser
          if (isTaskRoleForeman(u?.role_code, u?.role_id)) {
            return import('../pages/dashboard/ForemanDashboard.vue')
          }
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
        const roleCategory = authStore.currentUser?.role_category
        // Task role (Worker, Foreman, Contractor): mobile project list
        if (roleCategory === 'task') {
          return import('../pages/task-role/TaskProjects.vue')
        }
        // Project/global: legacy projects list
        return import('../pages/projects/ProjectsPrj.vue')
      },
    },
    {
      path: '/tasks/my-week',
      redirect: '/tasks/schedule',
    },
    {
      path: '/tasks/schedule',
      component: () => import('../pages/task-role/TaskScheduleWeek.vue'),
    },
    {
      path: '/tasks/project/:id',
      component: () => import('../pages/task-role/TaskProjectDetail.vue'),
    },
    {
      path: '/tasks/project/:projectId/task/:taskId',
      component: () => import('../pages/task-role/TaskTaskDetail.vue'),
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
      path: '/task-templates',
      beforeEnter: (to, from, next) => {
        const authStore = useAuthStore()
        const roleCode = authStore.currentUser?.role_code
        const allowed = roleCode === 'project_manager' || roleCode === 'admin'
        if (!allowed) {
          next('/dashboard')
          return
        }
        next()
      },
      component: () => import('../pages/task-templates/TaskTemplatesManage.vue'),
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
      path: '/admin-settings',
      component: () => {
        const authStore = useAuthStore()
        const jobTitle = authStore.currentUser?.job_title

        console.log('🔍 Router admin-settings debug:', { jobTitle })

        // Only System Administrators can access admin settings
        if (jobTitle === 'System Administrator') {
          return import('../pages/admin/AdminSettings.vue')
        } else {
          // Redirect non-admins to dashboard
          return import('../pages/dashboard/GlobalDashboard.vue')
        }
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
      redirect: (to) => {
        const authStore = useAuthStore()
        const roleCode = authStore.currentUser?.role_code
        let roleId: number | string | undefined = (authStore.currentUser as unknown as { role_id?: number | string })?.role_id

        if (roleId === undefined || roleCode === undefined) {
          try {
            const saved = localStorage.getItem('user')
            if (saved) {
              const parsed = JSON.parse(saved) as { role_id?: number | string; role_code?: string }
              if (parsed?.role_id !== undefined) roleId = parsed.role_id
            }
          } catch {
            // ignore
          }
        }

        const roleIdNum = typeof roleId === 'string' ? Number(roleId) : roleId
        const isAdmin = roleCode === 'admin' || roleIdNum === 9

        console.log('🔀 Redirecting project route based on role:', { roleCode, roleId: roleIdNum, isAdmin })
        return isAdmin
          ? { path: `/projects/${to.params.id}/admin` }
          : { path: `/projects/${to.params.id}/detail` }
      },
    },
    {
      path: '/projects/:id/admin',
      component: () => import('../pages/projects/ProjectOverviewAdmin.vue'),
    },
    {
      path: '/projects/:id/detail',
      component: () => import('../pages/projects/ProjectDetailPrj.vue'),
    },
  ],
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  console.log('🛡️ Router guard checking:', { to: to.path, from: from.path })

  const authStore = useAuthStore()

  // All routes require authentication by default

  // Public routes that don't require authentication
  const isPublic = to.matched.some((record) => record.meta && record.meta.requiresAuth === false)

  if (isPublic) {
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

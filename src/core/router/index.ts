import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/core/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/modules/auth/views/LoginView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/password-change',
      name: 'password-change',
      component: () => import('@/modules/auth/views/PasswordChangeView.vue'),
      meta: { requiresAuth: false },
    },
    // Main routes - direct components based on category
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/modules/layouts/global/views/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    // Direct routes for global users
    {
      path: '/dashboard',
      name: 'dashboard-direct',
      component: () => import('@/modules/layouts/global/views/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/projects',
      name: 'projects',
      component: () => import('@/modules/layouts/global/views/ProjectsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/people',
      name: 'people',
      component: () => import('@/modules/layouts/global/views/PeopleView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('@/modules/layouts/global/views/ReportsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/account',
      name: 'account',
      component: () => import('@/modules/layouts/global/views/AccountView.vue'),
      meta: { requiresAuth: true },
    },
    // Contacts routes
    {
      path: '/contacts/patients',
      name: 'contacts-patients',
      component: () => import('@/modules/layouts/global/views/contacts/PatientsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/contacts/drivers',
      name: 'contacts-drivers',
      component: () => import('@/modules/layouts/global/views/contacts/DriversView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/contacts/pharmacies',
      name: 'contacts-pharmacies',
      component: () => import('@/modules/layouts/global/views/contacts/PharmaciesView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/contacts/pharmacists',
      name: 'contacts-pharmacists',
      component: () => import('@/modules/layouts/global/views/contacts/PharmacistsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/contacts/physicians',
      name: 'contacts-physicians',
      component: () => import('@/modules/layouts/global/views/contacts/PhysiciansView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/contacts/medical-clinics',
      name: 'contacts-medical-clinics',
      component: () => import('@/modules/layouts/global/views/contacts/MedicalClinicsView.vue'),
      meta: { requiresAuth: true },
    },
    // Unified routes for all categories
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/modules/dashboard/views/ProjectDashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/projects',
      name: 'projects',
      component: () => import('@/modules/layouts/project/views/ProjectsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/tasks',
      name: 'tasks',
      component: () => import('@/modules/layouts/project/views/TasksView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/team',
      name: 'team',
      component: () => import('@/modules/layouts/project/views/TeamView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('@/modules/layouts/project/views/ReportsView.vue'),
      meta: { requiresAuth: true },
    },
    // Task routes
    {
      path: '/task/dashboard',
      name: 'task-dashboard',
      component: () => import('@/modules/dashboard/views/TaskDashboardView.vue'),
      meta: { requiresAuth: true, requiresCategory: 'task' },
    },
    {
      path: '/task/tasks',
      name: 'task-tasks',
      component: () => import('@/modules/layouts/task/views/TasksView.vue'),
      meta: { requiresAuth: true, requiresCategory: 'task' },
    },
    {
      path: '/task/calendar',
      name: 'task-calendar',
      component: () => import('@/modules/layouts/task/views/CalendarView.vue'),
      meta: { requiresAuth: true, requiresCategory: 'task' },
    },
    {
      path: '/task/photos',
      name: 'task-photos',
      component: () => import('@/modules/layouts/task/views/PhotosView.vue'),
      meta: { requiresAuth: true, requiresCategory: 'task' },
    },
    // Legacy routes for backward compatibility
    // Removed duplicate /projects route - now handled by CategoryRouter
    {
      path: '/projects/:id',
      name: 'project-detail',
      component: () => import('@/modules/layouts/global/views/ProjectDetailView.vue'),
      meta: { requiresAuth: true, requiresPermission: 'projects:read' },
    },
    // Removed duplicate /people route - now handled by CategoryRouter
    {
      path: '/contacts',
      name: 'contacts',
      component: () => import('@/modules/layouts/global/views/ContactsView.vue'),
      meta: { requiresAuth: true, requiresRole: 'System Administrator' },
      children: [
        {
          path: '',
          redirect: { name: 'patients' },
        },
        {
          path: 'patients',
          name: 'patients',
          component: () => import('@/modules/layouts/global/views/contacts/PatientsView.vue'),
        },
        {
          path: 'drivers',
          name: 'drivers',
          component: () => import('@/modules/layouts/global/views/contacts/DriversView.vue'),
        },
        {
          path: 'pharmacies',
          name: 'pharmacies',
          component: () => import('@/modules/layouts/global/views/contacts/PharmaciesView.vue'),
        },
        {
          path: 'pharmacists',
          name: 'pharmacists',
          component: () => import('@/modules/layouts/global/views/contacts/PharmacistsView.vue'),
        },
        {
          path: 'physicians',
          name: 'physicians',
          component: () => import('@/modules/layouts/global/views/contacts/PhysiciansView.vue'),
        },
        {
          path: 'medical-clinics',
          name: 'medical-clinics',
          component: () => import('@/modules/layouts/global/views/contacts/MedicalClinicsView.vue'),
        },
      ],
    },
    // Removed duplicate /account route - now handled by CategoryRouter
    {
      path: '/tasks',
      name: 'tasks',
      component: () => import('@/modules/layouts/global/views/TasksView.vue'),
      meta: { requiresAuth: true, requiresPermission: 'tasks:read' },
    },
    // Removed duplicate /reports route - now handled by CategoryRouter
    {
      path: '/specifications',
      name: 'specifications',
      component: () => import('@/modules/layouts/global/views/SpecificationsView.vue'),
      meta: { requiresAuth: true, requiresPermission: 'specifications:read' },
    },
    {
      path: '/photos',
      name: 'photos',
      component: () => import('@/modules/layouts/global/views/PhotosView.vue'),
      meta: { requiresAuth: true, requiresPermission: 'photos:read' },
    },
    {
      path: '/forms',
      name: 'forms',
      component: () => import('@/modules/layouts/global/views/FormsView.vue'),
      meta: { requiresAuth: true, requiresPermission: 'forms:read' },
    },
    {
      path: '/files',
      name: 'files',
      component: () => import('@/modules/layouts/global/views/FilesView.vue'),
      meta: { requiresAuth: true, requiresPermission: 'files:read' },
    },

    // API Tester route (только для разработки)
    {
      path: '/api-tester',
      name: 'api-tester',
      component: () => import('@/components/ApiTester.vue'),
      meta: { requiresAuth: false },
    },
  ],
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Initialize auth from localStorage only if not already initialized
  if (!authStore.isAuthenticated && !authStore.currentUser) {
    // Check if we have valid tokens in localStorage
    const token = localStorage.getItem('authToken')
    const savedUser = localStorage.getItem('user')

    if (token && savedUser) {
      authStore.initializeAuth()
    }
  }

  // Check if route requires specific category
  if (
    to.meta.requiresCategory &&
    authStore.currentUser?.role_category !== to.meta.requiresCategory
  ) {
    // Redirect based on user category
    const user = authStore.currentUser
    if (user?.role_category === 'project') {
      next('/project')
    } else if (user?.role_category === 'task') {
      next('/task')
    } else {
      next('/')
    }
    return
  }

  // Check if route requires specific permission
  if (
    to.meta.requiresPermission &&
    !authStore.checkPermission(to.meta.requiresPermission as string)
  ) {
    next('/')
    return
  }

  // Check if route requires specific role
  if (to.meta.requiresRole && authStore.currentUser?.user_type !== to.meta.requiresRole) {
    next('/')
    return
  }

  // Redirect to dashboard if already logged in and trying to access login
  if (to.path === '/login' && authStore.isAuthenticated) {
    next('/dashboard')
    return
  }

  // No redirects needed - unified routes for all categories

  // If user is not authenticated and trying to access protected routes, redirect to login
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    console.log('🔒 Router guard - User not authenticated, redirecting to login')
    next('/login')
    return
  }

  next()
})

export default router

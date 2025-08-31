import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/projects',
      name: 'projects',
      component: () => import('@/views/ProjectsView.vue'),
      meta: { requiresAuth: true, requiresPermission: 'projects:read' },
    },
    {
      path: '/people',
      name: 'builders',
      component: () => import('@/views/PeopleView.vue'),
      meta: { requiresAuth: true, requiresPermission: 'people:read' },
    },
    {
      path: '/contacts',
      name: 'contacts',
      component: () => import('@/views/ContactsView.vue'),
      meta: { requiresAuth: true, requiresPermission: 'contacts:read' },
      children: [
        {
          path: '',
          name: 'all-contacts',
          component: () => import('@/views/contacts/AllContactsView.vue'),
        },
        {
          path: 'patients',
          name: 'patients',
          component: () => import('@/views/contacts/PatientsView.vue'),
        },
        {
          path: 'drivers',
          name: 'drivers',
          component: () => import('@/views/contacts/DriversView.vue'),
        },
        {
          path: 'pharmacies',
          name: 'pharmacies',
          component: () => import('@/views/contacts/PharmaciesView.vue'),
        },
        {
          path: 'physicians',
          name: 'physicians',
          component: () => import('@/views/contacts/PhysiciansView.vue'),
        },
        {
          path: 'clinics',
          name: 'clinics',
          component: () => import('@/views/contacts/ClinicsView.vue'),
        },
      ],
    },
    {
      path: '/account',
      name: 'account',
      component: () => import('@/views/AccountView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/tasks',
      name: 'tasks',
      component: () => import('@/views/TasksView.vue'),
      meta: { requiresAuth: true, requiresPermission: 'tasks:read' },
    },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('@/views/ReportsView.vue'),
      meta: { requiresAuth: true, requiresPermission: 'reports:read' },
    },
    {
      path: '/specifications',
      name: 'specifications',
      component: () => import('@/views/SpecificationsView.vue'),
      meta: { requiresAuth: true, requiresPermission: 'specifications:read' },
    },
    {
      path: '/photos',
      name: 'photos',
      component: () => import('@/views/PhotosView.vue'),
      meta: { requiresAuth: true, requiresPermission: 'photos:read' },
    },
    {
      path: '/forms',
      name: 'forms',
      component: () => import('@/views/FormsView.vue'),
      meta: { requiresAuth: true, requiresPermission: 'forms:read' },
    },
    {
      path: '/files',
      name: 'files',
      component: () => import('@/views/FilesView.vue'),
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

  // Initialize auth from localStorage
  if (!authStore.isAuthenticated) {
    authStore.initializeAuth()
  }

  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
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

  // Redirect to dashboard if already logged in and trying to access login
  if (to.path === '/login' && authStore.isAuthenticated) {
    next('/')
    return
  }

  next()
})

export default router

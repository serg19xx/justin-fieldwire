import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Project {
  id: number
  name: string
  client: string
  status: 'active' | 'completed' | 'pending' | 'on-hold'
  startDate: string
  endDate: string
  budget: number
  progress: number
  manager: string
  description?: string
}

export interface Task {
  id: number
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'in-progress' | 'completed' | 'blocked'
  assignee: string
  projectId: number
  dueDate: string
  estimatedHours: number
  actualHours?: number
}

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([
    {
      id: 1,
      name: 'Office Building Renovation',
      client: 'TechCorp Inc.',
      status: 'active',
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      budget: 2500000,
      progress: 75,
      manager: 'John Smith',
      description:
        'Complete renovation of the main office building including electrical, plumbing, and HVAC systems.',
    },
    {
      id: 2,
      name: 'Residential Complex',
      client: 'Urban Development LLC',
      status: 'active',
      startDate: '2024-02-15',
      endDate: '2024-12-31',
      budget: 5000000,
      progress: 45,
      manager: 'Sarah Wilson',
      description: 'Construction of a 50-unit residential complex with modern amenities.',
    },
    {
      id: 3,
      name: 'Shopping Center',
      client: 'Retail Partners',
      status: 'pending',
      startDate: '2024-03-01',
      endDate: '2024-11-30',
      budget: 3500000,
      progress: 0,
      manager: 'Mike Johnson',
      description:
        'Development of a new shopping center with retail spaces and parking facilities.',
    },
    {
      id: 4,
      name: 'Hospital Extension',
      client: 'City Medical Center',
      status: 'on-hold',
      startDate: '2024-01-15',
      endDate: '2024-08-31',
      budget: 1800000,
      progress: 30,
      manager: 'Lisa Brown',
      description:
        'Extension of the existing hospital building with new patient rooms and facilities.',
    },
    {
      id: 5,
      name: 'School Renovation',
      client: 'Public Education Board',
      status: 'completed',
      startDate: '2023-09-01',
      endDate: '2024-01-31',
      budget: 1200000,
      progress: 100,
      manager: 'David Lee',
      description:
        'Complete renovation of the elementary school including classrooms and playground.',
    },
  ])

  const tasks = ref<Task[]>([
    {
      id: 1,
      title: 'Electrical wiring installation',
      description: 'Install electrical wiring for the main building',
      priority: 'high',
      status: 'in-progress',
      assignee: 'John Smith',
      projectId: 1,
      dueDate: '2024-01-15',
      estimatedHours: 40,
      actualHours: 25,
    },
    {
      id: 2,
      title: 'Plumbing system check',
      description: 'Inspect and test all plumbing systems',
      priority: 'medium',
      status: 'pending',
      assignee: 'Mike Johnson',
      projectId: 2,
      dueDate: '2024-01-18',
      estimatedHours: 16,
    },
    {
      id: 3,
      title: 'HVAC maintenance',
      description: 'Perform routine HVAC system maintenance',
      priority: 'low',
      status: 'completed',
      assignee: 'Sarah Wilson',
      projectId: 1,
      dueDate: '2024-01-12',
      estimatedHours: 8,
      actualHours: 8,
    },
    {
      id: 4,
      title: 'Foundation inspection',
      description: 'Inspect foundation for structural integrity',
      priority: 'high',
      status: 'blocked',
      assignee: 'David Lee',
      projectId: 3,
      dueDate: '2024-01-20',
      estimatedHours: 24,
    },
    {
      id: 5,
      title: 'Roof repair',
      description: 'Repair damaged roof sections',
      priority: 'high',
      status: 'in-progress',
      assignee: 'Lisa Brown',
      projectId: 4,
      dueDate: '2024-01-25',
      estimatedHours: 32,
      actualHours: 18,
    },
    {
      id: 6,
      title: 'Safety equipment check',
      description: 'Verify all safety equipment is properly installed',
      priority: 'medium',
      status: 'pending',
      assignee: 'Tom Anderson',
      projectId: 2,
      dueDate: '2024-01-22',
      estimatedHours: 12,
    },
  ])

  // Computed properties
  const activeProjects = computed(() =>
    projects.value.filter((project) => project.status === 'active'),
  )

  const completedProjects = computed(() =>
    projects.value.filter((project) => project.status === 'completed'),
  )

  const pendingProjects = computed(() =>
    projects.value.filter((project) => project.status === 'pending'),
  )

  const totalBudget = computed(() =>
    projects.value.reduce((sum, project) => sum + project.budget, 0),
  )

  const totalSpent = computed(() =>
    projects.value.reduce((sum, project) => sum + (project.budget * project.progress) / 100, 0),
  )

  const projectTasks = computed(
    () => (projectId: number) => tasks.value.filter((task) => task.projectId === projectId),
  )

  const tasksByStatus = computed(
    () => (status: Task['status']) => tasks.value.filter((task) => task.status === status),
  )

  // Actions
  function addProject(project: Omit<Project, 'id'>) {
    const newProject: Project = {
      ...project,
      id: Math.max(...projects.value.map((p) => p.id)) + 1,
    }
    projects.value.push(newProject)
  }

  function updateProject(id: number, updates: Partial<Project>) {
    const index = projects.value.findIndex((p) => p.id === id)
    if (index !== -1) {
      projects.value[index] = { ...projects.value[index], ...updates }
    }
  }

  function deleteProject(id: number) {
    const index = projects.value.findIndex((p) => p.id === id)
    if (index !== -1) {
      projects.value.splice(index, 1)
      // Also delete related tasks
      tasks.value = tasks.value.filter((task) => task.projectId !== id)
    }
  }

  function addTask(task: Omit<Task, 'id'>) {
    const newTask: Task = {
      ...task,
      id: Math.max(...tasks.value.map((t) => t.id)) + 1,
    }
    tasks.value.push(newTask)
  }

  function updateTask(id: number, updates: Partial<Task>) {
    const index = tasks.value.findIndex((t) => t.id === id)
    if (index !== -1) {
      tasks.value[index] = { ...tasks.value[index], ...updates }
    }
  }

  function deleteTask(id: number) {
    const index = tasks.value.findIndex((t) => t.id === id)
    if (index !== -1) {
      tasks.value.splice(index, 1)
    }
  }

  function getProjectById(id: number) {
    return projects.value.find((project) => project.id === id)
  }

  function getTaskById(id: number) {
    return tasks.value.find((task) => task.id === id)
  }

  // Get tasks by project ID
  function getTasksByProjectId(projectId: number) {
    return tasks.value.filter((task) => task.projectId === projectId)
  }

  return {
    // State
    projects,
    tasks,

    // Computed
    activeProjects,
    completedProjects,
    pendingProjects,
    totalBudget,
    totalSpent,
    projectTasks,
    tasksByStatus,

    // Actions
    addProject,
    updateProject,
    deleteProject,
    addTask,
    updateTask,
    deleteTask,
    getProjectById,
    getTaskById,
    getTasksByProjectId,
  }
})

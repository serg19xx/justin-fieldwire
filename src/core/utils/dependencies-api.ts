import { api } from './api'

// Task Dependency interface
export interface TaskDependency {
  id: number
  project_id: number
  from_task_id: number
  to_task_id: number
  dependency_type: 'FS' | 'SS' | 'FF' | 'SF'
  lag_days: number
  priority: number
  created_by: number
  created_at: string
  updated_at: string
}

// Create dependency request
export interface CreateDependencyRequest {
  from_task_id: number
  to_task_id: number
  dependency_type: 'FS' | 'SS' | 'FF' | 'SF'
  lag_days?: number
}

// Update dependency request
export interface UpdateDependencyRequest {
  dependency_type?: 'FS' | 'SS' | 'FF' | 'SF'
  lag_days?: number
  priority?: number
}

// API Response interfaces
interface DependenciesResponse {
  error_code: number
  status: string
  message: string
  data: {
    dependencies: TaskDependency[]
  }
}

interface DependencyResponse {
  error_code: number
  status: string
  message: string
  data: {
    dependency: TaskDependency
  }
}

interface DeleteResponse {
  error_code: number
  status: string
  message: string
}

/**
 * Get all dependencies for a project
 */
export async function getProjectDependencies(projectId: number): Promise<TaskDependency[]> {
  try {
    console.log(`📡 Fetching dependencies for project: ${projectId}`)
    const response = await api.get<DependenciesResponse>(`/api/v1/projects/${projectId}/dependencies`)
    console.log('✅ Dependencies fetched successfully:', response.data)
    return response.data.data.dependencies
  } catch (error) {
    console.error('❌ Error fetching dependencies:', error)
    throw error
  }
}

/**
 * Get dependencies for a specific task
 */
export async function getTaskDependencies(taskId: number): Promise<TaskDependency[]> {
  try {
    console.log(`📡 Fetching dependencies for task: ${taskId}`)
    const response = await api.get<DependenciesResponse>(`/api/v1/tasks/${taskId}/dependencies`)
    console.log('✅ Task dependencies fetched successfully:', response.data)
    return response.data.data.dependencies
  } catch (error) {
    console.error('❌ Error fetching task dependencies:', error)
    throw error
  }
}

/**
 * Create a new dependency
 */
export async function createDependency(
  projectId: number, 
  dependencyData: CreateDependencyRequest
): Promise<TaskDependency> {
  try {
    console.log(`📡 Creating dependency for project ${projectId}:`, dependencyData)
    const response = await api.post<DependencyResponse>(
      `/api/v1/projects/${projectId}/dependencies`,
      dependencyData
    )
    console.log('✅ Dependency created successfully:', response.data)
    console.log('🔍 Response structure:', {
      status: response.data.status,
      hasData: !!response.data.data,
      dataKeys: response.data.data ? Object.keys(response.data.data) : [],
      fullData: response.data.data,
      dataType: typeof response.data.data,
      isArray: Array.isArray(response.data.data),
    })
    
    // Check response structure
    if (response.data.data) {
      const dataObj = response.data.data
      
      // Check if data contains dependency key (full object)
      if (dataObj.dependency) {
        console.log('📦 Found dependency in response.data.data.dependency')
        return dataObj.dependency
      }
      
      // Check if data itself is the dependency object (has id, from_task_id, etc.)
      if (dataObj.id !== undefined && dataObj.from_task_id !== undefined) {
        console.log('📦 Data itself is the dependency object')
        return dataObj as TaskDependency
      }
      
      // Check if server returns only dependency_id - construct dependency object
      if (dataObj.dependency_id !== undefined) {
        console.log('📦 Server returned dependency_id, constructing dependency object')
        const dependencyId = dataObj.dependency_id
        
        // Try to fetch the full dependency object
        try {
          console.log(`📡 Fetching full dependency object for ID: ${dependencyId}`)
          const dependencies = await getTaskDependencies(dependencyData.to_task_id)
          const fullDependency = dependencies.find(dep => dep.id === dependencyId)
          
          if (fullDependency) {
            console.log('✅ Found full dependency object:', fullDependency)
            return fullDependency
          }
        } catch (fetchError) {
          console.warn('⚠️ Could not fetch full dependency, constructing from request data:', fetchError)
        }
        
        // Fallback: construct dependency object from request data + ID
        console.log('📦 Constructing dependency object from request data + ID')
        return {
          id: dependencyId,
          project_id: projectId,
          from_task_id: dependencyData.from_task_id,
          to_task_id: dependencyData.to_task_id,
          dependency_type: dependencyData.dependency_type,
          lag_days: dependencyData.lag_days || 0,
          priority: 0,
          created_by: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as TaskDependency
      }
      
      // Check if data is an object with dependency inside
      if (typeof dataObj === 'object' && !Array.isArray(dataObj)) {
        const keys = Object.keys(dataObj)
        console.log('📦 Data keys:', keys)
        // Try to find dependency-like object in data
        for (const key of keys) {
          const value = dataObj[key as keyof typeof dataObj]
          if (value && typeof value === 'object' && 'id' in value && 'from_task_id' in value) {
            console.log(`📦 Found dependency in response.data.data.${key}`)
            return value as TaskDependency
          }
        }
      }
    }
    
    // Log full response for debugging
    console.error('❌ Could not find dependency in response:', JSON.stringify(response.data, null, 2))
    throw new Error('Invalid response format from server: dependency not found in response')
  } catch (error) {
    console.error('❌ Error creating dependency:', error)
    throw error
  }
}

/**
 * Update an existing dependency
 */
export async function updateDependency(
  dependencyId: number, 
  updateData: UpdateDependencyRequest
): Promise<TaskDependency> {
  try {
    console.log(`📡 Updating dependency ${dependencyId}:`, updateData)
    const response = await api.put<DependencyResponse>(
      `/api/v1/dependencies/${dependencyId}`,
      updateData
    )
    console.log('✅ Dependency updated successfully:', response.data)
    return response.data.data.dependency
  } catch (error) {
    console.error('❌ Error updating dependency:', error)
    throw error
  }
}

/**
 * Delete a dependency
 */
export async function deleteDependency(dependencyId: number): Promise<void> {
  try {
    console.log(`📡 Deleting dependency: ${dependencyId}`)
    const response = await api.delete<DeleteResponse>(`/api/v1/dependencies/${dependencyId}`)
    console.log('✅ Dependency deleted successfully:', response.data)
  } catch (error) {
    console.error('❌ Error deleting dependency:', error)
    throw error
  }
}

/**
 * Check if dependency exists between two tasks
 */
export async function checkDependencyExists(
  projectId: number,
  fromTaskId: number,
  toTaskId: number
): Promise<boolean> {
  try {
    const dependencies = await getProjectDependencies(projectId)
    return dependencies.some(dep => 
      (dep.from_task_id === fromTaskId && dep.to_task_id === toTaskId) ||
      (dep.from_task_id === toTaskId && dep.to_task_id === fromTaskId)
    )
  } catch (error) {
    console.error('❌ Error checking dependency existence:', error)
    return false
  }
}

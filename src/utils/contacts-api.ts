import { api } from './api'

// Types for contacts
export interface Contact {
  id: number
  name: string
  email: string
  phone: string
  status: string
  created_at?: string
  updated_at?: string
}

export interface Patient {
  id: string
  firstName: string
  lastName: string
  fullAddress?: string
  pharmId?: string
  lat?: string
  lng?: string
  cell?: string
  email?: string
  birthday?: string
  gender?: 'Female' | 'Male' | 'Other'
  country?: string
  province?: string
  city?: string
  postal?: string
  address1?: string
  address2?: string

  // Computed fields for display
  fullName?: string
  status?: string
  primaryInsurance?: string
  distance?: string
}

export interface Driver extends Contact {
  license_number?: string
  license_expiry?: string
  vehicle_assigned?: string
  status: 'active' | 'inactive' | 'on_trip' | 'maintenance'
  experience_years?: number
  certifications?: string[]
}

export interface Pharmacy extends Contact {
  operName: string
  legalName: string
  contact: string
  owner: string | null
  manager: string | null
  unitNumb: string
  phone: string
  cell: string
  email: string
  fax: string
  twilioPhone: string | null
  fullAddress: string
  street: string
  city: string
  region: string
  country: string
  postcode: string
  lat: string
  lng: string
  'no-centrals': string | null
  otpFee: string
  marketingFee: string
  sub_type: string
  comp_volumes: string
  sales_cycle: string
  notes: string | null
}

export interface Pharmacist {
  id: number
  pharmId: number
  fullName: string
  reg_number: string | null
  pharm_owned: string | null
  workplace: string | null
  cell_phone: string | null
  email: string | null
  notes: string | null
  operName: string
  created_at?: string
  updated_at?: string
}

export interface Physician {
  id: number
  prefTitle: string
  fullName: string
  company: string
  specialty: string
  cellPhone: string | null
  email: string | null
  faxNumber: string | null
  officePhone: string | null
  fullAddress: string | null
  unitNumb: string | null
  streetNumber: string | null
  country: string
  region: string
  city: string | null
  postal: string | null
  notes: string | null
  lat: string | null
  lng: string | null
  created_at?: string
  updated_at?: string
}

export interface Clinic extends Contact {
  address: string
  type: 'general' | 'specialty' | 'urgent_care' | 'diagnostic'
  size: 'small' | 'medium' | 'large'
  capacity_percentage: number
  staff_count: number
  manager: string
}

export interface MedicalClinic {
  id: number
  clinicName: string
  clinicType: string
  contactName: string
  phone: string
  fax: string
  email: string
  unitNumb: string
  streetName: string
  city: string
  region: string
  country: string
  postal: string
  notes: string
  fullAddress: string
  geoAddress: string
  geoCoordinates: string
  created_at?: string
  updated_at?: string
}

// API Response types
export interface ApiResponse<T> {
  error_code: number
  status: string
  message: string
  data: T
}

export interface PaginatedResponse<T> {
  [key: string]:
    | T[]
    | {
        page: number
        limit: number
        total: number
        pages: number
      }
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Patients API
export const patientsApi = {
  async getAll(
    page: number = 1,
    perPage: number = 20,
    filters?: Record<string, string | undefined>,
  ): Promise<PaginatedResponse<Patient>> {
    console.log('🔍 patientsApi.getAll called with:', { page, perPage, filters })
    console.log('🔍 api instance:', api)
    console.log('🔍 api.defaults.headers:', api.defaults.headers)

    const params = new URLSearchParams({
      page: page.toString(),
      limit: perPage.toString(),
      ...filters,
    })

    console.log('🔍 Making request to:', `/api/v1/patients?${params}`)
    const response = await api.get(`/api/v1/patients?${params}`)
    const data = response.data.data // Extract from nested response

    // Add computed fields to each patient
    const patientsWithComputed = data.patients.map((patient: Patient) => ({
      ...patient,
      fullName: `${patient.firstName} ${patient.lastName}`,
      status: 'active', // You can add logic here based on your business rules
      primaryInsurance: '', // Add when insurance data is available
      distance: patient.lat && patient.lng ? 'Calculated' : 'N/A',
    }))

    return {
      patients: patientsWithComputed,
      pagination: data.pagination,
    }
  },

  async getById(id: string): Promise<ApiResponse<Patient>> {
    const response = await api.get(`/api/v1/patients/${id}`)
    return response.data
  },

  async create(patient: Omit<Patient, 'id'>): Promise<ApiResponse<Patient>> {
    const response = await api.post('/api/v1/patients', patient)
    return response.data
  },

  async update(id: string, patient: Partial<Patient>): Promise<ApiResponse<Patient>> {
    const response = await api.put(`/api/v1/patients/${id}`, patient)
    return response.data
  },

  async delete(id: string): Promise<ApiResponse<{ message: string }>> {
    const response = await api.delete(`/api/v1/patients/${id}`)
    return response.data
  },
}

// Drivers API
export const driversApi = {
  async getAll(
    page: number = 1,
    perPage: number = 20,
    filters?: Record<string, string | undefined>,
  ): Promise<PaginatedResponse<Driver>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: perPage.toString(),
    })

    // Add filters only if they have values
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          params.append(key, value)
        }
      })
    }

    console.log('🔍 driversApi.getAll - URL params:', params.toString())
    const response = await api.get(`/api/v1/drivers?${params}`)
    const data = response.data.data // Extract from nested response

    // Add computed fields to each driver
    const driversWithComputed = data.drivers.map((driver: Driver) => ({
      ...driver,
      // Add any computed fields if needed
    }))

    return {
      drivers: driversWithComputed,
      pagination: data.pagination,
    }
  },

  async getById(id: number): Promise<ApiResponse<Driver>> {
    const response = await api.get(`/api/v1/drivers/${id}`)
    return response.data
  },

  async create(driver: Omit<Driver, 'id'>): Promise<ApiResponse<Driver>> {
    const response = await api.post('/api/v1/drivers', driver)
    return response.data
  },

  async update(id: number, driver: Partial<Driver>): Promise<ApiResponse<Driver>> {
    const response = await api.put(`/api/v1/drivers/${id}`, driver)
    return response.data
  },

  async delete(id: number): Promise<ApiResponse<{ message: string }>> {
    const response = await api.delete(`/api/v1/drivers/${id}`)
    return response.data
  },
}

// Pharmacies API
export const pharmaciesApi = {
  async getAll(
    page: number = 1,
    perPage: number = 20,
    filters?: Record<string, string | undefined>,
  ): Promise<PaginatedResponse<Pharmacy>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: perPage.toString(),
      ...filters,
    })

    const response = await api.get(`/api/v1/pharmacies?${params}`)
    const data = response.data.data // Extract from nested response

    return {
      pharmacies: data.pharmacies,
      pagination: data.pagination,
    }
  },

  async getById(id: number): Promise<ApiResponse<Pharmacy>> {
    const response = await api.get(`/api/v1/pharmacies/${id}`)
    return response.data
  },

  async create(pharmacy: Omit<Pharmacy, 'id'>): Promise<ApiResponse<Pharmacy>> {
    const response = await api.post('/api/v1/pharmacies', pharmacy)
    return response.data
  },

  async update(id: number, pharmacy: Partial<Pharmacy>): Promise<ApiResponse<Pharmacy>> {
    const response = await api.put(`/api/v1/pharmacies/${id}`, pharmacy)
    return response.data
  },

  async delete(id: number): Promise<ApiResponse<Pharmacy>> {
    const response = await api.delete(`/api/v1/pharmacies/${id}`)
    return response.data
  },
}

// Pharmacists API
export const pharmacistsApi = {
  async getAll(
    page: number = 1,
    perPage: number = 20,
    filters?: Record<string, string | undefined>,
  ): Promise<PaginatedResponse<Pharmacist>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: perPage.toString(),
      ...filters,
    })

    const response = await api.get(`/api/v1/pharmacists?${params}`)
    console.log('🔍 Pharmacists API raw response:', response.data)
    const data = response.data.data // Extract from nested response
    console.log('🔍 Pharmacists API extracted data:', data)
    console.log('🔍 Pharmacists API data.pharmacists:', data.pharmacists)

    return {
      pharmacists: data.pharmacists,
      pagination: data.pagination,
    }
  },

  async getById(id: number): Promise<ApiResponse<Pharmacist>> {
    const response = await api.get(`/api/v1/pharmacists/${id}`)
    return response.data
  },

  async create(pharmacist: Omit<Pharmacist, 'id'>): Promise<ApiResponse<Pharmacist>> {
    const response = await api.post('/api/v1/pharmacists', pharmacist)
    return response.data
  },

  async update(id: number, pharmacist: Partial<Pharmacist>): Promise<ApiResponse<Pharmacist>> {
    const response = await api.put(`/api/v1/pharmacists/${id}`, pharmacist)
    return response.data
  },

  async delete(id: number): Promise<ApiResponse<Pharmacist>> {
    const response = await api.delete(`/api/v1/pharmacists/${id}`)
    return response.data
  },
}

// Physicians API
export const physiciansApi = {
  async getAll(
    page: number = 1,
    perPage: number = 20,
    filters?: Record<string, string | undefined>,
  ): Promise<PaginatedResponse<Physician>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: perPage.toString(),
      ...filters,
    })

    const response = await api.get(`/api/v1/physicians?${params}`)
    const data = response.data.data // Extract from nested response

    return {
      physicians: data.physicians,
      pagination: data.pagination,
    }
  },

  async getById(id: number): Promise<ApiResponse<Physician>> {
    const response = await api.get(`/api/v1/physicians/${id}`)
    return response.data
  },

  async create(physician: Omit<Physician, 'id'>): Promise<ApiResponse<Physician>> {
    const response = await api.post('/api/v1/physicians', physician)
    return response.data
  },

  async update(id: number, physician: Partial<Physician>): Promise<ApiResponse<Physician>> {
    const response = await api.put(`/api/v1/physicians/${id}`, physician)
    return response.data
  },

  async delete(id: number): Promise<ApiResponse<{ message: string }>> {
    const response = await api.delete(`/api/v1/physicians/${id}`)
    return response.data
  },
}

// Clinics API
export const clinicsApi = {
  async getAll(
    page: number = 1,
    perPage: number = 20,
    filters?: Record<string, string | undefined>,
  ): Promise<PaginatedResponse<Clinic>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: perPage.toString(),
      ...filters,
    })

    const response = await api.get(`/api/v1/clinics?${params}`)
    const data = response.data.data // Extract from nested response

    return {
      clinics: data.clinics,
      pagination: data.pagination,
    }
  },

  async getById(id: number): Promise<ApiResponse<Clinic>> {
    const response = await api.get(`/api/v1/clinics/${id}`)
    return response.data
  },

  async create(clinic: Omit<Clinic, 'id'>): Promise<ApiResponse<Clinic>> {
    const response = await api.post('/api/v1/clinics', clinic)
    return response.data
  },

  async update(id: number, clinic: Partial<Clinic>): Promise<ApiResponse<Clinic>> {
    const response = await api.put(`/api/v1/clinics/${id}`, clinic)
    return response.data
  },

  async delete(id: number): Promise<ApiResponse<Clinic>> {
    const response = await api.delete(`/api/v1/clinics/${id}`)
    return response.data
  },
}

// Medical Clinics API
export const medicalClinicsApi = {
  async getAll(
    page: number = 1,
    perPage: number = 20,
    filters?: Record<string, string | undefined>,
  ): Promise<PaginatedResponse<MedicalClinic>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: perPage.toString(),
      ...filters,
    })

    const response = await api.get(`/api/v1/medical-clinics?${params}`)
    const data = response.data.data // Extract from nested response

    return {
      medical_clinics: data.medical_clinics,
      pagination: data.pagination,
    }
  },

  async getById(id: number): Promise<ApiResponse<MedicalClinic>> {
    const response = await api.get(`/api/v1/medical-clinics/${id}`)
    return response.data
  },

  async create(clinic: Omit<MedicalClinic, 'id'>): Promise<ApiResponse<MedicalClinic>> {
    const response = await api.post('/api/v1/medical-clinics', clinic)
    return response.data
  },

  async update(id: number, clinic: Partial<MedicalClinic>): Promise<ApiResponse<MedicalClinic>> {
    const response = await api.put(`/api/v1/medical-clinics/${id}`, clinic)
    return response.data
  },

  async delete(id: number): Promise<ApiResponse<{ message: string }>> {
    const response = await api.delete(`/api/v1/medical-clinics/${id}`)
    return response.data
  },
}

// Geography interfaces
export interface Region {
  id: number
  name: string
  state_subdivision_code: string
  code2: string
}

export interface Country {
  id: number
  name: string
  code2: string
  regions: Region[]
}

export interface GeographyResponse {
  error_code: number
  status: string
  message: string
  data: {
    countries: Country[]
    total_countries: number
  }
}

// Geography API
export const geographyApi = {
  async getCountriesAndRegions(): Promise<GeographyResponse> {
    const response = await api.get('/api/v1/geography/countries-regions')
    return response.data
  },
}

// Worker interface
export interface Worker {
  id: number
  email: string
  password_hash: string
  first_name: string
  last_name: string
  phone?: string
  user_type: string
  job_title?: string
  status: number // 1 = active, 0 = inactive
  status_reason?: string
  status_details?: string
  additional_info?: string
  avatar_url?: string
  two_factor_enabled: boolean
  two_factor_secret?: string
  last_login?: string
  created_at: string
  updated_at: string
  invitation_status: string
  invitation_token?: string
  invitation_sent_at?: string
  invitation_expires_at?: string
  invited_by?: number
  registration_completed_at?: string
  invitation_attempts: number
  last_reminder_sent_at?: string
  temp_password?: string
  temp_password_expires_at?: string
}

// Auth API
export const authApi = {
  async validateInvitationToken(token: string): Promise<{
    valid: boolean
    message: string
    user?: {
      id: number
      email: string
      first_name: string
      last_name: string
      user_type: string
      job_title?: string
    }
  }> {
    try {
      const response = await api.get(`/api/v1/auth/validate-invitation-token?token=${encodeURIComponent(token)}`)
      return response.data
    } catch (error) {
      console.error('Error validating invitation token:', error)
      throw error
    }
  }
}

// Workers API
export const workersApi = {
  async getAll(
    page: number = 1,
    limit: number = 10,
    filters: {
      status?: string
      search?: string
      user_type?: string
    } = {}
  ): Promise<{
    workers: Worker[]
    pagination: {
      current_page: number
      per_page: number
      total: number
      last_page: number
    }
  }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      })

      console.log('🔍 Making request to:', `/api/v1/workers?${params}`)
      const response = await api.get(`/api/v1/workers?${params}`)
      console.log('✅ Workers API response:', response.data)
      return response.data.data
    } catch (error: any) {
      console.error('Error fetching workers:', error)
      if (error.response) {
        console.error('Response status:', error.response.status)
        console.error('Response data:', error.response.data)
        console.error('Response headers:', error.response.headers)
      }
      throw error
    }
  },

  async getById(id: number): Promise<Worker> {
    try {
      const response = await api.get(`/api/v1/workers/${id}`)
      return response.data.data
    } catch (error) {
      console.error('Error fetching worker:', error)
      throw error
    }
  },

  async update(id: number, data: Partial<Worker>): Promise<Worker> {
    try {
      const response = await api.put(`/api/v1/workers/${id}`, data)
      return response.data.data
    } catch (error) {
      console.error('Error updating worker:', error)
      throw error
    }
  },

  async delete(id: number): Promise<void> {
    try {
      await api.delete(`/api/v1/workers/${id}`)
    } catch (error) {
      console.error('Error deleting worker:', error)
      throw error
    }
  }
}

// Project types and API
export interface Project {
  id: number
  prj_name: string
  address: string
  date_start: string
  date_end: string
  priority: string
  status: string
  prj_managger: number | null
  created_at: string
  updated_at: string
}

export interface ProjectsResponse {
  projects: Project[]
  pagination: {
    current_page: number
    per_page: number
    total: number
    last_page: number
  }
}

export const projectsApi = {
  async getAll(
    page: number = 1,
    limit: number = 20,
    filters?: {
      status?: string
      priority?: string
      search?: string
      prj_manager?: number
    }
  ): Promise<ProjectsResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })

      if (filters?.status) params.append('status', filters.status)
      if (filters?.priority) params.append('priority', filters.priority)
      if (filters?.search) params.append('search', filters.search)
      if (filters?.prj_manager !== undefined) params.append('prj_manager', filters.prj_manager.toString())

      const response = await api.get(`/api/v1/projects?${params.toString()}`)
      return response.data.data
    } catch (error) {
      console.error('Error fetching projects:', error)
      throw error
    }
  },

  async getById(id: number): Promise<Project> {
    try {
      const response = await api.get(`/api/v1/projects/${id}`)
      return response.data.data
    } catch (error) {
      console.error('Error fetching project:', error)
      throw error
    }
  },

  async create(data: Partial<Project>): Promise<Project> {
    try {
      const response = await api.post('/api/v1/projects', data)
      return response.data.data.project
    } catch (error: any) {
      console.error('Error creating project:', error)

      // Handle API error response format
      if (error.response?.data) {
        const errorData = error.response.data
        if (errorData.status === 'error') {
          console.error('API Error:', errorData.message)
          console.error('Error details:', errorData.data)
          throw new Error(errorData.message + ': ' + errorData.data)
        }
      }

      throw error
    }
  },

  async update(id: number, data: Partial<Project>): Promise<Project> {
    try {
      const response = await api.put(`/api/v1/projects/${id}`, data)
      return response.data.data
    } catch (error) {
      console.error('Error updating project:', error)
      throw error
    }
  },

  async delete(id: number): Promise<void> {
    try {
      await api.delete(`/api/v1/projects/${id}`)
    } catch (error) {
      console.error('Error deleting project:', error)
      throw error
    }
  }
}

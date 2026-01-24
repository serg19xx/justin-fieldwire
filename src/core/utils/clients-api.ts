import { api } from './api'
import type { ClientTableType } from './project-api'

// Re-export for convenience
export type { ClientTableType } from './project-api'

// Client interface - common fields that all client types might have
export interface Client {
  id: number
  name: string
  address?: string
  phone?: string
  email?: string
  [key: string]: unknown // Allow additional fields from different tables
}

// Client search response
export interface ClientsResponse {
  clients: Client[]
  total: number
  page: number
  limit: number
}

// Client type configuration
export interface ClientTypeConfig {
  value: ClientTableType
  label: string
  table: string
}

export const CLIENT_TYPES: ClientTypeConfig[] = [
  { value: 'pharma', label: 'Pharmacies', table: 'pharma' },
  { value: 'physician', label: 'Physicians & Providers', table: 'physician' },
  { value: 'pharmacist', label: 'Pharmacists', table: 'pharmacist' },
  { value: 'medical_clinic', label: 'Medical Clinic', table: 'medical_clinic' },
]

// Clients API
export const clientsApi = {
  /**
   * Search clients from a specific table
   * @param clientTable - The type of client table to search
   * @param searchQuery - Search query string
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 50)
   */
  async search(
    clientTable: ClientTableType,
    searchQuery: string = '',
    page: number = 1,
    limit: number = 50,
  ): Promise<ClientsResponse> {
    const response = await api.get(`/api/v1/clients/${clientTable}`, {
      params: {
        search: searchQuery,
        page,
        limit,
      },
    })
    return response.data.data
  },

  /**
   * Get a specific client by ID from a specific table
   * @param clientTable - The type of client table
   * @param clientId - The client ID
   */
  async getById(clientTable: ClientTableType, clientId: number): Promise<Client> {
    const response = await api.get(`/api/v1/clients/${clientTable}/${clientId}`)
    return response.data.data.client
  },

  /**
   * Get client type label
   */
  getClientTypeLabel(clientTable: ClientTableType | null | undefined): string {
    if (!clientTable) return ''
    const config = CLIENT_TYPES.find((type) => type.value === clientTable)
    return config?.label || clientTable
  },
}

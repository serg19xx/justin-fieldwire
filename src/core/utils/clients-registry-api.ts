import { api } from './api'
import type { ClientListPagination, ClientListRow } from '@/core/types/client-registry'
import type { ClientRegistryEntry } from '@/core/types/client-registry'

export interface ClientListQuery {
  page?: number
  limit?: number
  search?: string
  country?: string
  region?: string
  specialty?: string
  clinicType?: string
  sub_type?: string
  sales_cycle?: string
}

export interface ClientListResult {
  rows: ClientListRow[]
  pagination: ClientListPagination
}

function extractListPayload(
  body: unknown,
  responseKey: string,
): { rows: ClientListRow[]; pagination: ClientListPagination } {
  const root = body as {
    data?: Record<string, unknown> & { pagination?: ClientListPagination }
  }
  const data = root?.data ?? {}
  const rows = data[responseKey]
  const list = Array.isArray(rows) ? (rows as ClientListRow[]) : []
  const pagination = (data.pagination as ClientListPagination) ?? {
    page: 1,
    limit: list.length,
    total: list.length,
    pages: 1,
  }
  return {
    rows: list,
    pagination: {
      page: Number(pagination.page) || 1,
      limit: Number(pagination.limit) || list.length,
      total: Number(pagination.total) || list.length,
      pages: Number(pagination.pages) || 1,
    },
  }
}

export const clientsRegistryApi = {
  async list(entry: ClientRegistryEntry, query: ClientListQuery = {}): Promise<ClientListResult> {
    const params: Record<string, string | number> = {
      page: query.page ?? 1,
      limit: query.limit ?? entry.defaultPageSize ?? 10,
    }
    if (query.country) params.country = query.country
    if (query.region) params.region = query.region
    if (query.specialty) params.specialty = query.specialty
    if (query.clinicType) params.clinicType = query.clinicType
    if (query.sub_type) params.sub_type = query.sub_type
    if (query.sales_cycle) params.sales_cycle = query.sales_cycle

    const response = await api.get(`/api/v1${entry.listApiPath}`, { params })
    let { rows, pagination } = extractListPayload(response.data, entry.listResponseKey)

    const search = query.search?.trim().toLowerCase()
    if (search) {
      rows = rows.filter((row) => {
        const name = String(row[entry.nameField] ?? '').toLowerCase()
        const email = String(row.email ?? '').toLowerCase()
        const legal = String(row.legalName ?? '').toLowerCase()
        const contact = String(row.contact ?? row.contactName ?? '').toLowerCase()
        const company = String(row.company ?? '').toLowerCase()
        const specialty = String(row.specialty ?? '').toLowerCase()
        const title = String(row.prefTitle ?? '').toLowerCase()
        const workplace = String(row.workplace ?? '').toLowerCase()
        const regNumber = String(row.reg_number ?? '').toLowerCase()
        const pharmacy = String(row.operName ?? '').toLowerCase()
        const clinicName = String(row.clinicName ?? '').toLowerCase()
        const contactName = String(row.contactName ?? '').toLowerCase()
        const clinicType = String(row.clinicType ?? '').toLowerCase()
        return (
          name.includes(search) ||
          email.includes(search) ||
          legal.includes(search) ||
          contact.includes(search) ||
          company.includes(search) ||
          specialty.includes(search) ||
          title.includes(search) ||
          workplace.includes(search) ||
          regNumber.includes(search) ||
          pharmacy.includes(search) ||
          clinicName.includes(search) ||
          contactName.includes(search) ||
          clinicType.includes(search)
        )
      })
    }

    return { rows, pagination }
  },

  /** Fetch a larger sample to build distinct filter option lists */
  async listForFilterOptions(entry: ClientRegistryEntry): Promise<ClientListRow[]> {
    const response = await api.get(`/api/v1${entry.listApiPath}`, {
      params: { page: 1, limit: 500 },
    })
    const { rows } = extractListPayload(response.data, entry.listResponseKey)
    return rows
  },

  async fetchCountries(): Promise<Array<{ code: string; name: string; geoCode: string }>> {
    try {
      const response = await api.get('/api/v1/geography/countries')
      const data = response.data?.data?.countries ?? response.data?.countries
      if (!Array.isArray(data)) return []
      return data.map((c: { code2?: string; name?: string }) => ({
        code: String(c.name ?? ''),
        name: String(c.name ?? ''),
        geoCode: String(c.code2 ?? ''),
      }))
    } catch {
      return []
    }
  },

  async fetchRegions(countryCode: string): Promise<string[]> {
    if (!countryCode) return []
    try {
      const response = await api.get(`/api/v1/geography/countries/${countryCode}/regions`)
      const data = response.data?.data?.regions ?? response.data?.regions
      if (!Array.isArray(data)) return []
      return data.map((r: { name?: string; region?: string }) => String(r.name ?? r.region ?? r))
    } catch {
      return []
    }
  },
}

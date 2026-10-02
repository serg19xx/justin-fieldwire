import { api } from './api'

export type ExternalContactKind = 'contractors' | 'inspectors'

export interface ExternalContact {
  id: number
  name: string
  company?: string | null
  phone?: string | null
  email?: string | null
  trade?: string | null
  specialty?: string | null
  notes?: string | null
  is_active: boolean
  created_at?: string | null
  updated_at?: string | null
}

export interface ExternalContactInput {
  name: string
  company?: string | null
  phone?: string | null
  email?: string | null
  trade?: string | null
  specialty?: string | null
  notes?: string | null
  is_active?: boolean
}

function listKey(kind: ExternalContactKind): string {
  return kind
}

function singularKey(kind: ExternalContactKind): 'contractor' | 'inspector' {
  return kind === 'contractors' ? 'contractor' : 'inspector'
}

function unwrapList(kind: ExternalContactKind, body: unknown): ExternalContact[] {
  if (!body || typeof body !== 'object') return []
  const root = body as Record<string, unknown>
  const data = (root.data && typeof root.data === 'object' ? root.data : root) as Record<string, unknown>
  const rows = data[listKey(kind)]
  return Array.isArray(rows) ? (rows as ExternalContact[]) : []
}

function unwrapOne(kind: ExternalContactKind, body: unknown): ExternalContact | null {
  if (!body || typeof body !== 'object') return null
  const root = body as Record<string, unknown>
  const data = (root.data && typeof root.data === 'object' ? root.data : root) as Record<string, unknown>
  const row = data[singularKey(kind)]
  return row && typeof row === 'object' ? (row as ExternalContact) : null
}

export async function listExternalContacts(
  kind: ExternalContactKind,
  options: { search?: string; includeInactive?: boolean } = {},
): Promise<ExternalContact[]> {
  const params = new URLSearchParams()
  if (options.search?.trim()) params.set('search', options.search.trim())
  if (options.includeInactive) params.set('include_inactive', '1')
  const qs = params.toString()
  const path = `/api/v1/${kind}${qs ? `?${qs}` : ''}`
  const response = await api.get(path)
  return unwrapList(kind, response.data)
}

export async function createExternalContact(
  kind: ExternalContactKind,
  input: ExternalContactInput,
): Promise<ExternalContact | null> {
  const response = await api.post(`/api/v1/${kind}`, input)
  return unwrapOne(kind, response.data)
}

export async function updateExternalContact(
  kind: ExternalContactKind,
  id: number,
  input: Partial<ExternalContactInput>,
): Promise<ExternalContact | null> {
  const response = await api.put(`/api/v1/${kind}/${id}`, input)
  return unwrapOne(kind, response.data)
}

export async function deactivateExternalContact(
  kind: ExternalContactKind,
  id: number,
): Promise<void> {
  await api.delete(`/api/v1/${kind}/${id}`)
}

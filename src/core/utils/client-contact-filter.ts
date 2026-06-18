import type { ClientRegistryKey } from '@/core/types/client-registry'

export type ClientContactFilterFieldKey = 'name' | 'phone' | 'fax' | 'email'

export type ClientContactFilterMode = 'filled' | 'empty'

export interface ClientContactFilterField {
  key: ClientContactFilterFieldKey
  label: string
}

const FIELD_SETS: Record<ClientRegistryKey, ClientContactFilterField[]> = {
  pharma: [
    { key: 'name', label: 'Oper name' },
    { key: 'phone', label: 'Phone #' },
    { key: 'fax', label: 'Fax #' },
    { key: 'email', label: 'Email' },
  ],
  physician: [
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'fax', label: 'Fax' },
    { key: 'email', label: 'Email' },
  ],
  pharmacist: [
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Cell phone' },
    { key: 'email', label: 'Email' },
  ],
  medical_clinic: [
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'fax', label: 'Fax' },
    { key: 'email', label: 'Email' },
  ],
}

export function getClientContactFilterFields(key: ClientRegistryKey): ClientContactFilterField[] {
  return FIELD_SETS[key]
}

export function formatContactFilterLabel(
  field: ClientContactFilterField,
  mode: ClientContactFilterMode,
): string {
  return mode === 'filled' ? `${field.label}: has value` : `${field.label}: no value`
}

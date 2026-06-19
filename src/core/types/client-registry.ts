/** Registry key for a client entity type in the Clients UI. */
export type ClientRegistryKey =
  | 'pharma'
  | 'physician'
  | 'pharmacist'
  | 'medical_clinic'

export type ClientRowActionId =
  | 'delete'
  | 'edit'
  | 'fixAddress'
  | 'sms'
  | 'fax'
  | 'documents'
  | 'email'
  | 'statusMessage'
  | 'statusLock'
  | 'statusEmail'
  | 'statusFolder'
  | 'message'
  | 'addUser'

export type ClientToolbarActionId = 'loadCsv' | 'exportCsv' | 'add'

export type ClientColumnKind = 'text' | 'coordinates' | 'map' | 'rowIndex'

export interface ClientTableColumn {
  key: string
  label: string
  kind?: ClientColumnKind
  sortable?: boolean
  /** API/DB field used when sorting (defaults to `key`; use for rowIndex → id). */
  sortKey?: string
  /** For kind=coordinates */
  latKey?: string
  lngKey?: string
  /** Plain text columns — mailto/tel link on cell value */
  comms?: 'phone' | 'email' | 'fax'
  /** Row field used for comms link (e.g. cellPhone vs officePhone) */
  commsKey?: string
}

export interface ClientFilterDef {
  key: string
  label: string
  /** Query param sent to list API */
  queryParam: string
  /** Load options from distinct values in a sample list fetch */
  optionsFromData?: boolean
  /** Empty option label, e.g. "All" */
  emptyOption?: string
  /** Label shown beside the control (legacy speciality filter) */
  inline?: boolean
}

export interface ClientRegistryEntry {
  key: ClientRegistryKey
  label: string
  pluralLabel: string
  /** Page heading matching legacy admin, e.g. "List of pharmacies" */
  listTitle?: string
  dbTable: string
  listApiPath: string
  listResponseKey: string
  nameField: string
  columns: ClientTableColumn[]
  filters: ClientFilterDef[]
  /** First table column: per-row edit and delete. */
  leadingActions: ClientRowActionId[]
  /** Last table column: communication and secondary actions. */
  trailingActions: ClientRowActionId[]
  toolbarActions?: ClientToolbarActionId[]
  /** Suffix after page-size select, e.g. "entries per page" */
  entriesLabel?: string
  linkableToProject: boolean
  enabled: boolean
  defaultPageSize?: number
  pageSizeOptions?: number[]
}

export interface ClientListPagination {
  page: number
  limit: number
  total: number
  pages: number
}

export interface ClientListRow {
  id: number
  [key: string]: unknown
}

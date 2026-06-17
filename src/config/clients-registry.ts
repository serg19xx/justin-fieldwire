import type { ClientRegistryEntry, ClientRegistryKey } from '@/core/types/client-registry'

const defaultLeading = ['delete', 'edit', 'fixAddress', 'sms'] as const
const defaultTrailing = ['documents', 'email'] as const

/**
 * Client types for the Clients section UI.
 * Pharmacies layout matches legacy EasyRx.Admin list (#!pharmacy).
 */
const pharmaToolbar: ClientRegistryEntry['toolbarActions'] = [
  'loadCsv',
  'exportCsv',
  'sendgridTemplate',
  'add',
]

export const CLIENTS_REGISTRY: ClientRegistryEntry[] = [
  {
    key: 'pharma',
    label: 'Pharmacy',
    pluralLabel: 'Pharmacies',
    listTitle: 'List of pharmacies',
    dbTable: 'pharma',
    listApiPath: '/pharmacies',
    listResponseKey: 'pharmacies',
    nameField: 'operName',
    linkableToProject: true,
    enabled: true,
    defaultPageSize: 10,
    pageSizeOptions: [10, 25, 50, 100],
    toolbarActions: pharmaToolbar,
    leadingActions: [...defaultLeading],
    trailingActions: [...defaultTrailing],
    filters: [
      { key: 'country', label: 'Select country', queryParam: 'country' },
      { key: 'region', label: 'Select region', queryParam: 'region' },
      { key: 'sub_type', label: 'Select subtype', queryParam: 'sub_type', optionsFromData: true },
      { key: 'sales_cycle', label: 'Select sales cycle', queryParam: 'sales_cycle', optionsFromData: true },
    ],
    columns: [
      { key: 'id', label: '#', sortable: true },
      { key: 'operName', label: 'Oper name', sortable: true },
      { key: 'legalName', label: 'Legal name', sortable: true },
      { key: 'contact', label: 'Contact name' },
      { key: 'phone', label: 'Phone #' },
      { key: 'fax', label: 'Fax #', comms: 'fax' },
      { key: 'email', label: 'Email', comms: 'email' },
      { key: 'fullAddress', label: 'Address' },
      { key: 'coordinates', label: 'Coordinates', kind: 'coordinates', latKey: 'lat', lngKey: 'lng' },
      { key: 'map', label: 'Map', kind: 'map', latKey: 'lat', lngKey: 'lng' },
      { key: 'country', label: 'Country', sortable: true },
      { key: 'region', label: 'Region', sortable: true },
      { key: 'city', label: 'City', sortable: true },
    ],
  },
  {
    key: 'physician',
    label: 'Physician',
    pluralLabel: 'Physicians & Providers',
    listTitle: 'Physicians & Providers',
    dbTable: 'physician',
    listApiPath: '/physicians',
    listResponseKey: 'physicians',
    nameField: 'fullName',
    linkableToProject: true,
    enabled: true,
    defaultPageSize: 10,
    pageSizeOptions: [10, 25, 50, 100],
    entriesLabel: 'entries per page',
    toolbarActions: ['sendgridTemplate', 'exportCsv'],
    leadingActions: ['statusMessage', 'statusLock', 'statusEmail'],
    trailingActions: ['message', 'addUser', 'delete'],
    filters: [
      {
        key: 'specialty',
        label: 'Speciality filter:',
        queryParam: 'specialty',
        optionsFromData: true,
        emptyOption: 'All',
        inline: true,
      },
    ],
    columns: [
      { key: '_rowIndex', label: '#', kind: 'rowIndex' },
      { key: 'prefTitle', label: 'Title' },
      { key: 'fullName', label: 'Name', sortable: true },
      { key: 'specialty', label: 'Specialty', sortable: true },
      { key: 'company', label: 'Company' },
      { key: 'cellPhone', label: 'Cell phone', comms: 'phone', commsKey: 'cellPhone' },
      { key: 'officePhone', label: 'Office phone', comms: 'phone', commsKey: 'officePhone' },
      { key: 'faxNumber', label: 'Fax', comms: 'fax', commsKey: 'faxNumber' },
      { key: 'email', label: 'Email', comms: 'email', commsKey: 'email' },
      { key: 'fullAddress', label: 'Address' },
    ],
  },
  {
    key: 'pharmacist',
    label: 'Pharmacist',
    pluralLabel: 'Pharmacists',
    listTitle: 'Pharmacists',
    dbTable: 'pharmacist',
    listApiPath: '/pharmacists',
    listResponseKey: 'pharmacists',
    nameField: 'fullName',
    linkableToProject: true,
    enabled: true,
    defaultPageSize: 10,
    pageSizeOptions: [10, 25, 50, 100],
    entriesLabel: 'entries per page',
    toolbarActions: ['sendgridTemplate', 'exportCsv'],
    leadingActions: ['statusMessage', 'statusEmail'],
    trailingActions: ['message', 'addUser', 'delete'],
    filters: [],
    columns: [
      { key: '_rowIndex', label: '#', kind: 'rowIndex' },
      { key: 'fullName', label: 'Name', sortable: true },
      { key: 'reg_number', label: 'Reg#' },
      { key: 'operName', label: 'Pharmacy' },
      { key: 'workplace', label: 'Workplace' },
      { key: 'cell_phone', label: 'Cell phone', comms: 'phone', commsKey: 'cell_phone' },
      { key: 'email', label: 'Email', comms: 'email', commsKey: 'email' },
    ],
  },
  {
    key: 'medical_clinic',
    label: 'Medical clinic',
    pluralLabel: 'Medical clinics',
    listTitle: 'Medical clinics',
    dbTable: 'medical_clinic',
    listApiPath: '/medical-clinics',
    listResponseKey: 'medical_clinics',
    nameField: 'clinicName',
    linkableToProject: true,
    enabled: true,
    defaultPageSize: 10,
    pageSizeOptions: [10, 25, 50, 100],
    entriesLabel: 'entries per page',
    toolbarActions: ['sendgridTemplate', 'exportCsv'],
    leadingActions: ['statusEmail', 'statusFolder'],
    trailingActions: ['message', 'addUser', 'delete'],
    filters: [
      { key: 'country', label: 'Select country', queryParam: 'country' },
      { key: 'region', label: 'Select region', queryParam: 'region' },
      {
        key: 'clinicType',
        label: 'Select clinic type',
        queryParam: 'clinicType',
        optionsFromData: true,
      },
    ],
    columns: [
      { key: '_rowIndex', label: '#', kind: 'rowIndex' },
      { key: 'clinicName', label: 'Name', sortable: true },
      { key: 'clinicType', label: 'Type', sortable: true },
      { key: 'contactName', label: 'Contact' },
      { key: 'phone', label: 'Phone', comms: 'phone', commsKey: 'phone' },
      { key: 'fax', label: 'Fax', comms: 'fax', commsKey: 'fax' },
      { key: 'email', label: 'Email', comms: 'email', commsKey: 'email' },
      { key: 'fullAddress', label: 'Address' },
    ],
  },
]

export const DEFAULT_CLIENT_REGISTRY_KEY: ClientRegistryKey = 'pharma'

export function getClientRegistryEntry(key: string): ClientRegistryEntry | undefined {
  return CLIENTS_REGISTRY.find((e) => e.key === key && e.enabled)
}

export function getEnabledClientTypes(): ClientRegistryEntry[] {
  return CLIENTS_REGISTRY.filter((e) => e.enabled)
}

import type { ClientRegistryEntry, ClientRegistryKey } from '@/core/types/client-registry'

/** First table column: per-row edit and delete. */
const rowActions = ['edit', 'delete'] as const

const defaultToolbar: ClientRegistryEntry['toolbarActions'] = [
  'add',
  'exportCsv',
]

const pharmaToolbar: ClientRegistryEntry['toolbarActions'] = [
  'add',
  'loadCsv',
  'exportCsv',
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
    leadingActions: [...rowActions],
    trailingActions: ['sms', 'meetingInvite', 'email', 'fax'],
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
      { key: 'email', label: 'Email', comms: 'email', sortable: true },
      { key: 'fullAddress', label: 'Address' },
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
    toolbarActions: [...defaultToolbar],
    leadingActions: [...rowActions],
    trailingActions: ['sms', 'meetingInvite', 'email', 'fax'],
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
      { key: '_rowIndex', label: '#', kind: 'rowIndex', sortable: true, sortKey: 'id' },
      { key: 'prefTitle', label: 'Title' },
      { key: 'fullName', label: 'Name', sortable: true },
      { key: 'specialty', label: 'Specialty', sortable: true },
      { key: 'company', label: 'Company', sortable: true },
      { key: 'cellPhone', label: 'Cell phone', comms: 'phone', commsKey: 'cellPhone' },
      { key: 'officePhone', label: 'Office phone', comms: 'phone', commsKey: 'officePhone' },
      { key: 'faxNumber', label: 'Fax', comms: 'fax', commsKey: 'faxNumber' },
      { key: 'email', label: 'Email', comms: 'email', commsKey: 'email', sortable: true },
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
    toolbarActions: [...defaultToolbar],
    leadingActions: [...rowActions],
    trailingActions: ['sms', 'meetingInvite', 'email'],
    filters: [],
    columns: [
      { key: '_rowIndex', label: '#', kind: 'rowIndex', sortable: true, sortKey: 'id' },
      { key: 'fullName', label: 'Name', sortable: true },
      { key: 'reg_number', label: 'Reg#', sortable: true },
      { key: 'operName', label: 'Pharmacy', sortable: true },
      { key: 'workplace', label: 'Workplace', sortable: true },
      { key: 'cell_phone', label: 'Cell phone', comms: 'phone', commsKey: 'cell_phone' },
      { key: 'email', label: 'Email', comms: 'email', commsKey: 'email', sortable: true },
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
    toolbarActions: [...defaultToolbar],
    leadingActions: [...rowActions],
    trailingActions: ['meetingInvite', 'email', 'fax'],
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
      { key: '_rowIndex', label: '#', kind: 'rowIndex', sortable: true, sortKey: 'id' },
      { key: 'clinicName', label: 'Name', sortable: true },
      { key: 'clinicType', label: 'Type', sortable: true },
      { key: 'contactName', label: 'Contact', sortable: true },
      { key: 'phone', label: 'Phone', comms: 'phone', commsKey: 'phone' },
      { key: 'fax', label: 'Fax', comms: 'fax', commsKey: 'fax' },
      { key: 'email', label: 'Email', comms: 'email', commsKey: 'email', sortable: true },
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

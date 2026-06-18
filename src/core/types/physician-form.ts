/** Editable physician fields for Clients UI (maps to `physician` table). */
export interface PhysicianFormModel {
  prefTitle: string
  fullName: string
  specialty: string
  company: string
  country: string
  region: string
  city: string
  unitNumb: string
  fullAddress: string
  postal: string
  cellPhone: string
  officePhone: string
  faxNumber: string
  email: string
  notes: string
}

export const PHYSICIAN_TITLE_OPTIONS = ['Dr.', 'Mr.', 'Mrs.', 'Ms.', 'Prof.', 'Rev.'] as const

export function emptyPhysicianForm(): PhysicianFormModel {
  return {
    prefTitle: 'Dr.',
    fullName: '',
    specialty: '',
    company: '',
    country: '',
    region: '',
    city: '',
    unitNumb: '',
    fullAddress: '',
    postal: '',
    cellPhone: '',
    officePhone: '',
    faxNumber: '',
    email: '',
    notes: '',
  }
}

export function physicianFormFromRow(row: Record<string, unknown>): PhysicianFormModel {
  return {
    prefTitle: String(row.prefTitle ?? 'Dr.'),
    fullName: String(row.fullName ?? ''),
    specialty: String(row.specialty ?? ''),
    company: String(row.company ?? ''),
    country: String(row.country ?? ''),
    region: String(row.region ?? ''),
    city: String(row.city ?? ''),
    unitNumb: String(row.unitNumb ?? ''),
    fullAddress: String(row.fullAddress ?? ''),
    postal: String(row.postal ?? ''),
    cellPhone: String(row.cellPhone ?? ''),
    officePhone: String(row.officePhone ?? ''),
    faxNumber: String(row.faxNumber ?? ''),
    email: String(row.email ?? ''),
    notes: String(row.notes ?? ''),
  }
}

export function physicianFormToPayload(form: PhysicianFormModel): Record<string, string> {
  return {
    prefTitle: form.prefTitle.trim(),
    fullName: form.fullName.trim(),
    specialty: form.specialty.trim(),
    company: form.company.trim(),
    country: form.country.trim(),
    region: form.region.trim(),
    city: form.city.trim(),
    unitNumb: form.unitNumb.trim(),
    fullAddress: form.fullAddress.trim(),
    postal: form.postal.trim(),
    cellPhone: form.cellPhone.trim(),
    officePhone: form.officePhone.trim(),
    faxNumber: form.faxNumber.trim(),
    email: form.email.trim(),
    notes: form.notes.trim(),
  }
}

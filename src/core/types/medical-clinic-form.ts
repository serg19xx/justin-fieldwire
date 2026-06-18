/** Editable medical clinic fields for Clients UI (maps to `medical_clinic` table). */
export interface MedicalClinicFormModel {
  clinicName: string
  clinicType: string
  contactName: string
  phone: string
  fax: string
  email: string
  country: string
  region: string
  city: string
  postal: string
  unitNumb: string
  streetName: string
  notes: string
}

export function emptyMedicalClinicForm(): MedicalClinicFormModel {
  return {
    clinicName: '',
    clinicType: '',
    contactName: '',
    phone: '',
    fax: '',
    email: '',
    country: '',
    region: '',
    city: '',
    postal: '',
    unitNumb: '',
    streetName: '',
    notes: '',
  }
}

export function medicalClinicFormFromRow(row: Record<string, unknown>): MedicalClinicFormModel {
  return {
    clinicName: String(row.clinicName ?? ''),
    clinicType: String(row.clinicType ?? ''),
    contactName: String(row.contactName ?? ''),
    phone: String(row.phone ?? ''),
    fax: String(row.fax ?? ''),
    email: String(row.email ?? ''),
    country: String(row.country ?? ''),
    region: String(row.region ?? ''),
    city: String(row.city ?? ''),
    postal: String(row.postal ?? ''),
    unitNumb: String(row.unitNumb ?? ''),
    streetName: String(row.streetName ?? ''),
    notes: String(row.notes ?? ''),
  }
}

export function medicalClinicFormToPayload(
  form: MedicalClinicFormModel,
): Record<string, string> {
  return {
    clinicName: form.clinicName.trim(),
    clinicType: form.clinicType.trim(),
    contactName: form.contactName.trim(),
    phone: form.phone.trim(),
    fax: form.fax.trim(),
    email: form.email.trim(),
    country: form.country.trim(),
    region: form.region.trim(),
    city: form.city.trim(),
    postal: form.postal.trim(),
    unitNumb: form.unitNumb.trim(),
    streetName: form.streetName.trim(),
    notes: form.notes.trim(),
  }
}

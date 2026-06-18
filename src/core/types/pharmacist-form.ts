/** Editable pharmacist fields for Clients UI (maps to `pharmacist` table). */
export interface PharmacistFormModel {
  fullName: string
  reg_number: string
  pharmId: string
  pharm_owned: string
  workplace: string
  cell_phone: string
  email: string
  notes: string
}

export function emptyPharmacistForm(): PharmacistFormModel {
  return {
    fullName: '',
    reg_number: '',
    pharmId: '',
    pharm_owned: '',
    workplace: '',
    cell_phone: '',
    email: '',
    notes: '',
  }
}

export function pharmacistFormFromRow(row: Record<string, unknown>): PharmacistFormModel {
  const pharmId = row.pharmId
  return {
    fullName: String(row.fullName ?? ''),
    reg_number: String(row.reg_number ?? ''),
    pharmId: pharmId != null && String(pharmId).trim() !== '' ? String(pharmId) : '',
    pharm_owned: String(row.pharm_owned ?? ''),
    workplace: String(row.workplace ?? ''),
    cell_phone: String(row.cell_phone ?? ''),
    email: String(row.email ?? ''),
    notes: String(row.notes ?? ''),
  }
}

export function pharmacistFormToPayload(
  form: PharmacistFormModel,
): Record<string, string | number | null> {
  const pharmId = form.pharmId.trim()
  return {
    fullName: form.fullName.trim(),
    reg_number: form.reg_number.trim(),
    pharmId: pharmId ? Number(pharmId) : null,
    pharm_owned: form.pharm_owned.trim(),
    workplace: form.workplace.trim(),
    cell_phone: form.cell_phone.trim(),
    email: form.email.trim(),
    notes: form.notes.trim(),
  }
}

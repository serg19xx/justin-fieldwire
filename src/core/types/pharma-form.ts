/** Editable pharmacy fields for Clients UI (maps to `pharma` table). */
export interface PharmacyFormModel {
  operName: string
  legalName: string
  contact: string
  owner: string
  manager: string
  phone: string
  cell: string
  fax: string
  email: string
  login: string
  twilioPhone: string
  unitNumb: string
  street: string
  city: string
  region: string
  postcode: string
  country: string
  fullAddress: string
  sub_type: string
  comp_volumes: string
  sales_cycle: string
  otpFee: string
  marketingFee: string
  notes: string
}

export function emptyPharmacyForm(): PharmacyFormModel {
  return {
    operName: '',
    legalName: '',
    contact: '',
    owner: '',
    manager: '',
    phone: '',
    cell: '',
    fax: '',
    email: '',
    login: '',
    twilioPhone: '',
    unitNumb: '',
    street: '',
    city: '',
    region: '',
    postcode: '',
    country: '',
    fullAddress: '',
    sub_type: '',
    comp_volumes: '',
    sales_cycle: '',
    otpFee: '0',
    marketingFee: '0',
    notes: '',
  }
}

export function pharmacyFormFromRow(row: Record<string, unknown>): PharmacyFormModel {
  return {
    operName: String(row.operName ?? ''),
    legalName: String(row.legalName ?? ''),
    contact: String(row.contact ?? ''),
    owner: String(row.owner ?? ''),
    manager: String(row.manager ?? ''),
    phone: String(row.phone ?? ''),
    cell: String(row.cell ?? ''),
    fax: String(row.fax ?? ''),
    email: String(row.email ?? ''),
    login: String(row.login ?? ''),
    twilioPhone: String(row.twilioPhone ?? ''),
    unitNumb: String(row.unitNumb ?? ''),
    street: String(row.street ?? ''),
    city: String(row.city ?? ''),
    region: String(row.region ?? ''),
    postcode: String(row.postcode ?? ''),
    country: String(row.country ?? ''),
    fullAddress: String(row.fullAddress ?? ''),
    sub_type: row.sub_type != null && String(row.sub_type).trim() !== '' ? String(row.sub_type) : '',
    comp_volumes:
      row.comp_volumes != null && String(row.comp_volumes).trim() !== ''
        ? String(row.comp_volumes)
        : '',
    sales_cycle:
      row.sales_cycle != null && String(row.sales_cycle).trim() !== ''
        ? String(row.sales_cycle)
        : '',
    otpFee: String(row.otpFee ?? '0'),
    marketingFee: String(row.marketingFee ?? '0'),
    notes: String(row.notes ?? ''),
  }
}

export function pharmacyFormToPayload(form: PharmacyFormModel): Record<string, string | number> {
  return {
    operName: form.operName.trim(),
    legalName: form.legalName.trim(),
    contact: form.contact.trim(),
    owner: form.owner.trim(),
    manager: form.manager.trim(),
    phone: form.phone.trim(),
    cell: form.cell.trim(),
    fax: form.fax.trim(),
    email: form.email.trim(),
    twilioPhone: form.twilioPhone.trim(),
    unitNumb: form.unitNumb.trim(),
    street: form.street.trim(),
    city: form.city.trim(),
    region: form.region.trim(),
    postcode: form.postcode.trim(),
    country: form.country.trim(),
    fullAddress: form.fullAddress.trim(),
    sub_type: form.sub_type.trim(),
    comp_volumes: form.comp_volumes.trim(),
    sales_cycle: form.sales_cycle.trim(),
    otpFee: Number(form.otpFee) || 0,
    marketingFee: Number(form.marketingFee) || 0,
    notes: form.notes.trim(),
  }
}

export function pharmacyFormToCreatePayload(
  form: PharmacyFormModel,
): Record<string, string | number> {
  const payload = pharmacyFormToPayload(form)
  return {
    ...payload,
    login: form.login.trim(),
    sub_type: payload.sub_type || 'Unknown',
    comp_volumes: payload.comp_volumes || 'Unknown',
    sales_cycle: payload.sales_cycle || 'Unknown',
  }
}

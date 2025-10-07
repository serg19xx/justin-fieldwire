/**
 * Address validation and formatting utilities
 * Handles common address field combinations and validation
 */

export interface AddressFields {
  fullAddress?: string | null
  unitNumber?: string | null
  streetNumber?: string | null
  city?: string | null
  region?: string | null
  postal?: string | null
  country?: string | null
  [key: string]: string | null | undefined
}

/**
 * Validates if a field has meaningful content
 * @param value - The field value to validate
 * @returns true if the field has valid content
 */
export function isValidAddressField(value: string | null | undefined): boolean {
  return !!(value && value.trim() !== '')
}

/**
 * Builds a formatted address from individual fields
 * @param fields - Object containing address fields
 * @param fieldMapping - Optional mapping of field names (useful for different data structures)
 * @returns Formatted address string or empty string if no valid fields
 */
export function buildAddress(
  fields: AddressFields,
  fieldMapping?: Partial<Record<keyof AddressFields, string>>,
): string {
  // Use fullAddress if it exists and is valid
  if (isValidAddressField(fields.fullAddress)) {
    return fields.fullAddress!
  }

  // Map field names if custom mapping provided
  const unitNumber = fieldMapping?.unitNumber ? fields[fieldMapping.unitNumber] : fields.unitNumber
  const streetNumber = fieldMapping?.streetNumber
    ? fields[fieldMapping.streetNumber]
    : fields.streetNumber
  const city = fieldMapping?.city ? fields[fieldMapping.city] : fields.city
  const region = fieldMapping?.region ? fields[fieldMapping.region] : fields.region
  const postal = fieldMapping?.postal ? fields[fieldMapping.postal] : fields.postal
  const country = fieldMapping?.country ? fields[fieldMapping.country] : fields.country

  // Collect all valid address parts
  const addressParts = [unitNumber, streetNumber, city, region, postal, country].filter(
    isValidAddressField,
  )

  // Return formatted address or empty string
  return addressParts.length > 0 ? addressParts.join(', ') : ''
}

/**
 * Builds address for Physicians (specific field mapping)
 * @param physician - Physician object with address fields
 * @returns Formatted address string
 */
export function buildPhysicianAddress(physician: Record<string, unknown>): string {
  return buildAddress(physician as AddressFields, {
    unitNumber: 'unitNumb',
    streetNumber: 'streetNumber',
  })
}

/**
 * Builds address for Pharmacies (specific field mapping)
 * @param pharmacy - Pharmacy object with address fields
 * @returns Formatted address string
 */
export function buildPharmacyAddress(pharmacy: Record<string, unknown>): string {
  return buildAddress(pharmacy as AddressFields, {
    unitNumber: 'unitNumb',
    streetNumber: 'street',
  })
}

/**
 * Builds address for Patients (specific field mapping)
 * @param patient - Patient object with address fields
 * @returns Formatted address string
 */
export function buildPatientAddress(patient: Record<string, unknown>): string {
  return buildAddress(patient as AddressFields, {
    unitNumber: 'address1',
    streetNumber: 'address2',
  })
}

/**
 * Builds address for Drivers (specific field mapping)
 * @param driver - Driver object with address fields
 * @returns Formatted address string
 */
export function buildDriverAddress(driver: Record<string, unknown>): string {
  return buildAddress(driver as AddressFields, {
    unitNumber: 'unitNumber',
    streetNumber: 'streetAddress',
  })
}

/**
 * Builds address for Clinics (specific field mapping)
 * @param clinic - Clinic object with address fields
 * @returns Formatted address string
 */
export function buildClinicAddress(clinic: Record<string, unknown>): string {
  return buildAddress(clinic as AddressFields, {
    unitNumber: 'unitNumber',
    streetNumber: 'streetAddress',
  })
}

/**
 * Builds address for Medical Clinics (specific field mapping)
 * @param clinic - Medical Clinic object with address fields
 * @returns Formatted address string
 */
export function buildMedicalClinicAddress(clinic: Record<string, unknown>): string {
  return buildAddress(clinic as AddressFields, {
    unitNumber: 'unitNumb',
    streetNumber: 'streetName',
  })
}

/**
 * Truncates address for display in tables
 * @param address - Full address string
 * @param maxLength - Maximum length before truncation (default: 50)
 * @returns Truncated address with ellipsis if needed
 */
export function truncateAddress(address: string, maxLength: number = 50): string {
  if (!address || address.length <= maxLength) {
    return address
  }
  return address.substring(0, maxLength) + '...'
}

/**
 * Formats address for display with fallback to dash
 * @param address - Address string to format
 * @param maxLength - Maximum length before truncation (default: 50)
 * @returns Formatted address or dash if empty
 */
export function formatAddressForDisplay(address: string, maxLength: number = 50): string {
  if (!address || address.trim() === '') {
    return '-'
  }
  return truncateAddress(address, maxLength)
}

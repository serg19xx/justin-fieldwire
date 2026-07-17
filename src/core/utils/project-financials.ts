/** Project Financials helpers (fee × doctors + area × cost × mark-up). */

export function parseFinancialNumber(raw: string | number | null | undefined): number {
  if (raw === null || raw === undefined || raw === '') {
    return 0
  }
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? raw : 0
  }
  const cleaned = String(raw).replace(/[$,%\s]/g, '').trim()
  if (!cleaned) {
    return 0
  }
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : 0
}

export interface FinancialsTotalInput {
  projectFeePerDoctor?: string | number | null
  totalDoctors?: string | number | null
  area?: number | null
  costPerSqFt?: string | number | null
  markUp?: string | number | null
}

/**
 * (Project Fee per Doctor × Total Doctors) + (Area × Cost per Sq/Ft × Mark Up)
 * Empty values count as 0. Mark Up is a direct multiplier (e.g. 1.15).
 */
export function computeFinancialsTotal(input: FinancialsTotalInput): number {
  const fee = parseFinancialNumber(input.projectFeePerDoctor)
  const doctors = parseFinancialNumber(input.totalDoctors)
  const area = typeof input.area === 'number' && Number.isFinite(input.area) ? input.area : 0
  const cost = parseFinancialNumber(input.costPerSqFt)
  const markUp = parseFinancialNumber(input.markUp)
  return fee * doctors + area * cost * markUp
}

export function formatFinancialsTotal(value: number): string {
  return value.toLocaleString('en-CA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

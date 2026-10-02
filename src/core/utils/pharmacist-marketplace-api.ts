import { api } from './api'

export interface PharmacistProjectInterest {
  projectId: number
  pharmacistId: number
  decision?: 'pursue' | 'not_interested' | null
  ndaSigned: boolean
  ndaSignedAt?: string | null
  ndaSignerName?: string | null
  ndaDocumentId?: string | null
  leaseSigned: boolean
  leaseSignedAt?: string | null
  leaseSignerName?: string | null
  leaseModifications?: string | null
  updatedAt: string
}

const STORAGE_KEY_PREFIX = 'fw_pharma_interests_'

function getStorageKey(pharmacistId: number): string {
  return `${STORAGE_KEY_PREFIX}${pharmacistId}`
}

export function loadLocalInterests(pharmacistId: number): Record<number, PharmacistProjectInterest> {
  if (!pharmacistId) return {}
  try {
    const raw = localStorage.getItem(getStorageKey(pharmacistId))
    if (!raw) return {}
    return JSON.parse(raw) as Record<number, PharmacistProjectInterest>
  } catch {
    return {}
  }
}

export function saveLocalInterest(interest: PharmacistProjectInterest): void {
  if (!interest.pharmacistId || !interest.projectId) return
  try {
    const map = loadLocalInterests(interest.pharmacistId)
    map[interest.projectId] = {
      ...interest,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(getStorageKey(interest.pharmacistId), JSON.stringify(map))
  } catch (err) {
    console.error('Failed to save pharmacist interest locally:', err)
  }
}

export const pharmacistMarketplaceApi = {
  async getInterests(pharmacistId: number): Promise<Record<number, PharmacistProjectInterest>> {
    const local = loadLocalInterests(pharmacistId)
    try {
      const res = await api.get(`/api/v1/pharmacist/interests?pharmacist_id=${pharmacistId}`)
      if (res.data?.success && res.data?.data) {
        const serverList = res.data.data as Array<Record<string, unknown>>
        for (const item of serverList) {
          const pid = Number(item.project_id)
          if (pid) {
            local[pid] = {
              projectId: pid,
              pharmacistId: Number(item.pharmacist_id) || pharmacistId,
              decision: (item.decision as 'pursue' | 'not_interested') || null,
              ndaSigned: Boolean(item.nda_signed),
              ndaSignedAt: (item.nda_signed_at as string) || null,
              ndaSignerName: (item.nda_signer_name as string) || null,
              ndaDocumentId: (item.nda_document_id as string) || null,
              leaseSigned: Boolean(item.lease_signed),
              leaseSignedAt: (item.lease_signed_at as string) || null,
              leaseSignerName: (item.lease_signer_name as string) || null,
              leaseModifications: (item.lease_modifications as string) || null,
              updatedAt: (item.updated_at as string) || new Date().toISOString(),
            }
          }
        }
        localStorage.setItem(getStorageKey(pharmacistId), JSON.stringify(local))
      }
    } catch {
      // API fallback to local store
    }
    return local
  },

  async setDecision(
    projectId: number,
    pharmacistId: number,
    decision: 'pursue' | 'not_interested',
  ): Promise<PharmacistProjectInterest> {
    const current = loadLocalInterests(pharmacistId)[projectId] || {
      projectId,
      pharmacistId,
      ndaSigned: false,
      leaseSigned: false,
      updatedAt: new Date().toISOString(),
    }

    const updated: PharmacistProjectInterest = {
      ...current,
      decision,
      updatedAt: new Date().toISOString(),
    }

    saveLocalInterest(updated)

    try {
      await api.post('/api/v1/pharmacist/interests/decision', {
        project_id: projectId,
        pharmacist_id: pharmacistId,
        decision,
      })
    } catch {
      // Non-blocking fallback
    }

    return updated
  },

  async signNda(
    projectId: number,
    pharmacistId: number,
    signerName: string,
  ): Promise<PharmacistProjectInterest> {
    const current = loadLocalInterests(pharmacistId)[projectId] || {
      projectId,
      pharmacistId,
      decision: 'pursue',
      ndaSigned: false,
      leaseSigned: false,
      updatedAt: new Date().toISOString(),
    }

    const now = new Date().toISOString()
    const docId = `NDA-${projectId}-${pharmacistId}-${Date.now().toString(36).toUpperCase()}`

    const updated: PharmacistProjectInterest = {
      ...current,
      decision: 'pursue',
      ndaSigned: true,
      ndaSignedAt: now,
      ndaSignerName: signerName.trim(),
      ndaDocumentId: docId,
      updatedAt: now,
    }

    saveLocalInterest(updated)

    try {
      await api.post('/api/v1/pharmacist/interests/sign-nda', {
        project_id: projectId,
        pharmacist_id: pharmacistId,
        signer_name: signerName.trim(),
        document_id: docId,
      })
    } catch {
      // Non-blocking fallback
    }

    return updated
  },

  async signLease(
    projectId: number,
    pharmacistId: number,
    signerName: string,
    modifications?: string,
  ): Promise<PharmacistProjectInterest> {
    const current = loadLocalInterests(pharmacistId)[projectId] || {
      projectId,
      pharmacistId,
      decision: 'pursue',
      ndaSigned: true,
      leaseSigned: false,
      updatedAt: new Date().toISOString(),
    }

    const now = new Date().toISOString()

    const updated: PharmacistProjectInterest = {
      ...current,
      leaseSigned: true,
      leaseSignedAt: now,
      leaseSignerName: signerName.trim(),
      leaseModifications: modifications?.trim() || null,
      updatedAt: now,
    }

    saveLocalInterest(updated)

    try {
      await api.post('/api/v1/pharmacist/interests/sign-lease', {
        project_id: projectId,
        pharmacist_id: pharmacistId,
        signer_name: signerName.trim(),
        modifications: modifications?.trim() || null,
      })
    } catch {
      // Non-blocking fallback
    }

    return updated
  },
}

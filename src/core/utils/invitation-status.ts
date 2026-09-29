import type { WorkerUser } from './hr-api'

export type EffectiveInvitationStatus = 'registered' | 'invited' | 'expired'

type InvitationFields = Pick<
  WorkerUser,
  'invitation_status' | 'invitation_expires_at' | 'invitation_is_expired'
>

export function parseApiDateTime(value: string | null | undefined): Date | null {
  if (!value) return null
  const date = new Date(value.includes('T') ? value : value.replace(' ', 'T'))
  return Number.isNaN(date.getTime()) ? null : date
}

/** Backend never flips 'invited' to 'expired' on its own, so derive it from the expiry date. */
export function getEffectiveInvitationStatus(
  worker: InvitationFields,
  now: Date = new Date(),
): EffectiveInvitationStatus {
  if (worker.invitation_status === 'expired') return 'expired'
  if (worker.invitation_status !== 'invited') return 'registered'
  if (typeof worker.invitation_is_expired === 'boolean') {
    return worker.invitation_is_expired ? 'expired' : 'invited'
  }
  const expiresAt = parseApiDateTime(worker.invitation_expires_at)
  return expiresAt && expiresAt.getTime() < now.getTime() ? 'expired' : 'invited'
}

export function isPendingInvitation(worker: InvitationFields): boolean {
  return getEffectiveInvitationStatus(worker) !== 'registered'
}

export function formatInvitationDate(value: string | null | undefined): string {
  const date = parseApiDateTime(value)
  return date
    ? date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : '—'
}

/**
 * Coerce logged-in user id to a positive number.
 * After JSON/localStorage hydration, `id` is often a string; Number.isFinite("46") is false
 * and breaks comparisons with task assignee ids from the API.
 */
export function resolveSessionUserId(
  user: { id?: unknown; user_id?: unknown } | null | undefined,
): number | null {
  if (user == null) return null
  const raw = user.id ?? user.user_id
  if (raw == null || raw === '') return null
  const n = typeof raw === 'number' ? raw : Number(String(raw).trim())
  return Number.isFinite(n) && n > 0 ? n : null
}

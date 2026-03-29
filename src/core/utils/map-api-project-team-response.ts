import type { ProjectTeamMember } from '@/core/utils/project-api'

function asNum(v: unknown): number | null {
  if (v == null) return null
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : null
}

function extractTeamRows(response: unknown): Record<string, unknown>[] {
  if (response == null) return []
  const root = response as Record<string, unknown>
  const data = root.data as Record<string, unknown> | undefined
  const candidates: unknown[] = [
    root.team_members,
    root.members,
    root.team,
    data?.team_members,
    data?.members,
    data?.team,
    Array.isArray(data) ? data : null,
  ]
  for (const c of candidates) {
    if (Array.isArray(c)) return c as Record<string, unknown>[]
  }
  return []
}

/**
 * Resolve API user id on a team row (backends differ: user_id, userId, or legacy `id` as user).
 */
function rowUserId(member: Record<string, unknown>): number | null {
  return (
    asNum(member.user_id) ??
    asNum(member.userId) ??
    asNum(member.id)
  )
}

function rowMemberPk(member: Record<string, unknown>): number {
  return asNum(member.team_member_id) ?? asNum(member.id) ?? 0
}

/**
 * Map GET /api/v1/projects/:id/team payload to roster with numeric user_id for matching.
 */
export function mapApiProjectTeamRowsToRoster(response: unknown): ProjectTeamMember[] {
  const rows = extractTeamRows(response)
  if (rows.length === 0) return []

  return rows.map(
    (member): ProjectTeamMember => ({
      id: rowMemberPk(member),
      project_id: asNum(member.project_id) ?? 0,
      user_id: rowUserId(member),
      role_in_project: String(member.project_role ?? member.role_in_project ?? 'member'),
      assigned_at: String(member.added_at ?? member.assigned_at ?? ''),
      added_by: asNum(member.invited_by ?? member.added_by) ?? undefined,
      name:
        String(member.full_name ?? '').trim() ||
        `${String(member.first_name ?? '')} ${String(member.last_name ?? '')}`.trim() ||
        'Unknown',
      email: member.email != null ? String(member.email) : undefined,
      phone:
        String(member.phone ?? member.cell_phone ?? member.mobile ?? '') || undefined,
      user_type: member.role_name != null ? String(member.role_name) : undefined,
      job_title: member.job_title != null ? String(member.job_title) : undefined,
      status: member.status != null ? Number(member.status) : undefined,
      avatar_url: member.avatar_url != null ? String(member.avatar_url) : undefined,
      full_img_url: member.full_img_url != null ? String(member.full_img_url) : undefined,
    }),
  )
}

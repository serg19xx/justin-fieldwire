import type { ProjectTeamMember } from '@/core/utils/project-api'

/**
 * Raw row from GET /api/v1/projects/:id/team (shape may vary slightly per backend).
 */
interface ApiTeamMemberRow {
  team_member_id: number
  project_id: number
  id: number
  project_role: string
  added_at: string
  invited_by?: number
  full_name?: string
  email?: string
  phone?: string
  cell_phone?: string
  mobile?: string
  role_name?: string
  job_title?: string
  status?: string
  first_name?: string
  last_name?: string
  avatar_url?: string
  full_img_url?: string
}

function extractTeamRows(response: unknown): ApiTeamMemberRow[] {
  const root = response as {
    data?: { team_members?: unknown }
    team_members?: unknown
  }
  const raw = root?.data?.team_members ?? root?.team_members ?? []
  return Array.isArray(raw) ? (raw as ApiTeamMemberRow[]) : []
}

/**
 * One ProjectTeamMember per API row (`id` = team_member_id, `user_id` = user id from API).
 * Use this to resolve task.team_members when the API stores membership row ids.
 */
export function mapApiProjectTeamRowsToRoster(response: unknown): ProjectTeamMember[] {
  const apiTeamMembers = extractTeamRows(response)
  if (apiTeamMembers.length === 0) return []

  return apiTeamMembers.map(
    (member): ProjectTeamMember => ({
      id: member.team_member_id,
      project_id: member.project_id,
      user_id: member.id,
      role_in_project: member.project_role,
      assigned_at: member.added_at,
      added_by: member.invited_by,
      name:
        member.full_name?.trim() ||
        `${member.first_name || ''} ${member.last_name || ''}`.trim() ||
        'Unknown',
      email: member.email,
      phone: member.phone || member.cell_phone || member.mobile,
      user_type: member.role_name,
      job_title: member.job_title,
      status: member.status ? Number(member.status) : undefined,
      avatar_url: member.avatar_url,
      full_img_url: member.full_img_url,
    }),
  )
}

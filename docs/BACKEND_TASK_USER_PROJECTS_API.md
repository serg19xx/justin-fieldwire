# Backend API: projects & tasks for Worker / Foreman / Contractor

Frontend role detection: `role_category === 'task'` or `role_code` in `worker`, `foreman`, `contractor`.

**In scope on the SPA today:** task-role **project list** (`/tasks` → `TaskProjects.vue`) and **project tasks** (`TaskProjectDetail.vue`, `TaskTaskDetail.vue`). **Task dashboard** (`TaskDashboard.vue`) is handled separately — do not rely on it for “my projects” filtering until that work is done.

## 1. Recommended: filter projects on the server (primary gap)

**Endpoint:** `GET /api/v1/projects`

**Query parameter (already sent by SPA):** `user_id=<numeric user id>`

**Expected behavior when `user_id` is present:**

Return only projects where that user is “involved”, for example:

- Listed on the **project team** (`fw_prj_team_members` with `task_id` NULL / project-level rows, if your schema has them), **and/or**
- Has at least one **task assignment** in that project (`task_lead_id`, `team_members`, or legacy `assignees` on `fw_prj_tasks` / your task table).

**Why:** Without this, the list returns all projects and the **task-role projects screen** (`/tasks`) cannot stay correct at scale. The SPA falls back to many `GET .../team` + `GET .../tasks` calls per project there only (slow, capped).

**Alternative endpoint (optional, cleaner):**  
`GET /api/v1/me/projects` or `GET /api/v1/users/me/projects` — same filter, scoped by JWT (no `user_id` in query).

---

## 2. Tasks list for a project (secondary)

**Endpoint:** `GET /api/v1/projects/{projectId}/tasks`

**Query parameter (already sent when filtering):** `user_id=<numeric user id>`

**Expected behavior:** Return only tasks where the user is lead, in `team_members`, or in `assignees` (match your DB semantics for IDs).

If this is not implemented, the SPA still filters tasks client-side on task-role screens, but the payload is larger than necessary.

---

## 3. Already used elsewhere (no change required for this story)

- `GET /api/v1/projects/{projectId}/team` — project roster (used for client-side fallback and dialogs).
- `GET /api/v1/projects?prj_manager=` — project managers (already supported in `ProjectsPrj.vue`).

---

## Summary for backend ticket

| Priority | Item |
|----------|------|
| **High** | Honor `user_id` on `GET /api/v1/projects` for task-role users (or add `GET /me/projects`). |
| **Medium** | Honor `user_id` on `GET /api/v1/projects/{id}/tasks` for assigned-task filtering. |

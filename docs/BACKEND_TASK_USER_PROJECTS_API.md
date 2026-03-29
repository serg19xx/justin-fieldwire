# Backend API: projects & tasks for Worker / Foreman / Contractor

Frontend role detection: `role_category === 'task'` or `role_code` in `worker`, `foreman`, `contractor` (case-insensitive).

**In scope on the SPA today:** **Task dashboards** — workers/contractors use `TaskDashboard.vue`; **foreman** (`role_code` / `role_id` 12) uses `ForemanDashboard.vue` (overview + aggregates). Task-role **project list** (`/tasks` → `TaskProjects.vue`) and both dashboards use the same loader `fetchProjectsForTaskScope`: server query params + client-side narrowing when the API returns too many projects. **Project tasks:** `TaskProjectDetail.vue`, `TaskTaskDetail.vue`.

## 1. Recommended: filter projects on the server (primary gap)

**Endpoint:** `GET /api/v1/projects`

**Query parameter (already sent by SPA):** `user_id=<numeric user id>`

**Expected behavior when `user_id` is present:**

Return only projects where that user is “involved”, for example:

- Listed on the **project team** (`fw_prj_team_members` with `task_id` NULL / project-level rows, if your schema has them), **and/or**
- Has at least one **task assignment** in that project (`task_lead_id`, `team_members`, or legacy `assignees` on `fw_prj_tasks` / your task table).

**Why:** Without this, the list returns all projects; the SPA then narrows client-side via `GET .../tasks?user_id=` (when supported), `GET .../team`, and full task lists (slow, capped at 150 projects). If team/task responses differ from what the SPA expects (shape, permissions), the **Projects** tab can appear empty while the dashboard previously showed every project — both now use the same scoped list.

**Alternative endpoint (optional, cleaner):**  
`GET /api/v1/me/projects` or `GET /api/v1/users/me/projects` — same filter, scoped by JWT (no `user_id` in query).

---

## 2. Tasks list for a project (secondary)

**Endpoint:** `GET /api/v1/projects/{projectId}/tasks`

**Query parameter (optional):** The task-role project screen (`TaskProjectDetail.vue`) calls **`GET .../tasks` without `user_id`** and relies on the **full project task list** plus client-side **`filterTasksForInvolvedUser`** (session user id vs `task_lead_id`, `team_members`, `assignees`). This avoids servers that return an empty list when `user_id` is present. Other code paths may still append `user_id` for discovery (e.g. project list).

**Expected behavior:** Return **all** tasks the user is allowed to read for that project, with `task_lead_id` and/or `team_members` / `assignees` populated so the client can narrow rows for workers.

**Response envelope:** Prefer `data: { tasks: [...], pagination?: {...} }` (also: `error_code` / `status` / `message` wrappers are fine). The SPA accepts `tasks` / `results` / `items` at various nesting levels or a JSON array of tasks.

**Task assignee fields:** Use numeric ids in `task_lead_id`, `team_members`, `assignees`, or objects with `user_id` / `userId` in arrays — the client normalizes these. Session `user.id` is coerced to a number (string ids after JSON/localStorage are common).

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

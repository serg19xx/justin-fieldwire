# Worker, Foreman & Contractor Interface — Plan

**Status:** In progress — new mobile template and My Projects flow implemented.  
**Scope:** Mobile-first UI for task-level roles (Worker, Foreman, Contractor).  
**Out of scope for now:** Inspector role (TBD later).

---

## 1. Context

- **Admin & PM** are unified in one account flow; that part is done.
- **Task-level roles** (Worker, Foreman, Contractor) share a similar interface, with some role-specific functions.
- All these interfaces are **strictly for mobile devices**: phone, tablet, or laptop (mobile-first).
- **Inspector** is not in scope yet.

---

## 2. Target Roles & Layout

| Role        | Layout       | Notes |
|------------|--------------|--------|
| Worker     | **New task template** (mobile-first) | Dedicated layout and pages. |
| Foreman    | **New task template** | Same layout, extended data set and actions. |
| Contractor | **New task template** | Same as Worker (+ Foreman features where applicable). |

**Decision:** The current task-role UI (TaskLayout + TaskDashboard, /tasks, etc.) is to be **reworked into a new dedicated template** for these roles and mobile devices. Functionality will differ from Admin/PM, so a separate template is justified.

**Layout selection at login:** Already implemented. In `App.vue`, after login the user’s `role_category` is used to choose the layout:
- `global` → GlobalLayout  
- `project` → ProjectLayout  
- `task` → Task layout (the new template)

No change to login or auth store is required; only the task layout and the pages rendered inside it are redesigned. Current routing `role_category === 'task'` → task layout, Dashboard → TaskDashboard, `/tasks` → projects/tasks; this stays, with content and structure adapted to the new template.

---

## 3. Core Features (Worker, Foreman, Contractor)

### 3.1 Projects

- **Active projects** — list of projects the user participates in (current implementation can be reused or adapted from project APIs).
- **Archived / closed projects** — same list with a filter or tab “Active / Archived” (backend: filter by project status or `archived`/`closed`).
- **Project status** — show status per project (e.g. Active, On Hold, Completed, Archived). Visible in list and on project detail.

**Deliverables:**

- [ ] API (or reuse): list “my projects” for current user (by role: worker/foreman/contractor), with status/archived.
- [ ] Mobile-first page: “My Projects” (active + archived) with status badges.
- [ ] Project detail for task role: summary + status + link to tasks.

### 3.2 Task Completion & Toggle “My Tasks / All Tasks”

- **Degree of completion** — for the whole project (e.g. % completed, by task count or by weight).
- **Toggle:** “My tasks” vs “All tasks”:
  - **My tasks** — only tasks where the current user is assigned/participant.
  - **All tasks** — all tasks in the project (for visibility and context).

**Deliverables:**

- [ ] Backend: project-level progress (e.g. completed/total tasks or weighted completion).
- [ ] Backend: tasks list for project with filter “assigned to me” / “all”.
- [ ] UI: switch “My tasks” / “All tasks” on project and/or task list view.
- [ ] UI: show project completion (e.g. progress bar or %) on project card and project detail.

### 3.3 Status Change & End-of-Shift Photos

- In the **active project** and **concrete task**:
  - **Change task status** (e.g. Not Started, In Progress, Done, On Hold) — only allowed statuses per role/backend.
  - **Upload photos** that show the state of the object at the end of shift (and optionally link to task).

**Deliverables:**

- [ ] API: update task status (PATCH/PUT task with status).
- [ ] API: upload photo(s) for task (and optionally project), with metadata (task_id, timestamp, optional comment).
- [ ] UI: task detail for task role: status dropdown/buttons + “Add photo” (camera/gallery), list of attached photos.
- [ ] UI: optional “End of shift” summary (e.g. one screen: select task, set status, add 1+ photos).

### 3.4 Statistics

- **Per task:** status, completion, maybe due date.
- **Per project:** progress (%), counts (e.g. my tasks done / total, or all tasks done / total), optionally simple charts (e.g. completion over time).

**Deliverables:**

- [ ] API: stats for project (progress, counts) and optionally for “my tasks” vs “all tasks”.
- [ ] UI: project stats on project detail; optional compact stats on dashboard or project list.

---

## 4. Foreman-Specific

- Foreman sees the **same structure** (projects, tasks, status, photos, stats) but for **his set** of projects and tasks (backend filters by foreman assignment / team).
- **Extra:** ability to **check correctness** of work of Worker and Contractor (e.g. approve/reject status or photos, or leave a “checked” flag / comment).

**Deliverables:**

- [ ] API: list projects/tasks where current user is foreman (or in foreman role for that project).
- [ ] API: “check” action (e.g. approve task status or photo) — e.g. PATCH task or dedicated “approval” endpoint.
- [ ] UI: same mobile views as Worker/Contractor, with additional “Check work” or “Approve” on task/photo for foreman.

---

## 5. Contractor

- **Same interface** as Worker (same features: projects, tasks, my/all toggle, status, photos, stats).
- **Same optional “check” flow** as Foreman if backend assigns contractor to a “checker” role in some projects; otherwise no extra UI beyond Worker.

**Deliverables:**

- [ ] Reuse Worker UI; differentiate only if product requires (e.g. label “Contractor” or different project set from API).

---

## 6. Communication & Notifications

- **Channels:** phone (external), **system messenger**, **internal notification system** (for system documentation).
- All roles (Worker, Foreman, Contractor) should be able to:
  - Use in-app messaging (if/when implemented).
  - Receive in-app notifications (e.g. task assigned, status changed, photo approved).

**Deliverables:**

- [ ] Backend: internal notifications (e.g. table + API: create notification, list for user, mark read).
- [ ] Backend: system messenger (rooms/channels per project or task?) — scope TBD.
- [ ] UI: notification bell + list (mobile-friendly); optional messenger entry point in TaskLayout.
- [ ] Document integration with phone (e.g. “Call PM” link) — no backend change if it’s just `tel:` links.

---

## 7. Technical Notes

- **Mobile-first:** all new pages should be responsive (phone first, then tablet/laptop). Use existing TaskLayout; avoid heavy desktop-only components.
- **Reuse:** Prefer reusing existing project/task types and APIs (`project-api`, `tasks-api`, `ProjectDetailPrj`, task components) and extend with new endpoints or params (e.g. `?scope=my_tasks|all_tasks`, `archived=true`).
- **Auth:** Filter projects/tasks by `currentUser.id` and role (worker/foreman/contractor) on backend; front-end only shows what API returns.
- **Inspector:** No UI or API changes for Inspector until requirements are defined.

---

## 8. Suggested Implementation Order

1. **APIs**
   - My projects (active + archived) for task role.
   - Tasks list for a project with “my / all” and project progress.
   - Task status update + photo upload (and storage/URL in response).
2. **Mobile “My Projects”**
   - List (active/archived), project status, link to project detail.
3. **Project detail for task role**
   - Project progress, “My tasks / All tasks” toggle, task list, link to task detail.
4. **Task detail for task role**
   - Status change, upload photos, view existing photos.
5. **Foreman**
   - Backend filter + “check work” API; UI “Approve/Check” on task or photo.
6. **Notifications**
   - Backend notifications API; bell + list in TaskLayout.
7. **Messenger**
   - After notifications; scope and UX TBD.

---

## 9. Summary Checklist

| Feature                         | Worker | Foreman | Contractor | Notes |
|--------------------------------|--------|---------|------------|--------|
| Active projects                 | ✅     | ✅      | ✅         | List + status |
| Archived projects               | ✅     | ✅      | ✅         | Tab or filter |
| Project status                  | ✅     | ✅      | ✅         | |
| My tasks / All tasks toggle     | ✅     | ✅      | ✅         | |
| Project completion (whole)      | ✅     | ✅      | ✅         | |
| Task status change              | ✅     | ✅      | ✅         | |
| End-of-shift photos             | ✅     | ✅      | ✅         | |
| Task/project stats              | ✅     | ✅      | ✅         | |
| Check Worker/Contractor work    | —      | ✅      | optional   | Foreman (and Contractor if needed) |
| Notifications                   | ✅     | ✅      | ✅         | |
| Messenger                       | ✅     | ✅      | ✅         | Later phase |
| Inspector                       | —      | —       | —          | Not in scope |

This document can be updated as APIs and screens are implemented and as Inspector requirements are defined.

---

## 10. API Endpoints — Use As-Is (from [FieldWire API](https://fwapi.medicalcontractor.ca/docs))

Endpoints below can be used **without backend changes** for Worker/Foreman/Contractor features. The app already uses some of them (`project-api.ts`, `tasks-api.ts`, `hr-api.ts`, `files-api.ts`).

### 10.1 Projects

| Endpoint | Purpose | Use for |
|----------|--------|--------|
| `GET /api/v1/projects` | Get all projects (with pagination/filters) | List "My projects" — backend typically returns projects for current user by token. Add query params for `status` or `archived` if backend supports. |
| `GET /api/v1/projects/{id}` | Get project by ID | Project detail: name, status, dates, area, level. |

**Note:** If "my projects" is filtered by team membership, the same `GET /api/v1/projects` response may already be scoped; confirm backend behavior. "Active / Archived" can be a frontend filter by project `status` if the API returns it.

### 10.2 Tasks

| Endpoint | Purpose | Use for |
|----------|--------|--------|
| `GET /api/v1/projects/{project_id}/tasks` | Get project tasks | Task list. "My tasks" vs "All tasks" = frontend filter by assignee/team_members (current user id). |
| `GET /api/v1/projects/{project_id}/tasks/{task_id}` | Get task by ID | Task detail: status, progress, dates, assignees, notes. |
| `PUT /api/v1/projects/{project_id}/tasks/{task_id}` | Update task | Change task status (and other fields). Use for status updates from Worker/Foreman/Contractor. |

**Already in app (may extend backend):**

- `GET /api/v1/projects/{project_id}/tasks/stats` — project task statistics (progress, counts). Use for "degree of completion" and stats.
- `PATCH /api/v1/projects/{project_id}/tasks/{task_id}/status` — update only status.
- `PATCH /api/v1/projects/{project_id}/tasks/{task_id}/progress` — update progress %.

Use these as-is if the backend exposes them; otherwise use `PUT .../tasks/{task_id}` for status/progress.

### 10.3 Project Team

| Endpoint | Purpose | Use for |
|----------|--------|--------|
| `GET /api/v1/projects/{project_id}/team` | Get project team members | Foreman: see workers/contractors on project; list for "check work" context. |

### 10.4 Profile & Auth

| Endpoint | Purpose | Use for |
|----------|--------|--------|
| `GET /profile` (or `/api/v1/profile`) | Get user profile | Current user info, avatar, role. |
| `PUT /profile/work-status` | Update user work status | Optional: "on shift / off shift" or similar. |
| `POST /api/v1/auth/check-session` | Check session validity | Already used. |
| `POST /api/v1/auth/refresh-token` | Refresh token | Already used. |

### 10.5 Files / Photos

| Endpoint | Purpose | Use for |
|----------|--------|--------|
| `POST /api/v1/plan/files/upload` | Upload file | End-of-shift photos: upload to a plan folder linked to project/task (e.g. folder per task or project). Requires a `folder_id` — backend may need a dedicated "task photos" folder or use existing plan tree. |
| `GET /api/v1/plan/files/{fileId}/download` | Download/preview file | Show attached photos. |
| `GET /api/v1/plan/folders/tree` | Get folders tree | Navigate to the folder where task/project photos are stored. |

**Gap:** No dedicated "task photo" or "end-of-shift photo" endpoint in the docs. Options: (1) Use plan file upload with a convention (e.g. folder = project/task), or (2) Backend adds something like `POST /api/v1/projects/{id}/tasks/{task_id}/photos` for clearer semantics and filtering.

### 10.6 Other (Optional)

| Endpoint | Purpose | Use for |
|----------|--------|--------|
| `GET /api/v1/event-logs` | Event logs with filtering | Audit trail / activity feed for task/project (if needed). |
| `GET /api/v1/tasks/{taskId}/available-workers` | Available workers for task | When assigning or reassigning (e.g. Foreman). |

### 10.7 Not in Docs / Need Backend

- **Notifications** — no "user notifications" or "inbox" endpoint; need backend support for in-app notifications.
- **Messenger** — no chat/messenger endpoints; need backend design.
- **Foreman "check work"** — no explicit approve/reject endpoint; can use `PUT .../tasks/{task_id}` with a field like `checked_by` / `approved_at` or a comment if backend supports it.
- **Project completion (aggregate)** — if not provided by `GET .../tasks/stats`, backend may need to add a project-level progress or we compute from task list.

---

**Summary:** Use as-is: projects list/detail, project tasks list/detail, task update (status/progress), project team, profile, plan file upload (for photos with folder convention). Filter "my projects" and "my tasks" on frontend or via existing query params if backend supports. Add backend later: notifications, messenger, dedicated task-photo endpoint (optional), and foreman approval fields if needed.

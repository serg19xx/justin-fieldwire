# Field reference: `role_in_project` (`fw_prj_team_members`)

This document restores the intended meaning of **`role_in_project`** from project docs and API contracts. It is **not** the same enum as **`fw_glob_roles.code`**.

---

## 1. What the field is for

| Aspect | Description |
|--------|-------------|
| **Table** | Typically `fw_prj_team_members` (project/task team assignments). |
| **Scope** | One **row** = one assignment of a user (or placeholder) to a **project** and optionally a **task/milestone**. |
| **Purpose** | Describes **how this row participates** in that project/task: e.g. responsible lead, brigade participant, invited guest. |
| **Not for** | Replacing the user’s **system-wide** role (Worker, Foreman, …) from `fw_users` / `fw_glob_roles`. |

---

## 2. Relationship to `fw_glob_roles`

| Layer | Source | Examples |
|-------|--------|----------|
| **Global role** | `fw_glob_roles` + user profile | `admin`, `project_manager`, `worker`, `foreman`, `contractor`, `inspector`, … |
| **Assignment role** | `role_in_project` on team row | `task_lead`, `member`, `invited`, … |

A Foreman in `fw_glob_roles` can appear on a task row with `role_in_project = member` if they are in the crew but not the task lead.

---

## 3. Documented / observed values

Values below are used in **API responses** (`GET .../team`, `GET .../projects/{id}/team`) and stored in **DB**. The backend sets them when processing task create/update (`task_lead_id`, `team_members`, milestones).

| Value | Meaning | Typical use |
|-------|---------|-------------|
| **`task_lead`** | Responsible person for this task/milestone (primary assignee on this row). | Milestone: **single** team row with lead + `invited_people` JSON. Regular task: row for `task_lead_id` when modeled as its own assignment. |
| **`member`** | Brigade / crew participant on the task (**not** the lead). | One row per user from `team_members[]` when backend uses this code (common in live DB). |
| **`worker`** | Same *class* as “crew participant” in older doc examples. | Appears in **`docs/invited-people-api-requirements.md`** examples for regular tasks. Treat as **synonym intent** with `member` unless backend standardizes on one code. |
| **`invited`** | External / guest participation when stored as an assignment type. | Milestone guests are usually in **`invited_people` JSON** on the lead row; `invited` may appear for explicit invited rows if API supports it. |

**Doc vs implementation:** Requirements text says for regular tasks: `role_in_project` = “роль члена бригады” and examples use **`worker`**. Some backends persist **`member`** for the same meaning. Align naming in **one place** (backend enum) if you need a single canonical code.

Other codes (e.g. **`supervisor`**) were mentioned only as examples in early docs; if present, they are still **assignment** semantics, not `fw_glob_roles`.

---

## 4. How it is used (by flow)

### 4.1 Regular task

- **Frontend** sends `task_lead_id` and `team_members: [userId, …]` (see `tasks-api`, `TaskDialog`).
- **Backend** should sync `fw_prj_team_members`: separate rows per assigned user; set `role_in_project` to distinguish **lead** vs **other crew** (e.g. `task_lead` + `member`, or per-doc `worker`).
- **`invited_people`** on those rows: `null` for normal tasks.

### 4.2 Milestone

- **One row** in `fw_prj_team_members` for the milestone:
  - `user_id` = lead from `task_lead_id`
  - `role_in_project` = **`task_lead`**
  - `invited_people` = JSON array of external guests

See **`docs/invited-people-api-requirements.md`** (sections “Backend Processing”, “Get Team Members”).

### 4.3 API consumption (frontend)

- Type: `ProjectTeamMember.role_in_project` in `src/core/utils/project-api.ts`.
- Display: `formatProjectAssignmentRole()` / `getDisplayRole(..., project_role)` in `src/core/utils/role-utils.ts` maps known codes to UI labels (`member` → “Team member”, etc.).

---

## 5. Related documentation

| File | Content |
|------|---------|
| `docs/invited-people-api-requirements.md` | Milestone vs regular task, team rows, `task_lead`, examples with `worker`. |
| `docs/ROLE_IN_PROJECT_VS_GLOB_ROLES.md` | Short comparison with global roles. |

---

## 6. Summary

- **`role_in_project`** = **assignment role on this project/task row**.
- **Canonical values in practice:** at least **`task_lead`**, **`member`** (and/or **`worker`** per doc), **`invited`** where applicable.
- **Not required** to appear in **`fw_glob_roles`**.
- **Set by backend** when applying task payloads; frontend does not send `role_in_project` per crew user in the standard task save flow.

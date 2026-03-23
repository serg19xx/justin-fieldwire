# `role_in_project` vs `fw_glob_roles` (short)

**`role_in_project`** (on `fw_prj_team_members` and similar) describes **participation on a specific project/task row** (lead, crew member, invited).  
**`fw_glob_roles`** describes the user’s **system-wide** role (Admin, Worker, Foreman, …).

They are **different enums**. Values like `task_lead`, `member`, or `worker` on an assignment row do **not** have to exist as rows in `fw_glob_roles`.

---

**Full reference (values, flows, API, frontend):** see **`ROLE_IN_PROJECT_FIELD_REFERENCE.md`**.

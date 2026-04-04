# Client guide: weekly task schedule (PM)

**Audience:** Product owner, QA, or end client testing the FieldWire-style app.

**Language:** This document is for stakeholders who review features in English.

---

## 1. What was built

### 1.1 Purpose

Project managers plan **who works on which existing project task** on **which calendar day** and in which **time part** (morning / afternoon / full day). The plan is stored per **project** and **week**. Workers can later see **published** weeks in their own views (e.g. “My week”), depending on how the mobile / field app is configured.

### 1.2 Where to find it

1. Sign in as a **project manager** (or **admin**).
2. Open **My Projects** and enter a **project**.
3. In the left sidebar under **FIELD MANAGEMENT**, open **Schedule** (between **Tasks** and **Photos**).

### 1.3 Main behaviours

| Area | Behaviour |
|------|------------|
| **Draft vs published** | Managers create a **draft** week, add rows, **Save draft**, then **Publish** when ready. Only **published** weeks are intended for worker-facing “my schedule” elsewhere. |
| **One worker at a time** | At the top of the schedule grid, select **one worker** from the project team. The table lists **Day**, **Slot**, and **Task** for that person only (no repeated worker column on each row). |
| **All project tasks** | The task list includes **all tasks** loaded for the project (large page size so the list is not truncated). |
| **Adding people to tasks** | If someone is scheduled on a task but is not yet on that task’s team in **Tasks**, **Save** / **Publish** will first update the task’s **team** on the server so validation passes. |
| **No double booking (same project week)** | The same person cannot have **overlapping** slots on the same calendar day in this week’s plan (e.g. **full day** blocks **morning** / **afternoon**). The UI warns and blocks save until this is fixed. |
| **Other projects (cross-project)** | For the selected worker, **published** assignments in **other projects** are loaded when the server allows (see API permissions). Those slots are reflected in the **week summary bar** and in **disabled** day/slot options where appropriate. The **current project’s draft** is still edited in the table; other projects are read-only context. |

### 1.4 Technical summary (for your development partner)

- **Draft / entries:** `GET/POST /api/v1/projects/{id}/schedule-weeks`, `PUT .../entries`, `POST .../publish`.
- **Worker’s published slots (all projects):** `GET /api/v1/users/{userId}/schedule?from=&to=` (same shape as `/me/schedule` where applicable).
- Frontend tolerates response shapes such as `schedule_week` vs `week` in JSON.

---

## 2. Preconditions for testing

1. **Role:** User is **project_manager** or **admin** (or equivalent your backend maps to “can edit project schedule”).
2. **Project:** At least one project with **team members** and **several tasks**.
3. **Tasks:** Prefer tasks that already have **team / lead** set in **Tasks**; you can also verify auto-add to team when saving from **Schedule**.
4. **Backend:** Schedule week APIs and, for cross-project checks, `GET /users/{id}/schedule` deployed with the rules your team documented (RBAC, date range limits, etc.).

---

## 3. How to test (step by step)

### Test A — Open schedule and create a draft week

1. Open a project → **Schedule**.
2. If the week has no draft yet, click **Create draft week**.
3. **Expect:** Status shows **Draft** and the table (and worker selector) becomes available for editing (if you have edit rights).

### Test B — Plan one worker for the week

1. In the table header, choose a **worker** from the dropdown.
2. **Expect:** Only that worker’s rows appear; a **seven-day strip** shows **free / partly busy / fully blocked** hints for that week.
3. Click **Add row**.
4. Choose **Day**, **Slot**, and **Task**.
5. **Expect:** Task list shows project tasks; impossible slots may show as **(busy)** or days as **(unavailable)** when they conflict with this draft or with **published** work in other projects (if API returns data).
6. Add another row for the same worker on a **different** day or non-overlapping slot.
7. Click **Save draft**.
8. **Expect:** Success; after refresh or revisit, rows persist.

### Test C — Publish

1. With a valid draft (no overlapping slots for the same worker on the same day), click **Publish week**.
2. **Expect:** Status becomes **Published**; editing rules follow your product rules (often read-only for non-managers).

### Test D — Cross-project awareness (optional)

1. Use a worker who has **published** work in **another project** during the same calendar week.
2. Open **Schedule** in project A and select that worker.
3. **Expect (if API permits):** Busy slots from other projects reduce availability (strip and/or disabled options). If the API returns **403**, the UI may show no external overlap; that is an access rule, not necessarily a bug.

### Test E — Task team auto-sync

1. Pick a worker who is **not** yet on a task’s team in **Tasks**.
2. In **Schedule**, assign them to that task for a slot and **Save draft**.
3. Open **Tasks** and that task’s team.
4. **Expect:** The worker appears on the task team (if your backend accepts the task `PUT` the frontend sends before saving schedule entries).

### Test F — Pagination / full task list

1. Create a project with **many tasks** (e.g. 9+).
2. Open **Schedule**, select a worker, open the **Task** dropdown.
3. **Expect:** All (or a large configured page of) tasks appear, not a single task only.

---

## 4. Known limitations (set expectations with the client)

- **Draft vs published elsewhere:** Cross-project loading uses **published** schedule data. Unpublished drafts in other projects do not appear in the availability API.
- **Permissions:** If the planner is not allowed to call `GET /users/{id}/schedule` for a given worker, cross-project shading may be incomplete; **admin / project_manager** typically see full published slots per your server rules.
- **Worker app:** This guide covers the **web PM** path. Exact screens for foremen / workers depend on the **Task / My week** routes in the same app build.

---

## 5. Support checklist if something fails

| Symptom | Things to verify |
|--------|-------------------|
| **Create draft** does nothing | Network tab: `POST schedule-weeks` response must include week payload or succeed so `GET` can reload. |
| **400 on save** (“user not on task”) | Usually fixed by the automatic task team update; confirm task `PUT` succeeds and user id is valid. |
| **Only one task in dropdown** | Backend task list pagination / frontend must request enough tasks (already increased on the project detail load). |
| **No gray / external busy days** | User may have no published slots elsewhere, or **403** on `GET /users/{id}/schedule`. |

---

## Document control

| Version | Note |
|---------|------|
| 1.0 | Initial client QA guide for PM weekly schedule |

# Backend: worker weekly task schedule (PM draft / publish, worker read)

**Product goal:** A **project manager** (or equivalent) builds a **weekly plan**: which **worker** works on which **existing task** on which **calendar day** and in which **day part** (morning / afternoon / full day). **Foreman** and **field workers** read their schedule in the app. **Notifications** on publish are out of scope for the first implementation; leave a hook or TODO.

**Principle:** Do **not** duplicate task fields. Schedule rows store `task_id` (+ scheduling columns). Task name, status, project come from the existing tasks table.

**Related UX / TZ:** Field visits and “My week” in `docs/TZ_FIELD_VISITS_NOTIFICATIONS.md`. This document is **task-centric** schedule rows (`user` + `task` + `date` + `day_part`), not a separate “site only” visit table.

**HTTP API (paths, examples, status codes, RBAC):** `docs/SCHEDULE_WEEKS_API.md`.

---

## 1. Validation rules

On create/update of schedule entries:

1. **Task** exists and belongs to the **project** of the schedule week (or derive `project_id` from the task and reject mismatch).
2. **User** is allowed on that task under existing rules (e.g. `task_lead_id`, `team_members`, `assignees`, or project team — align with `docs/BACKEND_TASK_USER_PROJECTS_API.md` and your schema).
3. **`work_date`** is a concrete **DATE** (never “weekday only” without a week anchor).
4. **`day_part`**: enum `am` | `pm` | `full` (pick one naming style for API + DB and document it).
5. **`assignment_note`** (optional): string, max **2000** characters; PM instruction for that slot (see `docs/SCHEDULE_WEEKS_API.md` §3.1).

**Planned later (not required for current SPA):** optional `assignment_docs_url` per entry — see `docs/SCHEDULE_WEEKS_API.md` §3.2.

---

## 2. Database

### 2.1 Parent: `schedule_weeks` (draft vs published)

Suggested table: **`schedule_weeks`**

| Column           | Type        | Notes |
|------------------|------------|--------|
| `id`             | PK         | |
| `project_id`     | FK → projects | Scope for PM edits |
| `week_start`     | DATE       | Anchor day for the week (e.g. ISO Monday — **document convention**) |
| `status`         | ENUM       | `draft` \| `published` |
| `published_at`   | datetime, nullable | Set on publish |
| `published_by`   | user FK, nullable | |
| `created_at` / `updated_at` | | |

**Unique:** `(project_id, week_start)` — one schedule document per project per week.

### 2.2 Child: schedule entries (worker ↔ task ↔ day ↔ slot)

Suggested table: **`worker_task_schedules`** (or `project_worker_schedule_entries`)

| Column              | Type   | Notes |
|---------------------|--------|--------|
| `id`                | PK     | |
| `schedule_week_id`  | FK → `schedule_weeks` | |
| `project_id`        | FK     | Denormalized optional; speeds PM queries and integrity checks |
| `user_id`           | FK → users | Worker |
| `task_id`           | FK → tasks | **No duplicate task payload** |
| `work_date`         | DATE   | Not null |
| `day_part`          | ENUM   | `am` \| `pm` \| `full` |
| `assignment_note`   | VARCHAR(2000), nullable | Short instruction for the worker for this slot (API: `assignment_note`) |

**Uniqueness (typical rule):** at most **one** planned slot per worker per calendar day per `day_part` **within the same** `schedule_week_id`.  
Implement as `UNIQUE (schedule_week_id, user_id, work_date, day_part)` if that matches product, or enforce in application layer for MVP.

**Indexes (suggested):** `(schedule_week_id)`; `(user_id, work_date)`; `(task_id)`; `(project_id, week_start)` via join on `schedule_weeks`.

**ON DELETE behaviour:** choose explicitly (e.g. CASCADE entry rows when week deleted; RESTRICT if task deleted while scheduled).

### 2.3 Optional: messages per schedule row (chat)

**Two channels only (`foreman` | `pm`)** — full **FE–BE contract** (API + DB literals + SPA mapping):  
**`docs/SCHEDULE_ENTRY_MESSAGES_FOREMAN_PM.md`**.

**Table (example):** `fw_worker_task_schedule_messages` — `worker_task_schedule_id`, required **`channel`** (`foreman` \| `pm`), `author_user_id`, `body`, timestamps, optional `deleted_at`; index `(worker_task_schedule_id, channel)`.

API summary: **`docs/SCHEDULE_WEEKS_API.md` §6**.

---

## 3. REST API (JSON)

Canonical reference: **`docs/SCHEDULE_WEEKS_API.md`** (methods, bodies, examples, status codes, `week_start` normalization to Monday).

Summary:

| Method | Path |
|--------|------|
| GET | `/api/v1/projects/{projectId}/schedule-weeks?week_start=YYYY-MM-DD` |
| POST | `/api/v1/projects/{projectId}/schedule-weeks` — body `{ "week_start" }`, create or return **draft** |
| PUT | `/api/v1/projects/{projectId}/schedule-weeks/{weekId}/entries` — replace entries (**draft** only) |
| POST | `/api/v1/projects/{projectId}/schedule-weeks/{weekId}/publish` |
| POST | `/api/v1/projects/{projectId}/schedule-weeks/{weekId}/reopen-as-draft` — published → draft for PM edits |
| GET | `/api/v1/me/schedule?from=&to=` — **published** rows + `task` summary |

---

## 4. Auth / RBAC

| Action | Who |
|--------|-----|
| POST draft, PUT entries, publish, reopen-as-draft | **`admin`**, **`prj_manager`** / PM (per project) |
| GET project week + entries | Project **manager** or **team member** (read) |
| GET `/me/schedule` | Any **authenticated** user (only own rows) |

---

## 5. HTTP status codes

See **`docs/SCHEDULE_WEEKS_API.md`** for per-endpoint codes. Typical: **400** validation, **403** RBAC, **404** not found, **409** edit published week / conflicts.

---

## 6. Deliverables (backend)

1. Migration(s) for `schedule_weeks` and entry table.
2. Contract: `docs/SCHEDULE_WEEKS_API.md` (optionally generate OpenAPI from it).
3. Tests: POST draft → PUT entries → publish → worker `GET /me/schedule` returns only published rows in range.

---

## 7. MVP simplification (optional)

If **draft/publish** is deferred: a single table with `published_at` on each row is possible, but **worse** for “replace whole week” and auditing. Prefer **`schedule_weeks`** from the start if PM needs a clear publish action.

---

## Document control

| Version | Note |
|---------|------|
| 1.0 | Initial spec for worker task schedule (PM / worker / foreman read path) |
| 1.1 | API detail moved to `docs/SCHEDULE_WEEKS_API.md`; RBAC aligned with PM / admin / prj_manager + team read |
| 1.2 | §2.3 messages: **variant B** — `channel` `foreman` \| `pm`; contract file `SCHEDULE_ENTRY_MESSAGES_FOREMAN_PM.md` |

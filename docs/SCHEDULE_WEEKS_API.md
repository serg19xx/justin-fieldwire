# API: schedule weeks & slots (`/api/v1`)

Weekly **task schedule** per project: workers are assigned to **existing tasks** on **calendar days** in **day parts** (`am` | `pm` | `full`). Task details are **not** duplicated; responses reference `task_id` and may include a **summary `task` object**.

**Norm:** `week_start` is stored and returned as the **Monday** of the ISO week (UTC or project timezone — document server choice). Query/body may pass **any date that falls in that week**; the server **normalizes** to that Monday before lookup or insert.

---

## 1. Summary

### 1.1 Project: week and slots

| Method | Path | Purpose |
|--------|------|---------|
| **GET** | `/api/v1/projects/{projectId}/schedule-weeks?week_start=YYYY-MM-DD` | Load **week** + **all entries** for normalized `week_start`. |
| **POST** | `/api/v1/projects/{projectId}/schedule-weeks` | **Create or return** a **draft** week for normalized `week_start`. |
| **PUT** | `/api/v1/projects/{projectId}/schedule-weeks/{weekId}/entries` | **Replace** all slots for the week. **Draft only.** |
| **POST** | `/api/v1/projects/{projectId}/schedule-weeks/{weekId}/publish` | **Publish** week. **Draft only.** |
| **POST** | `/api/v1/projects/{projectId}/schedule-weeks/{weekId}/reopen-as-draft` | Turn a **published** week into **draft** again so slots can be edited (same `week` row + entries). |

### 1.2 Current user: “my schedule”

| Method | Path | Purpose |
|--------|------|---------|
| **GET** | `/api/v1/me/schedule?from=YYYY-MM-DD&to=YYYY-MM-DD` | Slots from **published** weeks only + short **`task`** per row. |

---

## 2. Permissions (RBAC)

| Action | Who |
|--------|-----|
| **POST** draft, **PUT** entries, **POST** publish, **POST** reopen-as-draft | `admin`, **`prj_manager`** / PM, or equivalent **project management** role (enforce per `projectId`). |
| **GET** project week + entries | User is **allowed to manage** that project **or** is a **project team member** (read-only). |
| **GET** `/api/v1/me/schedule` | Any **authenticated** user; response contains **only** rows where `user_id` is the current user. |

**403** if authenticated but role/team does not allow the operation.

---

## 3. `day_part`

Allowed string values (lowercase in JSON):

- `am` — morning half
- `pm` — afternoon half  
- `full` — full working day

Invalid values → **400** with message.

---

## 3.1 `assignment_note`

Optional **per schedule entry** (not duplicated on the task row). PM-facing instruction for that worker / day / slot.

| Rule | Detail |
|------|--------|
| Type | `string` or `null` in JSON |
| Max length | **2000** characters after trim; longer → **400** |
| Empty | Trim whitespace; empty string stored as **`null`** |
| Writes | Only via **PUT** `.../entries` on a **draft** week (same RBAC as other entry fields) |
| Reads | Included on each entry in **GET** project week, and on each row in **GET** `/me/schedule` (published only) |

---

## 3.2 `assignment_docs_url` (planned — not used by current SPA)

**Future:** optional link (e.g. SharePoint / Drive / project folder) per schedule entry. Intended rules: `string` or `null`, max **2000** chars, **`http:`** or **`https:`** only, same **GET**/**PUT** surfaces as `assignment_note`, DB column e.g. `assignment_docs_url` VARCHAR(2000) NULL. The shipped web client does **not** send or display this field until enabled.

---

## 4. Endpoints (detail)

### 4.1 `GET /api/v1/projects/{projectId}/schedule-weeks`

**Query:** `week_start` (required) — any `YYYY-MM-DD` in the target week; server normalizes to Monday `week_start_stored`.

**Success 200** — week exists:

```json
{
  "status": "success",
  "data": {
    "week": {
      "id": 42,
      "project_id": 10,
      "week_start": "2026-04-06",
      "status": "draft",
      "published_at": null,
      "published_by": null
    },
    "entries": [
      {
        "id": 1001,
        "user_id": 5,
        "task_id": 2001,
        "work_date": "2026-04-08",
        "day_part": "am",
        "assignment_note": "Bring extension ladder; north wall first."
      }
    ]
  }
}
```

**Success 200** — no row yet for that normalized week (frontend can then **POST** to create draft):

```json
{
  "status": "success",
  "data": {
    "week": null,
    "entries": []
  }
}
```

| Code | When |
|------|------|
| **400** | Missing or invalid `week_start` |
| **403** | No access to project schedule |
| **404** | `projectId` not found |

---

### 4.2 `POST /api/v1/projects/{projectId}/schedule-weeks`

**Purpose:** Ensure a **draft** `schedule_weeks` row exists for the normalized week; if it exists, return it (idempotent “get or create” for draft).

**Body:**

```json
{
  "week_start": "2026-04-09"
}
```

(`2026-04-09` is a Thursday — server normalizes to Monday `2026-04-06`.)

**Success 200** — created or existing **draft**:

```json
{
  "status": "success",
  "data": {
    "week": {
      "id": 42,
      "project_id": 10,
      "week_start": "2026-04-06",
      "status": "draft",
      "published_at": null,
      "published_by": null
    },
    "entries": []
  }
}
```

If a **published** week already exists for that `(project_id, normalized week_start)`, return **409** (cannot create another draft for same week — product may instead return **200** with the published week; **pick one and implement consistently**).

| Code | When |
|------|------|
| **400** | Invalid body / `week_start` |
| **403** | Not PM / admin / prj_manager for project |
| **404** | Project not found |
| **409** | Conflict with existing week state (optional rule) |

---

### 4.3 `PUT /api/v1/projects/{projectId}/schedule-weeks/{weekId}/entries`

**Purpose:** Replace **all** entry rows for this week in one transaction.

**Body:**

```json
{
  "entries": [
    {
      "user_id": 5,
      "task_id": 2001,
      "work_date": "2026-04-08",
      "day_part": "am",
      "assignment_note": "Bring extension ladder; north wall first."
    },
    {
      "user_id": 5,
      "task_id": 2002,
      "work_date": "2026-04-08",
      "day_part": "pm",
      "assignment_note": null
    }
  ]
}
```

**Success 200:**

```json
{
  "status": "success",
  "data": {
    "week": {
      "id": 42,
      "project_id": 10,
      "week_start": "2026-04-06",
      "status": "draft"
    },
    "entries": [
      {
        "id": 1002,
        "user_id": 5,
        "task_id": 2001,
        "work_date": "2026-04-08",
        "day_part": "am",
        "assignment_note": "Bring extension ladder; north wall first."
      },
      {
        "id": 1003,
        "user_id": 5,
        "task_id": 2002,
        "work_date": "2026-04-08",
        "day_part": "pm",
        "assignment_note": null
      }
    ]
  }
}
```

| Code | When |
|------|------|
| **400** | Validation: unknown `day_part`, task not in project, user not assignee on task, `work_date` outside `[week_start, week_start+6]`, duplicate `(user_id, work_date, day_part)`, `assignment_note` over **2000** chars |
| **403** | Not allowed to manage schedule |
| **404** | Project or `weekId` not found, or week belongs to another project |
| **409** | Week `status` is **`published`** (no edits) |

---

### 4.3.1 `POST /api/v1/projects/{projectId}/schedule-weeks/{weekId}/reopen-as-draft`

**Purpose:** After **publish**, allow the PM to edit the plan again without creating a second week row for the same `week_start`. Sets the **same** `schedule_weeks` row back to **`draft`** and clears publish metadata (`published_at`, `published_by` — or keep them in an audit table if you version history).

**Body:** empty or `{}`.

**Success 200** — same envelope as **GET** schedule week (or **PUT** response): `week` with `status: "draft"` + `entries` unchanged.

**Workers / `GET /me/schedule`:** Should keep returning the **last published** snapshot until the PM **publishes** again (recommended), or document if you immediately hide rows until republish (not recommended).

| Code | When |
|------|------|
| **400** | Week already **draft**, or business rule forbids reopen |
| **403** | Not PM / admin / prj_manager |
| **404** | Project or `weekId` not found |
| **409** | Optional: conflict if your product forbids reopen (prefer **400** with message) |

---

### 4.4 `POST /api/v1/projects/{projectId}/schedule-weeks/{weekId}/publish`

**Body:** empty or `{}`.

**Success 200:**

```json
{
  "status": "success",
  "data": {
    "week": {
      "id": 42,
      "project_id": 10,
      "week_start": "2026-04-06",
      "status": "published",
      "published_at": "2026-04-05T18:22:10.000Z",
      "published_by": 99
    }
  }
}
```

Re-validate entries on publish if desired; if invalid → **400**.

| Code | When |
|------|------|
| **400** | Business validation failed at publish time |
| **403** | Not allowed to publish |
| **404** | Project / week not found |
| **409** | Already **published** (idempotent **200** is acceptable alternative) |

---

### 4.5 `GET /api/v1/me/schedule`

**Query:** `from`, `to` (inclusive `YYYY-MM-DD`), required.

**Success 200:**

```json
{
  "status": "success",
  "data": {
    "entries": [
      {
        "id": 1001,
        "project_id": 10,
        "schedule_week_id": 42,
        "task_id": 2001,
        "work_date": "2026-04-08",
        "day_part": "am",
        "assignment_note": "Bring extension ladder; north wall first.",
        "task": {
          "id": 2001,
          "name": "Install panels",
          "project_id": 10,
          "status": "in_progress"
        }
      }
    ]
  }
}
```

Only rows where:

- `user_id` = current user, and  
- parent week **`status === published`**, and  
- `work_date` in `[from, to]`.

**`entries[].id`:** Must be the primary key of the **`worker_task_schedules`** row (same value used in schedule-entry **messages** URLs). If the payload also includes **`worker_task_schedule_id`**, it must match that row id. The SPA prefers `worker_task_schedule_id` when present so a wrong duplicate `id` cannot break chat.

**Do not** put **`schedule_week_id`** (parent week row, e.g. `42`) into **`schedule_entry_id`**, **`scheduleEntryId`**, or **`worker_schedule_id`** — the client treats values equal to `schedule_week_id` on secondary keys as invalid so chat does not call messages with the week PK instead of the slot PK.

| Code | When |
|------|------|
| **400** | Missing `from` / `to` or invalid range |
| **401** | Not authenticated |

---

## 5. Error envelope (example)

Align with existing API style if you use `error_code` / `message`:

```json
{
  "status": "error",
  "error_code": 409,
  "message": "Cannot modify entries: schedule week is already published."
}
```

---

## 6. Schedule entry messages (optional)

**Multichannel contract (foreman vs PM only), shared literals, DB column, request/response shapes:**  
**`docs/SCHEDULE_ENTRY_MESSAGES_FOREMAN_PM.md`** — **single source of truth** for frontend and backend.

Summary:

| Method | Path | Notes |
|--------|------|--------|
| **GET** | `/api/v1/projects/{projectId}/schedule-entries/{scheduleEntryId}/messages` | Required query **`channel=foreman`** or **`channel=pm`**. |
| **POST** | same | JSON body **`channel`** + **`body`**. |

- Each message row and JSON object includes **`channel`** (`foreman` \| `pm`).
- Table: `fw_worker_task_schedule_messages` — see `docs/BACKEND_WORKER_TASK_SCHEDULE.md` §2.3.
- No WebSocket in scope; poll after **POST**.

| Code | When |
|------|------|
| **400** | Missing/invalid **`channel`**, bad body/cursor |
| **403** | No access or wrong stream for role |
| **404** | Project / entry not found |
| **409** | Optional: e.g. chat only when week is **published** |

---

## 7. Related docs

- **Foreman / PM message channels (contract):** `docs/SCHEDULE_ENTRY_MESSAGES_FOREMAN_PM.md`
- Data model / tables: `docs/BACKEND_WORKER_TASK_SCHEDULE.md`
- Task-user scoping: `docs/BACKEND_TASK_USER_PROJECTS_API.md`

---

## Document control

| Version | Note |
|---------|------|
| 1.0 | Paths, RBAC, bodies, status codes, `week_start` normalization |
| 1.1 | `assignment_note` on entries; optional schedule-entry **messages** API |
| 1.2 | **POST** `reopen-as-draft` for editing after publish; §3.2 `assignment_docs_url` reserved for later |
| 1.3 | §6 messages: **variant B** — required `channel` `foreman` \| `pm` (two streams per slot) |
| 1.4 | §6 slimmed; normative FE–BE contract: `docs/SCHEDULE_ENTRY_MESSAGES_FOREMAN_PM.md` |

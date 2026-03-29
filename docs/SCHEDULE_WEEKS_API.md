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

### 1.2 Current user: “my schedule”

| Method | Path | Purpose |
|--------|------|---------|
| **GET** | `/api/v1/me/schedule?from=YYYY-MM-DD&to=YYYY-MM-DD` | Slots from **published** weeks only + short **`task`** per row. |

---

## 2. Permissions (RBAC)

| Action | Who |
|--------|-----|
| **POST** draft, **PUT** entries, **POST** publish | `admin`, **`prj_manager`** / PM, or equivalent **project management** role (enforce per `projectId`). |
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
        "day_part": "am"
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
      "day_part": "am"
    },
    {
      "user_id": 5,
      "task_id": 2002,
      "work_date": "2026-04-08",
      "day_part": "pm"
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
        "day_part": "am"
      },
      {
        "id": 1003,
        "user_id": 5,
        "task_id": 2002,
        "work_date": "2026-04-08",
        "day_part": "pm"
      }
    ]
  }
}
```

| Code | When |
|------|------|
| **400** | Validation: unknown `day_part`, task not in project, user not assignee on task, `work_date` outside `[week_start, week_start+6]`, duplicate `(user_id, work_date, day_part)` |
| **403** | Not allowed to manage schedule |
| **404** | Project or `weekId` not found, or week belongs to another project |
| **409** | Week `status` is **`published`** (no edits) |

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

## 6. Related docs

- Data model / tables: `docs/BACKEND_WORKER_TASK_SCHEDULE.md`
- Task-user scoping: `docs/BACKEND_TASK_USER_PROJECTS_API.md`

---

## Document control

| Version | Note |
|---------|------|
| 1.0 | Paths, RBAC, bodies, status codes, `week_start` normalization |

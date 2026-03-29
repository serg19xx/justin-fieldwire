# Backend: user object for `GET /api/v1/profile`

The SPA calls **`GET /api/v1/profile`** after login (avatar / full profile) and on session restore when the saved user has no `avatar_url`.

The response is merged into the in-memory user from **`POST /api/v1/auth/login`**. If the profile payload **omits** fields that login included, the client must merge carefully — but **the backend should always return the same role fields as login** so the UI stays consistent after refresh.

## Required fields on `data.user` (or your envelope equivalent)

| Field | Type | Purpose |
|--------|------|---------|
| **`role_category`** | string | **`global`** \| **`project`** \| **`task`** — drives app shell: which layout, dashboard, and `/tasks` behaviour. |
| **`role_code`** | string | e.g. `admin`, `project_manager`, `worker`, `foreman`, `contractor`, `inspector`, `architect` |
| **`role_id`** | number (optional but recommended) | Matches `fw_glob_roles` / your roles table |
| **`role_name`** | string (optional) | Display label |

### Why `role_category` matters

- **`task`** — Task executor UI (orange shell, bottom tabs, task-oriented routes).
- **`project`** — Project manager style (green shell, PM navigation).
- **`global`** — Admin / global shell.

If **`role_category` is missing** on the profile response, some clients may treat it as `undefined` and fall back to the wrong layout after a page reload.

## Recommended JSON shape (fragment)

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 51,
      "email": "worker@example.com",
      "name": "Jane Worker",
      "role_id": 12,
      "role_code": "worker",
      "role_name": "Worker",
      "role_category": "task",
      "avatar_url": "/storage/...",
      "phone": "...",
      "job_title": "..."
    }
  }
}
```

## Alignment with login

Ensure **`POST /api/v1/auth/login`** and **`GET /api/v1/profile`** use the **same** rules to populate `role_category` and `role_code` (e.g. from the same service or resource class).

## Frontend note

The SPA also **infers** `role_category` from `role_code` when it is missing, and **preserves** role fields when merging profile — but the authoritative fix is for the API to return these fields consistently.

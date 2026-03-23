# Backend: Project `sys_status` (system lifecycle)

The `status` field on projects is **client-facing only** (sales funnel labels). The **`sys_status`** field drives app behavior: task-role Active vs Archived tabs, filters, and future automation.

## Column / API field

- **Name:** `sys_status` (recommended DB column name matches).
- **Type:** string enum (or `VARCHAR` with check constraint).
- **Nullable:** yes — if null or empty, the frontend treats lifecycle as **`draft`**. Client `status` is never used for this (it is informational only).

## Allowed values (canonical: lowercase)

The frontend normalizes stored values (case, spaces, underscores), so `Draft`, `ACTIVE`, and `closing` from MySQL enums all map correctly. Prefer lowercase in the API for consistency.

| Value       | Meaning                          |
|------------|-----------------------------------|
| `draft`    | Draft / planned, not in execution |
| `active`   | In progress                       |
| `closing`  | Closing out / handover            |
| `suspended`| On hold / paused                  |
| `done`     | Finished (archived in task UI)   |

## API

- **POST** `/api/v1/projects` — accept optional `sys_status`; default `draft` if omitted.
- **PUT** `/api/v1/projects/:id` — accept `sys_status`.
- **GET** list/detail — return `sys_status` on each project.

## Frontend reference

Canonical labels and helpers: `src/core/utils/project-sys-status.ts`.

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

## Troubleshooting: UI shows **Draft** for every project

The app treats missing or empty `sys_status` as **`draft`**. If every row shows Draft:

1. **API does not include the field** — Add `sys_status` to the project serializer / `ProjectResource` (Laravel) or equivalent so `GET /api/v1/projects` and `GET /api/v1/projects/:id` return it.
2. **Database values are NULL** — Run a one-time backfill (example for MySQL, adjust table/column names):

   ```sql
   UPDATE fw_projects SET sys_status = 'active' WHERE sys_status IS NULL OR sys_status = '';
   ```

   Prefer setting real values per project (e.g. `done` for closed jobs) instead of one value for all.
3. **JSON key name** — The frontend accepts **`sys_status`** or **`sysStatus`** (normalized to `sys_status` after fetch).

Verify in the browser **Network** tab: each project object in the list/detail response should contain a non-empty `sys_status` (or `sysStatus`) when you expect something other than Draft.

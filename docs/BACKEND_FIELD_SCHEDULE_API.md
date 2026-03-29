# Backend API (proposed): field visit schedule & notification preferences

Supports the SPA features in `/tasks/my-week` and Account → **Field notifications**. Until implemented, the client uses `localStorage`.

---

## 1. Field schedule (half-day slots)

**`GET /api/v1/me/field-schedule`**

Query:

- `from` — `YYYY-MM-DD`
- `to` — `YYYY-MM-DD` (inclusive)

Response `data`:

```json
{
  "assignments": {
    "2026-03-24": { "am": { "project_id": 58 }, "pm": { "project_id": 59 } },
    "2026-03-25": { "full": { "project_id": 58 } }
  }
}
```

Or array form (optional):

```json
{
  "assignments": [
    { "date": "2026-03-24", "slot": "am", "project_id": 58 },
    { "date": "2026-03-24", "slot": "pm", "project_id": 59 }
  ]
}
```

**`PUT /api/v1/me/field-schedule`** (or `PATCH`)

Body example:

```json
{
  "date": "2026-03-24",
  "slot": "am",
  "project_id": 58
}
```

`project_id: null` clears the slot. Validate that the user may access the project (team / assignee).

---

## 2. Notification preferences

**`GET /api/v1/me/notification-preferences`**

Response `data`:

```json
{
  "outbound_enabled": true
}
```

When `outbound_enabled` is `false`, the backend must not send email/SMS/push for digests and reminder rules (in-app policy optional).

**`PATCH /api/v1/me/notification-preferences`**

Body:

```json
{
  "outbound_enabled": false
}
```

---

## 3. Server-side jobs (out of SPA scope)

- **Weekly digest** email after plan publish (aggregate per user, not per task).
- **End-of-day** overdue bucket → one aggregated reminder + status prompt (idempotent per user per window).

See `docs/TZ_FIELD_VISITS_NOTIFICATIONS.md`.

# Schedule entry messages — Foreman / PM channels (FE–BE contract)

**Scope:** Only **two parallel message streams** per schedule row (`scheduleEntryId`). No other channels in this contract.

**Normative:** String values are **exactly** lowercase ASCII **`foreman`** and **`pm`** everywhere (DB, query, JSON). Invalid values → **400**.

---

## 1. Meaning

| `channel` value | UI (worker) | Intended counterpart |
|-----------------|-------------|----------------------|
| `foreman` | “Foreman” tab | Foreman ↔ assigned worker for this slot |
| `pm` | “PM” tab | Project manager ↔ assigned worker for this slot |

Each stream has its **own** message history. Mixing both into one list is **out of scope**.

---

## 2. Database

Table (example name): `fw_worker_task_schedule_messages`.

| Column | Requirement |
|--------|-------------|
| `worker_task_schedule_id` | FK to schedule **entry** row; **ON DELETE CASCADE** |
| **`channel`** | **NOT NULL**; allowed values only **`foreman`** \| **`pm`** |
| `author_user_id`, `body`, timestamps, optional `deleted_at` | As in your global message conventions |

**Index:** `(worker_task_schedule_id, channel)` (and optionally add `id` or `created_at` for cursor pagination).

---

## 3. API

**Base path (resource segment may differ by backend):**  
`/api/v1/projects/{projectId}/{resource}/{scheduleEntryId}/messages`

- **Contract name:** `resource` = **`schedule-entries`**.
- **Common implementation:** **`worker-task-schedules`** (matches table `worker_task_schedules`).

The SPA tries **`schedule-entries`**, then **`worker-task-schedules`**, on **404** only, and caches the working segment in `sessionStorage`. To force one path, set:

`VITE_SCHEDULE_ENTRY_MESSAGES_SEGMENT=worker-task-schedules` (or `schedule-entries`) in `.env`.

`scheduleEntryId` = primary key of the worker schedule **entry** row (same id the SPA passes as `entryId` in query).

### 3.1 GET — load one stream

**Required query:** `channel=foreman` **or** `channel=pm`.

**Optional:** `limit`, `before_id` — scoped to that `channel` only.

**Response `data` (minimum agreed fields):**

- `channel` — echo the requested channel (`foreman` | `pm`).
- `messages` — array; **each element includes `channel`** (same value as the stream).

Example message object:

```json
{
  "id": 1,
  "worker_task_schedule_id": 1001,
  "channel": "foreman",
  "author_user_id": 5,
  "body": "On site at 7:30.",
  "created_at": "2026-04-08T12:00:00.000Z",
  "updated_at": null,
  "deleted_at": null
}
```

### 3.2 POST — append to one stream

**Body (JSON):**

```json
{
  "channel": "foreman",
  "body": "…"
}
```

- **`channel`:** required, **`foreman`** or **`pm`**.
- **`body`:** required after trim; max length (e.g. 4000) → **400** if exceeded.

**Response:** Created message object, same shape as in GET list (including **`channel`**).

**Errors:** **400** if `channel` missing or not `foreman`|`pm`; **403** if role may not post to that stream; **404** if entry/project mismatch.

---

## 3.3 Backend: response body must not be “empty”

If the client shows **no messages** but the DB has rows, the server response is usually **wrong shape** or the **wrong `scheduleEntryId`**.

### Envelope (pick one style; the SPA supports both)

**A — Wrapped (same as most FieldWire APIs):**

```http
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "status": "success",
  "data": {
    "channel": "pm",
    "messages": [
      {
        "id": 1,
        "worker_task_schedule_id": 40,
        "channel": "pm",
        "author_user_id": 47,
        "body": "Hello from PM",
        "created_at": "2026-04-05T12:45:11.000Z",
        "updated_at": null,
        "deleted_at": null
      }
    ]
  }
}
```

**B — Flat (no `data` wrapper):**

```json
{
  "channel": "pm",
  "messages": []
}
```

**When there are no messages yet**, still return **200** with an **empty array**, not an empty object and not a bare `null`:

```json
{
  "status": "success",
  "data": {
    "channel": "pm",
    "messages": []
  }
}
```

### GET handler checklist

1. **`scheduleEntryId` in the URL** must be **`worker_task_schedules.id`**, not the message `id`, not `task_id`.
2. **Query `channel`** must match the column filter (`foreman` | `pm`). Rows stored as `pm` will not appear for `channel=foreman`.
3. **`messages`** must be a **JSON array** under `data.messages` **or** `messages` at the same level as `channel` (see parsers in `schedule-weeks-api.ts`). Aliases **`items`**, **`results`**, **`list`** are also read from that object.
4. Each message object should include at least: **`id`**, **`body`**, **`created_at`**, **`channel`** (or rely on query channel). **`author_user_id`** (or **`user_id`**) is used to show “Me” vs other. **`worker_task_schedule_id`** may be omitted; the client fills it from the URL id.

### Quick verification (replace host, token, ids)

```bash
curl -sS -H "Authorization: Bearer YOUR_JWT" \
  "http://localhost:8080/api/v1/projects/58/worker-task-schedules/40/messages?channel=pm"
```

If this prints **`messages":[]`** while SQL shows rows for `worker_task_schedule_id=40` and `channel='pm'`, fix the **repository filter** or **project scoping** on the server.

### 3.4 Client integration checklist (404 / 400 / non-JSON)

1. **URL:** Only  
   `/api/v1/projects/{projectId}/schedule-entries/{entryId}/messages?channel=…`  
   or  
   `/api/v1/projects/{projectId}/worker-task-schedules/{entryId}/messages?channel=…`  
   (after a backend update, both may be valid). Do not call a non-existent path if the proxy or base URL differs.

2. **`channel`:** Strictly `pm` or `foreman` in query and JSON body — no trailing dot or spaces (`pm.` fails validation → **400**). The SPA uses `sanitizeScheduleEntryMessageChannel` before GET/POST.

3. **`entryId`:** Path id = **`id` from `data.entries[]`** on project GET/PUT **`/schedule-weeks?week_start=…`**. It is **not** the generic **`id`** from **GET `/me/schedule`** when that id is a snapshot / different entity. The worker UI opens chat only when **`scheduleRowIdForMessages`** is set from explicit fields (e.g. `worker_task_schedule_id`); otherwise the link is disabled until the API exposes the real row id.

4. **`projectId`:** Must match **`project_id`** on that schedule row; mismatch → **404**.

5. **Vite (`localhost:5173`):** `/api` must be **proxied** to the real backend. If not, Network may show HTML or empty body instead of controller JSON — fix frontend proxy / env, not the PHP handler first.

### 3.5 JSON 404 — backend logic, not the dev proxy (≈1 minute)

If the response is **`application/json`** and the body is small (on the order of **~80–120 bytes**), the request **likely reached PHP**. The problem is then **404 logic in the controller** (or repository), not a missing Vite proxy.

**1. Read the response body** (DevTools → Network → the request → **Response**). Typical messages:

| `message` (example) | Meaning |
|---------------------|---------|
| `Schedule entry not found` (or similar) | No row in **`fw_worker_task_schedules`** with that **`id`** and **`project_id`** from the URL. |
| `Project not found` | The **`projectId`** in the path does not exist (less common). |

**2. Confirm in the database** (adjust ids):

```sql
SELECT id, project_id, schedule_week_id, user_id, task_id, work_date, day_part
FROM fw_worker_task_schedules
WHERE id = 1 AND project_id = 58;
```

If this returns **no rows**, **404 is correct**: the URL must not use a made-up id (e.g. **`1` as “first slot of the week”**). **`entryId` is the primary key** of `fw_worker_task_schedules`; real ids are often **149**, **2001**, etc.

**3. Correct source for `entryId`:** use **`id` from `data.entries[]`** on  
`GET /api/v1/projects/{projectId}/schedule-weeks?week_start=…`  
(or the same array returned after **PUT** …`/entries`). That value goes into  
`/api/v1/projects/{projectId}/worker-task-schedules/{entryId}/messages`  
(or the **`schedule-entries`** alias if your backend exposes it).

**4. Path vs format:** **`worker-task-schedules`** is fine if you still get **JSON** on 404. Suspect a **missing route** only when the response is **HTML** or a non-API content type. When in doubt, align with the canonical segment **`schedule-entries`** or deploy a backend **alias** for both segments.

---

## 4. Frontend alignment (this repo)

| Worker UI state | API `channel` |
|-----------------|---------------|
| Foreman tab | `foreman` |
| PM tab | `pm` |

When calling GET/POST, the SPA sanitizes the channel (trim, strip trailing dots) then sends **`foreman`** or **`pm`**. No aliases (e.g. no `project_manager`).

**Worker slot id = PM slot id:** `resolveScheduleSlotIdForMessages()` loads **`GET …/schedule-weeks?week_start=`** (Monday of the slot’s week), then picks **`entries[].id`** where **`user_id`**, **`task_id`**, **`work_date`**, **`day_part`** match the worker’s slot — the same composite key PM uses in the schedule-messages tree. `/me/schedule` is not used as the messages URL PK (only for assignment text).

### 4.1 Backend: PM and worker see one thread

1. **`entries[].id`** must be the real **`fw_worker_task_schedules.id`** for that row (not another table’s PK).
2. **Every message** for that chat must use **`worker_task_schedule_id = that id`**. Mixing ids (e.g. 43 vs 45 for the same UI slot) splits the thread.
3. **`GET …/messages`** lists all rows for **`(worker_task_schedule_id, channel)`** for any user allowed to view the slot — **do not** filter with `author_user_id = current user` only.
4. **Different** `work_date` or **`day_part`** ⇒ **different** `fw_worker_task_schedules` rows ⇒ **different** threads (normal). PM and worker must both target the **same** row for the **same** date + part.

---

## 5. Related

- Full schedule API context: `docs/SCHEDULE_WEEKS_API.md` §6 (summary + error table).
- Parent table notes: `docs/BACKEND_WORKER_TASK_SCHEDULE.md` §2.3.

| Version | Note |
|---------|------|
| 1.0 | FE–BE contract: two channels only, shared literals |
| 1.1 | §3.3 required GET envelope, empty list, backend checklist, curl |
| 1.2 | §3.4 client checklist; `/me/schedule` id vs week `entries[].id`; channel sanitization |
| 1.3 | §3.5 JSON 404 vs proxy; Response body; SQL; `entryId` not ordinal “1” |
| 1.4 | §4 worker `resolveScheduleSlotIdForMessages`; §4.1 backend one thread per slot |

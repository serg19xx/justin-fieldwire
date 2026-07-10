# Field work on site — foreman, crew, and PM visibility

**Audience:** Product owner, project managers, foremen, and QA.

**Language:** English (stakeholder / client review).

**Version:** 1.0  
**Site:** https://fieldwire.medicalcontractor.ca

**Web (after deploy):** https://fieldwire.medicalcontractor.ca/FIELD_WORK_USER_GUIDE.html

---

## What this feature is

When work happens on site, the **foreman or assigned crew** records what actually happened on a **task**: start/end times, progress, notes, and before/after photos. They then **submit** that package for **PM review**.

This does **not** change the official PM task status (`planned`, `in_progress`, `done`, etc.). Only the **project manager** changes official status in the PM web app.

---

## Who can record field work

| Role | Assigned to task | Can record field work |
|------|----------------|------------------------|
| **Task lead (foreman on task)** | Yes, as foreman/brigadier | Yes — full field work panel |
| **Global foreman** | Yes, as team member | Yes |
| **Worker** | Yes, as team member | Yes — same as foreman when assigned (e.g. foreman off site) |
| **Contractor** | Yes | **View only** (pending final client decision) |
| **Project manager / admin** | Any | Full task edit in PM UI (not the mobile field panel) |

When a **worker** submits work instead of the task lead, the system stores **who actually submitted** and links the event to the **task lead** for audit (`submitted_on_behalf_of_lead` in the event log).

---

## Where the foreman / crew works (mobile Tasks UI)

**Path:** Log in → **Tasks** → open project → open a task.

On the task detail screen:

### 1. Progress

- Slider **0–100%** while work is editable.
- Locked after **Submit work for review**.

### 2. Work times (required before submit)

- **Start work** — date/time dialog; optional **reason** if different from planned start.
- **End work** — same pattern for end time.
- Times are stored as entered (wall-clock, no timezone shift).

### 3. Site photos (optional)

- **Before work** and **After work** sections.
- Up to **15 photos** per section; images are compressed on the device and saved on the **server**.
- `work_date` for filing = date of **field_work_started_at**, or **today** if start not set yet.

### 4. Foreman notes

- Free-text **site report** for the PM (materials, access issues, handoff).
- Separate from start/end **reason** fields.

### 5. Submit work for review

- Requires **start** and **end** times.
- Sets `field_submitted_at` / `field_submitted_by`.
- PM sees **“Submitted for PM review”** on the task; official status unchanged.

**Official status** on the same screen is **read-only** for field roles: *“Only the project manager can change task status.”*

---

## Where the PM sees field work

### A. Task detail (PM web — Tasks / Gantt)

The PM sees the same field columns on the task when opened in the project:

- Progress %
- Field work started / ended (and reasons if any)
- Field notes
- Submission timestamp

### B. Plans → Execution Logs (file manager)

Field photos appear under the project’s **Execution Logs** folder (template folder from plan setup). Structure:

```
Execution Logs
  └─ {planned dates} · {task name}     e.g. "25 Jun – 29 Jun · Framing"
       └─ {work day}                   e.g. "10 Jul, Fri"
            → Right panel: two groups
                 Before work   [photos…]
                 After work    [photos…]
```

- Task folder name includes a **short planned date range** + task name (easier sorting when names are similar).
- Work-day folders use a **short date + weekday** label.
- Photos are **read-only** in Plans (managed by the app; download/preview OK).
- Files on disk: `uploads/task-field-photos/p-{project}/t-{task}/d-{date}/{before|after}/…`

### C. Event log (backend)

Submitting field work writes a **TASK_FOREMAN_SUBMITTED** (or crew variant) event with task id, submission time, submitter, and task lead id when applicable.

---

## End-to-end flow (typical day)

1. **PM** creates task, sets planned dates, assigns **foreman (task lead)** and **crew**.
2. **Foreman** opens task on phone → **Start work** → adds **before** photos → updates **progress** → **End work** → **after** photos → **notes** → **Submit work for review**.
3. **PM** opens **Plans → Execution Logs** to review photos by task/day; checks progress and notes on the task; updates **official status** when appropriate.

If the foreman is not on site, an assigned **worker** can perform steps 2–3; submission is attributed to that user with task lead on record.

---

## What contractors see today

Contractors assigned to a task see task details and progress **read-only**:

- Role label: **Contractor**
- Message: site updates are recorded by foreman or crew.
- No field work panel until product owner confirms otherwise.

---

## Database (for admins)

Relevant tables/columns:

- `fw_prj_tasks`: `field_work_started_at`, `field_work_ended_at`, `field_work_start_reason`, `field_work_end_reason`, `field_notes`, `field_submitted_at`, `field_submitted_by`
- `fw_task_field_photos`: per-photo metadata (`slot`, `work_date`, file path, uploader)

Migrations live in the frontend repo `migrations/` and API repo `scripts/`.

---

## Related guides

- [Task assignments and roles](https://fieldwire.medicalcontractor.ca/CLIENT_TEAM_ASSIGNMENTS_TESTING_GUIDE.html)
- [Schedule and photos testing manual](https://fieldwire.medicalcontractor.ca/USER_TESTING_MANUAL_SCHEDULE_AND_PHOTOS.html) (schedule slot documents — separate from Execution Logs field photos)

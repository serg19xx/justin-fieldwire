# Client guide: task assignments and role-based visibility

**Audience:** Product owner, QA, or project managers testing the FieldWire-style app.

**Language:** This document is for stakeholders who review features in English.

**Version:** 1.0  
**Site:** https://fieldwire.medicalcontractor.ca

**Web (after deploy):** https://fieldwire.medicalcontractor.ca/CLIENT_TEAM_ASSIGNMENTS_TESTING_GUIDE.html  
**Russian:** https://fieldwire.medicalcontractor.ca/CLIENT_TEAM_ASSIGNMENTS_TESTING_GUIDE_RU.html

---

## Scope of this guide

Step-by-step verification of **assigning people to project tasks** and **what each role sees** in the PM web UI and in the foreman / worker mobile-style UI.

**Out of scope** (the client already knows how; test data exists in the system):

- inviting and adding people to the project team;
- creating projects;
- creating tasks from scratch.

**Not ready for acceptance:** **messaging and push/email notifications** about assignments. Schedule-slot chat UI may be visible, but **real SMS, push, and email delivery for assignment events is not production-ready**. See section 8.

---

## 1. Two levels of “team”

| Level | Where it is set | Purpose |
|-------|-----------------|---------|
| **Project team** | Project → **Team** | Who is allowed on the project (overall roster). |
| **Task assignment** | Project → **Tasks** → task panel | Who **specifically** works on **this** task. |

Field roles care about the **second level**: a worker or foreman sees a task in their app only if they are on the task as **member** or **task lead**.

---

## 2. Roles on a task (assigning staff)

Open a project → **Tasks** → select a task (from the list or **Gantt**).

In the task edit panel:

### 2.1 Foreman / Brigadier (task lead)

- Field on the **General** tab: **Foreman / Brigadier**.
- Stored as **task lead** (responsible foreman **for this task**).
- Can update progress and field data when assigned as lead.

### 2.2 Assigned Team Members

- **Team** tab → **+ Add Team Member**.
- People from the project team (and available workers).
- Stored as **team_members** — regular executors on the task.
- They see the task in their app but **cannot** change progress (view only) unless they are task lead.

### 2.3 How PM sees this in Team → Tasks

In the worker **Tasks** view, each row is labeled:

- **Task lead** — assigned foreman on the task;
- **Team member** — on the task team without lead role.

---

## 3. Task status and where it appears

The system groups statuses differently for **PM (worker schedule)** and **field roles (/tasks tabs)**.

### 3.1 Task statuses (reference)

| Task status | Meaning for testing |
|-------------|---------------------|
| `planned` | Planned, not yet in execution |
| `scheduled` | Planned with schedule linkage |
| `scheduled_accepted` | Planned, accepted by assignee |
| `in_progress` | In progress |
| `partially_completed` | Partially complete |
| `delayed_due_to_issue` | Delayed |
| `ready_for_inspection` | Ready for inspection |
| `completed` | Finished (archive) |

### 3.2 PM: Team → **Tasks** → Planned | Current | Archive

| PM tab | Statuses included | Meaning |
|--------|-------------------|---------|
| **Planned** | `planned`, `scheduled`, `scheduled_accepted` | Planning and prep — **full PM picture**, including work still “on paper”. |
| **Current** | All active (`in_progress`, `partially_completed`, delays, inspection, etc.) | **Current** — one primary active task; **Upcoming** — other active tasks by date. |
| **Archive** | `completed` | Finished assignments. |

**View only:** PM does **not** add or remove people from tasks here — assignment is done in **Tasks** / **Gantt**.

### 3.3 Foreman / worker: `/tasks/projects/{id}` → Planned | In progress | Closed

| Field tab | Statuses | Note |
|-----------|----------|------|
| **Planned** | `planned`, `scheduled`, `scheduled_accepted` | Upcoming work on **already assigned** tasks |
| **In progress** | `in_progress`, `partially_completed`, `delayed_due_to_issue`, `ready_for_inspection`, other active | Current work |
| **Closed** | `completed` | Closed tasks |

**Important:** a worker does **not** see tasks they are **not** assigned to (neither lead nor member). A foreman in **All tasks** sees **all project tasks**; in **My tasks** — only tasks where they are member or lead.

### 3.4 Visibility matrix

| Task status | PM Team → Tasks (Planned / Current / Archive) | Worker (if assigned) | Foreman My tasks | Foreman All tasks |
|-------------|-----------------------------------------------|----------------------|------------------|-------------------|
| planned | Planned | Planned | Planned | Planned |
| scheduled | Planned | Planned | Planned | Planned |
| scheduled_accepted | Planned | Planned | Planned | Planned |
| in_progress | Current | In progress | In progress | In progress |
| partially_completed | Current | In progress | In progress | In progress |
| ready_for_inspection | Current | In progress | In progress | In progress |
| delayed_due_to_issue | Current | In progress | In progress | In progress |
| completed | Archive | Closed | Closed | Closed |
| Not assigned to task | Not in worker’s Tasks | **Not visible** | **Not visible** (My) | **Visible** (All) |

---

## 4. What the PM sees: Gantt, Tasks, Team

### 4.1 Gantt (chart under Tasks)

**Where:** Project → **Tasks** → **Gantt** view.

**Why PM uses it:**

- see **dates of all project tasks** on a timeline;
- understand **overlaps and dependencies**;
- open a task quickly and **assign foreman and team** in the same edit panel.

**Gantt does not replace Team:** bars show **project tasks**, not a person’s schedule. Who is on which task is set in the task panel; the **per-person** summary is **Team → Tasks**.

### 4.2 Tasks (list + task panel)

**Where:** Project → **Tasks** → list or Gantt → click a task.

**Why PM uses it:** the only place to **assign** Foreman / team members and change task status.

### 4.3 Team — global and project

| Place | Path | What it shows |
|-------|------|---------------|
| **Global Team** | Top menu → **Team** | Workers / contractors across accessible projects (same table as in a project). |
| **Project Team** | Project → sidebar **Team** | People linked to **this** project only. |

**Buttons per worker row:**

| Button | Purpose |
|--------|---------|
| **Details** | Profile: contacts, profession, languages, emergency contact (**no** project list). |
| **Tasks** | **Worker task schedule (view only)** — Planned / Current / Archive tabs. |

**Global Team → Tasks:** if the person has assignments in **multiple** projects — **accordion** per project.  
**Project Team → Tasks:** three tabs **without** accordion — this project only.

**Why two Team views:** global — “who is busy where company-wide”; project — quick check **for this site only**.

---

## 5. What the foreman sees (mobile / task layout)

**Login:** account with **Foreman** role.  
**Home:** dashboard with project overview, open tasks, team size.  
**Routes:** **Tasks** menu → **My projects** → project.

### 5.1 Foreman dashboard

- **Active projects**, **Open tasks**, **Team (unique)** — aggregates across accessible projects.
- **Recent projects** block → **View tasks** link to the project list.

### 5.2 Task list inside a project

Toggle (foreman only):

| Mode | Content |
|------|---------|
| **My tasks** | Tasks where user is **task lead** or **team member** |
| **All tasks** | **All** project tasks (foreman oversight on site) |

Status tabs: **Planned | In progress | Closed** (see section 3).

### 5.3 Permissions on a task

- Foreman is **task lead** → can change **progress** and field fields.
- Foreman is **team member** only → **view only** (same as worker).

---

## 6. What the worker sees (mobile / task layout)

**Login:** **Worker** or **Contractor** account.  
**Home:** **Your projects** — projects where the user has task assignments.

### 6.1 Navigation

1. **Tasks** → **My projects** (tabs **Current project** / **Planned** for **project** lifecycle).
2. Open a project → **Planned | In progress | Closed** for **tasks** where the user is assigned.

### 6.2 Limitations

- **No** “all project tasks” list — **own** assignments only.
- **No** PM-style **Archive** tab — closed tasks are under **Closed**.
- Assign / unassign — **PM only** in the web project UI.

---

## 7. Step-by-step test scenarios

Use **existing test projects, tasks, and users**. For each scenario, use a **separate browser / incognito window** or different devices.

### Preconditions

1. A project with a team and several tasks in different statuses.
2. At least three accounts: **PM**, **Foreman**, **Worker** — all already on the project team.
3. PM uses the web app; foreman and worker use the same site with the **Tasks** UI (mobile layout).

---

### Test A — PM assigns foreman and worker to a task

1. Sign in as **PM**.
2. Open project → **Tasks** → pick a task with status **planned**.
3. On **General**, select **Foreman / Brigadier** (test foreman) → **Save**.
4. **Team** tab → **+ Add Team Member** → add test **Worker** → **Save**.
5. **Expect:** task saves without error; lead and member persist on reopen.

---

### Test B — PM sees assignment in Team → Tasks (project)

1. Still as PM: project → **Team**.
2. On the **Worker** row, click **Tasks**.
3. **Expect:** **Worker schedule (view only)** screen with the worker’s name.
4. **Planned** tab — task from test A (planned status).
5. **Back to team list** — returns to the table without full page reload.
6. Task row shows **Team member**.

7. Repeat for **Foreman** → **Tasks** → same task with **Task lead** label.

---

### Test C — PM: global Team vs project Team

1. PM → top menu **Team** → **Tasks** for the same worker.
2. **Expect:** one tabbed block if assignments are in one project; **accordion by project** if multiple.
3. PM → same worker → project → **Team** → **Tasks**.
4. **Expect:** tasks for **this** project only.

---

### Test D — Gantt and assignment

1. PM → project → **Tasks** → **Gantt**.
2. **Expect:** task bars by date; click opens edit panel.
3. Confirm **Foreman** and **Team** match the Tasks list.
4. PM → **Team** → worker **Tasks** — data **matches** the task panel.

---

### Test E — status change and PM tabs

1. PM → **Tasks** → move task from test A to **in_progress** → Save.
2. PM → **Team** → Worker → **Tasks**.
3. **Expect:** task leaves **Planned**, appears under **Current** (Current / Upcoming).
4. PM → set task to **completed**.
5. **Expect:** task in PM **Archive**; worker sees it under **Closed** (test F).

---

### Test F — worker sees only own assignments

1. Sign in as **Worker** (not PM).
2. **Tasks** → **My projects** → open project.
3. **Expect:** task from test A under **Planned** or **In progress** (until completed).
4. Open task detail — name, address, status, dates; **no** team assignment controls.
5. **Expect:** tasks where worker is **not** on team_members and not lead — **absent**.

---

### Test G — foreman: My tasks vs All tasks

1. Sign in as **Foreman** from test A.
2. **Tasks** → project → **My tasks** → **Planned** — task where user is **lead**.
3. Switch to **All tasks**.
4. **Expect:** **all** project tasks visible, including tasks where foreman is not assigned.
5. Open task where user is **lead** → verify **progress** can be changed (if UI is available).
6. Open task where user is **not** assigned → view only.

---

### Test H — Details without extra blocks

1. PM → **Team** → **Details** for any worker.
2. **Expect:** profile, profession, languages, emergency contact.
3. **Expect:** **no** “Current Projects” block in this dialog.

---

### Test I — end-to-end matrix (recommended for acceptance)

Use **one task assigned to a worker** and walk statuses through the table in section 3.4, checking PM / Worker / Foreman (My) / Foreman (All).

---

## 8. Messaging and notifications (not for acceptance now)

| Item | Status |
|------|--------|
| **Foreman / PM** chat on weekly **Schedule** slot | UI and API contract exist; test with the **schedule** guide separately |
| Email / SMS / push “you were assigned to a task” | **Not ready** — no production send pipeline |
| Weekly digest notifications | In TZ (`docs/TZ_FIELD_VISITS_NOTIFICATIONS.md`); **not MVP** |

**When testing assignments:** do not expect email or phone push — verify **screens only** in web and `/tasks`.

---

## 9. Troubleshooting checklist

| Symptom | What to check |
|---------|----------------|
| Worker does not see task | Assigned on task **Team** tab; task saved by PM |
| Duplicate rows in Team | Refresh page; if it persists, report to developers (dedupe fix) |
| PM Tasks empty | Person has no tasks as lead or member |
| Foreman cannot change progress | Must be **task lead**, not member only |
| Gantt vs Team mismatch | Gantt shows **tasks**; Team → Tasks shows **assignments by person** |

---

## 10. Related documents

| Document | Topic |
|----------|-------|
| `docs/CLIENT_SCHEDULE_TESTING_GUIDE.md` | PM weekly schedule |
| `docs/CLIENT_TEAM_ASSIGNMENTS_TESTING_GUIDE_RU.md` | Russian version of this guide |
| `docs/SCHEDULE_ENTRY_MESSAGES_FOREMAN_PM.md` | Foreman/PM chat on schedule slot |
| `docs/TZ_FIELD_VISITS_NOTIFICATIONS.md` | Notifications TZ (future releases) |

---

## Document control

| Version | Note |
|---------|------|
| 1.0 | Initial guide: task assignments, Team → Tasks, Gantt, PM / Foreman / Worker roles |

# Technical specification: field visits schedule and notifications (from transcript)

Official product TZ for software development. English technical terms kept where usual in code/API.

---

## 1. Goal and context

The system should help field staff **know where to go and which project applies per day or half-day**, without **notification fatigue** (no separate alert per task). Additionally: **oversight of overdue or stale tasks** via a **single status prompt**, not a stream of emails/SMS for every event.

---

## 2. Stakeholder clarifications (plan to-dos)

This section records **working assumptions for implementation** and **explicit sign-off questions** for the customer. Until signed off, treat assumptions as defaults for MVP scoping only.

### 2.1 Channels: SMS vs push vs email (“текстовое уведомление”)

| Topic | Working assumption (MVP) | Question for customer |
|--------|---------------------------|------------------------|
| **Email** | Primary external channel for **digests** and weekly plan summaries. | Confirm corporate sender domain, unsubscribe policy. |
| **“Text notification”** in source transcript | Interpreted as: **in-app** notification (banner / bell / inbox) **plus** optional **email** for the same digest content; **not** implicitly SMS unless agreed. | Confirm: did you mean SMS, mobile push, or in-app only? |
| **SMS** | **Out of MVP** unless customer mandates; requires provider, opt-in, templates, cost approval. | Need SMS in v1? Which provider/regions? |
| **Push** | **Out of MVP** for native; **optional later**: Web Push for PWA if product goes that route. | Native app vs browser-only? |

**Global opt-out:** If user sets **notifications off**, **no** email/SMS/push for rules in §3.1. In-app bell may be controlled by the same master flag or a separate toggle — **default for MVP: one master switch turns off all outbound channels; in-app optional sub-setting** (customer to confirm).

### 2.2 Phrase “уведомление о шоу”

**Interpretation in TZ:** Likely **ASR/translation noise** or shorthand for **“notification in plain text / about the schedule / about the show-up (visit)”**. Requirements cover both:

- **Schedule-driven**: where to be, which project, which half-day.
- **Task-driven**: deadline reminders and status check-ins (aggregated).

**Question for customer:** Confirm intended meaning in original language (schedule vs task vs other).

### 2.3 MVP freeze (default proposal)

Until customer approves otherwise:

| Area | In MVP | Deferred |
|------|--------|----------|
| User half-day / full-day **site schedule** | Yes | — |
| UI **“My week” / Where am I today** | Yes | Deep link “tasks for this slot” can be v2 |
| **Master notification on/off** | Yes | Per-channel granularity can be v2 |
| **Anti-spam: digests** | Yes: **one email digest per user per day** (or weekly plan only — configurable) | Per-task emails |
| **SMS / push** | No | v2 |
| **Coordinator role** publishing weekly plan | **Optional** — if not in MVP, **self-service schedule** or **PM assigns** via existing roles | Full coordinator workflow |
| **Overdue task → status prompt** | Yes: **one aggregated** prompt per bucket (e.g. end of day), not one message per task | Complex SLA rules |

**Customer must confirm:** MVP = digest email only vs digest + instant in-app; whether **coordinator** is required in v1.

---

## 3. Roles

- **Field user (executor):** sees own schedule, projects by day, receives agreed reminders, can disable notifications.
- **Coordinator (optional):** prepares/approves weekly visit plan and triggers or schedules digest delivery — **v1 optional per §2.3**.

---

## 4. Functional requirements

### 4.1 Channels and notification policy

- **Channels (target architecture):** `email`, optional `sms` | `push` (aligned with `NotifyChannel` in code: `src/core/types/event-rules.ts`).
- **Global disable:** User can disable outbound notifications; system sends **no** email/SMS/push when disabled (see §2.1 for in-app).
- **Anti-spam:** No **per-task** outbound messages for routine events; use **aggregation** (daily digest, weekly plan summary).
- **Settings:** Minimum — **master toggle**; desirable — channel picks, quiet hours (v2).

### 4.2 Field visit schedule (physical sites / projects)

- Show **which project (site) the user is on for which calendar day**.
- Support **split day:** at least **two slots** (e.g. `am` | `pm` | `full`), different projects same calendar day.
- **Week-start distribution:** manual/semi-auto by coordinator **or** auto after publish (product choice).
- **Logical model (indicative):** e.g. `UserSiteSchedule`: `user_id`, `date`, `slot` (`am`|`pm`|`full`), `project_id`, optional `note` / address ref; **change history** recommended.

### 4.3 Task reminders (no overload)

- Reminders are **useful** but **rate-limited** and **aggregated**.
- **End-of-day (or agreed deadline) rule:** if task not in a **completed** state, trigger reminder — **max N per user per day** (N configurable, default **1** aggregated message for all such tasks).
- **Status prompt:** one actionable message (in-app and/or email digest) with options — e.g. *in progress / delayed / rescheduled / done* or deep link to app — **not** a chain of auto emails per micro-event.

### 4.4 In-app display

- Screen **“My week” / “Where I’m going”:** list or calendar by day with half-day slots and projects.
- **Optional v2:** filter tasks for **current day + project from schedule**.

---

## 5. Non-functional requirements

- **Performance:** “Who is where today” must not require heavy per-open queries — cache + precompute on server where possible.
- **Confidentiality:** Schedule and task status visible only to authorized roles.
- **Delivery reliability:** Queue, retries, minimal logging for email/SMS (when enabled).

---

## 6. Acceptance criteria (examples)

- User sets **notifications off** → **zero** outbound email/SMS for reminder rules for 24h.
- Same day: morning project A, afternoon project B → UI and digest show **both** correctly.
- Task due “today”, not closed by cut-off → **at most one** aggregated reminder + **one** status prompt bucket (per settings).
- Weekly plan published → **one summary per user** per week start, not N×M per-task emails.

---

## 7. Phased delivery (recommendation)

- **MVP:** Half-day schedule model + “My week” UI + master notifications toggle + **daily email digest** (and in-app digest if product includes a notification center).
- **v2:** SMS/push, quiet hours, richer frequency rules, deep integration “overdue → status prompt” automation, coordinator workflows.

---

## Document control

| Version | Note |
|---------|------|
| 1.0 | Initial TZ from transcript + plan clarifications |

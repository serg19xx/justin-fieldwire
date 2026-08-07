# Client guide: Schedule & worker timesheet

**Audience:** Product owner / client (English).

**Web (after deploy):** https://fieldwire.medicalcontractor.ca/CLIENT_SCHEDULE_AND_WORKER_TIMESHEET_GUIDE.html

**In the app:** “User guide” link on manager Schedule, worker Schedule, worker Hours, and task day Start/End.

Same content as `public/CLIENT_SCHEDULE_AND_WORKER_TIMESHEET_GUIDE.html`.

## Summary

| App | What to test (recent additions) |
|-----|----------------------------------|
| **Manager** | Schedule as payroll notebook: project/address per day, Expected hours, Actual from phone when published |
| **Worker** | Start/End on task for today + GPS near site; Hours monthly read-only timesheet |

Test over **2–3 real days** (same-day Start/End + on-site GPS).

## Manager Schedule periods — Week vs Month / Custom

| Mode | Purpose | Editable? |
|------|---------|-----------|
| **Week** | Plan one Mon–Sun week: destinations, Expected, Save draft, Publish, Reopen | **Yes — only here** |
| **Month** | Review many days; Actual hours total for the month | **No — review only** |
| **Custom** | Same as Month with From/To (up to ~62 days) | **No — review only** |

**How to edit while browsing a month:** use **Edit in Week view** (or open **Week**). If status is **Published**, click **Reopen week for editing**, change days, then **Save draft** / **Publish**. Repeat per week as needed.

### Why Month / Custom cannot be edited (product decision)

The plan is stored **per calendar week** with lifecycle **Draft → Publish → (optional) Reopen**. Workers keep seeing the last **published** week until you publish again.

A month or custom range always spans **several weeks**, which may mix Draft and Published. There is no single “Publish this month” / “Reopen this month” without breaking that model.

**If the client asks to edit inside Month and Custom as well:** that conflicts with the week Draft / Publish / Reopen rules already agreed. What was delivered without contradiction:

1. **Variable period** (Week / Month / Custom) for *review* and *Actual hours sum*.
2. **Editing** only in **Week**, one week at a time.

True month/custom *editing* would be a separate product scope (multi-week reopen/save/publish and new conflict rules) — not a small UI toggle.

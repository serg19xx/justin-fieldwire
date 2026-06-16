# Client guide: personal calendar (FieldWire)

**Audience:** product owner, QA, English-speaking stakeholders.  
**Version:** 1.1 (calendar v2 + iCal export)  
**App:** https://fieldwire.medicalcontractor.ca

---

## Important: this is not the Tasks calendar

The **Tasks** section no longer offers a calendar view (list and Gantt remain).  
The new **Calendar** is a **personal user calendar** for meetings, reminders, and site visits. Events are **not linked** to project tasks.

---

## Two calendar modes

| | **Global calendar** | **Project calendar** |
|---|---------------------|----------------------|
| **Where** | Top menu **Calendar** → `/calendar` | Open a project → sidebar **Calendar** (between Schedule and Photos) |
| **Visible** | All your events: personal + **all projects** | Personal + **current project** only |
| **Editable** | **Personal** events only | **Current project** events only |
| **Other projects** | Shown, **read-only** (gray) | **Hidden** |
| **Personal events** | Blue, editable | Light blue, read-only |

**Rule:** create and edit personal events in the **global** calendar. Create and edit project events in that **project’s Calendar** tab.

---

## Event types

Checkbox **Requires my presence** in the event form:

| Type | Checkbox | Behaviour |
|------|----------|-----------|
| **Reminder** | off | Unlimited overlapping events; **no** conflict checks |
| **Requires my presence** | on | Checks overlaps with other presence events for **you** (personal + all projects) |

On conflict: **Save** → conflict list → **Save anyway** or **Cancel**.

---

## Export (iCalendar / Google Calendar)

On both calendars (global and project), use the green **Export iCal** button:

| Menu item | What it does |
|-----------|----------------|
| **iCalendar (.ics)** | Downloads a file for Apple Calendar, Outlook, or any iCal app |
| **Google Calendar…** | Downloads the same `.ics` file and opens Google Calendar with import instructions |

Import in Google Calendar: **+** next to “Other calendars” → **Import** → select the downloaded file.

Exports **all** your events in that view (not only the visible month).

---

## Legend

**Global:** blue = personal (editable), gray = project (read-only), amber border = requires presence.  
**Project:** green = project (editable), light blue = personal (read-only), amber border = requires presence.

---

## How to create events

- **Month:** single click selects a day; double-click or **+ New event** opens the form (default time 10:00–12:00).
- **Week / Day:** drag a time range or double-click a slot.

---

## Test scenarios

1. **Personal reminder (global)** — create without “Requires my presence”; save; edit and delete.
2. **Two reminders same time** — both save without warning.
3. **Presence conflict** — two overlapping presence events → warning → **Save anyway** works.
4. **Cross-project conflict** — presence in project A conflicts with presence in global calendar.
5. **Project calendar** — project event editable in project tab; read-only in global calendar.
6. **Other project hidden** — event in project B not shown in project A calendar.
7. **Export** — **Export iCal** → download `.ics`; open in Apple Calendar or import into Google Calendar.

---

## Limitations

- No sync with Google/Outlook subscriptions (one-time export/import only).
- Events do not create or change Tasks.
- Presence checks apply only to the logged-in user.

---

## How to open this guide

- **Web (after deploy):** https://fieldwire.medicalcontractor.ca/CLIENT_CALENDAR_TESTING_GUIDE.html  
- **PDF:** browser **Print** → **Save as PDF**

---

| Version | Note |
|---------|------|
| 1.0 | Initial calendar guide |
| 1.1 | iCal export; Tasks export removed |

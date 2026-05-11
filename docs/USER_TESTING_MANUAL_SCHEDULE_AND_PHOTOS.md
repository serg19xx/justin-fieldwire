# User testing guide — Schedules & photos/files

**For clients (production):** after `./deploy.sh`, the guide is a normal page on the same site —  
`https://fieldwire.medicalcontractor.ca/USER_TESTING_MANUAL_SCHEDULE_AND_PHOTOS.html`  
(replace the host if yours differs). No login required to read it.

**Repo:** canonical copy for the build is **`public/USER_TESTING_MANUAL_SCHEDULE_AND_PHOTOS.html`** (the file under `docs/` is kept in sync for browsing on GitHub).

**Offline / attachment:** send the `.html` file — double‑click opens it in a browser; **Print → Save as PDF** if they need a PDF.

---

Simple checks you can run on **staging** or **production**. Use **two accounts** if possible: a **Project Manager (PM)** and a **worker** who is on the project team.

---

## PM vs Worker — different interfaces

The app uses **different navigation and pages** for PMs and for workers. Do not expect the same menus or layout.

| | **Project Manager (PM)** | **Worker (field user)** |
|---|--------------------------|-------------------------|
| **Main entry** | **My Projects** → open a **project** | **Schedule** (your assignments list) — not the project’s internal schedule grid |
| **Schedule screen** | **Inside the project**: weekly **planner** — all workers, all rows for that project | **Your** list of slots: date, slot, project name, short note — one row per assignment |
| **What you plan** | Pick **worker + day + task + slot**; **save** / **publish** the week | You **do not** build the week; you only **open** rows the PM already published |
| **Slot / day detail** | **Slot assignment** page: worker card, day, slot, long **instructions** textarea, **Save instructions** | **Task** screen for **that day**: read PM text and PM files; set **day status** / notes; **upload completion** files |
| **Uploading files** | **Task setup (PM)** — button **Upload setup doc** on the slot page | **Site & completion photos / files** — **Upload** on the task screen |
| **Seeing the other side’s files** | Sees **Task setup (PM)** and **Task completed (workers)** in two columns | Sees **PM setup** documents (read-only) and own **completion** uploads |
| **Editing / deleting uploads** | Can **Edit** / **Delete** **setup** docs (when allowed) | Can **Edit name** / **Delete** own **completion** docs — **not** PM setup files |

**Short rule:** PM works **inside a project** and **owns the week grid + setup docs**. The worker lives in **My Schedule → task for that day** and **only adds completion evidence**.

---

## A. Schedules **[PM only]**

1. **Open a project** → go to the **Schedule** section (weekly grid).
2. **Pick a week** (change week if the UI allows).
3. **Assign work**
   - Choose a **worker** and a **day**.
   - Pick a **task** and a **slot** (morning / afternoon / all day, if shown).
4. **Save** the week (or row — follow what the screen asks).
5. **Publish** the week when you are ready (workers usually only see **published** weeks on their side).
6. **Open one slot in detail**
   - From the schedule, open the **slot assignment** / plan screen for one row.
   - Type **instructions** for that day and tap **Save instructions**.
7. **Expected**
   - Draft vs published rules match the hints on screen (e.g. you may need to **reopen as draft** to edit after publish).
   - You cannot edit instructions for **past** days until the row is moved to today or a future day (if the app shows that message).

---

## B. Photos & files — PM (“Task setup”) **[PM only]**

**Where:** Project → Schedule → open **slot assignment** → **Documents**.

1. Tap **Upload setup doc** (on small screens it may show as **Upload**).
2. Choose a **small JPG or PNG** → upload should succeed; file appears under **Task setup (PM)**.
3. Choose a **small PDF** → same.
4. Open the file (tap the name) → **preview or download** should work.
5. Use **Edit** / **Delete** on a setup file if you have permission → changes should stick after **reload**.
6. **Negative checks**
   - A **.txt** (or other disallowed type) → should show an error, not upload.
   - A file **over 20 MB** → should show a max-size error.

**Rules shown in the app:** images and **PDF** only; **max 20 MB** per file.

---

## C. Schedules **[Worker only]**

1. Log in as a worker who has **published** assignments.
2. Open **Schedule** (or the menu entry that shows **your** week list).
3. You should see **rows** with date, slot (e.g. Morning), project, and optional short **instructions**.
4. **Tap a row** → opens the **task** screen for that **day and slot**.

**Expected**

- If nothing appears: the week may still be **draft** or this user has **no published** rows.
- Status chip (e.g. Not started / In progress / Completed) may reflect **local** progress on the device — use it only as a quick visual check.

---

## D. Photos & files — Worker (“Task completed”) **[Worker only]**

**Where:** Worker **Schedule** → open a row → **task detail** for that day.

1. In **PM setup**, check that **documents** the PM uploaded are **visible**; tap to open/preview.
2. Scroll to **Site & completion photos / files** (or similar).
3. Tap **Upload** → pick **image or PDF** → confirm upload.
4. Optional **display name** in the dialog should save with the file.
5. **Edit name** / **Delete** should work; after **reload**, the list should match.
6. Same **negative tests** as PM: wrong file type and **> 20 MB** should fail clearly.

---

## E. Quick “smoke” checklist (**PM** + **Worker**)

| Step | Who | Pass? |
|------|-----|--------|
| Can build and **publish** a week | PM | ☐ |
| Sees the assignment **after publish** | Worker | ☐ |
| **Instructions** save and show on worker task screen | PM → Worker | ☐ |
| Can upload **setup** image + PDF | PM | ☐ |
| Can upload **completion** image + PDF | Worker | ☐ |
| Bad type / oversized file **rejected** | Both (separate tests) | ☐ |
| Files still there after **browser refresh** | Both | ☐ |

---

## F. If something fails

Note: **role** (PM vs worker), **project id**, **week start date**, **browser** (and phone vs desktop), and a **screenshot**. For uploads, say whether **PM** or **worker** flow failed and the **approximate file size** and **type** (jpg / pdf / other).

---

## G. Optional test files

Prepare on your device:

- Small **.jpg** / **.png**
- Small **.pdf**
- A **.txt** (should be rejected for slot uploads)
- A **large .pdf** over **20 MB** (should be rejected)

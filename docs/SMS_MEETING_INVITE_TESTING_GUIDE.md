# Client testing guide: Schedule a call via SMS (FieldWire)

For client / QA acceptance testing of **Schedule call via SMS** on production.

## Links

| Format | URL |
|--------|-----|
| **Web (RU)** | https://fieldwire.medicalcontractor.ca/SMS_MEETING_INVITE_TESTING_GUIDE_RU.html |
| **Web (EN)** | https://fieldwire.medicalcontractor.ca/SMS_MEETING_INVITE_TESTING_GUIDE.html |
| **User guide** | https://fieldwire.medicalcontractor.ca/SMS_MEETING_INVITE_USER_GUIDE.html |

---

## 1. What was delivered

| # | Feature | Description |
|---|---------|-------------|
| 1 | Schedule call via SMS | PM sends meeting time options from Clients |
| 2 | PM picks date | Min **3 days** from today; **no one-week cap** |
| 3 | Day schedule grid | **30-min** steps, **9:00 AM–5:00 PM**; busy blocks marked unavailable |
| 4 | PM picks slots | **1 to 3** free slots on the chosen date |
| 5 | Slot hold | Selected slots **held for 3 days** until client reply |
| 6 | Clear SMS | PM name/role, topic, date, duration, time options |
| 7 | Client reply | SMS **1**, **2**, **3** (or **1** / **1 or 2** for fewer slots) |
| 8 | Calendar | Confirmed slot → PM personal calendar event |
| 9 | Dialog status | Pending / Confirmed / Expired |

---

## 2. Prerequisites

- [ ] Admin or Project Manager account
- [ ] Client with phone on record
- [ ] Mobile access to read/reply to SMS
- [ ] PM Calendar: at least one busy block + 3 free slots on test date (≥ today + 3 days)

**URL:** https://fieldwire.medicalcontractor.ca

---

## 3. PM workflow

1. Clients → client with phone → **Schedule call via SMS**
2. Set **Meeting date** (≥ 3 days ahead)
3. Review **Day schedule** grid
4. Select **1–3 available** slots
5. Check **SMS preview** → **Send meeting invite**
6. Client replies by SMS
7. Verify **Calendar** event and **Confirmed** status in dialog

---

## 4. Test checklist

**Tester:** _______________ **Date:** _______________

### Scenario 1 — Full flow (required)

| ☐ | Step | Action | Expected |
|---|------|--------|----------|
| ☐ | 1 | Open Schedule call via SMS | Dialog with date, grid, preview |
| ☐ | 2 | Date = today + 3 days | Schedule loads |
| ☐ | 3 | View grid | 30-min slots 9–17; busy marked |
| ☐ | 4 | Select 3 free slots | selected 3/3; preview updated |
| ☐ | 5 | Send | SMS delivered |
| ☐ | 6 | Read SMS | PM name, date, 3 times, reply instruction |
| ☐ | 7 | Reply **2** | Confirmation SMS |
| ☐ | 8 | PM Calendar | Event at slot 2 time |
| ☐ | 9 | Reopen dialog | Status Confirmed |

### Scenario 2 — Min date (+3 days)

Cannot pick tomorrow; +3 days works.

### Scenario 3 — Change date when busy

Busy date → few slots; another date → enough free slots.

### Scenario 4 — 3-day hold

After send, same slots show **Held for SMS invite** for another client on same date.

### Scenario 5 — 1 or 2 slots

1 slot → «Text back 1»; 2 slots → «1 or 2».

### Scenario 6 — Invalid reply

Reply **hello** → prompt; then valid digit → confirm.

### Scenario 7 — Calendar overlap

Event 11:00–11:30 → 11:00 slot unavailable.

### Scenario 8 — No phone on client

Action unavailable or send error.

### Scenario 9 — Roles

Worker: no access. PM/Admin: access.

---

## 5. Sign-off

| Criterion | Pass / Fail |
|-----------|-------------|
| Full flow | ☐ |
| Date + grid + hold | ☐ |
| SMS + reply | ☐ |
| Calendar | ☐ |

**Comments:** _______________

**Signature:** _______________ **Date:** _______________

---

## Document history

| Version | Changes |
|---------|---------|
| 2.0 | PM date + grid + 1–3 slots + 3-day hold; client testing guide |
| 1.0 | Initial SMS meeting invite |

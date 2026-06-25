# User guide: Schedule a call via SMS (FieldWire)

A Project Manager sends the client an SMS with three time slots; the client replies **1**, **2**, or **3** — a calendar event is created automatically for the PM.

## How to open this guide

- **Web (after deploy):** https://fieldwire.medicalcontractor.ca/SMS_MEETING_INVITE_USER_GUIDE.html
- **Russian version:** https://fieldwire.medicalcontractor.ca/SMS_MEETING_INVITE_USER_GUIDE_RU.html
- **From the app:** Clients → any list → **Schedule call via SMS guide** in the page header.

## What was delivered and why

| Feature | Purpose |
|---------|---------|
| **Schedule call via SMS** in Clients | PM offers three call times without manual back-and-forth |
| **Clear SMS wording** | Client sees who is contacting them (PM name and role), topic, date, duration, and three options |
| **Reply 1 / 2 / 3** | Client picks a slot with a normal SMS reply |
| **Automatic calendar** | Confirmed slot creates a personal event in the PM’s **Calendar** |
| **Status in the dialog** | PM can see pending, confirmed, or expired invites |

This complements existing **SMS, Email, and Fax** from Clients (see the separate communications guide).

## Who can use it

| Role | Access |
|------|--------|
| Administrator | Yes |
| Project Manager | Yes |
| Other roles | No |

## Where to find it

1. Sign in as **Admin** or **Project Manager**.
2. Open **Clients** → choose a list (Pharmacies, Physicians & Providers, Pharmacists, Medical clinics).
3. For a client with a phone number, use **Schedule call via SMS** (row action).
4. Fill in the form and click **Send meeting invite**.

**Note:** the client record must include a **mobile or office phone** (for physicians: cell or office phone).

## How it works

```
PM → FieldWire → SMS to client (3 slots)
Client → SMS reply: 1, 2, or 3
FieldWire → PM Calendar event + confirmation SMS to client
```

1. PM picks date, three times, duration, and call title.
2. The server sends SMS via **Twilio** to the number on the client record.
3. The client replies with **1**, **2**, or **3** from the **same phone** that received the invite.
4. The system creates a calendar event for the **sending PM** and sends a short confirmation SMS.

Invites expire after **72 hours**. A new invite to the same client cancels any previous pending invite.

## Sample invite SMS

```
FieldWire — meeting request

Hi Dr. Smith,

Jane Doe (Project Manager) would like to schedule a call with you.

Topic: Call with Dr. Smith
Date: Jun 22, 2026 (30 min)

Reply with your preferred time:
1) 10 AM
2) 2 PM
3) 3:30 PM

Text back 1, 2, or 3.
```

## Sample confirmation SMS

After reply **2**:

```
FieldWire — confirmed

Thank you, Dr. Smith!

Call with Dr. Smith
Jun 22, 2026 at 2 PM

— Jane Doe, Project Manager
```

## Steps for Project Manager

1. Clients → pick a client **with a phone number**.
2. **Schedule call via SMS**.
3. Review **Meeting title** (default: “Call with …”).
4. Set **Meeting date** and **Slot 1–3**.
5. Adjust **Duration** if needed (default 30 minutes).
6. Check **SMS preview** — it matches the outgoing message.
7. **Send meeting invite**.
8. Wait for the client reply or reopen the dialog to see status.
9. Open **Calendar** — event should appear at the chosen time.

## Testing checklist (client / QA)

### Scenario A — full flow (recommended)

**Setup:** PM login on https://fieldwire.medicalcontractor.ca; client with a real mobile you can read and reply from.

| Step | Action | Expected |
|------|--------|----------|
| 1 | Clients → client with phone → Schedule call via SMS | Form opens with SMS preview |
| 2 | Tomorrow’s date, slots 10:00 / 14:00 / 15:30, Send | Success notice; SMS on client phone |
| 3 | Read SMS | PM name, topic, date, 3 slots, “Text back 1, 2, or 3” |
| 4 | Reply **2** | Confirmation SMS with slot 2 date/time |
| 5 | PM Calendar | New event at 14:00 (30 min) |
| 6 | Reopen dialog for same client | Status **Confirmed: slot 2 …** |

### Scenario B — invalid reply

Reply **hello** → prompt to use 1, 2, or 3; then **2** → confirm + calendar event.

### Scenario C — no phone on record

Client without phone → action unavailable or “no phone number on file”.

### Scenario D — find clients with phones

Clients → **Filter: Phone** → **Has value**.

## Related features

| Feature | Relation |
|---------|----------|
| **Clients SMS** | Plain text SMS; meeting invite is a separate calendar workflow |
| **Calendar** | Confirmed slot → PM personal event |
| **Twilio** | Outbound SMS + inbound replies (webhook on API) |

## Technical notes (IT)

- **API:** `POST .../send-meeting-invite`, webhook `POST /api/v1/twilio/sms/inbound`
- **SMS provider:** Twilio (production sender number configured)
- **Production mode:** SMS go to **real numbers** on client records
- **Default timezone:** America/Toronto

## Troubleshooting

| Issue | Check |
|-------|--------|
| “Failed to send SMS” | Phone on record; Twilio account; valid number |
| SMS received, reply ignored | Reply from **same phone**; use **1**, **2**, or **3** only |
| No calendar event | Same PM who sent invite; refresh Calendar |
| “No active meeting request” | Expired (72 h) or replaced by newer invite |
| No row action | PM/Admin role; client needs a phone |

## Document history

| Version | Changes |
|---------|---------|
| 1.0 | SMS meeting slots, reply 1/2/3, PM calendar, improved SMS text |

# Client guide: SMS, Email & Fax from Clients (FieldWire)

Send operational messages to pharmacies, physicians, pharmacists, and medical clinics directly from the **Clients** registry — without leaving FieldWire.

## How to open this guide

- **Web (after deploy):** https://fieldwire.medicalcontractor.ca/CLIENT_COMMUNICATIONS_USER_GUIDE.html
- **Russian version:** https://fieldwire.medicalcontractor.ca/CLIENT_COMMUNICATIONS_USER_GUIDE_RU.html
- **From the app:** on any Clients list page, open **SMS, Email & Fax guide** in the page header (opens in a new tab).

## Who can use this

| Role | Access |
|------|--------|
| Administrator | Yes |
| Project Manager | Yes |
| Other roles | No — Clients menu and send actions are hidden |

## Where to find it

1. Sign in to FieldWire.
2. Open **Clients** in the main menu.
3. Choose a list: **Pharmacies**, **Physicians & Providers**, **Pharmacists**, or **Medical clinics**.
4. Use the action icons on each row (SMS, email, fax) or select multiple rows for bulk SMS/email.

## Channels at a glance

| Channel | Lists | Single send | Bulk send | Notes |
|---------|-------|-------------|-----------|-------|
| **SMS** | Pharmacies, Physicians, Pharmacists | Yes | Yes | Plain text only, max 1600 characters |
| **Email** | All four lists | Yes | Yes | Free-form letter or SendGrid template |
| **Fax** | Pharmacies, Physicians, Medical clinics | Yes | No | PDF/image up to 50 MB + optional cover page |

Pharmacists list supports **SMS and email only** (no fax column).

## SMS

1. Click the green **SMS** icon on a row (uses the client phone on file).
2. Type your message (character counter shown; long texts may use multiple SMS segments).
3. Click **Send SMS**.

**Bulk:** select two or more rows → **Send SMS** in the selection bar. Clients without a phone number are skipped; the result shows how many were sent and how many failed.

## Email

1. Click the blue **email** icon on a row.
2. Choose **Email format**:
   - **Free form letter** — enter subject and message yourself.
   - **SendGrid template** — pick an active template from the dropdown; subject and layout come from SendGrid. Client name is passed automatically; you can add an optional note if the template supports it.
3. Click **Send Email**.

**Bulk:** same as SMS — multi-select rows, then **Send Email**. Clients without email are skipped.

## Fax

1. Click the fax icon on a row (uses the fax number on file).
2. Optionally fill **Subject** and **Cover text** (cover page).
3. Attach a **Fax document**: PDF or image (JPEG, PNG, GIF, TIFF, BMP, WebP), maximum **50 MB**.
4. Click **Send Fax**. Large files may take up to a minute while the document is uploaded and processed.

You need **either** cover text **or** an attachment (or both). Bulk fax is not supported — send one client at a time.

## Contact filter

Use **Filter: Phone / Email / Fax** with **Has value** or **Empty** to find clients you can (or cannot) reach on a given channel before sending.

## Export CSV

**Export CSV** downloads the current list (respecting filters and search) for mail-merge or offline review. **Load from CSV** is not implemented yet.

## How it is implemented (overview)

FieldWire does **not** send messages from the browser directly. The web app calls the FieldWire API; the API validates your role, reads the client record, and sends through external providers configured on the server:

| Channel | Provider | What the server uses |
|---------|----------|----------------------|
| Email | [SendGrid](https://sendgrid.com/) | API key, verified sender; optional dynamic templates |
| SMS | [Twilio](https://www.twilio.com/) | Account SID, auth token, outbound phone number |
| Fax | [HumbleFax](https://www.humblefax.com/) | API keys, caller ID, cover sheet + document upload |

Credentials live **only on the API server** (never in the frontend). The UI shows the destination number or address from the client record before you send.

## Tips & troubleshooting

| Issue | What to check |
|-------|----------------|
| Send button missing | Your role must be Admin or Project Manager |
| “Client has no phone/email/fax” | Update the client record or use the contact filter |
| Email templates empty | SendGrid must be configured; templates must be active in the same SendGrid account |
| Fax slow or “Sending…” long | Normal for multi‑MB files; wait up to ~1 minute |
| Fax file too large | Maximum 50 MB; compress PDF or resize images if needed |

For technical/API details, developers use the backend repository and `ClientCommunicationController` endpoints under `/api/v1/clients/{type}/{id}/send-sms`, `send-email`, and `send-fax`.

## Document history

| Version | Notes |
|---------|--------|
| 1.0 | Initial guide: Clients SMS, email (SendGrid templates), fax (HumbleFax) |

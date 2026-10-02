# JFW Outreach — one wave per Start (n8n)

## Product behavior
- UI **Start wave**: queues at most **N** contacts (max 50), not the full list.
- After the wave is sent, API sets campaign to **paused** automatically.
- **Send next wave** enqueues the next N unsent contacts and fires the webhook again.

## Email modes (`email_mode`)
| Mode | UI | n8n SendGrid |
|------|----|--------------|
| `custom` | Subject + Body required | HTML content = `={{$json.email_body}}` (API wraps Header+Body+Footer), Subject = `={{$json.email_subject}}`. Set **custom_args** from `={{$json.custom_args}}`. |
| `sendgrid_full` | Template only | Dynamic Template ID = `={{$json.sendgrid_template_id}}`, data = `={{$json.template_data}}` |
| `sendgrid_body` | Template + Body (+ Subject) | Same Dynamic Template; `template_data.body` / `{{{body}}}` in SendGrid |

## n8n rules (important)
1. **Do NOT loop** Claim Next Batch → Has Recipients. One webhook = one claim = send = Mark Sent = Done.
2. After Aggregate / last Mark Sent, optional: `POST .../campaigns/{id}/pause` (API also auto-pauses when queued becomes 0).
3. SMS body: `={{$json.sms_body}}`. Keywords YES / DECLINE / STOP are handled by API Twilio webhook.
4. Pass custom_args so SendGrid Event Webhook can map unsubscribe → recipient.

## Expire / no_response
Hourly (or cron) call:
`POST https://fwapi.medicalcontractor.ca/api/v1/outreach/expire-waiting-all`
Header `X-Outreach-Secret: …`

## SendGrid Event Webhook
URL: `https://fwapi.medicalcontractor.ca/api/v1/sendgrid/events?secret=OUTREACH_N8N_SECRET`
Enable: **unsubscribe**, **group_unsubscribe**, **spam report**.

## Unsubscribe link
Public: `GET /api/v1/outreach/unsubscribe?token=…` (embedded in custom email footer).

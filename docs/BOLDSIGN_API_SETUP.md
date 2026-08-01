# BoldSign e-signature — basic API integration

## Status

Scaffold is in place. **No API key required to deploy** — endpoints stay in “not configured” mode until `BOLDSIGN_API_KEY` is set.

## What was added (API)

| Piece | Path |
|--------|------|
| Service | `src/Services/BoldSignService.php` |
| Controller | `src/Controllers/BoldSignController.php` |
| Routes | `/api/v1/esign/*` in `ApiRoutes.php` |
| DB table | `scripts/create-esign-envelopes-table.sql` → `fw_esign_envelopes` |
| Env | `BOLDSIGN_*` in `env.example` |

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/api/v1/esign/status` | JWT | Configured? Sandbox? Optional live ping |
| `POST` | `/api/v1/esign/send` | JWT | Send PDF (base64) to one signer |
| `GET` | `/api/v1/esign/envelopes` | JWT | List local envelopes (`?project_id=`) |
| `GET` | `/api/v1/esign/envelopes/:id` | JWT | Local row + sync properties from BoldSign |
| `POST` | `/api/v1/esign/webhook` | None (HMAC) | BoldSign status webhooks |

### Example send body

```json
{
  "title": "Change order #12",
  "signer_name": "Jane Client",
  "signer_email": "jane@example.com",
  "project_id": 63,
  "message": "Please sign this change order.",
  "file_name": "change-order.pdf",
  "file_base64": "<base64 PDF bytes>"
}
```

Without `BOLDSIGN_API_KEY`, `POST /send` returns **503** with a clear message.

## When keys arrive (sandbox)

1. Create free API sandbox: https://account.boldsign.com/signup?planId=1076  
2. In BoldSign dashboard → API → copy **API key**  
3. Set on the API server `.env`:

```env
BOLDSIGN_API_KEY=your_sandbox_key
BOLDSIGN_API_BASE_URL=https://api.boldsign.com
BOLDSIGN_SANDBOX=1
BOLDSIGN_WEBHOOK_SECRET=your_webhook_secret
BOLDSIGN_SKIP_WEBHOOK_SIGNATURE=0
```

4. Run SQL: `scripts/create-esign-envelopes-table.sql`  
5. Point BoldSign webhook to:  
   `https://fwapi.medicalcontractor.ca/api/v1/esign/webhook`  
6. Check: `GET /api/v1/esign/status` → `ready: true`

Sandbox documents are watermarked and auto-deleted by BoldSign after a short period — expected.

## Not in this scaffold (later)

- UI “Send for signature” button  
- Download signed PDF into project storage  
- Embedded signing iframe  
- Multi-signer / templates / text tags  

Wait for customer answers next week before wiring product UI.

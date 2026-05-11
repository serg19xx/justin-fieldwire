# Schedule Slot Documents: Production Checklist

This checklist defines the required backend contract and verification steps for slot document uploads used by project managers.

## 1) File size validation (required)

- Enforce max upload size: `20 MB`
- Apply validation on backend for all upload flows, regardless of frontend checks
- Recommended error response:

```json
{
  "message": "File is too large. Maximum allowed size is 20 MB."
}
```

## 2) Unified API error shape (required)

For all schedule slot documents endpoints, return a consistent error payload:

```json
{
  "message": "Human-readable error message"
}
```

Recommended statuses:

- `400/422` for validation errors
- `403` for permission errors
- `404` for not found resources
- `500` for unexpected server errors (with safe generic message)

## 3) Optional: delete endpoint for setup documents

Add endpoint if PM must replace or remove setup files:

- `DELETE /api/v1/projects/:projectId/schedule-entries/:scheduleEntryId/documents/:documentId`

Expected response:

```json
{
  "message": "Document deleted successfully."
}
```

Rules:

- Document must belong to `projectId` and `scheduleEntryId`
- Only authorized PM/admin users can delete setup files

## 4) Minimal smoke test (required before release)

Test on real environment with authenticated PM user:

1. Upload `.jpg` (or `.png`) to `setup` bucket -> `201` and file appears in list
2. Upload `.pdf` to `setup` bucket -> `201` and file appears in list
3. Upload disallowed file type (for example `.txt`) -> validation error with `message`
4. Upload file larger than 20 MB -> validation error with `message`
5. Reload page -> previously uploaded files are still returned by GET endpoint

Pass criteria:

- All successful uploads are visible without manual refresh hacks
- Error messages are user-readable and mapped to frontend UI from `message`

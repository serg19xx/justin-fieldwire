# Schedule Slot Documents Smoke Test

Use this checklist after backend/frontend deploys for slot documents.

## Preconditions

- Authenticated as project manager or admin
- Schedule week is in `draft` status
- You are on the slot assignment edit page

## Test files

- `test-image.jpg` (small image)
- `test-doc.pdf` (small PDF)
- `test-invalid.txt` (disallowed type)
- `test-large.pdf` (> 20 MB)

## Scenarios

### 1. Upload image

1. Click `Upload setup doc`
2. Select `test-image.jpg`
3. Verify success message is shown
4. Verify file appears under `Task setup (PM)`
5. Reload page and verify file is still present

Expected: upload succeeds, file persists after reload.

### 2. Upload PDF

1. Click `Upload setup doc`
2. Select `test-doc.pdf`
3. Verify success message is shown
4. Verify file appears in list
5. Reload page and verify file is still present

Expected: upload succeeds, file persists after reload.

### 3. Upload disallowed type

1. Click `Upload setup doc`
2. Select `test-invalid.txt`
3. Verify error message appears

Expected: upload is blocked with clear message.

### 4. Upload oversized file

1. Click `Upload setup doc`
2. Select `test-large.pdf`
3. Verify error message appears

Expected: upload is blocked with max-size message (`20 MB`).

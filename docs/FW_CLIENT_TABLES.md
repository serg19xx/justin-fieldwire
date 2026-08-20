# FW client tables migration spec

## Goal

Keep the existing clients API contract unchanged while moving physical storage
from legacy tables to isolated `fw_*` copies:

- `pharma` -> `fw_pharma`
- `physician` -> `fw_physician`
- `pharmacist` -> `fw_pharmacist`
- `medical_clinic` -> `fw_medical_clinic`

## API contract (must stay unchanged)

- Keep existing endpoints and response shapes:
  - `GET/POST/PUT/DELETE /api/v1/pharmacies`
  - `GET/POST/PUT/DELETE /api/v1/physicians`
  - `GET/POST/PUT/DELETE /api/v1/pharmacists`
  - `GET/POST/PUT/DELETE /api/v1/medical-clinics`
- Keep logical values in project payloads:
  - `client_table` remains `pharma | physician | pharmacist | medical_clinic`

Only storage adapters/repositories change internally to `fw_*` tables.

## Applied SQL artifacts

1. `migrations/copy_legacy_clients_to_fw.sql`
   - Creates `fw_*` tables from legacy schema.
   - Copies all rows from legacy tables.
   - Re-points `fw_pharmacist.pharmId` foreign key to `fw_pharma.id`.

2. `migrations/cleanup_fw_client_leads.sql`
   - Removes rows with no verifiable contact channel.
   - Normalizes orphan references by setting `fw_pharmacist.pharmId = NULL`
     when parent pharmacy was removed.
   - Produces report `source_total / fw_total_after_cleanup / deleted_from_fw`.

3. `migrations/optimize_fw_client_leads.sql`
   - Trims and normalizes contact/name fields in `fw_*` only.
   - Removes rows with invalid email syntax and no phone/fax fallback (10+ digits).
   - Deduplicates by normalized email (keeps lowest `id`).
   - Adds list/filter indexes for Clients UI queries.
   - Produces report `rows_before_optimize / rows_after_optimize / removed_during_optimize`.

4. `migrations/add_fw_client_verification_columns.sql` (+ `*_remaining.sql` if needed)
   - Adds `email_quality`, `phone_quality`, `contact_quality`, `last_verified_at` to all `fw_*` tables.

5. `migrations/fill_fw_client_verification_quality.sql`
   - Sets quality flags: `valid` / `partial` / `invalid` / `empty`.
   - Produces contact_quality report per table.

6. `migrations/add_fw_pharmacist_geo_columns.sql`
   - Adds `country`, `region`, `fullAddress` to `fw_pharmacist`.
   - Defaults: Canada / Ontario / NULL address.

7. `migrations/create_fw_client_leads_gta.sql`
   - Creates unified `fw_client_leads` from all 4 `fw_*` tables.
   - Includes only `contact_quality = valid` and GTA/Toronto metro filter.
   - Carries `specialty` (physician) and `clinic_type` (medical clinic).
   - Sets `lead_status = new`, `target_market = gta_toronto`.

## Cleanup criteria used in fw_* copies

Rows are removed when they have no usable contact channel:

- `fw_pharma`: no `email`, `phone`, `cell`, `fax`, `twilioPhone`
- `fw_physician`: no `email`, `cellPhone`, `officePhone`, `faxNumber`
- `fw_pharmacist`: no `email`, `cell_phone`
- `fw_medical_clinic`: no `email`, `phone`, `fax`

The following placeholders are treated as empty (case-insensitive):
`''`, `n/a`, `na`, `-`, `.`, `none`, `noemail`, `unknown`.

## Rollback strategy

Because legacy tables are untouched, rollback is immediate:

1. Point repositories back to legacy tables.
2. Re-run copy migration if a fresh fw_* snapshot is needed.

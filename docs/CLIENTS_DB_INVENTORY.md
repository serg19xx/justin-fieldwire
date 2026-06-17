# Clients database inventory (read-only reference)

**Purpose:** UI design reference for the new **Clients** section.  
**Source:** existing PHP controllers + legacy `contacts-api` types (tables are populated in production).  
**Note:** Confirm column types with `SHOW CREATE TABLE` when you share the official schema — this list reflects what the API currently selects.

---

## Project linkage (`fw_projects`)

Projects reference clients without duplicating full records:

| Column | Type (migration) | Purpose |
|--------|------------------|---------|
| `client_id` | BIGINT UNSIGNED NULL | FK to row in client table |
| `client_type` | VARCHAR(100) NULL | Display label, e.g. "Pharmacies" |
| `client_table` | ENUM(`pharma`,`physician`,`pharmacist`,`medical_clinic`) | Which table `client_id` points to |
| `client_data` | JSON NULL | Snapshot of client `data` at link time |
| `client2_id` | BIGINT UNSIGNED NULL | Secondary client |
| `client2_type` | VARCHAR(100) NULL | Secondary label |
| `client2_table` | ENUM incl. `patient`,`driver`, … | Secondary table |
| `client2_name` | VARCHAR(250) NULL | Denormalized name |
| `client2_data` | LONGTEXT NULL | Secondary JSON snapshot |

**UI implication:** project client picker (`ClientSelectorDialog`) uses unified read API `GET /api/v1/clients/{table}`. Full CRUD UI will use legacy per-type APIs until a new unified API exists.

---

## Client registry (UI types)

| UI key | DB table | List API (existing) | Name field | In project `client_table` |
|--------|----------|---------------------|------------|---------------------------|
| `pharma` | `pharma` | `GET /api/v1/pharmacies` | `operName` | yes |
| `physician` | `physician` | `GET /api/v1/physicians` | `fullName` | yes |
| `pharmacist` | `pharmacist` | `GET /api/v1/pharmacists` | `fullName` | yes |
| `medical_clinic` | `medical_clinic` | `GET /api/v1/medical-clinics` | `clinicName` | yes |

**Not in Clients UI:** `driver`, `patient` (legacy `client2_table` enum values only).

---

## Table: `pharma` (Pharmacies)

| Column | Typical use in UI |
|--------|-------------------|
| `id` | PK |
| `operName` | Primary name (required on create) |
| `legalName` | Legal entity |
| `contact` | Contact person |
| `owner`, `manager` | People |
| `unitNumb`, `street`, `city`, `region`, `country`, `postcode` | Address parts |
| `fullAddress` | Formatted address |
| `phone`, `cell`, `email`, `fax`, `twilioPhone` | Communications |
| `lat`, `lng` | Map |
| `no-centrals`, `otpFee`, `marketingFee`, `sub_type`, `comp_volumes`, `sales_cycle` | Business fields |
| `notes` | Free text |
| `login` | Required on create (backend) |

**Filters:** `country`, `region`  
**CRUD:** `POST/PUT/DELETE /api/v1/pharmacies`

---

## Table: `physician` (Physicians & Providers)

| Column | Typical use in UI |
|--------|-------------------|
| `id` | PK |
| `prefTitle`, `fullName` | Name |
| `company`, `specialty` | Professional |
| `cellPhone`, `officePhone`, `email`, `faxNumber` | Communications |
| `fullAddress`, `unitNumb`, `streetNumber`, `city`, `region`, `country`, `postal` | Address |
| `lat`, `lng` | Map |
| `notes` | Free text |

**Filters:** `country`, `region`, `specialty`  
**CRUD:** `POST/PUT/DELETE /api/v1/physicians`

---

## Table: `pharmacist` (Pharmacists)

| Column | Typical use in UI |
|--------|-------------------|
| `id` | PK |
| `pharmId` | FK → `pharma.id` |
| `fullName` | Name (required on create) |
| `reg_number`, `pharm_owned`, `workplace` | Professional |
| `cell_phone`, `email` | Communications |
| `notes` | Free text |
| `operName` | Joined from `pharma` in list |

**Filters:** `country`, `region` (via pharmacy join)  
**CRUD:** `POST/PUT/DELETE /api/v1/pharmacists`

---

## Table: `medical_clinic` (Medical clinics)

| Column | Typical use in UI |
|--------|-------------------|
| `id` | PK |
| `clinicName`, `clinicType` | Identity |
| `contactName` | Contact |
| `phone`, `fax`, `email` | Communications |
| `unitNumb`, `streetName`, `city`, `region`, `country`, `postal` | Address |
| `fullAddress`, `geoAddress`, `geoCoordinates` | Geo |
| `notes` | Free text |

**Filters:** `country`, `region`, `clinicType`  
**CRUD:** `POST/PUT/DELETE /api/v1/medical-clinics`

---

## Table: `driver` (legacy — not in Clients UI)

Exists in DB and API (`GET /api/v1/drivers`) but **excluded** from the Clients section. UI shows four categories only: Pharmacies, Physicians & Providers, Pharmacists, Medical Clinics.

---

## Unified read API (project picker)

`GET /api/v1/clients/{clientTable}` — search + pagination  
`GET /api/v1/clients/{clientTable}/{id}` — single record as `{ id, name, data: {...} }`

Supported `clientTable`: `pharma`, `physician`, `pharmacist`, `medical_clinic` only.

---

## Planned UI actions (per row)

| Action | Phase | Notes |
|--------|-------|-------|
| View | 1 | Read-only detail drawer |
| Edit | 2 | Uses existing PUT endpoints |
| Delete | 2 | Confirm + DELETE |
| Send email | 3 | `mailto:` or template integration |
| Send SMS | 3 | Twilio / message templates |
| Fax | 3 | Display `fax` field + future send |

---

## Open questions (fill when schema provided)

- [ ] Full `SHOW CREATE TABLE` for each table
- [ ] Are `patient` / `clinic` tables still in DB?
- [ ] Indexes and soft-delete columns?
- [ ] Auth: which roles may edit clients vs view only?

**Document version:** 1.0 — UI planning skeleton

-- Cleanup lead tables copied to fw_* namespace.
-- Rule: remove records that cannot be verified because there is no usable contact channel.

DROP TEMPORARY TABLE IF EXISTS `tmp_fw_clients_before`;
CREATE TEMPORARY TABLE `tmp_fw_clients_before` (
  `table_name` VARCHAR(64) NOT NULL,
  `total_rows` BIGINT NOT NULL
);

INSERT INTO `tmp_fw_clients_before` (`table_name`, `total_rows`)
SELECT 'fw_pharma', COUNT(*) FROM `fw_pharma`
UNION ALL
SELECT 'fw_physician', COUNT(*) FROM `fw_physician`
UNION ALL
SELECT 'fw_pharmacist', COUNT(*) FROM `fw_pharmacist`
UNION ALL
SELECT 'fw_medical_clinic', COUNT(*) FROM `fw_medical_clinic`;

-- 1) Pharmacists first (depends on pharmacy).
DELETE FROM `fw_pharmacist`
WHERE
  LOWER(TRIM(COALESCE(`email`, ''))) IN ('', 'n/a', 'na', '-', '.', 'none', 'noemail', 'unknown')
  AND LOWER(TRIM(COALESCE(`cell_phone`, ''))) IN ('', 'n/a', 'na', '-', '.', 'none', 'unknown');

-- 2) Pharmacies.
DELETE FROM `fw_pharma`
WHERE
  LOWER(TRIM(COALESCE(`email`, ''))) IN ('', 'n/a', 'na', '-', '.', 'none', 'noemail', 'unknown')
  AND LOWER(TRIM(COALESCE(`phone`, ''))) IN ('', 'n/a', 'na', '-', '.', 'none', 'unknown')
  AND LOWER(TRIM(COALESCE(`cell`, ''))) IN ('', 'n/a', 'na', '-', '.', 'none', 'unknown')
  AND LOWER(TRIM(COALESCE(`fax`, ''))) IN ('', 'n/a', 'na', '-', '.', 'none', 'unknown')
  AND LOWER(TRIM(COALESCE(`twilioPhone`, ''))) IN ('', 'n/a', 'na', '-', '.', 'none', 'unknown');

-- Keep pharmacist rows even if the parent pharmacy was removed.
UPDATE `fw_pharmacist` p
LEFT JOIN `fw_pharma` ph ON ph.`id` = p.`pharmId`
SET p.`pharmId` = NULL
WHERE p.`pharmId` IS NOT NULL AND ph.`id` IS NULL;

-- 3) Physicians.
DELETE FROM `fw_physician`
WHERE
  LOWER(TRIM(COALESCE(`email`, ''))) IN ('', 'n/a', 'na', '-', '.', 'none', 'noemail', 'unknown')
  AND LOWER(TRIM(COALESCE(`cellPhone`, ''))) IN ('', 'n/a', 'na', '-', '.', 'none', 'unknown')
  AND LOWER(TRIM(COALESCE(`officePhone`, ''))) IN ('', 'n/a', 'na', '-', '.', 'none', 'unknown')
  AND LOWER(TRIM(COALESCE(`faxNumber`, ''))) IN ('', 'n/a', 'na', '-', '.', 'none', 'unknown');

-- 4) Medical clinics.
DELETE FROM `fw_medical_clinic`
WHERE
  LOWER(TRIM(COALESCE(`email`, ''))) IN ('', 'n/a', 'na', '-', '.', 'none', 'noemail', 'unknown')
  AND LOWER(TRIM(COALESCE(`phone`, ''))) IN ('', 'n/a', 'na', '-', '.', 'none', 'unknown')
  AND LOWER(TRIM(COALESCE(`fax`, ''))) IN ('', 'n/a', 'na', '-', '.', 'none', 'unknown');

-- Optional stricter pass: delete rows with placeholder names and no usable contacts.
DELETE FROM `fw_pharma`
WHERE
  LOWER(TRIM(COALESCE(`operName`, ''))) IN ('', 'n/a', 'na', '-', '.', 'none', 'unknown')
  AND LOWER(TRIM(COALESCE(`legalName`, ''))) IN ('', 'n/a', 'na', '-', '.', 'none', 'unknown')
  AND LOWER(TRIM(COALESCE(`email`, ''))) IN ('', 'n/a', 'na', '-', '.', 'none', 'noemail', 'unknown')
  AND LOWER(TRIM(COALESCE(`phone`, ''))) IN ('', 'n/a', 'na', '-', '.', 'none', 'unknown')
  AND LOWER(TRIM(COALESCE(`cell`, ''))) IN ('', 'n/a', 'na', '-', '.', 'none', 'unknown')
  AND LOWER(TRIM(COALESCE(`fax`, ''))) IN ('', 'n/a', 'na', '-', '.', 'none', 'unknown')
  AND LOWER(TRIM(COALESCE(`twilioPhone`, ''))) IN ('', 'n/a', 'na', '-', '.', 'none', 'unknown');

DELETE FROM `fw_physician`
WHERE
  LOWER(TRIM(COALESCE(`fullName`, ''))) IN ('', 'n/a', 'na', '-', '.', 'none', 'unknown')
  AND LOWER(TRIM(COALESCE(`email`, ''))) IN ('', 'n/a', 'na', '-', '.', 'none', 'noemail', 'unknown')
  AND LOWER(TRIM(COALESCE(`cellPhone`, ''))) IN ('', 'n/a', 'na', '-', '.', 'none', 'unknown')
  AND LOWER(TRIM(COALESCE(`officePhone`, ''))) IN ('', 'n/a', 'na', '-', '.', 'none', 'unknown')
  AND LOWER(TRIM(COALESCE(`faxNumber`, ''))) IN ('', 'n/a', 'na', '-', '.', 'none', 'unknown');

DELETE FROM `fw_pharmacist`
WHERE
  LOWER(TRIM(COALESCE(`fullName`, ''))) IN ('', 'n/a', 'na', '-', '.', 'none', 'unknown')
  AND LOWER(TRIM(COALESCE(`email`, ''))) IN ('', 'n/a', 'na', '-', '.', 'none', 'noemail', 'unknown')
  AND LOWER(TRIM(COALESCE(`cell_phone`, ''))) IN ('', 'n/a', 'na', '-', '.', 'none', 'unknown');

DELETE FROM `fw_medical_clinic`
WHERE
  LOWER(TRIM(COALESCE(`clinicName`, ''))) IN ('', 'n/a', 'na', '-', '.', 'none', 'unknown')
  AND LOWER(TRIM(COALESCE(`email`, ''))) IN ('', 'n/a', 'na', '-', '.', 'none', 'noemail', 'unknown')
  AND LOWER(TRIM(COALESCE(`phone`, ''))) IN ('', 'n/a', 'na', '-', '.', 'none', 'unknown')
  AND LOWER(TRIM(COALESCE(`fax`, ''))) IN ('', 'n/a', 'na', '-', '.', 'none', 'unknown');

-- Report: original vs fw_* after cleanup.
SELECT
  'pharma' AS source_table,
  (SELECT COUNT(*) FROM `pharma`) AS source_total,
  (SELECT COUNT(*) FROM `fw_pharma`) AS fw_total_after_cleanup,
  b.`total_rows` - (SELECT COUNT(*) FROM `fw_pharma`) AS deleted_from_fw
FROM `tmp_fw_clients_before` b
WHERE b.`table_name` = 'fw_pharma'
UNION ALL
SELECT
  'physician',
  (SELECT COUNT(*) FROM `physician`),
  (SELECT COUNT(*) FROM `fw_physician`),
  b.`total_rows` - (SELECT COUNT(*) FROM `fw_physician`)
FROM `tmp_fw_clients_before` b
WHERE b.`table_name` = 'fw_physician'
UNION ALL
SELECT
  'pharmacist',
  (SELECT COUNT(*) FROM `pharmacist`),
  (SELECT COUNT(*) FROM `fw_pharmacist`),
  b.`total_rows` - (SELECT COUNT(*) FROM `fw_pharmacist`)
FROM `tmp_fw_clients_before` b
WHERE b.`table_name` = 'fw_pharmacist'
UNION ALL
SELECT
  'medical_clinic',
  (SELECT COUNT(*) FROM `medical_clinic`),
  (SELECT COUNT(*) FROM `fw_medical_clinic`),
  b.`total_rows` - (SELECT COUNT(*) FROM `fw_medical_clinic`)
FROM `tmp_fw_clients_before` b
WHERE b.`table_name` = 'fw_medical_clinic';

DROP TEMPORARY TABLE IF EXISTS `tmp_fw_clients_before`;

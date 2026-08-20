-- Fill verification quality columns in fw_* client tables (step 2).
-- Prerequisite: add_fw_client_verification_columns*.sql

-- ---------------------------------------------------------------------------
-- fw_pharma
-- ---------------------------------------------------------------------------

UPDATE `fw_pharma`
SET
  `email_quality` = CASE
    WHEN TRIM(COALESCE(`email`, '')) = '' THEN 'empty'
    WHEN LOWER(TRIM(`email`)) IN ('n/a', 'na', '-', '.', 'none', 'noemail', 'unknown') THEN 'empty'
    WHEN `email` REGEXP '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+$' THEN 'valid'
    ELSE 'invalid'
  END,
  `phone_quality` = CASE
    WHEN GREATEST(
      LENGTH(REGEXP_REPLACE(COALESCE(`phone`, ''), '[^0-9]', '')),
      LENGTH(REGEXP_REPLACE(COALESCE(`cell`, ''), '[^0-9]', '')),
      LENGTH(REGEXP_REPLACE(COALESCE(`fax`, ''), '[^0-9]', '')),
      LENGTH(REGEXP_REPLACE(COALESCE(`twilioPhone`, ''), '[^0-9]', ''))
    ) >= 10 THEN 'valid'
    WHEN TRIM(COALESCE(`phone`, '')) <> ''
      OR TRIM(COALESCE(`cell`, '')) <> ''
      OR TRIM(COALESCE(`fax`, '')) <> ''
      OR TRIM(COALESCE(`twilioPhone`, '')) <> '' THEN 'invalid'
    ELSE 'empty'
  END;

UPDATE `fw_pharma`
SET
  `contact_quality` = CASE
    WHEN `email_quality` = 'valid' OR `phone_quality` = 'valid' THEN 'valid'
    WHEN `email_quality` = 'invalid' OR `phone_quality` = 'invalid' THEN 'partial'
    ELSE 'invalid'
  END,
  `last_verified_at` = NOW();

-- ---------------------------------------------------------------------------
-- fw_physician
-- ---------------------------------------------------------------------------

UPDATE `fw_physician`
SET
  `email_quality` = CASE
    WHEN TRIM(COALESCE(`email`, '')) = '' THEN 'empty'
    WHEN LOWER(TRIM(`email`)) IN ('n/a', 'na', '-', '.', 'none', 'noemail', 'unknown') THEN 'empty'
    WHEN `email` REGEXP '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+$' THEN 'valid'
    ELSE 'invalid'
  END,
  `phone_quality` = CASE
    WHEN GREATEST(
      LENGTH(REGEXP_REPLACE(COALESCE(`cellPhone`, ''), '[^0-9]', '')),
      LENGTH(REGEXP_REPLACE(COALESCE(`officePhone`, ''), '[^0-9]', '')),
      LENGTH(REGEXP_REPLACE(COALESCE(`faxNumber`, ''), '[^0-9]', ''))
    ) >= 10 THEN 'valid'
    WHEN TRIM(COALESCE(`cellPhone`, '')) <> ''
      OR TRIM(COALESCE(`officePhone`, '')) <> ''
      OR TRIM(COALESCE(`faxNumber`, '')) <> '' THEN 'invalid'
    ELSE 'empty'
  END;

UPDATE `fw_physician`
SET
  `contact_quality` = CASE
    WHEN `email_quality` = 'valid' OR `phone_quality` = 'valid' THEN 'valid'
    WHEN `email_quality` = 'invalid' OR `phone_quality` = 'invalid' THEN 'partial'
    ELSE 'invalid'
  END,
  `last_verified_at` = NOW();

-- ---------------------------------------------------------------------------
-- fw_pharmacist
-- ---------------------------------------------------------------------------

UPDATE `fw_pharmacist`
SET
  `email_quality` = CASE
    WHEN TRIM(COALESCE(`email`, '')) = '' THEN 'empty'
    WHEN LOWER(TRIM(`email`)) IN ('n/a', 'na', '-', '.', 'none', 'noemail', 'unknown') THEN 'empty'
    WHEN `email` REGEXP '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+$' THEN 'valid'
    ELSE 'invalid'
  END,
  `phone_quality` = CASE
    WHEN LENGTH(REGEXP_REPLACE(COALESCE(`cell_phone`, ''), '[^0-9]', '')) >= 10 THEN 'valid'
    WHEN TRIM(COALESCE(`cell_phone`, '')) <> '' THEN 'invalid'
    ELSE 'empty'
  END;

UPDATE `fw_pharmacist`
SET
  `contact_quality` = CASE
    WHEN `email_quality` = 'valid' OR `phone_quality` = 'valid' THEN 'valid'
    WHEN `email_quality` = 'invalid' OR `phone_quality` = 'invalid' THEN 'partial'
    ELSE 'invalid'
  END,
  `last_verified_at` = NOW();

-- ---------------------------------------------------------------------------
-- fw_medical_clinic
-- ---------------------------------------------------------------------------

UPDATE `fw_medical_clinic`
SET
  `email_quality` = CASE
    WHEN TRIM(COALESCE(`email`, '')) = '' THEN 'empty'
    WHEN LOWER(TRIM(`email`)) IN ('n/a', 'na', '-', '.', 'none', 'noemail', 'unknown') THEN 'empty'
    WHEN `email` REGEXP '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+$' THEN 'valid'
    ELSE 'invalid'
  END,
  `phone_quality` = CASE
    WHEN GREATEST(
      LENGTH(REGEXP_REPLACE(COALESCE(`phone`, ''), '[^0-9]', '')),
      LENGTH(REGEXP_REPLACE(COALESCE(`fax`, ''), '[^0-9]', ''))
    ) >= 10 THEN 'valid'
    WHEN TRIM(COALESCE(`phone`, '')) <> ''
      OR TRIM(COALESCE(`fax`, '')) <> '' THEN 'invalid'
    ELSE 'empty'
  END;

UPDATE `fw_medical_clinic`
SET
  `contact_quality` = CASE
    WHEN `email_quality` = 'valid' OR `phone_quality` = 'valid' THEN 'valid'
    WHEN `email_quality` = 'invalid' OR `phone_quality` = 'invalid' THEN 'partial'
    ELSE 'invalid'
  END,
  `last_verified_at` = NOW();

-- ---------------------------------------------------------------------------
-- Report
-- ---------------------------------------------------------------------------

SELECT 'fw_pharma' AS table_name, `contact_quality`, COUNT(*) AS row_count
FROM `fw_pharma`
GROUP BY `contact_quality`

UNION ALL

SELECT 'fw_physician', `contact_quality`, COUNT(*)
FROM `fw_physician`
GROUP BY `contact_quality`

UNION ALL

SELECT 'fw_pharmacist', `contact_quality`, COUNT(*)
FROM `fw_pharmacist`
GROUP BY `contact_quality`

UNION ALL

SELECT 'fw_medical_clinic', `contact_quality`, COUNT(*)
FROM `fw_medical_clinic`
GROUP BY `contact_quality`

ORDER BY table_name, contact_quality;

-- Email/phone breakdown per table
SELECT 'fw_pharma' AS table_name, `email_quality`, COUNT(*) AS cnt FROM `fw_pharma` GROUP BY `email_quality`
UNION ALL SELECT 'fw_pharma', CONCAT('phone:', `phone_quality`), COUNT(*) FROM `fw_pharma` GROUP BY `phone_quality`
UNION ALL SELECT 'fw_physician', `email_quality`, COUNT(*) FROM `fw_physician` GROUP BY `email_quality`
UNION ALL SELECT 'fw_physician', CONCAT('phone:', `phone_quality`), COUNT(*) FROM `fw_physician` GROUP BY `phone_quality`
UNION ALL SELECT 'fw_pharmacist', `email_quality`, COUNT(*) FROM `fw_pharmacist` GROUP BY `email_quality`
UNION ALL SELECT 'fw_pharmacist', CONCAT('phone:', `phone_quality`), COUNT(*) FROM `fw_pharmacist` GROUP BY `phone_quality`
UNION ALL SELECT 'fw_medical_clinic', `email_quality`, COUNT(*) FROM `fw_medical_clinic` GROUP BY `email_quality`
UNION ALL SELECT 'fw_medical_clinic', CONCAT('phone:', `phone_quality`), COUNT(*) FROM `fw_medical_clinic` GROUP BY `phone_quality`
ORDER BY table_name, email_quality;

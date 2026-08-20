-- Optimize fw_* client lead tables only (legacy tables are not touched).
-- Run after copy_legacy_clients_to_fw.sql and cleanup_fw_client_leads.sql.
--
-- Steps:
--   1) Normalize text/contact fields (trim, lowercase email, clear placeholders)
--   2) Drop rows with syntactically invalid contacts and no usable fallback channel
--   3) Deduplicate by normalized email (keep lowest id)
--   4) Add list/filter indexes used by Clients UI

DROP TEMPORARY TABLE IF EXISTS `tmp_fw_optimize_before`;
CREATE TEMPORARY TABLE `tmp_fw_optimize_before` (
  `table_name` VARCHAR(64) NOT NULL,
  `total_rows` BIGINT NOT NULL
);

INSERT INTO `tmp_fw_optimize_before` (`table_name`, `total_rows`)
SELECT 'fw_pharma', COUNT(*) FROM `fw_pharma`
UNION ALL
SELECT 'fw_physician', COUNT(*) FROM `fw_physician`
UNION ALL
SELECT 'fw_pharmacist', COUNT(*) FROM `fw_pharmacist`
UNION ALL
SELECT 'fw_medical_clinic', COUNT(*) FROM `fw_medical_clinic`;

-- ---------------------------------------------------------------------------
-- 1) Normalize contact and name fields
-- ---------------------------------------------------------------------------

UPDATE `fw_pharma`
SET
  `operName` = TRIM(`operName`),
  `legalName` = TRIM(`legalName`),
  `contact` = TRIM(`contact`),
  `owner` = TRIM(`owner`),
  `manager` = TRIM(`manager`),
  `phone` = TRIM(`phone`),
  `cell` = TRIM(`cell`),
  `fax` = TRIM(`fax`),
  `twilioPhone` = TRIM(`twilioPhone`),
  `email` = LOWER(TRIM(`email`)),
  `city` = TRIM(`city`),
  `region` = TRIM(`region`),
  `country` = TRIM(`country`),
  `postcode` = TRIM(`postcode`),
  `fullAddress` = TRIM(`fullAddress`);

UPDATE `fw_physician`
SET
  `prefTitle` = TRIM(`prefTitle`),
  `fullName` = TRIM(`fullName`),
  `specialty` = TRIM(`specialty`),
  `company` = TRIM(`company`),
  `cellPhone` = TRIM(`cellPhone`),
  `officePhone` = TRIM(`officePhone`),
  `faxNumber` = TRIM(`faxNumber`),
  `email` = LOWER(TRIM(`email`)),
  `city` = TRIM(`city`),
  `region` = TRIM(`region`),
  `country` = TRIM(`country`),
  `postal` = TRIM(`postal`),
  `fullAddress` = TRIM(`fullAddress`);

UPDATE `fw_pharmacist`
SET
  `fullName` = TRIM(`fullName`),
  `reg_number` = TRIM(`reg_number`),
  `pharm_owned` = TRIM(`pharm_owned`),
  `workplace` = TRIM(`workplace`),
  `cell_phone` = TRIM(`cell_phone`),
  `email` = LOWER(TRIM(`email`));

UPDATE `fw_medical_clinic`
SET
  `clinicName` = TRIM(`clinicName`),
  `clinicType` = TRIM(`clinicType`),
  `contactName` = TRIM(`contactName`),
  `phone` = TRIM(`phone`),
  `fax` = TRIM(`fax`),
  `email` = LOWER(TRIM(`email`)),
  `city` = TRIM(`city`),
  `region` = TRIM(`region`),
  `country` = TRIM(`country`),
  `postal` = TRIM(`postal`),
  `streetName` = TRIM(`streetName`),
  `fullAddress` = TRIM(`fullAddress`);

-- Clear known placeholder values in contact fields.
UPDATE `fw_pharma`
SET
  `email` = IF(LOWER(`email`) IN ('n/a', 'na', '-', '.', 'none', 'noemail', 'unknown'), '', `email`),
  `phone` = IF(LOWER(`phone`) IN ('n/a', 'na', '-', '.', 'none', 'unknown'), '', `phone`),
  `cell` = IF(LOWER(`cell`) IN ('n/a', 'na', '-', '.', 'none', 'unknown'), '', `cell`),
  `fax` = IF(LOWER(`fax`) IN ('n/a', 'na', '-', '.', 'none', 'unknown'), '', `fax`),
  `twilioPhone` = IF(LOWER(`twilioPhone`) IN ('n/a', 'na', '-', '.', 'none', 'unknown'), '', `twilioPhone`);

UPDATE `fw_physician`
SET
  `email` = IF(LOWER(`email`) IN ('n/a', 'na', '-', '.', 'none', 'noemail', 'unknown'), '', `email`),
  `cellPhone` = IF(LOWER(`cellPhone`) IN ('n/a', 'na', '-', '.', 'none', 'unknown'), '', `cellPhone`),
  `officePhone` = IF(LOWER(`officePhone`) IN ('n/a', 'na', '-', '.', 'none', 'unknown'), '', `officePhone`),
  `faxNumber` = IF(LOWER(`faxNumber`) IN ('n/a', 'na', '-', '.', 'none', 'unknown'), '', `faxNumber`);

UPDATE `fw_pharmacist`
SET
  `email` = IF(LOWER(`email`) IN ('n/a', 'na', '-', '.', 'none', 'noemail', 'unknown'), '', `email`),
  `cell_phone` = IF(LOWER(`cell_phone`) IN ('n/a', 'na', '-', '.', 'none', 'unknown'), '', `cell_phone`);

UPDATE `fw_medical_clinic`
SET
  `email` = IF(LOWER(`email`) IN ('n/a', 'na', '-', '.', 'none', 'noemail', 'unknown'), '', `email`),
  `phone` = IF(LOWER(`phone`) IN ('n/a', 'na', '-', '.', 'none', 'unknown'), '', `phone`),
  `fax` = IF(LOWER(`fax`) IN ('n/a', 'na', '-', '.', 'none', 'unknown'), '', `fax`);

-- ---------------------------------------------------------------------------
-- 2) Remove rows with invalid contacts and no fallback channel
-- ---------------------------------------------------------------------------

DELETE FROM `fw_pharmacist`
WHERE
  (`email` = '' OR `email` NOT REGEXP '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+$')
  AND (`cell_phone` = '' OR LENGTH(REGEXP_REPLACE(`cell_phone`, '[^0-9]', '')) < 10);

DELETE FROM `fw_pharma`
WHERE
  (`email` = '' OR `email` NOT REGEXP '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+$')
  AND (`phone` = '' OR LENGTH(REGEXP_REPLACE(`phone`, '[^0-9]', '')) < 10)
  AND (`cell` = '' OR LENGTH(REGEXP_REPLACE(`cell`, '[^0-9]', '')) < 10)
  AND (`fax` = '' OR LENGTH(REGEXP_REPLACE(`fax`, '[^0-9]', '')) < 10)
  AND (`twilioPhone` = '' OR LENGTH(REGEXP_REPLACE(`twilioPhone`, '[^0-9]', '')) < 10);

UPDATE `fw_pharmacist` p
LEFT JOIN `fw_pharma` ph ON ph.`id` = p.`pharmId`
SET p.`pharmId` = NULL
WHERE p.`pharmId` IS NOT NULL AND ph.`id` IS NULL;

DELETE FROM `fw_physician`
WHERE
  (`email` = '' OR `email` NOT REGEXP '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+$')
  AND (`cellPhone` = '' OR LENGTH(REGEXP_REPLACE(`cellPhone`, '[^0-9]', '')) < 10)
  AND (`officePhone` = '' OR LENGTH(REGEXP_REPLACE(`officePhone`, '[^0-9]', '')) < 10)
  AND (`faxNumber` = '' OR LENGTH(REGEXP_REPLACE(`faxNumber`, '[^0-9]', '')) < 10);

DELETE FROM `fw_medical_clinic`
WHERE
  (`email` = '' OR `email` NOT REGEXP '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+$')
  AND (`phone` = '' OR LENGTH(REGEXP_REPLACE(`phone`, '[^0-9]', '')) < 10)
  AND (`fax` = '' OR LENGTH(REGEXP_REPLACE(`fax`, '[^0-9]', '')) < 10);

-- ---------------------------------------------------------------------------
-- 3) Deduplicate by normalized email (keep lowest id)
-- ---------------------------------------------------------------------------

DELETE p1
FROM `fw_pharmacist` p1
INNER JOIN `fw_pharmacist` p2
  ON p1.`id` > p2.`id`
 AND p1.`email` <> ''
 AND p1.`email` = p2.`email`;

DELETE p1
FROM `fw_pharma` p1
INNER JOIN `fw_pharma` p2
  ON p1.`id` > p2.`id`
 AND p1.`email` <> ''
 AND p1.`email` = p2.`email`;

DELETE p1
FROM `fw_physician` p1
INNER JOIN `fw_physician` p2
  ON p1.`id` > p2.`id`
 AND p1.`email` <> ''
 AND p1.`email` = p2.`email`;

DELETE p1
FROM `fw_medical_clinic` p1
INNER JOIN `fw_medical_clinic` p2
  ON p1.`id` > p2.`id`
 AND p1.`email` <> ''
 AND p1.`email` = p2.`email`;

UPDATE `fw_pharmacist` p
LEFT JOIN `fw_pharma` ph ON ph.`id` = p.`pharmId`
SET p.`pharmId` = NULL
WHERE p.`pharmId` IS NOT NULL AND ph.`id` IS NULL;

-- ---------------------------------------------------------------------------
-- 4) Indexes for Clients UI filters/search (idempotent helper)
-- ---------------------------------------------------------------------------

DROP PROCEDURE IF EXISTS `sp_fw_add_index_if_missing`;
DELIMITER $$
CREATE PROCEDURE `sp_fw_add_index_if_missing`(
  IN p_table VARCHAR(64),
  IN p_index VARCHAR(64),
  IN p_columns VARCHAR(255)
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.STATISTICS s
    WHERE s.TABLE_SCHEMA = DATABASE()
      AND s.TABLE_NAME = p_table
      AND s.INDEX_NAME = p_index
  ) THEN
    SET @sql = CONCAT(
      'CREATE INDEX `', p_index, '` ON `', p_table, '` (', p_columns, ')'
    );
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;

CALL `sp_fw_add_index_if_missing`('fw_pharma', 'idx_fw_pharma_country_region', '`country`, `region`');
CALL `sp_fw_add_index_if_missing`('fw_pharma', 'idx_fw_pharma_email', '`email`');
CALL `sp_fw_add_index_if_missing`('fw_pharma', 'idx_fw_pharma_oper_name', '`operName`');
CALL `sp_fw_add_index_if_missing`('fw_pharma', 'idx_fw_pharma_sub_type', '`sub_type`');
CALL `sp_fw_add_index_if_missing`('fw_pharma', 'idx_fw_pharma_sales_cycle', '`sales_cycle`');

CALL `sp_fw_add_index_if_missing`('fw_physician', 'idx_fw_physician_specialty', '`specialty`');
CALL `sp_fw_add_index_if_missing`('fw_physician', 'idx_fw_physician_email', '`email`');
CALL `sp_fw_add_index_if_missing`('fw_physician', 'idx_fw_physician_full_name', '`fullName`');
CALL `sp_fw_add_index_if_missing`('fw_physician', 'idx_fw_physician_country_region', '`country`, `region`');

CALL `sp_fw_add_index_if_missing`('fw_pharmacist', 'idx_fw_pharmacist_email', '`email`');
CALL `sp_fw_add_index_if_missing`('fw_pharmacist', 'idx_fw_pharmacist_pharm_id', '`pharmId`');
CALL `sp_fw_add_index_if_missing`('fw_pharmacist', 'idx_fw_pharmacist_full_name', '`fullName`');

CALL `sp_fw_add_index_if_missing`('fw_medical_clinic', 'idx_fw_medical_clinic_country_region', '`country`, `region`');
CALL `sp_fw_add_index_if_missing`('fw_medical_clinic', 'idx_fw_medical_clinic_clinic_type', '`clinicType`');
CALL `sp_fw_add_index_if_missing`('fw_medical_clinic', 'idx_fw_medical_clinic_email', '`email`');
CALL `sp_fw_add_index_if_missing`('fw_medical_clinic', 'idx_fw_medical_clinic_clinic_name', '`clinicName`');

DROP PROCEDURE IF EXISTS `sp_fw_add_index_if_missing`;

-- ---------------------------------------------------------------------------
-- Report
-- ---------------------------------------------------------------------------

SELECT
  REPLACE(b.`table_name`, 'fw_', '') AS table_name,
  b.`total_rows` AS rows_before_optimize,
  CASE b.`table_name`
    WHEN 'fw_pharma' THEN (SELECT COUNT(*) FROM `fw_pharma`)
    WHEN 'fw_physician' THEN (SELECT COUNT(*) FROM `fw_physician`)
    WHEN 'fw_pharmacist' THEN (SELECT COUNT(*) FROM `fw_pharmacist`)
    WHEN 'fw_medical_clinic' THEN (SELECT COUNT(*) FROM `fw_medical_clinic`)
  END AS rows_after_optimize,
  b.`total_rows` - CASE b.`table_name`
    WHEN 'fw_pharma' THEN (SELECT COUNT(*) FROM `fw_pharma`)
    WHEN 'fw_physician' THEN (SELECT COUNT(*) FROM `fw_physician`)
    WHEN 'fw_pharmacist' THEN (SELECT COUNT(*) FROM `fw_pharmacist`)
    WHEN 'fw_medical_clinic' THEN (SELECT COUNT(*) FROM `fw_medical_clinic`)
  END AS removed_during_optimize
FROM `tmp_fw_optimize_before` b
ORDER BY b.`table_name`;

DROP TEMPORARY TABLE IF EXISTS `tmp_fw_optimize_before`;

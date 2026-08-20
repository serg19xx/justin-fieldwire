-- Add verification/quality columns to fw_* client lead tables only.
-- Compatible with MariaDB / MySQL without ADD COLUMN IF NOT EXISTS.

DROP PROCEDURE IF EXISTS `sp_fw_add_column_if_missing`;
DELIMITER $$
CREATE PROCEDURE `sp_fw_add_column_if_missing`(
  IN p_table VARCHAR(64),
  IN p_column VARCHAR(64),
  IN p_definition VARCHAR(255)
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS c
    WHERE c.TABLE_SCHEMA = DATABASE()
      AND c.TABLE_NAME = p_table
      AND c.COLUMN_NAME = p_column
  ) THEN
    SET @sql = CONCAT(
      'ALTER TABLE `', p_table, '` ADD COLUMN `', p_column, '` ', p_definition
    );
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;

-- fw_pharma
CALL `sp_fw_add_column_if_missing`('fw_pharma', 'email_quality', "VARCHAR(16) NOT NULL DEFAULT 'empty'");
CALL `sp_fw_add_column_if_missing`('fw_pharma', 'phone_quality', "VARCHAR(16) NOT NULL DEFAULT 'empty'");
CALL `sp_fw_add_column_if_missing`('fw_pharma', 'contact_quality', "VARCHAR(16) NOT NULL DEFAULT 'invalid'");
CALL `sp_fw_add_column_if_missing`('fw_pharma', 'last_verified_at', 'DATETIME NULL');

-- fw_physician
CALL `sp_fw_add_column_if_missing`('fw_physician', 'email_quality', "VARCHAR(16) NOT NULL DEFAULT 'empty'");
CALL `sp_fw_add_column_if_missing`('fw_physician', 'phone_quality', "VARCHAR(16) NOT NULL DEFAULT 'empty'");
CALL `sp_fw_add_column_if_missing`('fw_physician', 'contact_quality', "VARCHAR(16) NOT NULL DEFAULT 'invalid'");
CALL `sp_fw_add_column_if_missing`('fw_physician', 'last_verified_at', 'DATETIME NULL');

-- fw_pharmacist
CALL `sp_fw_add_column_if_missing`('fw_pharmacist', 'email_quality', "VARCHAR(16) NOT NULL DEFAULT 'empty'");
CALL `sp_fw_add_column_if_missing`('fw_pharmacist', 'phone_quality', "VARCHAR(16) NOT NULL DEFAULT 'empty'");
CALL `sp_fw_add_column_if_missing`('fw_pharmacist', 'contact_quality', "VARCHAR(16) NOT NULL DEFAULT 'invalid'");
CALL `sp_fw_add_column_if_missing`('fw_pharmacist', 'last_verified_at', 'DATETIME NULL');

-- fw_medical_clinic
CALL `sp_fw_add_column_if_missing`('fw_medical_clinic', 'email_quality', "VARCHAR(16) NOT NULL DEFAULT 'empty'");
CALL `sp_fw_add_column_if_missing`('fw_medical_clinic', 'phone_quality', "VARCHAR(16) NOT NULL DEFAULT 'empty'");
CALL `sp_fw_add_column_if_missing`('fw_medical_clinic', 'contact_quality', "VARCHAR(16) NOT NULL DEFAULT 'invalid'");
CALL `sp_fw_add_column_if_missing`('fw_medical_clinic', 'last_verified_at', 'DATETIME NULL');

DROP PROCEDURE IF EXISTS `sp_fw_add_column_if_missing`;

-- Indexes (only if column exists and index missing)
SET @sql := IF(
  EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fw_pharma' AND COLUMN_NAME = 'contact_quality'
  ) AND NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fw_pharma' AND INDEX_NAME = 'idx_fw_pharma_contact_quality'
  ),
  'CREATE INDEX `idx_fw_pharma_contact_quality` ON `fw_pharma` (`contact_quality`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fw_physician' AND COLUMN_NAME = 'contact_quality'
  ) AND NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fw_physician' AND INDEX_NAME = 'idx_fw_physician_contact_quality'
  ),
  'CREATE INDEX `idx_fw_physician_contact_quality` ON `fw_physician` (`contact_quality`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fw_pharmacist' AND COLUMN_NAME = 'contact_quality'
  ) AND NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fw_pharmacist' AND INDEX_NAME = 'idx_fw_pharmacist_contact_quality'
  ),
  'CREATE INDEX `idx_fw_pharmacist_contact_quality` ON `fw_pharmacist` (`contact_quality`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fw_medical_clinic' AND COLUMN_NAME = 'contact_quality'
  ) AND NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fw_medical_clinic' AND INDEX_NAME = 'idx_fw_medical_clinic_contact_quality'
  ),
  'CREATE INDEX `idx_fw_medical_clinic_contact_quality` ON `fw_medical_clinic` (`contact_quality`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Verify: expect 16 rows (4 columns x 4 tables)
SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('fw_pharma', 'fw_physician', 'fw_pharmacist', 'fw_medical_clinic')
  AND COLUMN_NAME IN ('email_quality', 'phone_quality', 'contact_quality', 'last_verified_at')
ORDER BY TABLE_NAME, COLUMN_NAME;

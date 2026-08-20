-- Copy legacy client tables into fw_* namespace for isolated cleanup work.
-- This migration is designed to be re-runnable.

CREATE TABLE IF NOT EXISTS `fw_pharma` LIKE `pharma`;
CREATE TABLE IF NOT EXISTS `fw_physician` LIKE `physician`;
CREATE TABLE IF NOT EXISTS `fw_pharmacist` LIKE `pharmacist`;
CREATE TABLE IF NOT EXISTS `fw_medical_clinic` LIKE `medical_clinic`;

TRUNCATE TABLE `fw_pharmacist`;
TRUNCATE TABLE `fw_medical_clinic`;
TRUNCATE TABLE `fw_physician`;
TRUNCATE TABLE `fw_pharma`;

INSERT INTO `fw_pharma`
SELECT * FROM `pharma`;

INSERT INTO `fw_physician`
SELECT * FROM `physician`;

INSERT INTO `fw_medical_clinic`
SELECT * FROM `medical_clinic`;

INSERT INTO `fw_pharmacist`
SELECT * FROM `pharmacist`;

-- Re-point fw_pharmacist.pharmId foreign key to fw_pharma.id (if FK exists).
SET @fk_name := (
  SELECT k.CONSTRAINT_NAME
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
  WHERE k.TABLE_SCHEMA = DATABASE()
    AND k.TABLE_NAME = 'fw_pharmacist'
    AND k.COLUMN_NAME = 'pharmId'
    AND k.REFERENCED_TABLE_NAME IS NOT NULL
  LIMIT 1
);

SET @drop_fk_sql := IF(
  @fk_name IS NULL,
  'SELECT 1',
  CONCAT('ALTER TABLE `fw_pharmacist` DROP FOREIGN KEY `', @fk_name, '`')
);
PREPARE stmt_drop_fk FROM @drop_fk_sql;
EXECUTE stmt_drop_fk;
DEALLOCATE PREPARE stmt_drop_fk;

SET @has_fw_fk := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
  WHERE k.TABLE_SCHEMA = DATABASE()
    AND k.TABLE_NAME = 'fw_pharmacist'
    AND k.COLUMN_NAME = 'pharmId'
    AND k.REFERENCED_TABLE_NAME = 'fw_pharma'
);

SET @add_fk_sql := IF(
  @has_fw_fk > 0,
  'SELECT 1',
  'ALTER TABLE `fw_pharmacist` ADD CONSTRAINT `fk_fw_pharmacist_pharm` FOREIGN KEY (`pharmId`) REFERENCES `fw_pharma`(`id`) ON DELETE SET NULL ON UPDATE CASCADE'
);
PREPARE stmt_add_fk FROM @add_fk_sql;
EXECUTE stmt_add_fk;
DEALLOCATE PREPARE stmt_add_fk;

-- Add verification columns to fw_* tables that are still missing them.
-- Run each ALTER separately in DBeaver if needed (Ctrl+Enter per block).
-- fw_medical_clinic already has these columns — skip that block.

ALTER TABLE `fw_pharma`
  ADD COLUMN `email_quality` VARCHAR(16) NOT NULL DEFAULT 'empty',
  ADD COLUMN `phone_quality` VARCHAR(16) NOT NULL DEFAULT 'empty',
  ADD COLUMN `contact_quality` VARCHAR(16) NOT NULL DEFAULT 'invalid',
  ADD COLUMN `last_verified_at` DATETIME NULL;

ALTER TABLE `fw_physician`
  ADD COLUMN `email_quality` VARCHAR(16) NOT NULL DEFAULT 'empty',
  ADD COLUMN `phone_quality` VARCHAR(16) NOT NULL DEFAULT 'empty',
  ADD COLUMN `contact_quality` VARCHAR(16) NOT NULL DEFAULT 'invalid',
  ADD COLUMN `last_verified_at` DATETIME NULL;

ALTER TABLE `fw_pharmacist`
  ADD COLUMN `email_quality` VARCHAR(16) NOT NULL DEFAULT 'empty',
  ADD COLUMN `phone_quality` VARCHAR(16) NOT NULL DEFAULT 'empty',
  ADD COLUMN `contact_quality` VARCHAR(16) NOT NULL DEFAULT 'invalid',
  ADD COLUMN `last_verified_at` DATETIME NULL;

-- Verify: expect 16 rows total (4 columns x 4 tables)
SELECT TABLE_NAME, COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('fw_pharma', 'fw_physician', 'fw_pharmacist', 'fw_medical_clinic')
  AND COLUMN_NAME IN ('email_quality', 'phone_quality', 'contact_quality', 'last_verified_at')
ORDER BY TABLE_NAME, COLUMN_NAME;

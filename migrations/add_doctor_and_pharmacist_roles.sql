-- Add Doctor and Pharmacist client roles to fw_glob_roles
-- and link columns to fw_users

INSERT INTO `fw_glob_roles` (`code`, `name`, `category`, `description`)
SELECT 'doctor', 'Doctor', 'client', 'View-only access for primary physician to follow their clinic project'
WHERE NOT EXISTS (SELECT 1 FROM `fw_glob_roles` WHERE `code` = 'doctor');

INSERT INTO `fw_glob_roles` (`code`, `name`, `category`, `description`)
SELECT 'pharmacist', 'Pharmacist', 'client', 'Marketplace and secondary client access for pharmacy partners'
WHERE NOT EXISTS (SELECT 1 FROM `fw_glob_roles` WHERE `code` = 'pharmacist');

-- Add physician_id and pharmacist_id columns to fw_users if missing
-- Used for fast direct lookup of linked doctor or pharmacist record
ALTER TABLE `fw_users`
  ADD COLUMN `physician_id` BIGINT(20) UNSIGNED NULL DEFAULT NULL AFTER `role_id`,
  ADD COLUMN `pharmacist_id` BIGINT(20) UNSIGNED NULL DEFAULT NULL AFTER `physician_id`;

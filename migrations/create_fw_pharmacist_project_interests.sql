-- Pharmacist project marketplace interest and digital contract signing pipeline.
-- Tracks Pursue vs Not Interested decisions and Step 1-4 progression:
-- Step 1: Sign Digital NDA & Project Fees
-- Step 2: Digital NDA stored in plans
-- Step 3: Reveal project address
-- Step 4: Digital Sign Lease

CREATE TABLE IF NOT EXISTS `fw_pharmacist_project_interests` (
  `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` BIGINT(20) UNSIGNED NOT NULL,
  `pharmacist_id` BIGINT(20) UNSIGNED NOT NULL,
  `user_id` BIGINT(20) UNSIGNED NULL DEFAULT NULL,
  `decision` ENUM('pursue', 'not_interested') NOT NULL DEFAULT 'pursue',
  `nda_signed` TINYINT(1) NOT NULL DEFAULT 0,
  `nda_signed_at` DATETIME NULL DEFAULT NULL,
  `nda_signer_name` VARCHAR(255) NULL DEFAULT NULL,
  `nda_document_id` VARCHAR(128) NULL DEFAULT NULL,
  `lease_signed` TINYINT(1) NOT NULL DEFAULT 0,
  `lease_signed_at` DATETIME NULL DEFAULT NULL,
  `lease_signer_name` VARCHAR(255) NULL DEFAULT NULL,
  `lease_modifications` TEXT NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pharma_proj` (`project_id`, `pharmacist_id`),
  KEY `idx_pharma_decision` (`pharmacist_id`, `decision`),
  KEY `idx_proj_decision` (`project_id`, `decision`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

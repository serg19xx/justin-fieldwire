-- Outreach invitation campaigns (one client_type per campaign).
-- Channel rule: email primary; SMS only when email is missing.

CREATE TABLE IF NOT EXISTS `fw_outreach_campaigns` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `client_type` ENUM('pharma','physician','pharmacist','medical_clinic') NOT NULL,
  `name` VARCHAR(191) NULL,
  `status` ENUM('draft','running','paused','done','failed') NOT NULL DEFAULT 'draft',
  `country` VARCHAR(64) NULL,
  `region` VARCHAR(128) NULL,
  `category` VARCHAR(128) NULL COMMENT 'sub_type / clinicType / etc.',
  `specialty` VARCHAR(191) NULL,
  `batch_size` INT UNSIGNED NOT NULL DEFAULT 50,
  `wait_hours` INT UNSIGNED NOT NULL DEFAULT 72,
  `filters_json` JSON NULL,
  `total_queued` INT UNSIGNED NOT NULL DEFAULT 0,
  `total_sent` INT UNSIGNED NOT NULL DEFAULT 0,
  `total_replied` INT UNSIGNED NOT NULL DEFAULT 0,
  `total_declined` INT UNSIGNED NOT NULL DEFAULT 0,
  `total_unsubscribed` INT UNSIGNED NOT NULL DEFAULT 0,
  `total_no_response` INT UNSIGNED NOT NULL DEFAULT 0,
  `total_failed` INT UNSIGNED NOT NULL DEFAULT 0,
  `total_skipped` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_by` INT UNSIGNED NULL,
  `started_at` DATETIME NULL,
  `finished_at` DATETIME NULL,
  `n8n_run_id` VARCHAR(128) NULL,
  `last_error` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_outreach_campaigns_type_status` (`client_type`, `status`),
  KEY `idx_outreach_campaigns_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `fw_outreach_recipients` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `campaign_id` INT UNSIGNED NOT NULL,
  `client_type` ENUM('pharma','physician','pharmacist','medical_clinic') NOT NULL,
  `client_id` INT UNSIGNED NOT NULL,
  `client_name` VARCHAR(255) NULL,
  `channel` ENUM('email','sms') NOT NULL,
  `destination` VARCHAR(255) NOT NULL,
  `status` ENUM(
    'queued','sent','replied','declined','unsubscribed','no_response','failed','skipped'
  ) NOT NULL DEFAULT 'queued',
  `batch_no` INT UNSIGNED NULL,
  `sent_at` DATETIME NULL,
  `wait_until` DATETIME NULL,
  `responded_at` DATETIME NULL,
  `response_note` VARCHAR(512) NULL,
  `error_message` VARCHAR(512) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_outreach_campaign_client` (`campaign_id`, `client_id`),
  KEY `idx_outreach_recipients_campaign_status` (`campaign_id`, `status`),
  KEY `idx_outreach_recipients_wait` (`status`, `wait_until`),
  KEY `idx_outreach_recipients_client` (`client_type`, `client_id`),
  CONSTRAINT `fk_outreach_recipients_campaign`
    FOREIGN KEY (`campaign_id`) REFERENCES `fw_outreach_campaigns` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

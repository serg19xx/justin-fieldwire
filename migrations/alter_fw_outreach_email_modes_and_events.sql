-- Outreach: custom | sendgrid_full | sendgrid_body + event log table.

ALTER TABLE `fw_outreach_campaigns`
  MODIFY COLUMN `email_mode` ENUM(
    'custom',
    'sendgrid',
    'sendgrid_full',
    'sendgrid_body'
  ) NOT NULL DEFAULT 'custom';

UPDATE `fw_outreach_campaigns`
SET `email_mode` = 'sendgrid_full'
WHERE `email_mode` = 'sendgrid';

ALTER TABLE `fw_outreach_campaigns`
  MODIFY COLUMN `email_mode` ENUM(
    'custom',
    'sendgrid_full',
    'sendgrid_body'
  ) NOT NULL DEFAULT 'custom';

CREATE TABLE IF NOT EXISTS `fw_outreach_events` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `campaign_id` INT UNSIGNED NOT NULL,
  `recipient_id` INT UNSIGNED NULL,
  `source` ENUM('sendgrid', 'twilio', 'system', 'link') NOT NULL,
  `event_type` VARCHAR(64) NOT NULL,
  `payload_json` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_outreach_events_campaign` (`campaign_id`, `id`),
  KEY `idx_outreach_events_recipient` (`recipient_id`, `id`),
  KEY `idx_outreach_events_type` (`event_type`),
  CONSTRAINT `fk_outreach_events_campaign`
    FOREIGN KEY (`campaign_id`) REFERENCES `fw_outreach_campaigns` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_outreach_events_recipient`
    FOREIGN KEY (`recipient_id`) REFERENCES `fw_outreach_recipients` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

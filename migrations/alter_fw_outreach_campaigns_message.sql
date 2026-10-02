-- Outreach message content per campaign (custom text or SendGrid dynamic template).
-- Wave mode: batch_size = emails per Start (max 50); campaign auto-pauses when queue is empty.

ALTER TABLE `fw_outreach_campaigns`
  ADD COLUMN `email_mode` ENUM('custom','sendgrid') NOT NULL DEFAULT 'custom'
    AFTER `wait_hours`,
  ADD COLUMN `email_subject` VARCHAR(255) NULL
    AFTER `email_mode`,
  ADD COLUMN `email_body` TEXT NULL
    AFTER `email_subject`,
  ADD COLUMN `sendgrid_template_id` VARCHAR(128) NULL
    AFTER `email_body`,
  ADD COLUMN `sms_body` VARCHAR(640) NULL
    AFTER `sendgrid_template_id`;

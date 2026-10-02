-- Temporary access keys for contractor task access (no fw_users account).
-- One active key per task; PM/foreman create & revoke; shared among crew on site.

CREATE TABLE IF NOT EXISTS `fw_task_access_keys` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `task_id` BIGINT UNSIGNED NOT NULL,
  `project_id` BIGINT UNSIGNED NOT NULL,
  `contractor_id` BIGINT UNSIGNED NULL COMMENT 'Optional: assigned fw_contractors.id when key was issued',
  `key_code` VARCHAR(32) NOT NULL COMMENT 'Human-shareable code, e.g. FW-AB12-CD34',
  `key_hash` VARCHAR(64) NOT NULL COMMENT 'sha256 of key_code for lookup',
  `expires_at` DATETIME NOT NULL,
  `revoked_at` DATETIME NULL,
  `created_by` BIGINT UNSIGNED NULL COMMENT 'fw_users.id of PM/foreman',
  `last_used_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_fw_task_access_keys_hash` (`key_hash`),
  KEY `idx_fw_task_access_keys_task` (`task_id`),
  KEY `idx_fw_task_access_keys_project` (`project_id`),
  KEY `idx_fw_task_access_keys_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Split contractors/inspectors out of fw_users into contact tables (no login).
-- Run once on the shared FieldWire DB.
--
-- Steps:
-- 1) Create fw_contractors / fw_inspectors
-- 2) Add executor fields on fw_prj_tasks
-- 3) Backfill contacts from fw_users with those global roles
-- 4) Remap task leads that were contractors
-- 5) Soft-deactivate legacy user accounts
-- 6) Remove contractor/inspector from fw_glob_roles

-- ---------------------------------------------------------------------------
-- 1. Contact catalogs
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `fw_contractors` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(200) NOT NULL,
  `company` VARCHAR(200) NULL,
  `phone` VARCHAR(50) NULL,
  `email` VARCHAR(255) NULL,
  `trade` VARCHAR(100) NULL COMMENT 'Trade / specialty (from legacy job_title)',
  `notes` TEXT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `legacy_user_id` BIGINT UNSIGNED NULL COMMENT 'Temp: source fw_users.id for migration',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_fw_contractors_active` (`is_active`),
  KEY `idx_fw_contractors_legacy_user` (`legacy_user_id`),
  KEY `idx_fw_contractors_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `fw_inspectors` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(200) NOT NULL,
  `company` VARCHAR(200) NULL,
  `phone` VARCHAR(50) NULL,
  `email` VARCHAR(255) NULL,
  `specialty` VARCHAR(100) NULL,
  `notes` TEXT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `legacy_user_id` BIGINT UNSIGNED NULL COMMENT 'Temp: source fw_users.id for migration',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_fw_inspectors_active` (`is_active`),
  KEY `idx_fw_inspectors_legacy_user` (`legacy_user_id`),
  KEY `idx_fw_inspectors_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 2. Task assignment columns
-- ---------------------------------------------------------------------------

ALTER TABLE `fw_prj_tasks`
  ADD COLUMN `executor_type` ENUM('user', 'contractor') NULL
    COMMENT 'Who performs the work: system user or external contractor'
    AFTER `category`,
  ADD COLUMN `contractor_id` BIGINT UNSIGNED NULL
    COMMENT 'FK fw_contractors.id when executor_type=contractor'
    AFTER `executor_type`,
  ADD COLUMN `inspector_id` BIGINT UNSIGNED NULL
    COMMENT 'FK fw_inspectors.id for inspection milestones'
    AFTER `contractor_id`;

CREATE INDEX `idx_fw_prj_tasks_executor_type` ON `fw_prj_tasks` (`executor_type`);
CREATE INDEX `idx_fw_prj_tasks_contractor_id` ON `fw_prj_tasks` (`contractor_id`);
CREATE INDEX `idx_fw_prj_tasks_inspector_id` ON `fw_prj_tasks` (`inspector_id`);

-- ---------------------------------------------------------------------------
-- 3. Backfill contacts from login users
-- ---------------------------------------------------------------------------

INSERT INTO `fw_contractors` (`name`, `company`, `phone`, `email`, `trade`, `notes`, `is_active`, `legacy_user_id`)
SELECT
  NULLIF(TRIM(CONCAT(COALESCE(u.`first_name`, ''), ' ', COALESCE(u.`last_name`, ''))), '') AS `name`,
  NULL,
  NULLIF(TRIM(u.`phone`), ''),
  NULLIF(TRIM(u.`email`), ''),
  NULLIF(TRIM(u.`job_title`), ''),
  CONCAT('Migrated from fw_users id=', u.`id`),
  1,
  u.`id`
FROM `fw_users` u
INNER JOIN `fw_glob_roles` r ON r.`id` = u.`role_id`
WHERE r.`code` = 'contractor'
  AND NOT EXISTS (
    SELECT 1 FROM `fw_contractors` c WHERE c.`legacy_user_id` = u.`id`
  )
  AND (
    NULLIF(TRIM(CONCAT(COALESCE(u.`first_name`, ''), ' ', COALESCE(u.`last_name`, ''))), '') IS NOT NULL
    OR NULLIF(TRIM(u.`email`), '') IS NOT NULL
  );

-- Ensure name is never empty after insert
UPDATE `fw_contractors`
SET `name` = COALESCE(NULLIF(TRIM(`email`), ''), CONCAT('Contractor #', `id`))
WHERE `name` IS NULL OR TRIM(`name`) = '';

INSERT INTO `fw_inspectors` (`name`, `company`, `phone`, `email`, `specialty`, `notes`, `is_active`, `legacy_user_id`)
SELECT
  NULLIF(TRIM(CONCAT(COALESCE(u.`first_name`, ''), ' ', COALESCE(u.`last_name`, ''))), '') AS `name`,
  NULL,
  NULLIF(TRIM(u.`phone`), ''),
  NULLIF(TRIM(u.`email`), ''),
  NULLIF(TRIM(u.`job_title`), ''),
  CONCAT('Migrated from fw_users id=', u.`id`),
  1,
  u.`id`
FROM `fw_users` u
INNER JOIN `fw_glob_roles` r ON r.`id` = u.`role_id`
WHERE r.`code` = 'inspector'
  AND NOT EXISTS (
    SELECT 1 FROM `fw_inspectors` i WHERE i.`legacy_user_id` = u.`id`
  )
  AND (
    NULLIF(TRIM(CONCAT(COALESCE(u.`first_name`, ''), ' ', COALESCE(u.`last_name`, ''))), '') IS NOT NULL
    OR NULLIF(TRIM(u.`email`), '') IS NOT NULL
  );

UPDATE `fw_inspectors`
SET `name` = COALESCE(NULLIF(TRIM(`email`), ''), CONCAT('Inspector #', `id`))
WHERE `name` IS NULL OR TRIM(`name`) = '';

-- ---------------------------------------------------------------------------
-- 4. Remap tasks whose task_lead was a contractor user
-- ---------------------------------------------------------------------------

UPDATE `fw_prj_tasks` t
INNER JOIN `fw_prj_team_members` tm
  ON tm.`task_id` = t.`id`
 AND tm.`project_id` = t.`project_id`
INNER JOIN `fw_contractors` c ON c.`legacy_user_id` = tm.`user_id`
SET
  t.`executor_type` = 'contractor',
  t.`contractor_id` = c.`id`
WHERE tm.`user_id` IS NOT NULL
  AND (
    LOWER(COALESCE(tm.`role_in_project`, '')) = 'task_lead'
    OR LOWER(COALESCE(tm.`role_in_project`, '')) LIKE '%lead%'
    OR LOWER(COALESCE(tm.`role_in_project`, '')) LIKE '%foreman%'
  );

-- Default remaining tasks that still have a user lead to executor_type=user
UPDATE `fw_prj_tasks` t
INNER JOIN `fw_prj_team_members` tm
  ON tm.`task_id` = t.`id`
 AND tm.`project_id` = t.`project_id`
SET t.`executor_type` = 'user'
WHERE t.`executor_type` IS NULL
  AND tm.`user_id` IS NOT NULL
  AND (
    LOWER(COALESCE(tm.`role_in_project`, '')) = 'task_lead'
    OR LOWER(COALESCE(tm.`role_in_project`, '')) LIKE '%lead%'
    OR LOWER(COALESCE(tm.`role_in_project`, '')) LIKE '%foreman%'
  );

-- Remove contractor users from task team_members (they are no longer system users for assignment)
DELETE tm
FROM `fw_prj_team_members` tm
INNER JOIN `fw_contractors` c ON c.`legacy_user_id` = tm.`user_id`;

DELETE tm
FROM `fw_prj_team_members` tm
INNER JOIN `fw_inspectors` i ON i.`legacy_user_id` = tm.`user_id`;

-- ---------------------------------------------------------------------------
-- 5. Soft-deactivate legacy login accounts (keep rows for FK history)
-- ---------------------------------------------------------------------------

SET @worker_role_id := (SELECT `id` FROM `fw_glob_roles` WHERE `code` = 'worker' LIMIT 1);

UPDATE `fw_users` u
INNER JOIN `fw_glob_roles` r ON r.`id` = u.`role_id`
SET
  u.`status` = 0,
  u.`archived_at` = COALESCE(u.`archived_at`, NOW()),
  -- invitation_status is ENUM(invited, registered, expired); 'archived' was stored as ''
  -- and hid these rows from the Team list. archived_at already marks them.
  u.`role_id` = @worker_role_id,
  u.`updated_at` = NOW()
WHERE r.`code` IN ('contractor', 'inspector')
  AND @worker_role_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 6. Remove login roles
-- ---------------------------------------------------------------------------

DELETE FROM `fw_glob_roles`
WHERE `code` IN ('contractor', 'inspector');

-- Drop temp mapping columns (optional; keep if you need re-runs — uncomment after verified)
-- ALTER TABLE `fw_contractors` DROP COLUMN `legacy_user_id`;
-- ALTER TABLE `fw_inspectors` DROP COLUMN `legacy_user_id`;

-- Report
SELECT 'contractors' AS kind, COUNT(*) AS cnt FROM `fw_contractors`
UNION ALL
SELECT 'inspectors', COUNT(*) FROM `fw_inspectors`
UNION ALL
SELECT 'tasks_contractor', COUNT(*) FROM `fw_prj_tasks` WHERE `executor_type` = 'contractor'
UNION ALL
SELECT 'tasks_user', COUNT(*) FROM `fw_prj_tasks` WHERE `executor_type` = 'user'
UNION ALL
SELECT 'roles_left', COUNT(*) FROM `fw_glob_roles`;

SELECT `id`, `code`, `name` FROM `fw_glob_roles` ORDER BY `id`;

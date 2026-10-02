-- Align fw_contractors with Justin's contractor spreadsheet columns.
-- Spreadsheet: First Name | Last Name | Email | Cell | Specialization | Business Name

ALTER TABLE `fw_contractors`
  ADD COLUMN `first_name` VARCHAR(100) NULL AFTER `id`,
  ADD COLUMN `last_name` VARCHAR(100) NULL AFTER `first_name`;

-- Backfill from existing display name (best-effort: first token / rest)
UPDATE `fw_contractors`
SET
  `first_name` = NULLIF(TRIM(SUBSTRING_INDEX(`name`, ' ', 1)), ''),
  `last_name` = NULLIF(
    TRIM(
      CASE
        WHEN LOCATE(' ', `name`) > 0 THEN SUBSTRING(`name`, LOCATE(' ', `name`) + 1)
        ELSE ''
      END
    ),
    ''
  )
WHERE (`first_name` IS NULL OR TRIM(`first_name`) = '')
  AND `name` IS NOT NULL
  AND TRIM(`name`) <> '';

-- Widen trade for longer specialization labels
ALTER TABLE `fw_contractors`
  MODIFY COLUMN `trade` VARCHAR(150) NULL
    COMMENT 'Specialization / trade from contractor list';

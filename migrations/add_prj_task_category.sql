-- Add task category to project tasks (same meaning as fw_task_templates.category).
-- Backfill existing rows by matching task name to a template name.
--
-- If ALTER/INDEX already succeeded and only UPDATE failed (collation mix),
-- skip the ALTER / CREATE INDEX and run from the UPDATE statement only.

ALTER TABLE `fw_prj_tasks`
  ADD COLUMN `category` VARCHAR(100) NULL
    COMMENT 'Task category for filtering (from fw_task_templates.category when created from template)'
    AFTER `name`;

CREATE INDEX `idx_fw_prj_tasks_category` ON `fw_prj_tasks` (`category`);

-- Fill category from templates when names match (prefer lowest template id on duplicates).
-- COLLATE fixes Illegal mix of collations between fw_prj_tasks.name and fw_task_templates.name.
UPDATE `fw_prj_tasks` t
INNER JOIN (
  SELECT
    TRIM(`name`) COLLATE utf8mb4_unicode_ci AS tmpl_name,
    MIN(`id`) AS template_id
  FROM `fw_task_templates`
  WHERE `category` IS NOT NULL
    AND TRIM(`category`) <> ''
    AND `name` IS NOT NULL
    AND TRIM(`name`) <> ''
  GROUP BY TRIM(`name`) COLLATE utf8mb4_unicode_ci
) pick ON pick.tmpl_name = (TRIM(t.`name`) COLLATE utf8mb4_unicode_ci)
INNER JOIN `fw_task_templates` tmpl ON tmpl.`id` = pick.template_id
SET t.`category` = NULLIF(TRIM(tmpl.`category`), '')
WHERE t.`category` IS NULL
   OR TRIM(t.`category`) = '';

-- Report
SELECT
  COUNT(*) AS total_tasks,
  SUM(CASE WHEN `category` IS NOT NULL AND TRIM(`category`) <> '' THEN 1 ELSE 0 END) AS with_category,
  SUM(CASE WHEN `category` IS NULL OR TRIM(`category`) = '' THEN 1 ELSE 0 END) AS without_category
FROM `fw_prj_tasks`;

SELECT `category`, COUNT(*) AS cnt
FROM `fw_prj_tasks`
WHERE `category` IS NOT NULL AND TRIM(`category`) <> ''
GROUP BY `category`
ORDER BY cnt DESC;

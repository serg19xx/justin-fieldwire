-- Add geo defaults to fw_pharmacist (no address data in legacy schema).
-- Defaults: Canada / Ontario / NULL address.
-- When linked to fw_pharma, inherit pharmacy geo when available.

ALTER TABLE `fw_pharmacist`
  ADD COLUMN `country` VARCHAR(100) NULL DEFAULT 'Canada',
  ADD COLUMN `region` VARCHAR(100) NULL DEFAULT 'Ontario',
  ADD COLUMN `fullAddress` TEXT NULL;

UPDATE `fw_pharmacist`
SET
  `country` = 'Canada',
  `region` = 'Ontario',
  `fullAddress` = NULL;

-- Keep fullAddress NULL on pharmacist rows; geo for GTA comes from fw_pharma join in fw_client_leads.
UPDATE `fw_pharmacist` p
INNER JOIN `fw_pharma` ph ON ph.`id` = p.`pharmId`
SET
  p.`country` = COALESCE(NULLIF(TRIM(ph.`country`), ''), 'Canada'),
  p.`region` = COALESCE(NULLIF(TRIM(ph.`region`), ''), 'Ontario');

-- Verify
SELECT
  COUNT(*) AS total,
  SUM(`country` = 'Canada') AS country_canada,
  SUM(`region` = 'Ontario' OR LOWER(`region`) LIKE '%ontario%') AS region_ontario,
  SUM(`fullAddress` IS NULL OR TRIM(`fullAddress`) = '') AS address_empty
FROM `fw_pharmacist`;

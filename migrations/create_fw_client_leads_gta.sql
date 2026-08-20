-- Unified GTA/Toronto lead table from all fw_* client sources.
-- Prerequisite: verification quality filled; fw_pharmacist geo columns added.

DROP TABLE IF EXISTS `fw_client_leads`;

CREATE TABLE `fw_client_leads` (
  `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `source_table` ENUM('pharma','physician','pharmacist','medical_clinic') NOT NULL,
  `source_id` BIGINT(20) UNSIGNED NOT NULL,
  `entity_type` VARCHAR(32) NOT NULL,
  `display_name` VARCHAR(255) NOT NULL,
  `contact_name` VARCHAR(255) DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(64) DEFAULT NULL,
  `fax` VARCHAR(64) DEFAULT NULL,
  `country` VARCHAR(100) DEFAULT NULL,
  `region` VARCHAR(100) DEFAULT NULL,
  `city` VARCHAR(100) DEFAULT NULL,
  `full_address` TEXT DEFAULT NULL,
  `postal` VARCHAR(32) DEFAULT NULL,
  `specialty` VARCHAR(255) DEFAULT NULL COMMENT 'From fw_physician.specialty',
  `clinic_type` VARCHAR(255) DEFAULT NULL COMMENT 'From fw_medical_clinic.clinicType',
  `email_quality` VARCHAR(16) NOT NULL DEFAULT 'empty',
  `phone_quality` VARCHAR(16) NOT NULL DEFAULT 'empty',
  `contact_quality` VARCHAR(16) NOT NULL DEFAULT 'invalid',
  `lead_status` VARCHAR(32) NOT NULL DEFAULT 'new',
  `target_market` VARCHAR(32) NOT NULL DEFAULT 'gta_toronto',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_fw_client_leads_source` (`source_table`, `source_id`),
  KEY `idx_fw_client_leads_lead_status` (`lead_status`),
  KEY `idx_fw_client_leads_contact_quality` (`contact_quality`),
  KEY `idx_fw_client_leads_target_market` (`target_market`),
  KEY `idx_fw_client_leads_email` (`email`),
  KEY `idx_fw_client_leads_specialty` (`specialty`),
  KEY `idx_fw_client_leads_clinic_type` (`clinic_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- GTA / Toronto metro filter helper (inline in each INSERT):
-- Ontario + (Toronto/GTA city OR Toronto in address OR M/L postal prefix)

INSERT INTO `fw_client_leads` (
  `source_table`, `source_id`, `entity_type`, `display_name`, `contact_name`,
  `email`, `phone`, `fax`, `country`, `region`, `city`, `full_address`, `postal`,
  `specialty`, `clinic_type`,
  `email_quality`, `phone_quality`, `contact_quality`, `lead_status`, `target_market`
)
SELECT
  'pharma',
  p.`id`,
  'pharmacy',
  COALESCE(NULLIF(TRIM(p.`operName`), ''), NULLIF(TRIM(p.`legalName`), ''), CONCAT('Pharmacy #', p.`id`)),
  NULLIF(TRIM(p.`contact`), ''),
  NULLIF(TRIM(p.`email`), ''),
  NULLIF(TRIM(COALESCE(NULLIF(p.`phone`, ''), p.`cell`)), ''),
  NULLIF(TRIM(p.`fax`), ''),
  NULLIF(TRIM(p.`country`), ''),
  NULLIF(TRIM(p.`region`), ''),
  NULLIF(TRIM(p.`city`), ''),
  NULLIF(TRIM(p.`fullAddress`), ''),
  NULLIF(TRIM(p.`postcode`), ''),
  NULL,
  NULL,
  p.`email_quality`,
  p.`phone_quality`,
  p.`contact_quality`,
  'new',
  'gta_toronto'
FROM `fw_pharma` p
WHERE p.`contact_quality` = 'valid'
  AND (
    LOWER(TRIM(COALESCE(p.`region`, ''))) LIKE '%ontario%'
    OR LOWER(TRIM(COALESCE(p.`region`, ''))) IN ('on', 'ont')
    OR LOWER(TRIM(COALESCE(p.`country`, ''))) IN ('canada', 'ca', 'can')
  )
  AND (
    LOWER(TRIM(COALESCE(p.`city`, ''))) LIKE '%toronto%'
    OR LOWER(TRIM(COALESCE(p.`city`, ''))) IN (
      'mississauga', 'brampton', 'markham', 'vaughan', 'richmond hill',
      'oakville', 'burlington', 'pickering', 'ajax', 'whitby', 'oshawa',
      'newmarket', 'aurora', 'milton', 'scarborough', 'north york',
      'etobicoke', 'hamilton', 'thornhill', 'woodbridge', 'concord'
    )
    OR LOWER(TRIM(COALESCE(p.`fullAddress`, ''))) LIKE '%toronto%'
    OR UPPER(TRIM(COALESCE(p.`postcode`, ''))) REGEXP '^[ML][0-9A-Z]'
  );

INSERT INTO `fw_client_leads` (
  `source_table`, `source_id`, `entity_type`, `display_name`, `contact_name`,
  `email`, `phone`, `fax`, `country`, `region`, `city`, `full_address`, `postal`,
  `specialty`, `clinic_type`,
  `email_quality`, `phone_quality`, `contact_quality`, `lead_status`, `target_market`
)
SELECT
  'physician',
  p.`id`,
  'physician',
  TRIM(CONCAT(COALESCE(NULLIF(TRIM(p.`prefTitle`), ''), ''), ' ', COALESCE(NULLIF(TRIM(p.`fullName`), ''), CONCAT('Physician #', p.`id`)))),
  NULLIF(TRIM(p.`company`), ''),
  NULLIF(TRIM(p.`email`), ''),
  NULLIF(TRIM(COALESCE(NULLIF(p.`cellPhone`, ''), p.`officePhone`)), ''),
  NULLIF(TRIM(p.`faxNumber`), ''),
  NULLIF(TRIM(p.`country`), ''),
  NULLIF(TRIM(p.`region`), ''),
  NULLIF(TRIM(p.`city`), ''),
  NULLIF(TRIM(p.`fullAddress`), ''),
  NULLIF(TRIM(p.`postal`), ''),
  NULLIF(TRIM(p.`specialty`), ''),
  NULL,
  p.`email_quality`,
  p.`phone_quality`,
  p.`contact_quality`,
  'new',
  'gta_toronto'
FROM `fw_physician` p
WHERE p.`contact_quality` = 'valid'
  AND (
    LOWER(TRIM(COALESCE(p.`region`, ''))) LIKE '%ontario%'
    OR LOWER(TRIM(COALESCE(p.`region`, ''))) IN ('on', 'ont')
    OR LOWER(TRIM(COALESCE(p.`country`, ''))) IN ('canada', 'ca', 'can')
  )
  AND (
    LOWER(TRIM(COALESCE(p.`city`, ''))) LIKE '%toronto%'
    OR LOWER(TRIM(COALESCE(p.`city`, ''))) IN (
      'mississauga', 'brampton', 'markham', 'vaughan', 'richmond hill',
      'oakville', 'burlington', 'pickering', 'ajax', 'whitby', 'oshawa',
      'newmarket', 'aurora', 'milton', 'scarborough', 'north york',
      'etobicoke', 'hamilton', 'thornhill', 'woodbridge', 'concord'
    )
    OR LOWER(TRIM(COALESCE(p.`fullAddress`, ''))) LIKE '%toronto%'
    OR UPPER(TRIM(COALESCE(p.`postal`, ''))) REGEXP '^[ML][0-9A-Z]'
  );

INSERT INTO `fw_client_leads` (
  `source_table`, `source_id`, `entity_type`, `display_name`, `contact_name`,
  `email`, `phone`, `fax`, `country`, `region`, `city`, `full_address`, `postal`,
  `specialty`, `clinic_type`,
  `email_quality`, `phone_quality`, `contact_quality`, `lead_status`, `target_market`
)
SELECT
  'pharmacist',
  p.`id`,
  'pharmacist',
  COALESCE(NULLIF(TRIM(p.`fullName`), ''), CONCAT('Pharmacist #', p.`id`)),
  NULLIF(TRIM(p.`workplace`), ''),
  NULLIF(TRIM(p.`email`), ''),
  NULLIF(TRIM(p.`cell_phone`), ''),
  NULL,
  COALESCE(NULLIF(TRIM(p.`country`), ''), 'Canada'),
  COALESCE(NULLIF(TRIM(p.`region`), ''), 'Ontario'),
  COALESCE(NULLIF(TRIM(ph.`city`), ''), NULL),
  NULLIF(TRIM(COALESCE(p.`fullAddress`, ph.`fullAddress`, '')), ''),
  NULLIF(TRIM(ph.`postcode`), ''),
  NULL,
  NULL,
  p.`email_quality`,
  p.`phone_quality`,
  p.`contact_quality`,
  'new',
  'gta_toronto'
FROM `fw_pharmacist` p
LEFT JOIN `fw_pharma` ph ON ph.`id` = p.`pharmId`
WHERE p.`contact_quality` = 'valid'
  AND (
    LOWER(TRIM(COALESCE(p.`region`, ph.`region`, ''))) LIKE '%ontario%'
    OR LOWER(TRIM(COALESCE(p.`region`, ph.`region`, ''))) IN ('on', 'ont')
    OR LOWER(TRIM(COALESCE(p.`country`, ph.`country`, ''))) IN ('canada', 'ca', 'can')
  )
  AND (
    LOWER(TRIM(COALESCE(ph.`city`, ''))) LIKE '%toronto%'
    OR LOWER(TRIM(COALESCE(ph.`city`, ''))) IN (
      'mississauga', 'brampton', 'markham', 'vaughan', 'richmond hill',
      'oakville', 'burlington', 'pickering', 'ajax', 'whitby', 'oshawa',
      'newmarket', 'aurora', 'milton', 'scarborough', 'north york',
      'etobicoke', 'hamilton', 'thornhill', 'woodbridge', 'concord'
    )
    OR LOWER(TRIM(COALESCE(ph.`fullAddress`, p.`fullAddress`, ''))) LIKE '%toronto%'
    OR UPPER(TRIM(COALESCE(ph.`postcode`, ''))) REGEXP '^[ML][0-9A-Z]'
    OR LOWER(TRIM(COALESCE(p.`workplace`, ''))) LIKE '%toronto%'
  );

INSERT INTO `fw_client_leads` (
  `source_table`, `source_id`, `entity_type`, `display_name`, `contact_name`,
  `email`, `phone`, `fax`, `country`, `region`, `city`, `full_address`, `postal`,
  `specialty`, `clinic_type`,
  `email_quality`, `phone_quality`, `contact_quality`, `lead_status`, `target_market`
)
SELECT
  'medical_clinic',
  p.`id`,
  'clinic',
  COALESCE(NULLIF(TRIM(p.`clinicName`), ''), CONCAT('Clinic #', p.`id`)),
  NULLIF(TRIM(p.`contactName`), ''),
  NULLIF(TRIM(p.`email`), ''),
  NULLIF(TRIM(p.`phone`), ''),
  NULLIF(TRIM(p.`fax`), ''),
  NULLIF(TRIM(p.`country`), ''),
  NULLIF(TRIM(p.`region`), ''),
  NULLIF(TRIM(p.`city`), ''),
  NULLIF(TRIM(p.`fullAddress`), ''),
  NULLIF(TRIM(p.`postal`), ''),
  NULL,
  NULLIF(TRIM(p.`clinicType`), ''),
  p.`email_quality`,
  p.`phone_quality`,
  p.`contact_quality`,
  'new',
  'gta_toronto'
FROM `fw_medical_clinic` p
WHERE p.`contact_quality` = 'valid'
  AND (
    LOWER(TRIM(COALESCE(p.`region`, ''))) LIKE '%ontario%'
    OR LOWER(TRIM(COALESCE(p.`region`, ''))) IN ('on', 'ont')
    OR LOWER(TRIM(COALESCE(p.`country`, ''))) IN ('canada', 'ca', 'can')
  )
  AND (
    LOWER(TRIM(COALESCE(p.`city`, ''))) LIKE '%toronto%'
    OR LOWER(TRIM(COALESCE(p.`city`, ''))) IN (
      'mississauga', 'brampton', 'markham', 'vaughan', 'richmond hill',
      'oakville', 'burlington', 'pickering', 'ajax', 'whitby', 'oshawa',
      'newmarket', 'aurora', 'milton', 'scarborough', 'north york',
      'etobicoke', 'hamilton', 'thornhill', 'woodbridge', 'concord'
    )
    OR LOWER(TRIM(COALESCE(p.`fullAddress`, ''))) LIKE '%toronto%'
    OR UPPER(TRIM(COALESCE(p.`postal`, ''))) REGEXP '^[ML][0-9A-Z]'
  );

-- Report
SELECT
  `source_table`,
  `entity_type`,
  COUNT(*) AS lead_count
FROM `fw_client_leads`
GROUP BY `source_table`, `entity_type`
ORDER BY `source_table`;

SELECT COUNT(*) AS total_gta_leads FROM `fw_client_leads`;

SELECT `lead_status`, COUNT(*) AS cnt
FROM `fw_client_leads`
GROUP BY `lead_status`;

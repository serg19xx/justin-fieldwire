-- Normalize client phone fields in fw_* tables to NA E.164: +1XXXXXXXXXX
-- Only rewrites values that clean to 10 digits or 11 digits starting with 1.
-- Empty / whitespace → NULL. Unparseable values are left unchanged.
--
-- Columns:
--   fw_pharma:          phone, cell, fax, twilioPhone
--   fw_physician:       cellPhone, officePhone, faxNumber
--   fw_pharmacist:      cell_phone
--   fw_medical_clinic:  phone, fax

-- fw_pharma.phone
UPDATE `fw_pharma`
SET `phone` = CASE
  WHEN `phone` IS NULL OR TRIM(`phone`) = '' THEN NULL
  WHEN LENGTH(REGEXP_REPLACE(`phone`, '[^0-9]', '')) = 10
    THEN CONCAT('+1', REGEXP_REPLACE(`phone`, '[^0-9]', ''))
  WHEN LENGTH(REGEXP_REPLACE(`phone`, '[^0-9]', '')) = 11
       AND LEFT(REGEXP_REPLACE(`phone`, '[^0-9]', ''), 1) = '1'
    THEN CONCAT('+', REGEXP_REPLACE(`phone`, '[^0-9]', ''))
  ELSE `phone`
END
WHERE `phone` IS NOT NULL;

-- fw_pharma.cell
UPDATE `fw_pharma`
SET `cell` = CASE
  WHEN `cell` IS NULL OR TRIM(`cell`) = '' THEN NULL
  WHEN LENGTH(REGEXP_REPLACE(`cell`, '[^0-9]', '')) = 10
    THEN CONCAT('+1', REGEXP_REPLACE(`cell`, '[^0-9]', ''))
  WHEN LENGTH(REGEXP_REPLACE(`cell`, '[^0-9]', '')) = 11
       AND LEFT(REGEXP_REPLACE(`cell`, '[^0-9]', ''), 1) = '1'
    THEN CONCAT('+', REGEXP_REPLACE(`cell`, '[^0-9]', ''))
  ELSE `cell`
END
WHERE `cell` IS NOT NULL;

-- fw_pharma.fax
UPDATE `fw_pharma`
SET `fax` = CASE
  WHEN `fax` IS NULL OR TRIM(`fax`) = '' THEN NULL
  WHEN LENGTH(REGEXP_REPLACE(`fax`, '[^0-9]', '')) = 10
    THEN CONCAT('+1', REGEXP_REPLACE(`fax`, '[^0-9]', ''))
  WHEN LENGTH(REGEXP_REPLACE(`fax`, '[^0-9]', '')) = 11
       AND LEFT(REGEXP_REPLACE(`fax`, '[^0-9]', ''), 1) = '1'
    THEN CONCAT('+', REGEXP_REPLACE(`fax`, '[^0-9]', ''))
  ELSE `fax`
END
WHERE `fax` IS NOT NULL;

-- fw_pharma.twilioPhone
UPDATE `fw_pharma`
SET `twilioPhone` = CASE
  WHEN `twilioPhone` IS NULL OR TRIM(`twilioPhone`) = '' THEN NULL
  WHEN LENGTH(REGEXP_REPLACE(`twilioPhone`, '[^0-9]', '')) = 10
    THEN CONCAT('+1', REGEXP_REPLACE(`twilioPhone`, '[^0-9]', ''))
  WHEN LENGTH(REGEXP_REPLACE(`twilioPhone`, '[^0-9]', '')) = 11
       AND LEFT(REGEXP_REPLACE(`twilioPhone`, '[^0-9]', ''), 1) = '1'
    THEN CONCAT('+', REGEXP_REPLACE(`twilioPhone`, '[^0-9]', ''))
  ELSE `twilioPhone`
END
WHERE `twilioPhone` IS NOT NULL;

-- fw_physician.cellPhone
UPDATE `fw_physician`
SET `cellPhone` = CASE
  WHEN `cellPhone` IS NULL OR TRIM(`cellPhone`) = '' THEN NULL
  WHEN LENGTH(REGEXP_REPLACE(`cellPhone`, '[^0-9]', '')) = 10
    THEN CONCAT('+1', REGEXP_REPLACE(`cellPhone`, '[^0-9]', ''))
  WHEN LENGTH(REGEXP_REPLACE(`cellPhone`, '[^0-9]', '')) = 11
       AND LEFT(REGEXP_REPLACE(`cellPhone`, '[^0-9]', ''), 1) = '1'
    THEN CONCAT('+', REGEXP_REPLACE(`cellPhone`, '[^0-9]', ''))
  ELSE `cellPhone`
END
WHERE `cellPhone` IS NOT NULL;

-- fw_physician.officePhone
UPDATE `fw_physician`
SET `officePhone` = CASE
  WHEN `officePhone` IS NULL OR TRIM(`officePhone`) = '' THEN NULL
  WHEN LENGTH(REGEXP_REPLACE(`officePhone`, '[^0-9]', '')) = 10
    THEN CONCAT('+1', REGEXP_REPLACE(`officePhone`, '[^0-9]', ''))
  WHEN LENGTH(REGEXP_REPLACE(`officePhone`, '[^0-9]', '')) = 11
       AND LEFT(REGEXP_REPLACE(`officePhone`, '[^0-9]', ''), 1) = '1'
    THEN CONCAT('+', REGEXP_REPLACE(`officePhone`, '[^0-9]', ''))
  ELSE `officePhone`
END
WHERE `officePhone` IS NOT NULL;

-- fw_physician.faxNumber
UPDATE `fw_physician`
SET `faxNumber` = CASE
  WHEN `faxNumber` IS NULL OR TRIM(`faxNumber`) = '' THEN NULL
  WHEN LENGTH(REGEXP_REPLACE(`faxNumber`, '[^0-9]', '')) = 10
    THEN CONCAT('+1', REGEXP_REPLACE(`faxNumber`, '[^0-9]', ''))
  WHEN LENGTH(REGEXP_REPLACE(`faxNumber`, '[^0-9]', '')) = 11
       AND LEFT(REGEXP_REPLACE(`faxNumber`, '[^0-9]', ''), 1) = '1'
    THEN CONCAT('+', REGEXP_REPLACE(`faxNumber`, '[^0-9]', ''))
  ELSE `faxNumber`
END
WHERE `faxNumber` IS NOT NULL;

-- fw_pharmacist.cell_phone
UPDATE `fw_pharmacist`
SET `cell_phone` = CASE
  WHEN `cell_phone` IS NULL OR TRIM(`cell_phone`) = '' THEN NULL
  WHEN LENGTH(REGEXP_REPLACE(`cell_phone`, '[^0-9]', '')) = 10
    THEN CONCAT('+1', REGEXP_REPLACE(`cell_phone`, '[^0-9]', ''))
  WHEN LENGTH(REGEXP_REPLACE(`cell_phone`, '[^0-9]', '')) = 11
       AND LEFT(REGEXP_REPLACE(`cell_phone`, '[^0-9]', ''), 1) = '1'
    THEN CONCAT('+', REGEXP_REPLACE(`cell_phone`, '[^0-9]', ''))
  ELSE `cell_phone`
END
WHERE `cell_phone` IS NOT NULL;

-- fw_medical_clinic.phone
UPDATE `fw_medical_clinic`
SET `phone` = CASE
  WHEN `phone` IS NULL OR TRIM(`phone`) = '' THEN NULL
  WHEN LENGTH(REGEXP_REPLACE(`phone`, '[^0-9]', '')) = 10
    THEN CONCAT('+1', REGEXP_REPLACE(`phone`, '[^0-9]', ''))
  WHEN LENGTH(REGEXP_REPLACE(`phone`, '[^0-9]', '')) = 11
       AND LEFT(REGEXP_REPLACE(`phone`, '[^0-9]', ''), 1) = '1'
    THEN CONCAT('+', REGEXP_REPLACE(`phone`, '[^0-9]', ''))
  ELSE `phone`
END
WHERE `phone` IS NOT NULL;

-- fw_medical_clinic.fax
UPDATE `fw_medical_clinic`
SET `fax` = CASE
  WHEN `fax` IS NULL OR TRIM(`fax`) = '' THEN NULL
  WHEN LENGTH(REGEXP_REPLACE(`fax`, '[^0-9]', '')) = 10
    THEN CONCAT('+1', REGEXP_REPLACE(`fax`, '[^0-9]', ''))
  WHEN LENGTH(REGEXP_REPLACE(`fax`, '[^0-9]', '')) = 11
       AND LEFT(REGEXP_REPLACE(`fax`, '[^0-9]', ''), 1) = '1'
    THEN CONCAT('+', REGEXP_REPLACE(`fax`, '[^0-9]', ''))
  ELSE `fax`
END
WHERE `fax` IS NOT NULL;

-- Spot-check samples after run
SELECT 'fw_pharma.phone' AS col, `phone` AS sample FROM `fw_pharma` WHERE `phone` IS NOT NULL LIMIT 5;
SELECT 'fw_physician.cellPhone' AS col, `cellPhone` AS sample FROM `fw_physician` WHERE `cellPhone` IS NOT NULL LIMIT 5;
SELECT 'fw_pharmacist.cell_phone' AS col, `cell_phone` AS sample FROM `fw_pharmacist` WHERE `cell_phone` IS NOT NULL LIMIT 5;
SELECT 'fw_medical_clinic.phone' AS col, `phone` AS sample FROM `fw_medical_clinic` WHERE `phone` IS NOT NULL LIMIT 5;

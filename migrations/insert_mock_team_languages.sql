-- STEP 2: LANGUAGES (optional, run AFTER step 1 shows 115 users)
-- Requires fw_languages rows: English, French, Spanish

INSERT INTO fw_user_languages (worker_id, language_id, prof_level)
SELECT u.id, l.id, 'Fluent'
FROM fw_users u
INNER JOIN fw_languages l ON l.name = 'English'
WHERE u.email LIKE '%@fwtest.medicalcontractor.ca'
  AND NOT EXISTS (
    SELECT 1 FROM fw_user_languages ul WHERE ul.worker_id = u.id AND ul.language_id = l.id
  );

SELECT COUNT(*) AS mock_language_rows
FROM fw_user_languages ul
INNER JOIN fw_users u ON u.id = ul.worker_id
WHERE u.email LIKE '%@fwtest.medicalcontractor.ca';

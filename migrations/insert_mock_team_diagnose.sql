-- Run this FIRST to find why inserts fail.
-- DBeaver: Ctrl+A -> Alt+X (Execute Script)

-- 1) Roles must be: foreman=12, worker=13, contractor=14
SELECT id, code, name FROM fw_glob_roles
WHERE code IN ('foreman', 'worker', 'contractor')
ORDER BY id;

-- 2) How many mock users exist now (expect 0 before import)
SELECT COUNT(*) AS mock_users_now
FROM fw_users
WHERE email LIKE '%@fwtest.medicalcontractor.ca';

-- 3) Insert ONE test user (delete first if re-running)
DELETE FROM fw_users WHERE email = 'test1@fwtest.medicalcontractor.ca';

INSERT INTO fw_users (
  email, password_hash, first_name, last_name, dob, gender,
  nationality, country_of_origin, workforce_group, phone,
  role_id, job_title, city, status, status_changed_at,
  invitation_status, registration_completed_at, two_factor_enabled,
  created_at, updated_at
) VALUES (
  'test1@fwtest.medicalcontractor.ca',
  '$2y$12$/jZZoX.9Rr4ksrzC9QLeMOfkGzBvX3yvRLOzIhIe8tOKdPXnWIlhK',
  'Test', 'User', '1990-01-15', 'Male',
  'Canadian', 'Canada', 'north_american', '+14165559999',
  14, 'HVAC', 'Toronto', 1, NOW(),
  'registered', NOW(), 0, NOW(), NOW()
);

-- 4) Must return 1
SELECT id, email, role_id, job_title
FROM fw_users
WHERE email = 'test1@fwtest.medicalcontractor.ca';

-- last_login had ON UPDATE CURRENT_TIMESTAMP, so any profile/admin edit overwrote it.
-- It is now written only by the login flow; NULL means the user never logged in.

ALTER TABLE `fw_users`
  MODIFY `last_login` TIMESTAMP NULL DEFAULT NULL;

-- Rebuild values from the audit log (created_at there is UTC, fw_users uses DB local time).
UPDATE `fw_users` u
LEFT JOIN (
  SELECT `user_id`, MAX(`created_at`) AS `last_login_utc`
  FROM `fw_user_audit_log`
  WHERE `action_type` = 'login' AND `success` = 1
  GROUP BY `user_id`
) a ON a.`user_id` = u.`id`
SET u.`last_login` = CASE
  WHEN a.`last_login_utc` IS NULL THEN NULL
  ELSE DATE_ADD(a.`last_login_utc`, INTERVAL TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), NOW()) SECOND)
END;

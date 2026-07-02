-- Foreman field submission columns (see justin-fieldwire-api/scripts/add-task-field-submitted-fields.sql)
-- Run on production DB before using POST .../tasks/{id}/submit

ALTER TABLE fw_prj_tasks
  ADD COLUMN field_submitted_at DATETIME NULL DEFAULT NULL,
  ADD COLUMN field_submitted_by BIGINT UNSIGNED NULL DEFAULT NULL;

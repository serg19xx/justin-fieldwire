-- Foreman field work columns (see justin-fieldwire-api/scripts/add-task-field-work-columns.sql)

ALTER TABLE fw_prj_tasks
  ADD COLUMN field_work_started_at DATETIME NULL DEFAULT NULL,
  ADD COLUMN field_work_ended_at DATETIME NULL DEFAULT NULL,
  ADD COLUMN field_notes TEXT NULL DEFAULT NULL;

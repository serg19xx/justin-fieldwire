-- See justin-fieldwire-api/scripts/add-task-field-work-reason-columns.sql

ALTER TABLE fw_prj_tasks
  ADD COLUMN field_work_start_reason TEXT NULL DEFAULT NULL,
  ADD COLUMN field_work_end_reason TEXT NULL DEFAULT NULL;

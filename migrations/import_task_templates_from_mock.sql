-- Migration: Import task templates from mock data
-- Purpose: Import 206 task templates from mock data into database
-- Date: 2025-01-XX
-- Note: This file should be generated from task-templates.json
--       Run: node scripts/generate-import-sql.js

-- Example structure (actual data will be generated from JSON):
-- INSERT INTO `fw_task_templates` 
--   (`name`, `category`, `duration_days`, `start_offset_days`, `milestone`, `status`, `task_order`)
-- VALUES
--   ('Client Business Planning Meeting 1', 'Planning & Design', 3, 0, 'meeting', 'planned', 1),
--   ('Client Business Planning Meeting 2', 'Planning & Design', 3, 3, 'meeting', 'planned', 2),
--   -- ... (all 206 templates)
-- ;

-- To generate this file, use the following approach:
-- 1. Read task-templates.json
-- 2. Generate INSERT statements for each template
-- 3. Save to this file

-- Or use the import API endpoint:
-- POST /api/v1/task-templates/import
-- Body: { templates: TaskTemplate[] }


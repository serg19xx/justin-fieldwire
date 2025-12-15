-- Migration: Create task_templates table
-- Purpose: Store task templates for quick task creation
-- Date: 2025-01-XX

-- Create task_templates table
CREATE TABLE IF NOT EXISTS `fw_task_templates` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL COMMENT 'Task template name',
  `description` TEXT NULL COMMENT 'Optional description of the template',
  `category` VARCHAR(100) NULL COMMENT 'Category for grouping templates (e.g., "Planning & Design", "HVAC", "Plumbing")',
  `duration_days` INT UNSIGNED NULL COMMENT 'Duration in days (if known)',
  `start_offset_days` INT NULL COMMENT 'Days from project start (NULL = must be set manually)',
  `end_offset_days` INT NULL COMMENT 'Days from project start for end date (alternative to duration)',
  `milestone` VARCHAR(50) NULL COMMENT 'Milestone type: inspection, visit, meeting, review, delivery, approval, other, or NULL for regular task',
  `status` VARCHAR(50) DEFAULT 'planned' COMMENT 'Default task status: planned, scheduled, scheduled_accepted, in_progress, partially_completed, delayed_due_to_issue, ready_for_inspection, completed',
  `notes` TEXT NULL COMMENT 'Additional notes for the template',
  `wbs_path` VARCHAR(100) NULL COMMENT 'Work breakdown structure path (e.g., "1.1.1")',
  `task_order` INT UNSIGNED NULL COMMENT 'Order in template sequence for sorting',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
  
  -- Indexes for common queries
  INDEX `idx_category` (`category`),
  INDEX `idx_task_order` (`task_order`),
  INDEX `idx_milestone` (`milestone`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Task templates for quick task creation';

-- Add constraints for milestone values
ALTER TABLE `fw_task_templates`
ADD CONSTRAINT `chk_milestone_type` CHECK (
  `milestone` IS NULL OR 
  `milestone` IN ('inspection', 'visit', 'meeting', 'review', 'delivery', 'approval', 'other')
);

-- Add constraints for status values
ALTER TABLE `fw_task_templates`
ADD CONSTRAINT `chk_status_type` CHECK (
  `status` IN ('planned', 'scheduled', 'scheduled_accepted', 'in_progress', 'partially_completed', 'delayed_due_to_issue', 'ready_for_inspection', 'completed')
);


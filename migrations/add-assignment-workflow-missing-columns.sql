USE medconsult_liberia;

SET @db_name = DATABASE();

-- Utility pattern: conditionally add column when missing (MySQL versions without ADD COLUMN IF NOT EXISTS).
SET @has = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = 'assignment_requests' AND COLUMN_NAME = 'consultant_id');
SET @sql = IF(@has = 0, 'ALTER TABLE assignment_requests ADD COLUMN consultant_id INT NULL', 'SELECT "assignment_requests.consultant_id exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = 'assignment_requests' AND COLUMN_NAME = 'assigned_at');
SET @sql = IF(@has = 0, 'ALTER TABLE assignment_requests ADD COLUMN assigned_at TIMESTAMP NULL', 'SELECT "assignment_requests.assigned_at exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = 'assignment_requests' AND COLUMN_NAME = 'deadline_reminder_sent');
SET @sql = IF(@has = 0, 'ALTER TABLE assignment_requests ADD COLUMN deadline_reminder_sent TINYINT(1) DEFAULT 0', 'SELECT "assignment_requests.deadline_reminder_sent exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = 'assignment_requests' AND COLUMN_NAME = 'overdue_notification_sent');
SET @sql = IF(@has = 0, 'ALTER TABLE assignment_requests ADD COLUMN overdue_notification_sent TINYINT(1) DEFAULT 0', 'SELECT "assignment_requests.overdue_notification_sent exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = 'assignment_requests' AND COLUMN_NAME = 'work_file_data');
SET @sql = IF(@has = 0, 'ALTER TABLE assignment_requests ADD COLUMN work_file_data LONGBLOB NULL', 'SELECT "assignment_requests.work_file_data exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = 'assignment_requests' AND COLUMN_NAME = 'work_filename');
SET @sql = IF(@has = 0, 'ALTER TABLE assignment_requests ADD COLUMN work_filename VARCHAR(255) NULL', 'SELECT "assignment_requests.work_filename exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = 'assignment_requests' AND COLUMN_NAME = 'work_file_size');
SET @sql = IF(@has = 0, 'ALTER TABLE assignment_requests ADD COLUMN work_file_size INT NULL', 'SELECT "assignment_requests.work_file_size exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = 'assignment_requests' AND COLUMN_NAME = 'work_file_type');
SET @sql = IF(@has = 0, 'ALTER TABLE assignment_requests ADD COLUMN work_file_type VARCHAR(100) NULL', 'SELECT "assignment_requests.work_file_type exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = 'assignment_requests' AND COLUMN_NAME = 'work_submitted_at');
SET @sql = IF(@has = 0, 'ALTER TABLE assignment_requests ADD COLUMN work_submitted_at TIMESTAMP NULL', 'SELECT "assignment_requests.work_submitted_at exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = 'assignment_requests' AND COLUMN_NAME = 'work_notes');
SET @sql = IF(@has = 0, 'ALTER TABLE assignment_requests ADD COLUMN work_notes TEXT NULL', 'SELECT "assignment_requests.work_notes exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = 'assignment_requests' AND COLUMN_NAME = 'final_submission_data');
SET @sql = IF(@has = 0, 'ALTER TABLE assignment_requests ADD COLUMN final_submission_data LONGBLOB NULL', 'SELECT "assignment_requests.final_submission_data exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = 'assignment_requests' AND COLUMN_NAME = 'final_submission_filename');
SET @sql = IF(@has = 0, 'ALTER TABLE assignment_requests ADD COLUMN final_submission_filename VARCHAR(255) NULL', 'SELECT "assignment_requests.final_submission_filename exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = 'assignment_requests' AND COLUMN_NAME = 'final_submission_size');
SET @sql = IF(@has = 0, 'ALTER TABLE assignment_requests ADD COLUMN final_submission_size INT NULL', 'SELECT "assignment_requests.final_submission_size exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = 'assignment_requests' AND COLUMN_NAME = 'final_submission_type');
SET @sql = IF(@has = 0, 'ALTER TABLE assignment_requests ADD COLUMN final_submission_type VARCHAR(100) NULL', 'SELECT "assignment_requests.final_submission_type exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = 'assignment_requests' AND COLUMN_NAME = 'final_submitted_at');
SET @sql = IF(@has = 0, 'ALTER TABLE assignment_requests ADD COLUMN final_submitted_at TIMESTAMP NULL', 'SELECT "assignment_requests.final_submitted_at exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = 'assignment_requests' AND COLUMN_NAME = 'final_submission_notes');
SET @sql = IF(@has = 0, 'ALTER TABLE assignment_requests ADD COLUMN final_submission_notes TEXT NULL', 'SELECT "assignment_requests.final_submission_notes exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = 'assignment_requests' AND COLUMN_NAME = 'client_review_status');
SET @sql = IF(@has = 0, 'ALTER TABLE assignment_requests ADD COLUMN client_review_status ENUM(''pending'', ''accepted'', ''rejected'') DEFAULT NULL', 'SELECT "assignment_requests.client_review_status exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = 'assignment_requests' AND COLUMN_NAME = 'client_review_notes');
SET @sql = IF(@has = 0, 'ALTER TABLE assignment_requests ADD COLUMN client_review_notes TEXT NULL', 'SELECT "assignment_requests.client_review_notes exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = 'assignment_requests' AND COLUMN_NAME = 'client_reviewed_at');
SET @sql = IF(@has = 0, 'ALTER TABLE assignment_requests ADD COLUMN client_reviewed_at TIMESTAMP NULL', 'SELECT "assignment_requests.client_reviewed_at exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

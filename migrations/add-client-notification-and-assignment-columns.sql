USE medconsult_liberia;

-- Keep assignment workflow fields compatible with dashboard/API queries.
SET @db_name = DATABASE();

SET @has_doctor_notes = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = 'assignment_requests' AND COLUMN_NAME = 'doctor_notes'
);
SET @sql = IF(@has_doctor_notes = 0,
  'ALTER TABLE assignment_requests ADD COLUMN doctor_notes TEXT NULL AFTER notes',
  'SELECT "assignment_requests.doctor_notes exists"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_client_response = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = 'assignment_requests' AND COLUMN_NAME = 'client_response'
);
SET @sql = IF(@has_client_response = 0,
  'ALTER TABLE assignment_requests ADD COLUMN client_response TEXT NULL AFTER doctor_notes',
  'SELECT "assignment_requests.client_response exists"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_rejection_reason = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = 'assignment_requests' AND COLUMN_NAME = 'rejection_reason'
);
SET @sql = IF(@has_rejection_reason = 0,
  'ALTER TABLE assignment_requests ADD COLUMN rejection_reason TEXT NULL AFTER client_response',
  'SELECT "assignment_requests.rejection_reason exists"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_negotiation_message = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = 'assignment_requests' AND COLUMN_NAME = 'negotiation_message'
);
SET @sql = IF(@has_negotiation_message = 0,
  'ALTER TABLE assignment_requests ADD COLUMN negotiation_message TEXT NULL AFTER rejection_reason',
  'SELECT "assignment_requests.negotiation_message exists"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Support client notification joins against generic messages table.
SET @has_assignment_id = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = 'messages' AND COLUMN_NAME = 'assignment_id'
);
SET @sql = IF(@has_assignment_id = 0,
  'ALTER TABLE messages ADD COLUMN assignment_id INT NULL AFTER recipient_id',
  'SELECT "messages.assignment_id exists"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_sender_role = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = 'messages' AND COLUMN_NAME = 'sender_role'
);
SET @sql = IF(@has_sender_role = 0,
  'ALTER TABLE messages ADD COLUMN sender_role VARCHAR(50) NULL AFTER assignment_id',
  'SELECT "messages.sender_role exists"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

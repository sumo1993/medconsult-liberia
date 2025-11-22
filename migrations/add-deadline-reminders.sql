-- Add columns for deadline reminder tracking
ALTER TABLE assignment_requests 
ADD COLUMN deadline_reminder_sent TINYINT(1) DEFAULT 0,
ADD COLUMN overdue_notification_sent TINYINT(1) DEFAULT 0;

-- Index already exists from previous migration
-- CREATE INDEX idx_assignment_deadline ON assignment_requests(deadline);

-- Show updated structure
DESCRIBE assignment_requests;

-- Add database indexes for better performance
-- Run this migration to optimize query performance

-- Indexes for assignment_requests table
CREATE INDEX idx_assignment_client ON assignment_requests(client_id);
CREATE INDEX idx_assignment_doctor ON assignment_requests(doctor_id);
CREATE INDEX idx_assignment_status ON assignment_requests(status);
CREATE INDEX idx_assignment_deadline ON assignment_requests(deadline);
CREATE INDEX idx_assignment_created ON assignment_requests(created_at);

-- Indexes for assignment_messages table
CREATE INDEX idx_messages_assignment ON assignment_messages(assignment_request_id);
CREATE INDEX idx_messages_sender ON assignment_messages(sender_id);
CREATE INDEX idx_messages_created ON assignment_messages(created_at);

-- Indexes for users table
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- Add missing status value to enum
ALTER TABLE assignment_requests 
MODIFY COLUMN status ENUM(
  'pending_review',
  'under_review',
  'price_proposed',
  'negotiating',
  'accepted',
  'rejected',
  'payment_pending',
  'payment_uploaded',
  'payment_verified',
  'in_progress',
  'completed',
  'cancelled',
  'revision_requested'
) NOT NULL DEFAULT 'pending_review';

-- Verify indexes were created
SHOW INDEX FROM assignment_requests;
SHOW INDEX FROM assignment_messages;
SHOW INDEX FROM users;

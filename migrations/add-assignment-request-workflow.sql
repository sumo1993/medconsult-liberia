-- Create assignment_requests table with complete workflow
CREATE TABLE IF NOT EXISTS assignment_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  doctor_id INT,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  subject VARCHAR(100),
  deadline DATE,
  attachment_filename VARCHAR(255),
  attachment_data LONGBLOB,
  attachment_size INT,
  
  -- Workflow status
  status ENUM(
    'pending_review',        -- Client submitted, waiting for doctor
    'under_review',          -- Doctor is reviewing
    'price_proposed',        -- Doctor proposed price
    'negotiating',           -- Client requested reduction
    'accepted',              -- Client accepted price
    'rejected',              -- Client rejected
    'payment_pending',       -- Waiting for payment
    'payment_uploaded',      -- Client uploaded receipt
    'payment_verified',      -- Doctor verified payment
    'in_progress',           -- Work started
    'completed',             -- Work completed
    'cancelled'              -- Cancelled
  ) DEFAULT 'pending_review',
  
  -- Pricing
  proposed_price DECIMAL(10, 2),
  negotiated_price DECIMAL(10, 2),
  final_price DECIMAL(10, 2),
  currency VARCHAR(10) DEFAULT 'USD',
  
  -- Payment
  payment_method ENUM('mobile_money', 'bank_transfer', 'cash', 'other'),
  payment_receipt_filename VARCHAR(255),
  payment_receipt_data LONGBLOB,
  payment_receipt_size INT,
  payment_verified_at DATETIME,
  
  -- Messages/Notes
  doctor_notes TEXT,
  client_response TEXT,
  rejection_reason TEXT,
  negotiation_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  reviewed_at DATETIME,
  price_proposed_at DATETIME,
  accepted_at DATETIME,
  rejected_at DATETIME,
  completed_at DATETIME,
  
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_client_id (client_id),
  INDEX idx_doctor_id (doctor_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- Create assignment_messages table for negotiation chat
CREATE TABLE IF NOT EXISTS assignment_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  assignment_request_id INT NOT NULL,
  sender_id INT NOT NULL,
  message TEXT NOT NULL,
  message_type ENUM('general', 'price_proposal', 'price_counter', 'acceptance', 'rejection') DEFAULT 'general',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (assignment_request_id) REFERENCES assignment_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_assignment_request_id (assignment_request_id),
  INDEX idx_created_at (created_at)
);

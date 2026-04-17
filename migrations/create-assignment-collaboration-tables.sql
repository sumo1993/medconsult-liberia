USE medconsult_liberia;

CREATE TABLE IF NOT EXISTS assignment_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  assignment_request_id INT NOT NULL,
  sender_id INT NOT NULL,
  message TEXT NOT NULL,
  message_type ENUM('general', 'price_proposal', 'price_counter', 'acceptance', 'rejection', 'system') DEFAULT 'general',
  attachment_data LONGBLOB NULL,
  attachment_filename VARCHAR(255) NULL,
  attachment_size INT NULL,
  attachment_type VARCHAR(100) NULL,
  reply_to_id INT NULL,
  reactions JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_assignment_request_id (assignment_request_id),
  INDEX idx_sender_id (sender_id),
  INDEX idx_reply_to_id (reply_to_id),
  CONSTRAINT fk_assignment_messages_assignment
    FOREIGN KEY (assignment_request_id) REFERENCES assignment_requests(id) ON DELETE CASCADE,
  CONSTRAINT fk_assignment_messages_sender
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_assignment_messages_reply
    FOREIGN KEY (reply_to_id) REFERENCES assignment_messages(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assignment_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  assignment_id INT NOT NULL,
  consultant_id INT NOT NULL,
  message TEXT NULL,
  status ENUM('pending', 'approved', 'rejected', 'withdrawn') DEFAULT 'pending',
  reviewed_by INT NULL,
  reviewed_at TIMESTAMP NULL,
  rejection_reason TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_assignment_consultant (assignment_id, consultant_id),
  INDEX idx_assignment_id (assignment_id),
  INDEX idx_consultant_id (consultant_id),
  INDEX idx_status (status),
  CONSTRAINT fk_assignment_applications_assignment
    FOREIGN KEY (assignment_id) REFERENCES assignment_requests(id) ON DELETE CASCADE,
  CONSTRAINT fk_assignment_applications_consultant
    FOREIGN KEY (consultant_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_assignment_applications_reviewer
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create table to track when users last read messages for each assignment
CREATE TABLE IF NOT EXISTS assignment_message_reads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  assignment_request_id INT NOT NULL,
  last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_assignment (user_id, assignment_request_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assignment_request_id) REFERENCES assignment_requests(id) ON DELETE CASCADE,
  INDEX idx_user_assignment (user_id, assignment_request_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

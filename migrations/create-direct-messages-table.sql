USE medconsult_liberia;

CREATE TABLE IF NOT EXISTS direct_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  message TEXT NOT NULL,
  attachment_data LONGBLOB NULL,
  attachment_filename VARCHAR(255) NULL,
  attachment_type VARCHAR(100) NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sender_receiver (sender_id, receiver_id),
  INDEX idx_receiver_read (receiver_id, is_read),
  INDEX idx_created_at (created_at),
  CONSTRAINT fk_direct_messages_sender
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_direct_messages_receiver
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

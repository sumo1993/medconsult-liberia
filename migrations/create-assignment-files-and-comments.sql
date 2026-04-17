USE medconsult_liberia;

CREATE TABLE IF NOT EXISTS assignment_files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  assignment_id INT NOT NULL,
  uploaded_by INT NOT NULL,
  uploader_role VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NULL,
  file_size BIGINT NULL,
  file_url VARCHAR(1000) NULL,
  file_data LONGBLOB NULL,
  description TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_assignment_id (assignment_id),
  INDEX idx_uploaded_by (uploaded_by),
  INDEX idx_created_at (created_at),
  CONSTRAINT fk_assignment_files_assignment
    FOREIGN KEY (assignment_id) REFERENCES assignment_requests(id) ON DELETE CASCADE,
  CONSTRAINT fk_assignment_files_uploaded_by
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS file_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  file_id INT NOT NULL,
  user_id INT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_file_id (file_id),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  CONSTRAINT fk_file_comments_file
    FOREIGN KEY (file_id) REFERENCES assignment_files(id) ON DELETE CASCADE,
  CONSTRAINT fk_file_comments_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

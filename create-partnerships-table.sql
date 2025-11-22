-- Create partnerships table
CREATE TABLE IF NOT EXISTS partnerships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL COMMENT 'e.g., Government, International, Healthcare, NGO',
  logo VARCHAR(500) NULL COMMENT 'URL or path to logo image',
  description TEXT NULL,
  website VARCHAR(500) NULL,
  display_order INT DEFAULT 0,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add index for faster queries
CREATE INDEX idx_status_order ON partnerships(status, display_order);

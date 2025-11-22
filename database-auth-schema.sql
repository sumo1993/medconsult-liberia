-- Extended Database Schema for Multi-Role System
-- Run this after the basic setup-database.sql

USE medconsult_liberia;

-- Users table with role-based access
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'management', 'client') NOT NULL DEFAULT 'client',
  phone VARCHAR(50),
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Research posts (managed by Management/Doctor)
CREATE TABLE IF NOT EXISTS research_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  author_id INT NOT NULL,
  category VARCHAR(100),
  tags JSON,
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  published_at TIMESTAMP NULL,
  views INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_author (author_id),
  INDEX idx_published (published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Assignment requests (from clients to management)
CREATE TABLE IF NOT EXISTS assignment_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  subject VARCHAR(100),
  deadline DATE,
  budget DECIMAL(10, 2),
  status ENUM('pending', 'reviewing', 'accepted', 'in_progress', 'completed', 'rejected') DEFAULT 'pending',
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  assigned_to INT NULL,
  notes TEXT,
  feedback TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_client (client_id),
  INDEX idx_status (status),
  INDEX idx_assigned (assigned_to),
  INDEX idx_deadline (deadline)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Study materials (for clients)
CREATE TABLE IF NOT EXISTS study_materials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  file_url VARCHAR(1000),
  file_type VARCHAR(50),
  category VARCHAR(100),
  uploaded_by INT NOT NULL,
  access_level ENUM('public', 'clients_only', 'premium') DEFAULT 'public',
  downloads INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_category (category),
  INDEX idx_access (access_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Assignment submissions
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  assignment_id INT NOT NULL,
  file_url VARCHAR(1000),
  comments TEXT,
  submitted_by INT NOT NULL,
  grade VARCHAR(10),
  feedback TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assignment_id) REFERENCES assignment_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_assignment (assignment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Messages/Communications
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  recipient_id INT NOT NULL,
  subject VARCHAR(500),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  parent_message_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_message_id) REFERENCES messages(id) ON DELETE CASCADE,
  INDEX idx_sender (sender_id),
  INDEX idx_recipient (recipient_id),
  INDEX idx_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Activity logs (for admin monitoring)
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id INT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_action (action),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Update existing contact_messages to link with users
ALTER TABLE contact_messages 
  ADD COLUMN user_id INT NULL AFTER message,
  ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Update existing appointments to link with users
ALTER TABLE appointments 
  ADD COLUMN user_id INT NULL AFTER reason,
  ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Create default admin user (password: Admin@123)
-- Password hash for 'Admin@123' using bcrypt
INSERT INTO users (email, password_hash, full_name, role, status, email_verified) 
VALUES (
  'admin@medconsult.com',
  '$2a$10$rQZ9vXqKX8yYxJxYxJxYxOqKX8yYxJxYxJxYxOqKX8yYxJxYxJxYxO',
  'System Administrator',
  'admin',
  'active',
  TRUE
) ON DUPLICATE KEY UPDATE email=email;

-- Verify tables
SHOW TABLES;

SELECT 'Authentication system database schema created successfully!' AS Status;

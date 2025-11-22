-- Create payment_records table to track all payments
CREATE TABLE IF NOT EXISTS payment_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  payment_type ENUM('consultant', 'accountant', 'it_specialist', 'other_team') NOT NULL,
  recipient_id INT NULL COMMENT 'User ID if applicable',
  recipient_name VARCHAR(255) NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  period_start DATE NOT NULL COMMENT 'Start of earning period',
  period_end DATE NOT NULL COMMENT 'End of earning period',
  total_assignments INT DEFAULT 0 COMMENT 'Number of assignments in this period',
  payment_method VARCHAR(50) DEFAULT 'bank_transfer',
  payment_reference VARCHAR(255) NULL COMMENT 'Transaction reference',
  payment_date DATETIME NOT NULL,
  paid_by INT NOT NULL COMMENT 'User ID of accountant who made payment',
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_recipient (recipient_id),
  INDEX idx_payment_date (payment_date),
  INDEX idx_period (period_start, period_end),
  INDEX idx_payment_type (payment_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create consultant_payment_status table to track current payment status
CREATE TABLE IF NOT EXISTS consultant_payment_status (
  id INT PRIMARY KEY AUTO_INCREMENT,
  consultant_id INT NOT NULL,
  last_paid_date DATE NULL,
  last_paid_amount DECIMAL(10, 2) DEFAULT 0,
  unpaid_amount DECIMAL(10, 2) DEFAULT 0,
  total_paid_ytd DECIMAL(10, 2) DEFAULT 0 COMMENT 'Year to date',
  total_paid_lifetime DECIMAL(10, 2) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_consultant (consultant_id),
  FOREIGN KEY (consultant_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create team_payment_status table for team members
CREATE TABLE IF NOT EXISTS team_payment_status (
  id INT PRIMARY KEY AUTO_INCREMENT,
  member_type ENUM('accountant', 'it_specialist', 'other_team') NOT NULL,
  member_id INT NULL COMMENT 'User ID if specific person',
  member_name VARCHAR(255) NOT NULL,
  last_paid_date DATE NULL,
  last_paid_amount DECIMAL(10, 2) DEFAULT 0,
  unpaid_amount DECIMAL(10, 2) DEFAULT 0,
  total_paid_ytd DECIMAL(10, 2) DEFAULT 0,
  total_paid_lifetime DECIMAL(10, 2) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_member (member_type, member_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

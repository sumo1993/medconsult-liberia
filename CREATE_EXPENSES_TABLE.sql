-- Run this SQL script in your MySQL database to create the expenses table
-- You can run it using: mysql -u root -p medconsult_liberia < CREATE_EXPENSES_TABLE.sql

USE medconsult_liberia;

-- Create expenses table for tracking business expenses
CREATE TABLE IF NOT EXISTS expenses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  expense_date DATE NOT NULL,
  receipt_url VARCHAR(255),
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_by INT,
  approved_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_expense_date (expense_date),
  INDEX idx_status (status),
  INDEX idx_category (category)
);

SELECT 'Expenses table created successfully!' as message;

-- Create donation_inquiries table
USE medconsult_liberia;

CREATE TABLE IF NOT EXISTS donation_inquiries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  amount VARCHAR(100),
  message TEXT NOT NULL,
  status ENUM('pending', 'contacted', 'completed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

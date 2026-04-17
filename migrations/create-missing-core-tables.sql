USE medconsult_liberia;

CREATE TABLE IF NOT EXISTS site_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  setting_type VARCHAR(50) DEFAULT 'text',
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO site_settings (setting_key, setting_value, setting_type, description) VALUES
('whatsapp_number', '+231888293976', 'text', 'WhatsApp contact number'),
('whatsapp_link', 'https://wa.me/231888293976', 'url', 'WhatsApp direct link'),
('facebook_messenger_link', '', 'url', 'Facebook Messenger link'),
('facebook_messenger_enabled', 'false', 'boolean', 'Enable Facebook Messenger button')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

CREATE TABLE IF NOT EXISTS user_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  full_name VARCHAR(255),
  status VARCHAR(100),
  educational_level VARCHAR(255),
  university VARCHAR(255),
  date_of_birth DATE,
  bio TEXT,
  profile_photo LONGBLOB,
  profile_photo_type VARCHAR(100),
  specialization VARCHAR(255),
  years_of_experience INT,
  languages_spoken TEXT,
  research_interests TEXT,
  available_hours TEXT,
  certifications TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS doctor_about_me (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  about_text TEXT,
  photo LONGBLOB,
  photo_type VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_doctor_about_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS hero_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  url VARCHAR(500) NOT NULL,
  order_position INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_order_position (order_position),
  INDEX idx_is_active (is_active)
);

INSERT INTO hero_images (url, order_position, is_active)
SELECT 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', 1, TRUE
WHERE NOT EXISTS (SELECT 1 FROM hero_images);

CREATE TABLE IF NOT EXISTS statistics (
  id INT PRIMARY KEY,
  research_projects INT NOT NULL DEFAULT 0,
  clinic_setups INT NOT NULL DEFAULT 0,
  rating DECIMAL(3,2) NOT NULL DEFAULT 5.00,
  total_consultations INT NOT NULL DEFAULT 0,
  years_experience INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO statistics (id, research_projects, clinic_setups, rating, total_consultations, years_experience)
VALUES (1, 25, 15, 4.95, 500, 20)
ON DUPLICATE KEY UPDATE id = VALUES(id);


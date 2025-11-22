-- Create site_settings table for storing social media links and other site configurations
CREATE TABLE IF NOT EXISTS site_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type VARCHAR(50) DEFAULT 'text',
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default social media settings
INSERT INTO site_settings (setting_key, setting_value, setting_type, description) VALUES
('whatsapp_number', '+231888293976', 'text', 'WhatsApp contact number with country code'),
('whatsapp_link', 'https://wa.me/231888293976', 'url', 'WhatsApp chat link'),
('facebook_messenger_link', '', 'url', 'Facebook Messenger link (leave empty if not available)'),
('facebook_messenger_enabled', 'false', 'boolean', 'Enable/disable Facebook Messenger')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

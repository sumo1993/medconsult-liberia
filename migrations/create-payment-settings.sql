-- Create payment_settings table
USE medconsult_liberia;

CREATE TABLE IF NOT EXISTS payment_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  settings_json JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO payment_settings (settings_json) VALUES (
  JSON_OBJECT(
    'mobileMoneyEnabled', true,
    'orangeMoneyNumber', '',
    'orangeMoneyName', '',
    'mtnNumber', '+231 888 293976',
    'mtnName', '',
    'bankTransferEnabled', false,
    'bankName', '',
    'accountName', '',
    'accountNumber', '',
    'swiftCode', '',
    'branchName', '',
    'internationalEnabled', false,
    'paypalEmail', '',
    'wiseEmail', '',
    'westernUnionName', '',
    'organizationName', 'MedConsult Liberia'
  )
);

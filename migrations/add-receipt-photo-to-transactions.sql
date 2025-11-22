-- Add receipt_photo column to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS receipt_photo VARCHAR(255) NULL AFTER payment_status;

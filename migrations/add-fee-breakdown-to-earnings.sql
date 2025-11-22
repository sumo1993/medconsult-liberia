-- Add fee breakdown columns to consultant_earnings table
ALTER TABLE consultant_earnings 
ADD COLUMN IF NOT EXISTS website_fee DECIMAL(10, 2) DEFAULT 0 COMMENT '10% platform fee',
ADD COLUMN IF NOT EXISTS team_fee DECIMAL(10, 2) DEFAULT 0 COMMENT '15% team fee (accountant, IT, others)',
ADD COLUMN IF NOT EXISTS notes TEXT COMMENT 'Breakdown details';

-- Update commission_rate for existing records to 75%
UPDATE consultant_earnings 
SET commission_rate = 75 
WHERE commission_rate = 70;

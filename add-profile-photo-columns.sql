-- Add profile photo columns to users table
USE medconsult_liberia;

-- Add profile photo columns if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_photo LONGBLOB NULL,
ADD COLUMN IF NOT EXISTS profile_photo_filename VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS profile_photo_size INT NULL;

-- Add researcher-specific columns if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS specialization VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS years_of_experience INT NULL,
ADD COLUMN IF NOT EXISTS bio TEXT NULL,
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_ratings INT NULL DEFAULT 0;

SELECT 'Profile photo and researcher columns added successfully!' AS Status;

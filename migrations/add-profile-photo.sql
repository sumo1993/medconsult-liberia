-- Add profile_photo column to users table
USE medconsult_liberia;

ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo LONGBLOB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_filename VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_size INT;

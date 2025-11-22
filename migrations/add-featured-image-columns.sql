-- Migration: Add Featured Image Support to Research Posts
-- Date: November 19, 2025
-- Description: Adds columns for featured image storage and download tracking

USE medconsult_liberia;

-- Add featured image columns
ALTER TABLE research_posts 
ADD COLUMN IF NOT EXISTS featured_image LONGBLOB AFTER pdf_size,
ADD COLUMN IF NOT EXISTS featured_image_filename VARCHAR(255) AFTER featured_image,
ADD COLUMN IF NOT EXISTS featured_image_size INT AFTER featured_image_filename,
ADD COLUMN IF NOT EXISTS download_count INT DEFAULT 0 AFTER views;

-- Verify the columns were added
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'medconsult_liberia' 
AND TABLE_NAME = 'research_posts'
AND COLUMN_NAME IN ('featured_image', 'featured_image_filename', 'featured_image_size', 'download_count');

-- Success message
SELECT 'Migration completed successfully!' AS Status;

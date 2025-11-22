-- Add featured image support to research_posts table
-- Run this migration after the main setup

USE medconsult_liberia;

-- Add featured_image column to store image as LONGBLOB
ALTER TABLE research_posts 
ADD COLUMN featured_image LONGBLOB AFTER pdf_size,
ADD COLUMN featured_image_filename VARCHAR(255) AFTER featured_image,
ADD COLUMN featured_image_size INT AFTER featured_image_filename;

-- Add download_count column for analytics
ALTER TABLE research_posts
ADD COLUMN download_count INT DEFAULT 0 AFTER views;

-- Success message
SELECT 'Featured image and analytics columns added successfully!' AS Status;
